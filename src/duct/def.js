import { ductDefault, computeDuct, SHAPES, MATS, PRESSURE, JOINTS, INSULATIONS, DUCT_DEFAULTS, longestSide } from './calc.js';
import { ductScene } from './duct3d.js';
import { ductSectionSVG } from './ductSection.js';

const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const clone = (o) => JSON.parse(JSON.stringify(o));
export { ductDefault };
const PARTS = [['A', 'Material', '#c27a2c'], ['B', 'Dampers', '#2563eb'], ['C', 'Fabrication & install', '#0ea5a4'], ['D', 'Overheads', '#64748b'], ['E', 'Margin', '#0f9d6b']];
const dims = (c) => (c.shape === 'Round' ? `Ø${c.dia}` : `${c.w} × ${c.h}`);

export const ductDef = {
  key: 'mf', name: 'ducting', ratesTitle: 'Rates · sheet and supports', qtyLabel: 'm of duct',
  ratesNote: 'Not from a workbook: sheet prices follow the HVAC rates used in the AHU workbook, other rates are assumptions. Check them against a ductwork quotation.',
  masterNote: 'Sheet gauges, fabrication and installation rates, and the cost stack. These are assumptions, not workbook values; edit freely. Changes are kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Duct weight comes from perimeter × gauge × density, plus joints, stiffeners and hangers. Fittings are an allowance on the straight run.',
  sectionHint: 'Cross-section drawn to scale from the duct size',
  views: [['section', 'Cross-section'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { m: { label: '₹/m', dec: 0, fn: (v, r) => v / r.cfg.run }, m2: { label: '₹/m²', dec: 0, fn: (v, r) => v / r.surface }, kg: { label: '₹/kg', dec: 0, fn: (v, r) => v / r.weight }, run: { label: '₹/run', dec: 0, fn: (v) => v } },
  qtyTotal: (r, q) => (r.total / r.cfg.run) * q,
  compute(st) { return st.list.map((c) => { const r = computeDuct(c, st.T); if (r.error) return r; return { ...r, stack: st.T.stack, parts: PARTS.map(([k, l, col]) => ({ k, l, col, v: r[k] })) }; }); },
  title: (r) => `${r.cfg.tag || 'Duct'} · ${dims(r.cfg)} mm`,
  meta: (r) => `${r.cfg.shape} ${r.cfg.mat} · ${r.thk.toFixed(2)} mm sheet · ${r.cfg.joint} · ${r.cfg.ins === 'None' ? 'uninsulated' : `${r.cfg.ins} ${r.cfg.insThk} mm`} · ${r.cfg.run} m run`,
  pillOf: (r) => `${r.cfg.pressure} pressure`,
  metrics: (r) => [['Sheet gauge', `${r.thk.toFixed(2)} mm`], ['Weight', `${fmt(r.weight / r.cfg.run, 1)} kg/m`], ['Surface', `${fmt(r.per, 2)} m²/m`], ['Run total', `₹${fmt(r.total)}`]],
  scene: (r, view) => ductScene(r, view === 'cut'), section: (r) => ductSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], round = c.shape === 'Round', ins = c.ins !== 'None';
    return `<div class="label">Duct <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Duct'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Shape &amp; size</div>
      ${h.seg(SHAPES.map((s) => [s, s]), c.shape, 'shape')}
      ${round ? h.slider('Diameter', 'dia', c.dia, 100, 1500, 50, 'mm') : `${h.slider('Width', 'w', c.w, 100, 2400, 50, 'mm')}${h.slider(c.shape === 'Flat oval' ? 'Height (minor axis)' : 'Height', 'h', c.h, 100, 1600, 50, 'mm')}`}
      ${h.slider('Run length', 'run', c.run, 1, 200, 1, 'm')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Construction</div>
      <div class="label">Material</div>${h.seg(MATS.map((m) => [m, m.replace('Pre-coated GI', 'Pre-coated')]), c.mat, 'mat')}
      <div class="label">Pressure class</div>${h.seg(Object.entries(PRESSURE).map(([k, p]) => [k, k]), c.pressure, 'pressure')}
      <div class="label">Joint</div>${h.seg(Object.keys(JOINTS).map((k) => [k, k.replace('Slip + drive cleat', 'Slip + cleat').replace('Companion angle', 'Companion')]), c.joint, 'joint')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Insulation &amp; extras</div>
      <div class="label">Insulation</div>${h.seg(Object.keys(INSULATIONS).map((k) => [k, k.replace('Glass wool + foil', 'Glass wool').replace('Closed-cell nitrile', 'Nitrile')]), c.ins, 'ins')}
      ${ins ? `<div class="label">Thickness <small>mm</small></div>${h.chips([13, 19, 25, 38, 50].map((v) => [v, v]), c.insThk, 'insThk')}` : ''}
      ${h.slider('Fittings allowance', 'fittings', c.fittings, 0, 60, 5, '% of run', (v) => v + '%')}
      <div class="label">Volume dampers</div>${h.chips([0, 1, 2, 3, 4].map((v) => [v, v]), c.dampers, 'dampers')}
      <div class="label">Scope</div>${h.seg([['Y', 'Supply + install'], ['N', 'Supply only']], c.install, 'install')}`;
  },
  rates(st) {
    const P = st.T.prices, f = st.T.fab, c = st.list[st.sel];
    return [{ label: `${c.mat} sheet`, path: `prices.${c.mat}`, value: P[c.mat], unit: '₹/kg', cid: { 'GI sheet': 'gi_hvac', 'Pre-coated GI': 'precoated_gi', 'SS 304': 'ss304', Aluminium: 'al_sheet' }[c.mat], price: true }, { label: 'Angle & hanger steel', path: 'prices.Angle / hanger steel', value: P['Angle / hanger steel'], unit: '₹/kg', cid: 'gi_sheet', price: true },
      { label: 'Fabrication', path: 'fab.perKg', value: f.perKg, unit: '₹/kg' }, { label: 'Installation', path: 'fab.installPerM2', value: f.installPerM2, unit: '₹/m²' }, { label: 'Volume damper', path: 'damperRate', value: st.T.damperRate, unit: '₹/m²' }];
  },
  isPricePath: (p) => p.startsWith('prices.'),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['weights', 'Weights & gauge', (r, st, h) => weights(r, st, h)],
    ['bench', 'Benchmark', (r, st, h) => bench(r, h)],
  ],
  batchTitle: () => 'Ductwork batch · one row per run',
  batchCols: [['Shape', (c) => `${c.shape} ${dims(c)}`], ['Run m', (c) => fmt(c.run), 1], ['Gauge mm', (c, r) => r.thk.toFixed(2), 1], ['kg/m', (c, r) => fmt(r.weight / c.run, 1), 1], ['₹/m²', (c, r) => fmt(r.perM2), 1]],
  calcRows(r) {
    const f = (v, d = 2) => fmt(v, d);
    return [[['#', 'Geometry'], ['Perimeter (m)', f(r.per, 3)], ['Longest side (mm)', fmt(longestSide(r.cfg))], ['Base gauge → with pressure class (mm)', `${f(r.baseThk)} → ${f(r.thk, 3)}`], ['Surface incl. fittings (m²)', f(r.surface, 1)], ['Insulated area (m²)', f(r.insArea, 1)],
      ['#', 'Weights'], ['Sheet per metre (kg)', f(r.sheetPerM, 2)], ['Sheet, run incl. fittings (kg)', f(r.sheetKg, 0)], ['Joints & stiffeners (kg)', f(r.jointKg, 0)], ['Hangers & supports (kg)', f(r.hangKg, 0)], ['Total weight (kg)', f(r.weight, 0)]],
    [['#', 'Cost stack (₹ for the run)'], ...Object.entries(r.mat).map(([k, v]) => [k, f(v, 0)]), ['Consumables & sealant', f(r.consum, 0)], ['A  Material', f(r.A, 0)], ['B  Dampers', f(r.B, 0)], ['C  Fabrication', f(r.fab, 0)], ['C  Installation', f(r.inst, 0)], ['D  Overheads', f(r.D, 0)], ['E  Margin', f(r.E, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    return [
      { title: 'Sheet and steel prices', rows: Object.keys(T.prices).map((k) => P(`prices.${k}`, k, T.prices[k], '₹/kg')) },
      { title: 'Sheet gauge by longest side', note: 'Low-pressure thickness; medium and high pressure multiply it.', rows: [...T.gauge.map(([mx, t], i) => P(`gauge.${i}.1`, mx >= 99999 ? 'Above the previous size' : `Up to ${mx} mm`, t, 'mm')), ...Object.entries(PRESSURE).filter(([k]) => k !== 'Low').map(([k, p]) => [`${k} pressure multiplier`, `pm.${k}`, p.mult, 0.05, 1, '× (display; edit in code)'])].filter((x) => !String(x[1]).startsWith('pm.')) },
      { title: 'Construction', rows: [P('scrap', 'Sheet scrap', T.scrap, '% of wt', 'any', 100), P('jointSpacing', 'Joint spacing', T.jointSpacing, 'm'), P('stiffAbove', 'Stiffen above', T.stiffAbove, 'mm side'), P('stiffAngleKg', 'Stiffener angle', T.stiffAngleKg, 'kg/m'), P('consumablesPct', 'Sealant & consumables', T.consumablesPct, '% of material', 'any', 100), P('hanger.spacing', 'Hanger spacing', T.hanger.spacing, 'm'), P('hanger.rodDrop', 'Rod drop', T.hanger.rodDrop, 'm'), P('hanger.rodKgM', 'Rod weight', T.hanger.rodKgM, 'kg/m'), P('hanger.trapezeKgM', 'Trapeze angle', T.hanger.trapezeKgM, 'kg/m'), P('damperRate', 'Volume damper', T.damperRate, '₹/m²')] },
      { title: 'Insulation rates', note: 'Rate = fixed + per-mm × thickness.', rows: Object.entries(T.insulRates).flatMap(([k, v]) => [P(`insulRates.${k}.fix`, `${k} fixed`, v.fix, '₹/m²'), P(`insulRates.${k}.mm`, `${k} per mm`, v.mm, '₹/m²/mm')]) },
      { title: 'Fabrication, installation and stack', rows: [P('fab.perKg', 'Shop fabrication', T.fab.perKg, '₹/kg'), P('fab.fittingFactor', 'Fittings effort factor', T.fab.fittingFactor, '×'), P('fab.installPerM2', 'Installation', T.fab.installPerM2, '₹/m²'), P('fab.installInsulPerM2', 'Insulation fixing', T.fab.installInsulPerM2, '₹/m²'), P('stack.overheads', 'Overheads', T.stack.overheads, '% of A+B+C', 'any', 100), P('stack.margin', 'Margin', T.stack.margin, '% of A+B+C+D', 'any', 100)] },
    ];
  },
  reset(st) { st.T = clone(DUCT_DEFAULTS); st.list = ductDefault().list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf, pct } = h, c = r.cfg;
  const sec = (title, tot, rows) => `<tr><td colspan="4" class="grp2"><b>${title}</b> ₹${nf(tot)}</td></tr>${rows.map(([n, b, v]) => `<tr><td>${n}</td><td class="mut">${b}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${tot ? (v / tot) * 100 : 0}%"></i></div></td></tr>`).join('')}`;
  const mats = [[`Duct sheet (${c.mat})`, `${nf(r.sheetKg)} kg incl. ${nf(c.fittings)}% fittings`, r.mat['Duct sheet']], ['Joints & stiffeners', `${c.joint}; ${nf(r.jointKg)} kg`, r.mat['Joints & stiffeners']], ['Hangers & supports', `${nf(r.hangKg)} kg`, r.mat['Hangers & supports']], ['Insulation', c.ins === 'None' ? 'none' : `${c.ins} ${c.insThk} mm · ${nf(r.insArea, 0)} m²`, r.mat.Insulation], ['Sealant & consumables', `${pct(0.03, 0)} of material`, r.consum]];
  let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Cost of the whole run · ${nf(c.run)} m</div><p class="p">Sheet weight comes from perimeter × gauge × density; fabrication is charged per kg and installation per m² of duct surface.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th>Basis</th><th class="r">Cost</th><th>Share of group</th></tr></thead><tbody>${sec('A · Material', r.A, mats)}${sec('B · Dampers', Math.max(r.B, 1), [['Volume dampers', `${c.dampers} × ${nf(r.face, 2)} m²`, r.B]])}${sec('C · Fabrication & installation', r.C, [['Shop fabrication', `₹${r.fab && nf(r.fab / (r.weight || 1), 0)}/kg effective`, r.fab], ['Installation', c.install === 'Y' ? `${nf(r.surface, 0)} m² surface` : 'supply only', r.inst]])}</tbody></table></div>
    <div class="h3" style="margin-top:22px">From material to selling price</div><p class="p">Overheads ${pct(r.stack.overheads, 0)} of A+B+C, margin ${pct(r.stack.margin, 0)} of A+B+C+D.</p>
    <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}<div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Total</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">₹${nf(r.total)}</b></div></div>`;
}
function weights(r, st, h) {
  const { nf } = h, L = longestSide(r.cfg);
  return `<div class="h3">Sheet gauge and weights</div><p class="p">Longest side ${nf(L)} mm gives a ${r.baseThk} mm sheet in low pressure${r.cfg.pressure !== 'Low' ? `, raised to ${r.thk.toFixed(2)} mm for ${r.cfg.pressure.toLowerCase()} pressure` : ''}.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Longest side up to</th><th class="r">Sheet mm</th></tr></thead><tbody>${st.T.gauge.map(([mx, t]) => `<tr class="${L <= mx && (L > (st.T.gauge[st.T.gauge.indexOf(st.T.gauge.find((q) => q[0] === mx)) - 1]?.[0] ?? 0)) ? 'sel' : ''}"><td>${mx >= 99999 ? 'above' : nf(mx) + ' mm'}</td><td class="r">${t}</td></tr>`).join('')}</tbody></table></div>
    <p class="note" style="padding:12px 0 0">Per metre of run: sheet ${nf(r.sheetPerM, 1)} kg, hangers ${nf(r.hangKg / r.cfg.run, 2)} kg, total ${nf(r.weight / r.cfg.run, 1)} kg including fittings.</p>`;
}
function bench(r, h) {
  const { nf } = h, lo = 1100, hi = 1900, v = r.perM2, x = (q) => Math.max(0, Math.min(100, (q / 3500) * 100));
  const where = v < lo ? 'below' : v > hi ? 'above' : 'inside';
  return `<div class="h3">₹/m² check</div><p class="p">Insulated GI ductwork, supplied and installed, is usually ₹${nf(lo)}–${nf(hi)} per m² of duct surface (the author’s estimate, not a quote). This duct models at <b>₹${nf(v)}/m²</b>, ${where} that band${r.cfg.install === 'N' ? ' — note this one is supply only' : ''}${r.cfg.mat !== 'GI sheet' ? ', and the band is for GI' : ''}.</p>
    <div class="track" style="margin:26px 0 8px;position:relative"><i style="left:${x(lo)}%;right:${100 - x(hi)}%;background:#bfe3cf"></i><b class="mk" style="left:${x(v)}%"></b></div><div class="ends num"><span>₹0</span><span style="margin-left:auto">₹3,500 per m²</span></div>`;
}
