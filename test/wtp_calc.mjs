import { wtpDefault, computeWtp } from '../src/wtp/calc.js';
import assert from 'node:assert';
const d = wtpDefault();
d.list.forEach((c) => { const r = computeWtp(c, d.T); assert(!r.error, c.tag); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1); console.log(c.tag.padEnd(46), 'Rs Cr', (r.total / 1e7).toFixed(1), ' per unit Rs', Math.round(r.perUnit), ' kW', Math.round(r.kw), ' tank m3', Math.round(r.volume)); });
const a = computeWtp(d.list[1], d.T), b = computeWtp({ ...d.list[1], cap: 200 }, d.T); assert(b.total > a.total && b.total < 2 * a.total, 'economy of scale');
assert(computeWtp({ ...d.list[1], load: 1500 }, d.T).total > a.total); assert(computeWtp({ ...d.list[1], material: 'SS 316' }, d.T).total > a.total); assert(computeWtp({ ...d.list[1], standby: 'Yes' }, d.T).total > a.total);
console.log('wtp calc OK');
