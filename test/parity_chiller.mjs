// Parity: every Calculator row in the source workbook (cached Excel values) against the JS port.
import assert from 'node:assert';
import WB from '../src/chiller/workbook.json' with { type: 'json' };
import { chillerDefault, computeChiller } from '../src/chiller/calc.js';
const d = chillerDefault(), keys = { CA: 'total', BR: 'material', AE: (r) => r.ev.area, AN: (r) => r.cond.area, BH: (r) => r.items.BH, CD: 'allUnits' };
d.list.forEach((c, i) => { const r = computeChiller(c, d.T), e = WB.expect[i];
  for (const [k, f] of Object.entries(keys)) { const got = typeof f === 'function' ? f(r) : r[f]; assert(Math.abs(got - e[k]) <= Math.max(1e-6, Math.abs(e[k]) * 1e-9), `${c.tag} ${k}: ${got} vs ${e[k]}`); }
  assert.strictEqual(r.flags, (e.CP || '').trim(), `${c.tag} flags`); assert(r.stackOk); console.log(c.tag.padEnd(52), 'Rs', Math.round(r.total).toLocaleString('en-IN'), r.flags || '');
});
console.log('chiller parity OK');
// behaviour checks beyond parity
import assert2 from 'node:assert';
{ const d2 = chillerDefault(), c = d2.list[1], a = computeChiller({ ...c, tr: 200 }, d2.T), b = computeChiller({ ...c, tr: 400 }, d2.T); assert2(b.total > a.total && b.perTr < a.perTr * 1.1, 'scale');
  const T2 = JSON.parse(JSON.stringify(d2.T)); T2.r.r_cuTube *= 2; assert2(computeChiller(c, T2).total > computeChiller(c, d2.T).total, 'copper price'); assert2(computeChiller({ ...c, chwIn: 7 }, d2.T).error, 'bad temps');
  assert2(computeChiller({ ...c, vfd: 'No' }, d2.T).total < computeChiller(c, d2.T).total, 'no VFD cheaper'); console.log('chiller behaviour OK'); }
