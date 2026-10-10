import assert from 'node:assert/strict';
import { chillerDefault, computeChiller, TYPES } from '../src/chiller/calc.js';
import { ductDefault, computeDuct } from '../src/duct/calc.js';
const ch = chillerDefault();
for (const c of ch.list) { const r = computeChiller(c, ch.T); assert(!r.error, r.error); console.log(c.tag.padEnd(34), 'Rs/TR', Math.round(r.perTr).toString().padStart(6), ' kg/TR', (r.weight / c.tr).toFixed(1), ' evap D/L', r.ev.D.toFixed(2), r.ev.L.toFixed(1), 'cond', r.cond.kind, ' A..E', [r.A, r.B, r.C].map((x) => Math.round(x / r.total * 100)).join('/')); assert(Math.abs(r.A + r.B + r.C + r.D + r.E - r.total) < 1e-6); }
// monotonic in capacity and in copper price
const a = computeChiller({ ...ch.list[0], tr: 200 }, ch.T), b = computeChiller({ ...ch.list[0], tr: 400 }, ch.T);
assert(b.total > a.total && b.perTr < a.perTr * 1.1);
const T2 = JSON.parse(JSON.stringify(ch.T)); T2.prices['Copper tube'] *= 2; assert(computeChiller(ch.list[0], T2).total > computeChiller(ch.list[0], ch.T).total);
assert(computeChiller({ ...ch.list[0], chwIn: 7 }, ch.T).error);
const du = ductDefault();
for (const c of du.list) { const r = computeDuct(c, du.T); assert(!r.error); console.log(c.tag.padEnd(28), 'Rs/m', Math.round(r.perM).toString().padStart(6), ' Rs/m2', Math.round(r.perM2), ' kg/m', (r.weight / c.run).toFixed(1), 'thk', r.thk); assert(Math.abs(r.A + r.B + r.C + r.D + r.E - r.total) < 1e-6); }
assert(computeDuct({ ...du.list[0], w: 1500 }, du.T).thk > computeDuct(du.list[0], du.T).thk);
console.log('chiller + duct calc OK');
