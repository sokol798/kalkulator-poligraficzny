/** Podsumowanie obliczenia zapisywane w historii. */
import type { Calculation } from '@/hooks/use-calculation';
import type { HistoryEntry } from '@/store/app-store';

export function summaryOf(c: Calculation): HistoryEntry['summary'] {
  return { sheets: c.grossSheets, ups: c.ups, sheetName: c.sheet.name, weightKg: c.totalWeightKg, formatName: c.formatName, cost: c.cost };
}
