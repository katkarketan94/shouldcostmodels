import assert from 'node:assert/strict';
import { reactorDefault, computeReactor, averageFactor, REACTOR_DEFAULTS } from '../src/reactor/calc.js';
const d = reactorDefault(), avg = averageFactor(d.list, d.T);
for (const c of d.list) {
  const r = computeReactor(c, d.T, avg); assert(!r.error, r.error);
  assert(Math.abs(r.A + r.B + r.C + r.D + r.D2 + r.E + r.F - r.eng) < 1e-6 * r.eng);
  console.log(c.tag.padEnd(40), 'eng Rs', (r.eng / 1e7).toFixed(2), 'Cr', 'cal', (r.cal / 1e7).toFixed(2), 'Cr  factor', r.factor.toFixed(2), ' ', (r.totalKg / 1000).toFixed(0), 't  loss', (r.totalLoss / 1000).toFixed(0), 'kW (limit', (r.limit / 1000).toFixed(0), ')', r.feasible ? 'feasible' : 'INFEASIBLE', ' N', r.N, 'd', r.dia.toFixed(2), 'H', r.H.toFixed(2), 'gap%', (r.gapFrac * 100).toFixed(0), 'J', r.J.toFixed(2), 'tank', r.tL.toFixed(1), r.tW.toFixed(1), r.tH.toFixed(1));
}
const first = computeReactor(d.list[0], d.T); assert(Math.abs(first.cal - 125e6) < 1, 'own price pins');
// behaviour
const big = computeReactor({ ...d.list[0], calib: 'None', mvar: 200 }, d.T), small = computeReactor({ ...d.list[0], calib: 'None', mvar: 100 }, d.T);
assert(big.eng > small.eng * 1.15);
const T2 = JSON.parse(JSON.stringify(d.T)); T2.prices.copper *= 2; assert(computeReactor({ ...d.list[0], calib: 'None' }, T2).eng > computeReactor({ ...d.list[0], calib: 'None' }, d.T).eng);
const tight = computeReactor({ ...d.list[0], calib: 'None', lossLimitPct: 0.0015 }, d.T), loose = computeReactor({ ...d.list[0], calib: 'None', lossLimitPct: 0.004 }, d.T); assert(tight.totalLoss <= loose.totalLoss + 1 && tight.eng >= loose.eng * 0.98);
console.log('reactor calc OK');
