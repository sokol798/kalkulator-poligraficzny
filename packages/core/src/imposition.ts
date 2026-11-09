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

function placeGrid(
  originX: number,
  originY: number,
  cols: number,
  rows: number,
  cell: Size,
  gutter: number,
  orientation: Orientation,
): PlacedItem[] {
  const items: PlacedItem[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push({
        x: originX + c * (cell.width + gutter),
        y: originY + r * (cell.height + gutter),
        width: cell.width,
        height: cell.height,
        orientation,
      });
    }
  }
  return items;
}

function finalizeLayout(
  strategy: Layout['strategy'],
  items: PlacedItem[],
  columns: number,
  rows: number,
  printable: Size,
  itemNet: Size,
  originX: number,
  originY: number,
): Layout {
  const ups = items.length;
  let maxX = originX;
  let maxY = originY;
  for (const it of items) {
    maxX = Math.max(maxX, it.x + it.width);
    maxY = Math.max(maxY, it.y + it.height);
  }
  const usedArea: Size = { width: round(maxX - originX, 3), height: round(maxY - originY, 3) };
  const netArea = ups * itemNet.width * itemNet.height;
  const sheetArea = printable.width * printable.height;
  return {
    strategy,
    ups,
    columns,
    rows,
    items,
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
): Layout {
  const cell = bruttoFor(input.item, input.bleed, orientation);
  const cols = fitCount(printable.width, cell.width, input.gutter);
  const rows = fitCount(printable.height, cell.height, input.gutter);
  const items = placeGrid(originX, originY, cols, rows, cell, input.gutter, orientation);
  return finalizeLayout(
    orientation === 'portrait' ? 'grid-portrait' : 'grid-landscape',
    items,
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
function mixedLayouts(input: ImpositionInput, printable: Size, originX: number, originY: number): Layout[] {
  const g = input.gutter;
  const results: Layout[] = [];
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
      const items = [
        ...placeGrid(originX, originY, cols, maxRows, a, g, main),
        ...placeGrid(originX + usedW + g, originY, sCols, sRows, b, g, other),
      ];
      results.push(finalizeLayout('mixed', items, cols + sCols, Math.max(maxRows, sRows), printable, input.item, originX, originY));
    }

    // Wariant 2: pasek na dole (pełna szerokość), główna siatka ma `rows` wierszy.
    for (let rows = 1; rows <= maxRows; rows++) {
      const usedH = rows * a.height + (rows - 1) * g;
      const stripH = printable.height - usedH - g;
      const sRows = fitCount(stripH, b.height, g);
      const sCols = fitCount(printable.width, b.width, g);
      if (sCols * sRows === 0) continue;
      const items = [
        ...placeGrid(originX, originY, maxCols, rows, a, g, main),
        ...placeGrid(originX, originY + usedH + g, sCols, sRows, b, g, other),
      ];
      results.push(finalizeLayout('mixed', items, Math.max(maxCols, sCols), rows + sRows, printable, input.item, originX, originY));
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
export function calculateImposition(input: ImpositionInput): ImpositionResult {
  const m = input.margins;
  const printable: Size = {
    width: Math.max(0, input.sheet.width - m.left - m.right),
    height: Math.max(0, input.sheet.height - m.top - m.bottom),
  };
  const itemWithBleed = bruttoFor(input.item, input.bleed, 'portrait');
  const pitch: Size = { width: itemWithBleed.width + input.gutter, height: itemWithBleed.height + input.gutter };

  const candidates: Layout[] = [];
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

  return {
    input,
    printableArea: printable,
    itemWithBleed,
    pitch,
    best: unique[0] ?? null,
    candidates: unique,
  };
}

/**
 * Szybka wersja: tylko liczba użytków (bez geometrii). Przydatna do porównywania wielu formatów arkusza.
 */
export function upsOnSheet(input: ImpositionInput): number {
  return calculateImposition(input).best?.ups ?? 0;
}
