/** Wbudowane arkusze i formaty widoczne w bibliotece i w arkuszach wyboru. */
import type { Size } from '@printcalc/core';

export type SheetGroup = 'offset' | 'digital';

export interface LibrarySheet {
  id: string;
  name: string;
  width: number;
  height: number;
  /** Chwyt maszyny (góra), mm. */
  gripper: number;
  /** Margines z pozostałych stron, mm. */
  margin: number;
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
  { id: 'sh-b2', name: 'B2', width: 500, height: 700, gripper: 10, margin: 5, group: 'offset', builtin: true },
  { id: 'sh-b1', name: 'B1', width: 700, height: 1000, gripper: 12, margin: 5, group: 'offset', builtin: true },
  { id: 'sh-a2plus', name: 'A2+', width: 450, height: 640, gripper: 10, margin: 5, group: 'offset', builtin: true },
  { id: 'sh-b3', name: 'B3', width: 350, height: 500, gripper: 8, margin: 5, group: 'offset', builtin: true },
  { id: 'sh-640x900', name: '640 × 900', width: 640, height: 900, gripper: 12, margin: 5, group: 'offset', builtin: true },
  { id: 'sh-sra3', name: 'SRA3', width: 320, height: 450, gripper: 0, margin: 5, group: 'digital', builtin: true },
  { id: 'sh-sra3plus', name: 'SRA3+', width: 330, height: 488, gripper: 0, margin: 5, group: 'digital', builtin: true },
  { id: 'sh-a3', name: 'A3', width: 297, height: 420, gripper: 0, margin: 5, group: 'digital', builtin: true },
];

export const BUILTIN_FORMATS: LibraryFormat[] = [
  { id: 'f-a3', name: 'A3', width: 297, height: 420, bleed: null, group: 'A', builtin: true },
  { id: 'f-a4', name: 'A4', width: 210, height: 297, bleed: null, group: 'A', builtin: true },
  { id: 'f-a5', name: 'A5', width: 148, height: 210, bleed: null, group: 'A', builtin: true },
  { id: 'f-a6', name: 'A6', width: 105, height: 148, bleed: null, group: 'A', builtin: true },
  { id: 'f-a7', name: 'A7', width: 74, height: 105, bleed: null, group: 'A', builtin: true },
  { id: 'f-b4', name: 'B4', width: 250, height: 353, bleed: null, group: 'B', builtin: true },
  { id: 'f-b5', name: 'B5', width: 176, height: 250, bleed: null, group: 'B', builtin: true },
  { id: 'f-dl', name: 'DL', width: 99, height: 210, bleed: null, group: 'other', builtin: true },
  { id: 'f-wiz', name: 'Wizytówka', width: 90, height: 50, bleed: 2, group: 'other', builtin: true },
  { id: 'f-wiz85', name: 'Wizytówka 85 × 55', width: 85, height: 55, bleed: 2, group: 'other', builtin: true },
  { id: 'f-kw148', name: 'Kwadrat', width: 148, height: 148, bleed: null, group: 'other', builtin: true },
  { id: 'f-poczt', name: 'Pocztówka', width: 100, height: 150, bleed: null, group: 'other', builtin: true },
  { id: 'f-plakat', name: 'Plakat', width: 500, height: 700, bleed: null, group: 'other', builtin: true },
];

/** Szybkie chipy w kalkulatorze. */
export const QUICK_FORMAT_IDS = ['f-a5', 'f-a4', 'f-a6', 'f-dl'];
export const QUICK_SHEET_IDS = ['sh-b2', 'sh-b1'];
export const QUICK_GRAMMAGES = [80, 130, 170, 300];
export const BLEED_OPTIONS = [0, 2, 3, 5];
export const GRIPPER_OPTIONS = [0, 8, 10, 12];

export const sizeOf = (x: { width: number; height: number }): Size => ({ width: x.width, height: x.height });

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
