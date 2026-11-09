import type { BookletInput, BookletResult, PaperInput, PaperResult, SheetsInput, SheetsResult } from './types';
import { areaM2, round } from './units';

/** Oblicza liczbę arkuszy potrzebnych do wydrukowania nakładu. */
export function calculateSheets(input: SheetsInput): SheetsResult {
  const ups = Math.max(0, Math.floor(input.ups));
  const versions = Math.max(1, Math.floor(input.versions ?? 1));
  const quantity = Math.max(0, input.quantity);
  if (ups === 0 || quantity === 0) {
    return { netSheets: 0, wasteSheets: 0, grossSheets: 0, producedQuantity: 0, overrun: 0, parentSheets: input.sheetsPerParentSheet ? 0 : null };
  }

  // Każda wersja zajmuje równy udział użytków na arkuszu (użytki łączone: "gang run").
  // Jeśli wersji jest więcej niż użytków, liczymy każdą wersję osobno.
  let netSheets: number;
  let producedPerSheet: number;
  if (versions <= ups) {
    const upsPerVersion = Math.floor(ups / versions);
    netSheets = Math.ceil(quantity / upsPerVersion);
    producedPerSheet = upsPerVersion; // egz. każdej wersji z jednego arkusza
  } else {
    netSheets = Math.ceil(quantity / ups) * versions;
    producedPerSheet = ups / versions;
  }

  const wasteByPercent = Math.ceil(netSheets * (Math.max(0, input.wastePercent) / 100));
  const wasteSheets = Math.max(wasteByPercent, Math.max(0, Math.floor(input.wasteMinSheets)));
  const grossSheets = netSheets + wasteSheets;
  const producedQuantity = Math.floor(netSheets * producedPerSheet);
  const overrun = Math.max(0, producedQuantity - quantity);
  const parentSheets =
    input.sheetsPerParentSheet && input.sheetsPerParentSheet > 0 ? Math.ceil(grossSheets / input.sheetsPerParentSheet) : null;

  return { netSheets, wasteSheets, grossSheets, producedQuantity, overrun, parentSheets };
}

/** Masa i koszt papieru. */
export function calculatePaper(input: PaperInput): PaperResult {
  const sheetAreaM2 = areaM2(input.sheet);
  const sheetWeightG = sheetAreaM2 * input.grammage;
  const totalWeightKg = (sheetWeightG * input.sheets) / 1000;
  const reamWeightKg = (sheetWeightG * 500) / 1000;
  let cost: number | null = null;
  if (input.pricePerKg != null && input.pricePerKg > 0) {
    cost = totalWeightKg * input.pricePerKg;
  } else if (input.pricePerThousand != null && input.pricePerThousand > 0) {
    cost = (input.sheets / 1000) * input.pricePerThousand;
  }
  return {
    sheetAreaM2: round(sheetAreaM2, 6),
    sheetWeightG: round(sheetWeightG, 3),
    totalWeightKg: round(totalWeightKg, 3),
    reamWeightKg: round(reamWeightKg, 3),
    cost: cost == null ? null : round(cost, 2),
  };
}

/** Składki broszury. */
export function calculateBooklet(input: BookletInput): BookletResult {
  const pages = Math.max(0, Math.floor(input.pages));
  const pps = Math.max(4, Math.floor(input.pagesPerSheet));
  const body = input.separateCover ? Math.max(0, pages - 4) : pages;
  const signatures = Math.ceil(body / pps);
  const paddedPages = signatures * pps + (input.separateCover ? 4 : 0);
  return {
    signatures,
    paddedPages,
    blankPages: Math.max(0, paddedPages - pages),
    isMultipleOf4: pages % 4 === 0,
  };
}

/** Grubość grzbietu (mm) dla papieru o podanej gramaturze – przybliżenie: wolumen (cm³/g) × gramatura × kartki. */
export function spineThickness(pages: number, grammage: number, bulk = 1.0): number {
  const leaves = Math.ceil(pages / 2);
  // grubość kartki [mm] = gramatura[g/m²] × wolumen[cm³/g] / 1000
  return round((leaves * grammage * bulk) / 1000, 2);
}
