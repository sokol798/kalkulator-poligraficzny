/** Łączy stan wejściowy z silnikiem @printcalc/core. */
import { calculateImposition, calculatePaper, calculateSheets, round, type ImpositionInput, type ImpositionResult, type Size } from '@printcalc/core';
import { useMemo } from 'react';

import type { LibrarySheet } from '@/lib/library-data';
import { findFormat, findSheet, useAppStore, type CalcInputs, type Settings } from '@/store/app-store';

export interface ResolvedSheet {
  name: string;
  size: Size;
  gripper: number;
  margin: number;
  isCustom: boolean;
}

export interface Calculation {
  sheet: ResolvedSheet;
  formatName: string;
  imposition: ImpositionResult;
  ups: number;
  utilization: number; // 0–100
  sheets: number;
  /** Użytków na ostatnim (niepełnym) arkuszu. */
  lastSheetUps: number;
  sheetWeightG: number;
  totalWeightKg: number;
  pieceWeightG: number;
  runWeightKg: number;
  itemWithBleed: Size;
}

export function resolveSheet(inputs: CalcInputs, mySheets: LibrarySheet[]): ResolvedSheet {
  if (inputs.customSheet) {
    const c = inputs.customSheet;
    return { name: `${trim(c.width)} × ${trim(c.height)}`, size: { width: c.width, height: c.height }, gripper: c.gripper, margin: 5, isCustom: true };
  }
  const s = findSheet(inputs.sheetId, mySheets) ?? findSheet('sh-b2', [])!;
  return { name: s.name, size: { width: s.width, height: s.height }, gripper: s.gripper, margin: s.margin, isCustom: false };
}

export function buildImpositionInput(inputs: CalcInputs, sheet: ResolvedSheet): ImpositionInput {
  return {
    sheet: sheet.size,
    item: { width: inputs.width, height: inputs.height },
    bleed: inputs.bleed,
    gutter: 0,
    margins: { top: sheet.gripper, right: sheet.margin, bottom: sheet.margin, left: sheet.margin },
    allowMixed: inputs.orientation === 'auto',
    ...(inputs.orientation !== 'auto' ? { forceOrientation: inputs.orientation } : {}),
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
  const lastSheetUps = ups > 0 && net.netSheets > 0 ? inputs.quantity - (net.netSheets - 1) * ups : 0;
  const paper = calculatePaper({ sheet: sheet.size, grammage: inputs.grammage, sheets });
  const pieceWeightG = ((inputs.width * inputs.height) / 1_000_000) * inputs.grammage;
  return {
    sheet,
    formatName,
    imposition,
    ups,
    utilization: Math.round((imposition.best?.utilization ?? 0) * 100),
    sheets,
    lastSheetUps,
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
