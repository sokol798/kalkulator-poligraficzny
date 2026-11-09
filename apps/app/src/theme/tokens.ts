/**
 * Tokeny projektowe wg makiet „styl 8”: jasnoszare tło, białe karty, czarne pigułki, Inter.
 * Jedyne miejsce z kolorami, odstępami, promieniami i typografią.
 */
import { Platform } from 'react-native';

export const palette = {
  light: {
    bg: '#eceff2',
    surface: '#ffffff',
    field: '#eceff2',
    border: '#dbe0e5',
    ink: '#111111',
    muted: '#5c6670',
    onInk: '#ffffff',
    scrim: 'rgba(17,17,17,0.45)',
    danger: '#b42a18',
    previewSheet: '#eceff2',
    previewItem: '#ffffff',
    previewItemAlt: '#f7f8fa',
    previewLine: '#5c6670',
  },
  dark: {
    bg: '#141517',
    surface: '#1f2124',
    field: '#2a2d31',
    border: '#2e3137',
    ink: '#f2f2f0',
    muted: '#a0a4ab',
    onInk: '#141517',
    scrim: 'rgba(0,0,0,0.6)',
    danger: '#f06060',
    previewSheet: '#2a2d31',
    previewItem: '#3a3e44',
    previewItemAlt: '#454a51',
    previewLine: '#a0a4ab',
  },
} as const;

export type ThemeColors = (typeof palette)['light'] | (typeof palette)['dark'];
export type ColorToken = keyof (typeof palette)['light'];

export const spacing = { xs: 4, sm: 6, md: 10, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, sheet: 24, pill: 999 } as const;

export const fontFamily = Platform.select({ web: 'Inter, system-ui, -apple-system, sans-serif', default: 'Inter_500Medium' })!;
export const fontFamilySemibold = Platform.select({ web: 'Inter, system-ui, -apple-system, sans-serif', default: 'Inter_600SemiBold' })!;
export const fontFamilyRegular = Platform.select({ web: 'Inter, system-ui, -apple-system, sans-serif', default: 'Inter_400Regular' })!;

const w = (weight: '400' | '500' | '600') =>
  ({ fontWeight: weight, fontFamily: weight === '600' ? fontFamilySemibold : weight === '400' ? fontFamilyRegular : fontFamily }) as const;

export const typography = {
  screenTitle: { fontSize: 20, lineHeight: 26, ...w('600') },
  headerTitle: { fontSize: 16, lineHeight: 22, ...w('600') },
  body: { fontSize: 15, lineHeight: 20, ...w('500') },
  bodySemibold: { fontSize: 15, lineHeight: 20, ...w('600') },
  item: { fontSize: 16, lineHeight: 22, ...w('600') },
  label: { fontSize: 13, lineHeight: 18, ...w('500') },
  small: { fontSize: 12, lineHeight: 16, ...w('500') },
  section: { fontSize: 12, lineHeight: 16, ...w('600'), letterSpacing: 0.5, textTransform: 'uppercase' as const },
  value: { fontSize: 17, lineHeight: 22, ...w('600') },
  input: { fontSize: 20, lineHeight: 26, ...w('600') },
  hero: { fontSize: 60, lineHeight: 62, ...w('600'), letterSpacing: -2.4 },
  heroSmall: { fontSize: 48, lineHeight: 50, ...w('600'), letterSpacing: -1.9 },
  listNumber: { fontSize: 26, lineHeight: 30, ...w('600'), letterSpacing: -0.8 },
} as const;

export const layout = { maxContentWidth: 560, control: 44, controlSm: 36, pagePadding: 16 } as const;
