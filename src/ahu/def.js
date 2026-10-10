// AHU & FCU model definition for the generic equipment UI. All numbers come from the workbook through ./model.js.
import { runBatch, seedRows, masterDefaults, assumptionRows, wbValue, MATERIALS, OPTIONS, MAX_ROWS, FIRST_ROW, motorSizes } from './model.js';
import { ahuScene } from './ahu3d.js';
import { ahuSectionSVG } from './ahuSection.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
export function ahuDefault() {
  const mk = (kind) => ({ list: seedRows(kind), sel: 0, unit: 'cfm', qty: 1, view: 'cut', btab: 'anatomy', editPrices: false });
  return { kind: 'ahu', ahu: mk('ahu'), fcu: mk('fcu'), T: { ahu: masterDefaults('ahu'), fcu: masterDefaults('fcu'), ass: {} } };
}
export const A = (T, addr) => T.ass?.[addr] ?? wbValue(addr);
const PARTS = [['A', 'Material', '#c27a2c'], ['B', 'Bought-outs', '#2563eb'], ['C', 'Fabrication & coil making', '#0ea5a4'], ['D', 'Overheads', '#64748b'], ['E', 'Margin', '#0f9d6b']];

/** length of each AHU section in metres, in flow order (matches the workbook's total length) */
export function sectionsOf(kind, c, T) {
  if (kind === 'fcu') { const L = A(T, 'C' + ({ 'Ceiling concealed': 89, Cassette: 90, Ducted: 91, 'Floor standing': 92 }[c.type] || 89)); return [{ id: 'coil', label: 'Coil', len: L * 0.4 }, { id: 'fan', label: 'Blower', len: L * 0.6 }]; }
  const s = [];
  if (c.mix === 'Y') s.push({ id: 'mix', label: 'Mixing box', len: A(T, 'C13') });
  s.push({ id: 'pre', label: 'Pre-filter', len: A(T, 'C14') });
  if (c.filter === 'Pre+Fine' || c.filter === 'Pre+Fine+HEPA') s.push({ id: 'fine', label: 'Fine filter', len: A(T, 'C15') });
  if (c.filter === 'Pre+Fine+HEPA') s.push({ id: 'hepa', label: 'HEPA', len: A(T, 'C16') });
  s.push({ id: 'cool', label: `Cooling coil · ${c.rows} rows`, len: A(T, 'C17') + c.rows * A(T, 'C18') });
  if (c.heat === 'Y') s.push({ id: 'heat', label: 'Heating coil', len: A(T, 'C19') });
  s.push({ id: 'fan', label: 'Fan section', len: A(T, 'C20') });
  if (c.hum === 'Y') s.push({ id: 'hum', label: 'Humidifier', len: A(T, 'C21') });
  return s;
}

const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export const ahuDef = {
  key: 'mf', name: 'AHU & FCU', ratesTitle: 'Rates · ₹/kg and bought-outs', qtyLabel: 'units',
  ratesNote: 'Material prices are the workbook’s own. Bought-out rates (fan, VFD, filters, dampers) are indicative placeholders in the workbook, so confirm them with vendor quotes.',
  masterNote: 'Every price, density and assumption from the workbook, editable. Changes apply to all tabs and are kept in this browser.', resetLabel: 'Reset to workbook values',
  calcNote: 'The workbook’s formulas are evaluated directly. The columns below are the cells of the batch calculator row for this unit.',
  sectionHint: 'Elevation drawn from the computed section lengths and casing size',
  views: [['section', 'Layout'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st[st.kind],
  maxRows: (st) => MAX_ROWS[st.kind],
  units: {
    cfm: { label: '₹/CFM', dec: 1, fn: (v, r) => v / r.cfg.cfm },
    unit: { label: '₹/unit', dec: 0, fn: (v) => v },
    tr: { label: '₹/TR', dec: 0, fn: (v, r) => (r.cfg.tr > 0 ? v / r.cfg.tr : NaN) },
  },
  compute(st) {
    const kind = st.kind, g = st[kind], res = runBatch(kind, g.list, st.T);
    return res.map((r, i) => {
      if (r.error) return { error: `Workbook returned ${r.error}` };
      const c = g.list[i];
      if (!(c.cfm > 0)) return { error: 'Enter an airflow above zero' };
      const total = r.total, parts = PARTS.map(([k, l, col]) => ({ k, l, col, v: r[k] }));
      return { ...r, kind, cfg: c, total, parts, sections: sectionsOf(kind, c, st.T), asm: (a) => A(st.T, a), T: st.T };
    });
  },
  title: (r) => `${r.cfg.tag || (r.kind === 'ahu' ? 'AHU' : 'FCU')} · ${fmt(r.cfg.cfm)} CFM`,
  meta: (r) => (r.kind === 'ahu'
    ? `${r.cfg.casing} ${r.cfg.mat} · ${r.cfg.ins} ${r.cfg.insThk} mm · ${r.cfg.fan} ${fmt(r.motor, 1)} kW · ${r.cfg.rows}-row coil`
    : `${r.cfg.type} FCU · ${r.cfg.mat} · ${r.cfg.ins} ${r.cfg.insThk} mm · ${r.cfg.rows}-row coil`),
  pillOf: (r) => (r.kind === 'ahu' ? 'AHU' : 'FCU'),
  metrics: (r) => [['Casing W×H×L (m)', `${r.W.toFixed(2)} × ${r.H.toFixed(2)} × ${r.L.toFixed(2)}`], ['Weight', `${fmt(r.weight)} kg`], ['Copper + fin', `${fmt(r.cuKg)} + ${fmt(r.alKg)} kg`], [r.kind === 'ahu' ? 'Fan motor' : 'Blower', r.kind === 'ahu' ? `${fmt(r.motor, 1)} kW` : `${fmt(r.blowerW)} W`]],
  scene: (r, view) => ahuScene(r, view === 'cut'),
  section: (r) => ahuSectionSVG(r),

  left(st, r, h) {
    const kind = st.kind, c = st[kind].list[st[kind].sel], o = OPTIONS[kind], yn = [['Y', 'Yes'], ['N', 'No']];
    const toggle = `<div class="toggle2">${[['ahu', 'AHU'], ['fcu', 'FCU']].map(([k, l]) => `<button data-mset="$kind" data-mv='"${k}"' class="${kind === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const sel = `<div class="label">Unit <small>${st[kind].list.length} in batch</small></div>${h.sel(st[kind].list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Unit'}`]), st[kind].sel, '$' + kind + '.sel')}`;
    const mats = o.mat.map((m) => [m, m]);
    if (kind === 'fcu') return `${toggle}${sel}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Duty</div>
      ${h.slider('Airflow', 'cfm', c.cfm, 200, 3000, 50, 'CFM')}${h.num('Capacity', 'tr', c.tr, 0.25, 'TR')}
      <div class="label">Type</div>${h.seg(o.type.map((t) => [t, t.replace('Ceiling concealed', 'Concealed').replace('Floor standing', 'Floor')]), c.type, 'type')}
      ${c.type === 'Ducted' ? h.slider('External static (ducted)', 'esp', c.esp, 0, 150, 5, 'Pa') : ''}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Construction</div>
      <div class="label">Casing material</div>${h.seg(mats, c.mat, 'mat')}
      <div class="label">Panel thickness <small>mm</small></div>${h.chips([0.5, 0.6, 0.8, 1].map((v) => [v, v]), c.panel, 'panel')}
      <div class="label">Insulation</div>${h.seg(o.ins.map((m) => [m, m]), c.ins, 'ins')}
      <div class="label">Insulation thickness <small>mm</small></div>${h.chips([10, 13, 19, 25].map((v) => [v, v]), c.insThk, 'insThk')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Coil</div>
      ${h.slider('Rows', 'rows', c.rows, 2, 6, 1, '')}
      <div class="label">Fins per inch</div>${h.chips([8, 10, 12, 14].map((v) => [v, v]), c.fpi, 'fpi')}
      <div class="label">Fin material</div>${h.seg(o.fin.map((m) => [m, m === 'Copper tube' ? 'Copper fin' : 'Aluminium']), c.fin, 'fin')}`;
    return `${toggle}${sel}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Duty</div>
      ${h.slider('Airflow', 'cfm', c.cfm, 1000, 80000, 500, 'CFM')}${h.num('Cooling duty', 'tr', c.tr, 1, 'TR · reported only')}${h.num('Heating duty', 'kw', c.kw, 1, 'kW · reported only')}
      ${h.slider('External static pressure', 'esp', c.esp, 50, 800, 25, 'Pa')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Casing</div>
      <div class="label">Skin</div>${h.seg(o.casing.map((m) => [m, m]), c.casing, 'casing')}
      <div class="label">Material</div>${h.seg(mats, c.mat, 'mat')}
      <div class="label">Panel thickness <small>mm</small></div>${h.chips([0.63, 0.8, 1, 1.5].map((v) => [v, v]), c.panel, 'panel')}
      <div class="label">Insulation</div>${h.seg(o.ins.map((m) => [m, m]), c.ins, 'ins')}
      <div class="label">Insulation thickness <small>mm</small></div>${h.chips([13, 25, 38, 50].map((v) => [v, v]), c.insThk, 'insThk')}
      <div class="label">Mounting</div>${h.seg(o.mount.map((m) => [m, m.replace(' mounted', '').replace('Ceiling suspended', 'Suspended')]), c.mount, 'mount')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Coil &amp; fan</div>
      ${h.slider('Cooling coil rows', 'rows', c.rows, 2, 12, 1, '')}
      <div class="label">Fins per inch</div>${h.chips([8, 10, 12, 14].map((v) => [v, v]), c.fpi, 'fpi')}
      <div class="label">Fin material</div>${h.seg(o.fin.map((m) => [m, m === 'Copper tube' ? 'Copper fin' : 'Aluminium']), c.fin, 'fin')}
      <div class="label">Fan</div>${h.seg(o.fan.map((m) => [m, m]), c.fan, 'fan')}
      <div class="label">VFD</div>${h.seg(yn, c.vfd, 'vfd')}
      <hr class="divider"><div class="sec-h"><span class="step">4</span>Sections</div>
      <div class="label">Filters</div>${h.seg(o.filter.map((m) => [m, m.replace('Pre+Fine+HEPA', '+ HEPA').replace('Pre+Fine', 'Pre + fine').replace('Pre only', 'Pre only')]), c.filter, 'filter')}
      <div class="label">Air</div>${h.seg(o.air.map((m) => [m, m.replace('Mixed (return+fresh)', 'Mixed').replace('100% fresh air', '100% fresh')]), c.air, 'air')}
      <div class="two2"><div><div class="label">Mixing box</div>${h.seg(yn, c.mix, 'mix')}</div><div><div class="label">Heating coil</div>${h.seg(yn, c.heat, 'heat')}</div></div>
      <div class="label">Humidifier</div>${h.seg(yn, c.hum, 'hum')}`;
  },

  rates(st) {
    const kind = st.kind, m = st.T[kind].price, CID = { 'Copper tube': 'copper_tube', 'Aluminium fin': 'al_fin', 'GI sheet': 'gi_hvac', 'Pre-coated GI': 'precoated_gi', 'SS 304': 'ss304', PUF: 'puf', Rockwool: 'rockwool' };
    const rows = MATERIALS.map((x) => ({ label: x, path: `${kind}.price.${x}`, value: m[x], unit: '₹/kg', cid: CID[x], price: true }));
    const b = kind === 'ahu' ? [['Plug fan + motor', 'C64', '₹/kW'], ['Belt-driven fan + motor', 'C65', '₹/kW'], ['VFD', 'C66', '₹/kW'], ['Pre-filter', 'C67', '₹/m²'], ['Fine filter', 'C68', '₹/m²'], ['HEPA filter', 'C69', '₹/m²'], ['Damper', 'C70', '₹/m²']]
      : [['FCU blower, fixed', 'C71', '₹/unit'], ['FCU blower, variable', 'C72', '₹/W']];
    return [...rows, ...b.map(([label, a, unit]) => ({ label, path: `ass.${a}`, value: A(st.T, a), unit }))];
  },
  isPricePath: (p) => /\.price\./.test(p),

  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['sizing', 'Sizing cascade', (r, st, h) => sizing(r, h)],
    ['bench', 'Benchmark', (r, st, h) => bench(r, h)],
  ],
  batchTitle: (st) => `${st.kind === 'ahu' ? 'AHU' : 'FCU'} batch · one row per unit`,
  batchCols: [['CFM', (c) => fmt(c.cfm), 1], ['TR', (c) => c.tr ?? '–', 1], ['Weight kg', (c, r) => fmt(r.weight), 1], ['₹/CFM', (c, r) => fmt(r.perCfm, 1), 1], ['₹/TR', (c, r) => (r.perTr === '' ? '–' : fmt(r.perTr)), 1]],

  calcRows(r, st) {
    const k = r.kind, f = (v, d = 2) => fmt(v, d), a = (x) => A(st.T, x);
    const col1 = [['#', 'Air side'], ['Airflow (CMH)', f(r.cmh, 0)], ['Airflow (m³/s)', f(r.ms, 3)], ['Coil face area (m²)', f(r.face, 3)], ['Casing cross-section (m²)', f(r.cross, 3)], ['Width × height × length (m)', `${f(r.W)} × ${f(r.H)} × ${f(r.L)}`], ['Casing surface (m²)', f(r.surface, 2)],
      ['#', 'Coil'], ['Coil height × length (m)', `${f(r.Hf)} × ${f(r.Lf)}`], ['Tubes per row / total', `${f(r.tubesRow, 1)} / ${f(r.tubesTot, 0)}`], ['Tube length (m)', f(r.tubeLen, 0)], ['Number of fins', f(r.nFins, 0)], ['Coil depth (m)', f(r.depth, 4)], ['Copper (kg)', f(r.cuKg, 1)], ['Aluminium / fin (kg)', f(r.alKg, 1)],
      ['#', 'Static pressure & drive'], ['Internal static (Pa)', f(r.isp, 0)], ['Total static (Pa)', f(r.tsp, 0)], k === 'ahu' ? ['Fan power (kW) → motor (kW)', `${f(r.fanKw, 2)} → ${f(r.motor, 1)}`] : ['Blower input (W)', f(r.blowerW, 0)]];
    const col2 = [['#', 'Weights'], ['Sheet (kg)', f(r.sheetKg, 1)], ['Insulation (kg)', f(r.insKg, 1)], ...(k === 'ahu' ? [['Frame / profile (kg)', f(r.frameKg, 1)], ['Drain pan (kg)', f(r.panKg, 1)]] : [['Drain pan (kg)', f(r.panKg, 1)]]), ['Total weight (kg)', f(r.weight, 1)],
      ['#', 'Cost stack (₹)'], ['A  Material', f(r.A, 0)], ['B  Bought-outs', f(r.B, 0)], ['C  Fabrication & coil making', f(r.C, 0)], ['D  Overheads', f(r.D, 0)], ['E  Margin', f(r.E, 0)], ['Total', f(r.total, 0)],
      ['#', 'Assumptions in use'], ['Face velocity (m/s)', a(k === 'ahu' ? 'C6' : 'C7')], ['Coil / casing area ratio', a('C8')], ['Casing W : H', a('C9')], ['Overheads / margin', `${(a('C84') * 100).toFixed(0)}% / ${(a('C85') * 100).toFixed(0)}%`]];
    return [col1, col2];
  },

  master(st) {
    const kind = st.kind, rows = assumptionRows(), secs = {};
    const unitScale = (u) => (typeof u === 'string' && u.trim().startsWith('%') ? 100 : 1);
    const T = st.T;
    const out = [{ title: `Material master · ${kind.toUpperCase()} sheet`, note: 'Prices and densities; AHU and FCU keep separate copies, as in the workbook.', rows: [...MATERIALS.map((m) => [`${m} price`, `${kind}.price.${m}`, T[kind].price[m], 1, 1, '₹/kg']), ...MATERIALS.map((m) => [`${m} density`, `${kind}.density.${m}`, T[kind].density[m], 1, 1, 'kg/m³'])] }];
    for (const x of rows) {
      if (x.section.startsWith('STANDARD MOTOR')) continue;
      const push = (label, addr, v) => { (secs[x.section] ||= []).push([label, `ass.${addr}`, T.ass[addr] ?? v, 'any', unitScale(x.unit), x.unit.replace(/^%\s*/, '% ')]); };
      if (x.r >= 25 && x.r <= 31) { push(`${x.label} · AHU`, x.addr, x.value); push(`${x.label} · FCU`, `D${x.r}`, wbValue(`D${x.r}`)); } else if (!x.text) push(x.label, x.addr, x.value);
    }
    for (const [title, r] of Object.entries(secs)) out.push({ title: title.replace(/\s+\(.*$/, ''), rows: r });
    out.push({ title: 'Standard motor sizes (kW)', note: 'The next size up from the calculated fan power is selected. Edit the list on the workbook’s Assumptions sheet if larger motors are needed.', rows: motorSizes().map((m, i) => [`Size ${i + 1}`, `motors.${i}`, m, 'any', 1, 'kW']) });
    return out;
  },
  reset(st) { const d = ahuDefault(); st.T = d.T; st.ahu.list = d.ahu.list; st.fcu.list = d.fcu.list; st.ahu.sel = st.fcu.sel = 0; },
  afterEdit(st, path) { const g = st[st.kind]; if (g.sel >= g.list.length) g.sel = 0; },
};

/* ---------- bottom tabs ---------- */
function anatomy(r, h) {
  const { nf, pct } = h, k = r.kind, c = r.cfg, T = r.T, P = T[k].price, a = r.asm;
  const fin = P[c.fin];
  const mat = [['Copper tube', `${nf(r.tubeLen)} m of ${k === 'ahu' ? '½"' : '⅜"'} tube`, r.cuKg, r.cuKg * P['Copper tube']], [c.fin === 'Copper tube' ? 'Copper fin' : 'Aluminium fin', `${nf(r.nFins)} fins`, r.alKg, r.alKg * fin],
    [`Casing sheet (${c.mat})`, `${nf(r.surface, 1)} m² × ${c.casing === 'Double skin' || k === 'fcu' ? '2 skins' : '1 skin'} × ${c.panel} mm`, r.sheetKg, r.sheetKg * r.sheetPx], [`Insulation (${c.ins})`, `${nf(r.surface, 1)} m² × ${c.insThk} mm`, r.insKg, r.insKg * r.insPx],
    ...(k === 'ahu' ? [['Frame / profile', 'extruded profile on the edges', r.frameKg, r.frameRs]] : []), ['Drain pan (SS 304)', '1 mm stainless', r.panKg, r.panRs]];
  const bo = k === 'ahu' ? [[`${c.fan} + motor`, `${nf(r.motor, 1)} kW selected`, r.fanRs], [c.vfd === 'Y' ? 'VFD' : 'VFD (none)', c.vfd === 'Y' ? `${nf(r.motor, 1)} kW` : 'not fitted', r.vfdRs], ['Filters', `${nf(r.filterM2, 1)} m² · ${c.filter}`, r.filterRs], ['Dampers', `${nf(r.damperM2, 1)} m²`, r.damperRs]]
    : [['Blower + motor', `${nf(r.blowerW)} W input`, r.blowerRs]];
  const conv = k === 'ahu' ? (r.sheetKg + r.frameKg) * a('C78') : r.sheetKg * a('C79'), coilMake = (r.cuKg + r.alKg) * a('C80');
  const row = (n, b, w, v, base) => `<tr><td>${n}</td><td class="mut">${b}</td><td class="r">${w != null ? nf(w, 1) : '–'}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${(v / base) * 100}%"></i></div></td></tr>`;
  let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one unit</div><p class="p">The workbook’s Material (A), Bought-out (B) and Conversion (C) groups, then overheads and margin on top.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Component</th><th>Basis</th><th class="r">Weight kg</th><th class="r">Cost</th><th>Share of group</th></tr></thead><tbody>
    <tr><td colspan="5" class="grp2"><b>A · Material</b> ₹${nf(r.A)}</td></tr>${mat.map(([n, b, w, v]) => row(n, b, w, v, r.A)).join('')}
    <tr><td colspan="5" class="grp2"><b>B · Bought-outs</b> ₹${nf(r.B)}</td></tr>${bo.map(([n, b, v]) => row(n, b, null, v, r.B)).join('')}
    <tr><td colspan="5" class="grp2"><b>C · Fabrication &amp; coil making</b> ₹${nf(r.C)}</td></tr>${row('Casing assembly', `₹${a(k === 'ahu' ? 'C78' : 'C79')}/kg on sheet${k === 'ahu' ? ' + frame' : ''}`, null, conv, r.C)}${row('Coil manufacture', `₹${a('C80')}/kg on copper + fin`, null, coilMake, r.C)}
    </tbody></table></div>
    <div class="h3" style="margin-top:22px">From material to selling price</div><p class="p">Overheads ${pct(a('C84'), 0)} of A+B+C; margin ${pct(a('C85'), 0)} of A+B+C+D.</p>
    <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}
    <div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Total</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">₹${nf(r.total)}</b></div></div>`;
}
function sizing(r, h) {
  const { nf } = h, k = r.kind, a = r.asm;
  const steps = [['Airflow', `${nf(r.cfg.cfm)} CFM × ${a('C10')} = ${nf(r.cmh)} m³/h = ${nf(r.ms, 2)} m³/s`], ['Coil face area', `${nf(r.ms, 2)} ÷ ${a(k === 'ahu' ? 'C6' : 'C7')} m/s face velocity = ${nf(r.face, 2)} m²`], ['Casing cross-section', `${nf(r.face, 2)} ÷ ${a('C8')} coil fill = ${nf(r.cross, 2)} m²`], ['Width × height', `aspect ${a('C9')} → ${nf(r.W, 2)} × ${nf(r.H, 2)} m`],
    ['Casing length', `${r.sections.map((s) => `${s.label} ${nf(s.len, 2)}`).join(' + ')} = ${nf(r.L, 2)} m`], ['Sheet weight', `${nf(r.surface, 1)} m² × skins × ${r.cfg.panel} mm × ${nf(r.sheetPx ? 7850 : 0)} kg/m³ × (1 + ${a('C75') * 100}% scrap) = ${nf(r.sheetKg, 0)} kg`],
    ['Coil copper', `${nf(r.tubesRow, 0)} tubes/row × ${r.cfg.rows} rows × ${nf(r.Lf, 2)} m + bends = ${nf(r.tubeLen, 0)} m → ${nf(r.cuKg, 0)} kg`], ['Fan power', `${nf(r.ms, 2)} m³/s × ${nf(r.tsp, 0)} Pa ÷ efficiency = ${k === 'ahu' ? nf(r.fanKw, 1) + ' kW → ' + nf(r.motor, 1) + ' kW motor' : nf(r.blowerW) + ' W'}`]];
  return `<div class="h3">How airflow becomes weight</div><p class="p">Coil face area is sized on face velocity, not a thermal calculation: cooling duty is reported per TR but does not size rows or fins, so an inconsistent duty and geometry combination is not flagged (workbook Read Me).</p>
    <div class="scroll"><table class="t num"><tbody>${steps.map(([n, b], i) => `<tr><td><span class="step" style="margin-right:8px">${i + 1}</span>${n}</td><td class="mut">${b}</td></tr>`).join('')}</tbody></table></div>`;
}
function bench(r, h) {
  const { nf } = h, lo = 40, hi = 50, v = r.perCfm;
  if (r.kind === 'fcu') return `<div class="h3">Benchmark</div><p class="p">The workbook gives no benchmark for FCUs. This unit models at ₹${nf(v, 1)}/CFM and ₹${r.perTr === '' ? '–' : nf(r.perTr)}/TR.</p>`;
  const x = (q) => Math.max(0, Math.min(100, (q / 100) * 100));
  const where = v < lo ? 'below' : v > hi ? 'above' : 'inside';
  return `<div class="h3">AHU benchmark · ₹${lo}–${hi} per CFM</div><p class="p">The workbook’s Read Me compares its seeded cases with a benchmark of ₹${lo}–${hi}/CFM supplied by the client. This unit models at <b>₹${nf(v, 1)}/CFM</b>, ${where} that band.</p>
    <div class="track" style="margin:26px 0 8px;position:relative"><i style="left:${x(lo)}%;right:${100 - x(hi)}%;background:#bfe3cf"></i><b class="mk" style="left:${x(v)}%"></b></div>
    <div class="ends num"><span>₹0</span><span style="margin-left:auto">₹100 per CFM</span></div>
    <p class="note" style="padding:12px 0 0">Heavier specifications (stainless casing, HEPA, many coil rows) and stripped single-skin units land outside the band by design, as the Read Me notes. The workbook’s copper tube price is ₹1,400/kg while its Read Me text quotes ₹880/kg and a ₹750–950/kg market listing, so check that rate before relying on absolute ₹/CFM.</p>`;
}
