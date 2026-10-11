// HT / LT switchgear definition for the generic equipment UI.
import { swgrDefault, computeSwgr, HT_KINDS, LT_KINDS, KV, RELAYS, SW_DEFAULTS } from './calc.js';
import { swgrScene, swgrElevationSVG } from './scene.js';

export { swgrDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Enclosure & structure', '#c27a2c'], ['Busbars & insulation', '#0ea5a4'], ['Switching devices', '#2563eb'], ['Protection & metering', '#8b5cf6'], ['Wiring & auxiliaries', '#94a3b8'], ['Assembly & test', '#e8b923'], ['Overheads', '#64748b'], ['Margin', '#0f9d6b']];

export const swgrDef = {
  key: 'mf', name: 'switchboard', ratesTitle: 'Rates · materials and devices', qtyLabel: 'boards',
  ratesNote: 'Not from a workbook: device prices scale with rating from assumed base prices; replace them with your supplier’s quotes. Copper, aluminium and CRCA follow the common commodity file.',
  masterNote: 'Device base prices and exponents, steel weights per bay, busbar current densities, multipliers and the cost stack. Assumptions, not workbook values. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'The bay schedule gives sheet steel, busbar, devices and wiring for each bay; the board adds busbar, DC system and test.',
  sectionHint: 'Front elevation to scale; each column is one panel, or a stack of feeder modules',
  views: [['section', 'Elevation'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 40,
  units: { board: { label: '₹/board', dec: 0, fn: (v) => v }, bay: { label: '₹/bay', dec: 0, fn: (v, r) => v / r.nBays }, amp: { label: '₹ per A of busbar', dec: 0, fn: (v, r) => v / r.cfg.busA } },
  compute(st) { return st.list.map((c) => { const r = computeSwgr(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.groups[k] || 0 })) }; }); },
  title: (r) => `${r.cfg.tag || 'Switchboard'}`,
  meta: (r) => `${r.ht ? `${r.kv} kV metal-clad VCB board` : 'LT 415 V ' + r.cfg.form} · ${r.cfg.busA} A busbar · ${r.cfg.kA} kA · ${r.nBays} bays`,
  pillOf: (r) => (r.ht ? 'HT' : 'LT'),
  metrics: (r) => [['Board size', `${r.widthM.toFixed(1)} × ${r.depthM} × ${r.heightM} m`], ['Busbar', `${fmt(r.busMm2)} mm² · ${fmt(r.busKg)} kg`], ['Sheet steel', `${fmt(r.steelTotal)} kg`], ['Total weight', `${fmt(r.weight)} kg`]],
  scene: (r, view) => swgrScene(r, view === 'cut'), section: (r) => swgrElevationSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], ht = c.cls === 'HT', kinds = ht ? HT_KINDS : LT_KINDS;
    const rows = Object.entries(kinds).map(([k, [label, unit]]) => `<div class="label" style="margin-top:10px">${label}</div><div class="two2"><div><input class="cell fw" type="number" min="0" step="1" data-mf="q.${k}" data-num="1" value="${c.q?.[k] ?? 0}" aria-label="${label} quantity"><small class="mut">quantity</small></div><div>${unit ? `<input class="cell fw" type="number" step="any" data-mf="a.${k}" data-num="1" value="${c.a?.[k] ?? kinds[k][2]}" aria-label="${label} size"><small class="mut">${unit}</small>` : ''}</div></div>`).join('');
    return `<div class="label">Board <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Board'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Class and rating</div>
      ${h.seg([['HT', 'HT metal-clad (VCB)'], ['LT', 'LT 415 V (ACB / MCC)']], c.cls, 'cls')}
      ${ht ? `<div class="label">System voltage <small>kV</small></div>${h.chips(KV.map((k) => [k, k]), c.kv, 'kv')}` : `<div class="label">Busbar material</div>${h.seg([['Aluminium', 'Aluminium'], ['Copper', 'Copper']], c.busMat, 'busMat')}<div class="label">Separation</div>${h.seg([['Form 2b', '2b'], ['Form 3b', '3b'], ['Form 4b', '4b']], c.form, 'form')}`}
      ${h.num('Busbar rating', 'busA', c.busA, 50, 'A')}${h.num(`Fault level ${ht ? '(3 s)' : '(1 s)'}`, 'kA', c.kA, 0.5, 'kA')}
      <div class="label">Degree of protection</div>${h.seg([['IP42', 'IP42'], ['IP54', 'IP54'], ['IP55', 'IP55']], c.ip, 'ip')}
      <div class="label">Arc-fault protection</div>${h.seg([['No', 'Standard'], ['Yes', 'Arc-proof (IAC)']], c.arc, 'arc')}
      ${ht ? `<div class="label">Protection relay</div>${h.sel(Object.keys(RELAYS).map((k) => [k, k]), c.relay, 'relay')}` : ''}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Bay schedule</div>${rows}
      ${r && r.warn && r.warn.length ? `<div class="banner" style="margin-top:14px"><div>${r.warn.join(' ')}</div></div>` : ''}`;
  },
  afterEdit(st, path) {
    const c = st.list[st.sel]; if (path !== 'cls') return;
    if (c.cls === 'HT') { Object.assign(c, { kv: 11, busA: 1250, kA: 25, form: 'Form 3b', ip: 'IP42', busMat: 'Copper', q: { inc: 2, cpl: 1, fdr: 4, pt: 1 }, a: { inc: 1250, cpl: 1250, fdr: 630, mtr: 400 } }); }
    else Object.assign(c, { kv: 0.415, busA: 1600, kA: 50, form: 'Form 3b', ip: 'IP54', busMat: 'Aluminium', q: { aci: 1, mcf: 8, dol: 8 }, a: { aci: 1600, mcf: 250, dol: 11 } });
  },
  rates(st) {
    const P = st.T.prices, c = st.list[st.sel], ht = c.cls === 'HT';
    return [{ label: 'Copper (busbar)', path: 'prices.copper', value: P.copper, unit: '₹/kg', cid: 'copper', price: true }, { label: 'Aluminium (busbar)', path: 'prices.aluminium', value: P.aluminium, unit: '₹/kg', cid: 'aluminium', price: true }, { label: 'CRCA sheet', path: 'prices.crca', value: P.crca, unit: '₹/kg', cid: 'crca_sheet', price: true },
      ht ? { label: `VCB ${c.kv} kV, 1,250 A 25 kA`, path: `vcb.${c.kv}`, value: st.T.vcb[c.kv], unit: '₹' } : { label: 'ACB base, 1,000 A 50 kA', path: 'acbBase', value: st.T.acbBase, unit: '₹' },
      { label: 'Busbar fabrication', path: 'bus.fab', value: st.T.bus.fab, unit: '₹/kg' }, { label: 'Assembly labour', path: 'rates.assemblyPerKg', value: st.T.rates.assemblyPerKg, unit: '₹/kg steel' }];
  },
  isPricePath: (p) => /^prices\./.test(p),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['bays', 'Cost by bay', (r, st, h) => byBay(r, h)],
    ['basis', 'Method', () => method()],
  ],
  batchTitle: () => 'Switchboard batch · one row per board',
  batchCols: [['Class', (c) => (c.cls === 'HT' ? `HT ${c.kv} kV` : 'LT 415 V')], ['Busbar A', (c) => fmt(c.busA), 1], ['kA', (c) => c.kA, 1], ['Bays', (c, r) => r.nBays, 1], ['Steel kg', (c, r) => fmt(r.steelTotal), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Board'], ['Class', r.ht ? `HT ${r.kv} kV` : 'LT 415 V'], ['Busbar rating (A)', f(r.cfg.busA, 0)], ['Busbar section (mm² per phase)', f(r.busMm2, 0)], ['Busbar mass (kg)', f(r.busKg, 0)], ['Columns', r.cols], ['Board length (m)', f(r.widthM, 1)], ['Sheet steel (kg)', f(r.steelTotal, 0)], ['Weight (kg)', f(r.weight, 0)],
      '#', ...[]].filter((x) => x !== '#'),
    [['#', 'Cost by group (₹)'], ...Object.entries(r.groups).map(([k, v]) => [k, f(v, 0)]), ['Total', f(r.total, 0)], ['Per bay', f(r.perBay, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un], flatObj = (base, obj, pred = () => true, un = '') => Object.keys(obj).filter((k) => typeof obj[k] === 'number' && pred(k)).map((k) => P(`${base}.${k}`, `${base} · ${k}`, obj[k], un));
    const pct = ['typeTest', 'packing', 'transport', 'overheads', 'margin'];
    return [{ title: 'Commodity rates', rows: flatObj('prices', T.prices, () => true, '₹/kg') },
      { title: 'VCB base prices and exponents', rows: [...flatObj('vcb', T.vcb)] }, { title: 'HT panel weight and instrument transformers', rows: [...flatObj('htPanelKg', T.htPanelKg, () => true, 'kg'), ...flatObj('htCtSet', T.htCtSet, () => true, '₹'), ...flatObj('htVtSet', T.htVtSet, () => true, '₹'), ...flatObj('htLa', T.htLa, () => true, '₹')] },
      { title: 'LT devices', rows: [...['acbBase', 'acbAmpExp', 'acbKaExp', 'acb4p', 'mccbBase', 'mccbAmpExp', 'mccbKaExp', 'apfcPerKvar', 'apfcBase', 'ctLt', 'relayLt', 'mfm', 'meterHt', 'lamps', 'selector', 'mccbAux', 'ammeterSet'].map((k) => P(k, k, T[k], '')), ...flatObj('starter', T.starter)] },
      { title: 'Sheet steel per bay', rows: flatObj('steel', T.steel) }, { title: 'Busbars', rows: flatObj('bus', T.bus) },
      { title: 'Labour, test and cost stack', rows: Object.keys(T.rates).map((k) => P(`rates.${k}`, k.replace(/([A-Z])/g, ' $1').toLowerCase(), T.rates[k], pct.includes(k) ? '%' : '', pct.includes(k) ? 100 : 1)) }];
  },
  reset(st) { const d = swgrDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of the board</div><p class="p">Every line is a bay quantity times a device or material rate. Devices are priced from a rating-scaled base price; steel and busbar from their weights.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const t = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(t)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}</td><td class="r">${nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / t * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Overheads and margin</b></td></tr><tr><td>Overheads</td><td></td><td></td><td class="r">₹${nf(r.groups.Overheads)}</td><td></td></tr><tr><td>Margin</td><td></td><td></td><td class="r">₹${nf(r.groups.Margin)}</td><td></td></tr><tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function byBay(r, h) {
  const { nf } = h, rows = r.bays.map((b) => { const cost = r.byBay[b.label] || 0; return { b, cost, each: cost / b.n }; }), board = r.byBay.Board || 0;
  return `<div class="h3">Where the money goes, bay by bay</div><p class="p">Bay cost includes its own steel, device, protection and wiring. Shared items (main busbar, DC system, labour, test) are shown under “Board” before overheads and margin.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Bay type</th><th class="r">Qty</th><th class="r">Size</th><th class="r">₹ each</th><th class="r">₹ total</th></tr></thead><tbody>${rows.map(({ b, cost, each }) => `<tr><td>${b.label}</td><td class="r">${b.n}</td><td class="r">${b.unit ? `${nf(b.size)} ${b.unit}` : '–'}</td><td class="r">₹${nf(each)}</td><td class="r">₹${nf(cost)}</td></tr>`).join('')}<tr><td>Board-level items</td><td></td><td></td><td></td><td class="r">₹${nf(board)}</td></tr></tbody></table></div>`;
}
function method() {
  return `<div class="h3">How the board is costed</div><p class="p">HT boards are indoor metal-clad VCB panels. The VCB price scales with rated current (exponent 0.45) and fault level (0.5) from a base price per voltage class; instrument transformers, surge arresters and the relay are added per panel. LT boards price ACBs, MCCBs, starters, VFDs and APFC banks from rating-scaled formulas. Each bay carries sheet steel (CRCA, powder coated), wiring and a routine test. The main busbar section follows the rated current at the chosen current density, with a vertical busbar for MCC sections.</p>
    <p class="note" style="padding:6px 0">An own model, not a workbook. Base device prices, steel per bay and labour are assumptions; the board prices come out near ₹8–10 lakh per 11 kV panel, ₹20–25 lakh per 33 kV panel and ₹1–4 lakh per LT bay, which are market ranges, not quotes. Calibrate with two or three recent offers.</p>`;
}
