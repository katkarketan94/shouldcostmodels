import assert from 'node:assert/strict';
import { runXfmr, seedConfigs, layout, TYPES, refTables } from '../src/xfmr/model.js';
import POWER from '../src/xfmr/power.json' with { type: 'json' };
import DIST from '../src/xfmr/dist.json' with { type: 'json' };
import DRY from '../src/xfmr/dry.json' with { type: 'json' };
const D = { power: POWER, dist: DIST, dry: DRY };
for (const t of Object.keys(TYPES)) {
  const seeds = seedConfigs(t), res = runXfmr(t, seeds), L = layout(t);
  assert(seeds.length >= 1 && L.fieldsA.length > 15 && L.pricesB.length >= 6 && L.constsC.length > 40, t);
  // totals reproduce the workbook's cached Outputs
  res.forEach((r, i) => {
    assert(!r.error, `${t} ${i}: ${r.error}`);
    const cal = D[t].Outputs[`${'DEFGH'[i]}15`] ? D[t].Outputs[`${'DEFGH'[i]}15`].c : null, eng = D[t].Outputs[`${'DEFGH'[i]}11`].c;
    assert(Math.abs(r.eng - eng) < 1e-6 * eng, `${t} eng ${r.eng} vs ${eng}`);
    assert(Math.abs(r.A + r.B + r.C + r.D + r.D2 + r.E + r.F - r.eng) < 1e-6 * r.eng, `${t} stack`);
    assert(r.coreD > 0 && r.boxL > 0 && r.totalKg > 0, `${t} geometry`);
  });
  console.log(t.padEnd(6), 'configs', res.length, res.map((r) => `${(r.ratingKva / 1000).toFixed(r.ratingKva < 10000 ? 2 : 0)} MVA Rs ${(r.cal / 1e5).toFixed(1)} L (eng ${(r.eng / 1e5).toFixed(1)} L, ${(r.totalKg / 1000).toFixed(1)} t, ${r.solver})`).join(' | '));
}
// behaviour: a bigger rating costs more; aluminium changes the answer; a higher CRGO rate raises engineering cost; an override flows through
const t = 'dist', s = seedConfigs(t)[0], F = layout(t).fieldsA, rk = F.find((f) => /^Rating/.test(f.label)).row, cd = F.find((f) => /^Conductor/.test(f.label)).row;
const a = runXfmr(t, [s])[0], b = runXfmr(t, [{ ...s, [rk]: s[rk] * 2 }])[0], al = runXfmr(t, [{ ...s, [cd]: 'Aluminium' }])[0];
assert(b.eng > a.eng * 1.3 && al.eng !== a.eng);
const crgo = layout(t).pricesB.find((p) => /CRGO/.test(p.label)); assert(runXfmr(t, [s], { cells: { [`Calculator!D${crgo.row}`]: 190 } })[0].eng > a.eng);
assert(refTables('power').length >= 5);
// calibration: a reference price on the first config pins the calibrated price to it
const rp = F.find((f) => /^Reference price per unit/.test(f.label)).row, cb = F.find((f) => /^Calibration/.test(f.label)).row;
const pinned = runXfmr(t, [{ ...s, [rp]: 3000000, [cb]: 'Own PR/PO price' }])[0]; assert(Math.abs(pinned.cal - 3000000) < 1, String(pinned.cal));
console.log('transformer model OK');
