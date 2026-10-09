// The input-mapping layer must reproduce the workbook's own base case (37,000 MT) when fed the same inputs.
import { readFileSync } from 'node:fs';
import { runWorkbook } from '../src/structural/costmap.js';
const wbk = JSON.parse(readFileSync(new URL('../src/structural/workbook.json', import.meta.url)));
const out = (a) => wbk.Output[a].c;
const r = runWorkbook({ payable: 37000, wastage: 0.03, wasteRecovery: 0.025, grade: { E250: 0.2, E350: 0.8 }, priceE250: 64785, priceE350: 64785,
  fab: { built: 0.8, plate: 0, hot: 0.2 }, weld: { low: 0.6, mod: 0.25, heavy: 0.15 }, paintArea: 32, dft: [30, 50, 50], coats: [1, 1, 1], paintRates: [135, 215, 350],
  adminPct: 0.02, mgmtPct: 0.02, lightMT: 5000, heavyMT: 0, distance: 500, margin: 0.05, boltPct: 0.03, boltPrice: 180, erection: 26000, contingency: 1000, shop: 'yard' });
const pairs = [['C14', r.raw], ['C15', r.machinery], ['C16', r.salaries], ['C17', r.overheads], ['C18', r.utilities], ['C19', r.consumables], ['C23', r.civil], ['C26', r.bolting], ['C28', r.transport], ['C32', r.erection], ['C35', r.cost], ['C40', r.selling], ['C43', r.profit]];
let bad = 0;
for (const [a, v] of pairs) if (Math.abs(v - out(a)) > 1e-6 * Math.abs(out(a))) { bad++; console.log('MISMATCH', a, v, out(a)); }
console.log(bad ? `${bad} mismatches` : `OK: base case reproduced through the mapping layer (selling price Rs ${(r.selling / 1e7).toFixed(2)} Cr, ${Math.round(r.perMT)} Rs/MT)`);
process.exit(bad ? 1 : 0);
