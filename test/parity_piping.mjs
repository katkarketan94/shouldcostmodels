import { readFileSync } from 'node:fs';
import { Workbook } from '../src/structural/engine.js';
const data = JSON.parse(readFileSync(new URL('../src/piping/workbook.json', import.meta.url)));
const wb = new Workbook(data); wb.names = { USDtoINR: { sheet: 'Assumptions', addr: 'D6' } };
// The workbook's own 'Cost Model_1800' sheet was saved with a Standard 40-inch SCH 40 selection that has no wall thickness in the schedule table
// (E62 is blank), so its cached results are errors/placeholders; it and the Summary cells fed by it are excluded from the comparison.
const SKIP = (sheet, addr) => sheet === 'Cost Model_1800' || (sheet === 'Summary' && /^[A-Z]+(11|12)$/.test(addr)) || (sheet === 'Assumptions' && addr === 'C3');
let n = 0, bad = 0, skipped = 0;
for (const [sheet, cells] of Object.entries(data)) for (const [addr, c] of Object.entries(cells)) {
  if (c.f === undefined) continue;
  if (SKIP(sheet, addr)) { skipped++; continue; }
  n++;
  let got; try { got = wb.cell(sheet, addr); } catch (e) { got = e.code ?? 'ERR:' + e.message; }
  const exp = c.c;
  const same = (typeof exp === 'number' && typeof got === 'number') ? Math.abs(got - exp) <= 1e-9 * Math.max(1, Math.abs(exp))
    : ((exp === null || exp === '' || exp === undefined) && (got === null || got === '' || got === undefined)) || got === exp || (typeof exp === 'string' && /^#/.test(exp) && got === exp);
  if (!same) { bad++; if (bad < 30) console.log('MISMATCH', sheet, addr, c.f.slice(0, 70), 'got', got, 'expected', exp); }
}
console.log(bad ? `${bad} of ${n} formulas differ` : `OK: ${n} piping workbook formulas reproduce the cached values (${skipped} on the unreliable 1800 sheet skipped)`);
process.exit(bad ? 1 : 0);
