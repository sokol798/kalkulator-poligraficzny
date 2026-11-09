import {
  calculateImposition,
  calculatePaper,
  calculateSheets,
  type ImpositionInput,
  type ImpositionResult,
  type PaperResult,
  type SheetsResult,
} from '@printcalc/core';
import { useMemo } from 'react';

import { useCalculatorStore, type CalculatorInputs } from '@/store/calculator-store';

export interface Calculation {
  imposition: ImpositionResult;
  sheets: SheetsResult;
  paper: PaperResult;
  impositionInput: ImpositionInput;
}

export function buildImpositionInput(i: CalculatorInputs): ImpositionInput {
  return {
    sheet: i.sheet,
    item: i.item,
    bleed: i.bleed,
    gutter: i.gutter,
    margins: { top: i.gripper, right: i.marginSide, bottom: i.marginBottom, left: i.marginSide },
    allowMixed: i.allowMixed,
    ...(i.forceOrientation ? { forceOrientation: i.forceOrientation } : {}),
  };
}

export function useCalculation(): Calculation {
  const inputs = useCalculatorStore((s) => s.inputs);
  return useMemo(() => {
    const impositionInput = buildImpositionInput(inputs);
    const imposition = calculateImposition(impositionInput);
    const ups = imposition.best?.ups ?? 0;
    const sheets = calculateSheets({
      quantity: inputs.quantity,
      ups,
      versions: inputs.versions,
      wastePercent: inputs.wastePercent,
      wasteMinSheets: inputs.wasteMinSheets,
      sheetsPerParentSheet: inputs.parentPerSheet > 1 ? inputs.parentPerSheet : undefined,
    });
    const paper = calculatePaper({
      sheet: inputs.sheet,
      grammage: inputs.grammage,
      sheets: sheets.grossSheets,
      pricePerKg: inputs.pricePerKg || undefined,
      pricePerThousand: inputs.pricePerThousand || undefined,
    });
    return { imposition, sheets, paper, impositionInput };
  }, [inputs]);
}
