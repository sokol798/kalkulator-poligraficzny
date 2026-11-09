/**
 * Stan kalkulatora (zustand + persist). Przechowuje wyłącznie dane wejściowe;
 * wyniki są wyliczane na bieżąco z @printcalc/core (hook use-calculation).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Orientation, Size } from '@printcalc/core';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Defaults {
  bleed: number;
  gutter: number;
  gripper: number;
  marginSide: number;
  marginBottom: number;
  wastePercent: number;
  wasteMinSheets: number;
  grammage: number;
  allowMixed: boolean;
}

export const FACTORY_DEFAULTS: Defaults = {
  bleed: 3,
  gutter: 0,
  gripper: 10,
  marginSide: 5,
  marginBottom: 5,
  wastePercent: 5,
  wasteMinSheets: 20,
  grammage: 130,
  allowMixed: true,
};

export interface CalculatorInputs {
  item: Size;
  itemPresetId: string | null;
  bleed: number;
  gutter: number;
  sheet: Size;
  sheetPresetId: string | null;
  gripper: number;
  marginSide: number;
  marginBottom: number;
  allowMixed: boolean;
  forceOrientation: Orientation | null;
  quantity: number;
  versions: number;
  grammage: number;
  pricePerKg: number;
  pricePerThousand: number;
  wastePercent: number;
  wasteMinSheets: number;
  parentPerSheet: number;
}

export interface BookletInputs {
  pages: number;
  pagesPerSheet: number;
  separateCover: boolean;
  grammage: number;
  bulk: number;
}

interface CalculatorState {
  inputs: CalculatorInputs;
  booklet: BookletInputs;
  defaults: Defaults;
  set: <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => void;
  setItem: (size: Size, presetId?: string | null) => void;
  setSheet: (size: Size, presetId?: string | null) => void;
  swapItem: () => void;
  swapSheet: () => void;
  setBooklet: <K extends keyof BookletInputs>(key: K, value: BookletInputs[K]) => void;
  setDefault: <K extends keyof Defaults>(key: K, value: Defaults[K]) => void;
  resetDefaults: () => void;
  newCalculation: () => void;
}

function inputsFromDefaults(d: Defaults): CalculatorInputs {
  return {
    item: { width: 210, height: 297 },
    itemPresetId: 'a-a4',
    bleed: d.bleed,
    gutter: d.gutter,
    sheet: { width: 707, height: 1000 },
    sheetPresetId: 'b-b1',
    gripper: d.gripper,
    marginSide: d.marginSide,
    marginBottom: d.marginBottom,
    allowMixed: d.allowMixed,
    forceOrientation: null,
    quantity: 1000,
    versions: 1,
    grammage: d.grammage,
    pricePerKg: 0,
    pricePerThousand: 0,
    wastePercent: d.wastePercent,
    wasteMinSheets: d.wasteMinSheets,
    parentPerSheet: 1,
  };
}

export const useCalculatorStore = create<CalculatorState>()(
  persist(
    (set, get) => ({
      inputs: inputsFromDefaults(FACTORY_DEFAULTS),
      booklet: { pages: 32, pagesPerSheet: 16, separateCover: true, grammage: 90, bulk: 1.2 },
      defaults: FACTORY_DEFAULTS,
      set: (key, value) => set((s) => ({ inputs: { ...s.inputs, [key]: value } })),
      setItem: (size, presetId = null) => set((s) => ({ inputs: { ...s.inputs, item: size, itemPresetId: presetId } })),
      setSheet: (size, presetId = null) => set((s) => ({ inputs: { ...s.inputs, sheet: size, sheetPresetId: presetId } })),
      swapItem: () =>
        set((s) => ({ inputs: { ...s.inputs, item: { width: s.inputs.item.height, height: s.inputs.item.width } } })),
      swapSheet: () =>
        set((s) => ({ inputs: { ...s.inputs, sheet: { width: s.inputs.sheet.height, height: s.inputs.sheet.width } } })),
      setBooklet: (key, value) => set((s) => ({ booklet: { ...s.booklet, [key]: value } })),
      setDefault: (key, value) => set((s) => ({ defaults: { ...s.defaults, [key]: value } })),
      resetDefaults: () => set({ defaults: FACTORY_DEFAULTS }),
      newCalculation: () => set({ inputs: inputsFromDefaults(get().defaults) }),
    }),
    {
      name: 'printcalc-state-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
