import { TEMPLATES, defaultParams, takeoff } from '../src/structural/takeoff.js';
import { computeErection, ERECTION_DEFAULTS as R } from '../src/structural/erection.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const run = (id, p = {}, R2 = R) => { const t = takeoff(id, { ...defaultParams(id), ...p }); t.groups.forEach((g) => { g.kgModel = g.kg; }); const net = t.groups.reduce((a, g) => a + g.kg, 0); return computeErection(t, {}, R2, net, t.bolts); };
for (const id of Object.keys(TEMPLATES)) { const e = run(id); console.log(id.padEnd(7), Math.round(e.perT).toLocaleString('en-IN').padStart(8), '₹/t', e.crane, e.craneDays.toFixed(1) + ' crane-days', e.days.toFixed(0) + ' days', e.gangs + ' gang(s)', Math.round(e.bolts) + ' bolts', Math.round(e.weldKg) + ' kg weld'); }
ok(run('rack', { conn: 'welded' }).perT > run('rack', { conn: 'bolted' }).perT, 'welded site connections cost more than bolted');
ok(run('pipe', { joint: 'welded' }).perT > run('pipe', { joint: 'flanged' }).perT, 'site butt welding costs more than flanged joints');
ok(run('facade').perT > run('rack').perT, 'facade work at height costs more per tonne than a pipe rack');
const hi = { ...R, factor: 2 }; ok(Math.abs(run('peb', {}, hi).total / run('peb').total - 2) < 1e-9, 'productivity factor scales the total');
ok(run('peb', { crane: 50 }).total > run('peb', { crane: 0 }).total, 'a crane adds erection cost');
console.log(bad ? `${bad} failed` : 'OK: erection model checks pass'); process.exit(bad ? 1 : 0);
