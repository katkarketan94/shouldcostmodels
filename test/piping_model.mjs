import assert from 'node:assert/strict';
import { runPipe, seedPipes, npsList, schedulesFor, dnList, dnClasses, MOC, defaultPipe, npsLabel } from '../src/piping/model.js';
import WB from '../src/piping/workbook.json' with { type: 'json' };
// the Summary sheet's valid rows reproduce through the single-sheet evaluation
let n = 0;
for (const p of seedPipes()) {
  const r = runPipe(p), row = [600, 700, 800, 850, 900, 1100, 1700, 1800].indexOf(p.od) + 4;
  if (p.od === 1800) { assert(!r.error && r.hi > 0); console.log('1800 mm × 10 mm (cached values in the workbook are placeholders):', r.hi.toFixed(0), r.lo.toFixed(0)); continue; }
  const S = WB.Summary, f = (c) => S[c + row].c;
  assert(Math.abs(r.hi - f('F')) < 1e-6 * f('F'), `${p.od} hi ${r.hi} vs ${f('F')}`); assert(Math.abs(r.lo - f('G')) < 1e-6 * f('G'));
  assert(Math.abs(r.kgHi - f('H')) < 1e-9 * 100); n++;
}
console.log('Summary register reproduced for', n, 'pipes');
// standard-size lists
const nps = npsList(); assert(nps.includes(12) && nps.includes(0.125) && nps.length >= 30);
assert(schedulesFor(12).length > 5); assert(schedulesFor(40).length === 0 || schedulesFor(40).every(([, w]) => w > 0));
assert(dnList().includes(300) && dnClasses(300).length >= 2);
// every material/grade/type combination prices without an error
let bad = [];
for (const [moc, m] of Object.entries(MOC)) for (const grade of m.grades) for (const type of ['Welded', 'Seamless']) {
  const p = moc === 'Ductile Iron' ? { ...defaultPipe(), moc, grade, type, nps: 300, sch: 'K9', std: 'Standard' } : { ...defaultPipe(), moc, grade, type };
  const r = runPipe(p); if (r.error) bad.push([moc, grade, type, r.error]); else assert(r.hi >= r.lo && r.kgHi > 0, `${moc} ${grade}`);
}
assert.equal(bad.length, 0, JSON.stringify(bad.slice(0, 3)));
// sanity: dearer metal costs more per kg; galvanising/coating add cost; a missing wall is reported
const ms = runPipe(defaultPipe()), ss = runPipe({ ...defaultPipe(), moc: 'Stainless steel', grade: 'ASTM A312 GRADE TP304' });
assert(ss.kgHi > ms.kgHi * 2);
assert(runPipe({ ...defaultPipe(), galv: 'Yes' }).hi > ms.hi);
assert(runPipe({ ...defaultPipe(), coat: '3 LPE', coatSurf: 'Inner+Outer coating' }).hi > ms.hi);
assert(runPipe({ ...defaultPipe(), nps: 40, sch: 'SCH 40' }).error);
const t1 = runPipe(defaultPipe(), { ass: { D55: 60 } }); assert(t1.hi > ms.hi);
console.log('piping model OK; 12 in SCH40 welded MS Rs', ms.hi.toFixed(0), '/m =', ms.kgHi.toFixed(1), 'Rs/kg; SS304', ss.kgHi.toFixed(0), 'Rs/kg', npsLabel(1.25));
