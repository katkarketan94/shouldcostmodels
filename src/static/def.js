// Static equipment definition for the generic equipment UI.
import { stDefault, computeStatic, PLATES, TUBES, TYPES, ST_DEFAULTS } from './calc.js';
import { stScene, stSectionSVG } from './scene.js';

export { stDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const cr = (v, d = 2) => fmt(v / 1e7, d);
const PARTS = [['Raw material', '#c27a2c'], ['Bought-outs', '#2563eb'], ['Conversion', '#0ea5a4'], ['Design & engineering', '#8b5cf6'], ['Overheads', '#64748b'], ['Profit', '#0f9d6b'], ['Supervision, spares, finance', '#94a3b8']];
const TYPICAL = { 'Raw material': 0.60, 'Bought-outs': 0.06, Conversion: 0.16, 'Design & engineering': 0.02, Overheads: 0.05, Profit: 0.10, 'Supervision, spares, finance': 0.01 };
const SHELLTUBE = (t) => t === 'cond' || t === 'fwh' || t === 'hx';

export const stDef = {
  key: 'mf', name: 'unit', ratesTitle: 'Rates · materials', qtyLabel: 'units',
  ratesNote: 'Not from a workbook: weights follow the geometry and ASME-style thickness rules; rates, conversion and the cost stack are assumptions, with the condenser cross-checked against a reference cost sheet. Plate and tube prices follow the commodity file.',
  masterNote: 'Material prices, condenser specific weights, geometry rules, conversion and bought-out rates and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Tube count from the area and tube size; shell, head and tubesheet thickness from the design pressure; weights priced by material; then conversion and the cost stack.',
  sectionHint: 'Cross-section drawn from the calculated geometry',
  views: [['section', 'Section'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 30,
  units: { cr: { label: '₹ Cr', dec: 2, fn: (v) => v / 1e7 }, perKg: { label: '₹/kg of weight', dec: 0, fn: (v, r) => v / r.weight }, perM2: { label: '₹/m² of surface', dec: 0, fn: (v, r) => (r.cfg.area && r.ty !== 'vessel' && r.ty !== 'dea' ? v / r.cfg.area : 0) }, perT: { label: '₹ lakh per tonne', dec: 2, fn: (v, r) => v / (r.weight / 1000) / 1e5 } },
  compute(st) { return st.list.map((c) => { const r = computeStatic(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.parts[k] })) }; }); },
  qtyTotal: (r, q) => r.total * q,
  title: (r) => r.cfg.tag,
  meta: (r) => `${TYPES[r.ty]} · ${r.cfg.shellMat}${SHELLTUBE(r.ty) ? ` · tubes ${r.cfg.tubeMat}` : ''}`,
  pillOf: (r) => `₹${cr(r.total)} Cr`,
  metrics: (r) => [['Weight', `${fmt(r.weight / 1000, r.weight > 100000 ? 0 : 1)} t`], [SHELLTUBE(r.ty) ? 'Tubes' : 'Shell wall', SHELLTUBE(r.ty) ? `${fmt(r.N)}` : `${r.shellMm} mm`], ['Raw-material share', `${(r.share['Raw material'] * 100).toFixed(0)}%`], ['₹ per kg', `${fmt(r.perKg)}`]],
  scene: (r, view) => stScene(r, view === 'cut'), section: (r) => stSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], two = (a, b) => `<div class="two2"><div>${a}</div><div>${b}</div></div>`, n = (l, p, v, s = 'any', u = '') => h.num(l, p, v, s, u), t = c.type;
    return `<div class="label">Equipment <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Type</div><div class="fam" style="grid-template-columns:1fr">${Object.entries(TYPES).map(([k, l]) => `<button data-mset="type" data-mv='"${k}"' class="${t === k ? 'on' : ''}"><span>${l}</span></button>`).join('')}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty and size</div>
      ${SHELLTUBE(t) ? `${h.slider('Heat-transfer area', 'area', c.area, t === 'cond' ? 5000 : 50, t === 'cond' ? 80000 : 3000, t === 'cond' ? 500 : 10, 'm²')}${two(n('Tube OD', 'tubeOD', c.tubeOD, 0.01, 'mm'), n('Tube wall', 'tubeWall', c.tubeWall, 0.01, 'mm'))}${n('Tube length', 'tubeLen', c.tubeLen, 0.5, 'm')}${two(n('Shell-side pressure', 'pShell', c.pShell, 'any', 'bar g'), n('Tube-side pressure', 'pTube', c.pTube, 'any', 'bar g'))}` : ''}
      ${t === 'vessel' ? `${two(n('Inside diameter', 'id', c.id, 0.1, 'm'), n('Tangent length', 'tan', c.tan, 0.1, 'm'))}${n('Design pressure', 'pVessel', c.pVessel, 'any', 'bar g')}` : ''}
      ${t === 'dea' ? `${two(n('Condensate flow', 'flow', c.flow, 10, 't/h'), n('Storage time', 'storage', c.storage, 0.5, 'min'))}${n('Design pressure', 'pVessel', c.pVessel, 'any', 'bar g')}` : ''}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Materials</div>
      <div class="label">Shell and plate</div>${h.sel(Object.keys(PLATES).map((k) => [k, k]), c.shellMat, 'shellMat')}
      ${SHELLTUBE(t) ? `<div class="label">Tubes</div>${h.sel(Object.keys(TUBES).map((k) => [k, k]), c.tubeMat, 'tubeMat')}` : ''}`;
  },
  afterEdit(st) { if (st.sel >= st.list.length) st.sel = 0; },
  rates(st) {
    const P = st.T.prices, c = st.list[st.sel], pk = PLATES[c.shellMat].price, tk = TUBES[c.tubeMat].price;
    const cid = { plate: 'hr_plate', plate304: 'ss304_rm', plate316: 'ss316_rm', tube304: 'ss304_rm', tube316: 'ss316_rm', tubeCs: 'erw_pipe', tubeBrass: 'copper', tubeCuNi: 'copper' };
    const row = (key, label) => ({ label, path: `prices.${key}`, value: P[key], unit: '₹/kg', cid: cid[key], price: !!cid[key] });
    const out = [row(pk, `Plate: ${c.shellMat}`)]; if (SHELLTUBE(c.type)) out.push(row(tk, `Tube: ${c.tubeMat}`)); if (c.type === 'dea') out.push(row('plate304', 'SS 304 (internals)'));
    return [...out, { label: 'Fabrication', path: 'conv.fab', value: st.T.conv.fab, unit: '₹/kg' }, { label: 'Profit', path: 'stack.profit', value: st.T.stack.profit, unit: 'of price' }];
  },
  isPricePath: (p) => p.startsWith('prices.'),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['structure', 'Cost structure', (r, st, h) => structure(r, h)],
    ['ref', 'Reference check', (r, st, h) => reference(r, st, h)],
  ],
  batchTitle: () => 'Equipment batch',
  batchCols: [['Type', (c) => TYPES[c.type]], ['Weight t', (c, r) => fmt(r.weight / 1000, 1), 1], ['₹/kg', (c, r) => fmt(r.perKg), 1], ['RM share', (c, r) => `${(r.share['Raw material'] * 100).toFixed(0)}%`, 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Geometry'], ...Object.entries(r.geo).map(([k, v]) => [k, typeof v === 'number' ? f(v, v < 100 ? 2 : 0) : v]), ['Total weight (kg)', f(r.weight, 0)], ['Tube weight (kg)', f(r.tubeKg, 0)]],
      [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Base (raw material + bought-outs + conversion)', f(r.base, 0)], ['Price after the cost stack', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, row = (path, label, v, un = '', scale = 1) => [label, path, v, 'any', scale, un];
    return [{ title: 'Material prices, ₹/kg', rows: Object.keys(T.prices).map((k) => row(`prices.${k}`, k, T.prices[k], '₹/kg')) },
      { title: 'Condenser specific weights (kg/m²) and price multiples of plate', rows: Object.entries(T.cond).filter(([k]) => k !== 'boPerM2').flatMap(([k, v]) => [row(`cond.${k}.0`, `${k} weight`, v[0], 'kg/m²'), row(`cond.${k}.1`, `${k} price multiple`, v[1], 'x')]).concat([row('cond.boPerM2', 'Bought-outs per m²', T.cond.boPerM2, '₹/m²')]) },
      { title: 'Geometry and code rules', rows: Object.keys(T.geom).map((k) => row(`geom.${k}`, k, T.geom[k], '')) }, { title: 'Conversion', rows: Object.keys(T.conv).map((k) => row(`conv.${k}`, k, T.conv[k], '₹')) },
      { title: 'Bought-outs', rows: Object.keys(T.bought).map((k) => row(`bought.${k}`, k, T.bought[k], '₹')) }, { title: 'Deaerator', rows: Object.keys(T.dea).map((k) => row(`dea.${k}`, k, T.dea[k], '')) },
      { title: 'Cost stack (share of the price)', rows: Object.keys(T.stack).map((k) => row(`stack.${k}`, k, T.stack[k], '%', 100)) }];
  },
  reset(st) { const d = stDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};
function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  return `<div class="h3">Build-up of one unit</div><p class="p">Weights from the geometry, priced by material; conversion by fabrication kg, tube joints and testing; then engineering, overheads, profit and supervision are charged as shares of the price (base ÷ (1 − shares)).</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate ₹</th><th class="r">Amount ₹</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const t = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="4" class="grp2"><b>${g}</b> ₹${nf(t)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="4" class="grp2"><b>Cost stack on the price</b></td></tr>${['Design & engineering', 'Overheads', 'Profit', 'Supervision, spares, finance'].map((k) => `<tr><td>${k}</td><td></td><td class="r">${(r.share[k] * 100).toFixed(1)}%</td><td class="r">₹${nf(r.parts[k])}</td></tr>`).join('')}<tr class="total"><td>Should-cost per unit</td><td></td><td></td><td class="r">₹${nf(r.total)}</td></tr></tbody></table></div>`;
}
function structure(r, h) {
  return `<div class="h3">Cost structure against the reference</div><p class="p">The reference surface-condenser sheet splits the price as raw material 60%, bought-outs 6%, conversion 16%, engineering 2%, overheads 5%, profit 10% and supervision, spares and finance 1%. Raw material is the biggest driver, which is why steel and tube prices move the price.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Component</th><th class="r">This unit</th><th class="r">Reference</th><th>This unit</th></tr></thead><tbody>${PARTS.map(([k, col]) => `<tr><td><span class="dot" style="background:${col}"></span> ${k}</td><td class="r">${(r.share[k] * 100).toFixed(1)}%</td><td class="r">${(TYPICAL[k] * 100).toFixed(0)}%</td><td><div class="bar"><i style="width:${r.share[k] * 100}%;background:${col}"></i></div></td></tr>`).join('')}</tbody></table></div>
    <p class="note" style="padding:8px 0 0">A raw-material share far from 60% is worth a look: small vessels run lower because fabrication and testing weigh more, and exotic tubes (titanium, Cu-Ni) push it higher.</p>`;
}
function reference(r, st, h) {
  const T = JSON.parse(JSON.stringify(st.T)); T.prices.plate = 60; const ref = computeStatic(st.list.find((x) => x.type === 'cond') || stDefault().list[0], T);
  return `<div class="h3">Check against the reference condenser sheet</div><p class="p">The 50,212 m² surface condenser (937 MT with bought-outs, SA 249 TP304 tubes at ₹288/kg, plate at ₹60/kg) is priced on the reference sheet at ₹21.46 Cr, of which raw material ₹12.96 Cr and conversion ₹3.33 Cr. This model, run at those rates:</p>
    <div class="scroll"><table class="t num"><thead><tr><th></th><th class="r">This model</th><th class="r">Reference sheet</th></tr></thead><tbody><tr><td>Tube weight</td><td class="r">${fmt(ref.tubeKg / 1000, 0)} t</td><td class="r">290 t</td></tr><tr><td>Raw material</td><td class="r">₹${cr(ref.rm)} Cr</td><td class="r">₹12.96 Cr</td></tr><tr><td>Conversion</td><td class="r">₹${cr(ref.conv)} Cr</td><td class="r">₹3.33 Cr</td></tr><tr class="total"><td>Price</td><td class="r">₹${cr(ref.total)} Cr</td><td class="r">₹21.46 Cr</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">The condenser weights per m² of tube surface and the plate-price multiples are taken from that sheet. The feed-water heater, exchanger, vessel and deaerator weights are computed from the geometry and have no reference sheet yet: calibrate their rates with a recent quote. The sheet’s rates are from 2018, so use its structure, not its rupee rates, for today’s prices.</p>`;
}
