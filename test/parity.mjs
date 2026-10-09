// Checks src/calc.js against the workbook's own cached results (LT Batch Calculator rows).
import { readFileSync } from 'node:fs';
import { computeCable } from '../src/calc.js';
import { DEFAULTS } from '../src/data.js';

const fx = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url)));
let bad = 0;
for (const row of fx) {
  const r = computeCable({ ...row.cfg, special: row.special }, DEFAULTS.master, DEFAULTS);
  const got = { OD: r.od, wCond: r.wCond, wIns: r.wIns, wInner: r.wInner, wOuter: r.wOuter, wArmour: r.wArmour, mat: r.mat,
    specialPct: r.specialPct, total1: r.scen.s1.total, total2: r.scen.s2.total, sell1: r.scen.s1.selling, sell2: r.scen.s2.selling };
  for (const [k, v] of Object.entries(row.expect)) {
    if (Math.abs(got[k] - v) > 1e-6 * Math.max(1, Math.abs(v))) { bad++; console.log('MISMATCH', row.label, k, got[k], v); }
  }
}
console.log(bad ? `${bad} mismatches` : `OK: ${fx.length} rows x 12 values match the workbook`);
process.exit(bad ? 1 : 0);
