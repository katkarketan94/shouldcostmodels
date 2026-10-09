import { readFileSync } from 'node:fs';
import { Workbook } from '../src/structural/engine.js';
const data = JSON.parse(readFileSync(new URL('../src/structural/workbook.json', import.meta.url)));
const wb = new Workbook(data);
let n = 0, bad = 0;
for (const [sheet, cells] of Object.entries(data)) for (const [addr, c] of Object.entries(cells)) {
  if (c.f === undefined) continue;
  n++;
  let got; try { got = wb.cell(sheet, addr); } catch (e) { got = e.code ?? 'ERR:' + e.message; }
  const exp = c.c;
  const same = (typeof exp === 'number' && typeof got === 'number') ? Math.abs(got - exp) <= 1e-9 * Math.max(1, Math.abs(exp))
    : ((exp === null || exp === '' || exp === undefined) && (got === null || got === '' || got === undefined)) || got === exp
      || (typeof exp === 'string' && /^#/.test(exp) && got === exp);
  if (!same) { bad++; if (bad < 25) console.log('MISMATCH', sheet, addr, c.f.slice(0, 80), 'got', got, 'expected', exp); }
}
console.log(bad ? `${bad} of ${n} formulas differ` : `OK: all ${n} workbook formulas reproduce the cached values`);
process.exit(bad ? 1 : 0);
