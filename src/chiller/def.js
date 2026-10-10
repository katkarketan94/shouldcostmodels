import { chillerDefault, computeChiller, TYPES, REFRIGERANTS, CHILLER_DEFAULTS } from './calc.js';
import { chillerScene } from './chiller3d.js';
import { chillerSectionSVG } from './chillerSection.js';

const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const clone = (o) => JSON.parse(JSON.stringify(o));
export { chillerDefault };
const PARTS = [['A', 'Material', '#c27a2c'], ['B', 'Bought-outs', '#2563eb'], ['C', 'Fabrication & test', '#0ea5a4'], ['D', 'Overheads', '#64748b'], ['E', 'Margin', '#0f9d6b']];
const BANDS = { 'WC screw': [22000, 28000], 'WC centrifugal': [22000, 28000], 'AC screw': [30000, 38000], 'AC scroll': [26000, 34000] };

export const chillerDef = {
  key: 'mf', name: 'chiller', ratesTitle: 'Rates · materials and bought-outs', qtyLabel: 'chillers',
  ratesNote: 'Not from a workbook: every rate here is an engineering assumption. Replace the compressor and control rates with vendor quotes.',
  masterNote: 'Thermal design, geometry, bought-out rates and cost stack. These are assumptions, not workbook values; edit freely. Changes are kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Heat duty sets exchanger area (Q = U × A × LMTD); area sets tube and shell weight; compressor power sets the bought-out.',
  sectionHint: 'Refrigerant circuit with duties from the model',
  views: [['section', 'Cycle'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st,
  maxRows: () => 20,
  units: { tr: { label: '₹/TR', dec: 0, fn: (v, r) => v / r.cfg.tr }, unit: { label: '₹/chiller', dec: 0, fn: (v) => v }, kw: { label: '₹/kW cooling', dec: 0, fn: (v, r) => v / r.qE } },
  compute(st) {
    return st.list.map((c) => {
      const r = computeChiller(c, st.T); if (r.error) return r;
      return { ...r, stack: st.T.stack, parts: PARTS.map(([k, l, col]) => ({ k, l, col, v: r[k] })) };
    });
  },
  title: (r) => `${r.cfg.tag || 'Chiller'} · ${fmt(r.cfg.tr)} TR`,
  meta: (r) => `${r.ty.label} · ${r.cfg.refrig} · ${fmt(r.kwTr, 2)} kW/TR (COP ${r.cop.toFixed(1)}) · CHW ${r.cfg.chwIn}/${r.cfg.chwOut} °C`,
  pillOf: (r) => r.ty.cooled === 'water' ? 'Water-cooled' : 'Air-cooled',
  metrics: (r) => [['Cooling / input', `${fmt(r.qE)} / ${fmt(r.pIn)} kW`], ['Footprint', `${r.size.L.toFixed(1)} × ${r.size.W.toFixed(1)} m`], ['Copper / steel', `${fmt(r.cuKg)} / ${fmt(r.shellSteel + r.frameKg)} kg`], ['Heat rejected', `${fmt(r.qC)} kW`]],
  scene: (r, view) => chillerScene(r, view === 'cut'),
  section: (r) => chillerSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], ty = TYPES[c.type], water = ty.cooled === 'water';
    return `<div class="label">Chiller <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Chiller'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Type</div>
      <div class="fam" style="grid-template-columns:repeat(2,1fr)">${Object.entries(TYPES).map(([k, t]) => `<button data-mset="type" data-mv='"${k}"' class="${c.type === k ? 'on' : ''}"><span>${t.label}</span></button>`).join('')}</div>
      <div class="label">Refrigerant</div>${h.seg(Object.keys(REFRIGERANTS).map((x) => [x, x]), c.refrig, 'refrig')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>
      ${h.slider('Capacity', 'tr', c.tr, Math.max(10, ty.minTr / 2), ty.maxTr * 1.5, 5, 'TR')}
      <div class="two2"><div>${h.num('Chilled water in', 'chwIn', c.chwIn, 0.5, '°C')}</div><div>${h.num('Chilled water out', 'chwOut', c.chwOut, 0.5, '°C')}</div></div>
      ${water ? `<div class="two2"><div>${h.num('Condenser water in', 'cwIn', c.cwIn, 0.5, '°C')}</div><div>${h.num('Condenser water out', 'cwOut', c.cwOut, 0.5, '°C')}</div></div>` : `<div class="note" style="padding:8px 0 0">Air-cooled: condenser coil sized for a ${st.T.thermal.airDeltaT} K air rise (Master Data).</div>`}
      <div class="label">Compressor drive</div>${h.seg([['Y', 'VFD'], ['N', 'Starter']], c.vfd, 'vfd')}
      ${c.tr < ty.minTr || c.tr > ty.maxTr ? `<div class="banner" style="margin-top:14px"><div>${ty.label} chillers are normally ${ty.minTr}–${ty.maxTr} TR; this is outside the usual range.</div></div>` : ''}`;
  },
  rates(st) {
    const P = st.T.prices, b = st.T.bought, ty = TYPES[st.list[st.sel].type];
    return [{ label: 'Copper tube', path: 'prices.Copper tube', value: P['Copper tube'], unit: '₹/kg', cid: 'copper_tube', price: true }, { label: 'Steel plate', path: 'prices.Steel plate', value: P['Steel plate'], unit: '₹/kg', cid: 'ms_sheet', price: true },
      { label: 'Aluminium fin', path: 'prices.Aluminium fin', value: P['Aluminium fin'], unit: '₹/kg', cid: 'al_fin', price: true }, { label: `Compressor + motor (${ty.comp})`, path: `bought.compRate.${ty.comp}`, value: b.compRate[ty.comp], unit: '₹/kW' },
      { label: 'VFD', path: 'bought.vfdRate', value: b.vfdRate, unit: '₹/kW' }, { label: `Refrigerant ${st.list[st.sel].refrig}`, path: `refPrice.${st.list[st.sel].refrig}`, value: st.T.refPrice[st.list[st.sel].refrig], unit: '₹/kg' }];
  },
  isPricePath: (p) => p.startsWith('prices.'),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['hx', 'Heat exchangers', (r, st, h) => hx(r, h)],
    ['bench', 'Benchmark', (r, st, h) => bench(r, h)],
  ],
  batchTitle: () => 'Chiller batch · one row per machine',
  batchCols: [['Type', (c) => TYPES[c.type].label], ['TR', (c) => fmt(c.tr), 1], ['kW/TR', (c, r) => r.kwTr.toFixed(2), 1], ['Weight kg', (c, r) => fmt(r.weight), 1]],
  calcRows(r, st) {
    const f = (v, d = 1) => fmt(v, d), e = r.ev, c = r.cond;
    return [[['#', 'Duty'], ['Cooling (kW)', f(r.qE, 0)], ['Compressor input (kW)', f(r.pIn, 0)], ['COP', f(r.cop, 2)], ['Heat rejected (kW)', f(r.qC, 0)],
      ['#', 'Evaporator'], ['Saturation (°C)', f(e.tSat)], ['LMTD (K)', f(e.lmtd, 2)], ['Tube area (m²)', f(e.area)], ['Tubes × length (m)', `${f(e.N, 0)} × ${f(e.L, 2)}`], ['Shell Ø × length (m)', `${f(e.D, 2)} × ${f(e.L, 2)}`], ['Shell thickness (mm)', f(e.tShell)], ['Copper (kg)', f(e.cuKg, 0)], ['Steel (kg)', f(e.steelKg, 0)],
      ['#', c.kind === 'shell' ? 'Condenser (shell & tube)' : 'Condenser (air-cooled coil)'], ...(c.kind === 'shell' ? [['Saturation (°C)', f(c.tSat)], ['LMTD (K)', f(c.lmtd, 2)], ['Tube area (m²)', f(c.area)], ['Shell Ø × length (m)', `${f(c.D, 2)} × ${f(c.L, 2)}`], ['Copper (kg)', f(c.cuKg, 0)], ['Steel (kg)', f(c.steelKg, 0)]] : [['Air flow (m³/s)', f(c.flow)], ['Face area (m²)', f(c.face)], ['Tube length (m)', f(c.tubeLen, 0)], ['Copper / aluminium (kg)', `${f(c.cuKg, 0)} / ${f(c.alKg, 0)}`], ['Fan power (kW)', f(c.fanKw)]])],
    [['#', 'Cost stack (₹)'], ...Object.entries(r.mat).map(([k, v]) => [k, f(v, 0)]), ['A  Material', f(r.A, 0)], ...Object.entries(r.bought).map(([k, v]) => [k, f(v, 0)]), ['B  Bought-outs', f(r.B, 0)], ['C  Fabrication & test', f(r.C, 0)], ['D  Overheads', f(r.D, 0)], ['E  Margin', f(r.E, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    return [
      { title: 'Material prices and densities', rows: [...Object.keys(T.prices).map((k) => P(`prices.${k}`, `${k} price`, T.prices[k], '₹/kg')), ...Object.keys(T.dens).map((k) => P(`dens.${k}`, `${k} density`, T.dens[k], 'kg/m³')), ...Object.keys(T.refPrice).map((k) => P(`refPrice.${k}`, `${k} refrigerant`, T.refPrice[k], '₹/kg'))] },
      { title: 'Thermal design', rows: [P('thermal.evapApproach', 'Evaporator approach', T.thermal.evapApproach, 'K'), P('thermal.evapU', 'Evaporator U', T.thermal.evapU, 'kW/m²K'), P('thermal.condApproach', 'Condenser approach', T.thermal.condApproach, 'K'), P('thermal.condU', 'Condenser U', T.thermal.condU, 'kW/m²K'), P('thermal.airDeltaT', 'Air rise, air-cooled', T.thermal.airDeltaT, 'K'), P('thermal.faceVel', 'Condenser face velocity', T.thermal.faceVel, 'm/s'), P('thermal.coilRows', 'Condenser coil rows', T.thermal.coilRows, ''), P('thermal.fpi', 'Condenser fins per inch', T.thermal.fpi, ''), P('thermal.fanDp', 'Fan pressure', T.thermal.fanDp, 'Pa'), P('thermal.fanEff', 'Fan efficiency', T.thermal.fanEff, '')] },
      { title: 'Shell & tube geometry', rows: [P('geometry.tubeOD', 'Tube OD', T.geometry.tubeOD, 'mm'), P('geometry.tubeWall', 'Tube wall (mean)', T.geometry.tubeWall, 'mm'), P('geometry.pitch', 'Tube pitch', T.geometry.pitch, 'mm'), P('geometry.aspect', 'Shell length ÷ diameter', T.geometry.aspect, ''), P('geometry.bundleFill', 'Bundle fill', T.geometry.bundleFill, ''), P('geometry.shellPad', 'Refrigerant-space factor', T.geometry.shellPad, ''), P('shell.stress', 'Allowable stress (SA516-70)', T.shell.stress, 'MPa'), P('shell.jointEff', 'Weld joint efficiency', T.shell.jointEff, ''), P('shell.corrosion', 'Corrosion allowance', T.shell.corrosion, 'mm'), P('shell.minThk', 'Minimum shell thickness', T.shell.minThk, 'mm'), P('shell.scrap', 'Plate scrap', T.shell.scrap, '% of wt', 'any', 100)] },
      { title: 'Bought-outs', rows: [...Object.entries(T.bought.compRate).map(([k, v]) => P(`bought.compRate.${k}`, `${k} compressor + motor`, v, '₹/kW')), P('bought.compExp', 'Size discount exponent', T.bought.compExp, ''), P('bought.starterRate', 'Starter', T.bought.starterRate, '₹/kW'), P('bought.vfdRate', 'VFD', T.bought.vfdRate, '₹/kW'), P('bought.fanRate', 'Condenser fans', T.bought.fanRate, '₹/kW'), P('bought.controlsFixed', 'Controls, fixed', T.bought.controlsFixed, '₹'), P('bought.controlsPerTr', 'Controls, per TR', T.bought.controlsPerTr, '₹/TR'), P('bought.pipingPerTr', 'Valves & piping', T.bought.pipingPerTr, '₹/TR'), P('bought.economiserPerTr', 'Economiser (screw)', T.bought.economiserPerTr, '₹/TR'), P('bought.insulRate', 'Evaporator insulation', T.bought.insulRate, '₹/m²')] },
      { title: 'Refrigerant charge and skid steel', rows: [...Object.entries(T.bought.charge).map(([k, v]) => P(`bought.charge.${k}`, `${k} charge`, v, 'kg/TR')), ...Object.entries(T.frame.kgPerTr).map(([k, v]) => P(`frame.kgPerTr.${k}`, `${k} skid steel`, v, 'kg/TR'))] },
      { title: 'Conversion and cost stack', rows: [P('conv.assemblyPerKg', 'Assembly, welding & brazing', T.conv.assemblyPerKg, '₹/kg'), P('conv.coilPerKg', 'Coil / tube expansion', T.conv.coilPerKg, '₹/kg'), P('conv.testPerTr', 'Factory test', T.conv.testPerTr, '₹/TR'), P('conv.packingPct', 'Packing', T.conv.packingPct, '%', 'any', 100), P('stack.overheads', 'Overheads', T.stack.overheads, '% of A+B+C', 'any', 100), P('stack.margin', 'Margin', T.stack.margin, '% of A+B+C+D', 'any', 100)] },
    ];
  },
  reset(st) { st.T = clone(CHILLER_DEFAULTS); st.list = chillerDefault().list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf, pct } = h;
  const sec = (title, tot, rows, w) => `<tr><td colspan="4" class="grp2"><b>${title}</b> ₹${nf(tot)}</td></tr>${rows.map(([n, v, wt]) => `<tr><td>${n}</td><td class="r">${wt != null ? nf(wt) : '–'}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${(v / tot) * 100}%"></i></div></td></tr>`).join('')}`;
  const wts = { 'Copper tube': r.cuKg, 'Aluminium fin': r.alKg, 'Shell & plate steel': r.shellSteel, 'Skid frame': r.frameKg, 'Air-cooled casing': r.casingKg };
  const matRows = Object.entries(r.mat).filter(([, v]) => v > 0).map(([k, v]) => [k, v, wts[k]]);
  const boRows = Object.entries(r.bought).filter(([, v]) => v > 0).map(([k, v]) => [k, v, null]);
  const cvRows = [...Object.entries(r.conv).map(([k, v]) => [k, v, null]), ['Packing', r.packing, null]];
  let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one chiller</div><p class="p">Same A / B / C / D / E stack as the AHU workbook. Weights drive material, compressor power drives the bought-out.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Weight kg</th><th class="r">Cost</th><th>Share of group</th></tr></thead><tbody>${sec('A · Material', r.A, matRows)}${sec('B · Bought-outs', r.B, boRows)}${sec('C · Fabrication & test', r.C, cvRows)}</tbody></table></div>
    <div class="h3" style="margin-top:22px">From material to selling price</div><p class="p">Overheads ${pct(r.stack.overheads, 0)} of A+B+C, then margin ${pct(r.stack.margin, 0)} of A+B+C+D (Master Data tab).</p>
    <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}<div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Total</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">₹${nf(r.total)}</b></div></div>`;
}
function hx(r, h) {
  const { nf } = h, e = r.ev, c = r.cond;
  const row = (n, ...v) => `<tr><td>${n}</td>${v.map((x) => `<td class="r">${x}</td>`).join('')}</tr>`;
  return `<div class="h3">Heat exchangers</div><p class="p">Area from Q = U × A × LMTD, then tube count, shell size (ASME VIII-1 thickness) and weights.</p>
    <div class="scroll"><table class="t num"><thead><tr><th></th><th class="r">Evaporator</th><th class="r">${c.kind === 'shell' ? 'Condenser' : 'Condenser coil'}</th></tr></thead><tbody>
    ${row('Duty (kW)', nf(r.qE), nf(r.qC))}${row('LMTD (K)', nf(e.lmtd, 2), c.kind === 'shell' ? nf(c.lmtd, 2) : '–')}${row('Heat-transfer area (m²)', nf(e.area, 1), c.kind === 'shell' ? nf(c.area, 1) : `${nf(c.face, 1)} face`)}
    ${row('Size', `Ø${nf(e.D, 2)} × ${nf(e.L, 2)} m`, c.kind === 'shell' ? `Ø${nf(c.D, 2)} × ${nf(c.L, 2)} m` : `${nf(c.flow, 1)} m³/s air`)}${row('Tubes', nf(e.N), c.kind === 'shell' ? nf(c.N) : `${nf(c.tubeLen, 0)} m`)}${row('Copper (kg)', nf(e.cuKg), nf(c.cuKg))}${row('Steel (kg)', nf(e.steelKg), c.kind === 'shell' ? nf(c.steelKg) : nf(r.casingKg))}</tbody></table></div>`;
}
function bench(r, h) {
  const { nf } = h, [lo, hi] = BANDS[r.cfg.type], v = r.perTr, x = (q) => Math.max(0, Math.min(100, (q / 60000) * 100));
  const where = v < lo ? 'below' : v > hi ? 'above' : 'inside';
  return `<div class="h3">₹/TR check · ${r.ty.label}</div><p class="p">A rough market band for this chiller type is ₹${nf(lo)}–${nf(hi)} per TR (the author’s estimate of Indian supply prices, not a quote). This machine models at <b>₹${nf(v)}/TR</b>, ${where} the band.</p>
    <div class="track" style="margin:26px 0 8px;position:relative"><i style="left:${x(lo)}%;right:${100 - x(hi)}%;background:#bfe3cf"></i><b class="mk" style="left:${x(v)}%"></b></div><div class="ends num"><span>₹0</span><span style="margin-left:auto">₹60,000 per TR</span></div>
    <p class="note" style="padding:12px 0 0">Calibrate by replacing the compressor and controls rates with two or three vendor quotes; the bought-outs are about ${Math.round(r.B / r.total * 100)}% of this price.</p>`;
}
