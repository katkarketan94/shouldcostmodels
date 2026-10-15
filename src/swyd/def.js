// Switchyard definition for the generic equipment UI.
import { swydDefault, computeSwyd, KV, SCHEMES } from './calc.js';
import { swydScene, swydSldSVG } from './scene.js';

export { swydDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const PARTS = [['Primary equipment', '#2563eb'], ['Structures and bus', '#c27a2c'], ['Protection and control', '#8b5cf6'], ['Cables and earthing', '#0ea5a4'], ['Civil and auxiliaries', '#94a3b8'], ['Erection and test', '#e8b923'], ['Engineering', '#7c6fd6'], ['Overheads', '#64748b'], ['Supervision, spares', '#b08968'], ['Margin', '#0f9d6b']];

export const swydDef = {
  key: 'mf', name: 'switchyard', ratesTitle: 'Rates · equipment and works', qtyLabel: 'yards',
  ratesNote: 'Not from a workbook: unit prices are engineering assumptions that scale with voltage, current and fault level. Replace with your supplier quotes.',
  masterNote: 'Equipment prices by voltage class, structure weights, bay dimensions, cabling, civil rates and the cost stack. Assumptions, not workbook values. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'The scheme sets breakers, isolators and couplers per feeder; equipment, structures, bus, protection, cables, earthing and civil work follow the bay count and voltage class.',
  sectionHint: 'Single-line diagram of the chosen bus scheme',
  views: [['section', 'Single line'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { unit: { label: '₹/yard', dec: 0, fn: (v) => v }, bay: { label: '₹/bay', dec: 0, fn: (v, r) => v / r.bays }, cb: { label: '₹/breaker', dec: 0, fn: (v, r) => v / r.cb } },
  compute(st) { return st.list.map((c) => { const r = computeSwyd(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.pm[k] || 0 })) }; }); },
  title: (r) => r.cfg.tag || 'Switchyard',
  meta: (r) => `${r.kv} kV ${r.gis ? 'GIS' : 'AIS'} · ${r.sc[0].toLowerCase()} · ${r.feeders} feeder bays · ${r.cfg.kA} kA`,
  pillOf: (r) => `${r.kv} kV`,
  metrics: (r) => [['Bays / breakers', `${r.bays} / ${r.cb}`], ['Structural steel', `${fmt(r.steelT)} t`], ['Land (indicative)', `${fmt(r.areaHa, 1)} ha`], ['Per bay', `₹${fmt(r.perBay / 1e7, 2)} Cr`]],
  scene: (r) => swydScene(r), section: (r) => swydSldSVG(r),
  tabs: undefined,

  left(st, r, h) {
    const c = st.list[st.sel];
    return `<div class="label">Switchyard <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Switchyard'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Voltage and scheme</div>
      <div class="label">System voltage <small>kV</small></div>${h.chips(KV.map((k) => [k, k]), c.kv, 'kv')}
      <div class="label">Bus scheme</div><div class="fam" style="grid-template-columns:repeat(1,1fr)">${Object.entries(SCHEMES).map(([k, s]) => `<button data-mset="scheme" data-mv='"${k}"' class="${c.scheme === k ? 'on' : ''}"><span>${s[0]}</span></button>`).join('')}</div>
      <div class="label">Insulation</div>${h.seg([['AIS', 'Air-insulated'], ['GIS', 'Gas-insulated']], c.gis, 'gis')}
      <div class="two2"><div>${h.num('Rated current', 'amps', c.amps, 50, 'A')}</div><div>${h.num('Fault level', 'kA', c.kA, 0.5, 'kA')}</div></div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Feeder bays</div>
      <div class="two2"><div>${h.num('Line bays', 'lines', c.lines, 1, '')}</div><div>${h.num('Transformer bays', 'xfmr', c.xfmr, 1, '')}</div></div>
      <div class="two2"><div>${h.num('Reactor bays', 'reactor', c.reactor, 1, '')}</div><div>${h.num('Equipped spare bays', 'spare', c.spare, 1, '')}</div></div>
      <div class="note" style="padding:6px 0 0">${r && !r.error ? `${r.feeders} feeders${r.couplers ? ` + ${r.couplers} coupler` : ''} = ${r.bays} bays · ${r.cb} breakers · ${r.iso} isolators` : ''}</div>`;
  },
  rates(st) {
    const T = st.T, c = st.list[st.sel], kv = c.kv;
    return [{ label: `Breaker ${kv} kV, 2,000 A 40 kA`, path: `cb.${kv}`, value: T.cb[kv], unit: '₹' }, { label: `Isolator with earth switch`, path: `iso.${kv}`, value: T.iso[kv], unit: '₹' }, { label: 'Structure, galvanised', path: 'steelRate', value: T.steelRate, unit: '₹/kg', cid: 'hr_plate', price: true },
      { label: 'Aluminium conductor', path: 'alRate', value: T.alRate, unit: '₹/kg', cid: 'aluminium', price: true }, { label: 'Civil works per bay', path: `civil.${kv}`, value: T.civil[kv], unit: '₹' }];
  },
  isPricePath: (p) => p === 'steelRate' || p === 'alRate',
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['schedule', 'Equipment schedule', (r, st, h) => schedule(r, h)],
    ['gis', 'AIS vs GIS', (r, st, h) => gisTab(r, st, h)],
  ],
  batchTitle: () => 'Switchyard batch · one row per yard',
  batchCols: [['kV', (c) => c.kv], ['Scheme', (c) => SCHEMES[c.scheme][0]], ['Type', (c) => c.gis], ['Bays', (c, r) => r.bays, 1], ['Steel t', (c, r) => fmt(r.steelT), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Layout'], ['Voltage (kV)', r.kv], ['Scheme', r.sc[0]], ['Feeder bays', r.feeders], ['Coupler bays', r.couplers], ['Breakers', r.cb], ['Isolators', r.iso], ['CT sets', r.ct], ['CVTs', r.cvt], ['Surge arresters', r.la], ['Wave traps', r.wt], ['Bus length (m, 3 phase)', f(r.busLen, 0)], ['Structural steel (t)', f(r.steelT, 0)], ['Land (ha)', f(r.areaHa, 1)]],
      [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Direct cost', f(r.base, 0)], ['Engineering', f(r.pm.Engineering, 0)], ['Overheads', f(r.pm.Overheads, 0)], ['Supervision, spares', f(r.pm['Supervision, spares'], 0)], ['Margin', f(r.pm.Margin, 0)], ['Total', f(r.total, 0)]]];
  },
  master(st) {
    const T = st.T, P = (path, label, v, un, scale = 1) => [label, path, v, 'any', scale, un], byKv = (base, label, un) => ({ title: label, rows: KV.map((k) => P(`${base}.${k}`, `${k} kV`, T[base][k], un)) });
    return [{ title: 'Commodity-linked rates', rows: [P('steelRate', 'Structure, galvanised', T.steelRate, '₹/kg'), P('alRate', 'Aluminium', T.alRate, '₹/kg'), P('fabAl', 'Conductor fabrication', T.fabAl, '₹/kg')] },
      byKv('cb', 'Circuit breaker, 2,000 A 40 kA', '₹'), byKv('iso', 'Isolator with earth switch', '₹'), byKv('ct', 'Current transformer set', '₹'), byKv('cvt', 'CVT', '₹'), byKv('la', 'Surge arrester', '₹'), byKv('wt', 'Wave trap', '₹'),
      byKv('structT', 'Structure steel per bay', 't'), byKv('bayW', 'Bay width', 'm'), byKv('bayL', 'Bay length', 'm'), byKv('insul', 'Insulators and hardware per bay', '₹'), byKv('earth', 'Earthing per bay', '₹'), byKv('civil', 'Civil per bay', '₹'),
      { title: 'Scaling and stack', rows: [P('ampExp', 'Breaker current exponent', T.ampExp, ''), P('kaExp', 'Breaker fault-level exponent', T.kaExp, ''), P('isoNoEs', 'Isolator without earth switch', T.isoNoEs, '×'), P('gis.f', 'GIS premium on primary equipment', T.gis.f, '×'), P('stack.engineering', 'Engineering', T.stack.engineering, '%', 100), P('stack.overheads', 'Overheads', T.stack.overheads, '%', 100), P('stack.margin', 'Margin', T.stack.margin, '%', 100), P('stack.misc', 'Supervision, spares', T.stack.misc, '%', 100)] }];
  },
  reset(st) { const d = swydDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up of the switchyard</div><p class="p">The scheme fixes the number of breakers and isolators; equipment prices scale with rated current and fault level. Structures are priced by tonne, bus by conductor mass, and protection, cabling, earthing and civil by bay. Engineering, overheads and margin are grossed up on the selling price.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(tot)}</td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${l.unit === 'lot' ? '–' : nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Engineering, overheads, supervision and margin</b></td></tr>${['Engineering', 'Overheads', 'Supervision, spares', 'Margin'].map((k) => `<tr><td>${k}</td><td></td><td></td><td class="r">₹${nf(r.pm[k])}</td><td></td></tr>`).join('')}<tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function schedule(r, h) {
  const { nf } = h, rows = [['Circuit breakers', r.cb], ['Isolators with earth switch', r.esIso], ['Isolators without earth switch', r.plainIso], ['CT sets', r.ct], ['Capacitive voltage transformers', r.cvt], ['Surge arresters', r.la], ['Wave traps', r.wt]];
  return `<div class="h3">Equipment schedule</div><p class="p">${r.sc[0]}: ${r.sc[2] === 1.5 ? 'three breakers share two feeders' : 'one breaker per feeder'}${r.couplers ? ', plus a bus or transfer coupler' : ''}. Quantities are for the whole yard.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Quantity</th></tr></thead><tbody>${rows.map(([l, q]) => `<tr><td>${l}</td><td class="r">${nf(q)}</td></tr>`).join('')}<tr><td>Bus conductor (3 phase)</td><td class="r">${nf(r.busLen)} m</td></tr><tr><td>Structural steel</td><td class="r">${nf(r.steelT)} t</td></tr><tr><td>Land, indicative</td><td class="r">${nf(r.areaHa, 1)} ha</td></tr></tbody></table></div>`;
}
function gisTab(r, st, h) {
  const { nf } = h, a = computeSwyd({ ...r.cfg, gis: 'AIS' }, st.T), g = computeSwyd({ ...r.cfg, gis: 'GIS' }, st.T), row = (l, x, on) => `<tr class="${on ? 'sel' : ''}"><td>${l}</td><td class="r">₹${nf(x.total / 1e7, 1)} Cr</td><td class="r">${nf(x.steelT)} t</td><td class="r">${nf(x.areaHa, 1)} ha</td></tr>`;
  return `<div class="h3">Air-insulated against gas-insulated</div><p class="p">The same bays in GIS cost more in equipment but need a fraction of the land, steel and civil work. GIS pays back where land is dear, the site is polluted or coastal, or space is tight.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Type</th><th class="r">Should-cost</th><th class="r">Steel</th><th class="r">Land</th></tr></thead><tbody>${row('Air-insulated (AIS)', a, !r.gis)}${row('Gas-insulated (GIS)', g, r.gis)}</tbody></table></div>
    <p class="note" style="padding:6px 0">GIS is ${nf(g.total / a.total, 2)}× the AIS cost on this layout, before land. Land cost is not in the model: add it as a separate line in the project estimate.</p>`;
}
