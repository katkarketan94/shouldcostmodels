import assert from 'node:assert/strict';
import { waterDefault, computeWater, alarmDefault, computeAlarm, gasDefault, computeGas, pipeRate, diRate, NB } from '../src/fire/calc.js';
console.log('pipe rate check (bottom-up vs sample BOQ, Rs/m):');
for (const nb of [25, 32, 40, 50, 65, 80, 100, 150]) { const r = pipeRate(nb); console.log(' ', String(nb).padStart(3), 'mm', Math.round(r.rate).toString().padStart(5), 'vs', r.boq, ' ', ((r.rate / r.boq - 1) * 100).toFixed(0) + '%', ' kg/m', r.kgM.toFixed(1)); }
for (const dn of [80, 100, 150]) { const r = diRate(dn); console.log('  DI', dn, Math.round(r.rate), 'vs', r.boq); }
const w = waterDefault(); for (const c of w.list) { const r = computeWater(c, w.T); assert(!r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.total) < 1e-6);
  console.log(c.tag.padEnd(40), 'Rs Cr', (r.total / 1e7).toFixed(2), ' Rs/m2', Math.round(r.perM2), ' heads', r.heads, ' pipe m', Math.round(r.branchLen), ' pumps kW', r.kwSpr.toFixed(0), r.kwHyd.toFixed(0), ' tank m3', Math.round(r.tankM3)); }
const a = alarmDefault(); for (const c of a.list) { const r = computeAlarm(c, a.T); assert(!r.error); console.log(c.tag.padEnd(40), 'Rs Cr', (r.total / 1e7).toFixed(2), ' Rs/m2', Math.round(r.perM2), ' detectors', r.detectors, ' devices', r.devices, ' loops', r.loops, ' panels', r.panels); }
const g = gasDefault(); for (const c of g.list) { const r = computeGas(c, g.T); assert(!r.error); console.log(c.tag.padEnd(40), 'Rs L', (r.total / 1e5).toFixed(1), ' Rs/m3', Math.round(r.perM3), ' agent', Math.round(r.mass), 'kg/m3free', ' cyl', r.cyl, r.cylSize + 'L', ' nozzles', r.nozzles); }
// monotonic and sensitivity checks
const base = computeWater(w.list[1], w.T), big = computeWater({ ...w.list[1], area: 24000 }, w.T); assert(big.total > base.total * 1.15 && big.heads > base.heads * 1.9);
assert(computeWater({ ...w.list[1], hazard: 'Extra high 1' }, w.T).heads > base.heads * 2 && computeWater({ ...w.list[1], includePumps: 'No' }, w.T).total < base.total);
const T2 = JSON.parse(JSON.stringify(w.T)); T2.pipe.steelRate *= 1.5; assert(computeWater(w.list[1], T2).total > base.total);
assert(computeGas({ ...g.list[0], volume: 1800 }, g.T).mass > computeGas(g.list[0], g.T).mass * 1.9);
console.log('fire calc OK');
