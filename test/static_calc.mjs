import assert from 'node:assert/strict';
import { stDefault, computeStatic, ST_DEFAULTS } from '../src/static/calc.js';
const d = stDefault(), cr = (v) => (v / 1e7).toFixed(2);
for (const c of d.list) { const r = computeStatic(c, d.T); assert(!r.error, r.error); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1e-6 * r.base);
  console.log(c.tag.padEnd(46), 'weight t', (r.weight / 1000).toFixed(1).padStart(7), ' total Cr', cr(r.total).padStart(7), ' RM share', (r.share['Raw material'] * 100).toFixed(0) + '%', 'conv', (r.share.Conversion * 100).toFixed(0) + '%'); }
// the reference cost sheet: surface condenser, 937 MT, Rs 21.46 Cr at the rates of the time (plate 60, SS 304 tube 288)
const T = JSON.parse(JSON.stringify(ST_DEFAULTS)); T.prices.plate = 60; const r = computeStatic(d.list[0], T);
console.log('reference condenser at 2018 plate rate: weight', Math.round(r.weight / 1000), 'MT, tubes', Math.round(r.tubeKg), 'kg, price Rs', cr(r.total), 'Cr (sheet 21.46); RM', cr(r.rm), '(12.96) conv', cr(r.conv), '(3.33)');
assert(Math.abs(r.weight / 1000 + 61.2 - 937.5) < 25, 'weight near the sheet (the sheet counts 61 t of bought-outs)'); assert(Math.abs(r.total / 1e7 - 21.46) < 1.6, 'price near the sheet');
const f = (o) => computeStatic({ ...d.list[1], ...o }, d.T).total; assert(f({ area: 1200 }) > f({})); assert(f({ pTube: 320 }) > f({})); assert(f({ tubeMat: 'Titanium Gr 2' }) > f({}));
console.log('static calc OK');
