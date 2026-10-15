import { apcDefault, computeApc } from '../src/apc/calc.js';
import assert from 'node:assert';
const d = apcDefault();
d.list.forEach((c) => { const r = computeApc(c, d.T); assert(!r.error, c.tag); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1); console.log(c.tag.padEnd(46), r.size.padEnd(22), 'eta', (r.eta * 100).toFixed(3), 'Rs Cr', (r.total / 1e7).toFixed(0), c.type === 'fgd' ? `Rs lakh/MW ${(r.total / r.mwEq / 1e5).toFixed(1)} lime ${r.limeTh.toFixed(1)} t/h` : `SCA ${r.sca.toFixed(0)}`); });
const a = computeApc(d.list[0], d.T), b = computeApc({ ...d.list[0], outDust: 20 }, d.T); assert(b.total > a.total, 'tighter outlet costs more');
const f = computeApc(d.list[3], d.T), g = computeApc({ ...d.list[3], so2: 3200 }, d.T); assert(g.total > f.total);
assert(computeApc({ ...d.list[0], outDust: 1e6 }, d.T).error); assert(computeApc({ ...d.list[3], outSo2: 5000 }, d.T).error); console.log('apc calc OK');
