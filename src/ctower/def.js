// Cooling tower definition for the generic equipment UI.
import { ctDefault, computeTower, TYPES, CT_DEFAULTS } from './calc.js';
import { ctowerScene, ctowerSectionSVG } from './scene.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
export { ctDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Fill & drift', 'Fill & drift', '#0ea5a4'], ['Casing, structure & basin', 'Casing, structure & basin', '#c27a2c'], ['Fans & drives', 'Fans & drives', '#2563eb'], ['Accessories', 'Accessories', '#8b5cf6'], ['Assembly & supply', 'Assembly & supply', '#94a3b8'], ['Overheads', 'Overheads', '#64748b'], ['Margin', 'Margin', '#0f9d6b']];
const BANDS = { 'Counterflow, induced draught, FRP': [4200, 7000], 'Crossflow, induced draught, FRP': [4500, 7500], 'Counterflow, induced draught, RCC': [1500, 2800], 'Counterflow, induced draught, HDG steel': [2400, 4200], 'Natural draught, hyperbolic (RCC)': [1200, 2500] };

export const ctowerDef = {
  key: 'mf', name: 'cooling tower', ratesTitle: 'Rates · materials and bought-outs', qtyLabel: 'towers',
  ratesNote: 'Not from a workbook: every rate is an engineering assumption. Replace with vendor quotes before relying on the numbers.',
  masterNote: 'Psychrometric limits, fill characteristic, structure and bought-out rates, and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Duty gives water flow; the Merkel number demanded by range, approach and wet-bulb sets the fill depth; the L/G ratio trades fill against fan power.',
  sectionHint: 'One cell in elevation with water and air paths',
  views: [['section', 'Section'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { tr: { label: '₹/TR', dec: 0, fn: (v, r) => v / r.tr }, tower: { label: '₹/tower', dec: 0, fn: (v) => v }, flow: { label: '₹ per m³/h', dec: 0, fn: (v, r) => v / r.flow } },
  compute(st) { return st.list.map((c) => { const r = computeTower(c, st.T); if (r.error) return r; return { ...r, stack: st.T, parts: PARTS.map(([k, l, col]) => ({ k, l, col, v: r.groups[k] || 0 })) }; }); },
  title: (r) => `${r.cfg.tag || 'Cooling tower'} · ${fmt(r.tr)} TR`,
  meta: (r) => `${r.cfg.type} · ${fmt(r.flow)} m³/h · ${r.tIn.toFixed(1)} → ${r.tOut.toFixed(1)} °C · wet-bulb ${r.cfg.wb} °C`,
  pillOf: (r) => `${r.cells} cell${r.cells > 1 ? 's' : ''}`,
  metrics: (r) => [['Water flow', `${fmt(r.flow)} m³/h`], ['Plan area', `${fmt(r.plan)} m²`], ['Fan power', r.ty.natural ? 'natural draught' : `${fmt(r.fanKw)} kW`], ['Fill depth / L:G', `${r.depth.toFixed(2)} m / ${r.lg.toFixed(2)}`]],
  scene: (r, view) => ctowerScene(r, view === 'cut'), section: (r) => ctowerSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel];
    return `<div class="label">Tower <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Tower'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Type</div>
      <div class="fam" style="grid-template-columns:repeat(1,1fr)">${Object.keys(TYPES).map((k) => `<button data-mset="type" data-mv='"${k}"' class="${c.type === k ? 'on' : ''}"><span>${k}</span></button>`).join('')}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>
      ${h.slider('Heat rejected', 'kw', c.kw, 200, 80000, 100, 'kW', (v) => `${fmt(v)} kW · ${fmt(v / 3.517)} TR`)}
      <div class="two2"><div>${h.num('Range', 'range', c.range, 0.5, 'K')}</div><div>${h.num('Approach', 'approach', c.approach, 0.5, 'K')}</div></div>
      ${h.num('Design wet-bulb', 'wb', c.wb, 0.5, '°C')}
      <div class="label">Fan drive</div>${h.seg([['No', 'Direct'], ['Yes', 'VFD']], c.vfd, 'vfd')}
      ${c.approach < 3.5 ? `<div class="banner" style="margin-top:14px"><div>Approach under 3.5 K needs a very large tower; the fill depth and cost climb steeply.</div></div>` : ''}`;
  },
  rates(st) {
    const T = st.T, ty = TYPES[st.list[st.sel].type];
    return [{ label: 'Hot-dip galvanised steel', path: 'hdgRate', value: T.hdgRate, unit: '₹/kg', cid: 'ms_plate', price: true }, { label: `Fill, ${ty.fill}`, path: `fill.rates.${ty.fill}`, value: T.fill.rates[ty.fill], unit: '₹/m³' },
      { label: 'FRP casing', path: 'frpPerM2', value: T.frpPerM2, unit: '₹/m²' }, { label: 'RCC', path: 'rccPerM3', value: T.rccPerM3, unit: '₹/m³' }, { label: 'Fan motor IE3', path: 'motorPerKw', value: T.motorPerKw, unit: '₹/kW' }, { label: 'VFD', path: 'vfdPerKw', value: T.vfdPerKw, unit: '₹/kW' }];
  },
  isPricePath: (p) => p === 'hdgRate',
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['thermal', 'Thermal sizing', (r, st, h) => thermal(r, h)],
    ['bench', 'Benchmark', (r, st, h) => bench(r, h)],
  ],
  batchTitle: () => 'Cooling tower batch · one row per tower',
  batchCols: [['Type', (c) => c.type.replace(', induced draught', '')], ['TR', (c, r) => fmt(r.tr), 1], ['Flow m³/h', (c, r) => fmt(r.flow), 1], ['Cells', (c, r) => r.cells, 1], ['Fan kW', (c, r) => fmt(r.fanKw), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Duty'], ['Heat rejected (kW)', f(r.cfg.kw, 0)], ['Water flow (m³/h)', f(r.flow, 0)], ['Hot / cold water (°C)', `${f(r.tIn)} / ${f(r.tOut)}`], ['Wet-bulb (°C)', f(r.cfg.wb)],
      ['#', 'Thermal'], ['Merkel number demanded', f(r.me, 3)], ['L/G chosen', f(r.lg, 2)], ['Fill depth (m)', f(r.depth, 2)], ['Fill volume (m³)', f(r.fillM3, 1)],
      ['#', 'Geometry'], ['Plan area (m²)', f(r.plan, 0)], ['Cells', r.cells], ['Cell plan (m)', `${f(r.side, 1)} × ${f(r.side, 1)}`], ['Height (m)', f(r.height, 1)],
      ['#', 'Air side'], ['Air flow (m³/s)', f(r.airM3s, 0)], ['Fan diameter (m)', f(r.fanDia, 1)], ['Fan shaft power (kW)', f(r.fanKw, 0)], ['Motor per cell (kW)', f(r.motorKw, 1)], ['Make-up water (m³/h)', f(r.makeup, 1)]],
    [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [`${l.label} · ${f(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`, f(l.amount, 0)]), ['Direct cost', f(r.direct, 0)], ['Overheads', f(r.groups.Overheads, 0)], ['Margin', f(r.groups.Margin, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    const pctKeys = ['labour', 'transport', 'overheads', 'margin', 'drift'];
    const flat = Object.keys(T).filter((k) => typeof T[k] === 'number').map((k) => P(k, k.replace(/([A-Z])/g, ' $1').toLowerCase(), T[k], pctKeys.includes(k) ? '%' : '', 'any', pctKeys.includes(k) ? 100 : 1));
    return [{ title: 'Psychrometrics and L/G scan', rows: [P('psych.pressure', 'Barometric pressure', T.psych.pressure, 'kPa'), P('psych.lgMin', 'L/G scan minimum', T.psych.lgMin, ''), P('psych.lgMax', 'L/G scan maximum', T.psych.lgMax, '')] },
      { title: 'Fill rates and depth limits', rows: [...Object.keys(T.fill.rates).map((k) => P(`fill.rates.${k}`, k, T.fill.rates[k], '₹/m³')), P('fill.depthMin', 'Minimum fill depth', T.fill.depthMin, 'm'), P('fill.depthMax', 'Maximum fill depth (x2.2 allowed)', T.fill.depthMax, 'm')] },
      { title: 'Structure, fans, bought-outs and cost stack', rows: flat }];
  },
  reset(st) { const d = ctDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h;
  const groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one tower</div><p class="p">Quantities come from the thermal sizing; each line is priced at the Master Data rate, then labour and transport on material, overheads and margin.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(tot)}</td></tr>${ls.map((l) => `<tr><td>${l.label}${l.note ? ` <small>${l.note}</small>` : ''}</td><td class="r">${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}</td><td class="r">${nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Overheads and margin</b></td></tr><tr><td>Overheads</td><td></td><td></td><td class="r">₹${nf(r.groups.Overheads)}</td><td></td></tr><tr><td>Margin</td><td></td><td></td><td class="r">₹${nf(r.groups.Margin)}</td><td></td></tr><tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function thermal(r, h) {
  const { nf } = h, sc = r.scan, W = 760, H = 220, L = 52, R = 12, T = 12, B = 30, xs = (i) => L + (i / Math.max(1, sc.length - 1)) * (W - L - R);
  const cs = sc.map((s) => s.cost / 1e5), lo = Math.min(...cs) * 0.9, hi = Math.max(...cs) * 1.05, ys = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const pts = sc.map((s, i) => `${xs(i).toFixed(1)},${ys(s.cost / 1e5).toFixed(1)}`).join(' '), bi = sc.findIndex((s) => Math.abs(s.lg - r.lg) < 1e-6);
  const dots = sc.map((s, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(s.cost / 1e5).toFixed(1)}" r="${i === bi ? 5.5 : 3}" fill="${i === bi ? '#2563eb' : '#94a3b8'}"><title>L/G ${s.lg.toFixed(2)} · depth ${s.depth.toFixed(2)} m · fan ${nf(s.fanKw)} kW</title></circle>`).join('');
  return `<div class="h3">Why this L/G ratio</div><p class="p">A higher air flow shortens the temperature path but raises the Merkel number demanded, so the fill gets deeper and the fan bigger; a lower air flow needs a wider plan. The model scans L/G and keeps the cheapest fill-plus-fan combination: <b>L/G ${r.lg.toFixed(2)}</b>, Merkel demand <b>${r.me.toFixed(2)}</b>, fill <b>${r.depth.toFixed(2)} m</b>.</p>
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Fill plus fan cost against L/G"><polyline fill="none" stroke="#cbd5e1" stroke-width="1.6" points="${pts}"/>${dots}<text x="${L}" y="${H - 8}" font-size="11" fill="#6b7482">L/G ${sc[0].lg.toFixed(2)}</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="11" fill="#6b7482">${sc[sc.length - 1].lg.toFixed(2)}</text><text x="${L - 6}" y="${T + 8}" text-anchor="end" font-size="11" fill="#6b7482">₹${hi.toFixed(0)} L</text><text x="${L - 6}" y="${H - B}" text-anchor="end" font-size="11" fill="#6b7482">${lo.toFixed(0)}</text></svg>
    <p class="note" style="padding:6px 0">Cost proxy = fill volume × fill rate + fan shaft kW × ₹60,000/kW. Merkel integral by the four-point Chebyshev method; fill characteristic KaV/L = c·(L/G)^-n per metre of fill (Master Data types).</p>`;
}
function bench(r, h) {
  const { nf } = h, [lo, hi] = BANDS[r.cfg.type], v = r.perTr, x = (q) => Math.max(0, Math.min(100, q / 9000 * 100)), where = v < lo ? 'below' : v > hi ? 'above' : 'inside';
  return `<div class="h3">₹/TR check · ${r.cfg.type}</div><p class="p">A rough Indian supply band for this type is ₹${nf(lo)}–${nf(hi)} per TR (an estimate, not a quote). This tower models at <b>₹${nf(v)}/TR</b>, ${where} the band.</p>
    <div class="track" style="margin:26px 0 8px;position:relative"><i style="left:${x(lo)}%;right:${100 - x(hi)}%;background:#bfe3cf"></i><b class="mk" style="left:${x(v)}%"></b></div><div class="ends num"><span>₹0</span><span style="margin-left:auto">₹9,000 per TR</span></div>
    <p class="note" style="padding:12px 0 0">Small approach, low wet-bulb and high range all lift the cost. Calibrate by replacing fill, FRP and fan rates with two or three vendor quotes.</p>`;
}
