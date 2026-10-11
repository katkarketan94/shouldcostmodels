import assert from 'node:assert/strict';
import { swgrDefault, computeSwgr } from '../src/swgr/calc.js';
const d = swgrDefault();
for (const c of d.list) { const r = computeSwgr(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) + r.groups.Overheads + r.groups.Margin - r.total) < 1e-6 * r.total);
  console.log(c.tag.padEnd(46), 'bays', r.nBays, 'steel', Math.round(r.steelTotal), 'kg  Rs L', (r.total / 1e5).toFixed(1), ' per bay Rs L', (r.perBay / 1e5).toFixed(2), r.warn.join(' | ')); }
const a = d.list[0], f = (o) => computeSwgr({ ...a, ...o }, d.T);
assert(f({ kv: 33 }).total > f({}).total); assert(f({ kA: 40 }).total > f({}).total); assert(f({ q: { ...a.q, fdr: 10 } }).total > f({}).total); assert(f({ arc: 'Yes' }).total > f({}).total);
const l = d.list[3], g = (o) => computeSwgr({ ...l, ...o }, d.T); assert(g({ form: 'Form 4b' }).total > g({ form: 'Form 2b' }).total); assert(g({ busMat: 'Copper' }).total > g({ busMat: 'Aluminium' }).total);
console.log('swgr calc OK');
