/** Podsumowanie obliczenia zapisywane w historii. */
import type { Calculation } from '@/hooks/use-calculation';
import type { HistoryEntry, Settings } from '@/store/app-store';

export function summaryOf(c: Calculation, settings: Settings): HistoryEntry['summary'] {
  return { sheets: c.grossSheets, ups: c.ups, sheetName: c.sheet.name, weightKg: c.totalWeightKg, formatName: c.formatName, cost: c.cost, sheet: c.sheet, rounding: settings.rounding, wasteMinSheets: settings.wasteMinSheets };
}
