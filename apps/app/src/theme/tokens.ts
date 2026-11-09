/**
 * Tokeny projektowe – jedyne miejsce, w którym definiujemy kolory, odstępy, typografię i promienie.
 * Warstwa wizualna (design) zmienia się tutaj; ekrany i komponenty używają wyłącznie tokenów.
 */
import { Platform } from 'react-native';

export const palette = {
  light: {
    bg: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F3',
    border: '#D9DDE3',
    borderStrong: '#B8BEC7',
    text: '#14181F',
    textMuted: '#5F6773',
    textFaint: '#8B939E',
    accent: '#1F5EFF',
    accentSoft: '#E3EBFF',
    onAccent: '#FFFFFF',
    success: '#1E8E4A',
    warning: '#B86E00',
    danger: '#C62828',
    /** Podgląd arkusza */
    previewSheet: '#FFFFFF',
    previewSheetBorder: '#9AA3AF',
    previewPrintable: '#F1F4F8',
    previewItem: '#1F5EFF',
    previewItemAlt: '#13A3A3',
    previewBleed: 'rgba(31,94,255,0.18)',
  },
  dark: {
    bg: '#0F1115',
    surface: '#171A20',
    surfaceAlt: '#1F232B',
    border: '#2B303A',
    borderStrong: '#3C4452',
    text: '#F2F4F7',
    textMuted: '#A3ABB7',
    textFaint: '#6F7886',
    accent: '#5B8CFF',
    accentSoft: '#1B2A4D',
    onAccent: '#0B1020',
    success: '#4CC070',
    warning: '#E0A030',
    danger: '#F06060',
    previewSheet: '#1F232B',
    previewSheetBorder: '#5B6472',
    previewPrintable: '#262B35',
    previewItem: '#5B8CFF',
    previewItemAlt: '#2FC4C4',
    previewBleed: 'rgba(91,140,255,0.25)',
  },
} as const;

export type ColorScheme = keyof typeof palette;
export type ThemeColors = (typeof palette)[ColorScheme];
export type ColorToken = keyof ThemeColors;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 14 } as const;

export const fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  web: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', mono: 'monospace' },
})!;

export const typography = {
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  section: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  value: { fontSize: 15, lineHeight: 22, fontWeight: '600' as const, fontFamily: fonts.mono },
  bigValue: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, fontFamily: fonts.mono },
} as const;

export const layout = { maxContentWidth: 960, controlHeight: 40 } as const;
