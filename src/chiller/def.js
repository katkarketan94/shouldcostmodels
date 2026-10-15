// Chiller page definition: ported workbook model (Calculator / Assumptions & Ref / Summary) in the generic equipment UI.
import { chillerDefault, computeChiller, typeOf, CHILLER_DEFAULTS } from './calc.js';
import { chillerScene } from './chiller3d.js';
import { chillerSectionSVG } from './chillerSection.js';

const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export { chillerDefault };
const GROUPS = [['Heat exchangers', '#c27a2c'], ['Compressor and drive', '#2563eb'], ['Refrigerant, controls, ATC, piping', '#0ea5a4'], ['Assembly and test', '#8b5cf6'], ['Logistics and duty', '#94a3b8'], ['Overheads', '#64748b'], ['Guarantee provision', '#b08968'], ['OEM margin', '#0f9d6b']];
const LAB = CHILLER_DEFAULTS.labels, unitOf = (k) => (LAB[k] && LAB[k][1]) || '';
const SECTIONS = [['Geometry and thermal constants', ['r_cpw', 'r_tubeOD', 'r_tubeWall', 'r_tubeKgM', 'r_pitch', 'r_fill', 'r_shellClr', 'r_floodFac', 'r_Lmax', 'r_carnotCap', 'r_airCp', 'r_airRho', 'r_airRise', 'r_faceV', 'r_fanFlow', 'r_motEff', 'r_motMargin']],
  ['Pressure shell and fabrication', ['r_pDesE', 'r_pDesC', 'r_stress', 'r_ca', 'r_tmin', 'r_tsheet', 'r_wbFac', 'r_supFac', 'r_rhoSt']],
  ['Material and bought-out rates (unverified placeholders)', ['r_cuTube', 'r_steelFab', 'r_insul', 'r_bphe', 'r_coilFace', 'r_fanAC', 'r_frameKg', 'r_motHT', 'r_motLT', 'r_vfdHT', 'r_vfdLT', 'r_swgrHT', 'r_swgrLTbase', 'r_swgrLTkw', 'r_refrig', 'r_atcTube', 'r_atcFixed', 'r_pipePct', 'r_avm']],
  ['Conversion, logistics and commercial stack', ['r_assyPct', 'r_testPct', 'r_logPct', 'r_dutyPct', 'r_ohPct', 'r_warrPct', 'r_marginPct', 'r_ecPct']]];
const PCT = new Set(['r_pipePct', 'r_assyPct', 'r_testPct', 'r_logPct', 'r_dutyPct', 'r_ohPct', 'r_warrPct', 'r_marginPct', 'r_ecPct', 'r_supFac', 'r_carnotCap']);
const TT_FIELDS = [['evapApp', 'Evaporator approach', 'K'], ['condApp', 'Condenser approach', 'K'], ['Ue', 'U clean, evaporator', 'kW/m²K'], ['Uc', 'U clean, condenser', 'kW/m²K'], ['evPass', 'Evaporator passes', ''], ['cdPass', 'Condenser passes', ''], ['vel', 'Tube velocity', 'm/s'], ['maxTR', 'Max TR (flag only)', 'TR'], ['compRate', 'Compressor ₹/kW at reference', '₹/kW'], ['compPref', 'Reference shaft power', 'kW'], ['compN', 'Scale exponent', ''], ['lube', 'Lube system', '₹'], ['ctl', 'Controls panel', '₹'], ['refKg', 'Refrigerant charge', 'kg/TR']];

export const chillerDef = {
  key: 'mf', name: 'chiller', ratesTitle: 'Rates · tubes, steel and drive', qtyLabel: 'orders of these units', allowBlank: true,
  ratesNote: 'From the Chiller Cost Model workbook. Every rate in it is a placeholder until replaced with quotes. Copper tube and fabricated steel follow the common commodity file.',
  masterNote: 'Every yellow cell in the workbook: geometry, pressure shell, rates, stack and the chiller type table. Changes apply to all views and are kept in this browser.', resetLabel: 'Reset to workbook values',
  calcNote: 'Duty gives shaft power from COP; temperatures and approaches give LMTDs; area gives tubes, shell and steel; the priced build-up runs through assembly, logistics, overheads, guarantee and OEM margin.',
  sectionHint: 'Refrigerant circuit with duties from the model',
  views: [['section', 'Cycle'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/unit supply', dec: 0, fn: (v) => v }, tr: { label: '₹/TR', dec: 0, fn: (v, r) => v / r.cfg.tr }, kw: { label: '₹/kW cooling', dec: 0, fn: (v, r) => v / r.qE } },
  qtyTotal: (r, q) => r.allUnits * q,
  compute(st) { return st.list.map((c) => { const r = computeChiller(c, st.T); if (r.error) return r; return { ...r, stack: st.T.r, parts: GROUPS.map(([k, col]) => ({ k, l: k, col, v: k === 'Overheads' ? r.oh : k === 'Guarantee provision' ? r.warranty : k === 'OEM margin' ? r.margin : (r.groups.find((g) => g[0] === k) || [0, 0])[1] })) }; }); },
  title: (r) => `${r.cfg.tag || 'Chiller'} · ${fmt(r.cfg.tr)} TR${r.cfg.nos > 1 ? ` × ${r.cfg.nos}` : ''}`,
  meta: (r) => `${r.ty.name} · COP ${r.cop} (${r.kwTr.toFixed(2)} kW/TR) · CHW ${r.cfg.chwIn}/${r.cfg.chwOut} °C${r.WC ? ` · CW ${r.cfg.cwIn}/${r.cfg.cwIn + r.cfg.cwRange} °C` : ` · ambient ${r.cfg.cwIn} °C`}`,
  pillOf: (r) => (r.WC ? 'Water-cooled' : 'Air-cooled'),
  metrics: (r) => [['Cooling / shaft', `${fmt(r.qE)} / ${fmt(r.shaft)} kW`], ['Evap. / cond. area', `${fmt(r.ev.area)} / ${r.WC ? fmt(r.cond.area) : `${fmt(r.cond.face)} face`} m²`], ['Evap / cond / condensing', `${fmt(r.tEvap, 1)} / ${fmt(r.tCond, 1)} °C`], ['Supply + E&C, all units', `₹${fmt(r.allUnits / 1e7, 2)} Cr`]],
  scene: (r, view) => chillerScene(r, view === 'cut'), section: (r) => chillerSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], ty = typeOf(st.T, c.type) || Object.values(st.T.tt)[0], wc = ty.wc === 1;
    return `<div class="label">Chiller <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Chiller'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Type</div>${h.sel(Object.values(st.T.tt).map((t) => [t.name, t.name]), c.type, 'type')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>
      <div class="two2"><div>${h.num('Capacity per unit', 'tr', c.tr, 'any', 'TR')}</div><div>${h.num('Units', 'nos', c.nos, 1, 'nos')}</div></div>
      <div class="two2"><div>${h.num('Chilled water in', 'chwIn', c.chwIn, 0.5, '°C')}</div><div>${h.num('Chilled water out', 'chwOut', c.chwOut, 0.5, '°C')}</div></div>
      ${wc ? `<div class="two2"><div>${h.num('Condenser water in', 'cwIn', c.cwIn, 0.5, '°C')}</div><div>${h.num('Range', 'cwRange', c.cwRange, 0.5, 'K')}</div></div>` : h.num('Ambient dry-bulb', 'cwIn', c.cwIn, 0.5, '°C')}
      ${h.num('Full-load COP', 'cop', c.cop, 0.1, 'kW/kW')}
      <div class="label">Compressor drive</div>${h.seg([['Yes', 'VFD'], ['No', 'Starter']], c.vfd, 'vfd')}
      ${wc ? `<div class="label">Automatic tube cleaning</div>${h.seg([['Yes', 'Fitted'], ['No', 'None']], c.atc, 'atc')}` : ''}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Fouling and back-test</div>
      <div class="two2"><div>${h.num('Evap. fouling', 'evFoul', c.evFoul, 0.001, 'm²K/kW')}</div>${wc ? `<div>${h.num('Cond. fouling', 'cdFoul', c.cdFoul, 0.001, 'm²K/kW')}</div>` : '<div></div>'}</div>
      <div class="two2"><div>${h.num('Observed supply / unit', 'obsSupply', c.obsSupply, 'any', '₹')}</div><div>${h.num('Observed E&C / unit', 'obsEC', c.obsEC, 'any', '₹')}</div></div>
      ${r && r.flags ? `<div class="banner" style="margin-top:14px"><div>Checks: ${r.flags}</div></div>` : ''}`;
  },
  rates(st) {
    const R = st.T.r; return [{ label: 'Enhanced copper tube', path: 'r.r_cuTube', value: R.r_cuTube, unit: '₹/kg', cid: 'copper_tube', price: true }, { label: 'Fabricated pressure-vessel steel', path: 'r.r_steelFab', value: R.r_steelFab, unit: '₹/kg', cid: 'hr_plate', price: true },
      { label: 'VFD HT / LT', path: 'r.r_vfdHT', value: R.r_vfdHT, unit: '₹/kW' }, { label: 'Refrigerant', path: 'r.r_refrig', value: R.r_refrig, unit: '₹/kg' }, { label: 'OEM margin', path: 'r.r_marginPct', value: R.r_marginPct, unit: '' }];
  },
  isPricePath: (p) => p === 'r.r_cuTube' || p === 'r.r_steelFab',
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)], ['hx', 'Heat exchangers', (r, st, h) => hx(r, h)], ['bench', 'Back-test', (r, st, h) => bench(r, h)]],
  batchTitle: () => 'Chiller batch · one row per configuration',
  batchCols: [['Type', (c) => c.type.split(',')[0]], ['TR', (c) => fmt(c.tr), 1], ['Units', (c) => c.nos, 1], ['COP', (c) => c.cop, 1], ['₹/TR', (c, r) => fmt(r.perTr), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d), e = r.ev, c = r.cond;
    return [[['#', 'Duty and temperatures'], ['Evaporator duty (kW)', f(r.qE, 0)], ['Compressor shaft power (kW)', f(r.shaft, 0)], ['Heat rejected (kW)', f(r.qC, 0)], ['Evaporating / condensing (°C)', `${f(r.tEvap)} / ${f(r.tCond)}`], ['Carnot COP / fraction achieved', `${f(r.carnot, 2)} / ${f(r.carnotFrac * 100, 0)}%`], ['LMTD evap / cond (K)', `${f(r.lmtdE, 2)} / ${f(r.lmtdC, 2)}`],
      ['#', 'Evaporator'], ['U fouled (kW/m²K)', f(e.U, 2)], ['Surface (m²)', f(e.area)], ['CHW flow (m³/h)', f(e.flow, 0)], ['Tubes × length (m)', `${f(e.N, 0)} × ${f(e.L)}`], ['Shell Ø (m) / thickness (mm)', `${f(e.D, 2)} / ${f(e.t, 0)}`], ['Steel (kg)', f(e.steel, 0)],
      ['#', r.WC ? 'Condenser' : 'Air-cooled condenser'], ...(r.WC ? [['U fouled (kW/m²K)', f(c.U, 2)], ['Surface (m²)', f(c.area)], ['CW flow (m³/h)', f(c.flow, 0)], ['Tubes × length (m)', `${f(c.N, 0)} × ${f(c.L)}`], ['Shell Ø (m) / thickness (mm)', `${f(c.D, 2)} / ${f(c.t, 0)}`], ['Steel (kg)', f(c.steel, 0)]] : [['Air flow (m³/s)', f(c.air)], ['Coil face area (m²)', f(c.face)], ['Fans', c.fans]]),
      ['#', 'Drive'], ['Motor rated, separate (kW)', f(r.motorKw, 0)], ['Drive / VFD basis (kW)', f(r.driveKw, 0)]],
    [['#', 'Cost stack (₹ per unit)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Material subtotal', f(r.material, 0)], ['Direct cost', f(r.direct, 0)], ['Should-cost supply per unit', f(r.total, 0)], ['E&C per unit', f(r.ec, 0)], ['Supply + E&C, all units', f(r.allUnits, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un];
    const secs = SECTIONS.map(([title, keys]) => ({ title, rows: keys.map((k) => P(`r.${k}`, (LAB[k] && LAB[k][0]) || k, T.r[k], PCT.has(k) ? '%' : unitOf(k), PCT.has(k) ? 100 : 1)) }));
    const types = Object.values(T.tt).map((t) => ({ title: `Type table · ${t.name}`, rows: TT_FIELDS.map(([k, l, u]) => P(`tt.${t.code}.${k}`, l, t[k], u)) }));
    return [...secs, ...types];
  },
  reset(st) { const d = chillerDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf, pct } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of one chiller</div><p class="p">The workbook's priced build-up (calculator columns BA to BZ): heat exchangers from sizing, compressor and drive, refrigerant and controls, then assembly, logistics, overheads, a 24-month guarantee provision and OEM margin.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Cost</th><th class="r">Share of supply</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="4" class="grp2"><b>${g}</b> ₹${nf(tot)} · ${pct(tot / r.total, 0)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">₹${nf(l.amount)}</td><td class="r">${pct(l.amount / r.total, 1)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr class="total"><td>Should-cost supply per unit</td><td class="r">₹${nf(r.total)}</td><td class="r">100%</td><td></td></tr><tr><td>Erection, positioning, commissioning (${pct(r.stack.r_ecPct, 1)} of supply)</td><td class="r">₹${nf(r.ec)}</td><td></td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function hx(r, h) {
  const { nf } = h, e = r.ev, c = r.cond, row = (n, ...v) => `<tr><td>${n}</td>${v.map((x) => `<td class="r">${x}</td>`).join('')}</tr>`;
  return `<div class="h3">Heat exchangers</div><p class="p">Area from Q = U × A × LMTD with fouling; tube count from water flow and velocity; tube length from area; shell from the bundle layout and ASME-style thickness; steel from shell, tubesheets, water boxes and supports.</p>
    <div class="scroll"><table class="t num"><thead><tr><th></th><th class="r">Evaporator</th><th class="r">${r.WC ? 'Condenser' : 'Air-cooled coil'}</th></tr></thead><tbody>
    ${row('Duty (kW)', nf(r.qE), nf(r.qC))}${row('LMTD (K)', nf(r.lmtdE, 2), r.WC ? nf(r.lmtdC, 2) : '–')}${row('U fouled (kW/m²K)', nf(e.U, 2), r.WC ? nf(c.U, 2) : '–')}${row('Surface (m²)', r.BP ? `${nf(e.area, 1)} (brazed plate)` : nf(e.area, 1), r.WC ? nf(c.area, 1) : `${nf(c.face, 1)} face`)}
    ${row('Tubes × length', r.BP ? '–' : `${nf(e.N)} × ${nf(e.L, 1)} m`, r.WC ? `${nf(c.N)} × ${nf(c.L, 1)} m` : `${c.fans} fans`)}${row('Shell Ø / thickness', r.BP ? '–' : `${nf(e.D, 2)} m / ${nf(e.t)} mm`, r.WC ? `${nf(c.D, 2)} m / ${nf(c.t)} mm` : '–')}${row('Steel (kg)', nf(e.steel), r.WC ? nf(c.steel) : '–')}</tbody></table></div>`;
}
function bench(r, h) {
  const { nf, pct } = h, o = r.obs;
  return `<div class="h3">Back-test against an observed price</div><p class="p">Enter an observed supply price per unit (and E&C) on the left to compare it with the model. The source workbook was built to test against orders and BOQs.</p>
    <div class="scroll"><table class="t num"><tbody><tr><td>Should-cost supply per unit</td><td class="r">₹${nf(r.total)}</td></tr><tr><td>Supply per TR</td><td class="r">₹${nf(r.perTr)}</td></tr><tr><td>Observed supply per unit</td><td class="r">${o ? `₹${nf(o)}` : '–'}</td></tr><tr><td>Model minus observed</td><td class="r">${o ? `₹${nf(r.total - o)} (${r.vsObs >= 0 ? '+' : ''}${pct(r.vsObs, 1)})` : '–'}</td></tr><tr><td>E&C model vs observed</td><td class="r">${r.ecVsObs != null ? `${r.ecVsObs >= 0 ? '+' : ''}${pct(r.ecVsObs, 1)}` : '–'}</td></tr><tr><td>Checks</td><td class="r">${r.flags || 'none'}</td></tr><tr><td>Stack check against groups</td><td class="r">${r.stackOk ? 'OK' : 'MISMATCH'}</td></tr></tbody></table></div>
    ${r.cfg.note ? `<p class="note" style="padding:10px 0 0">${r.cfg.note}</p>` : ''}<p class="note" style="padding:6px 0 0">${o && Math.abs(r.vsObs) > 0.25 ? 'A gap this size usually means the placeholder compressor, VFD or switchgear rates are too high or too low; replace them with quotes and the model will converge.' : 'Every rate in the source workbook is a placeholder until replaced with quotes.'}</p>`;
}
