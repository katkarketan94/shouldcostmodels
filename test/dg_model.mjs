import assert from 'node:assert/strict';
import { runDG, seedSpec, purchaseOrders, referenceTables, rateLibrary, stdKva, benchmarkTable } from '../src/dg/model.js';
import WB from '../src/dg/workbook.json' with { type: 'json' };
const base = runDG(seedSpec());
assert(!base.error); assert(Math.abs(base.total - WB['Cost Build-up'].F91.c) < 1e-6 * base.total, `${base.total} vs ${WB['Cost Build-up'].F91.c}`);
const s = base.blocks.reduce((a, b) => a + b.total, 0); assert(Math.abs(s - base.direct) < 1e-6 * s);
for (const b of base.blocks) assert(Math.abs(b.lines.reduce((a, l) => a + l.amount, 0) - b.total) < 1e-6 * b.total + 1e-9, b.k);
console.log('base 320 kVA: Rs', Math.round(base.total), '=', Math.round(base.perKvaSite), 'Rs/kVA; std rating', base.std, 'engine kW', base.engineKw.toFixed(1));
// the 17 POs: recompute each at both stances and compare with the workbook's stored model results
let n = 0, near = 0;
for (const p of purchaseOrders()) {
  const spec = { ...seedSpec(), kva: p.kva, duty: 'Standby', norm: p.norm, engine: p.engine }; // the workbook ran every PO on a standby basis: the duty label tracks the vendor, not the machine
  const sh = runDG({ ...spec, stance: 'Should-cost target' }), mk = runDG({ ...spec, stance: 'Market price' });
  assert(!sh.error && !mk.error, p.n);
  n++; if (Math.abs(sh.perKvaSite / p.should - 1) < 0.005 && Math.abs(mk.perKvaSite / p.market - 1) < 0.005) near++;
  else console.log('PO', p.n, p.kva, p.duty, p.norm, p.engine, 'should', Math.round(sh.perKvaSite), 'vs', Math.round(p.should), '| market', Math.round(mk.perKvaSite), 'vs', Math.round(p.market));
}
console.log(`PO validation: ${near} of ${n} reproduce the workbook's stored model results within 0.5%`);
assert.equal(near, n);
// behaviours: prime needs more machine, IV+ costs more, derating raises rating, dealer margin on market stance only
assert(runDG({ ...seedSpec(), duty: 'Prime' }).std >= base.std); assert(runDG({ ...seedSpec(), norm: 'CPCB IV+' }).total > base.total * 1.1);
assert(runDG({ ...seedSpec(), temp: 56, alt: 1200 }).derate < 1); assert(runDG({ ...seedSpec(), stance: 'Market price' }).total > base.total);
assert(runDG({ ...seedSpec(), stance: 'Market price', channel: 'Dealer / integrator' }).total > runDG({ ...seedSpec(), stance: 'Market price', channel: 'OEM direct' }).total);
const t = runDG(seedSpec(), { cells: { 'Rate Library!D5': 100 } }); assert(t.total > base.total);
assert(referenceTables().length >= 18 && rateLibrary().length === 26 && stdKva().length > 30 && benchmarkTable().length > 30);
assert(runDG({ ...seedSpec(), kva: 10 }).error); // the workbook's standard-rating table starts at 15 kVA
for (const k of [15, 50, 250, 800, 2500, 3750]) assert(!runDG({ ...seedSpec(), kva: k }).error, String(k));
console.log('DG model OK');
