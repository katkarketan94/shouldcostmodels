import { readFileSync } from 'node:fs';
import { computeTray, boqRate } from '../src/calcTray.js';
import { TRAY_DEFAULTS as T } from '../src/dataTray.js';
const fx = JSON.parse(readFileSync(new URL('./fixtures_tray.json', import.meta.url)));
let bad = 0;
for (const f of fx) {
  const r = computeTray(f.cfg, T);
  const got = { piece: r.piece, perM: r.perM, steelW: r.steelW, zincW: r.zincW, steel: r.parts.steel, zinc: r.parts.zinc, labour: r.parts.labour };
  for (const [k, v] of Object.entries(f.expect)) if (Math.abs(got[k] - v) > 1e-6 * Math.max(1, Math.abs(v))) { bad++; console.log('MISMATCH', f.sheet, k, got[k], v); }
}
// BoQ: every priced line's unit rate and the grand total
const boq = JSON.parse(readFileSync(new URL('./boq_tray.json', import.meta.url)));
let total = 0;
for (const b of boq) { if (!b.sheet) continue; const f = fx.find((x) => x.sheet === b.sheet); const rate = boqRate(computeTray(f.cfg, T)); total += rate * b.qty;
  if (Math.abs(rate - b.rateExpected) > 1e-6 * Math.max(1, b.rateExpected)) { bad++; console.log('BOQ RATE', b.sheet, rate, b.rateExpected); } }
console.log(bad ? `${bad} tray mismatches` : `OK: ${fx.length} tray sheets x 7 values and ${boq.filter((b) => b.sheet).length} BoQ rates match; priced total Rs ${(total / 1e7).toFixed(4)} Cr`);
process.exit(bad ? 1 : 0);
