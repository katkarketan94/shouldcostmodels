import assert from 'node:assert/strict';
import { bfpDefault, computeBfp } from '../src/bfp/calc.js';
const d = bfpDefault();
for (const c of d.list) { const r = computeBfp(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1e-6 * r.base);
  console.log(c.tag.padEnd(52), 'shaft kW', Math.round(r.P), 'eta', r.eta.toFixed(2), 'stages', r.stages, 'driver', r.driverKw, ' Rs Cr', (r.total / 1e7).toFixed(1), ' Rs/kW', Math.round(r.perKw)); }
const f = (o) => computeBfp({ ...d.list[0], ...o }, d.T).total;
assert(f({ head: 2600 }) > f({})); assert(f({ flow: 1700 }) > f({})); assert(f({ drive: 'motor' }) !== f({})); assert(f({ booster: 'No' }) < f({}));
const t = computeBfp(d.list[0], d.T), m = computeBfp({ ...d.list[0], drive: 'motor' }, d.T); console.log('turbine vs motor drive', (t.total / 1e7).toFixed(1), (m.total / 1e7).toFixed(1));
console.log('bfp calc OK');
