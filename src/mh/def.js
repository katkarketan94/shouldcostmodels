// Material-handling package definition for the generic equipment UI.
import { mhDefault, computeMH, WIDTHS, MATERIALS, MH_DEFAULTS, LOTS } from './calc.js';
import { mhPlanSVG, mhScene } from './scene.js';
import BBU from '../mh_bbu.json' with { type: 'json' };
import LOTSX from '../mh_lots.json' with { type: 'json' };

export { mhDefault };
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const cr = (v, d = 2) => fmt(v / 1e7, d);
const PAL = ['#c27a2c', '#2563eb', '#0ea5a4', '#8b5cf6', '#e8b923', '#06b6d4', '#94a3b8', '#f59e0b', '#64748b', '#0f9d6b', '#c0392b', '#7c3aed', '#16a34a', '#d97706'];
const BBU_LOTS = {}; BBU.forEach((x) => { BBU_LOTS[x.lot] = (BBU_LOTS[x.lot] || 0) + x.a; });
const BBU_TOTAL = Object.values(BBU_LOTS).reduce((a, b) => a + b, 0), ELECON_PO = 979400000.61;

export const mhDef = {
  key: 'mf', name: 'package', ratesTitle: 'Rates · commodity and unit rates', qtyLabel: 'packages',
  ratesNote: 'Not from one workbook: scope and quantities come from the reference BBU and the purchase-order list; conveyor items are built bottom-up; the front-end equipment is calibrated to the Elecon purchase order. Steel, rubber, fabric and cord follow the commodity file.',
  masterNote: 'Every rate, constant and table the package uses. Assumptions except where the notes say the BBU or the Elecon PO set them. Kept in this browser.', resetLabel: 'Reset to defaults',
  calcNote: 'Belt width and speed from capacity; power from the DIN 22101 style resistances; belt rating from the tension; quantities from the route length; priced item by item.',
  sectionHint: 'Package flow and conveyor routes drawn to scale',
  views: [['section', 'Package'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st, maxRows: () => 20,
  units: { cr: { label: '₹ Cr', dec: 2, fn: (v) => v / 1e7 }, perM: { label: '₹ lakh per route-m', dec: 2, fn: (v, r) => (r.route ? v / r.route / 1e5 : 0) }, perT: { label: '₹ lakh per structure tonne', dec: 1, fn: (v, r) => (r.mechTonnes ? v / r.mechTonnes / 1e5 : 0) } },
  compute(st) { return st.list.map((c) => { const r = computeMH(c, st.T); if (r.error) return r; const g = Object.entries(r.groups).filter(([, v]) => v > 0); return { ...r, parts: g.map(([k, v], i) => ({ k, l: k, col: PAL[i % PAL.length], v })) }; }); },
  qtyTotal: (r, q) => r.total * q,
  title: (r) => r.cfg.tag,
  meta: (r) => `${r.convs.length ? `${r.convs.length} routes, ${r.beltsN} belts, ${fmt(r.route)} m` : 'no conveyors'}${r.cfg.wt ? ` · ${r.cfg.wt} tipplers, ${r.cfg.scr} stacker-reclaimers` : ''}${r.cfg.ahs?.on ? ' · ash handling' : ''} · supply ex-GST`,
  pillOf: (r) => `supply ₹${cr(r.total, 1)} Cr`,
  metrics: (r) => [['Belt route', `${fmt(r.route)} m`], ['Installed drive', `${fmt(r.htKw + r.ltKw)} kW`], ['Structure and chutes', `${fmt(r.structT + r.chuteT + r.skirtT)} T`], ['Erection (built up)', `₹${cr(r.erTotal, 1)} Cr · ${(r.erPct * 100).toFixed(0)}%`]],
  scene: (r, view) => mhScene(r, view === 'cut'), section: (r) => mhPlanSVG(r),
  allowBlank: false,

  left(st, r, h) {
    const c = st.list[st.sel], n = (label, path, v, step = 1, unit = '') => h.num(label, path, v, step, unit), two = (a, b) => `<div class="two2"><div>${a}</div><div>${b}</div></div>`;
    const rows = c.conv.map((x, i) => `<div class="mhrow"><input class="cell" type="text" data-mf="conv.${i}.id" value="${(x.id || '').replace(/"/g, '&quot;')}" aria-label="Conveyor ${i + 1} id"><input class="cell" type="number" data-mf="conv.${i}.tph" data-num="1" value="${x.tph}" title="TPH" aria-label="TPH"><input class="cell" type="number" data-mf="conv.${i}.len" data-num="1" value="${x.len}" title="Length m" aria-label="Length"><input class="cell" type="number" data-mf="conv.${i}.lift" data-num="1" value="${x.lift}" title="Lift m" aria-label="Lift"><input class="cell" type="number" data-mf="conv.${i}.qty" data-num="1" value="${x.qty}" title="Streams" aria-label="Streams"><button class="iconbtn" data-mhdel="${i}" title="Remove">✕</button></div>`).join('');
    const a = c.ahs || {};
    return `<div class="label">Package <small>${st.list.length} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">
      <div class="sec-h"><span class="step">1</span>Conveyor schedule</div>
      <div class="mhrow mhhead"><span>Id</span><span>TPH</span><span>Len m</span><span>Lift m</span><span>Streams</span><span></span></div>${rows}
      <div style="margin-top:8px;display:flex;gap:8px"><button class="btn" data-mhadd="1">+ Add conveyor</button></div>
      <div class="note" style="padding:6px 0 0">Width, speed, power and belt are sized for each row. Material: ${h.esc('Coal unless a row is changed on the Calculations tab')}.</div>
      <hr class="divider"><div class="sec-h"><span class="step">2</span>On the conveyors</div>
      ${two(n('Travelling trippers', 'trippers', c.trippers), n('Tripper TPH', 'tripTph', c.tripTph, 100))}${two(n('Belt feeders', 'bfeeders', c.bfeeders), n('Inline magnets', 'mag', c.mag))}${two(n('Suspended magnets', 'susp', c.susp), n('Metal detectors', 'md', c.md))}${two(n('Belt weighers', 'weigher', c.weigher), n('Sampling sets', 'sampling', c.sampling))}${two(n('Vulcanisers', 'vulc', c.vulc), h.seg([[1, 'Spares in'], [0, 'No spares']], c.spares, 'spares'))}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Front-end CHS</div>
      ${two(n('Wagon tipplers', 'wt', c.wt), n('Tips per hour', 'wtTips', c.wtTips))}${two(n('Stacker-reclaimers', 'scr', c.scr), n('TPH each', 'scrTph', c.scrTph, 100))}${two(n('Apron feeders', 'apron', c.apron), n('TPH each', 'apronTph', c.apronTph, 100))}${two(n('Crushers', 'crusher', c.crusher), n('TPH each', 'crTph', c.crTph, 100))}${two(n('Vibrating feeders', 'vfeeder', c.vfeeder), n('TPH each', 'vfTph', c.vfTph, 100))}${two(n('EOT cranes', 'crane', c.crane), n('Capacity T', 'craneT', c.craneT))}${n('Tunnel ventilation sets', 'vent', c.vent)}
      <hr class="divider"><div class="sec-h"><span class="step">4</span>Dust management</div>${two(n('Dust extraction', 'de', c.de), n('Dry fog', 'dryfog', c.dryfog))}${n('Dust suppression (DSS)', 'dss', c.dss)}
      <hr class="divider"><div class="sec-h"><span class="step">5</span>Ash handling</div>
      ${h.seg([[1, 'Included'], [0, 'Not included']], a.on ?? 0, 'ahs.on')}
      ${a.on ? `${two(n('Units', 'ahs.units', a.units), n('Hoppers', 'ahs.hopper', a.hopper))}${two(n('Bottom ash t/h per unit', 'ahs.baTph', a.baTph), n('Fly ash t/h per unit', 'ahs.faTph', a.faTph))}${two(n('MCSD t/h', 'ahs.mcsdTph', a.mcsdTph), n('Fly ash silos', 'ahs.silos', a.silos))}${two(n('Silo volume m³', 'ahs.silosM3', a.silosM3, 100), n('Compressors kW', 'ahs.compKw', a.compKw, 50))}${two(n('MCSD RCC silos', 'ahs.mcsdSilo', a.mcsdSilo), n('Hydrobins', 'ahs.hydrobins', a.hydrobins))}` : ''}`;
  },
  onClick(e, t, st) {
    const c = st.list[st.sel]; if (t.dataset.mhadd) { c.conv.push({ id: `C-${c.conv.length + 1}`, tph: 1000, len: 200, lift: 5, qty: 1, mat: 'Coal' }); return 'refresh'; }
    if (t.dataset.mhdel !== undefined) { c.conv.splice(+t.dataset.mhdel, 1); return 'refresh'; } return null;
  },
  afterEdit(st) { if (st.sel >= st.list.length) st.sel = 0; },
  rates(st) {
    const P = st.T.prices;
    return [{ label: 'Plate (chutes, pulleys)', path: 'prices.plate', value: P.plate, unit: '₹/kg', cid: 'hr_plate', price: true }, { label: 'Sections (structure, frames)', path: 'prices.section', value: P.section, unit: '₹/kg', cid: 'ismc_section', price: true }, { label: 'ERW tube (roller shells)', path: 'prices.tube', value: P.tube, unit: '₹/kg', cid: 'erw_pipe', price: true },
      { label: 'Belt rubber compound', path: 'prices.rubber', value: P.rubber, unit: '₹/kg', cid: 'rubber', price: true }, { label: 'Nylon fabric', path: 'prices.nnFabric', value: P.nnFabric, unit: '₹/kg', cid: 'nn_fabric', price: true }, { label: 'Steel cord', path: 'prices.steelCord', value: P.steelCord, unit: '₹/kg', cid: 'steel_cord', price: true }, { label: 'Copper (cables)', path: 'prices.copper', value: P.copper, unit: '₹/kg', cid: 'copper', price: true }];
  },
  isPricePath: (p) => p.startsWith('prices.'),
  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['sched', 'Conveyor sizing', (r, st, h) => sched(r, h)],
    ['calib', 'Calibration', (r, st, h) => calib(r, st, h)],
    ['debundle', 'Debundling', (r, st, h) => debundle(r, st, h)],
    ['erect', 'Erection', (r, st, h) => erect(r, h)],
    ['budget', 'Budget check', (r, st, h) => budget(r, st, h)],
    ['vendors', 'Vendors', (r, st, h) => vendors(r, h)],
  ],
  batchTitle: () => 'Package batch',
  batchCols: [['Route m', (c, r) => fmt(r.route), 1], ['Belts', (c, r) => r.beltsN, 1], ['kW', (c, r) => fmt(r.htKw + r.ltKw), 1], ['Supply ₹ Cr', (c, r) => cr(r.total), 1], ['Erection ₹ Cr', (c, r) => cr(r.erTotal), 1]],
  calcRows(r) {
    const f = (v, d = 1) => fmt(v, d);
    return [[['#', 'Package'], ['Belt route (m)', f(r.route, 0)], ['Belts', r.beltsN], ['Belt length (m)', f(r.beltM, 0)], ['HT drive (kW)', f(r.htKw, 0)], ['LT drive (kW)', f(r.ltKw, 0)], ['Motors', r.nMotors], ['Structure (T)', f(r.structT, 0)], ['Chutes (T)', f(r.chuteT, 0)], ['Idler sets', f(r.cStd + r.cImp + r.cSa, 0)], ['Pulleys', r.nPul],
      ...r.convs.flatMap((x) => [['#', `${x.id}${x.qty > 1 ? ` × ${x.qty}` : ''}`], ['Belt width (mm) / speed (m/s)', `${x.width} / ${f(x.v, 2)}`], ['Capacity (TPH)', f(x.capacity, 0)], ['Absorbed power (kW)', f(x.Pshaft, 0)], ['Drive', `${x.nDrive} × ${x.kwEach} kW ${x.ht ? 'HT' : 'LT'}`], ['Belt', `${x.useCord ? 'ST' : 'NN'} ${x.rating} N/mm`], ['Effective tension T1 (kN)', f(x.T1 / 1000, 0)]])],
    [['#', 'Cost (₹ Cr, with overheads and margin)'], ...Object.entries(r.lots).sort().map(([k, v]) => [k, cr(v)]), ['Total supply', cr(r.total)], ['Erection', cr(r.erTotal)]]];
  },
  master(st) {
    const T = st.T, rows = (base, obj, un = '') => Object.keys(obj).filter((k) => typeof obj[k] === 'number').map((k) => [k.replace(/([A-Z])/g, ' $1').toLowerCase(), `${base}.${k}`, obj[k], 'any', 1, un]);
    const titles = { prices: 'Materials, ₹/kg', belt: 'Belt calculation', idler: 'Idlers and frames', pulley: 'Pulleys and bearings', drive: 'Motors, gearboxes, couplings', structure: 'Structure, chutes, gates', tripper: 'Travelling trippers', scraper: 'Scrapers and vulcaniser', qd: 'Magnets, detectors, sampling', elec: 'Electrical and C&I', frontEnd: 'Front-end CHS equipment (calibrated to the Elecon PO)', dust: 'Dust management', ahs: 'Ash handling', erect: 'Erection', stack: 'Spares, overheads and margin', debundle: 'Debundling cost load', budget: 'CHS budget' };
    return Object.keys(titles).map((k) => ({ title: titles[k], rows: rows(k, T[k]) }));
  },
  reset(st) { const d = mhDefault(); st.T = d.T; st.list = d.list; st.sel = 0; },
};

function anatomy(r, h) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  return `<div class="h3">Supply build-up</div><p class="p">Quantities follow from the sized conveyors and the equipment counts; each line is priced at the rates on the right or on Master Data. Overheads and margin are charged on the total as a manufacturer selling direct.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th>Lot</th><th class="r">Qty</th><th class="r">Rate ₹</th><th class="r">Amount ₹</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const t = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(t)} <span class="mut">${(t / r.direct * 100).toFixed(1)}%</span></td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td>${l.lot}</td><td class="r">${l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Overheads and margin</b></td></tr><tr><td>Overheads</td><td></td><td></td><td></td><td class="r">₹${nf(r.oh)}</td></tr><tr><td>Margin</td><td></td><td></td><td></td><td class="r">₹${nf(r.mg)}</td></tr><tr class="total"><td>Should-cost supply</td><td></td><td></td><td></td><td class="r">₹${nf(r.total)}</td></tr></tbody></table></div>`;
}
function sched(r, h) {
  const { nf } = h; if (!r.convs.length) return '<p class="p">This package has no conveyors.</p>';
  return `<div class="h3">How each conveyor was sized</div><p class="p">Width is the smallest standard width that carries the TPH at its maximum recommended speed; speed is then the lowest standard speed that does. Power uses a friction factor of 0.022, the secondary-resistance factor C = 1.05 + 70/(L+25) and the lift. Belt rating follows the effective tension with a safety factor of 10 (fabric) or 8 (steel cord).</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Conveyor</th><th class="r">TPH</th><th class="r">Length m</th><th class="r">Lift m</th><th class="r">Width</th><th class="r">Speed</th><th class="r">Absorbed kW</th><th>Drive</th><th>Belt</th></tr></thead><tbody>${r.convs.map((x) => `<tr><td>${x.id}${x.qty > 1 ? ` ×${x.qty}` : ''}</td><td class="r">${nf(x.tph)}</td><td class="r">${nf(x.len)}</td><td class="r">${nf(x.lift || 0)}</td><td class="r">${x.width}</td><td class="r">${nf(x.v, 2)}</td><td class="r">${nf(x.Pshaft)}</td><td>${x.nDrive}×${x.kwEach} kW ${x.ht ? 'HT' : 'LT'}</td><td>${x.useCord ? 'ST' : 'NN'} ${x.rating}</td></tr>`).join('')}</tbody></table></div>`;
}
function calib(r, st, h) {
  const { nf } = h, rows = LOTS.map((k) => { const m = r.lots[k] || 0, b = BBU_LOTS[k]; return `<tr><td>${k}</td><td>${LOTSX.find((x) => x.lot === k).name}</td><td class="r">₹${cr(m)}</td><td class="r">₹${cr(b)}</td><td class="r">${b && m ? (m / b).toFixed(2) : '–'}</td></tr>`; }).join('');
  return `<div class="h3">Against the reference conveying-package BBU</div><p class="p">The OEM’s back-to-back BBU is ₹${cr(BBU_TOTAL)} Cr for 3 × 800 MW (conveying only). Its note says the unit rates are notional billing values, so this model does not copy them: it prices the same items bottom-up. The ratio below is this package’s should-cost against the BBU lot. A ratio near 0.85 for the preset “Reference conveying package” means the BBU carries about 15% over a direct-supply should-cost, in line with the base savings band of your debundling workbook.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Lot</th><th>Description</th><th class="r">This package ₹ Cr</th><th class="r">Reference BBU ₹ Cr</th><th class="r">Ratio</th></tr></thead><tbody>${rows}<tr class="total"><td></td><td>Conveying lots L01–L12</td><td class="r">₹${cr(LOTS.reduce((s, k) => s + (r.lots[k] || 0), 0))}</td><td class="r">₹${cr(BBU_TOTAL)}</td><td class="r">${(LOTS.reduce((s, k) => s + (r.lots[k] || 0), 0) / BBU_TOTAL).toFixed(2)}</td></tr></tbody></table></div>
    <p class="note" style="padding:10px 0 0">The conveyor schedule of the reference preset is <b>inferred</b>: the 15 conveyor pairs come from the BBU gearbox and coupling lines, powers from gearbox prices, and lengths from the idler counts (7,784 carrying sets × 1.2 m ≈ 9,340 m). Replace it with the real schedule (open data gap 2 in the debundling workbook). Front-end equipment is scaled by ${st.T.frontEnd.cal} so that 3 tipplers, 2 stacker-reclaimers, 3 apron feeders, 4 crushers and 4 vibrating feeders cost ₹${cr(ELECON_PO)} Cr, the Elecon PO value.</p>`;
}
function debundle(r, st, h) {
  const { nf } = h, D = st.T.debundle, conv = LOTS.map((k) => ({ k, v: r.lots[k] || 0, x: LOTSX.find((x) => x.lot === k) }));
  const val = conv.reduce((s, a) => s + a.v, 0), lo = conv.reduce((s, a) => s + a.v * (a.x.debundle === 'Yes' ? a.x.lo : 0), 0), ba = conv.reduce((s, a) => s + a.v * (a.x.debundle === 'Yes' ? a.x.base : 0), 0), hi = conv.reduce((s, a) => s + a.v * (a.x.debundle === 'Yes' ? a.x.hi : 0), 0);
  const cost = val * (D.di + D.proc + D.inventory + D.freight);
  return `<div class="h3">Margin release from debundling, on this package</div><p class="p">Your workbook’s savings bands applied to this package’s should-cost lots. Here the base value is the should-cost; if the BBU billed price is higher, the band is the margin released on the billed price. The cost load (design-and-integrate fee ${(D.di * 100).toFixed(1)}%, procurement ${(D.proc * 100).toFixed(1)}%, inventory ${(D.inventory * 100).toFixed(1)}%, freight ${(D.freight * 100).toFixed(1)}%) is charged in full.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Lot</th><th>Debundle?</th><th class="r">Value ₹ Cr</th><th class="r">Low %</th><th class="r">Base %</th><th class="r">High %</th><th class="r">Base saving ₹ Cr</th></tr></thead><tbody>${conv.map((a) => `<tr><td>${a.k} ${a.x.name}</td><td>${a.x.debundle}</td><td class="r">₹${cr(a.v)}</td><td class="r">${(a.x.lo * 100).toFixed(1)}</td><td class="r">${(a.x.base * 100).toFixed(1)}</td><td class="r">${(a.x.hi * 100).toFixed(1)}</td><td class="r">₹${cr(a.v * (a.x.debundle === 'Yes' ? a.x.base : 0))}</td></tr>`).join('')}
    <tr class="total"><td>Gross saving</td><td></td><td class="r">₹${cr(val)}</td><td class="r">${val ? (lo / val * 100).toFixed(1) : '–'}</td><td class="r">${val ? (ba / val * 100).toFixed(1) : '–'}</td><td class="r">${val ? (hi / val * 100).toFixed(1) : '–'}</td><td class="r">₹${cr(ba)}</td></tr>
    <tr><td>Less debundling cost load</td><td></td><td></td><td></td><td></td><td></td><td class="r">−₹${cr(cost)}</td></tr><tr class="total"><td>Net saving (low / base / high)</td><td></td><td></td><td class="r">₹${cr(lo - cost)}</td><td class="r">₹${cr(ba - cost)}</td><td class="r">₹${cr(hi - cost)}</td><td class="r">${val ? ((ba - cost) / val * 100).toFixed(1) : '–'}%</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">Probable, not committed: each lot needs category-lead sign-off. Risks not priced: schedule, interface gaps (twelve interfaces replace one), working capital, fragmented warranty and vendor capacity.</p>`;
}
function erect(r, h) {
  const { nf } = h;
  return `<div class="h3">Erection, built up</div><p class="p">No erection BBU has been received, so erection is built from the physical work: structure and chute tonnes, belt metres and splices, idler sets, drives and pulleys, plus a share of equipment, electrical and dust work. Total ₹${cr(r.erTotal)} Cr, <b>${(r.erPct * 100).toFixed(1)}%</b> of supply against the 20% rule of thumb in the workbook.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate ₹</th><th class="r">Amount ₹</th></tr></thead><tbody>${r.erLines.map((l) => `<tr><td>${l.label}</td><td class="r">${l.unit === 'lot' ? '–' : `${nf(l.qty, l.qty < 10 ? 1 : 0)} ${l.unit}`}</td><td class="r">${l.unit === 'lot' ? '–' : nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td></tr>`).join('')}<tr class="total"><td>Erection</td><td></td><td></td><td class="r">₹${nf(r.erTotal)}</td></tr></tbody></table></div>`;
}
function budget(r, st, h) {
  const B = st.T.budget, ctl = B.control * 1e7, withE = B.supplyAndErection ? r.total + r.erTotal : r.total, left = ctl - withE;
  return `<div class="h3">CHS budget check</div><p class="p">The “CHS Mechanical Equipment” control budget is ₹${fmt(B.control)} Cr, ${B.supplyAndErection ? 'stated as supply plus erection' : 'taken as supply only'} (the source sheet is headed “Supply Package”: confirm in writing). This package costs ₹${cr(r.total)} Cr supply and ₹${cr(r.erTotal)} Cr erection.</p>
    <div class="scroll"><table class="t num"><tbody><tr><td>CHS mechanical control budget</td><td class="r">₹${cr(ctl)} Cr</td></tr><tr><td>This package, ${B.supplyAndErection ? 'supply + erection' : 'supply'}</td><td class="r">₹${cr(withE)} Cr</td></tr><tr class="total"><td>${left >= 0 ? 'Surplus' : 'Shortfall'}</td><td class="r">${left >= 0 ? '' : '−'}₹${cr(Math.abs(left))} Cr</td></tr></tbody></table></div>
    <p class="note" style="padding:8px 0 0">Use the “Coal handling package, 2 × 800 MW” preset for this check: it carries the conveyors (scaled 0.667 from the inferred reference schedule, a placeholder until the real schedule arrives) and the full front-end scope. Change the budget and basis on Master Data.</p>`;
}
function vendors(r, h) {
  return `<div class="h3">Indicative vendor panel by lot</div><div class="scroll"><table class="t"><thead><tr><th>Lot</th><th>Vendors</th><th>Sourcing note</th></tr></thead><tbody>${LOTSX.map((x) => `<tr><td><b>${x.lot}</b> ${x.name}<br><small>${x.debundle === 'Yes' ? 'Debundle' : 'Keep bundled'}</small></td><td>${x.vendors}</td><td>${x.sourcing}</td></tr>`).join('')}</tbody></table></div><p class="note" style="padding:8px 0 0">From the Vendor Map of your debundling workbook: a starting list for RFI, to be validated against the approved vendor list.</p>`;
}
