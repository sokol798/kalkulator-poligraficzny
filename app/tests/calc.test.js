const assert = require('assert');
const Calc = require('../calc.js');

const A5 = { w: 148, h: 210 };
const B2 = { w: 500, h: 700, gripper: 10, margin: 0 };
const B1 = { w: 700, h: 1000, gripper: 12, margin: 0 };
const SRA3 = { w: 320, h: 450, gripper: 0, margin: 5 };
const A3d = { w: 297, h: 420, gripper: 0, margin: 5 };

const base = { format: A5, sheet: B2, bleed: 3, quantity: 1000, grammage: 130, orientation: 'auto', rounding: 'up' };

// Liczby z makiety ekranu głównego
let r = Calc.calculate(base);
assert.deepStrictEqual(r.layout.gross, { w: 154, h: 216 });
assert.strictEqual(r.layout.portrait.count, 9);
assert.strictEqual(r.layout.landscape.count, 8);
assert.strictEqual(r.perSheet, 9);
assert.strictEqual(r.sheets, 112);
assert.strictEqual(r.lastSheet, 1);
assert.strictEqual(Math.round(r.utilization * 100), 86);
assert.strictEqual(r.weight.sheet.toFixed(1), '45.5');
assert.strictEqual(r.weight.sheetsTotal.toFixed(0), '5096');
assert.strictEqual(r.weight.piece.toFixed(1), '4.0');
assert.strictEqual((r.weight.piecesTotal / 1000).toFixed(1), '4.0');

// Orientacja wymuszona
assert.strictEqual(Calc.calculate({ ...base, orientation: 'landscape' }).perSheet, 8);
assert.strictEqual(Calc.calculate({ ...base, orientation: 'portrait' }).perSheet, 9);

// Zaokrąglenie do 10
assert.strictEqual(Calc.calculate({ ...base, rounding: 'ten' }).sheets, 120);

// Inne arkusze z makiety wyboru arkusza
assert.strictEqual(Calc.calculate({ ...base, sheet: B1 }).perSheet, 18);
assert.strictEqual(Calc.calculate({ ...base, sheet: B1 }).sheets, 56);
assert.strictEqual(Calc.calculate({ ...base, sheet: SRA3 }).perSheet, 4);
assert.strictEqual(Calc.calculate({ ...base, sheet: SRA3 }).sheets, 250);
assert.strictEqual(Calc.calculate({ ...base, sheet: A3d }).perSheet, 2);
assert.strictEqual(Calc.calculate({ ...base, sheet: A3d }).sheets, 500);

// Przypadki brzegowe
r = Calc.calculate({ ...base, format: { w: 600, h: 800 } });
assert.strictEqual(r.perSheet, 0);
assert.strictEqual(r.sheets, 0);
r = Calc.calculate({ ...base, quantity: 0 });
assert.strictEqual(r.sheets, 0);
assert.strictEqual(r.lastSheet, 0);
r = Calc.calculate({ ...base, quantity: 9 });
assert.strictEqual(r.sheets, 1);
assert.strictEqual(r.lastSheet, 9);

// Nowy format z makiety: 150×150, spad 3 → na B2 12 użytków
assert.strictEqual(Calc.calculate({ ...base, format: { w: 150, h: 150 } }).perSheet, 12);

console.log('calc.test.js: wszystkie testy przeszły');
