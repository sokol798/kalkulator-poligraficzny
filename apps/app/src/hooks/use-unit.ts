/** Jednostka wyświetlania (mm / cm). Wewnętrznie wszystko w mm. */
import { useAppStore } from '@/store/app-store';

export function useUnit() {
  const unit = useAppStore((s) => s.settings.unit);
  const factor = unit === 'cm' ? 10 : 1;
  const digits = unit === 'cm' ? 2 : 1;
  const toDisplay = (mm: number) => Math.round((mm / factor) * 10 ** digits) / 10 ** digits;
  const fromDisplay = (v: number) => v * factor;
  const fmt = (mm: number) => String(toDisplay(mm)).replace('.', ',');
  const fmtWithUnit = (mm: number) => `${fmt(mm)} ${unit}`;
  const fmtSize = (w: number, h: number, withUnit = true) => `${fmt(w)} × ${fmt(h)}${withUnit ? ` ${unit}` : ''}`;
  return { unit, digits, toDisplay, fromDisplay, fmt, fmtWithUnit, fmtSize };
}
