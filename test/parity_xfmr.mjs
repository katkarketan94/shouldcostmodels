import { readFileSync } from 'node:fs';
import { Workbook } from '../src/structural/engine.js';
let allBad = 0;
for (const name of ['power', 'dist', 'dry']) {
  const data = JSON.parse(readFileSync(new URL(`../src/xfmr/${name}.json`, import.meta.url))); delete data._dv;
  const wb = new Workbook(data); let n = 0, bad = 0;
  for (const [sheet, cells] of Object.entries(data)) for (const [addr, c] of Object.entries(cells)) {
    if (c.f === undefined) continue; n++;
    let got; try { got = wb.cell(sheet, addr); } catch (e) { got = e.code ?? 'ERR:' + e.message; }
    const exp = c.c;
    const same = (typeof exp === 'number' && typeof got === 'number') ? Math.abs(got - exp) <= 1e-7 * Math.max(1, Math.abs(exp))
      : ((exp === null || exp === '' || exp === undefined) && (got === null || got === '' || got === undefined)) || got === exp || (typeof exp === 'string' && /^#/.test(exp) && got === exp);
    if (!same) { bad++; if (bad < 12) console.log('MISMATCH', name, sheet, addr, c.f.slice(0, 70), 'got', JSON.stringify(got), 'expected', JSON.stringify(exp)); }
  }
  console.log(bad ? `${name}: ${bad} of ${n} formulas differ` : `OK ${name}: all ${n} workbook formulas reproduce the cached values`); allBad += bad;
}
process.exit(allBad ? 1 : 0);
