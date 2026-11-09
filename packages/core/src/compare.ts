import { calculateImposition } from './imposition';
import { SHEET_FORMATS } from './formats';
import { calculateSheets } from './sheets';
import type { ImpositionInput, SheetFormat } from './types';

export interface FormatComparison {
  format: SheetFormat;
  ups: number;
  utilization: number;
  grossSheets: number;
  /** Zużycie papieru w m² (brutto) – obiektywna miara porównawcza. */
  paperAreaM2: number;
}

/**
 * Porównuje, który format arkusza daje najmniejsze zużycie papieru dla danego użytku i nakładu.
 * `base` to wejście impozycji bez pola `sheet` (zostanie podstawione dla każdego formatu).
 */
export function compareSheetFormats(
  base: Omit<ImpositionInput, 'sheet'>,
  quantity: number,
  wastePercent: number,
  formats: SheetFormat[] = SHEET_FORMATS.filter((f) => f.series !== 'C' && f.series !== 'US'),
): FormatComparison[] {
  const out: FormatComparison[] = [];
  for (const format of formats) {
    const res = calculateImposition({ ...base, sheet: format.size });
    const ups = res.best?.ups ?? 0;
    if (ups === 0) continue;
    const sheets = calculateSheets({ quantity, ups, wastePercent, wasteMinSheets: 0 });
    out.push({
      format,
      ups,
      utilization: res.best?.utilization ?? 0,
      grossSheets: sheets.grossSheets,
      paperAreaM2: Math.round(((format.size.width * format.size.height) / 1_000_000) * sheets.grossSheets * 100) / 100,
    });
  }
  return out.sort((a, b) => a.paperAreaM2 - b.paperAreaM2 || b.utilization - a.utilization);
}
