// DG set: runs the workbook's own Inputs -> Sizing -> Cost Build-up -> Output formulas for any specification.
import { Workbook } from '../structural/engine.js';
import WORKBOOK from './workbook.json' with { type: 'json' };

export const IN = { kva: 'D6', duty: 'D7', pf: 'D8', qty: 'D9', temp: 'D12', alt: 'D13', norm: 'D16', engine: 'D17', alternator: 'D18', insClass: 'D19', enclosure: 'D20', panel: 'D21', autonomy: 'D22', channel: 'D23', stance: 'D26' };
export const OPTIONS = { duty: ['Standby', 'Prime'], norm: ['CPCB II', 'CPCB IV+'], engine: ['Kirloskar', 'Mahindra', 'Volvo Eicher', 'Cummins', 'Baudouin', 'Perkins', 'Caterpillar'], alternator: ['Kirloskar', 'CG', 'Leroy Somer', 'Stamford'], insClass: ['F', 'H'],
  enclosure: ['None', 'Acoustic', 'Weatherproof'], panel: ['Manual', 'AMF', 'AMF + ATS'], channel: ['OEM direct', 'Dealer / integrator'], stance: ['Market price', 'Should-cost target', 'Aggressive floor'] };
const SH = { in: 'Inputs', sz: 'Sizing', cb: 'Cost Build-up', ref: 'Reference', rl: 'Rate Library', bm: 'Benchmark', out: 'Output', po: 'PO Validation' };
export const BLOCKS = [['A', 'Engine, aftertreatment & cooling', '#c27a2c', 5, 15], ['B', 'Alternator', '#2563eb', 17, 23], ['C', 'Base frame', '#0ea5a4', 25, 35], ['D', 'Control panel', '#8b5cf6', 37, 46], ['E', 'Fuel tank', '#e8b923', 48, 55], ['F', 'Acoustic enclosure', '#06b6d4', 57, 65], ['G', 'Exhaust system', '#94a3b8', 67, 70], ['H', 'Battery, charger & cabling', '#f59e0b', 72, 75], ['I', 'Assembly & test', '#64748b', 77, 80]];

let wb; const eng = () => (wb ||= new Workbook(WORKBOOK));
const raw = (sheet, a) => WORKBOOK[sheet]?.[a]?.v;
export const seedSpec = () => Object.fromEntries(Object.entries(IN).map(([k, a]) => [k, raw(SH.in, a)]));
export const stdRatings = () => { const o = []; for (let c = 3; c <= 40; c++) { const v = raw(SH.ref, colN(c) + '151') ?? WORKBOOK[SH.ref][colN(c) + '152']?.v; if (typeof v === 'number') o.push(v); } return o; };
function colN(n) { let s = ''; while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); } return s; }
export const stdKva = () => { const o = []; for (let r = 152; r <= 185; r++) { const v = raw(SH.ref, `B${r}`); if (typeof v === 'number') o.push(v); } return o; };

/** editable reference tables (T1..T19) and the rate library, found by scanning the Reference sheet */
export function referenceTables() {
  const R = WORKBOOK[SH.ref], out = []; let cur = null;
  for (let r = 4; r <= 190; r++) {
    const b = R[`B${r}`]?.v;
    if (typeof b === 'string' && /^T\d+\s/.test(b)) { cur = { title: b.replace(/\s+/g, ' '), header: null, rows: [], note: '' }; out.push(cur); continue; }
    if (!cur) continue;
    if (b === undefined) continue;
    const cells = 'BCDEFGHI'.split('').map((c) => ({ addr: `${c}${r}`, v: R[`${c}${r}`]?.v })).filter((x) => x.v !== undefined);
    if (cur.header === null && cells.every((x) => typeof x.v === 'string')) { cur.header = cells.map((x) => x.v); continue; }
    if (cells.length === 1 && typeof b === 'string' && b.length > 40) { cur.note = b; continue; }
    cur.rows.push(cells);
  }
  return out;
}
export function rateLibrary() { const o = []; for (let r = 5; r <= 30; r++) { const n = raw(SH.rl, `B${r}`); if (n) o.push({ label: n, unit: raw(SH.rl, `C${r}`), addr: `D${r}`, value: raw(SH.rl, `D${r}`), note: raw(SH.rl, `E${r}`) }); } return o; }

/** run: spec (inputs), T = { cells: { 'Reference!C84': value, 'Rate Library!D5': value } } */
export function runDG(spec, T = {}) {
  const w = eng(); w.clearOverrides();
  for (const [k, v] of Object.entries(T.cells || {})) w.over[k] = v;
  for (const [k, a] of Object.entries(IN)) w.over[`${SH.in}!${a}`] = spec[k];
  w.memo.clear();
  try {
    const g = (sheet, a) => w.cell(sheet, a);
    const z = {}; for (let r = 5; r <= 28; r++) { const lab = WORKBOOK[SH.sz][`B${r}`]?.v; z[r] = { label: lab, v: g(SH.sz, `C${r}`), unit: WORKBOOK[SH.sz][`D${r}`]?.v ?? '', how: WORKBOOK[SH.sz][`E${r}`]?.v ?? '' }; }
    const lines = {}, blocks = [];
    for (const [k, label, col, r0, r1] of BLOCKS) {
      const ls = [];
      for (let r = r0 + 1; r < r1; r++) {
        const f = w.get(SH.cb, `F${r}`); if (typeof f !== 'number') continue;
        ls.push({ label: WORKBOOK[SH.cb][`B${r}`]?.v, qty: w.get(SH.cb, `C${r}`), unit: WORKBOOK[SH.cb][`D${r}`]?.v ?? '', rate: w.get(SH.cb, `E${r}`), amount: f, how: WORKBOOK[SH.cb][`G${r}`]?.v ?? '', row: r });
      }
      blocks.push({ k, label, col, lines: ls, total: g(SH.cb, `F${r1}`) });
    }
    const cb = (a) => g(SH.cb, a);
    const r = { spec, sizing: z, blocks, direct: cb('F83'), overhead: cb('F84'), warranty: cb('F85'), works: cb('F86'), margin: cb('F87'), qtyDisc: cb('F88'), channel: cb('F89'), freight: cb('F90'), total: cb('F91'), perKva: cb('F92'), perKvaSite: cb('F93'),
      rates: { overhead: cb('C84'), warranty: cb('C85'), margin: cb('C87'), freight: cb('C90'), qtyFactor: cb('C88'), channelFactor: cb('C89') },
      std: z[13].v, engineKw: z[18].v, engineBhp: z[19].v, fuelLph: z[20].v, tankL: z[21].v, amps: z[22].v, skid: { L: z[23].v, W: z[24].v }, encl: { L: z[25].v, W: z[26].v, H: z[27].v, area: z[28].v }, derate: z[11].v,
      bench: { l1: g(SH.out, 'G7'), high: g(SH.out, 'G8'), po: g(SH.out, 'G9') } };
    return r;
  } catch (e) { return { error: e.code ? `The workbook returned ${e.code} for this specification` : String(e.message) }; }
}

/** the 17 purchase orders and the workbook's stored model results */
export function purchaseOrders() {
  const P = WORKBOOK[SH.po], o = [];
  for (let r = 6; r <= 22; r++) { if (P[`C${r}`]?.v === undefined) continue; o.push({ n: P[`B${r}`].v, kva: P[`C${r}`].v, duty: P[`D${r}`].v, norm: P[`E${r}`].v, engine: P[`F${r}`].v, vendor: P[`G${r}`].v, po: P[`H${r}`].v, market: P[`I${r}`].v, should: P[`J${r}`].v, comment: P[`L${r}`]?.v ?? '' }); }
  return o;
}
export function benchmarkTable() { const B = WORKBOOK[SH.bm], o = []; for (let r = 6; r <= 48; r++) if (B[`B${r}`]) o.push({ kva: B[`B${r}`].v, quotes: B[`C${r}`]?.v, l1: B[`D${r}`]?.v, high: B[`E${r}`]?.v, po: B[`H${r}`]?.v }); return o; }
