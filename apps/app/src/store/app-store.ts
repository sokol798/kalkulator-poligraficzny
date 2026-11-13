/**
 * Stan aplikacji (zustand + persist): bieżące obliczenie, biblioteka, historia, ustawienia.
 * Wyniki nie są przechowywane – zawsze wyliczane z wejścia (hook use-calculation).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { BUILTIN_FORMATS, BUILTIN_SHEETS, newId, type LibraryFormat, type LibrarySheet } from '@/lib/library-data';

export type Rounding = 'up' | 'ten';
export type Unit = 'mm' | 'cm';

export interface Settings {
  /** Spad domyślny, mm. */
  bleed: number;
  /** Marginesy domyślne dla własnych arkuszy, mm. */
  marginTop: number;
  marginSides: number;
  grammage: number;
  defaultSheetId: string;
  rounding: Rounding;
  /** Naddatek technologiczny (opcjonalny). */
  wasteEnabled: boolean;
  wastePercent: number;
  wasteMinSheets: number;
  /** Koszt papieru (opcjonalny), cena za arkusz. */
  priceEnabled: boolean;
  pricePerSheet: number;
  autoSave: boolean;
  unit: Unit;
}

export const DEFAULT_SETTINGS: Settings = {
  bleed: 3,
  marginTop: 10,
  marginSides: 5,
  grammage: 130,
  defaultSheetId: 'sh-b1',
  rounding: 'up',
  wasteEnabled: false,
  wastePercent: 5,
  wasteMinSheets: 0,
  priceEnabled: false,
  pricePerSheet: 0,
  autoSave: true,
  unit: 'mm',
};

export interface CustomSheet {
  width: number;
  height: number;
  marginTop: number;
  marginSides: number;
}

export interface CalcInputs {
  width: number;
  height: number;
  /** Id formatu (wbudowanego lub własnego), gdy wymiar pochodzi z listy. */
  formatId: string | null;
  bleed: number;
  quantity: number;
  sheetId: string;
  /** Arkusz wpisany ręcznie w arkuszu wyboru (ma pierwszeństwo przed sheetId). */
  customSheet: CustomSheet | null;
  grammage: number;
  /** Naddatek w % dla tego obliczenia (używany, gdy włączony w ustawieniach). */
  wastePercent: number;
  /** Cena za arkusz dla tego obliczenia (używana, gdy włączona w ustawieniach). */
  pricePerSheet: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  name: string;
  starred: boolean;
  inputs: CalcInputs;
  summary: { sheets: number; ups: number; sheetName: string; weightKg: number; formatName: string; cost: number | null };
}

interface AppState {
  inputs: CalcInputs;
  /** Id wpisu historii, który odpowiada bieżącemu obliczeniu (auto-zapis nadpisuje go). */
  currentEntryId: string | null;
  settings: Settings;
  formats: LibraryFormat[];
  sheets: LibrarySheet[];
  history: HistoryEntry[];

  setInput: <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => void;
  setSize: (width: number, height: number, formatId?: string | null) => void;
  applyFormat: (format: LibraryFormat) => void;
  applySheet: (sheetId: string) => void;
  applyCustomSheet: (sheet: CustomSheet) => void;
  newCalculation: () => void;
  loadInputs: (inputs: CalcInputs) => void;

  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  clearHistory: () => void;

  upsertFormat: (format: LibraryFormat) => void;
  removeFormat: (id: string) => void;
  upsertSheet: (sheet: LibrarySheet) => void;
  removeSheet: (id: string) => void;

  /** Zapisuje/aktualizuje wpis bieżącego obliczenia. Zwraca id wpisu. */
  saveCurrent: (summary: HistoryEntry['summary'], opts?: { star?: boolean; name?: string }) => string;
  toggleStar: (id: string) => void;
  renameEntry: (id: string, name: string) => void;
  removeEntry: (id: string) => void;
}

function inputsFromSettings(s: Settings): CalcInputs {
  return {
    width: 148,
    height: 210,
    formatId: 'f-a5',
    bleed: s.bleed,
    quantity: 1000,
    sheetId: s.defaultSheetId,
    customSheet: null,
    grammage: s.grammage,
    wastePercent: s.wastePercent,
    pricePerSheet: s.pricePerSheet,
  };
}

const HISTORY_LIMIT = 200;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      inputs: inputsFromSettings(DEFAULT_SETTINGS),
      currentEntryId: null,
      settings: DEFAULT_SETTINGS,
      formats: [],
      sheets: [],
      history: [],

      setInput: (key, value) => set((s) => ({ inputs: { ...s.inputs, [key]: value } })),
      setSize: (width, height, formatId = null) => set((s) => ({ inputs: { ...s.inputs, width, height, formatId } })),
      applyFormat: (f) =>
        set((s) => ({
          inputs: { ...s.inputs, width: f.width, height: f.height, formatId: f.id, bleed: f.bleed ?? s.settings.bleed },
        })),
      applySheet: (sheetId) => set((s) => ({ inputs: { ...s.inputs, sheetId, customSheet: null } })),
      applyCustomSheet: (customSheet) => set((s) => ({ inputs: { ...s.inputs, customSheet } })),
      newCalculation: () => set((s) => ({ inputs: inputsFromSettings(s.settings), currentEntryId: null })),
      loadInputs: (inputs) => set({ inputs: { ...inputs }, currentEntryId: null }),

      setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      clearHistory: () => set((s) => ({ history: s.history.filter((h) => h.starred), currentEntryId: null })),

      upsertFormat: (format) =>
        set((s) => ({ formats: s.formats.some((f) => f.id === format.id) ? s.formats.map((f) => (f.id === format.id ? format : f)) : [format, ...s.formats] })),
      removeFormat: (id) => set((s) => ({ formats: s.formats.filter((f) => f.id !== id) })),
      upsertSheet: (sheet) =>
        set((s) => ({ sheets: s.sheets.some((x) => x.id === sheet.id) ? s.sheets.map((x) => (x.id === sheet.id ? sheet : x)) : [sheet, ...s.sheets] })),
      removeSheet: (id) =>
        set((s) => ({
          sheets: s.sheets.filter((x) => x.id !== id),
          settings: s.settings.defaultSheetId === id ? { ...s.settings, defaultSheetId: DEFAULT_SETTINGS.defaultSheetId } : s.settings,
        })),

      saveCurrent: (summary, opts) => {
        const s = get();
        const existing = s.currentEntryId ? s.history.find((h) => h.id === s.currentEntryId) : undefined;
        const id = existing?.id ?? newId('h');
        const entry: HistoryEntry = {
          id,
          createdAt: existing?.createdAt ?? Date.now(),
          name: opts?.name ?? existing?.name ?? '',
          starred: opts?.star ?? existing?.starred ?? false,
          inputs: { ...s.inputs },
          summary,
        };
        const rest = s.history.filter((h) => h.id !== id);
        set({ history: [entry, ...rest].slice(0, HISTORY_LIMIT), currentEntryId: id });
        return id;
      },
      toggleStar: (id) => set((s) => ({ history: s.history.map((h) => (h.id === id ? { ...h, starred: !h.starred } : h)) })),
      renameEntry: (id, name) => set((s) => ({ history: s.history.map((h) => (h.id === id ? { ...h, name } : h)) })),
      removeEntry: (id) => set((s) => ({ history: s.history.filter((h) => h.id !== id), currentEntryId: s.currentEntryId === id ? null : s.currentEntryId })),
    }),
    {
      name: 'printcalc-v3',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ inputs: s.inputs, currentEntryId: s.currentEntryId, settings: s.settings, formats: s.formats, sheets: s.sheets, history: s.history }),
    },
  ),
);

/* ——— Selektory pomocnicze ——— */

export function useAllSheets(): LibrarySheet[] {
  const mine = useAppStore((s) => s.sheets);
  return [...mine, ...BUILTIN_SHEETS];
}

export function useAllFormats(): LibraryFormat[] {
  const mine = useAppStore((s) => s.formats);
  return [...mine, ...BUILTIN_FORMATS];
}

export function findSheet(id: string, mine: LibrarySheet[]): LibrarySheet | undefined {
  return mine.find((s) => s.id === id) ?? BUILTIN_SHEETS.find((s) => s.id === id);
}

export function findFormat(id: string | null, mine: LibraryFormat[]): LibraryFormat | undefined {
  if (!id) return undefined;
  return mine.find((f) => f.id === id) ?? BUILTIN_FORMATS.find((f) => f.id === id);
}
