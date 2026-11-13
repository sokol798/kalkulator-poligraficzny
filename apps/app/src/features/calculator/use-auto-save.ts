/** Auto-zapis bieżącego obliczenia do historii (debounce), gdy włączony w ustawieniach. */
import { useEffect, useRef } from 'react';

import type { Calculation } from '@/hooks/use-calculation';
import { useAppStore, type HistoryEntry } from '@/store/app-store';

export function summaryOf(c: Calculation): HistoryEntry['summary'] {
  return { sheets: c.grossSheets, ups: c.ups, sheetName: c.sheet.name, weightKg: c.totalWeightKg, formatName: c.formatName, cost: c.cost };
}

export function useAutoSave(calc: Calculation) {
  const autoSave = useAppStore((s) => s.settings.autoSave);
  const inputs = useAppStore((s) => s.inputs);
  const saveCurrent = useAppStore((s) => s.saveCurrent);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false; // nie zapisuj stanu odtworzonego z pamięci
      return;
    }
    if (!autoSave || calc.ups === 0 || inputs.quantity <= 0) return;
    const h = setTimeout(() => saveCurrent(summaryOf(calc)), 2000);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, autoSave]);
}
