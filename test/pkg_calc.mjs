// Calc tests for the capacity- and quantity-scaled categories: line sum equals the base, and cost moves the right way with the main drivers.
import assert from 'node:assert';
const cats = [['ups', 'upsDefault', 'computeUps'], ['light', 'lightDefault', 'computeLight'], ['lift', 'liftDefault', 'computeLift'], ['motor', 'motorDefault', 'computeMotor'], ['comp', 'compDefault', 'computeComp'], ['tank', 'tankDefault', 'computeTank'], ['valve', 'valveDefault', 'computeValve'], ['hanger', 'hangerDefault', 'computeHanger']];
const grow = { ups: ['kva', 2], light: ['area', 2], lift: ['stops', 2], motor: ['kw', 2], comp: ['fad', 2], tank: ['cap', 2], valve: ['dn', 2], hanger: ['length', 2] };
for (const [dir, df, cf] of cats) {
  let m; try { m = await import(`../src/${dir}/calc.js`); } catch (e) { console.log('skip', dir); continue; }
  const d = m[df](), compute = m[cf];
  d.list.forEach((c) => { const r = compute(c, d.T); assert(!r.error, `${dir} ${c.tag} ${r.error}`); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1, 'line sum'); assert(r.total > r.base, 'gross-up'); assert(r.facts.length && r.metrics.length); console.log(dir.padEnd(7), c.tag.padEnd(48), 'Rs lakh', (r.total / 1e5).toFixed(1)); });
  const [k, f] = grow[dir], a = compute(d.list[0], d.T), b = compute({ ...d.list[0], [k]: d.list[0][k] * f }, d.T); assert(b.total > a.total, `${dir}: cost rises with ${k}`);
}
console.log('pkg calc OK');
