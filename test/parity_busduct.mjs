import { readFileSync } from 'node:fs';
import { computeBusduct } from '../src/calcBusduct.js';
import { BUSDUCT_DEFAULTS as T } from '../src/dataBusduct.js';
const fx = JSON.parse(readFileSync(new URL('./fixtures_busduct.json', import.meta.url)));
let bad = 0;
for (const f of fx) {
  const r = computeBusduct(f.spec, T), p = r.parts;
  const got = { mat: r.mat, labour: p.labour, machinery: p.machinery, utilities: p.utilities, overheads: p.overheads, total: r.total, low: r.low, high: r.high };
  for (const [k, v] of Object.entries(got)) if (Math.abs(v - f.expect[k]) > 1e-9 * Math.max(1, Math.abs(f.expect[k]))) { bad++; console.log('MISMATCH', f.spec.id, k, v, f.expect[k]); }
  if (typeof f.expect.actual === 'number') { const var_ = r.high / f.expect.actual - 1; if (Math.abs(var_ - f.expect.variance) > 1e-9) { bad++; console.log('VARIANCE', f.spec.id, var_, f.expect.variance); } }
}
console.log(bad ? `${bad} busduct mismatches` : `OK: ${fx.length} busduct specs x 8 values match the workbook (and ${fx.filter((f) => typeof f.expect.actual === 'number').length} FY26 variances)`);
process.exit(bad ? 1 : 0);
