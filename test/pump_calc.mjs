import assert from 'node:assert/strict';
import { pumpDefault, computePump, TYPES, MATERIALS, STD_KW } from '../src/pump/calc.js';
const d = pumpDefault();
for (const c of d.list) { const r = computePump(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.direct) < 1e-6 * r.direct);
  console.log(c.tag.padEnd(40), 'eta', r.eta.toFixed(2), 'shaft', r.shaft.toFixed(1), 'motor', r.motorKw, 'stages', r.stages, 'kg', Math.round(r.weight), 'Rs L', (r.total / 1e5).toFixed(2), r.warn.join(' | ')); }
const base = { type: 'OH1', flow: 100, head: 50, sg: 1, visc: 1, material: 'Cast iron', vfd: 'No', exproof: 'No' };
const a = computePump(base, d.T);
assert(computePump({ ...base, material: 'SS 316 (CF8M)' }, d.T).total > a.total * 1.2, 'stainless dearer');
assert(computePump({ ...base, head: 100 }, d.T).total > a.total, 'head raises cost');
assert(computePump({ ...base, visc: 200 }, d.T).shaft > a.shaft, 'viscosity raises power');
const f = computePump({ ...base, type: 'F_DIESEL', flow: 171, head: 85 }, d.T), e = computePump({ ...base, type: 'F_ELEC_SPLIT', flow: 171, head: 85 }, d.T);
assert(f.total > e.total, 'diesel fire set dearer than electric'); assert(e.motorKw >= e.p150, 'motor covers 150% flow power');
assert(STD_KW.includes(a.motorKw));
console.log('pump calc OK');
