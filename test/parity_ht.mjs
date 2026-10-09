import { readFileSync } from 'node:fs';
import { computeHT } from '../src/calcHT.js';
import { DEFAULTS_HT as D } from '../src/data.js';
const fx = JSON.parse(readFileSync(new URL('./fixtures_ht.json', import.meta.url)));
let bad = 0;
for (const row of fx) {
  const r = computeHT({ ...row.cfg, special: row.special }, D.master, D);
  const got = { OD: r.od, wCond: r.wCond, wIns: r.wIns, wInner: r.wInner, wOuter: r.wOuter, wArmour: r.wArmour, mat: r.mat, specialPct: r.specialPct,
    total1: r.scen.s1.total, total2: r.scen.s2.total, sell1: r.scen.s1.selling, sell2: r.scen.s2.selling, metal: r.wMetal, condScr: r.wCondScr, insScr: r.wInsScr, copper: r.copperWeight };
  for (const [k, v] of Object.entries(row.expect)) if (Math.abs(got[k] - v) > 1e-6 * Math.max(1, Math.abs(v))) { bad++; console.log('MISMATCH', row.label, k, got[k], v); }
}
console.log(bad ? `${bad} HT mismatches` : `OK: ${fx.length} HT rows x 16 values match the workbook`);
process.exit(bad ? 1 : 0);
