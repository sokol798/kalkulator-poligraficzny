/** Łączy stan wejściowy z silnikiem @printcalc/core. */
import { calculateImposition, calculatePaper, calculateSheets, round, type ImpositionInput, type ImpositionResult, type Size } from '@printcalc/core';
import { useMemo } from 'react';

import type { LibrarySheet } from '@/lib/library-data';
import { findFormat, findSheet, useAppStore, type CalcInputs, type Settings } from '@/store/app-store';

export interface ResolvedSheet {
  name: string;
  size: Size;
  marginTop: number;
  marginSides: number;
  isCustom: boolean;
}

export interface Calculation {
  sheet: ResolvedSheet;
  formatName: string;
  imposition: ImpositionResult;
  ups: number;
  utilization: number; // 0–100
  /** Arkuszy netto (po zaokrągleniu). */
  sheets: number;
  /** Naddatek w arkuszach (0, gdy wyłączony). */
  wasteSheets: number;
  /** Arkuszy do zakupu (netto + naddatek). */
  grossSheets: number;
  /** Użytków na ostatnim (niepełnym) arkuszu. */
  lastSheetUps: number;
  /** Zapełnienie ostatniego arkusza, 0–100. */
  lastSheetPercent: number;
  /** Koszt papieru (brutto × cena za arkusz) lub null, gdy wyłączony. */
  cost: number | null;
  sheetWeightG: number;
  totalWeightKg: number;
  pieceWeightG: number;
  runWeightKg: number;
  itemWithBleed: Size;
}

export function resolveSheet(inputs: CalcInputs, mySheets: LibrarySheet[]): ResolvedSheet {
  const top = (fromSheet: number) => (inputs.marginTop == null ? fromSheet : inputs.marginTop);
  if (inputs.customSheet) {
    const c = inputs.customSheet;
    return { name: `${trim(c.width)} × ${trim(c.height)}`, size: { width: c.width, height: c.height }, marginTop: top(c.marginTop), marginSides: c.marginSides, isCustom: true };
  }
  const s = findSheet(inputs.sheetId, mySheets) ?? findSheet('sh-b1', [])!;
  return { name: s.name, size: { width: s.width, height: s.height }, marginTop: top(s.marginTop), marginSides: s.marginSides, isCustom: false };
}

export function buildImpositionInput(inputs: CalcInputs, sheet: ResolvedSheet): ImpositionInput {
  return {
    sheet: sheet.size,
    item: { width: inputs.width, height: inputs.height },
    bleed: inputs.bleed,
    gutter: 0,
    margins: { top: sheet.marginTop, right: sheet.marginSides, bottom: sheet.marginSides, left: sheet.marginSides },
    // Zawsze wybieramy układ z największą liczbą użytków (najmniej arkuszy), w tym mieszany.
    allowMixed: true,
  };
}

export function roundSheets(n: number, rounding: Settings['rounding']): number {
  return rounding === 'ten' ? Math.ceil(n / 10) * 10 : n;
}

export function computeCalculation(inputs: CalcInputs, settings: Settings, mySheets: LibrarySheet[], formatName: string): Calculation {
  const sheet = resolveSheet(inputs, mySheets);
  const imposition = calculateImposition(buildImpositionInput(inputs, sheet));
  const ups = imposition.best?.ups ?? 0;
  const net = calculateSheets({ quantity: inputs.quantity, ups, wastePercent: 0, wasteMinSheets: 0 });
  const sheets = roundSheets(net.netSheets, settings.rounding);
  const wasteSheets = inputs.wastePercent > 0 && sheets > 0 ? Math.max(Math.ceil((sheets * inputs.wastePercent) / 100), Math.max(0, settings.wasteMinSheets)) : 0;
  const grossSheets = sheets + wasteSheets;
  const lastSheetUps = ups > 0 && net.netSheets > 0 ? inputs.quantity - (net.netSheets - 1) * ups : 0;
  const lastSheetPercent = ups > 0 ? Math.round((lastSheetUps / ups) * 100) : 0;
  const paper = calculatePaper({ sheet: sheet.size, grammage: inputs.grammage, sheets: grossSheets });
  const cost = inputs.pricePerSheet > 0 ? round(grossSheets * inputs.pricePerSheet, 2) : null;
  const pieceWeightG = ((inputs.width * inputs.height) / 1_000_000) * inputs.grammage;
  return {
    sheet,
    formatName,
    imposition,
    ups,
    utilization: Math.round((imposition.best?.utilization ?? 0) * 100),
    sheets,
    wasteSheets,
    grossSheets,
    lastSheetUps,
    lastSheetPercent,
    cost,
    sheetWeightG: paper.sheetWeightG,
    totalWeightKg: paper.totalWeightKg,
    pieceWeightG: round(pieceWeightG, 2),
    runWeightKg: round((pieceWeightG * inputs.quantity) / 1000, 2),
    itemWithBleed: imposition.itemWithBleed,
  };
}

/** Liczba użytków i arkuszy dla dowolnego arkusza przy bieżących wejściach (do listy wyboru arkusza). */
export function quickUps(inputs: CalcInputs, sheet: ResolvedSheet, rounding: Settings['rounding']): { ups: number; sheets: number } {
  const res = calculateImposition(buildImpositionInput(inputs, sheet));
  const ups = res.best?.ups ?? 0;
  const sheets = ups ? roundSheets(Math.ceil(inputs.quantity / ups), rounding) : 0;
  return { ups, sheets };
}

export function useCalculation(): Calculation {
  const inputs = useAppStore((s) => s.inputs);
  const settings = useAppStore((s) => s.settings);
  const mySheets = useAppStore((s) => s.sheets);
  const myFormats = useAppStore((s) => s.formats);
  return useMemo(() => {
    const f = findFormat(inputs.formatId, myFormats);
    const formatName = f?.name ?? `${trim(inputs.width)} × ${trim(inputs.height)}`;
    return computeCalculation(inputs, settings, mySheets, formatName);
  }, [inputs, settings, mySheets, myFormats]);
}

export function trim(n: number): string {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}
