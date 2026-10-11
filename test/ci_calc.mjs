import assert from 'node:assert/strict';
import { ciDefault, computeCI } from '../src/cicable/calc.js';
const d = ciDefault();
for (const c of d.list) { const r = computeCI(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) + r.groups.Overheads + r.groups.Margin - r.totalKm) < 1e-6 * r.totalKm, 'lines sum');
  console.log(c.tag.padEnd(62), 'OD', r.D4.toFixed(1), 'mm', Math.round(r.kgKm), 'kg/km', ' Rs/m', r.total.toFixed(1)); }
const a = d.list[0], b = (o) => computeCI({ ...a, ...o }, d.T);
assert(b({ n: 12 }).total > b({ n: 7 }).total); assert(b({ size: 2.5 }).total > b({ size: 1.5 }).total); assert(b({ armour: 'None' }).total < b({}).total);
assert(b({ shield: 'Overall Al-Mylar' }).D4 > b({}).D4 - 1e-9); assert(b({ insul: 'LSZH', sheath: 'LSZH' }).total > b({}).total);
const k = computeCI({ ...a, family: 'tc', n: 2, tc: 'K extension (KX)' }, d.T), kc = computeCI({ ...a, family: 'tc', n: 2, tc: 'K compensating (KCA/KCB)' }, d.T); assert(k.total > kc.total, 'KX dearer than KC');
console.log('ci calc OK');
