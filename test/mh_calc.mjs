import assert from 'node:assert/strict';
import { mhDefault, computeMH, sizeConveyor, MH_DEFAULTS } from '../src/mh/calc.js';
import { readFileSync } from 'node:fs';
const bbu = JSON.parse(readFileSync(new URL('../src/mh_bbu.json', import.meta.url)));
const d = mhDefault(), cr = (v) => (v / 1e7).toFixed(1);
for (const c of d.list) { const r = computeMH(c, d.T); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.direct) < 1e-6 * Math.max(1, r.direct));
  console.log(c.tag.padEnd(58), 'route', Math.round(r.route), 'm  supply Cr', cr(r.total), ' erection Cr', cr(r.erTotal), `(${(r.erPct * 100).toFixed(0)}%)`); }
const n = computeMH(d.list[0], d.T), bl = {}; bbu.forEach((x) => { bl[x.lot] = (bl[x.lot] || 0) + x.a; });
console.log('lot  model Cr  BBU Cr  ratio'); for (const k of Object.keys(bl).sort()) console.log(k, cr(n.lots[k] || 0).padStart(7), cr(bl[k]).padStart(7), ((n.lots[k] || 0) / bl[k]).toFixed(2));
console.log('HT kW', Math.round(n.htKw), 'LT kW', Math.round(n.ltKw), 'struct T', Math.round(n.structT), 'chute T', Math.round(n.chuteT), 'belt m', Math.round(n.beltM));
console.log(n.convs.map((x) => `${x.id}:${x.width}/${x.v}m/s/${x.useCord ? 'ST' : 'NN'}${x.rating}/${x.nDrive}x${x.kwEach}kW`).join('  '));
const s = sizeConveyor({ tph: 3300, len: 800, lift: 30, mat: 'Coal' }, d.T); assert(s.width >= 1800 && s.capacity >= 3300);
assert(sizeConveyor({ tph: 3300, len: 1600, lift: 30, mat: 'Coal' }, d.T).kwEach >= s.kwEach);
console.log('mh calc OK');
