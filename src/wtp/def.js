// Water and effluent treatment definition for the generic equipment UI.
import { wtpDefault, computeWtp, TYPES, MATERIALS } from './calc.js';
import { wtpScene, wtpFlowSVG } from './scene.js';
import { mkParts, anatomy, costRows, stackRows } from '../mfg/kit.js';

export { wtpDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = mkParts(['Process equipment', 'Tanks and vessels', 'Pumps and piping', 'Dosing and chemicals', 'Instruments and electrics', 'Civil tankage', 'Erection and commissioning']);

export const wtpDef = {
  key: 'mf', name: 'plant', ratesTitle: 'Rates · package, tankage and works', qtyLabel: 'plants',
  ratesNote: 'Not from a workbook: package prices are engineering assumptions that scale with capacity and water quality. Replace with vendor quotes.',
  masterNote: 'Reference prices by plant type, the split of each package, civil rate, erection and the cost stack. Assumptions, not workbook values. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Package price = reference price × (capacity ÷ reference)^exponent × quality factor, split into process, tanks, pumps, dosing and instruments; tankage volume follows retention time.',
  sectionHint: 'Process flow of the chosen plant',
  views: [['section', 'Process flow'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/plant', dec: 0, fn: (v) => v }, cap: { label: '₹ per unit capacity', dec: 0, fn: (v, r) => v / r.cfg.cap } },
  compute(st) { return st.list.map((c) => { const r = computeWtp(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.pm[k] || 0 })) }; }); },
  title: (r) => r.cfg.tag, meta: (r) => `${r.ty.label} · ${r.cfg.cap} ${r.ty.unit}`, pillOf: (r) => r.ty.unit === 'm³/h' ? 'Water' : 'Effluent',
  metrics: (r) => [['Capacity', `${fmt(r.cfg.cap)} ${r.ty.unit}`], ['Tankage', `${fmt(r.volume)} m³`], ['Installed power', `${fmt(r.kw)} kW`], ['₹ per unit', `₹${fmt(r.perUnit)} per ${r.ty.unit}`]],
  scene: (r) => wtpScene(r), section: (r) => wtpFlowSVG(r),
  tabs: undefined,
  left(st, r, h) {
    const c = st.list[st.sel], ty = TYPES[c.type];
    return `<div class="label">Plant <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Plant'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Plant type</div><div class="fam" style="grid-template-columns:repeat(1,1fr)">${Object.entries(TYPES).map(([k, t]) => `<button data-mset="type" data-mv='"${k}"' class="${c.type === k ? 'on' : ''}"><span>${t.label}</span></button>`).join('')}</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Duty</div>${h.num('Capacity', 'cap', c.cap, 'any', ty.unit)}
      ${ty.load ? h.num(ty.load[0], 'load', c.load, 'any', ty.load[1]) : ''}
      <div class="label">Wetted material</div>${h.sel(Object.keys(MATERIALS).map((k) => [k, k]), c.material, 'material')}
      <div class="label">Redundancy</div>${h.seg([['No', 'Single train'], ['Yes', 'N+1 standby']], c.standby, 'standby')}`;
  },
  rates(st) { const c = st.list[st.sel], ty = TYPES[c.type]; return [{ label: 'Civil tankage', path: 'civilPerM3', value: st.T.civilPerM3, unit: '₹/m³' }, { label: 'Erection share', path: 'erect', value: st.T.erect, unit: '' }, { label: 'Standby factor', path: 'standby', value: st.T.standby, unit: '×' }]; },
  isPricePath: () => false,
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, 'Build-up of the plant', 'The package price follows capacity and water quality, then splits into process equipment, tanks, pumps, dosing and electrics. Civil tankage follows hydraulic retention time. Engineering, overheads and margin are grossed up on the selling price.')], ['size', 'Cost vs capacity', (r, st, h) => sizeTab(r, st, h)]],
  batchTitle: () => 'Plant batch · one row per plant',
  batchCols: [['Type', (c) => TYPES[c.type].label.split(':')[0]], ['Capacity', (c) => `${fmt(c.cap)} ${TYPES[c.type].unit}`, 1], ['Tankage m³', (c, r) => fmt(r.volume), 1], ['kW', (c, r) => fmt(r.kw), 1]],
  calcRows(r) { const f = (v, d = 1) => fmt(v, d); return [[['#', 'Plant'], ['Type', r.ty.label], ['Capacity', `${f(r.cfg.cap, 0)} ${r.ty.unit}`], ['Quality factor', f(r.lf, 2)], ['Package price (₹)', f(r.pack, 0)], ['Tank volume (m³)', f(r.volume, 0)], ['Footprint (m²)', f(r.area, 0)], ['Installed power (kW)', f(r.kw, 0)]], costRows(r, f)]; },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un];
    return [{ title: 'Package split', rows: Object.keys(T.share).map((k) => P(`share.${k}`, k, T.share[k], '%', 100)) }, { title: 'Works and allowances', rows: [P('civilPerM3', 'Civil tankage', T.civilPerM3, '₹/m³'), P('depth', 'Liquid depth', T.depth, 'm'), P('erect', 'Erection', T.erect, '%', 100), P('fill', 'First fill and commissioning', T.fill, '%', 100), P('test', 'Guarantee tests', T.test, '%', 100), P('standby', 'N+1 standby factor', T.standby, '×')] }, { title: 'Cost stack', rows: stackRows(T, P) }];
  },
  reset(st) { const d = wtpDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};
function sizeTab(r, st, h) {
  const { nf } = h, fs = [0.25, 0.5, 0.75, 1, 1.5, 2, 4].map((f) => { const x = computeWtp({ ...r.cfg, cap: r.cfg.cap * f }, st.T); return { f, cap: x.cfg.cap, unit: x.perUnit, total: x.total }; });
  const W = 760, H = 220, L = 60, R = 12, T = 12, B = 30, lo = Math.min(...fs.map((s) => s.unit)) * 0.9, hi = Math.max(...fs.map((s) => s.unit)) * 1.05, xs = (i) => L + i / (fs.length - 1) * (W - L - R), ys = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  return `<div class="h3">Cost per unit capacity against size</div><p class="p">The same plant at 0.25× to 4× this capacity. The package price scales with capacity to the power ${r.ty.exp}, so larger plants cost less per unit.</p>
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Cost per unit against capacity"><polyline fill="none" stroke="#cbd5e1" stroke-width="1.6" points="${fs.map((s, i) => `${xs(i).toFixed(1)},${ys(s.unit).toFixed(1)}`).join(' ')}"/>${fs.map((s, i) => `<circle cx="${xs(i).toFixed(1)}" cy="${ys(s.unit).toFixed(1)}" r="${s.f === 1 ? 5.5 : 3}" fill="${s.f === 1 ? '#2563eb' : '#94a3b8'}"><title>${nf(s.cap)} ${r.ty.unit} · ₹${nf(s.unit)} per unit</title></circle>`).join('')}<text x="${L}" y="${H - 8}" font-size="11" fill="#6b7482">${nf(fs[0].cap)} ${r.ty.unit}</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="11" fill="#6b7482">${nf(fs[fs.length - 1].cap)}</text><text x="${L - 6}" y="${T + 8}" text-anchor="end" font-size="11" fill="#6b7482">₹${nf(hi)}</text><text x="${L - 6}" y="${H - B}" text-anchor="end" font-size="11" fill="#6b7482">${nf(lo)}</text></svg>`;
}
