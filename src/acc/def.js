// Air-cooled condenser definition for the generic equipment UI.
import { accDefault, computeAcc } from './calc.js';
import { accScene, accCurveSVG } from './scene.js';
import { mkParts, anatomy, costRows, stackRows } from '../mfg/kit.js';

export { accDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = mkParts(['Heat-transfer bundles', 'Steam duct and headers', 'Structure', 'Fans and drives', 'Vacuum, condensate and controls', 'Civil, erection and test']);
let T_ = null;
export const accDef = {
  key: 'mf', name: 'condenser', ratesTitle: 'Rates · bundles, fans and structure', qtyLabel: 'condensers',
  ratesNote: 'Not from a workbook: surface, fan and structure rates are engineering assumptions. Replace with vendor quotes. Steel follows the common commodity file.',
  masterNote: 'Thermal constants, bundle and duct rates, fan and structure prices and the cost stack. Assumptions, not workbook values. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Back pressure gives the condensing temperature; the gap to ambient and the heat load give the finned-tube surface, fan count and steam-duct size.',
  sectionHint: 'Condenser cost against turbine back pressure',
  views: [['section', 'Cost vs back pressure'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/condenser', dec: 0, fn: (v) => v }, mw: { label: '₹ per MW heat rejected', dec: 0, fn: (v, r) => v / r.Q }, fan: { label: '₹/fan', dec: 0, fn: (v, r) => v / r.fans } },
  compute(st) { T_ = st.T; return st.list.map((c) => { const r = computeAcc(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.pm[k] || 0 })) }; }); },
  title: (r) => r.cfg.tag, meta: (r) => `${fmt(r.cfg.flow)} t/h exhaust · ${r.cfg.bp} kPa · ${r.cfg.amb} °C ambient · ${r.fans} fans`, pillOf: () => 'ACC',
  metrics: (r) => [['Heat rejected', `${fmt(r.Q)} MW`], ['Condensing temp.', `${fmt(r.Ts, 1)} °C (ITD ${fmt(r.itd, 1)} K)`], ['Surface / fans', `${fmt(r.area / 1e3)}k m² / ${r.fans}`], ['Fan power', `${fmt(r.fanMw, 1)} MW`]],
  scene: (r) => accScene(r), section: (r) => accCurveSVG(r, T_),
  tabs: undefined,
  left(st, r, h) {
    const c = st.list[st.sel];
    return `<div class="label">Condenser <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Condenser'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Turbine exhaust</div>${h.num('Exhaust steam flow', 'flow', c.flow, 'any', 't/h')}${h.num('Design back pressure', 'bp', c.bp, 0.5, 'kPa(a)')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Site</div>${h.num('Design dry-bulb temperature', 'amb', c.amb, 0.5, '°C')}${h.num('Steam duct length', 'duct', c.duct, 5, 'm')}
      <div class="note" style="padding:6px 0 0">${r && !r.error ? `Steam condenses at ${fmt(r.Ts, 1)} °C; ${fmt(r.Q)} MW to reject; ${r.fans} fans of ${fmt(T_ ? T_.fanDia : 9.14, 1)} m.` : ''}</div>
      ${r && r.error ? `<div class="banner" style="margin-top:14px"><div>${r.error}</div></div>` : ''}`;
  },
  rates(st) { const T = st.T; return [{ label: 'Finned-tube bundle', path: 'tubeRate', value: T.tubeRate, unit: '₹/kg' }, { label: 'Structure steel', path: 'steelRate', value: T.steelRate, unit: '₹/kg', cid: 'hr_plate', price: true }, { label: 'Fan, gearbox and motor', path: 'fanSet', value: T.fanSet, unit: '₹/fan' }, { label: 'Steam duct, fabricated', path: 'ductRate', value: T.ductRate, unit: '₹/kg' }, { label: 'Overall U, extended surface', path: 'U', value: T.U, unit: 'W/m²K' }]; },
  isPricePath: (p) => p === 'steelRate',
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, 'Build-up of the condenser', 'Finned-tube bundles are priced by mass, the steam duct and A-frame structure by steel, fans by the set, and the vacuum and condensate systems by capacity. Engineering, overheads and margin are grossed up on the selling price.')], ['thermal', 'Thermal sizing', (r, st, h) => thermal(r, h)]],
  batchTitle: () => 'Condenser batch · one row per condenser',
  batchCols: [['t/h', (c) => fmt(c.flow), 1], ['kPa', (c) => c.bp, 1], ['°C', (c) => c.amb, 1], ['Fans', (c, r) => r.fans, 1], ['MW', (c, r) => fmt(r.Q), 1]],
  calcRows(r) { const f = (v, d = 1) => fmt(v, d); return [[['#', 'Thermal'], ['Back pressure (kPa)', f(r.cfg.bp, 1)], ['Condensing temperature (°C)', f(r.Ts, 1)], ['Latent heat (kJ/kg)', f(r.hfg, 0)], ['Heat rejected (MW)', f(r.Q, 0)], ['ITD (K)', f(r.itd, 1)], ['Air temperature rise (K)', f(r.rise, 1)], ['LMTD (K)', f(r.lmtd, 1)], ['Extended surface (m²)', f(r.area, 0)], ['Fans', r.fans], ['Steam duct diameter (m)', f(r.dDuct, 1)], ['Steel (t)', f(r.steelT, 0)], ['Fan power (MW)', f(r.fanMw, 1)]], costRows(r, f)]; },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un], keys = (ks, un = '') => ks.map((k) => P(k, k, T[k], un));
    return [{ title: 'Thermal constants', rows: [P('dryness', 'Exhaust dryness', T.dryness, ''), P('airRiseFrac', 'Air rise as share of ITD', T.airRiseFrac, ''), P('U', 'Overall U, extended surface', T.U, 'W/m²K'), P('fanDutyPerK', 'Thermal duty per fan per K of ITD', T.fanDutyPerK, 'MW/K'), P('fanKw', 'Fan motor', T.fanKw, 'kW'), P('fanDia', 'Fan diameter', T.fanDia, 'm')] },
      { title: 'Bundles, duct and structure', rows: [P('tubeKgPerM2', 'Tube mass per m² extended', T.tubeKgPerM2, 'kg'), P('tubeRate', 'Bundle rate', T.tubeRate, '₹/kg'), P('ductV', 'Steam velocity in duct', T.ductV, 'm/s'), P('ductT', 'Duct wall', T.ductT, 'm'), P('ductRate', 'Duct rate', T.ductRate, '₹/kg'), P('headerFrac', 'Headers as share of duct', T.headerFrac, '%', 100), P('steelRate', 'Structure steel', T.steelRate, '₹/kg'), P('structKgPerFan', 'Structure per fan', T.structKgPerFan, 'kg'), P('structFab', 'Structure fabrication', T.structFab, '₹/kg')] },
      { title: 'Fans, systems and works', rows: keys(['fanSet', 'vfd', 'panelPerFan', 'windwall', 'foundation', 'vacuum', 'condTank', 'instr', 'erectKg', 'erectFan'], '₹') }, { title: 'Cost stack', rows: stackRows(T, P) }];
  },
  reset(st) { const d = accDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};
function thermal(r, h) {
  const { nf } = h;
  return `<div class="h3">How the condenser is sized</div><p class="p">Steam leaves the turbine at the back pressure and condenses at the saturation temperature. The air only has to take the latent heat, so the gap to ambient (ITD) decides everything: a small gap means a large surface and many fans.</p>
    <div class="scroll"><table class="t num"><tbody><tr><td>Condensing temperature</td><td class="r">${nf(r.Ts, 1)} °C at ${r.cfg.bp} kPa</td></tr><tr><td>Design ambient</td><td class="r">${r.cfg.amb} °C</td></tr><tr><td>ITD</td><td class="r">${nf(r.itd, 1)} K</td></tr><tr><td>Air temperature rise</td><td class="r">${nf(r.rise, 1)} K</td></tr><tr><td>Log-mean temperature difference</td><td class="r">${nf(r.lmtd, 1)} K</td></tr><tr><td>Heat rejected</td><td class="r">${nf(r.Q)} MW</td></tr><tr><td>Extended surface</td><td class="r">${nf(r.area)} m²</td></tr><tr><td>Fans</td><td class="r">${r.fans}</td></tr><tr><td>Steam duct</td><td class="r">${nf(r.dDuct, 1)} m diameter</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">At hotter days than the design ambient the back pressure rises and the turbine output falls; the design point trades capital cost against that loss. Evaluate that on the cost-versus-back-pressure view.</p>`;
}
