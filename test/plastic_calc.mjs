import assert from 'node:assert/strict';
import { plasticDefault, computePlastic, wallOf, FAMILIES } from '../src/piping/plastic.js';
const d = plasticDefault();
for (const c of d.list) { const r = computePlastic(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.parts.rm + r.parts.conversion + r.parts.testing + r.parts.margin + r.parts.interest + r.parts.transport - r.total) < 1e-6);
  console.log(c.tag.padEnd(24), 'wall', r.wall, 'mm  kg/m', r.wtM.toFixed(2), ' Rs/m', Math.round(r.total), ' Rs/kg', r.perKg.toFixed(0)); }
const h = computePlastic(d.list[0], d.T); assert(h.wall === 10 && h.total > 350 && h.total < 520, `HDPE 110 SDR11 Rs/m ${h.total}`);
assert(wallOf({ family: 'HDPE PE100', od: 110, rating: 11 }, d.T) === 10 && wallOf({ family: 'CPVC', od: 60.33, rating: 80 }, d.T) === 5.6);
const t = JSON.parse(JSON.stringify(d.T)); t.resin['HDPE PE100'] *= 1.2; assert(computePlastic(d.list[0], t).total > h.total * 1.12);
for (const [k, f] of Object.entries(FAMILIES)) for (const od of f.od) for (const [, r] of f.ratings) { const x = computePlastic({ family: k, od, rating: r, len: 1 }, d.T); assert(!x.error, `${k} ${od} ${r}: ${x.error}`); }
console.log('plastic calc OK');
