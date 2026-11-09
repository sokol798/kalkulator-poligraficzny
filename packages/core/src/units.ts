/** Konwersje jednostek. Wewnętrznie wszystko w mm. */

export type LengthUnit = 'mm' | 'cm' | 'in' | 'pt';

const TO_MM: Record<LengthUnit, number> = {
  mm: 1,
  cm: 10,
  in: 25.4,
  pt: 25.4 / 72,
};

export function toMm(value: number, unit: LengthUnit): number {
  return value * TO_MM[unit];
}

export function fromMm(valueMm: number, unit: LengthUnit): number {
  return valueMm / TO_MM[unit];
}

/** Zaokrąglenie do `digits` miejsc po przecinku (bez błędów typu 0.1+0.2). */
export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Formatowanie wymiaru "210 × 297 mm". */
export function formatSize(size: { width: number; height: number }, unit: LengthUnit = 'mm', digits = 1): string {
  const w = round(fromMm(size.width, unit), digits);
  const h = round(fromMm(size.height, unit), digits);
  return `${trimZeros(w)} × ${trimZeros(h)} ${unit}`;
}

function trimZeros(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(/\.?0+$/, '');
}

/** Powierzchnia prostokąta w m² (wymiary w mm). */
export function areaM2(size: { width: number; height: number }): number {
  return (size.width * size.height) / 1_000_000;
}
