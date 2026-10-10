import assert from 'node:assert/strict';
import { runBatch, seedRows } from '../src/ahu/model.js';
import WB from '../src/ahu/workbook.json' with { type: 'json' };
for (const [kind, col, sheet] of [['ahu', 'Y', 'AHU Batch Calculator'], ['fcu', 'N', 'FCU Batch Calculator']]) {
  const rows = seedRows(kind), res = runBatch(kind, rows);
  assert(rows.length >= 6);
  rows.forEach((_, i) => { const exp = WB[sheet][col + (9 + i)].c; assert(Math.abs(res[i].total - exp) < 1e-6 * exp, `${kind} ${i}: ${res[i].total} vs ${exp}`); });
  // a changed input moves the answer; restoring it restores the answer
  const r2 = rows.map((x) => ({ ...x })); r2[0].cfm *= 2; assert(runBatch(kind, r2)[0].total > res[0].total * 1.5);
  assert.equal(runBatch(kind, rows)[0].total, res[0].total);
  console.log(kind, 'rows', rows.length, 'totals reproduce the workbook; first Rs', Math.round(res[0].total), 'Rs/CFM', res[0].perCfm.toFixed(1));
}
// price override flows through
const rows = seedRows('ahu'); const base = runBatch('ahu', rows)[0].total;
assert(runBatch('ahu', rows, { ahu: { price: { 'Copper tube': 2800 } } })[0].total > base);
// parts add up
const r = runBatch('ahu', rows)[0]; assert(Math.abs(r.A + r.B + r.C + r.D + r.E - r.total) < 1e-6);
console.log('AHU model wrapper OK');
