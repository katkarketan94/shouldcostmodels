// Boiler feed pump set definition for the generic equipment UI.
import { bfpDefault, computeBfp, DRIVES } from './calc.js';
import { bfpScene, bfpCurveSVG } from './scene.js';

export { bfpDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Pump', '#2563eb'], ['Driver and drive train', '#c27a2c'], ['Auxiliaries', '#0ea5a4'], ['Test', '#94a3b8'], ['Engineering', '#8b5cf6'], ['Overheads', '#64748b'], ['Supervision, spares', '#b08968'], ['Margin', '#0f9d6b']];

export const bfpDef = {
  key: 'mf', name: 'feed pump set', ratesTitle: 'Rates · pump, driver and auxiliaries', qtyLabel: 'sets',
  ratesNote: 'Not from a workbook: every rate and constant is an engineering assumption. Replace with vendor quotes before relying on the numbers.',
  masterNote: 'Pump, driver, lube-oil and test rates and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Flow, head and density give hydraulic kW; efficiency (rising with flow) gives shaft kW; stages follow head per stage; pump mass follows shaft kW; the driver is the next 100 kW above shaft power plus margin.',
  sectionHint: 'Indicative performance curve with the duty point',
  views: [['section', 'Performance'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/set', dec: 0, fn: (v) => v }, kw: { label: '₹/kW shaft', dec: 0, fn: (v, r) => v / r.P }, flow: { label: '₹ per m³/h', dec: 0, fn: (v, r) => v / r.cfg.flow } },
  compute(st) { return st.list.map((c) => { const r = computeBfp(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.parts[k] || 0 })) }; }); },
  title: (r) => `${r.cfg.tag || 'Feed pump'}`,
  meta: (r) => `${fmt(r.cfg.flow)} m³/h at ${fmt(r.cfg.head)} m · ${r.stages} stages · ${r.cfg.drive === 'turbine' ? 'steam turbine' : 'motor with fluid coupling'}`,
  pillOf: (r) => (r.cfg.drive === 'turbine' ? 'Turbine' : 'Motor'),
  metrics: (r) => [['Efficiency', `${(r.eta * 100).toFixed(0)}%`], ['Shaft / driver', `${fmt(r.P)} / ${fmt(r.driverKw)} kW`], ['Pressure', `${fmt(r.cfg.head * r.rho * 0.0000981, 0)} bar`], ['Set weight', `${fmt(r.weightT, 1)} t`]],
  scene: (r, view) => bfpScene(r, view === 'cut'),
  section: (r) => bfpCurveSVG(r),
  tabs: undefined,

  left(st, r, h) {
    const c = st.list[st.sel];
    return `<div class="label">Feed pump set <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Feed pump'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Driver</div>
      ${h.seg(Object.entries(DRIVES).map(([k, l]) => [k, k === 'turbine' ? 'Steam turbine' : 'Motor + coupling']), c.drive, 'drive')}
      <div class="note" style="padding:6px 0 0">${DRIVES[c.drive]}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>
      <div class="two2"><div>${h.num('Flow', 'flow', c.flow, 'any', 'm³/h')}</div><div>${h.num('Developed head', 'head', c.head, 'any', 'm')}</div></div>
      ${h.num('Feed-water temperature', 'temp', c.temp, 1, '°C')}
      <div class="label">Booster pump</div>${h.seg([['Yes', 'With booster'], ['No', 'None']], c.booster, 'booster')}
      <div class="note" style="padding:6px 0 0">${fmt(c.head * 0.0000981 * (r && r.rho || 890), 0)} bar · ${r && !r.error ? `${r.stages} stages` : ''}</div>`;
  },
  rates(st) {
    const T = st.T, c = st.list[st.sel];
    return [{ label: 'Barrel pump, finished', path: 'pump.perKg', value: T.pump.perKg, unit: '₹/kg' },
      c.drive === 'turbine' ? { label: 'Turbine price constant', path: 'turbine.k', value: T.turbine.k, unit: '₹ · kW^0.8' } : { label: 'HT motor price constant', path: 'motor.k', value: T.motor.k, unit: '₹ · kW^0.75' },
      { label: 'Lube-oil system', path: 'lube.lot', value: T.lube.lot, unit: '₹ + per kW' }, { label: 'Instruments', path: 'instr', value: T.instr, unit: '₹' }, { label: 'Margin', path: 'stack.margin', value: T.stack.margin, unit: '' }];
  },
  isPricePath: () => false,
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['duty', 'Duty & selection', (r, st, h) => duty(r, h)],
    ['drive', 'Turbine vs motor', (r, st, h) => driveTab(r, st, h)],
  ],
  batchTitle: () => 'Feed pump batch · one row per set',
  batchCols: [['Driver', (c) => (c.drive === 'turbine' ? 'Turbine' : 'Motor')], ['m³/h', (c) => fmt(c.flow), 1], ['Head m', (c) => fmt(c.head), 1], ['Shaft kW', (c, r) => fmt(r.P), 1], ['Weight t', (c, r) => fmt(r.weightT, 1), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Hydraulics'], ['Flow (m³/h)', f(r.cfg.flow, 0)], ['Head (m)', f(r.cfg.head, 0)], ['Density (kg/m³)', f(r.rho, 0)], ['Hydraulic power (kW)', f(r.Ph, 0)], ['Efficiency', `${f(r.eta * 100, 1)}%`], ['Shaft power (kW)', f(r.P, 0)], ['Stages', r.stages], ['Pump mass (kg)', f(r.mass, 0)], ['Driver (kW)', f(r.driverKw, 0)], ['Booster motor (kW)', f(r.boosterKw, 0)]],
      [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Direct cost', f(r.base, 0)], ['Engineering', f(r.parts.Engineering, 0)], ['Overheads', f(r.parts.Overheads, 0)], ['Supervision, spares', f(r.parts['Supervision, spares'], 0)], ['Margin', f(r.parts.Margin, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    return [{ title: 'Hydraulics', rows: [P('rho', 'Density at 180 °C', T.rho, 'kg/m³'), P('eff.max', 'Peak efficiency', T.eff.max, '%', 'any', 100), P('eff.flowKnee', 'Flow for 90% of the efficiency gain', T.eff.flowKnee, 'm³/h'), P('stageHead', 'Head per stage', T.stageHead, 'm'), P('boosterHead', 'Booster head', T.boosterHead, 'm')] },
      { title: 'Pump', rows: [P('pump.kgK', 'Mass constant', T.pump.kgK, 'kg · kW^-0.85'), P('pump.kgExp', 'Mass exponent', T.pump.kgExp, ''), P('pump.perKg', 'Finished rate', T.pump.perKg, '₹/kg'), P('pump.stageAdd', 'Extra mass per stage above 6', T.pump.stageAdd, '%', 'any', 100), P('seals.lot', 'Seals and coolers, fixed', T.seals.lot, '₹'), P('seals.perKw', 'Seals and coolers, per shaft kW', T.seals.perKw, '₹/kW')] },
      { title: 'Driver', rows: [P('turbine.k', 'Turbine constant', T.turbine.k, '₹ · kW^exp'), P('turbine.exp', 'Turbine exponent', T.turbine.exp, ''), P('turbine.ancillary', 'Governor, lube, drains, controls', T.turbine.ancillary, '%', 'any', 100), P('motor.k', 'HT motor constant', T.motor.k, '₹ · kW^exp'), P('motor.exp', 'HT motor exponent', T.motor.exp, ''), P('motor.coupling', 'Variable-speed coupling', T.motor.coupling, '₹/kW'), P('motor.gear', 'Step-up gear', T.motor.gear, '₹/kW'), P('motor.motorMargin', 'Motor margin on shaft kW', T.motor.motorMargin, '×')] },
      { title: 'Auxiliaries, test and cost stack', rows: [P('lube.lot', 'Lube-oil system, fixed', T.lube.lot, '₹'), P('lube.perKw', 'Lube-oil system, per shaft kW', T.lube.perKw, '₹/kW'), P('instr', 'Instruments and protection', T.instr, '₹'), P('test.lot', 'Test, fixed', T.test.lot, '₹'), P('test.pct', 'Test, share of equipment', T.test.pct, '%', 'any', 100), P('stack.engineering', 'Engineering', T.stack.engineering, '%', 'any', 100), P('stack.overheads', 'Overheads', T.stack.overheads, '%', 'any', 100), P('stack.margin', 'Margin', T.stack.margin, '%', 'any', 100), P('stack.misc', 'Supervision, spares', T.stack.misc, '%', 'any', 100)] }];
  },
  reset(st) { const d = bfpDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one feed pump set</div><p class="p">The barrel pump is priced by mass; the turbine or motor by a power-law on driver kW; lube oil, instruments and test are fixed lots plus a shaft-kW component. Engineering, overheads, supervision and margin are grossed up on the selling price.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(tot)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${l.unit === 'set' || l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${l.unit === 'set' || l.unit === 'lot' ? '–' : nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Engineering, overheads, supervision and margin</b></td></tr>${['Engineering', 'Overheads', 'Supervision, spares', 'Margin'].map((k) => `<tr><td>${k}</td><td></td><td></td><td class="r">₹${nf(r.parts[k])}</td><td></td></tr>`).join('')}<tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function duty(r, h) {
  const { nf } = h;
  return `<div class="h3">How the set is selected</div><p class="p">Feed pumps are multistage barrel pumps (API 610 BB5 type) running at 5,000–6,500 rpm behind a gearbox or a variable-speed coupling. A 660 MW unit typically uses two 50% turbine-driven pumps with a motor-driven start-up pump; smaller units use motor-driven sets.</p>
    <div class="scroll"><table class="t num"><tbody><tr><td>Duty</td><td class="r">${nf(r.cfg.flow)} m³/h at ${nf(r.cfg.head)} m</td></tr><tr><td>Hydraulic power</td><td class="r">${nf(r.Ph)} kW</td></tr><tr><td>Efficiency</td><td class="r">${(r.eta * 100).toFixed(1)}%</td></tr><tr><td>Shaft power</td><td class="r">${nf(r.P)} kW</td></tr><tr><td>Stages</td><td class="r">${r.stages}</td></tr><tr><td>Driver selected</td><td class="r">${nf(r.driverKw)} kW</td></tr><tr><td>Booster pump motor</td><td class="r">${r.boosterKw ? `${nf(r.boosterKw)} kW` : 'none'}</td></tr><tr><td>Barrel pump mass</td><td class="r">${nf(r.mass)} kg</td></tr><tr><td>Set weight, with driver</td><td class="r">${nf(r.weightT, 1)} t</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">Efficiency and mass are size curves, not vendor data. The turbine price excludes the steam piping and condenser it exhausts to.</p>`;
}
function driveTab(r, st, h) {
  const { nf } = h, a = computeBfp({ ...r.cfg, drive: 'turbine' }, st.T), b = computeBfp({ ...r.cfg, drive: 'motor' }, st.T), cur = r.cfg.drive;
  const row = (l, x, on) => `<tr class="${on ? 'sel' : ''}"><td>${l}</td><td class="r">${nf(x.driverKw)} kW</td><td class="r">₹${nf(x.parts['Driver and drive train'])}</td><td class="r">₹${nf(x.total)}</td><td class="r">₹${nf(x.total / x.P)}</td></tr>`;
  return `<div class="h3">Turbine drive against motor drive</div><p class="p">The same duty with either driver. The turbine set costs more up front; the motor set adds auxiliary electrical load (about ${nf(r.P)} kW from the unit auxiliaries) that the turbine takes from the cycle's steam instead.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Drive</th><th class="r">Driver</th><th class="r">Driver cost</th><th class="r">Set total</th><th class="r">₹/kW shaft</th></tr></thead><tbody>${row('Steam turbine', a, cur === 'turbine')}${row('Motor + variable-speed coupling', b, cur === 'motor')}</tbody></table></div>
    <p class="note" style="padding:6px 0">Turbine drive costs ${nf(a.total / b.total, 2)}× the motor set on this duty. The motor set also needs the HT switchgear and cabling, which are priced on their own pages.</p>`;
}
