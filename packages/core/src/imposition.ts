import type { ImpositionInput, ImpositionResult, Layout, Orientation, PlacedItem, Size } from './types';
import { round } from './units';

const EPS = 1e-6;

/** Wymiar użytku brutto (ze spadem) w podanej orientacji. */
function bruttoFor(item: Size, bleed: number, orientation: Orientation): Size {
  const w = item.width + 2 * bleed;
  const h = item.height + 2 * bleed;
  return orientation === 'portrait' ? { width: w, height: h } : { width: h, height: w };
}

/** Ile elementów o kroku `pitch` mieści się na odcinku `space`, gdy element ma wymiar `size` (ostatni bez odstępu). */
function fitCount(space: number, size: number, gutter: number): number {
  if (size <= 0 || space + EPS < size) return 0;
  return Math.floor((space + gutter + EPS) / (size + gutter));
}

interface Grid {
  x: number;
  y: number;
  cols: number;
  rows: number;
  cell: Size;
  gutter: number;
  orientation: Orientation;
}

function grid(x: number, y: number, cols: number, rows: number, cell: Size, gutter: number, orientation: Orientation): Grid {
  return { x, y, cols, rows, cell, gutter, orientation };
}

function placeGrids(grids: Grid[], limit: number): PlacedItem[] {
  const items: PlacedItem[] = [];
  for (const { x, y, cols, rows, cell, gutter, orientation } of grids) {
    for (let r = 0; r < rows && items.length < limit; r++) {
      for (let c = 0; c < cols && items.length < limit; c++) {
        items.push({ x: x + c * (cell.width + gutter), y: y + r * (cell.height + gutter), ...cell, orientation });
      }
    }
  }
  return items;
}

type Candidate = Layout & { grids: Grid[] };

function finalizeLayout(
  strategy: Layout['strategy'],
  grids: Grid[],
  columns: number,
  rows: number,
  printable: Size,
  itemNet: Size,
  originX: number,
  originY: number,
): Candidate {
  const ups = grids.reduce((sum, g) => sum + g.cols * g.rows, 0);
  let maxX = originX;
  let maxY = originY;
  for (const g of grids) {
    if (!g.cols || !g.rows) continue;
    maxX = Math.max(maxX, g.x + g.cols * (g.cell.width + g.gutter) - g.gutter);
    maxY = Math.max(maxY, g.y + g.rows * (g.cell.height + g.gutter) - g.gutter);
  }
  const usedArea: Size = { width: round(maxX - originX, 3), height: round(maxY - originY, 3) };
  const netArea = ups * itemNet.width * itemNet.height;
  const sheetArea = printable.width * printable.height;
  return {
    strategy,
    ups,
    columns,
    rows,
    items: [],
    grids,
    utilization: sheetArea > 0 ? round(netArea / sheetArea, 4) : 0,
    wasteArea: round(Math.max(0, sheetArea - netArea), 1),
    usedArea,
    leftover: {
      right: round(Math.max(0, printable.width - usedArea.width), 3),
      bottom: round(Math.max(0, printable.height - usedArea.height), 3),
    },
  };
}

/** Prosty układ siatkowy w jednej orientacji. */
function gridLayout(
  input: ImpositionInput,
  printable: Size,
  originX: number,
  originY: number,
  orientation: Orientation,
): Candidate {
  const cell = bruttoFor(input.item, input.bleed, orientation);
  const cols = fitCount(printable.width, cell.width, input.gutter);
  const rows = fitCount(printable.height, cell.height, input.gutter);
  const grids = [grid(originX, originY, cols, rows, cell, input.gutter, orientation)];
  return finalizeLayout(
    orientation === 'portrait' ? 'grid-portrait' : 'grid-landscape',
    grids,
    cols,
    rows,
    printable,
    input.item,
    originX,
    originY,
  );
}

/**
 * Układ mieszany (gilotynowy): główna siatka w orientacji A, a w pozostałym pasku
 * (prawym lub dolnym) użytki w orientacji B. Sprawdzamy wszystkie liczby kolumn/wierszy
 * głównej siatki, bo czasem opłaca się oddać jedną kolumnę, żeby zmieścić więcej w pasku.
 */
function mixedLayouts(input: ImpositionInput, printable: Size, originX: number, originY: number): Candidate[] {
  const g = input.gutter;
  const results: Candidate[] = [];
  const orientations: Orientation[] = ['portrait', 'landscape'];

  for (const main of orientations) {
    const other: Orientation = main === 'portrait' ? 'landscape' : 'portrait';
    const a = bruttoFor(input.item, input.bleed, main);
    const b = bruttoFor(input.item, input.bleed, other);
    const maxCols = fitCount(printable.width, a.width, g);
    const maxRows = fitCount(printable.height, a.height, g);
    if (maxCols === 0 || maxRows === 0) continue;

    // Wariant 1: pasek po prawej (pełna wysokość), główna siatka ma `cols` kolumn.
    for (let cols = 1; cols <= maxCols; cols++) {
      const usedW = cols * a.width + (cols - 1) * g;
      const stripW = printable.width - usedW - g;
      const sCols = fitCount(stripW, b.width, g);
      const sRows = fitCount(printable.height, b.height, g);
      if (sCols * sRows === 0) continue;
      const grids = [
        grid(originX, originY, cols, maxRows, a, g, main),
        grid(originX + usedW + g, originY, sCols, sRows, b, g, other),
      ];
      results.push(finalizeLayout('mixed', grids, cols + sCols, Math.max(maxRows, sRows), printable, input.item, originX, originY));
    }

    // Wariant 2: pasek na dole (pełna szerokość), główna siatka ma `rows` wierszy.
    for (let rows = 1; rows <= maxRows; rows++) {
      const usedH = rows * a.height + (rows - 1) * g;
      const stripH = printable.height - usedH - g;
      const sRows = fitCount(stripH, b.height, g);
      const sCols = fitCount(printable.width, b.width, g);
      if (sCols * sRows === 0) continue;
      const grids = [
        grid(originX, originY, maxCols, rows, a, g, main),
        grid(originX, originY + usedH + g, sCols, sRows, b, g, other),
      ];
      results.push(finalizeLayout('mixed', grids, Math.max(maxCols, sCols), rows + sRows, printable, input.item, originX, originY));
    }
  }
  return results;
}

/** Porównanie układów: więcej użytków > prostszy układ (siatka przed mieszanym) > mniejszy odpad. */
export function compareLayouts(x: Layout, y: Layout): number {
  if (y.ups !== x.ups) return y.ups - x.ups;
  const simple = (l: Layout) => (l.strategy === 'mixed' ? 1 : 0);
  if (simple(x) !== simple(y)) return simple(x) - simple(y);
  return y.utilization - x.utilization;
}

/** Główna funkcja: oblicza najlepsze ułożenie użytków na arkuszu. */
export function calculateImposition(input: ImpositionInput, previewLimit?: number): ImpositionResult {
  const m = input.margins;
  const printable: Size = {
    width: Math.max(0, input.sheet.width - m.left - m.right),
    height: Math.max(0, input.sheet.height - m.top - m.bottom),
  };
  const itemWithBleed = bruttoFor(input.item, input.bleed, 'portrait');
  const pitch: Size = { width: itemWithBleed.width + input.gutter, height: itemWithBleed.height + input.gutter };

  const positiveSize = (size: Size) =>
    [size.width, size.height].every((value) => Number.isFinite(value) && value >= 1 && value <= 10000);
  if (!positiveSize(input.item) || !positiveSize(input.sheet) ||
      ![input.bleed, input.gutter, m.left, m.right, m.top, m.bottom].every((value) => Number.isFinite(value) && value >= 0)) {
    return { input, printableArea: printable, itemWithBleed, pitch, best: null, candidates: [] };
  }
  const candidates: Candidate[] = [];
  const originX = m.left;
  const originY = m.top;

  const orientations: Orientation[] = input.forceOrientation ? [input.forceOrientation] : ['portrait', 'landscape'];
  for (const o of orientations) {
    const l = gridLayout(input, printable, originX, originY, o);
    if (l.ups > 0) candidates.push(l);
  }
  if (input.allowMixed && !input.forceOrientation) {
    for (const l of mixedLayouts(input, printable, originX, originY)) {
      if (l.ups > 0) candidates.push(l);
    }
  }

  // Usuwamy duplikaty (ten sam ups + strategia + utilization) i sortujemy.
  const seen = new Set<string>();
  const unique = candidates.filter((l) => {
    const key = `${l.strategy}:${l.ups}:${l.columns}x${l.rows}:${l.utilization}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort(compareLayouts);

  const layouts = unique.map(({ grids, ...layout }, index) => ({
    ...layout,
    items: placeGrids(grids, previewLimit === undefined ? layout.ups : index === 0 && layout.ups <= previewLimit ? previewLimit : 0),
  }));

  return {
    input,
    printableArea: printable,
    itemWithBleed,
    pitch,
    best: layouts[0] ?? null,
    candidates: layouts,
  };
}

/**
 * Szybka wersja: tylko liczba użytków (bez geometrii). Przydatna do porównywania wielu formatów arkusza.
 */
export function upsOnSheet(input: ImpositionInput): number {
  return calculateImposition(input, 0).best?.ups ?? 0;
}
