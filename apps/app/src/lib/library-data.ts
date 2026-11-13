/** Wbudowane arkusze i formaty widoczne w bibliotece i w arkuszach wyboru. */
import type { Size } from '@printcalc/core';

export type SheetGroup = 'offset' | 'digital';

export interface LibrarySheet {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Margines górny (pas chwytu maszyny), mm. */
  marginTop: number;
  /** Marginesy boczne i dolny, mm. */
  marginSides: number;
  group: SheetGroup;
  builtin?: boolean;
}

export interface LibraryFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Spad na stronę, mm. null = użyj domyślnego z ustawień. */
  bleed: number | null;
  builtin?: boolean;
  /** Grupa na liście wyboru. */
  group: 'A' | 'B' | 'other';
}

export const BUILTIN_SHEETS: LibrarySheet[] = [
  // Offset – arkusze pełnoformatowe i połówkowe używane w polskich drukarniach
  { id: 'sh-b1', name: 'B1', width: 700, height: 1000, marginTop: 12, marginSides: 5, group: 'offset', builtin: true },
  { id: 'sh-b2', name: 'B2', width: 500, height: 700, marginTop: 10, marginSides: 5, group: 'offset', builtin: true },
  { id: 'sh-b3', name: 'B3', width: 350, height: 500, marginTop: 8, marginSides: 5, group: 'offset', builtin: true },
  { id: 'sh-720x1020', name: '720 × 1020', width: 720, height: 1020, marginTop: 12, marginSides: 5, group: 'offset', builtin: true },
  { id: 'sh-640x900', name: '640 × 900', width: 640, height: 900, marginTop: 12, marginSides: 5, group: 'offset', builtin: true },
  // Cyfra – formaty maszyn arkuszowych do A3+
  { id: 'sh-sra3', name: 'SRA3', width: 320, height: 450, marginTop: 5, marginSides: 5, group: 'digital', builtin: true },
  { id: 'sh-sra3plus', name: 'SRA3+', width: 330, height: 487, marginTop: 5, marginSides: 5, group: 'digital', builtin: true },
  { id: 'sh-a3plus', name: 'A3+', width: 329, height: 483, marginTop: 5, marginSides: 5, group: 'digital', builtin: true },
  { id: 'sh-a3', name: 'A3', width: 297, height: 420, marginTop: 5, marginSides: 5, group: 'digital', builtin: true },
  { id: 'sh-a4', name: 'A4', width: 210, height: 297, marginTop: 5, marginSides: 5, group: 'digital', builtin: true },
];

export const BUILTIN_FORMATS: LibraryFormat[] = [
  { id: 'f-a3', name: 'A3', width: 297, height: 420, bleed: null, group: 'A', builtin: true },
  { id: 'f-a4', name: 'A4', width: 210, height: 297, bleed: null, group: 'A', builtin: true },
  { id: 'f-a5', name: 'A5', width: 148, height: 210, bleed: null, group: 'A', builtin: true },
  { id: 'f-a6', name: 'A6', width: 105, height: 148, bleed: null, group: 'A', builtin: true },
  { id: 'f-a7', name: 'A7', width: 74, height: 105, bleed: null, group: 'A', builtin: true },
  { id: 'f-b5', name: 'B5', width: 176, height: 250, bleed: null, group: 'B', builtin: true },
  { id: 'f-dl', name: 'DL', width: 99, height: 210, bleed: null, group: 'other', builtin: true },
  { id: 'f-wiz', name: 'Wizytówka', width: 90, height: 50, bleed: 2, group: 'other', builtin: true },
  { id: 'f-wiz85', name: 'Wizytówka 85 × 55', width: 85, height: 55, bleed: 2, group: 'other', builtin: true },
  { id: 'f-kw148', name: 'Kwadrat', width: 148, height: 148, bleed: null, group: 'other', builtin: true },
  { id: 'f-poczt', name: 'Pocztówka', width: 100, height: 150, bleed: null, group: 'other', builtin: true },
  { id: 'f-plakat-b2', name: 'Plakat B2', width: 500, height: 700, bleed: null, group: 'other', builtin: true },
  { id: 'f-plakat-a2', name: 'Plakat A2', width: 420, height: 594, bleed: null, group: 'other', builtin: true },
];

/** Szybkie chipy w kalkulatorze. */
export const QUICK_FORMAT_IDS = ['f-a5', 'f-a4', 'f-a6', 'f-dl'];
export const QUICK_SHEET_IDS = ['sh-b1', 'sh-b2'];
export const QUICK_GRAMMAGES = [80, 130, 170, 300];
export const BLEED_OPTIONS = [0, 2, 3, 5];
export const MARGIN_TOP_OPTIONS = [0, 8, 10, 12];
export const MARGIN_SIDES_OPTIONS = [0, 3, 5, 10];
export const WASTE_OPTIONS = [0, 3, 5, 10];
export const QUANTITY_MAX = 500_000;

export const sizeOf = (x: { width: number; height: number }): Size => ({ width: x.width, height: x.height });

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
