import assert from 'node:assert/strict';
import { ctDefault, computeTower, merkel } from '../src/ctower/calc.js';
const d = ctDefault();
for (const c of d.list) { const r = computeTower(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.direct) < 1e-6 * r.direct);
  console.log(c.tag.padEnd(40), 'flow', Math.round(r.flow), 'm3/h  L/G', r.lg.toFixed(2), ' Me', r.me.toFixed(2), ' fill depth', r.depth.toFixed(2), ' plan', r.plan.toFixed(0), 'm2', ' cells', r.cells, ' fan kW', r.fanKw.toFixed(0), ' Rs/TR', Math.round(r.perTr), ' Rs L', (r.total / 1e5).toFixed(1)); }
// physics: tighter approach and higher wet bulb need more fill; Merkel falls with higher L/G
assert(merkel(33, 29, 25, 1.0) < merkel(33, 29, 25, 1.6));
const a = computeTower({ ...d.list[0], approach: 4 }, d.T), b = computeTower({ ...d.list[0], approach: 3 }, d.T); assert(b.fillM3 > a.fillM3 && b.total > a.total);
assert(computeTower({ ...d.list[0], approach: 2 }, d.T).error);
assert(computeTower({ ...d.list[0], kw: 7034 }, d.T).total > a.total * 1.6);
console.log('cooling tower calc OK');
