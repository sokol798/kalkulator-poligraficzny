/* Logika obliczeń kalkulatora poligraficznego.
   Czysty moduł: bez DOM, bez localStorage. Działa w przeglądarce i w Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Calc = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Wymiar brutto użytku: format netto + spad z każdej strony. */
  function gross(format, bleed) {
    const b = Math.max(0, Number(bleed) || 0);
    return { w: format.w + 2 * b, h: format.h + 2 * b };
  }

  /** Pole arkusza dostępne do zadruku: po odjęciu chwytu (jedna krawędź) i marginesu (każda krawędź). */
  function usable(sheet) {
    const m = Math.max(0, Number(sheet.margin) || 0);
    const g = Math.max(0, Number(sheet.gripper) || 0);
    return { w: Math.max(0, sheet.w - 2 * m), h: Math.max(0, sheet.h - g - 2 * m) };
  }

  /** Ile użytków o wymiarze (gw × gh) zmieści się w polu (uw × uh) bez obracania. */
  function fit(uw, uh, gw, gh) {
    if (gw <= 0 || gh <= 0) return { cols: 0, rows: 0, count: 0 };
    const cols = Math.floor(uw / gw + 1e-9);
    const rows = Math.floor(uh / gh + 1e-9);
    return { cols, rows, count: cols * rows };
  }

  /**
   * Układ użytków na arkuszu.
   * orientation: 'auto' | 'portrait' | 'landscape'
   *  - portrait: użytek jak podano (szerokość wzdłuż szerokości arkusza)
   *  - landscape: użytek obrócony o 90°
   */
  function layout(format, sheet, bleed, orientation) {
    const g = gross(format, bleed);
    const u = usable(sheet);
    const portrait = Object.assign({ orientation: 'portrait', w: g.w, h: g.h }, fit(u.w, u.h, g.w, g.h));
    const landscape = Object.assign({ orientation: 'landscape', w: g.h, h: g.w }, fit(u.w, u.h, g.h, g.w));
    let chosen;
    if (orientation === 'portrait') chosen = portrait;
    else if (orientation === 'landscape') chosen = landscape;
    else chosen = landscape.count > portrait.count ? landscape : portrait;
    return { gross: g, usable: u, portrait, landscape, chosen };
  }

  /** Zaokrąglenie liczby arkuszy: 'up' = w górę do pełnego, 'ten' = w górę do pełnych 10. */
  function roundSheets(n, mode) {
    if (mode === 'ten') return Math.ceil(n / 10) * 10;
    return Math.ceil(n);
  }

  /**
   * Pełne obliczenie.
   * input = { format:{w,h}, sheet:{w,h,gripper,margin}, bleed, quantity, grammage, orientation, rounding }
   */
  function calculate(input) {
    const quantity = Math.max(0, Math.floor(Number(input.quantity) || 0));
    const grammage = Math.max(0, Number(input.grammage) || 0);
    const lay = layout(input.format, input.sheet, input.bleed, input.orientation || 'auto');
    const perSheet = lay.chosen.count;

    const exact = perSheet > 0 ? quantity / perSheet : 0;
    const sheets = perSheet > 0 ? roundSheets(exact, input.rounding || 'up') : 0;
    const lastSheet = perSheet > 0 && quantity > 0 ? (quantity % perSheet || perSheet) : 0;

    const sheetArea = input.sheet.w * input.sheet.h; // mm²
    const grossArea = lay.gross.w * lay.gross.h;
    const utilization = sheetArea > 0 ? (perSheet * grossArea) / sheetArea : 0;

    // Waga: g/m² × m²
    const sheetWeight = grammage * sheetArea / 1e6; // g
    const pieceWeight = grammage * (input.format.w * input.format.h) / 1e6; // g (netto)
    return {
      quantity, grammage, perSheet, sheets, exact, lastSheet, utilization,
      layout: lay,
      weight: {
        sheet: sheetWeight,
        sheetsTotal: sheetWeight * sheets,
        piece: pieceWeight,
        piecesTotal: pieceWeight * quantity,
      },
    };
  }

  /** Wiele arkuszy naraz: do listy wyboru arkusza (użytki i arkusze dla każdego). */
  function compareSheets(input, sheets) {
    return sheets.map(function (s) {
      const r = calculate(Object.assign({}, input, { sheet: s }));
      return { sheet: s, perSheet: r.perSheet, sheets: r.sheets, utilization: r.utilization };
    });
  }

  return { gross, usable, fit, layout, roundSheets, calculate, compareSheets };
});
