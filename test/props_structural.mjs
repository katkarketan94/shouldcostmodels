// Property checks on the workbook engine with varied inputs (no external oracle exists for varied inputs: LibreOffice cannot open this workbook in reasonable time).
import { runWorkbook } from '../src/structural/costmap.js';
const base = { payable: 1000, wastage: 0.05, wasteRecovery: 0.025, grade: { E250: 0.4, E350: 0.6 }, priceE250: 64785, priceE350: 64785, fab: { built: 0.5, plate: 0, hot: 0.5 }, weld: { low: 0.5, mod: 0.3, heavy: 0.2 },
  paintArea: 35, dft: [30, 50, 50], coats: [1, 1, 1], paintRates: [135, 215, 350], adminPct: 0.02, mgmtPct: 0.02, lightMT: 300, heavyMT: 700, distance: 300, margin: 0.05, boltPct: 0.03, boltPrice: 180, erection: 26000, contingency: 1000, shop: 'existing' };
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const a = runWorkbook(base), b = runWorkbook({ ...base, payable: 2000 });
ok(Math.abs(b.selling / a.selling - 2) < 0.005, `cost scales with tonnage in an existing shop (${(b.selling / a.selling).toFixed(4)})`);
ok(runWorkbook({ ...base, shop: 'yard' }).selling > a.selling * 1.1, 'project-yard set-up adds more than 10% on a 1,000 t order');
ok(runWorkbook({ ...base, distance: 900 }).transport > a.transport, 'transport rises with distance');
ok(runWorkbook({ ...base, fab: { built: 0, plate: 0, hot: 1 } }).machinery > runWorkbook({ ...base, fab: { built: 1, plate: 0, hot: 0 } }).machinery, 'the hot-roll bay (750 t/month) costs more machinery per tonne than the built-up bay (1,500 t/month)');
ok(runWorkbook({ ...base, fab: { built: 0, plate: 1, hot: 0 } }).machinery !== a.machinery, 'plate bay uses different machinery');
ok(Math.abs(runWorkbook({ ...base, margin: 0 }).selling - a.cost) < 1, 'zero margin => selling = cost');
ok(runWorkbook({ ...base, paintArea: 60 }).paintCons > a.paintCons, 'more paint area costs more');
ok(runWorkbook({ ...base, weld: { low: 0, mod: 0, heavy: 1 } }).weldCons > runWorkbook({ ...base, weld: { low: 1, mod: 0, heavy: 0 } }).weldCons, 'heavy welding uses more weld metal');
ok(Math.abs(a.selling - (a.raw + a.fabrication * 1.05)) < 1, 'selling = raw + fabrication x (1+margin)');
console.log(bad ? `${bad} property checks failed` : 'OK: engine property checks pass'); process.exit(bad ? 1 : 0);
