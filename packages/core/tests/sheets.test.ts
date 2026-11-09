import { describe, expect, it } from 'vitest';
import { calculateBooklet, calculatePaper, calculateSheets, compareSheetFormats, cutsFromParent, matchFormatName, spineThickness } from '../src';

describe('calculateSheets', () => {
  it('1000 egz. po 8 użytków, 5 % naddatku', () => {
    const r = calculateSheets({ quantity: 1000, ups: 8, wastePercent: 5, wasteMinSheets: 0 });
    expect(r.netSheets).toBe(125);
    expect(r.wasteSheets).toBe(7); // ceil(6.25)
    expect(r.grossSheets).toBe(132);
    expect(r.producedQuantity).toBe(1000);
    expect(r.overrun).toBe(0);
  });

  it('zaokrągla w górę i liczy nadprodukcję', () => {
    const r = calculateSheets({ quantity: 1001, ups: 8, wastePercent: 0, wasteMinSheets: 0 });
    expect(r.netSheets).toBe(126);
    expect(r.producedQuantity).toBe(1008);
    expect(r.overrun).toBe(7);
  });

  it('minimalny naddatek w arkuszach wygrywa z procentem', () => {
    const r = calculateSheets({ quantity: 100, ups: 10, wastePercent: 5, wasteMinSheets: 20 });
    expect(r.netSheets).toBe(10);
    expect(r.wasteSheets).toBe(20);
    expect(r.grossSheets).toBe(30);
  });

  it('kilka wersji na jednym arkuszu (gang run)', () => {
    // 4 wersje wizytówek po 500 szt., 21 użytków → 5 na wersję → 100 arkuszy
    const r = calculateSheets({ quantity: 500, ups: 21, versions: 4, wastePercent: 0, wasteMinSheets: 0 });
    expect(r.netSheets).toBe(100);
    expect(r.producedQuantity).toBe(500);
  });

  it('arkusze zakupowe', () => {
    const r = calculateSheets({ quantity: 1000, ups: 2, wastePercent: 0, wasteMinSheets: 0, sheetsPerParentSheet: 4 });
    expect(r.grossSheets).toBe(500);
    expect(r.parentSheets).toBe(125);
  });

  it('zero użytków → zera, bez dzielenia przez 0', () => {
    const r = calculateSheets({ quantity: 1000, ups: 0, wastePercent: 5, wasteMinSheets: 0 });
    expect(r.grossSheets).toBe(0);
  });
});

describe('calculatePaper', () => {
  it('B1 707×1000, 150 g, 1000 ark.', () => {
    const r = calculatePaper({ sheet: { width: 707, height: 1000 }, grammage: 150, sheets: 1000, pricePerKg: 5 });
    expect(r.sheetAreaM2).toBeCloseTo(0.707, 6);
    expect(r.sheetWeightG).toBeCloseTo(106.05, 2);
    expect(r.totalWeightKg).toBeCloseTo(106.05, 2);
    expect(r.reamWeightKg).toBeCloseTo(53.025, 3);
    expect(r.cost).toBeCloseTo(530.25, 2);
  });

  it('cena za 1000 arkuszy, gdy brak ceny za kg', () => {
    const r = calculatePaper({ sheet: { width: 320, height: 450 }, grammage: 300, sheets: 250, pricePerThousand: 400 });
    expect(r.cost).toBe(100);
  });

  it('A4 80 g waży ok. 5 g', () => {
    const r = calculatePaper({ sheet: { width: 210, height: 297 }, grammage: 80, sheets: 1 });
    expect(r.sheetWeightG).toBeCloseTo(4.99, 2);
  });
});

describe('calculateBooklet', () => {
  it('36 stron po 16 na składkę → 3 składki, 48 stron, 12 wakatów', () => {
    const r = calculateBooklet({ pages: 36, pagesPerSheet: 16, separateCover: false });
    expect(r.signatures).toBe(3);
    expect(r.paddedPages).toBe(48);
    expect(r.blankPages).toBe(12);
  });
  it('z osobną okładką', () => {
    const r = calculateBooklet({ pages: 36, pagesPerSheet: 16, separateCover: true });
    expect(r.signatures).toBe(2); // 32 strony środka
    expect(r.paddedPages).toBe(36);
    expect(r.blankPages).toBe(0);
  });
  it('spineThickness: 200 stron 80 g wolumen 1.3 → 10.4 mm', () => {
    expect(spineThickness(200, 80, 1.3)).toBe(10.4);
  });
});

describe('formats', () => {
  it('rozpoznaje A4 w obu orientacjach', () => {
    expect(matchFormatName({ width: 210, height: 297 })).toBe('A4');
    expect(matchFormatName({ width: 297, height: 210 })).toBe('A4');
    expect(matchFormatName({ width: 123, height: 456 })).toBeNull();
  });
  it('z B1 wychodzą 4 arkusze B3', () => {
    expect(cutsFromParent({ width: 707, height: 1000 }, { width: 353, height: 500 })).toBe(4);
  });
  it('compareSheetFormats zwraca posortowaną listę po zużyciu papieru', () => {
    const list = compareSheetFormats(
      { item: { width: 210, height: 297 }, bleed: 3, gutter: 0, margins: { top: 10, right: 5, bottom: 5, left: 5 }, allowMixed: true },
      1000,
      5,
    );
    expect(list.length).toBeGreaterThan(5);
    for (let i = 1; i < list.length; i++) expect(list[i - 1]!.paperAreaM2).toBeLessThanOrEqual(list[i]!.paperAreaM2);
  });
});
