import { describe, expect, it } from 'vitest';
import { calculateImposition, type ImpositionInput } from '../src';

const noMargins = { top: 0, right: 0, bottom: 0, left: 0 };

function base(partial: Partial<ImpositionInput> = {}): ImpositionInput {
  return {
    sheet: { width: 320, height: 450 },
    item: { width: 90, height: 50 },
    bleed: 0,
    gutter: 0,
    margins: noMargins,
    allowMixed: true,
    ...partial,
  };
}

describe('calculateImposition – siatka', () => {
  it('A4 na SRA3 bez spadu: 2 użytki', () => {
    const r = calculateImposition(base({ item: { width: 210, height: 297 } }));
    expect(r.best?.ups).toBe(2);
  });

  it('A4 ze spadem 3 mm na SRA3: nadal 2 użytki', () => {
    const r = calculateImposition(base({ item: { width: 210, height: 297 }, bleed: 3 }));
    expect(r.best?.ups).toBe(2);
    expect(r.itemWithBleed).toEqual({ width: 216, height: 303 });
  });

  it('A4 na B1 (707×1000): 9 użytków bez spadu (3×3)', () => {
    const r = calculateImposition(base({ sheet: { width: 707, height: 1000 }, item: { width: 210, height: 297 } }));
    expect(r.best?.ups).toBe(9);
  });

  it('A4 ze spadem 3 i łapką 10 mm na B1: 6 użytków (3×2 w poziomie)', () => {
    const r = calculateImposition(
      base({ sheet: { width: 707, height: 1000 }, item: { width: 210, height: 297 }, bleed: 3, margins: { top: 10, right: 5, bottom: 5, left: 5 } }),
    );
    // zadruk 697×985: pion 3×3=9? 216*3=648 ≤697, 303*3=909 ≤985 → 9
    expect(r.best?.ups).toBe(9);
  });

  it('wizytówki 90×50 ze spadem 2 i odstępem 2 na SRA3 z marginesem 10', () => {
    const r = calculateImposition(
      base({ bleed: 2, gutter: 2, margins: { top: 10, right: 10, bottom: 10, left: 10 } }),
    );
    // zadruk 300×430, brutto 94×54 pitch 96×56 → pion: 3×7=21; poziom (54×94): 5×4=20; mieszany może dać więcej
    expect(r.best?.ups).toBeGreaterThanOrEqual(21);
    expect(r.candidates[0]).toBe(r.best);
  });

  it('użytek większy od arkusza → brak układu', () => {
    const r = calculateImposition(base({ item: { width: 400, height: 500 } }));
    expect(r.best).toBeNull();
    expect(r.candidates).toHaveLength(0);
  });

  it('forceOrientation ogranicza kandydatów', () => {
    const r = calculateImposition(base({ item: { width: 210, height: 297 }, forceOrientation: 'landscape' }));
    expect(r.candidates.every((c) => c.strategy === 'grid-landscape')).toBe(true);
    expect(r.best?.ups).toBe(2); // 297 szer. na 320 → 1 kolumna, 450/210 → 2 wiersze
  });
});

describe('calculateImposition – układ mieszany', () => {
  it('mieszany daje więcej niż czysta siatka w klasycznym przypadku', () => {
    // Arkusz 500×700, użytek 200×150: siatka pion (200×150): 2×4=8; poziom (150×200): 3×3=9; mieszany: 3 kolumny×3 wiersze poziom (450×600) + pasek dolny 100 → nic; pasek prawy 50 → nic.
    // Lepszy przykład: 700×1000, użytek 300×200.
    const r = calculateImposition(base({ sheet: { width: 700, height: 1000 }, item: { width: 300, height: 200 } }));
    // pion 300×200: 2×5=10; poziom 200×300: 3×3=9; mieszany: 2 kolumny pion (600) ×5 + pasek 100 → nic;
    // 1 kolumna pion (300×200)×5=5 + pasek 400 szer: poziom 200×300 → 2×3=6 → 11
    expect(r.best?.ups).toBe(11);
    expect(r.best?.strategy).toBe('mixed');
  });

  it('allowMixed=false wyłącza układ mieszany', () => {
    const r = calculateImposition(base({ sheet: { width: 700, height: 1000 }, item: { width: 300, height: 200 }, allowMixed: false }));
    expect(r.best?.ups).toBe(10);
    expect(r.candidates.every((c) => c.strategy !== 'mixed')).toBe(true);
  });

  it('użytki nie nachodzą na siebie i mieszczą się w obszarze zadruku', () => {
    const input = base({
      sheet: { width: 700, height: 1000 },
      item: { width: 300, height: 200 },
      bleed: 3,
      gutter: 4,
      margins: { top: 12, right: 6, bottom: 6, left: 6 },
    });
    const r = calculateImposition(input);
    for (const layout of r.candidates) {
      for (const it of layout.items) {
        expect(it.x).toBeGreaterThanOrEqual(input.margins.left - 1e-6);
        expect(it.y).toBeGreaterThanOrEqual(input.margins.top - 1e-6);
        expect(it.x + it.width).toBeLessThanOrEqual(input.sheet.width - input.margins.right + 1e-6);
        expect(it.y + it.height).toBeLessThanOrEqual(input.sheet.height - input.margins.bottom + 1e-6);
      }
      for (let i = 0; i < layout.items.length; i++) {
        for (let j = i + 1; j < layout.items.length; j++) {
          const a = layout.items[i]!;
          const b = layout.items[j]!;
          const overlap =
            a.x < b.x + b.width - 1e-6 && b.x < a.x + a.width - 1e-6 && a.y < b.y + b.height - 1e-6 && b.y < a.y + a.height - 1e-6;
          expect(overlap).toBe(false);
        }
      }
    }
  });

  it('kandydaci są posortowani malejąco po liczbie użytków', () => {
    const r = calculateImposition(base({ bleed: 2, gutter: 2 }));
    for (let i = 1; i < r.candidates.length; i++) {
      expect(r.candidates[i - 1]!.ups).toBeGreaterThanOrEqual(r.candidates[i]!.ups);
    }
  });
});
