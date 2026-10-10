// Pump definition for the generic equipment UI.
import { pumpDefault, computePump, TYPES, CATS, MATERIALS, SEALS, PUMP_DEFAULTS, computePump as _c } from './calc.js';
import { pumpScene, pumpCurveSVG } from './scene.js';

export { pumpDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Wetted parts & casting', '#c27a2c'], ['Rotating assembly & sealing', '#0ea5a4'], ['Drive & bought-outs', '#2563eb'], ['Baseplate, column & accessories', '#8b5cf6'], ['Machining, assembly & test', '#94a3b8'], ['Overheads', '#64748b'], ['Margin', '#0f9d6b']];

export const pumpDef = {
  key: 'mf', name: 'pump', ratesTitle: 'Rates · materials and bought-outs', qtyLabel: 'pumps',
  ratesNote: 'Not from a workbook: every rate and constant is an engineering assumption. Replace with vendor quotes before relying on the numbers.',
  masterNote: 'Material and seal rates, drive and accessory rates, and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Duty gives hydraulic kW; efficiency gives shaft kW; the motor is the next standard size with margin (fire pumps also cover 150% flow); weight follows shaft kW and stages.',
  sectionHint: 'Indicative performance curve with the duty point',
  views: [['curve', 'Performance'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 30,
  units: { unit: { label: '₹/pump', dec: 0, fn: (v) => v }, kw: { label: '₹/kW motor', dec: 0, fn: (v, r) => v / r.motorKw }, flow: { label: '₹ per m³/h', dec: 0, fn: (v, r) => v / r.Q } },
  compute(st) { return st.list.map((c) => { const r = computePump(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.groups[k] || 0 })) }; }); },
  title: (r) => `${r.cfg.tag || 'Pump'} · ${fmt(r.Q, r.Q < 20 ? 1 : 0)} m³/h at ${fmt(r.head)} m`,
  meta: (r) => `${r.ty.label} · ${r.cfg.material} · ${r.stages} stage${r.stages > 1 ? 's' : ''} · ${r.ty.drive === 'diesel' ? 'diesel engine' : r.ty.drive === 'sub' ? 'submersible motor' : 'electric motor'}`,
  pillOf: (r) => r.ty.cat,
  metrics: (r) => [['Efficiency', `${(r.eta * 100).toFixed(0)}%`], ['Shaft / motor', `${fmt(r.shaft, 1)} / ${fmt(r.motorKw, r.motorKw < 10 ? 1 : 0)} kW`], ['Pressure', `${fmt(r.bar, 1)} bar`], ['Weight', `${fmt(r.weight)} kg`]],
  scene: (r, view) => pumpScene(r, view === 'cut'),
  section: (r) => pumpCurveSVG(r),
  tabs: undefined,

  left(st, r, h) {
    const c = st.list[st.sel], ty = TYPES[c.type], cat = ty.cat;
    const types = Object.entries(TYPES).filter(([, t]) => t.cat === cat);
    const first = (k) => Object.entries(TYPES).find(([, t]) => t.cat === k)[0];
    return `<div class="label">Pump <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Pump'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Family and type</div>
      ${h.chips(CATS.map((k) => [first(k), k]), first(cat), 'type')}
      <div class="fam" style="grid-template-columns:repeat(1,1fr);margin-top:8px">${types.map(([k, t]) => `<button data-mset="type" data-mv='"${k}"' class="${c.type === k ? 'on' : ''}"><span>${t.label}</span></button>`).join('')}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>
      <div class="two2"><div>${h.num('Flow', 'flow', c.flow, 'any', 'm³/h')}</div><div>${h.num('Differential head', 'head', c.head, 'any', 'm')}</div></div>
      <div class="two2"><div>${h.num('Specific gravity', 'sg', c.sg, 0.01, '')}</div><div>${h.num('Viscosity', 'visc', c.visc, 1, 'cSt')}</div></div>
      <div class="note" style="padding:6px 0 0">${fmt(c.flow * 1000 / 60, 0)} lpm · ${fmt(c.flow * 4.4029, 0)} gpm · ${fmt(c.head * (c.sg || 1) * 0.0980665, 1)} bar</div>
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Build</div>
      <div class="label">Wetted material</div>${h.sel(Object.keys(st.T.mat).map((k) => [k, k]), c.material, 'material')}
      ${ty.sealless ? '' : `<div class="label">Shaft seal</div>${h.sel(Object.keys(st.T.seals).map((k) => [k, k]), c.seal || ty.seal, 'seal')}`}
      ${ty.column ? h.num('Column / setting length', 'len', c.len ?? ty.defLen, 0.5, 'm') : ''}
      ${ty.drive !== 'diesel' ? `<div class="label">Variable-speed drive</div>${h.seg([['No', 'Direct on line'], ['Yes', 'VFD']], c.vfd, 'vfd')}<div class="label">Hazardous area</div>${h.seg([['No', 'Standard'], ['Yes', 'Flameproof motor']], c.exproof, 'exproof')}` : ''}
      ${r && r.warn && r.warn.length ? `<div class="banner" style="margin-top:14px"><div>${r.warn.join(' ')}</div></div>` : ''}`;
  },
  rates(st) {
    const T = st.T, c = st.list[st.sel], ty = TYPES[c.type], out = [{ label: `Casting, ${c.material}`, path: `mat.${c.material.replace(/\./g, '')}.rate`, value: T.mat[c.material]?.rate, unit: '₹/kg' }];
    if (ty.drive === 'diesel') out.push({ label: 'Diesel engine', path: 'dieselPerKw', value: T.dieselPerKw, unit: '₹/kW' }); else out.push({ label: ty.drive === 'sub' ? 'Submersible motor' : 'Motor IE3', path: 'motorPerKw', value: T.motorPerKw, unit: '₹/kW' });
    if (ty.column) out.push({ label: 'Column and shaft', path: 'columnPerM', value: T.columnPerM, unit: '₹/m' });
    out.push({ label: 'VFD', path: 'vfdPerKw', value: T.vfdPerKw, unit: '₹/kW' }, { label: 'Baseplate fabrication', path: 'baseplateRate', value: T.baseplateRate, unit: '₹/kg' });
    if (ty.fire) out.push({ label: 'Fire-pump controller', path: `fireController.${ty.fire === 'jockey' ? 'jockey' : ty.fire}`, value: T.fireController[ty.fire === 'jockey' ? 'jockey' : ty.fire], unit: '₹' });
    return out;
  },
  isPricePath: () => false,
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['duty', 'Duty & selection', (r, st, h) => duty(r, h)],
    ['size', 'Cost vs size', (r, st, h) => sizeTab(r, st, h)],
  ],
  batchTitle: () => 'Pump batch · one row per pump',
  batchCols: [['Type', (c) => TYPES[c.type].label], ['m³/h', (c) => fmt(c.flow, c.flow < 20 ? 1 : 0), 1], ['Head m', (c) => fmt(c.head), 1], ['Motor kW', (c, r) => fmt(r.motorKw, r.motorKw < 10 ? 1 : 0), 1], ['Weight kg', (c, r) => fmt(r.weight), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Hydraulics'], ['Flow (m³/h)', f(r.Q, 1)], ['Differential head (m)', f(r.head, 0)], ['Pressure (bar)', f(r.bar, 1)], ['Hydraulic power (kW)', f(r.Ph, 2)], ['Efficiency', `${f(r.eta * 100, 1)}%`], ['Shaft power (kW)', f(r.shaft, 2)], ['Stages', r.stages],
      ...(r.fireChurn ? [['#', 'NFPA 20 checks'], ['Power at 150% flow (kW)', f(r.p150, 1)], ['Churn head limit', '140% of rated'], ['Assumed churn', `${f(r.fireChurn * 100, 0)}%`]] : []),
      ['#', 'Drive'], ['Required with margin (kW)', f(r.kwReq, 1)], ['Selected (kW)', f(r.motorKw, r.motorKw < 10 ? 1 : 0)], ['Weight (kg)', f(r.weight, 0)]],
    [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [`${l.label}`, f(l.amount, 0)]), ['Direct cost', f(r.direct, 0)], ['Overheads', f(r.groups.Overheads, 0)], ['Margin', f(r.groups.Margin, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    const pct = ['assemblyRate', 'packing', 'transport', 'overheads', 'margin', 'wettedFraction', 'rotatingFraction'];
    const flat = Object.keys(T).filter((k) => typeof T[k] === 'number').map((k) => P(k, k.replace(/([A-Z])/g, ' $1').toLowerCase(), T[k], pct.includes(k) ? '%' : '', 'any', pct.includes(k) ? 100 : 1));
    return [{ title: 'Material casting rates', rows: Object.keys(T.mat).map((k) => P(`mat.${k.replace(/\./g, '')}.rate`, k, T.mat[k].rate, '₹/kg')) },
      { title: 'Shaft seals', rows: Object.keys(T.seals).map((k) => P(`seals.${k}`, k, T.seals[k], '₹')) },
      { title: 'Fire-pump controllers', rows: Object.keys(T.fireController).map((k) => P(`fireController.${k}`, `${k} controller`, T.fireController[k], '₹')) },
      { title: 'Drives, accessories and cost stack', rows: flat }];
  },
  reset(st) { const d = pumpDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one pump</div><p class="p">Weight follows shaft power and stages; castings are priced by material, then seals, bearings, drive and accessories by type, then machining, test, overheads and margin.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(tot)}</td></tr>${ls.map((l) => `<tr><td>${l.label}${l.note ? ` <small>${l.note}</small>` : ''}</td><td class="r">${l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${l.unit === 'lot' ? '–' : nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Overheads and margin</b></td></tr><tr><td>Overheads</td><td></td><td></td><td class="r">₹${nf(r.groups.Overheads)}</td><td></td></tr><tr><td>Margin</td><td></td><td></td><td class="r">₹${nf(r.groups.Margin)}</td><td></td></tr><tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function duty(r, h) {
  const { nf } = h, ty = r.ty;
  const notes = { Centrifugal: 'Overhung pumps suit clean services to about 90 m per stage. Between-bearing and barrel pumps carry high flow, pressure or temperature; API 610 types add instrumentation and a witnessed test.', 'Vertical turbine': 'Vertical turbines suit wet pits and intakes: the column length and bowl stages set the price along with the motor.', 'Horizontal service': 'Service, auxiliary and seal-water duties are ordinary clear-water pumps; the seal-water set is multistage for pressure.', Submersible: 'Submersibles are sold as a package with cable, guide rails and base elbow; sewage and drainage types use double mechanical seals.', 'Positive displacement': 'Positive displacement pumps give constant flow against system pressure, so power follows pressure; they need a relief valve, and viscosity helps rather than hurts.', Fire: 'Fire pumps follow NFPA 20 / UL / FM: churn at or below 140% of rated head, 65% head at 150% flow, and a motor that is not overloaded at 150% flow. Jockey pumps hold line pressure only.' };
  return `<div class="h3">How the pump is selected</div><p class="p">${notes[ty.cat]}</p>
    <div class="scroll"><table class="t num"><tbody><tr><td>Duty</td><td class="r">${nf(r.Q, 1)} m³/h at ${nf(r.head, 0)} m (${nf(r.bar, 1)} bar)</td></tr><tr><td>Efficiency at duty</td><td class="r">${(r.eta * 100).toFixed(1)}%</td></tr><tr><td>Shaft power</td><td class="r">${nf(r.shaft, 1)} kW</td></tr>${r.fireChurn ? `<tr><td>Power at 150% flow (NFPA 20)</td><td class="r">${nf(r.p150, 1)} kW</td></tr>` : ''}<tr><td>Motor / driver selected</td><td class="r">${nf(r.motorKw, r.motorKw < 10 ? 1 : 0)} kW (${ty.motorMargin ? Math.round((ty.motorMargin - 1) * 100) : 0}% margin)</td></tr><tr><td>Estimated mass</td><td class="r">${nf(r.weight)} kg</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">Efficiency is a size-and-type curve, not a vendor curve. The viscosity correction follows a simple factor; confirm with the manufacturer for oils above 100 cSt.</p>`;
}
function sizeTab(r, st, h) {
  const { nf } = h, fs = [0.25, 0.4, 0.6, 0.8, 1, 1.5, 2, 3, 4].map((f) => { const x = computePump({ ...r.cfg, flow: r.cfg.flow * f }, st.T); return { f, q: x.Q, perKw: x.total / x.motorKw, total: x.total, kw: x.motorKw }; });
  const W = 760, H = 220, L = 52, R = 12, T = 12, B = 30, lo = Math.min(...fs.map((s) => s.perKw)) * 0.9, hi = Math.max(...fs.map((s) => s.perKw)) * 1.05, xs = (i) => L + i / (fs.length - 1) * (W - L - R), ys = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  return `<div class="h3">Cost per kW against size</div><p class="p">The same type, head and material at 0.25× to 4× this flow. Small pumps cost more per kW because castings, seals and tests do not shrink with the motor.</p>
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Cost per kW against flow"><polyline fill="none" stroke="#cbd5e1" stroke-width="1.6" points="${fs.map((s, i) => `${xs(i).toFixed(1)},${ys(s.perKw).toFixed(1)}`).join(' ')}"/>${fs.map((s, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(s.perKw).toFixed(1)}" r="${s.f === 1 ? 5.5 : 3}" fill="${s.f === 1 ? '#2563eb' : '#94a3b8'}"><title>${nf(s.q, 1)} m³/h · ${s.kw} kW · ₹${nf(s.perKw)}/kW</title></circle>`).join('')}<text x="${L}" y="${H - 8}" font-size="11" fill="#6b7482">${nf(fs[0].q, 1)} m³/h</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="11" fill="#6b7482">${nf(fs[fs.length - 1].q, 0)} m³/h</text><text x="${L - 6}" y="${T + 8}" text-anchor="end" font-size="11" fill="#6b7482">₹${nf(hi)}/kW</text><text x="${L - 6}" y="${H - B}" text-anchor="end" font-size="11" fill="#6b7482">${nf(lo)}</text></svg>
    <p class="note" style="padding:6px 0">This pump: ₹${nf(r.total / r.motorKw)} per motor kW, ₹${nf(r.total / r.Q)} per m³/h. Bought-outs (motor, seal, controller) are ${Math.round(r.bought / r.direct * 100)}% of direct cost.</p>`;
}
