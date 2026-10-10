// DG set model definition for the generic equipment UI. Every number comes from the workbook through ./model.js.
import { runDG, seedSpec, OPTIONS, BLOCKS, purchaseOrders, benchmarkTable, referenceTables, rateLibrary, stdKva } from './model.js';
import { dgScene } from './dg3d.js';
import { dgSectionSVG } from './dgSection.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export function dgDefault() {
  const base = seedSpec(), mk = (tag, o) => ({ ...base, tag, ...o });
  return { list: [mk('DG-01 320 kVA standby', {}), mk('DG-02 62.5 kVA site set', { kva: 62.5, panel: 'Manual', engine: 'Kirloskar', alternator: 'Kirloskar', enclosure: 'Weatherproof', autonomy: 8 }), mk('DG-03 125 kVA office', { kva: 125, engine: 'Cummins', alternator: 'Leroy Somer' }), mk('DG-04 625 kVA IV+', { kva: 625, norm: 'CPCB IV+', panel: 'AMF + ATS' }), mk('DG-05 1250 kVA data hall', { kva: 1250, norm: 'CPCB IV+', panel: 'AMF + ATS', autonomy: 12, insClass: 'H' }), mk('DG-06 2000 kVA prime', { kva: 2000, duty: 'Prime' })],
    sel: 0, unit: 'kva', qty: 1, view: 'cut', btab: 'anatomy', editPrices: false, T: { cells: {} } };
}
const EXTRA = [['over', 'Overheads & warranty', '#a8a29e'], ['margin', 'Margin, channel & discount', '#0f9d6b'], ['freight', 'Freight to site', '#475569']];
const BANDS = { engine: [84, [0, 41, 201, 601, 1201]], alt: [93, [0, 51, 101, 501, 1501]] };
const bandRow = (key, x) => { const [r0, th] = BANDS[key]; let i = 0; th.forEach((t, k) => { if (x >= t) i = k; }); return r0 + i; };

export const dgDef = {
  key: 'mf', name: 'DG set', ratesTitle: 'Rates · materials and bought-outs', qtyLabel: 'sets',
  ratesNote: 'Engine and alternator are bought-out items priced per kW and per kVA. Confirm them with vendor quotes (the workbook’s own Read Me says the same).',
  masterNote: 'Every reference table (T1–T19) and every rate in the workbook’s Rate Library, editable. Changes apply to all tabs and are kept in this browser.', resetLabel: 'Reset to workbook values',
  calcNote: 'The workbook’s Sizing and Cost Build-up sheets, line by line, for the current specification.',
  sectionHint: 'Plan view of the enclosure from the computed sizes',
  views: [['section', 'Layout'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st,
  maxRows: () => 20,
  units: { kva: { label: '₹/kVA', dec: 0, fn: (v, r) => v / r.spec.kva }, set: { label: '₹/set', dec: 0, fn: (v) => v }, kw: { label: '₹/kW', dec: 0, fn: (v, r) => v / (r.std * r.spec.pf) } },
  compute(st) {
    return st.list.map((spec) => {
      const r = runDG(spec, st.T); if (r.error) return r;
      const parts = [...r.blocks.map((b) => ({ k: b.k, l: b.label, col: b.col, v: b.total })), { k: 'over', l: EXTRA[0][1], col: EXTRA[0][2], v: r.overhead + r.warranty }, { k: 'margin', l: EXTRA[1][1], col: EXTRA[1][2], v: r.margin + r.qtyDisc + r.channel }, { k: 'freight', l: EXTRA[2][1], col: EXTRA[2][2], v: r.freight }];
      return { ...r, cfg: spec, parts };
    });
  },
  title: (r) => `${r.cfg.tag || 'DG set'} · ${fmt(r.cfg.kva, r.cfg.kva % 1 ? 1 : 0)} kVA`,
  meta: (r) => `${r.cfg.duty} · ${r.cfg.norm} · ${r.cfg.engine} engine ${fmt(r.engineKw, 0)} kW · ${r.cfg.alternator} alternator · ${r.cfg.enclosure === 'None' ? 'open set' : r.cfg.enclosure.toLowerCase() + ' enclosure'} · ${r.cfg.panel}`,
  pillOf: (r, st) => st.T.cells && r.cfg.stance,
  metrics: (r) => [['Rated set', `${fmt(r.std)} kVA / ${fmt(r.std * r.cfg.pf)} kW`], ['Engine', `${fmt(r.engineKw)} kW (${fmt(r.engineBhp)} BHP)`], ['Fuel at full load', `${fmt(r.fuelLph, 1)} L/h · tank ${fmt(r.tankL)} L`], ['Enclosure', r.cfg.enclosure === 'None' ? `${r.skid.L.toFixed(1)} × ${r.skid.W.toFixed(1)} m skid` : `${r.encl.L.toFixed(1)} × ${r.encl.W.toFixed(1)} × ${r.encl.H.toFixed(1)} m`]],
  scene: (r, view) => dgScene(r, view === 'cut'),
  section: (r) => dgSectionSVG(r),

  left(st, r, h) {
    const c = st.list[st.sel], o = OPTIONS;
    const std = r.std != null ? `<div class="note" style="padding:2px 0 8px">Selected standard rating <b>${fmt(r.std)} kVA</b>${r.derate < 1 ? `, after a ${((1 - r.derate) * 100).toFixed(1)}% site derate` : ''}.</div>` : '';
    return `<div class="label">Set <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'DG set'}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Duty and rating</div>
      ${h.slider('Required rating at site', 'kva', c.kva, 15, 3750, 5, 'kVA', (v) => fmt(v, v % 1 ? 1 : 0))}${std}
      <div class="label">Duty</div>${h.seg(o.duty.map((x) => [x, x]), c.duty, 'duty')}
      <div class="two2"><div>${h.num('Power factor', 'pf', c.pf, 0.05, '')}</div><div>${h.num('Order quantity', 'qty', c.qty, 1, 'nos')}</div></div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Site</div>
      ${h.slider('Ambient temperature', 'temp', c.temp, 25, 65, 1, '°C')}${h.slider('Altitude', 'alt', c.alt, 0, 3000, 50, 'm')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Specification</div>
      <div class="label">Emission norm</div>${h.seg(o.norm.map((x) => [x, x]), c.norm, 'norm')}
      <div class="label">Engine</div>${h.sel(o.engine.map((x) => [x, x]), c.engine, 'engine')}
      <div class="label">Alternator</div>${h.chips(o.alternator.map((x) => [x, x]), c.alternator, 'alternator')}
      <div class="label">Insulation class</div>${h.seg(o.insClass.map((x) => [x, 'Class ' + x]), c.insClass, 'insClass')}
      <div class="label">Enclosure</div>${h.seg(o.enclosure.map((x) => [x, x]), c.enclosure, 'enclosure')}
      <div class="label">Control panel</div>${h.seg(o.panel.map((x) => [x, x]), c.panel, 'panel')}
      ${h.slider('Fuel tank autonomy', 'autonomy', c.autonomy, 2, 24, 1, 'hours')}
      <hr class="divider"><div class="sec-h"><span class="step">4</span>Commercial</div>
      <div class="label">Pricing stance</div>${h.seg(o.stance.map((x) => [x, x.replace(' target', '').replace(' price', '')]), c.stance, 'stance')}
      <div class="label">Procurement channel <small>market stance only</small></div>${h.seg(o.channel.map((x) => [x, x.replace('Dealer / integrator', 'Dealer')]), c.channel, 'channel')}`;
  },

  rates(st) {
    const r = dgDef._last, c = st.list[st.sel], ek = r && r.engineKw ? r.engineKw : 200, kv = r && r.std ? r.std : c.kva, T = st.T.cells, W = (a, sheet = 'Reference') => T[`${sheet}!${a}`];
    const eRow = bandRow('engine', ek), aRow = bandRow('alt', kv), ref = (a) => W(a) ?? rawRef(a), rl = (a) => W(a, 'Rate Library') ?? rawRL(a);
    const R = [{ label: 'Engine base rate', cell: `Reference!C${eRow}`, value: ref(`C${eRow}`), unit: '₹/kW' }, { label: 'Alternator base rate', cell: `Reference!C${aRow}`, value: ref(`C${aRow}`), unit: '₹/kVA' },
      { label: 'MS plate and sheet', cell: 'Rate Library!D5', value: rl('D5'), unit: '₹/kg', cid: 'hr_plate' }, { label: 'CRCA sheet', cell: 'Rate Library!D6', value: rl('D6'), unit: '₹/kg', cid: 'crca_sheet' }, { label: 'Structural channel', cell: 'Rate Library!D7', value: rl('D7'), unit: '₹/kg', cid: 'ismc_section' },
      { label: 'Rockwool infill', cell: 'Rate Library!D12', value: rl('D12'), unit: '₹/kg', cid: 'rockwool' }, { label: 'Breaker', cell: 'Rate Library!D17', value: rl('D17'), unit: '₹/amp' }, { label: 'Assembly labour', cell: 'Rate Library!D18', value: rl('D18'), unit: '₹/hour' }];
    return R.map((x) => ({ label: x.label, path: `cells.${x.cell}`, value: x.value, unit: x.unit, cid: x.cid, price: !!x.cid }));
  },
  isPricePath: (p) => /Rate Library!D(5|6|7|12)$/.test(p),

  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, st, h)],
    ['sizing', 'Sizing cascade', (r, st, h) => sizing(r, h)],
    ['bench', 'Benchmark', (r, st, h) => benchmark(r, st, h)],
    ['po', 'PO validation', (r, st, h) => poValidation(st, h)],
  ],
  batchTitle: () => 'DG set batch · one row per set',
  batchCols: [['Rating kVA', (c) => fmt(c.kva, c.kva % 1 ? 1 : 0), 1], ['Duty', (c) => c.duty], ['Norm', (c) => c.norm], ['Engine', (c) => c.engine], ['Std kVA', (c, r) => fmt(r.std), 1], ['Engine kW', (c, r) => fmt(r.engineKw), 1], ['₹/kVA', (c, r) => fmt(r.perKvaSite), 1]],

  calcRows(r, st) {
    const f = (v, d = 2) => fmt(v, d), z = r.sizing;
    const col1 = [['#', 'Sizing'], ...Object.values(z).map((s) => [s.label, `${typeof s.v === 'number' ? f(s.v, Math.abs(s.v) < 10 ? 3 : 1) : s.v}${s.unit ? ' ' + s.unit : ''}`])];
    const col2 = [['#', 'Cost stack (₹)'], ...r.blocks.map((b) => [`${b.k}  ${b.label}`, f(b.total, 0)]), ['Direct cost', f(r.direct, 0)], [`Factory overhead (${(r.rates.overhead * 100).toFixed(1)}%)`, f(r.overhead, 0)], [`Warranty (${(r.rates.warranty * 100).toFixed(1)}%)`, f(r.warranty, 0)], ['Works cost', f(r.works, 0)], [`Manufacturer margin (${(r.rates.margin * 100).toFixed(1)}%)`, f(r.margin, 0)], ['Order quantity discount', f(r.qtyDisc, 0)], ['Channel margin', f(r.channel, 0)], [`Freight (${(r.rates.freight * 100).toFixed(1)}%)`, f(r.freight, 0)], ['Delivered price', f(r.total, 0)], ['Per kVA required at site', f(r.perKvaSite, 0)]];
    return [col1, col2];
  },
  master(st) {
    const T = st.T.cells, out = [];
    out.push({ title: 'Rate Library · unit rates', note: 'Editable unit rates for steel, fabrication, finishing and bought-out lots.', wide: true, rows: rateLibrary().map((x) => [x.label, `cells.Rate Library!${x.addr}`, T[`Rate Library!${x.addr}`] ?? x.value, 'any', 1, x.unit, x.note]) });
    for (const t of referenceTables()) {
      const hdr = t.header || [];
      const rows = t.rows.map((cells) => { const key = cells[0].v; return cells.slice(1).filter((x) => typeof x.v === 'number').map((x, i) => [`${key} · ${hdr[i + 1] ?? ''}`.replace(/ · $/, ''), `cells.Reference!${x.addr}`, T[`Reference!${x.addr}`] ?? x.v, 'any', /discount|overhead|warranty|margin|freight/i.test(hdr[i + 1] ?? '') ? 100 : 1, (/%|discount|overhead|warranty|margin|freight/i.test(hdr[i + 1] ?? '')) ? '%' : '']); }).flat();
      if (rows.length) out.push({ title: t.title, note: t.note, rows });
    }
    return out;
  },
  reset(st) { const d = dgDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};
import WB from './workbook.json' with { type: 'json' };
const rawRef = (a) => WB.Reference[a]?.v, rawRL = (a) => WB['Rate Library'][a]?.v;
// keep the last computed result so the rates card can show the active band
const _compute = dgDef.compute; dgDef.compute = function (st) { const res = _compute.call(this, st); dgDef._last = res[st.sel]; return res; };

function anatomy(r, st, h) {
  const { nf, pct } = h; let run = 0; const wf = r.parts.filter((p) => p.v !== 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Nine blocks, each derived separately</div><p class="p">Direct cost is the sum of blocks A to I; overheads, warranty, margin, quantity discount, channel margin and freight are layered on, following the pricing stance (${r.cfg.stance}).</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th>Unit</th><th class="r">Rate ₹</th><th class="r">Amount ₹</th><th>Derivation</th></tr></thead><tbody>
    ${r.blocks.map((b) => `<tr><td colspan="6" class="grp2"><b>${b.k} · ${b.label}</b> ₹${nf(b.total)} <span class="mut">${pct(b.total / r.direct, 1)} of direct</span></td></tr>${b.lines.map((l) => `<tr><td>${l.label}</td><td class="r">${typeof l.qty === 'number' ? nf(l.qty, l.qty % 1 ? 2 : 0) : (l.qty ?? '')}</td><td class="mut">${l.unit}</td><td class="r">${typeof l.rate === 'number' ? nf(l.rate, l.rate % 1 ? 2 : 0) : ''}</td><td class="r">${nf(l.amount)}</td><td class="mut">${l.how}</td></tr>`).join('')}`).join('')}
    </tbody></table></div>
    <div class="h3" style="margin-top:22px">From direct cost to delivered price</div>
    <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(Math.max(s.s0, 0) / r.total) * 100}%;width:${Math.max((Math.abs(s.v) / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}<div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Delivered price</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">₹${nf(r.total)}</b></div></div>`;
}
function sizing(r, h) {
  const { nf } = h;
  return `<div class="h3">From site load to engine and alternator</div><p class="p">The site rating is restated on a standby basis, divided by the temperature, altitude and insulation derates, and rounded up to the next standard alternator rating.</p>
    <div class="scroll"><table class="t num"><tbody>${Object.values(r.sizing).map((s, i) => `<tr><td><span class="step" style="margin-right:8px">${i + 1}</span>${s.label}</td><td class="r"><b>${typeof s.v === 'number' ? nf(s.v, Math.abs(s.v) < 10 ? 3 : 1) : s.v}</b> ${s.unit}</td><td class="mut">${s.how}</td></tr>`).join('')}</tbody></table></div>`;
}
function benchmark(r, st, h) {
  const { nf, pct } = h, B = benchmarkTable().filter((b) => b.l1), cfg = r.cfg, model = r.perKvaSite;
  const b = B.find((x) => x.kva === cfg.kva);
  // model curve across the standard ratings at this specification
  const std = stdKva().filter((k) => k >= 15), curve = std.map((k) => { const q = runDG({ ...cfg, kva: k }, st.T); return [k, q.error ? null : q.perKvaSite]; }).filter((x) => x[1]);
  const W = 760, H = 230, L = 52, Rr = 12, T = 12, Bm = 30, xs = (k) => L + (Math.log(k) - Math.log(15)) / (Math.log(3750) - Math.log(15)) * (W - L - Rr), maxY = 45000, ys = (v) => T + (1 - Math.min(v, maxY) / maxY) * (H - T - Bm);
  const dots = B.map((q) => `<circle cx="${xs(q.kva).toFixed(1)}" cy="${ys(q.l1 / q.kva).toFixed(1)}" r="3" fill="#94a3b8"><title>${q.kva} kVA · L1 ₹${nf(q.l1 / q.kva)}/kVA</title></circle>`).join('');
  const line = curve.map(([k, v]) => `${xs(k).toFixed(1)},${ys(v).toFixed(1)}`).join(' ');
  const grid = [0, 10000, 20000, 30000, 40000].map((v) => `<line x1="${L}" x2="${W - Rr}" y1="${ys(v)}" y2="${ys(v)}" stroke="#e6e9ee"/><text x="${L - 6}" y="${ys(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${nf(v / 1000)}k</text>`).join('') + [20, 50, 100, 250, 500, 1000, 2500].map((k) => `<text x="${xs(k)}" y="${H - 10}" text-anchor="middle" font-size="11" fill="#6b7482">${k}</text>`).join('');
  return `<div class="h3">Against vendor quotes and past purchase orders</div><p class="p">${b ? `At ${nf(cfg.kva)} kVA the workbook holds ${b.quotes} vendor quote(s): L1 ₹${nf(b.l1 / b.kva)}/kVA, high ₹${nf(b.high / b.kva)}/kVA${b.po ? `, and a past PO at ₹${nf(b.po / b.kva)}/kVA` : ''}. This set models at <b>₹${nf(model)}/kVA</b> (${r.cfg.stance}), ${pct(Math.abs(model / (b.l1 / b.kva) - 1), 1)} ${model < b.l1 / b.kva ? 'below' : 'above'} L1.` : `The workbook has no vendor quote at exactly ${nf(cfg.kva)} kVA. The chart shows every quoted rating (grey) against this specification across the standard ratings (blue).`}</p>
    <svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Vendor L1 and model, rupees per kVA">${grid}${dots}<polyline fill="none" stroke="#2563eb" stroke-width="2.4" points="${line}"/></svg>
    <div class="legend"><span><i style="background:#94a3b8"></i>Vendor L1 (₹/kVA)</span><span><i style="background:#2563eb"></i>This specification, modelled (₹/kVA at the standard rating)</span></div>`;
}
function poValidation(st, h) {
  const { nf, pct } = h, POs = purchaseOrders();
  const rows = POs.map((p) => { const q = runDG({ ...st.list[st.sel], kva: p.kva, duty: 'Standby', norm: p.norm, engine: p.engine, stance: 'Should-cost target' }, st.T); const m = q.error ? null : q.perKvaSite; return { ...p, m, v: m ? m / p.po - 1 : null }; });
  const ok = rows.filter((x) => x.v != null), mean = ok.reduce((s, x) => s + Math.abs(x.v), 0) / ok.length;
  return `<div class="h3">17 actual purchase orders</div><p class="p">Each PO re-run at the should-cost stance on this page’s other settings (alternator, enclosure, panel, tank). The workbook ran every PO on a standby basis, because the duty label on a PO follows the vendor, not the machine. Mean absolute variance now: <b>${pct(mean, 1)}</b>; model below ${ok.filter((x) => x.v < 0).length} of ${ok.length} POs.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>#</th><th class="r">kVA</th><th>Norm</th><th>Engine</th><th>Vendor</th><th class="r">PO ₹/kVA</th><th class="r">Model ₹/kVA</th><th class="r">Variance</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.n}</td><td class="r">${nf(x.kva)}</td><td>${x.norm}</td><td>${x.engine}</td><td>${x.vendor}</td><td class="r">${nf(x.po)}</td><td class="r"><b>${x.m ? nf(x.m) : '–'}</b></td><td class="r" style="color:${x.v == null ? 'inherit' : x.v < 0 ? 'var(--good)' : '#b45309'}">${x.v == null ? '–' : (x.v > 0 ? '+' : '') + (x.v * 100).toFixed(1) + '%'}</td></tr>`).join('')}</tbody></table></div>`;
}
