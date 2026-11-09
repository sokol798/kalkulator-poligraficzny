import type { SheetFormat, Size } from './types';

/** Zaokrąglenie wymiarów serii ISO (szer. × wys.) – wartości wg ISO 216 / 217. */
const iso = (series: SheetFormat['series'], name: string, w: number, h: number): SheetFormat => ({
  id: `${series}-${name}`.toLowerCase(),
  label: name,
  size: { width: w, height: h },
  series,
});

/** Standardowe formaty arkuszy używane w poligrafii. */
export const SHEET_FORMATS: SheetFormat[] = [
  // Seria A (ISO 216)
  iso('A', 'A0', 841, 1189),
  iso('A', 'A1', 594, 841),
  iso('A', 'A2', 420, 594),
  iso('A', 'A3', 297, 420),
  iso('A', 'A4', 210, 297),
  iso('A', 'A5', 148, 210),
  iso('A', 'A6', 105, 148),
  iso('A', 'A7', 74, 105),
  // Seria B (ISO 216) – podstawowe formaty arkuszy drukowych
  iso('B', 'B0', 1000, 1414),
  iso('B', 'B1', 707, 1000),
  iso('B', 'B2', 500, 707),
  iso('B', 'B3', 353, 500),
  iso('B', 'B4', 250, 353),
  iso('B', 'B5', 176, 250),
  // Seria C (koperty)
  iso('C', 'C4', 229, 324),
  iso('C', 'C5', 162, 229),
  iso('C', 'C6', 114, 162),
  iso('C', 'DL', 110, 220),
  // RA / SRA (ISO 217) – surowe formaty z naddatkiem na spad
  iso('RA', 'RA0', 860, 1220),
  iso('RA', 'RA1', 610, 860),
  iso('RA', 'RA2', 430, 610),
  iso('RA', 'RA3', 305, 430),
  iso('SRA', 'SRA0', 900, 1280),
  iso('SRA', 'SRA1', 640, 900),
  iso('SRA', 'SRA2', 450, 640),
  iso('SRA', 'SRA3', 320, 450),
  iso('SRA', 'SRA3+', 330, 487),
  iso('SRA', 'SRA4', 225, 320),
  // Popularne formaty arkuszy drukowych (handlowe)
  iso('custom', '700×1000', 700, 1000),
  iso('custom', '720×1020', 720, 1020),
  iso('custom', '640×880', 640, 880),
  iso('custom', '610×860', 610, 860),
  iso('custom', '500×700', 500, 700),
  iso('custom', '480×650', 480, 650),
  iso('custom', '430×610', 430, 610),
  iso('custom', '350×500', 350, 500),
  iso('custom', '330×480', 330, 480),
  // US
  iso('US', 'Letter', 215.9, 279.4),
  iso('US', 'Legal', 215.9, 355.6),
  iso('US', 'Tabloid', 279.4, 431.8),
];

/** Typowe formaty użytków (gotowych produktów). */
export const PRODUCT_PRESETS: SheetFormat[] = [
  iso('custom', 'Wizytówka 90×50', 90, 50),
  iso('custom', 'Wizytówka 85×55', 85, 55),
  iso('A', 'A6 (ulotka)', 105, 148),
  iso('A', 'A5', 148, 210),
  iso('A', 'A4', 210, 297),
  iso('A', 'A3', 297, 420),
  iso('custom', 'DL 99×210', 99, 210),
  iso('custom', 'Kwadrat 148×148', 148, 148),
  iso('custom', 'Kwadrat 210×210', 210, 210),
  iso('custom', 'Pocztówka 100×150', 100, 150),
  iso('custom', 'Zakładka 50×200', 50, 200),
  iso('custom', 'Plakat B2', 500, 707),
];

export function findFormat(id: string): SheetFormat | undefined {
  return SHEET_FORMATS.find((f) => f.id === id) ?? PRODUCT_PRESETS.find((f) => f.id === id);
}

/** Zwraca kopię formatu z zamienionymi bokami (obrót o 90°). */
export function rotate(size: Size): Size {
  return { width: size.height, height: size.width };
}

/** Czy to ten sam wymiar niezależnie od orientacji. */
export function sameSize(a: Size, b: Size, tolerance = 0.01): boolean {
  const eq = (x: number, y: number) => Math.abs(x - y) <= tolerance;
  return (eq(a.width, b.width) && eq(a.height, b.height)) || (eq(a.width, b.height) && eq(a.height, b.width));
}

/** Znajdź nazwę formatu dla podanego wymiaru (np. 210×297 → "A4"), jeśli istnieje. */
export function matchFormatName(size: Size, tolerance = 0.6): string | null {
  const hit = SHEET_FORMATS.find((f) => sameSize(f.size, size, tolerance));
  return hit ? hit.label : null;
}

/** Ile arkuszy formatu `child` wychodzi z `parent` przez proste dzielenie (gilotyna, bez spadu). */
export function cutsFromParent(parent: Size, child: Size): number {
  const a = Math.floor(parent.width / child.width) * Math.floor(parent.height / child.height);
  const b = Math.floor(parent.width / child.height) * Math.floor(parent.height / child.width);
  return Math.max(a, b);
}
