// Pipes (metal from the workbook, plastic from an own model) for the generic equipment UI.
import { runPipe, seedPipes, defaultPipe, npsList, dnList, schedulesFor, dnClasses, npsLabel, MOC, OPTIONS, assumptionValue } from './model.js';
import { plasticDefault, computePlastic, FAMILIES, PLASTIC_DEFAULTS, wallOf } from './plastic.js';
import { pipeScene, pipeSectionSVG, metalLayers, plasticLayers } from './pipe3d.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export function pipesDefault() {
  const common = { sel: 0, unit: 'm', qty: 1000, view: '3d', btab: 'anatomy', editPrices: false };
  const pl = plasticDefault();
  return { kind: 'metal', metal: { ...common, list: seedPipes(), band: 'hi' }, plastic: { ...common, list: pl.list }, T: { ass: {}, ...clone(PLASTIC_DEFAULTS) } };
}
const PARTS_M = [['rm', 'Raw material (net of scrap credit)', '#c27a2c'], ['opex', 'Operating costs', '#2563eb'], ['coat', 'Coating, painting & galvanising', '#0ea5a4'], ['test', 'Testing & end finishing', '#8b5cf6'], ['margin', 'Margin', '#0f9d6b'], ['uplift', 'Tolerance & end uplift', '#e8b923'], ['interest', 'Payment interest', '#94a3b8'], ['trans', 'Logistics', '#64748b']];
const PARTS_P = [['rm', 'Resin compound (net of regrind)', '#c27a2c'], ['conversion', 'Extrusion & conversion', '#2563eb'], ['testing', 'Testing & documents', '#8b5cf6'], ['margin', 'Margin', '#0f9d6b'], ['interest', 'Payment interest', '#94a3b8'], ['transport', 'Logistics', '#64748b']];
const mocLabel = (m) => MOC[m]?.label ?? m;

function metalResult(p, st) {
  const r = runPipe(p, st.T); if (r.error) return r;
  const hi = st.metal.band === 'hi', total = hi ? r.hi : r.lo, opex = hi ? r.opexHiM : r.opexLoM, trans = hi ? r.transHi : r.transLo;
  const base = r.rm + opex + r.scrap + r.coating + r.galvM + r.testing + r.endM, margin = base * r.margin;
  const tolEnd = base * (1 + r.margin) * ((1 + r.tolPct) * (1 + r.endPct) - 1), interest = base * (1 + r.margin) * (1 + r.tolPct) * (1 + r.endPct) * r.interest;
  const parts = [r.rm + r.scrap, opex, r.coating + r.galvM, r.testing + r.endM, margin, tolEnd, interest, trans];
  return { ...r, cfg: p, kind: 'metal', total, opex, trans, base, marginAmt: margin, tolEnd, interestAmt: interest, parts: PARTS_M.map(([k, l, col], i) => ({ k, l, col, v: parts[i] })) };
}
function plasticResult(c, st) {
  const r = computePlastic(c, st.T); if (r.error) return r;
  return { ...r, kind: 'plastic', od: c.od, parts: PARTS_P.map(([k, l, col]) => ({ k, l, col, v: r.parts[k] })) };
}

export const pipesDef = {
  key: 'mf', name: 'pipes', ratesTitle: 'Raw material rates', qtyLabel: 'm of pipe',
  ratesNote: 'Metal rates are the workbook’s Assumptions sheet. Plastic rates and conversion costs are assumptions: replace them with quotes.',
  masterNote: 'Metal: every raw-material price, percentage and finishing cost from the workbook’s Assumptions sheet. Plastic: resin, conversion and margin assumptions. Changes are kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Metal: the workbook’s formulas, cell by cell. Plastic: the same cost structure with extrusion-specific rates.',
  sectionHint: 'Cross-section from the computed wall thickness; coatings drawn thicker than real',
  views: [['section', 'Cross-section'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st[st.kind],
  maxRows: () => 30,
  units: { m: { label: '₹/m', dec: 0, fn: (v) => v }, kg: { label: '₹/kg', dec: 1, fn: (v, r) => v / r.wtM }, t: { label: '₹/tonne', dec: 0, fn: (v, r) => v / r.wtM * 1000 } },
  compute(st) { const g = st[st.kind]; return g.list.map((p) => (st.kind === 'metal' ? metalResult(p, st) : plasticResult(p, st))); },
  title: (r) => (r.kind === 'metal' ? `${r.cfg.tag || 'Pipe'}` : `${r.cfg.tag || r.cfg.family}`),
  meta: (r) => (r.kind === 'metal'
    ? `${mocLabel(r.cfg.moc)}${r.cfg.grade && r.cfg.grade !== r.cfg.moc ? ` · ${r.cfg.grade}` : ''} · ${r.cfg.type.toLowerCase()} · OD ${fmt(r.od, r.od % 1 ? 1 : 0)} × ${r.wall} mm wall · ${r.cfg.end.toLowerCase()}`
    : `${r.cfg.family} · ${r.family.std} · OD ${fmt(r.od, r.od % 1 ? 2 : 0)} × ${r.wall} mm wall`),
  pillOf: (r, st) => (r.kind === 'metal' ? (st.metal.band === 'hi' ? 'Upper rate' : 'Lower rate') : r.cfg.family),
  metrics: (r) => [['Weight', `${fmt(r.wtM, 2)} kg/m`], ['Wall / ID', `${r.wall} / ${fmt(r.id, 1)} mm`], [r.kind === 'metal' ? 'Raw material' : 'Resin', r.kind === 'metal' ? `₹${fmt(r.rmTotalPx, 1)}/kg` : `₹${fmt(r.resin, 0)}/kg`], ['₹ per kg', `₹${fmt(r.total / r.wtM, 1)}`]],
  scene(r, view) {
    const cut = view === 'cut';
    if (r.kind === 'plastic') return pipeScene(plasticLayers(r, r.cfg, FAMILIES[r.cfg.family].color), { stripe: r.cfg.family === 'HDPE PE100' }, cut);
    const c = r.cfg; return pipeScene(metalLayers(r, c), { end: c.end, socket: c.moc === 'Ductile Iron' && c.di === 'Socket & spiget ends', flange: c.moc === 'Ductile Iron' && c.di === 'Double flange type' }, cut);
  },
  section(r) {
    if (r.kind === 'plastic') return pipeSectionSVG(r.cfg.tag, `${r.cfg.family} pipe · ${r.family.std}`, plasticLayers(r, r.cfg, FAMILIES[r.cfg.family].color), r.od, r.wall, r.id, [`${fmt(r.wtM, 2)} kg per metre`]);
    const c = r.cfg; return pipeSectionSVG(c.tag, `${mocLabel(c.moc)} ${c.type.toLowerCase()} pipe`, metalLayers(r, c), r.od, r.wall, r.id, [`${fmt(r.wtM, 2)} kg per metre`, c.std === 'Standard' ? `${c.moc === 'Ductile Iron' ? 'DN ' + c.nps : 'NPS ' + npsLabel(c.nps)} · ${c.sch}` : 'Non-standard size']);
  },

  left(st, r, h) {
    const k = st.kind, g = st[k], c = g.list[g.sel];
    const toggle = `<div class="toggle2">${[['metal', 'Metal'], ['plastic', 'Plastic']].map(([v, l]) => `<button data-mset="$kind" data-mv='"${v}"' class="${k === v ? 'on' : ''}">${l}</button>`).join('')}</div>`;
    const pick = `<div class="label">Pipe <small>${g.list.length} in register</small></div>${h.sel(g.list.map((x, i) => [i, `${i + 1}. ${x.tag || 'Pipe'}`]), g.sel, `$${k}.sel`)}${h.tag(c.tag)}`;
    if (k === 'plastic') {
      const f = FAMILIES[c.family], ods = f.od;
      return `${toggle}${pick}<hr class="divider"><div class="sec-h"><span class="step">1</span>Material &amp; size</div>
        <div class="fam" style="grid-template-columns:repeat(2,1fr)">${Object.entries(FAMILIES).map(([n, x]) => `<button data-mset="family" data-mv='"${n}"' class="${c.family === n ? 'on' : ''}"><span>${x.label}</span></button>`).join('')}</div>
        <div class="label">Outside diameter <small>mm · ${f.std}</small></div>${h.sel(ods.map((o) => [o, c.family === 'CPVC' ? `${o} mm (${['1/2', '3/4', '1', '1 1/4', '1 1/2', '2', '2 1/2', '3', '4'][ods.indexOf(o)]}")` : `${o} mm`]), c.od, 'od')}
        <div class="label">${c.family === 'HDPE PE100' || c.family === 'PP-R' ? 'SDR / pressure rating' : c.family === 'PVC-U' ? 'Pressure class' : 'Schedule'}</div>${h.sel(f.ratings.map(([l, v]) => [v, l]), c.rating, 'rating')}
        <div class="label">Wall thickness <small>from the rating</small></div><div class="price num" style="padding:6px 2px"><b>${r.wall ?? '–'} mm</b></div>
        <hr class="divider"><div class="sec-h"><span class="step">2</span>Commercial</div>${h.num('Quantity in register', 'qty', c.qty, 100, 'm')}<div class="label">Payment period <small>months</small></div><input class="cell fw" type="number" step="1" data-mt="interest.months" value="${st.T.interest.months}" aria-label="Payment period">`;
    }
    const mt = MOC[c.moc], std = c.std === 'Standard', di = c.moc === 'Ductile Iron';
    const sizes = di ? dnList().map((n) => [n, `DN ${n}`]) : npsList().map((n) => [n, `${npsLabel(n)}"`]);
    const sch = (di ? dnClasses(c.nps) : schedulesFor(c.nps));
    const yn = [['Yes', 'Yes'], ['No', 'No']];
    return `${toggle}${pick}<div class="label">Rate basis</div>${h.seg([['hi', 'Upper rate'], ['lo', 'Lower rate']], g.band, `$metal.band`)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Material</div>
      <div class="chips">${Object.entries(MOC).map(([m, x]) => `<button class="chip ${c.moc === m ? 'on' : ''}" data-mset="moc" data-mv='"${m}"'>${x.label}</button>`).join('')}</div>
      ${mt.grades.length > 1 ? `<div class="label">Grade</div>${h.sel(mt.grades.map((x) => [x, x]), c.grade, 'grade')}` : ''}
      <div class="label">Manufacture</div>${h.seg(OPTIONS.type.map((x) => [x, x]), c.type, 'type')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Size</div>
      ${h.seg([['Standard', 'Standard schedule'], ['Non-standard', 'Custom OD / wall']], c.std, 'std')}
      ${std ? `<div class="label">${di ? 'Nominal diameter' : 'Nominal pipe size'}</div>${h.sel(sizes, c.nps, 'nps')}<div class="label">${di ? 'Class' : 'Schedule'} <small>wall in mm</small></div>${sch.length ? h.sel(sch.map(([n, w]) => [n, `${n} · ${fmt(w * (di ? 1 : 25.4), 2)} mm`]), c.sch, 'sch') : '<div class="note" style="padding:4px 0">No schedule listed for this size.</div>'}`
        : `${h.num('Outside diameter', 'od', c.od, 1, 'mm')}${h.num('Wall thickness', 'wt', c.wt, 0.5, 'mm')}`}
      ${h.num('Length', 'len', c.len, 1, 'm')}${h.num('Quantity in register', 'qty', c.qty, 100, 'm')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Finish</div>
      <div class="label">Pipe ends</div>${h.seg(OPTIONS.end.map((x) => [x, x.replace(' end', '')]), c.end, 'end')}
      ${di ? `<div class="label">Ductile iron finish</div>${h.seg(OPTIONS.di.map((x) => [x, x.startsWith('Socket') ? 'Socket & spigot' : 'Double flange']), c.di, 'di')}` : ''}
      <div class="two2"><div><div class="label">Galvanising</div>${h.seg(yn, c.galv, 'galv')}</div><div><div class="label">Cement lining</div>${h.seg(yn, c.cement, 'cement')}</div></div>
      <div class="label">Painting</div>${h.seg(OPTIONS.paint.map((x) => [x, x]), c.paint, 'paint')}
      <div class="label">Coating</div>${h.sel(OPTIONS.coat.map((x) => [x, x]), c.coat, 'coat')}
      ${c.coat !== 'NA' ? `<div class="label">Coated surface</div>${h.sel(OPTIONS.coatSurf.map((x) => [x, x]), c.coatSurf, 'coatSurf')}` : ''}
      <hr class="divider"><div class="sec-h"><span class="step">4</span>Testing &amp; logistics</div>
      <div class="two2"><div><div class="label">IBR</div>${h.seg(yn, c.ibr, 'ibr')}</div><div><div class="label">NACE</div>${h.seg(yn, c.nace, 'nace')}</div></div>
      <div class="two2"><div><div class="label">Hydrogen service</div>${h.seg(yn, c.h2, 'h2')}</div><div><div class="label">Test documents</div>${h.seg(yn, c.doc, 'doc')}</div></div>
      <div class="label">Certificate type</div>${h.seg(OPTIONS.docType.map((x) => [x, 'EN 10204 ' + x]), c.docType, 'docType')}
      ${h.num('Distance mill to site', 'dist', c.dist, 10, 'km')}${h.num('Credit period', 'months', c.months, 1, 'months')}`;
  },
  afterEdit(st, path) {
    if (st.kind === 'plastic' && path === 'family') { const c = st.plastic.list[st.plastic.sel], f = FAMILIES[c.family]; if (!f.od.includes(c.od)) c.od = f.od[Math.floor(f.od.length / 3)]; if (!f.ratings.some(([, v]) => v === c.rating)) c.rating = f.ratings[Math.floor(f.ratings.length / 2)][1]; }
    if (st.kind !== 'metal') return;
    const c = st.metal.list[st.metal.sel];
    if (path === 'moc') { c.grade = MOC[c.moc].grades[0]; if (c.moc === 'Ductile Iron') { c.nps = 300; c.sch = 'K9'; } else if (c.nps > 100) { c.nps = 12; c.sch = 'SCH 40'; } }
    if (path === 'nps' || path === 'moc' || path === 'std') { const s = c.moc === 'Ductile Iron' ? dnClasses(c.nps) : schedulesFor(c.nps); if (s.length && !s.some(([n]) => n === c.sch)) c.sch = (s.find(([n]) => n === 'SCH 40' || n === 'K9') || s[0])[0]; }
  },

  rates(st) {
    if (st.kind === 'plastic') return Object.keys(st.T.resin).map((f) => ({ label: `${f} resin`, path: `resin.${f}`, value: st.T.resin[f], unit: '₹/kg', cid: { 'HDPE PE100': 'hdpe_resin', 'PVC-U': 'pvc_resin', 'PP-R': 'ppr_resin', CPVC: 'cpvc_resin' }[f], price: true }));
    const R = [['Mild steel plate', 'D55', 'ms_plate'], ['Ductile iron (pig iron)', 'D57', 'pig_iron'], ['Stainless 304', 'D47', 'ss304_rm'], ['Stainless 316', 'D52', 'ss316_rm'], ['Zinc for galvanising', 'D116', 'zinc'], ['USD to INR', 'D6', null]];
    return R.map(([label, a, cid]) => ({ label, path: `ass.${a}`, value: st.T.ass[a] ?? assumptionValue(a), unit: a === 'D6' ? '₹' : '₹/kg', cid, price: !!cid }));
  },
  isPricePath: (p) => /^(resin\.|ass\.D(55|57|47|48|52|116))/.test(p),

  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => (r.kind === 'metal' ? anatomyM(r, st, h) : anatomyP(r, h))],
    ['geometry', 'Weight & geometry', (r, st, h) => geometry(r, h)],
    ['range', 'Upper vs lower rate', (r, st, h) => range(r, st, h)],
  ],
  batchTitle: (st) => (st.kind === 'metal' ? 'Procurement register · metal pipes' : 'Procurement register · plastic pipes'),
  batchCols: [['Material', (c) => (c.family ? c.family : mocLabel(c.moc))], ['OD mm', (c, r) => fmt(r.od, r.od % 1 ? 1 : 0), 1], ['Wall mm', (c, r) => fmt(r.wall, r.wall % 1 ? 2 : 0), 1], ['kg/m', (c, r) => fmt(r.wtM, 1), 1], ['Qty m', (c) => fmt(c.qty), 1], ['₹ Cr', (c, r) => fmt(r.total * c.qty / 1e7, 2), 1]],
  batchFoot(st, res) { const t = res.reduce((s, r, i) => s + (r.error ? 0 : r.total * st[st.kind].list[i].qty), 0), q = st[st.kind].list.reduce((s, c) => s + c.qty, 0); return `<tr class="total"><td>Register total</td><td></td><td></td><td></td><td></td><td class="r">${fmt(q)}</td><td class="r">${fmt(t / 1e7, 2)}</td><td></td><td class="r"><b>₹${fmt(t / q, 0)}/m avg</b></td></tr>`; },

  calcRows(r, st) {
    const f = (v, d = 2) => fmt(v, d);
    if (r.kind === 'plastic') return [[['#', 'Geometry'], ['Outside diameter (mm)', f(r.od)], ['Wall (mm)', f(r.wall, 1)], ['Inside diameter (mm)', f(r.id, 1)], ['Density (g/cm³)', r.rho], ['Weight (kg/m)', f(r.wtM, 3)], ['With yield loss (kg/m)', f(r.rmKg, 3)]],
      [['#', 'Cost build-up (₹/m)'], ['Resin compound', `${f(r.resin, 0)} × (1 + ${(r.addPct * 100).toFixed(0)}%) = ₹${f(r.compound, 1)}/kg`], ['Raw material', f(r.rm)], ['Regrind credit', f(r.scrap)], ['Conversion', `${f(r.conversion)} (₹${f(r.convKg, 1)}/kg)`], ['Testing & documents', f(r.testing)], ['Margin', f(r.marginAmt)], ['Interest', f(r.interestAmt)], [`Logistics (load factor ${r.loadFactor})`, f(r.transport)], ['Total', f(r.total)]]];
    return [[['#', 'Geometry'], ['Outside diameter (mm)', f(r.od)], ['Wall (mm)', f(r.wall, 2)], ['Inside diameter (mm)', f(r.id, 2)], ['Density (g/cm³)', r.density], ['Weight (kg/m)', f(r.wtM, 3)], ['Yield loss', `${(r.loss * 100).toFixed(1)}% → ${f(r.rmKgM, 3)} kg/m`],
      ['#', 'Prices'], ['Raw material (₹/kg)', f(r.rmPx, 2)], ['Grade premium (₹/kg)', f(r.gradePx, 2)], ['Scrap credit (₹/kg)', f(r.scrapPx, 3)], ['Operating costs (₹/kg upper / lower)', `${f(r.opexHi, 2)} / ${f(r.opexLo, 2)}`], ['Margin', `${(r.margin * 100).toFixed(0)}%`], ['Tolerance uplift', `${(r.tolPct * 100).toFixed(1)}% (${f(r.tolMm, 2)} mm)`], ['Payment interest', `${(r.interest * 100).toFixed(2)}%`]],
      [['#', 'Cost build-up (₹/m, upper rate)'], ['Raw material', f(r.rm)], ['Operating costs', f(r.opexHiM)], ['Scrap credit', f(r.scrap)], ['Painting, coating & lining', f(r.coating)], ['Galvanising', f(r.galvM)], ['Testing & compliance', f(r.testing)], ['Pipe end finishing', f(r.endM)], ['Logistics', f(r.transHi)], ['Cost of pipe', f(r.hi)], ['Per kg', f(r.kgHi)]]];
  },
  master(st) {
    if (st.kind === 'plastic') {
      const T = st.T, P = (path, label, v, un, step = 'any', scale = 1) => [label, path, v, step, scale, un], fam = Object.keys(FAMILIES);
      return [{ title: 'Resin prices', rows: fam.map((k) => P(`resin.${k}`, `${k}`, T.resin[k], '₹/kg')) }, { title: 'Additives and compounding', note: 'Masterbatch, stabilisers, fillers and lubricants as a share of resin cost.', rows: fam.map((k) => P(`additivePct.${k}`, k, T.additivePct[k], '% of resin', 'any', 100)) },
        { title: 'Conversion · energy, labour, depreciation, other', rows: fam.flatMap((k) => Object.keys(T.conversion[k]).map((x) => P(`conversion.${k}.${x}`, `${k} · ${x}`, T.conversion[k][x], '₹/kg'))) },
        { title: 'Scrap, wall adder and testing', rows: [P('yieldLoss', 'Start-up and trim loss', T.yieldLoss, '%', 'any', 100), P('regrindRecovery', 'Value recovered by regrind', T.regrindRecovery, '%', 'any', 100), P('thickWallPct', 'Thick-wall conversion adder', T.thickWallPct, '% per mm above 10', 'any', 100), P('testing.hydroPerKg', 'Hydro test', T.testing.hydroPerKg, '₹/kg'), P('testing.docPerKg', 'Documents', T.testing.docPerKg, '₹/kg'), P('stress.PVC-U', 'PVC-U design stress', T.stress['PVC-U'], 'MPa')] },
        { title: 'Commercial', rows: [...fam.map((k) => P(`margin.${k}`, `${k} margin`, T.margin[k], '%', 'any', 100)), P('interest.rate', 'Annual interest', T.interest.rate, '%', 'any', 100), P('interest.months', 'Credit period', T.interest.months, 'months'), P('logistics.loadingPerTon', 'Loading cost', T.logistics.loadingPerTon, '₹/tonne')] }];
    }
    const A = (a) => st.T.ass[a] ?? assumptionValue(a), P = (a, label, un, scale = 1, step = 'any') => [label, `ass.${a}`, A(a), step, scale, un];
    return [
      { title: 'Raw material prices', note: 'Steelmint-based prices in the workbook. The month selector overwrites the ones that map to the common price file.', rows: [P('D6', 'USD to INR', '₹'), P('D55', 'Mild steel / carbon steel plate', '₹/kg'), P('D57', 'Ductile iron (pig iron)', '₹/kg'), P('D47', 'Stainless 304', '₹/kg'), P('D48', 'Stainless 304L', '₹/kg'), P('D49', 'Stainless 410', '₹/kg'), P('D50', 'Stainless 304L (A358)', '₹/kg'), P('D51', 'Stainless 316L (A358)', '₹/kg'), P('D52', 'Stainless 316 / 316L', '₹/kg'), P('G27', 'Billet cheaper than plate', '₹/kg')] },
      { title: 'Yield loss', rows: [P('C62', 'Stainless, welded', '%', 100), P('D62', 'Stainless, seamless', '%', 100), P('I62', 'Carbon / mild, welded', '%', 100), P('J62', 'Carbon / mild, seamless', '%', 100), P('G62', 'Ductile iron', '%', 100), P('C71', 'Scrap credit, % of base price', '%', 100)] },
      { title: 'Operating costs · carbon & mild steel (% of raw material)', rows: ['I', 'J'].flatMap((c) => [65, 66, 67, 68, 69, 70].map((r) => P(`${c}${r}`, `${assumptionValue('B' + r) ?? 'Item'} · ${c === 'I' ? 'welded' : 'seamless'}`, '%', 100))) },
      { title: 'Operating costs · stainless steel (% of raw material)', rows: ['C', 'D'].flatMap((c) => [65, 66, 67, 68, 69, 70].map((r) => P(`${c}${r}`, `${assumptionValue('B' + r) ?? 'Item'} · ${c === 'C' ? 'welded' : 'seamless'}`, '%', 100))) },
      { title: 'Operating costs · ductile iron (% of raw material)', rows: [65, 66, 67, 68, 69, 70].map((r) => P(`G${r}`, assumptionValue('F' + r) ?? 'Item', '%', 100)) },
      { title: 'Margin by material', rows: [[75, 'Carbon steel'], [76, 'Stainless steel'], [77, 'Alloy steel'], [78, 'Ductile iron'], [79, 'Mild steel'], [80, 'Inconel 625'], [81, 'Inconel 825']].flatMap(([r, l]) => [P(`C${r}`, `${l} · welded`, '%', 100), ...(r === 78 ? [] : [P(`D${r}`, `${l} · seamless`, '%', 100)])]) },
      { title: 'Galvanising, lining and coatings', rows: [P('D115', 'Zinc thickness', 'µm'), P('D116', 'Zinc price', '₹/kg'), P('D118', 'Zinc share of galvanising cost', '%', 100), P('D91', 'Cement', '₹/bag'), P('D96', 'Cement share of mortar lining cost', '%', 100), P('D139', '3-layer PE coating', '₹/m²'), P('D133', 'Painting · NA', '₹/m²')] },
      { title: 'Testing, finishing and tolerance', rows: [P('D126', 'NACE compliance', '% of base', 100), P('D127', 'Hydrogen service', '% of base', 100), P('D122', 'IBR fee', '₹/kg'), P('D148', 'Bevelled end below 2 in', '₹/kg'), P('D149', 'Threaded end below 2 in', '₹/kg'), P('E149', 'Threaded end 2 to 10 in', '₹/kg'), P('F149', 'Threaded end above 10 in', '₹/kg'), P('C98', 'Permitted wall tolerance', '%', 100), ...[155, 156, 157, 158, 159, 160].map((r) => P(`D${r}`, `Tolerance uplift · ${A('B' + r)}–${A('C' + r)} mm`, '%', 100))] },
    ];
  },
  reset(st) { const d = pipesDefault(); st.T = d.T; st.metal.list = d.metal.list; st.plastic.list = d.plastic.list; st.metal.sel = st.plastic.sel = 0; },
};

function anatomyM(r, st, h) {
  const { nf, pct } = h;
  const rows = [['Raw material', `${nf(r.rmKgM, 2)} kg/m × ₹${nf(r.rmTotalPx, 2)}/kg`, r.rm], ['Scrap credit', `${(r.scrapPct * 100).toFixed(1)}% × ₹${nf(r.rmTotalPx, 1)}`, r.scrap], ...r.opexParts.map((v, i) => [r.opexLabels[i] ?? 'Cost', `${(v * 100).toFixed(1)}% of raw material (upper)`, null]), ['Operating costs (total)', `₹${nf(r.opex / r.wtM, 2)}/kg`, r.opex], ['Painting, coating & lining', `${nf(r.areaOut + r.areaIn, 2)} m² surface`, r.coating], ['Galvanising', `${nf(r.zinc, 2)} kg zinc`, r.galvM], ['Testing & compliance', `₹${nf(r.docKg, 1)}/kg documents`, r.testing], ['Pipe end finishing', `₹${nf(r.endKg, 1)}/kg`, r.endM]].filter((x) => !(x[2] === null));
  const sub = rows.reduce((s, x) => s + x[2], 0);
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up per metre · ${st.metal.band === 'hi' ? 'upper' : 'lower'} rate</div><p class="p">Cost lines are summed, then margin, wall-tolerance uplift, end-type uplift and payment interest are applied in turn, and mill-to-site logistics is added.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Line</th><th>Basis</th><th class="r">₹/m</th><th>Share</th></tr></thead><tbody>${rows.map(([n, b, v]) => `<tr><td>${n}</td><td class="mut">${b}</td><td class="r">${nf(v, 1)}</td><td><div class="bar"><i style="width:${Math.min(100, Math.abs(v) / sub * 100)}%"></i></div></td></tr>`).join('')}
    <tr class="total"><td colspan="2">Sum of cost lines</td><td class="r">${nf(sub, 1)}</td><td></td></tr>
    <tr><td>Margin</td><td class="mut">${pct(r.margin, 0)}</td><td class="r">${nf(r.marginAmt, 1)}</td><td></td></tr><tr><td>Tolerance &amp; end uplift</td><td class="mut">${pct(r.tolPct, 1)} tolerance (${nf(r.tolMm, 2)} mm), ${pct(r.endPct, 0)} end</td><td class="r">${nf(r.tolEnd, 1)}</td><td></td></tr><tr><td>Payment interest</td><td class="mut">${pct(r.interest, 2)}</td><td class="r">${nf(r.interestAmt, 1)}</td><td></td></tr><tr><td>Logistics</td><td class="mut">mill to site</td><td class="r">${nf(r.trans, 1)}</td><td></td></tr>
    <tr class="total"><td colspan="2">Cost of pipe</td><td class="r">${nf(r.total, 1)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function anatomyP(r, h) {
  const { nf, pct } = h; let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Build-up per metre</div><p class="p">Same structure as the metal workbook: raw material with yield loss and scrap credit, conversion, testing, margin, payment interest and logistics.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Line</th><th>Basis</th><th class="r">₹/m</th></tr></thead><tbody>
    <tr><td>Resin compound</td><td class="mut">${nf(r.rmKg, 3)} kg/m × ₹${nf(r.compound, 1)}/kg (resin + ${pct(r.addPct, 0)} additives)</td><td class="r">${nf(r.rm, 1)}</td></tr><tr><td>Regrind credit</td><td class="mut">recovered value of start-up and trim loss</td><td class="r">${nf(r.scrap, 1)}</td></tr>
    <tr><td>Extrusion &amp; conversion</td><td class="mut">₹${nf(r.convKg, 1)}/kg × ${nf(r.wtM, 2)} kg/m</td><td class="r">${nf(r.conversion, 1)}</td></tr><tr><td>Testing &amp; documents</td><td class="mut">hydro test and certificates</td><td class="r">${nf(r.testing, 1)}</td></tr>
    <tr><td>Margin</td><td class="mut">${pct(r.margin ?? 0, 0)}</td><td class="r">${nf(r.marginAmt, 1)}</td></tr><tr><td>Payment interest</td><td class="mut">${pct(r.interest, 2)}</td><td class="r">${nf(r.interestAmt, 1)}</td></tr><tr><td>Logistics</td><td class="mut">load factor ${r.loadFactor}</td><td class="r">${nf(r.transport, 1)}</td></tr><tr class="total"><td colspan="2">Cost of pipe</td><td class="r">${nf(r.total, 1)}</td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function geometry(r, h) {
  const { nf } = h, rows = r.kind === 'metal'
    ? [['Outside diameter', `${nf(r.od, 1)} mm`], ['Wall thickness', `${fmt(r.wall, 2)} mm`], ['Inside diameter', `${nf(r.id, 1)} mm`], ['Weight of pipe', `${nf(r.wtM, 3)} kg/m`], ['Raw material incl. ${yield}', `${nf(r.rmKgM, 3)} kg/m`], ['Outside surface', `${nf(r.areaOut, 3)} m² per length`], ['Inside surface', `${nf(r.areaIn, 3)} m² per length`]]
    : [['Outside diameter', `${nf(r.od, 2)} mm`], ['Wall thickness', `${fmt(r.wall, 2)} mm`], ['Inside diameter', `${nf(r.id, 1)} mm`], ['Weight of pipe', `${nf(r.wtM, 3)} kg/m`], ['Raw material incl. loss', `${nf(r.rmKg, 3)} kg/m`], ['Density', `${r.rho} g/cm³`]];
  return `<div class="h3">Geometry and weight</div><p class="p">${r.kind === 'metal' ? 'Weight = π/4 × (OD² − ID²) × density, with OD and wall from the workbook’s Pipe schedule table or your custom size.' : 'Wall from the rating (OD ÷ SDR, or the PVC-U pressure formula, or the CPVC schedule table), rounded up to 0.1 mm.'}</p>
    <div class="scroll"><table class="t num"><tbody>${rows.map(([k, v]) => `<tr><td>${k.replace('incl. ${yield}', 'incl. yield loss')}</td><td class="r">${v}</td></tr>`).join('')}</tbody></table></div>`;
}
function range(r, st, h) {
  const { nf } = h;
  if (r.kind === 'plastic') return `<div class="h3">Single rate</div><p class="p">The plastic model has one rate. The metal workbook gives an upper and a lower rate, from its operating-cost ranges.</p>`;
  return `<div class="h3">Upper and lower rate</div><p class="p">The workbook prices every pipe twice: the lower rate takes 70% of the operating-cost percentages. The range is how far a supplier’s overheads could reasonably vary.</p>
    <div class="tiles"><div class="tile" style="border-style:solid"><small>Upper rate</small><b style="color:var(--ink)">₹${nf(r.hi, 0)}/m</b></div><div class="tile" style="border-style:solid"><small>Lower rate</small><b style="color:var(--ink)">₹${nf(r.lo, 0)}/m</b></div><div class="tile" style="border-style:solid"><small>Per kg</small><b style="color:var(--ink)">₹${nf(r.kgHi, 1)} / ${nf(r.kgLo, 1)}</b></div><div class="tile" style="border-style:solid"><small>Spread</small><b style="color:var(--ink)">${nf((r.hi / r.lo - 1) * 100, 1)}%</b></div></div>`;
}
