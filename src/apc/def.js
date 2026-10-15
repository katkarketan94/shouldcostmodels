// Air-pollution control (ESP and wet FGD) definition for the generic equipment UI.
import { apcDefault, computeApc } from './calc.js';
import { apcScene, apcFlowSVG } from './scene.js';
import { mkParts, anatomy, costRows, stackRows } from '../mfg/kit.js';

export { apcDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = mkParts(['Collecting system', 'Casing, hoppers and structure', 'Electrical', 'Absorber', 'Recirculation and fans', 'Limestone and gypsum', 'Waste water and BoP', 'Civil, erection and test']).filter((p, i, a) => a.findIndex((q) => q[0] === p[0]) === i);
const MATS = ['Rubber / glass-flake lined carbon steel', 'Alloy 2205 clad'];
const esp = (c) => c.type === 'esp';

export const apcDef = {
  key: 'mf', name: 'unit', ratesTitle: 'Rates · plates, casing and equipment', qtyLabel: 'units',
  ratesNote: 'Not from a workbook: sizes follow standard sizing methods but prices are engineering assumptions. Replace with vendor quotes.',
  masterNote: 'ESP and FGD sizing constants, rates per kg, per kW and per lot, and the cost stack. Assumptions, not workbook values. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'ESP: Deutsch-Anderson gives the collecting area from the removal needed. FGD: gas flow sets absorber size, removal sets spray levels, SO₂ removed sets limestone and gypsum.',
  sectionHint: 'Flue-gas train with the sizing of the selected unit',
  views: [['section', 'Flue-gas train'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/unit', dec: 0, fn: (v) => v }, mw: { label: '₹ per MW (gas basis)', dec: 0, fn: (v, r) => v / (r.cfg.gas / 2.6e6 * 660) } },
  compute(st) { return st.list.map((c) => { const r = computeApc(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.pm[k] || 0 })) }; }); },
  title: (r) => r.cfg.tag, meta: (r) => `${esp(r.cfg) ? 'Electrostatic precipitator' : 'Wet limestone FGD'} · ${fmt(r.cfg.gas / 1e6, 2)} million Nm³/h`, pillOf: (r) => (esp(r.cfg) ? 'ESP' : 'FGD'),
  metrics: (r) => esp(r.cfg) ? [['Efficiency', `${(r.eta * 100).toFixed(3)}%`], ['Plate area', `${fmt(r.area / 1e3)}k m²`], ['Fields / TR sets', `${r.fields} / ${r.trs}`], ['Steel', `${fmt(r.steelT)} t`]] : [['SO₂ removal', `${(r.eta * 100).toFixed(1)}%`], ['Absorber', `${r.towers} × ${fmt(r.dia, 1)} m`], ['Limestone', `${fmt(r.limeTh, 1)} t/h`], ['Booster fan', `${fmt(r.fanKw / 1000, 1)} MW`]],
  scene: (r) => apcScene(r), section: (r) => apcFlowSVG(r),
  tabs: undefined,
  left(st, r, h) {
    const c = st.list[st.sel];
    return `<div class="label">Unit <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Unit'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Equipment</div>${h.seg([['esp', 'ESP'], ['fgd', 'Wet FGD']], c.type, 'type')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Flue gas</div>${h.num('Gas flow', 'gas', c.gas, 'any', 'Nm³/h')}${h.num('Gas temperature', 'temp', c.temp, 1, '°C')}
      ${esp(c) ? `<div class="two2"><div>${h.num('Inlet dust', 'dust', c.dust, 1, 'g/Nm³')}</div><div>${h.num('Outlet dust', 'outDust', c.outDust, 1, 'mg/Nm³')}</div></div>` : `<div class="two2"><div>${h.num('Inlet SO₂', 'so2', c.so2, 50, 'mg/Nm³')}</div><div>${h.num('Outlet SO₂', 'outSo2', c.outSo2, 10, 'mg/Nm³')}</div></div><div class="label">Absorber construction</div>${h.sel(MATS.map((k) => [k, k]), c.material, 'material')}`}
      ${r && r.error ? `<div class="banner" style="margin-top:14px"><div>${r.error}</div></div>` : ''}`;
  },
  rates(st) { const c = st.list[st.sel], T = st.T; return esp(c) ? [{ label: 'Collecting plates', path: 'esp.plateRate', value: T.esp.plateRate, unit: '₹/kg' }, { label: 'Casing, fabricated', path: 'esp.casingRate', value: T.esp.casingRate, unit: '₹/kg' }, { label: 'TR set with controller', path: 'esp.trSet', value: T.esp.trSet, unit: '₹' }, { label: 'Deutsch migration velocity', path: 'esp.w', value: T.esp.w, unit: 'm/s' }] : [{ label: 'Absorber steel, fabricated', path: 'fgd.fabRate', value: T.fgd.fabRate, unit: '₹/kg extra' }, { label: 'Lining', path: 'fgd.lining', value: T.fgd.lining, unit: '₹/m²' }, { label: 'Slurry pump with motor', path: 'fgd.pumpKwRate', value: T.fgd.pumpKwRate, unit: '₹/kW' }, { label: 'Liquid-to-gas ratio', path: 'fgd.lg', value: T.fgd.lg, unit: 'l/Nm³' }]; },
  isPricePath: () => false,
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, `Build-up of the ${esp(r.cfg) ? 'precipitator' : 'FGD plant'}`, esp(r.cfg) ? 'Collecting area follows the removal needed (Deutsch-Anderson); plates, casing and structure are priced by mass, transformer-rectifier sets by count. Engineering, overheads and margin are grossed up on the selling price.' : 'The absorber, recirculation pumps, fan, limestone and gypsum plants follow gas flow and SO₂ removal; waste-water treatment, piping and electrics are scaled lots. Engineering, overheads and margin are grossed up on the selling price.')], ['sens', 'Cost vs removal', (r, st, h) => sens(r, st, h)]],
  batchTitle: () => 'Unit batch · one row per unit',
  batchCols: [['Type', (c) => (esp(c) ? 'ESP' : 'FGD')], ['Million Nm³/h', (c) => fmt(c.gas / 1e6, 2), 1], ['Removal', (c, r) => `${(r.eta * 100).toFixed(esp(c) ? 3 : 1)}%`, 1], ['Size', (c, r) => r.size, 1]],
  calcRows(r) { const f = (v, d = 1) => fmt(v, d); return [esp(r.cfg) ? [['#', 'ESP sizing'], ['Gas flow at inlet (m³/s)', f(r.Q, 0)], ['Efficiency', `${f(r.eta * 100, 3)}%`], ['Specific collecting area (m²/(m³/s))', f(r.sca, 0)], ['Plate area (m²)', f(r.area, 0)], ['Fields', r.fields], ['Hoppers', r.hoppers], ['TR sets', r.trs], ['Steel (t)', f(r.steelT, 0)]] : [['#', 'FGD sizing'], ['Gas flow, saturated (m³/s)', f(r.Q, 0)], ['SO₂ removal', `${f(r.eta * 100, 1)}%`], ['Absorbers', r.towers], ['Absorber diameter (m)', f(r.dia, 1)], ['Absorber height (m)', f(r.height, 0)], ['Spray levels', r.levels], ['Recirculation pump (kW each)', f(r.pumpKw, 0)], ['Booster fan (kW)', f(r.fanKw, 0)], ['Limestone (t/h)', f(r.limeTh, 1)], ['Gypsum (t/h)', f(r.gypTh, 1)]], costRows(r, f)]; },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un], rows = (base, un = '') => Object.keys(T[base]).filter((k) => typeof T[base][k] === 'number').map((k) => P(`${base}.${k}`, k, T[base][k], un));
    return [{ title: 'ESP', rows: rows('esp') }, { title: 'Wet FGD', rows: rows('fgd') }, { title: 'Cost stack', rows: stackRows(T, P) }];
  },
  reset(st) { const d = apcDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};
function sens(r, st, h) {
  const { nf } = h, c = r.cfg, e = esp(c), xs = e ? [100, 50, 30, 20, 10] : [1200, 800, 400, 200, 100, 50], rows = xs.map((x) => { const y = computeApc({ ...c, ...(e ? { outDust: x } : { outSo2: x }) }, st.T); return { x, y }; }).filter((o) => !o.y.error);
  return `<div class="h3">Cost against the emission limit</div><p class="p">${e ? 'Each tighter dust limit needs more plate area: the area grows with the logarithm of the removal.' : 'A tighter SO₂ limit adds spray levels and pump power; the absorber itself changes little.'}</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Outlet limit</th><th class="r">Removal</th><th class="r">${e ? 'Plate area' : 'Spray levels'}</th><th class="r">Should-cost</th></tr></thead><tbody>${rows.map(({ x, y }) => `<tr class="${x === (e ? c.outDust : c.outSo2) ? 'sel' : ''}"><td>${x} mg/Nm³</td><td class="r">${(y.eta * 100).toFixed(e ? 3 : 1)}%</td><td class="r">${e ? `${nf(y.area / 1e3)}k m²` : y.levels}</td><td class="r">₹${nf(y.total / 1e7, 1)} Cr</td></tr>`).join('')}</tbody></table></div>`;
}
