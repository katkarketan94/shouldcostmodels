// Control / instrumentation / thermocouple cable definition for the generic equipment UI.
import { ciDefault, computeCI, FAMILIES, SIZES, INSUL, SHEATH, SHIELDS, ARMOURS, TC_TYPES, CI_DEFAULTS } from './calc.js';
import { ciScene, ciSectionSVG } from './scene.js';

export { ciDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Metal', '#c27a2c'], ['Insulation & sheath', '#2563eb'], ['Screen & armour', '#8b5cf6'], ['Conversion', '#0ea5a4'], ['Overheads', '#64748b'], ['Margin', '#0f9d6b']];

export const ciDef = {
  key: 'mf', name: 'cable', ratesTitle: 'Rates · commodity and conversion', qtyLabel: 'metres',
  ratesNote: 'Not from a workbook: constructions are built layer by layer; conversion rates and compound premiums are engineering assumptions. Metal and compound prices follow the common commodity file.',
  masterNote: 'Material rates, conversion costs, geometry rules and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Every layer’s diameter, area and weight from the construction, then material and conversion cost per km.',
  sectionHint: 'Cross-section drawn to scale from the calculated diameters',
  views: [['section', 'Cross-section'], ['cut', '3D stripped'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 40,
  units: { m: { label: '₹/m', dec: 1, fn: (v) => v }, km: { label: '₹/km', dec: 0, fn: (v) => v * 1000 }, kg: { label: '₹/kg', dec: 0, fn: (v, r) => v * 1000 / r.kgKm } },
  compute(st) { return st.list.map((c) => { const r = computeCI(c, st.T); if (r.error) return r; return { ...r, total: r.total, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: (r.groups[k] || 0) / 1000 })) }; }); },
  qtyTotal: (r, q) => r.total * q,
  title: (r) => `${r.cfg.tag || 'Cable'} · ${r.name}`,
  meta: (r) => `${FAMILIES[r.cfg.family]} · ${r.cfg.volt} · ${r.alloy ? r.cfg.tc : r.cfg.cond} · ${r.cfg.insul} / ${r.cfg.sheath}`,
  pillOf: (r) => (r.cfg.family === 'control' ? 'Control' : r.cfg.family === 'instr' ? 'Instrumentation' : 'Thermocouple'),
  metrics: (r) => [['Overall diameter', `${r.D4.toFixed(1)} mm`], ['Weight', `${fmt(r.kgKm)} kg/km`], [r.alloy ? 'Conductor alloys' : 'Copper', r.alloy ? `${fmt(r.m.alloyA + r.m.alloyB)} kg/km` : `${fmt(r.m.cu)} kg/km`], ['Sheath wall', `${r.tS.toFixed(2)} mm`]],
  scene: (r, view) => ciScene(r, view === 'cut'), section: (r) => ciSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], fam = c.family, sizes = SIZES[fam], instr = fam !== 'control';
    const first = { control: { n: 7, size: 1.5, volt: '650/1100 V', shield: 'None' }, instr: { n: 4, size: 1, volt: '300/500 V', shield: 'Overall Al-Mylar', elem: 'Pair' }, tc: { n: 2, size: 1.5, volt: '300/500 V', shield: 'Overall Al-Mylar', elem: 'Pair' } };
    return `<div class="label">Cable <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Cable'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Family</div>
      <div class="fam" style="grid-template-columns:repeat(1,1fr)">${Object.entries(FAMILIES).map(([k, l]) => `<button data-mset="family" data-mv='"${k}"' class="${fam === k ? 'on' : ''}"><span>${l}</span></button>`).join('')}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Size</div>
      ${h.num(instr ? 'Pairs / triples' : 'Cores', 'n', c.n, 1, '')}
      <div class="label">Conductor <small>mm²</small></div>${h.chips(sizes.map((s) => [s, s]), c.size, 'size')}
      ${instr ? `<div class="label">Element</div>${h.seg([['Pair', 'Pair'], ['Triple', 'Triple']], c.elem, 'elem')}` : ''}
      ${fam === 'tc' ? `<div class="label">Thermocouple type</div>${h.sel(Object.keys(TC_TYPES).map((k) => [k, k]), c.tc, 'tc')}` : `<div class="label">Conductor</div>${h.seg([['Copper', 'Copper'], ['Tinned copper', 'Tinned']], c.cond, 'cond')}`}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Construction</div>
      <div class="label">Voltage grade</div>${h.seg([['300/500 V', '300/500 V'], ['650/1100 V', '650/1100 V']], c.volt, 'volt')}
      <div class="label">Insulation</div>${h.sel(Object.keys(INSUL).map((k) => [k, k]), c.insul, 'insul')}
      ${instr ? `<div class="label">Screening</div>${h.sel(SHIELDS.map((k) => [k, k]), c.shield, 'shield')}` : `<div class="label">Screening</div>${h.sel(['None', 'Overall Al-Mylar', 'Overall Cu braid'].map((k) => [k, k]), c.shield, 'shield')}`}
      <div class="label">Armour</div>${h.sel(ARMOURS.map((k) => [k, k]), c.armour, 'armour')}
      <div class="label">Outer sheath</div>${h.sel(Object.keys(SHEATH).map((k) => [k, k]), c.sheath, 'sheath')}
      ${r && r.warn && r.warn.length ? `<div class="banner" style="margin-top:14px"><div>${r.warn.join(' ')}</div></div>` : ''}`;
  },
  afterEdit(st, path) {
    const c = st.list[st.sel]; if (path !== 'family') return;
    const f = { control: { n: 7, size: 1.5, volt: '650/1100 V', shield: 'None' }, instr: { n: 4, size: 1, volt: '300/500 V', shield: 'Overall Al-Mylar', elem: 'Pair' }, tc: { n: 2, size: 1.5, volt: '300/500 V', shield: 'Overall Al-Mylar', elem: 'Pair' } }[c.family];
    Object.assign(c, f); if (c.family === 'tc') c.cond = 'Copper';
  },
  rates(st) {
    const R = st.T.rates, c = st.list[st.sel];
    return [{ label: 'Copper', path: 'rates.copper', value: R.copper, unit: '₹/kg', cid: 'copper', price: true }, { label: 'PVC compound', path: 'rates.pvc', value: R.pvc, unit: '₹/kg', cid: 'pvc', price: true }, { label: 'XLPE compound', path: 'rates.xlpe', value: R.xlpe, unit: '₹/kg', cid: 'xlpe', price: true },
      { label: 'Galvanised steel wire', path: 'rates.steel_wire', value: R.steel_wire, unit: '₹/kg', cid: 'steel_wire', price: true }, { label: 'FRLS PVC compound', path: 'rates.frls', value: R.frls, unit: '₹/kg' }, { label: 'LSZH compound', path: 'rates.lszh', value: R.lszh, unit: '₹/kg' }, { label: 'Al-Mylar tape', path: 'rates.alMylarPerM2', value: R.alMylarPerM2, unit: '₹/m²' }, ...(c.family === 'tc' ? [{ label: `${TC_TYPES[c.tc].b}`, path: 'rates.x', value: TC_TYPES[c.tc].rb, unit: '₹/kg (see Master Data)' }] : [])].filter((x) => x.path !== 'rates.x' || false);
  },
  isPricePath: (p) => /^rates\.(copper|pvc|xlpe|steel_wire)$/.test(p),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['build', 'Layer build-up', (r, st, h) => layers(r, h)],
    ['basis', 'Method', () => method()],
  ],
  batchTitle: () => 'Cable batch · one row per construction',
  batchCols: [['Family', (c) => ({ control: 'Control', instr: 'Instrumentation', tc: 'Thermocouple' }[c.family])], ['Cores / pairs', (c) => c.n, 1], ['mm²', (c) => c.size, 1], ['OD mm', (c, r) => r.D4.toFixed(1), 1], ['kg/km', (c, r) => fmt(r.kgKm), 1]],
  calcRows(r) {
    const f = (v, d = 2) => fmt(v, d);
    return [[['#', 'Geometry (mm)'], ['Conductor diameter', f(r.d)], ['Insulation wall', f(r.tIns)], ['Insulated core', f(r.dc)], ['Element (pair / triple / core)', f(r.dElem)], ['Cabled core', f(r.Dlay, 1)], ['Over screen / tape', f(r.D1, 1)], ['Over bedding', f(r.D2, 1)], ['Over armour', f(r.D3, 1)], ['Sheath wall', f(r.tS)], ['Overall diameter', f(r.D4, 1)],
      ['#', 'Weights (kg/km)'], ...Object.entries(r.m).filter(([, v]) => v > 0).map(([k, v]) => [k, f(v, 1)]), ['Total', f(r.kgKm, 0)]],
    [['#', 'Cost per km (₹)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Overheads', f(r.groups.Overheads, 0)], ['Margin', f(r.groups.Margin, 0)], ['Total per km', f(r.totalKm, 0)], ['Per metre', f(r.total, 2)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un];
    const sec = (title, base, obj, un = '', pct = false) => ({ title, rows: Object.keys(obj).map((k) => P(`${base}.${k}`, k.replace(/([A-Z])/g, ' $1').toLowerCase(), obj[k], pct ? '%' : un, pct ? 100 : 1)) });
    return [sec('Materials and compounds', 'rates', T.rates, '₹/kg · ₹/m²'), sec('Conversion costs', 'conv', T.conv, '₹/kg · ₹/m per km basis'), sec('Geometry rules', 'geometry', T.geometry), sec('Cost stack', 'stack', T.stack, '', true)];
  },
  reset(st) { const d = ciDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const tot = r.totalKm, wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Cost of one kilometre</div><p class="p">Each layer is weighed from its calculated cross-section and priced at its material rate; conversion is charged per kg or per metre of process. Per-metre figures are the km figure divided by 1,000.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">₹ per km</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const t = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(t)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${l.group === 'Conversion' ? '–' : `${nf(l.qty, 1)} ${l.unit}`}</td><td class="r">${l.group === 'Conversion' ? '–' : nf(l.rate, 1)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / t * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Overheads and margin</b></td></tr><tr><td>Overheads</td><td></td><td></td><td class="r">₹${nf(r.groups.Overheads)}</td><td></td></tr><tr><td>Margin</td><td></td><td></td><td class="r">₹${nf(r.groups.Margin)}</td><td></td></tr><tr class="total"><td>Should-cost per km</td><td></td><td></td><td class="r">₹${nf(tot)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 * 1000 / tot) * 100}%;width:${Math.max((s.v * 1000 / tot) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v * 1000)}</span></div>`).join('')}</div>`;
}
function layers(r, h) {
  const { nf } = h, rows = [['Conductor', r.d, null], ['Insulated core', r.dc, r.tIns], ['Cabled core', r.Dlay, null], ['Over screen / tape', r.D1, null], ...(r.armoured ? [['Over bedding', r.D2, r.bed], ['Over armour', r.D3, r.armT]] : []), ['Overall', r.D4, r.tS]];
  return `<div class="h3">Diameter build-up</div><p class="p">Core insulation walls follow IEC 60502 / IS 1554 practice for the voltage grade; the sheath is 0.035 × diameter + 1.0 mm (0.7 mm unarmoured), never below the minimum for the construction.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Layer</th><th class="r">Diameter mm</th><th class="r">Wall mm</th></tr></thead><tbody>${rows.map(([n, d, t]) => `<tr><td>${n}</td><td class="r">${nf(d, 2)}</td><td class="r">${t == null ? '–' : nf(t, 2)}</td></tr>`).join('')}</tbody></table></div>`;
}
function method() {
  return `<div class="h3">How it is built up</div><p class="p">Conductors are class-2 stranded copper (tinned optional) at the IEC 60228 diameter. Insulated cores are laid up (pairs and triples twisted first), taped, optionally screened, bedded, armoured and sheathed. Every volume is a ring area times the compound density; armour wire count fills about 92% of the circumference. Thermocouple extension cable uses the thermocouple alloys (KX, JX, TX, NX) or the cheaper copper-based compensating pairs.</p>
    <p class="note" style="padding:6px 0">This is an own model, not a workbook: the conversion rates, the FRLS / LSZH premiums and the alloy prices are assumptions. Replace them with your supplier’s conversion quotations. Copper, PVC, XLPE and armour steel follow the common commodity file.</p>`;
}
