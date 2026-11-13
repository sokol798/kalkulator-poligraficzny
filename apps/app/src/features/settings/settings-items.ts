/** Definicje pozycji ustawień: każda pozycja listy otwiera własny ekran z opcjami. */
import { BLEED_OPTIONS, MARGIN_SIDES_OPTIONS, MARGIN_TOP_OPTIONS, QUICK_GRAMMAGES, WASTE_OPTIONS } from '@/lib/library-data';
import type { Settings } from '@/store/app-store';

export type SettingsItemKey = 'bleed' | 'margins' | 'rounding' | 'grammage' | 'waste' | 'price' | 'unit' | 'theme';

export interface ChoiceField {
  kind: 'choice';
  key: keyof Settings;
  title: string;
  hint?: string;
  options: { value: number | string | boolean; label: string }[];
  /** Pozwól wpisać własną liczbę. */
  custom?: { decimals: number; unit?: string; max?: number };
}
export interface ToggleField {
  kind: 'toggle';
  key: keyof Settings;
  title: string;
  hint?: string;
}
export interface NumberFieldDef {
  kind: 'number';
  key: keyof Settings;
  title: string;
  hint?: string;
  decimals: number;
  unit?: string;
  max?: number;
  /** Pokazuj tylko gdy inne pole (toggle) jest włączone. */
  showIf?: keyof Settings;
}
export type SettingsField = ChoiceField | ToggleField | NumberFieldDef;

export interface SettingsItemDef {
  key: SettingsItemKey;
  title: string;
  hint?: string;
  fields: SettingsField[];
}

const n = (v: number) => ({ value: v, label: String(v) });

export const SETTINGS_ITEMS: SettingsItemDef[] = [
  {
    key: 'bleed',
    title: 'Spady',
    hint: 'mm z każdej strony, dla nowych obliczeń',
    fields: [{ kind: 'choice', key: 'bleed', title: 'Spad domyślny', options: BLEED_OPTIONS.map(n), custom: { decimals: 1, unit: 'mm', max: 50 } }],
  },
  {
    key: 'margins',
    title: 'Marginesy',
    hint: 'górny (chwyt) i boczne, dla własnych arkuszy',
    fields: [
      { kind: 'choice', key: 'marginTop', title: 'Margines górny (chwyt maszyny)', options: MARGIN_TOP_OPTIONS.map(n), custom: { decimals: 1, unit: 'mm', max: 100 } },
      { kind: 'choice', key: 'marginSides', title: 'Marginesy boczne i dolny', options: MARGIN_SIDES_OPTIONS.map(n), custom: { decimals: 1, unit: 'mm', max: 100 } },
    ],
  },
  {
    key: 'rounding',
    title: 'Zaokrąglanie arkuszy',
    hint: '112 albo 120 (do pełnych 10)',
    fields: [
      {
        kind: 'choice',
        key: 'rounding',
        title: 'Liczbę arkuszy zaokrąglaj',
        options: [
          { value: 'up', label: 'W górę, do pełnego arkusza' },
          { value: 'ten', label: 'Do pełnych 10 arkuszy' },
        ],
      },
    ],
  },
  {
    key: 'grammage',
    title: 'Gramatura papieru',
    hint: 'g/m², do liczenia wagi',
    fields: [{ kind: 'choice', key: 'grammage', title: 'Gramatura domyślna', options: QUICK_GRAMMAGES.map(n), custom: { decimals: 0, unit: 'g/m²', max: 1000 } }],
  },
  {
    key: 'waste',
    title: 'Naddatek technologiczny',
    hint: 'domyślny naddatek dla nowych obliczeń; dolicza arkusze na rozruch i straty',
    fields: [
      { kind: 'choice', key: 'wastePercent', title: 'Naddatek domyślny (0 = brak)', options: WASTE_OPTIONS.map((v) => ({ value: v, label: `${v} %` })), custom: { decimals: 1, unit: '%', max: 100 } },
      { kind: 'number', key: 'wasteMinSheets', title: 'Minimum arkuszy naddatku', hint: 'gdy naddatek > 0: nie mniej niż tyle arkuszy', decimals: 0, unit: 'ark.' },
    ],
  },
  {
    key: 'price',
    title: 'Koszt papieru',
    hint: 'domyślna cena za arkusz dla nowych obliczeń (0 = nie licz)',
    fields: [{ kind: 'number', key: 'pricePerSheet', title: 'Domyślna cena za arkusz', decimals: 2, unit: 'zł' }],
  },
  {
    key: 'theme',
    title: 'Motyw',
    hint: 'wygląd aplikacji',
    fields: [
      {
        kind: 'choice',
        key: 'theme',
        title: 'Kolory',
        options: [
          { value: 'light', label: 'Biały' },
          { value: 'dark', label: 'Czarny' },
          { value: 'system', label: 'Automatyczny (jak w systemie)' },
        ],
      },
    ],
  },
  {
    key: 'unit',
    title: 'Jednostka wymiarów',
    fields: [
      {
        kind: 'choice',
        key: 'unit',
        title: 'Wymiary pokazuj w',
        options: [
          { value: 'mm', label: 'milimetrach (mm)' },
          { value: 'cm', label: 'centymetrach (cm)' },
        ],
      },
    ],
  },
];

export function findItem(key: string | undefined): SettingsItemDef | undefined {
  return SETTINGS_ITEMS.find((i) => i.key === key);
}
