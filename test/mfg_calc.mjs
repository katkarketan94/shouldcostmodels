import assert from 'node:assert/strict';
import { ductDefault, computeDuct } from '../src/duct/calc.js';
const du = ductDefault();
for (const c of du.list) { const r = computeDuct(c, du.T); assert(!r.error); console.log(c.tag.padEnd(28), 'Rs/m', Math.round(r.perM).toString().padStart(6), ' Rs/m2', Math.round(r.perM2), ' kg/m', (r.weight / c.run).toFixed(1), 'thk', r.thk); assert(Math.abs(r.A + r.B + r.C + r.D + r.E - r.total) < 1e-6); }
assert(computeDuct({ ...du.list[0], w: 1500 }, du.T).thk > computeDuct(du.list[0], du.T).thk);
console.log('duct calc OK');
