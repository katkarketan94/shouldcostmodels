import { accDefault, computeAcc, accCurve } from '../src/acc/calc.js';
import assert from 'node:assert';
const d = accDefault();
d.list.forEach((c) => { const r = computeAcc(c, d.T); assert(!r.error, c.tag); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1); console.log(c.tag.padEnd(48), 'Q MW', Math.round(r.Q), 'fans', r.fans, 'area 1e3 m2', Math.round(r.area / 1e3), 'duct m', r.dDuct.toFixed(1), 'Rs Cr', (r.total / 1e7).toFixed(0), 'fanMW', r.fanMw.toFixed(1)); });
const lo = computeAcc({ ...d.list[0], bp: 12 }, d.T), hi = computeAcc({ ...d.list[0], bp: 25 }, d.T); assert(lo.total > hi.total, 'lower back pressure costs more');
assert(computeAcc({ ...d.list[0], amb: 50 }, d.T).error, 'ITD guard');
assert(accCurve(d.list[0], d.T).length > 10); console.log('acc calc OK');
