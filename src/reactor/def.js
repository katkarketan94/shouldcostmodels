// Shunt reactor model definition for the generic equipment UI.
import { reactorDefault, computeReactor, averageFactor, REACTOR_DEFAULTS } from './calc.js';
import { reactorScene, reactorSectionSVG } from './reactor3d.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
export { reactorDefault };
const fmt = (v, d = 0) => (typeof v === 'number' ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : v ?? '–');
const PARTS = [['A', 'Raw material', '#c27a2c'], ['B', 'Bought-out accessories & tests', '#2563eb'], ['C', 'Design & engineering', '#8b5cf6'], ['D', 'Labour', '#0ea5a4'], ['D2', 'Packing & documentation', '#94a3b8'], ['E', 'Overheads', '#64748b'], ['F', 'Profit margin', '#0f9d6b']];

export const reactorDef = {
  key: 'mf', name: 'shunt reactors', ratesTitle: 'Material prices · from the Power transformer workbook', qtyLabel: 'units',
  ratesNote: 'Not from a workbook of its own: material prices, constants, voltage-class accessory rates and the cost stack are the Power transformer workbook’s. The gapped-core design maths is new.',
  masterNote: 'Prices, design constants, tank and cooling constants, the voltage-class table and the cost stack. All editable and kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'The solved design for this reactor: the cheapest volts-per-turn that meets the loss limit and the gap limit.',
  sectionHint: 'One wound limb in elevation with the air gaps of the core',
  views: [['section', 'Gapped limb'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 8,
  units: { unit: { label: '₹/unit', dec: 0, fn: (v) => v }, mvar: { label: '₹/MVAr', dec: 0, fn: (v, r) => v / r.cfg.mvar }, delivery: { label: '₹/unit at delivery', dec: 0, fn: (v, r) => v * r.pv } },
  compute(st) {
    const avg = averageFactor(st.list, st.T);
    return st.list.map((c) => { const r = computeReactor(c, st.T, avg); if (r.error) return r; return { ...r, total: r.cal, parts: PARTS.map(([k, l, col]) => ({ k, l, col, v: r[k] * r.factor })) }; });
  },
  title: (r) => `${r.cfg.tag || 'Shunt reactor'} · ${fmt(r.cfg.mvar, 1)} MVAr`,
  meta: (r) => `${r.ph === 3 ? 'Three phase' : 'Single phase'} · ${r.cfg.kv} kV · ${r.nW} wound limb${r.nW > 1 ? 's' : ''}${r.nR ? ` + ${r.nR} return limbs` : ''} · gapped core, oil-immersed`,
  pillOf: (r) => (Math.abs(r.factor - 1) > 1e-9 ? `calibration ×${r.factor.toFixed(2)}` : 'engineering cost'),
  metrics: (r) => [['Weight', `${fmt(r.totalKg / 1000, 0)} t`], ['Tank L×W×H (m)', `${r.tL.toFixed(1)} × ${r.tW.toFixed(1)} × ${r.tH.toFixed(1)}`], ['Losses / limit', `${fmt(r.totalLoss / 1000, 0)} / ${fmt(r.limit / 1000, 0)} kW`], ['Air gap', `${fmt(r.lgTotal * 1000, 0)} mm · ${r.nGaps} gaps`]],
  scene: (r, view) => reactorScene(r, view === 'cut'), section: (r) => reactorSectionSVG(r),
  allowBlank: true,

  left(st, r, h) {
    const c = st.list[st.sel], blank = (v) => v ?? '';
    return `<div class="label">Reactor <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Reactor'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Rating</div>
      <div class="label">Rating <small>MVAr, per unit</small></div><input class="cell fw" type="number" step="any" data-mf="mvar" data-num="1" value="${blank(c.mvar)}" aria-label="MVAr">
      <div class="label">Line voltage <small>kV</small></div><input class="cell fw" type="number" step="any" data-mf="kv" data-num="1" value="${blank(c.kv)}" aria-label="kV">
      <div class="label">Phases</div>${h.seg([['Three phase', 'Three phase'], ['Single phase', 'Single phase']], c.phases, 'phases')}
      <div class="label">Core</div>${h.seg([['Auto', 'Auto'], ['3-limb', '3-limb'], ['5-limb', '5-limb']], c.core, 'core')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Guarantees</div>
      <div class="label">Loss limit <small>% of MVAr · blank = ${(st.T.design.lossLimitPct * 100).toFixed(2)}</small></div><input class="cell fw" type="number" step="0.01" data-mf="lossLimitPctDisp" data-num="1" value="${c.lossLimitPct == null ? '' : +(c.lossLimitPct * 100).toFixed(4)}" aria-label="Loss limit percent">
      <div class="label">Online DGA + bushing monitoring</div>${h.seg([['No', 'No'], ['Yes', 'Yes']], c.monitoring, 'monitoring')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Reference price &amp; calibration</div>
      <div class="label">Reference price per unit <small>₹, ex-works</small></div><input class="cell fw" type="number" step="any" data-mf="refPrice" data-num="1" value="${blank(c.refPrice)}" aria-label="Reference price">
      <div class="label">Reference source</div><input class="cell fw" type="text" data-mf="refSource" value="${(c.refSource ?? '').replace(/"/g, '&quot;')}" aria-label="Reference source">
      <div class="label">Calibration applied</div>${h.seg([['Own price', 'Own price'], ['Model average', 'Average'], ['None', 'None']], c.calib, 'calib')}`;
  },
  afterEdit(st, path) {
    const c = st.list[st.sel]; if (path === 'lossLimitPctDisp') { c.lossLimitPct = c.lossLimitPctDisp == null ? null : c.lossLimitPctDisp / 100; delete c.lossLimitPctDisp; }
    if (st.sel >= st.list.length) st.sel = 0;
  },
  rates(st) {
    const P = st.T.prices, cid = { copper: 'copper', crgo: 'crgo', steel: 'hr_plate', pressboard: 'pressboard', oil: 'trafo_oil' }, lab = { copper: 'Copper conductor', crgo: 'CRGO laminations', steel: 'Mild steel plate', pressboard: 'Pressboard & paper', oil: 'Transformer oil' };
    return Object.keys(P).map((k) => ({ label: lab[k], path: `prices.${k}`, value: P[k], unit: '₹/kg', cid: cid[k], price: true }));
  },
  isPricePath: (p) => p.startsWith('prices.'),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['design', 'Solved design', (r, st, h) => designTab(r, h)],
    ['ieema', 'IEEMA price variation', (r, st, h) => ieema(r, st, h)],
    ['basis', 'Method', () => method()],
  ],
  batchTitle: () => 'Shunt reactor batch',
  batchCols: [['MVAr', (c) => fmt(c.mvar, 1), 1], ['kV', (c) => c.kv, 1], ['Phases', (c) => c.phases], ['Weight t', (c, r) => fmt(r.totalKg / 1000, 0), 1], ['Engineering ₹ Cr', (c, r) => fmt(r.eng / 1e7, 2), 1], ['Calibrated ₹ Cr', (c, r) => fmt(r.cal / 1e7, 2), 1], ['Design', (c, r) => (r.feasible ? 'meets limits' : 'loss limit not met')]],
  calcRows(r) {
    const f = (v, d = 2) => fmt(v, d);
    return [[['#', 'Electrical'], ['Rated current per phase (A)', f(r.I, 1)], ['Reactance per phase (Ω)', f(r.X, 1)], ['Inductance (H)', f(r.L, 3)], ['Volts per turn (V)', f(r.Et, 1)], ['Turns per limb', f(r.N, 0)], ['Flux per limb (Wb)', f(r.phi, 3)],
      ['#', 'Core and gaps'], ['Net iron area (m²)', f(r.Anet, 3)], ['Core diameter (m)', f(r.dia, 3)], ['Window height (m)', f(r.Hw, 3)], ['Total air gap (mm)', f(r.lgTotal * 1000, 0)], ['Gaps × each (mm)', `${r.nGaps} × ${f(r.gapEach * 1000, 1)}`], ['Gap as share of window', `${(r.gapFrac * 100).toFixed(0)}%`],
      ['#', 'Winding'], ['Current density (A/mm²)', f(r.J)], ['Radial build (mm)', f(r.Rb * 1000, 0)], ['Mean turn (m)', f(r.MT, 2)], ['Winding diameter in / out (m)', `${f(r.Din, 3)} / ${f(r.Dout, 3)}`], ['Limb pitch (m)', f(r.pitch, 3)]],
    [['#', 'Losses (W)'], ['Core', f(r.coreLoss, 0)], ['Winding incl. stray and gap fringing', f(r.copperLoss, 0)], ['Total', f(r.totalLoss, 0)], ['Limit', f(r.limit, 0)],
      ['#', 'Weights (kg)'], ['Copper', f(r.cuKg, 0)], ['CRGO core', f(r.core, 0)], ['Tank, radiators, frames', f(r.steelKg, 0)], ['Insulation', f(r.insKg, 0)], ['Oil', f(r.oilKg, 0)], ['Total', f(r.totalKg, 0)],
      ['#', 'Cost (₹)'], ['A  Raw material', f(r.A, 0)], ['B  Accessories & tests', f(r.B, 0)], ['Engineering', f(r.eng, 0)], ['Calibrated', f(r.cal, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un];
    const sec = (title, obj, base, un = {}, pct = []) => ({ title, rows: Object.keys(obj).map((k) => P(`${base}.${k}`, k, obj[k], un[k] ?? '', 'any', pct.includes(k) ? 100 : 1)) });
    return [sec('Material prices', T.prices, 'prices', Object.fromEntries(Object.keys(T.prices).map((k) => [k, '₹/kg']))), sec('Densities', T.dens, 'dens', Object.fromEntries(Object.keys(T.dens).map((k) => [k, 'kg/m³']))),
      { title: 'Design constants', rows: Object.keys(T.design).map((k) => P(`design.${k}`, k.replace(/([A-Z])/g, ' $1').toLowerCase(), T.design[k], '', 'any', /Pct$/.test(k) ? 100 : 1)) },
      { title: 'Tank and cooling', rows: Object.keys(T.tank).map((k) => P(`tank.${k}`, k.replace(/([A-Z])/g, ' $1').toLowerCase(), T.tank[k], '')) },
      { title: 'Wastage and cost stack', rows: [...Object.keys(T.waste).map((k) => P(`waste.${k}`, `wastage · ${k}`, T.waste[k], '%', 'any', 100)), ...Object.keys(T.stack).map((k) => P(`stack.${k}`, k, T.stack[k], '%', 'any', 100))] },
      { title: 'Voltage-class table (accessory rates, clearances, labour)', wide: true, rows: T.class.flatMap((c, i) => ['coreGap', 'hvGap', 'phaseGap', 'endClear', 'hvTank', 'top', 'insRatio', 'wall', 'bushing', 'fittings', 'tests', 'labour'].map((k) => P(`class.${i}.${k}`, `${c.kv} kV · ${k}`, c[k], '', 'any', k === 'labour' ? 100 : 1))) },
      { title: 'Other accessories', rows: [P('neutralBushing', 'Neutral bushing', T.neutralBushing, '₹/no'), P('monitoring', 'Online DGA + bushing monitoring', T.monitoring, '₹/unit')] },
      { title: 'IEEMA indices · base and delivery', rows: Object.keys(T.ieema.idx).flatMap((k) => [P(`ieema.idx.${k}.0`, `${k} base`, T.ieema.idx[k][0], ''), P(`ieema.idx.${k}.1`, `${k} delivery`, T.ieema.idx[k][1], '')]) }];
  },
  reset(st) { const d = reactorDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h;
  const sec = (title, tot, rows) => `<tr><td colspan="3" class="grp2"><b>${title}</b> ₹${nf(tot)}</td></tr>${rows.map(([l, v]) => `<tr><td>${l}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${Math.min(100, v / tot * 100)}%"></i></div></td></tr>`).join('')}`;
  let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Engineering cost, then calibration</div><p class="p">Weights come from the solved design and are priced at the material rates; accessories and tests by voltage class; then the Power transformer cost stack. ${Math.abs(r.factor - 1) > 1e-9 ? `One factor (<b>×${r.factor.toFixed(3)}</b>) takes the engineering cost ₹${nf(r.eng)} to the calibrated price ₹${nf(r.cal)}.` : 'No calibration is applied.'}</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Engineering ₹</th><th>Share</th></tr></thead><tbody>${sec('A · Raw material', r.A, Object.entries(r.mat))}${sec('B · Bought-out accessories & tests', r.B, Object.entries(r.bo).filter(([, v]) => v > 0))}
    <tr><td colspan="3" class="grp2"><b>C to F</b></td></tr>${[['C · Design & engineering', r.C], ['D · Labour', r.D], ['D2 · Packing & documentation', r.D2], ['E · Overheads', r.E], ['F · Profit margin', r.F]].map(([l, v]) => `<tr><td>${l}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${v / r.eng * 100}%"></i></div></td></tr>`).join('')}
    <tr class="total"><td>Engineering should-cost</td><td class="r">₹${nf(r.eng)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function designTab(r, h) {
  const { nf } = h, sc = r.scan, W = 760, H = 220, L = 52, R = 12, T = 12, B = 30, xs = (i) => L + (i / (sc.length - 1)) * (W - L - R), cs = sc.map((s) => s.cost / 1e7), lo = Math.min(...cs) * 0.9, hi = Math.max(...cs.filter((c) => c < Math.min(...cs) * 3)) * 1.05, ys = (v) => T + (1 - (Math.min(v, hi) - lo) / (hi - lo)) * (H - T - B);
  const pts = sc.map((s, i) => `${xs(i).toFixed(1)},${ys(s.cost / 1e7).toFixed(1)}`).join(' '), bestI = sc.findIndex((s) => Math.abs(s.et - r.Et) < 1e-6);
  const dots = sc.map((s, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(s.cost / 1e7).toFixed(1)}" r="${i === bestI ? 5.5 : 3}" fill="${i === bestI ? '#2563eb' : s.feasible ? '#94a3b8' : '#e2a3a3'}"><title>${nf(s.et, 0)} V/turn · ₹${(s.cost / 1e7).toFixed(2)} Cr · ${s.feasible ? 'meets limits' : 'misses a limit'}</title></circle>`).join('');
  return `<div class="h3">Why this design</div><p class="p">The model scans volts per turn. A low value means many turns, a small core and a long gap; a high value gives a heavy core. It keeps the cheapest design whose losses stay within <b>${nf(r.limit / 1000, 0)} kW</b> and whose gaps take no more than ${(35)}% of the window. ${r.feasible ? '' : '<b>No design met the limits at the maximum current density; this is the closest one.</b>'}</p>
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Material cost against volts per turn"><polyline fill="none" stroke="#cbd5e1" stroke-width="1.6" points="${pts}"/>${dots}<text x="${L}" y="${H - 8}" font-size="11" fill="#6b7482">${nf(sc[0].et, 0)} V/turn</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="11" fill="#6b7482">${nf(sc[sc.length - 1].et, 0)} V/turn</text><text x="${L - 6}" y="${T + 8}" text-anchor="end" font-size="11" fill="#6b7482">₹${hi.toFixed(1)} Cr</text><text x="${L - 6}" y="${H - B}" text-anchor="end" font-size="11" fill="#6b7482">${lo.toFixed(1)}</text></svg>
    <div class="legend"><span><i style="background:#2563eb"></i>Chosen: ${nf(r.Et, 0)} V/turn, ${nf(r.N)} turns</span><span><i style="background:#94a3b8"></i>Meets limits</span><span><i style="background:#e2a3a3"></i>Misses a limit</span></div>`;
}
function ieema(r, st, h) {
  const { nf } = h;
  return `<div class="h3">Price at delivery</div><p class="p">IEEMA price variation with the Power transformer weights (${r.cfg.kv > 400 ? 'above 400 kV' : 'up to 400 kV'}). The delivery indices follow the price-month selector, or edit them on Master Data. Tender price ₹${nf(r.cal)} → <b>₹${nf(r.delivery)}</b> at delivery (${((r.pv - 1) * 100).toFixed(2)}%).</p>`;
}
function method() {
  return `<div class="h3">How the design is solved</div><p class="p">A shunt reactor is a gapped-core inductor, not a transformer. Reactance X = V² ÷ Q sets the inductance L. With N turns and net core area A, the total air gap is lg = μ0 × N² × A × k ÷ L, and the flux density B = V ÷ (4.44 f N A) is held at the design value so the reactor stays linear up to about 1.5 times rated voltage. The model scans volts per turn, solves the current density that meets the loss limit, weighs the core, winding, tank, radiators and oil, and prices them with the Power transformer workbook’s rates and cost stack.</p>
    <p class="note" style="padding:6px 0">This is an own model, not a verified workbook: the gap fringing factor, the 25% winding stray and fringing allowance, the yoke and return-limb areas and the 0.25% loss limit are assumptions. The ₹12.50 Cr reference in your Power transformer Read Me is the only price anchor, so use the calibration factor with care until more offers are loaded.</p>`;
}
