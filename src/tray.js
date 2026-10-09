// Cable-tray family: UI for the tray cost models (Build Up, BoQ, Calculations, Master Data).
import { TRAY_DEFAULTS } from './dataTray.js';
import FIXTURES_TRAY from '../test/fixtures_tray.json';
import BOQ from '../test/boq_tray.json';
import { KINDS, computeTray, boqRate } from './calcTray.js';
import { buildTray3D } from './tray3d.js';
import { traySectionSVG } from './traySection.js';
import { spark } from './prices.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const SHEET_CFG = Object.fromEntries(FIXTURES_TRAY.map((f) => [f.sheet, f.cfg]));
const GROUPS = [
  ['Straight tray', ['ladder', 'perf', 'trough']],
  ['Fittings', ['hbend', 'vup', 'vdown', 'tee', 'cross']],
  ['Supports', ['channel', 'arm']],
];
const SHORT = { ladder: 'Ladder', perf: 'Perforated', trough: 'U-trough', hbend: 'H bend', vup: 'V bend up', vdown: 'V bend down', tee: 'Tee', cross: 'Cross', channel: 'Channel', arm: 'Cantilever arm' };
const QTY_UNIT = (k) => (KINDS[k].straight ? 'km' : k === 'channel' ? 'm' : 'nos');
const QTY_DEFAULT = { ladder: 10, perf: 5, trough: 5, hbend: 25, vup: 25, vdown: 25, tee: 25, cross: 10, channel: 1000, arm: 1000 };
const UNITS = { pc: '₹/pc', m: '₹/m', km: '₹/km' };
const PART_META = [['steel', 'Steel (net of scrap credit)', '#6b7280'], ['zinc', 'Zinc galvanising (net of dross/ash credit)', '#0ea5a4'], ['labour', 'Labour, fabrication & margin', '#2563eb']];

const glyph = (k) => {
  const s = 'fill="none" stroke="#5b6573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const body = {
    ladder: '<path d="M7 4v24M25 4v24M7 9h18M7 16h18M7 23h18"/>',
    perf: '<rect x="4" y="9" width="24" height="14" rx="1.5"/><path d="M9 14h.1M14 14h.1M19 14h.1M24 14h.1M9 18h.1M14 18h.1M19 18h.1M24 18h.1"/>',
    trough: '<path d="M7 9v14h18V9"/><path d="M12 19h.1M16 19h.1M20 19h.1"/>',
    hbend: '<path d="M6 27c0-12 8-20 20-20M12 27c0-8 6-14 14-14M6 27h6"/>',
    vup: '<path d="M5 25h8c8 0 12-6 12-17M5 19h5c6 0 9-4 9-11"/>',
    vdown: '<path d="M5 7h8c8 0 12 6 12 17M5 13h5c6 0 9 4 9 11"/>',
    tee: '<path d="M4 9h24M4 15h9v13M28 15H19v13"/>',
    cross: '<path d="M4 12h8V4M20 4v8h8M28 20h-8v8M12 28v-8H4"/>',
    channel: '<path d="M8 8h-3v16h22V8h-3M22 8h-4M10 8h4"/>',
    arm: '<path d="M5 6v20M5 10h22M5 16l14-6M5 22h8"/>',
  }[k];
  return `<svg viewBox="0 0 32 32" ${s}>${body}</svg>`;
};

export function trayDefault() {
  return {
    cfg: { kind: 'ladder', width: 600, depth: 100, thk: 2, length: 2500 },
    T: clone(TRAY_DEFAULTS),
    boq: BOQ.map((b) => ({ ...b, cfg: b.sheet ? SHEET_CFG[b.sheet] : null })),
    unit: 'km', qty: { ...QTY_DEFAULT }, view: '3d', btab: 'anatomy', editParams: false,
  };
}

export function createTrayUI(ctx) {
  const { $, esc, nf, inr, pct, big, seg, ICON, persist, vhost, sxhost } = ctx;
  const st = () => ctx.state();
  const ts = () => st().tray;
  const calc = (cfg = ts().cfg) => computeTray(cfg, ts().T);
  const lengthOf = (cfg) => cfg.length ?? ts().T.fittingLength[cfg.kind] ?? 2500;
  const label = (c) => {
    if (c.kind === 'channel') return `C${c.depth > 41 ? 2 : 1} channel ${c.width} × ${c.depth} × ${c.thk} mm`;
    if (c.kind === 'arm') return `Cantilever arm ${lengthOf(c)} mm × ${c.thk} mm`;
    return `${KINDS[c.kind].label} ${c.width} × ${c.depth} × ${c.thk} mm`;
  };
  const perUnit = (r, u = ts().unit) => (u === 'pc' ? r.piece : u === 'm' ? r.perM : r.perKm);
  const money = (r, v) => inr(v, v < 1000 ? 2 : 0);
  const defaultUnit = (k) => (KINDS[k].straight ? 'km' : k === 'channel' ? 'm' : 'pc');

  /* ---------- Build Up ---------- */
  function page() {
    $('#page').innerHTML = `<div class="grid">
      <aside class="card col-l" id="left"></aside>
      <section class="col-c">
        <div class="card" style="overflow:hidden"><div class="hero" id="hero-head"></div>
          <div class="viewer-wrap" id="vw"><div class="float tr" id="vtools"></div><div class="hint" id="vhint"></div></div>
          <div class="metrics" id="metrics"></div></div>
        <div class="card" id="bottom"></div>
      </section>
      <aside class="col-r"><div class="card sc" id="sc"></div><div class="card landed" id="landed"></div></aside></div>`;
    const vw = $('#vw'); vw.prepend(sxhost); vw.prepend(vhost);
    ctx.ensureViewer(); render();
  }

  function render(skipLeft) {
    const r = calc();
    if (!skipLeft) left();
    hero(r); right(r); bottom(r); viewer(r);
  }

  const chips = (items, cur, attr) => `<div class="chips">${items.map(([v, l]) => `<button class="chip ${String(cur) === String(v) ? 'on' : ''}" data-${attr}="${esc(v)}">${l}</button>`).join('')}</div>`;

  function left() {
    const c = ts().cfg, k = c.kind, K = KINDS[k];
    const wid = k === 'trough' ? [50, 75, 100] : [150, 300, 450, 600];
    const dep = k === 'trough' ? [20, 25, 50] : [50, 75, 100, 125];
    const thk = K.section ? [2, 2.5, 3] : [1.6, 2, 2.5, 3];
    const showLen = K.straight || K.section;
    $('#left').innerHTML = `
      <div class="sec-h"><span class="step">1</span>Item</div>
      ${GROUPS.map(([g, ks]) => `<div class="label" style="margin-top:4px">${g}</div><div class="fam">${ks.map((x) => `<button data-tkind="${x}" class="${k === x ? 'on' : ''}">${glyph(x)}<span>${SHORT[x]}</span></button>`).join('')}</div>`).join('')}
      <hr class="divider">
      <div class="sec-h"><span class="step">2</span>Dimensions</div>
      ${k === 'channel' ? `<div class="label">Section</div>${chips([[41, 'C1 · 41 × 41'], [82, 'C2 · 41 × 82']], c.depth, 'tdepthc')}`
        : k === 'arm' ? `<div class="label">Section</div><div class="meta" style="color:var(--ink2)">41 × 41 mm strut channel (arm only, no base plate)</div>`
        : `<div class="label">Width <small>mm</small></div>${chips(wid.map((v) => [v, v]), c.width, 'twidth')}
           <div class="label">Depth <small>mm</small></div>${chips(dep.map((v) => [v, v]), c.depth, 'tdepth')}`}
      <div class="label">Sheet thickness <small>mm</small></div>${chips(thk.map((v) => [v, v]), c.thk, 'tthk')}
      ${showLen ? `<div class="label">${k === 'arm' ? 'Arm length' : 'Length'} <small>mm</small></div>
        ${k === 'arm' ? chips([320, 620, 750].map((v) => [v, v]), c.length, 'tlen') : ''}
        <input class="cell" style="width:100%;text-align:left;padding:7px 10px;background:#fff8e1" type="number" id="tlen" step="10" min="100" value="${c.length}" aria-label="Length in mm">`
        : `<div class="label">Developed length <small>from the workbook sheet</small></div><div class="slider-val num" style="font-size:20px">${nf(lengthOf(c))}<small>mm</small></div>`}
      ${k === 'ladder' && c.length !== 2500 ? '<div class="warn">The workbook keeps 10 rungs per piece whatever the length, so a longer tray is not given extra rungs.</div>' : ''}`;
  }

  function hero(r) {
    const c = ts().cfg;
    $('#hero-head').innerHTML = `<div class="hero-h"><div><h1>${esc(label(c))}</h1><div class="meta">${KINDS[c.kind].label} · hot-dip galvanised mild steel · piece length ${nf(r.length)} mm · ${QTY_UNIT(c.kind) === 'km' ? 'priced per km' : QTY_UNIT(c.kind) === 'm' ? 'priced per metre' : 'priced per piece'}</div></div>
      <div class="spacer"></div><div class="seg">${[['section', 'Cross-section'], ['plan', 'Plan view'], ['3d', '3D model']].map(([v, l]) => `<button data-tview="${v}" class="${ts().view === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
    $('#metrics').innerHTML = [['Piece length', `${nf(r.length)} mm`], ['Weight per piece', `${nf(r.weight, 2)} kg`], ['Steel', `${nf(r.steelW, 2)} kg`], ['Zinc', `${nf(r.zincW, 2)} kg`]]
      .map(([k, v]) => `<div class="metric"><small>${k}</small><b class="num">${v}</b></div>`).join('')
      + `<div class="metric"><button class="link" data-tab="calc">Details →</button></div>`;
  }

  function viewer(r) {
    const v = ts().view, V = ctx.viewer();
    sxhost.classList.toggle('hide', v !== 'section'); vhost.classList.toggle('hide', v === 'section');
    if (v === 'section') sxhost.innerHTML = traySectionSVG(r, ts().T);
    else V.showGroup(buildTray3D(r, ts().T), v === 'plan' ? 'top' : 'iso');
    $('#vtools').innerHTML = v === 'section' ? `<button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`
      : `<button class="iconbtn" data-act="spin" title="Auto-rotate">${ICON.spin}</button><button class="iconbtn" data-act="zin" title="Zoom in">${ICON.zin}</button><button class="iconbtn" data-act="zout" title="Zoom out">${ICON.zout}</button><button class="iconbtn" data-act="home" title="Reset view">${ICON.reset}</button><button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`;
    $('#vhint').textContent = v === 'section' ? 'Drawn to scale from the cost-model dimensions' : v === 'plan' ? 'Top view · drag to tilt' : 'Drag to rotate · scroll to zoom · junctions are schematic';
    if (v !== 'section') V.resize();
  }

  function right(r) {
    const c = ts().cfg, P = ts().T.params, u = ts().unit, native = boqRate(r), qty = ts().qty[c.kind] ?? 1;
    const parts = PART_META.map(([k, l, col]) => ({ k, l, col, v: r.parts[k] }));
    const tot = r.piece;
    $('#sc').innerHTML = `
      <div class="cap"><span>Should-cost</span><span class="pill">${esc(SHORT[c.kind])}</span></div>
      <div class="big num">${money(r, perUnit(r))}<small> ${UNITS[u].replace('₹', '')}</small></div>
      <div class="qty num">${big(native * qty)} for <input type="number" id="tqty" min="0" step="1" value="${qty}" aria-label="Quantity"> ${QTY_UNIT(c.kind)}</div>
      <div class="stack">${parts.map((p) => `<i style="width:${(p.v / tot) * 100}%;background:${p.col}" title="${p.l}"></i>`).join('')}</div>
      <div class="break num">${parts.map((p) => `<div><span><span class="dot" style="background:${p.col}"></span>${p.l.replace(/ \(.*\)/, '')}</span><span class="v">${money(r, perUnit(r) * p.v / tot)}<em>${pct(p.v / tot)}</em></span></div>`).join('')}</div>
      <div class="range"><div class="cap"><span>Same item, other units</span></div>
        <div class="kv num" style="margin-top:6px">${Object.entries(UNITS).map(([k, l]) => `<div class="k">${l}</div><div class="v">${money(r, perUnit(r, k))}</div>`).join('')}</div></div>`;
    const COMM = { steelRate: 'ms_sheet', zincRate: 'zinc' };
    const row = (l, key, step, unit) => `<div class="lp"><b>${l}${COMM[key] ? spark(COMM[key], ctx.binder.mode) : ''}</b>${ts().editParams ? `<div class="ed"><input type="number" class="cell" data-tp="params.${key}" value="${P[key]}" step="${step}" aria-label="${l}"> ${unit}</div>` : `<div class="price num">${nf(P[key], P[key] % 1 ? 1 : 0)}<small> ${unit}</small></div>`}</div>`;
    $('#landed').innerHTML = `<div class="hd"><b>Rates <span style="color:var(--mute);font-weight:500">· editable</span></b><button class="iconbtn" id="tedit" title="Edit rates">${ICON.pencil}</button></div>
      ${row('Steel (MS sheet)', 'steelRate', 1, '₹/kg')}${row('Zinc', 'zincRate', 1, '₹/kg')}${row('Zinc coating', 'zincMicron', 1, 'µm')}${row('Labour & fabrication', 'labourOther', 0.1, '₹/kg')}${row('Profit & overhead', 'margin', 0.1, '₹/kg')}
      <div class="note">${ctx.binder.isMonth() ? `Steel and zinc from ${ctx.binder.label} in the common price file. Editing either switches to manual.` : ts().editParams ? 'Edits re-cost every view instantly.' : 'Straight-tray ladder and fittings use the labour rate alone; the other items add the profit & overhead rate.'}</div>`;
  }

  function bottom(r) {
    const tabs = `<div class="btabs"><button class="btab ${ts().btab === 'anatomy' ? 'on' : ''}" data-tbtab="anatomy">Cost anatomy</button><button class="btab ${ts().btab === 'eng' ? 'on' : ''}" data-tbtab="eng">${ICON.gauge} Structural check</button></div>`;
    let body;
    if (ts().btab === 'anatomy') {
      const P = ts().T.params, fam = KINDS[r.kind].family, rate = fam === 'ladder' ? P.labourLadder : P.labourOther + P.margin;
      const rows = [['Steel', 'Mild steel sheet, after scrap credit', r.steelW, r.parts.steel], ['Zinc', fam === 'ladder' ? '5% of steel weight, no scrap credit' : 'From coating area, net of ash & dross', r.zincW, r.parts.zinc], ['Labour, fabrication & margin', `On steel + zinc weight at ${nf(rate, 1)} ₹/kg`, r.steelW + r.zincW, r.parts.labour]];
      body = `<div class="pad"><div class="h3">Cost of one piece · ${nf(r.length)} mm</div><p class="p">Weights include the coupler plates and hardware where the workbook adds them.</p>
        <div class="scroll"><table class="t num"><thead><tr><th>Component</th><th>Basis</th><th class="r">Weight kg</th><th class="r">Cost ₹/pc</th><th class="r">Per kg ₹</th><th>Share</th></tr></thead><tbody>
        ${rows.map(([n, b, w, cst]) => `<tr><td>${n}</td><td class="mut">${b}</td><td class="r">${nf(w, 3)}</td><td class="r">${inr(cst, 2)}</td><td class="r">${nf(cst / w, 1)}</td><td><div class="bar"><i style="width:${(cst / r.piece) * 100}%"></i></div></td></tr>`).join('')}
        <tr class="total"><td colspan="2">Total per piece</td><td class="r">${nf(r.weight, 3)}</td><td class="r">${inr(r.piece, 2)}</td><td class="r">${nf(r.piece / r.weight, 1)}</td><td>100%</td></tr></tbody></table></div>
        ${r.warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join('')}</div>`;
    } else {
      body = `<div class="pad"><div class="banner">${ICON.info}<div><b>Technical validation, not a cost calculation.</b> This will check load per span and deflection for the selected tray. It never changes the should-cost.</div></div>
        <div class="field-row">${['Cable load|kg/m', 'Support span|m', 'Safe working load|kg/m', 'Deflection limit|mm'].map((x) => { const [l, un] = x.split('|'); return `<div class="field"><span>${l}</span><div>${un}</div></div>`; }).join('')}</div>
        <p class="note" style="margin-top:12px"><span class="soonpill">Coming soon</span>&nbsp; Needs section properties and the tray load tables, which are not in the workbook yet.</p></div>`;
    }
    $('#bottom').innerHTML = tabs + body;
  }

  /* ---------- BoQ ---------- */
  const lineRate = (b) => (b.cfg ? boqRate(calc(b.cfg)) : null);
  const groupOf = (b) => (!b.sheet ? 'D' : KINDS[b.cfg.kind].straight ? 'A' : KINDS[b.cfg.kind].fitting ? 'B' : 'C');
  function boqPage() {
    const rows = ts().boq.map((b, i) => ({ b, i, rate: lineRate(b) }));
    const sums = { A: 0, B: 0, C: 0 }; rows.forEach(({ b, rate }) => { if (rate != null) sums[groupOf(b)] += rate * b.qty; });
    const titles = { A: 'Ladder, perforated and U-trough', B: 'Bends, tees and crosses', C: 'Channels and cantilever arms', D: 'Fixing accessories (no cost model yet)' };
    const total = sums.A + sums.B + sums.C;
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">BoQ · Supply of cable trays & accessories</div><div class="note" style="padding:0">Unit rates come from the cost model; edit a quantity to re-total. Click a row to open it in Build Up.</div></div><div class="spacer"></div>
      ${['A', 'B', 'C'].map((g) => `<div style="text-align:right"><small class="note" style="padding:0">${titles[g].split(',')[0].split(' and ')[0]}</small><div class="num" style="font-weight:650">₹${nf(sums[g] / 1e7, 4)} Cr</div></div>`).join('')}
      <div style="text-align:right"><small class="note" style="padding:0">Total (excl. GST)</small><div class="num" style="font-weight:700;font-size:18px">₹${nf(total / 1e7, 4)} Cr</div></div></div>
      <div class="scroll"><table class="t num"><thead><tr><th>No</th><th>Description</th><th>UOM</th><th class="r">Qty</th><th class="r">Unit rate ₹</th><th class="r">Amount ₹</th></tr></thead><tbody>
      ${rows.map(({ b, i, rate }) => `${i === 0 || ts().boq[i - 1].cat !== b.cat ? `<tr><td colspan="6" style="background:#f6f8fb;font-weight:650;padding-top:12px">${esc(b.cat)}</td></tr>` : ''}<tr class="${rate != null ? 'click' : ''}" ${rate != null ? `data-bload="${i}"` : ''} style="${rate == null ? 'opacity:.55' : ''}"><td class="mut">${esc(b.no)}</td><td>${esc(b.desc)}</td><td class="mut">${esc(b.uom)}</td>
        <td class="r"><input class="cell" type="number" min="0" data-bqty="${i}" value="${b.qty}" ${rate == null ? 'disabled' : ''}></td>
        <td class="r">${rate != null ? nf(rate, rate < 1000 ? 2 : 0) : '–'}</td><td class="r"><b>${rate != null ? nf(rate * b.qty) : '–'}</b></td></tr>`).join('')}
      <tr class="total"><td colspan="5">Total FOR value excl. GST (priced lines)</td><td class="r">${nf(total)}</td></tr></tbody></table></div></div></div>`;
  }

  /* ---------- Calculations ---------- */
  function calcPage() {
    const r = calc(), c = ts().cfg;
    const G = (n) => `<div class="grp">${n}</div>`, R = (k, v, ref) => `<div class="k">${k} <span style="color:var(--mute);font-size:11px">${ref ? '· cell ' + ref : ''}</span></div><div class="v">${v}</div>`;
    const fmt = (v) => (Number.isInteger(v) ? nf(v) : nf(v, 3));
    const left = r.rows.map(([g, items]) => G(g) + items.map(([k, v, ref]) => R(k, fmt(v), ref)).join('')).join('');
    const right = G('Cost of one piece (₹)') + R('Steel, net of scrap credit', nf(r.parts.steel, 2), '') + R('Zinc', nf(r.parts.zinc, 2), '') + R('Labour, fabrication & margin', nf(r.parts.labour, 2), '') + R('Total per piece', nf(r.piece, 2), '')
      + G('Rates') + R('Per metre (₹)', nf(r.perM, 2), '') + R('Per km (₹)', nf(r.perKm, 0), '') + R('BoQ rate', `${nf(boqRate(r), 2)} ${r.meta.straight ? '₹/km' : c.kind === 'channel' ? '₹/m' : '₹/piece'}`, '');
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad"><div class="h3">Calculation build-up · ${esc(label(c))}</div><p class="p">The working figures from the item's sheet in the workbook, for the current Build Up selection.</p>
      <div class="two"><div class="kv">${left}</div><div class="kv">${right}</div></div>
      ${r.warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join('')}
      <div class="note" style="margin-top:14px">Carried over from the workbook: ladder-type items take zinc as 5% of steel weight; perforated, trough, channel and arm items compute it from the coating area and credit recoverable ash and dross; the holes in a ladder runner are counted per 2500 mm whatever the piece length.</div></div></div></div>`;
  }

  /* ---------- Master data ---------- */
  const ni = (path, val, step = 'any') => `<input class="cell" type="number" step="${step}" data-tp="${path}" value="${+(+val).toFixed(6)}">`;
  function masterPage() {
    const T = ts().T, P = T.params;
    const tbl = (title, obj, base, labels) => `<div class="card pad"><div class="h3">${title}</div><table class="t num"><tbody>${Object.entries(labels).map(([k, [l, st, un]]) => `<tr><td>${l}</td><td class="r">${ni(`${base}.${k}`, obj[k], st)} <span class="mut">${un || ''}</span></td></tr>`).join('')}</tbody></table></div>`;
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">
      <div class="card pad wide" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Master data · cable trays</div><div class="note" style="padding:0">Every input on the item sheets, editable here. Changes apply to all tabs and are kept in this browser.</div></div><div class="spacer"></div><button class="btn" id="treset">Reset to workbook values</button></div>
      ${tbl('Materials & process', P, 'params', { steelRate: ['Steel (MS) rate', 1, '₹/kg'], steelDensity: ['Steel density', 10, 'kg/m³'], zincRate: ['Zinc rate', 1, '₹/kg'], zincDensity: ['Zinc density', 10, 'kg/m³'], zincMicron: ['Zinc coating', 1, 'µm'], galvWaste: ['Galvanising wastage', 0.01, 'fraction'], zincPctOfSteel: ['Zinc as share of steel weight (ladder items)', 0.01, 'fraction'], hardware: ['Hardware per piece (nut, bolt, washer)', 0.01, 'kg'], labourLadder: ['Labour rate, ladder items', 0.1, '₹/kg'], labourOther: ['Labour & fabrication, other items', 0.1, '₹/kg'], margin: ['Profit & overhead, other items', 0.1, '₹/kg'] })}
      ${tbl('Scrap recovery (galvanising)', P, 'params', { ashPct: ['Ash, share of zinc', 0.01, ''], drossPct: ['Dross, share of zinc', 0.01, ''], ashSalvage: ['Ash salvage value', 0.01, 'of zinc rate'], drossSalvage: ['Dross salvage value', 0.01, 'of zinc rate'] })}
      ${tbl('Coupler plates', T.coupler, 'coupler', { straightGross: ['Plate, straight trays (gross)', 0.0001, 'kg'], fittingGross: ['Plate, fittings (gross)', 0.0001, 'kg'], troughGross: ['Plate, U-trough (gross)', 0.0001, 'kg'], holes: ['Coupler holes (scrap)', 0.0001, 'kg'], straightNet: ['Plate net weight, straight', 0.0001, 'kg'], fittingNet: ['Plate net weight, fittings', 0.0001, 'kg'], thk: ['Plate thickness', 0.5, 'mm'] })}
      ${tbl('Ladder geometry', T.ladder, 'ladder', { collar: ['Rail collar', 1, 'mm'], holesPer2500: ['Holes per 2500 mm of runner', 1, ''], holeDia: ['Hole diameter', 1, 'mm'], rungsPer2500: ['Rungs per 2500 mm', 1, ''], rungWidth: ['Rung width', 1, 'mm'], rungHeight: ['Rung collar height', 1, 'mm'], rungThk: ['Rung thickness', 0.5, 'mm'], slotLen: ['Rung slot length', 1, 'mm'], slotWidth: ['Rung slot width', 1, 'mm'], scrapSalvage: ['Steel scrap salvage value', 0.05, ''] })}
      ${tbl('Perforated tray', T.perf, 'perf', { perfPerRow: ['Perforations per row', 1, ''], perfLen: ['Perforation length', 1, 'mm'], perfWid: ['Perforation width', 1, 'mm'], spacing: ['Row spacing', 1, 'mm'], couplerHoles: ['Coupler holes', 1, ''], couplerHoleDia: ['Coupler hole diameter', 1, 'mm'], scrapSalvage: ['Steel scrap salvage value', 0.05, ''] })}
      ${tbl('U-trough', T.trough, 'trough', { perfPerRow: ['Perforations per row', 1, ''], perfLen: ['Perforation length', 1, 'mm'], perfWid: ['Perforation width', 1, 'mm'], spacing: ['Row spacing', 1, 'mm'], scrapSalvage: ['Steel scrap salvage value', 0.05, ''] })}
      ${tbl('Channel & cantilever arm', T.channel, 'channel', { lip: ['Lip / return', 1, 'mm'], slotLen: ['Slot length', 1, 'mm'], slotWidth: ['Slot width', 1, 'mm'], pitch: ['Slot pitch', 1, 'mm'], scrapSalvage: ['Steel scrap salvage value', 0.05, ''] })}
      ${tbl('Fitting lengths (as entered in each sheet)', T.fittingLength, 'fittingLength', { hbend: ['Horizontal bend', 10, 'mm'], vup: ['Vertical bend up', 10, 'mm'], vdown: ['Vertical bend down', 10, 'mm'], tee: ['Horizontal tee', 10, 'mm'], cross: ['Horizontal cross', 10, 'mm'] })}
      <div class="card pad"><div class="h3">Coupler plate sizes · by tray width and depth</div><table class="t num"><thead><tr><th class="r">Width</th><th class="r">Depth</th><th class="r">Plate length</th><th class="r">Plate height</th></tr></thead><tbody>${T.couplerTable.rows.map((rw, i) => `<tr><td class="r">${rw[0]}</td><td class="r">${rw[1]}</td><td class="r">${ni(`couplerTable.rows.${i}.2`, rw[2], 1)}</td><td class="r">${ni(`couplerTable.rows.${i}.3`, rw[3], 1)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  /* ---------- events ---------- */
  const setPath = (path, v) => { const t = path.split('.'); let o = ts().T; for (let i = 0; i < t.length - 1; i++) o = o[t[i]]; o[t[t.length - 1]] = v; };
  const setKind = (k) => {
    const c = ts().cfg, K = KINDS[k];
    c.kind = k; ts().unit = defaultUnit(k);
    if (K.section) { c.width = 41; c.depth = k === 'channel' ? (c.depth === 82 ? 82 : 41) : 41; c.thk = 2.5; c.length = k === 'channel' ? 1000 : 750; }
    else {
      if (c.width === 41 || c.width < 50) { c.width = 300; c.depth = 100; c.thk = 2; }
      if (k === 'trough') { c.width = [50, 75, 100].includes(c.width) ? c.width : 75; c.depth = [20, 25, 50].includes(c.depth) ? c.depth : 25; c.thk = 2; }
      else if (c.width < 150) { c.width = 300; c.depth = 100; }
      c.length = K.straight ? 2500 : undefined;
    }
  };
  function onClick(e, t) {
    const d = t.dataset, c = ts().cfg;
    if (d.tkind) { setKind(d.tkind); return 'refresh'; }
    if (d.twidth) { c.width = +d.twidth; return 'refresh'; }
    if (d.tdepth) { c.depth = +d.tdepth; return 'refresh'; }
    if (d.tdepthc) { c.depth = +d.tdepthc; return 'refresh'; }
    if (d.tthk) { c.thk = +d.tthk; return 'refresh'; }
    if (d.tlen) { c.length = +d.tlen; return 'refresh'; }
    if (d.tview) { ts().view = d.tview; persist(); render(true); return 'done'; }
    if (d.tbtab) { ts().btab = d.tbtab; render(true); return 'done'; }
    if (d.unit) { ts().unit = d.unit; return 'refresh'; }
    if (t.id === 'tedit') { ts().editParams = !ts().editParams; render(true); return 'done'; }
    if (t.id === 'treset') { const keep = ts(); keep.T = clone(TRAY_DEFAULTS); return 'refresh'; }
    if (d.bload !== undefined) { const b = ts().boq[+d.bload]; ts().cfg = clone(b.cfg); if (KINDS[b.cfg.kind].fitting) delete ts().cfg.length; ts().unit = defaultUnit(b.cfg.kind); ts().qty[b.cfg.kind] = b.qty; return 'build'; }
    return null;
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'tlen') { const v = +t.value; if (v >= 100) { ts().cfg.length = v; persist(); render(true); } return true; }
    if (t.id === 'tqty') { const k = ts().cfg.kind; ts().qty[k] = Math.max(0, +t.value || 0); persist(); const r = calc(); const q = $('#sc .qty'); if (q) q.firstChild.textContent = big(boqRate(r) * ts().qty[k]) + ' for '; return true; }
    return false;
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.tp) { const v = parseFloat(t.value); if (!Number.isNaN(v)) { if (['params.steelRate', 'params.zincRate'].includes(t.dataset.tp)) ctx.priceEdited?.(); setPath(t.dataset.tp, v); return 'refresh'; } return 'done'; }
    if (t.dataset.bqty !== undefined) { ts().boq[+t.dataset.bqty].qty = Math.max(0, +t.value || 0); return 'refresh'; }
    return null;
  }
  const pages = { build: page, batch: boqPage, calc: calcPage, master: masterPage };
  return { renderPage: (tab) => pages[tab](), render, onClick, onInput, onChange, tabs: [['build', 'Build Up'], ['batch', 'BoQ'], ['calc', 'Calculations'], ['master', 'Master Data']], units: UNITS, getUnit: () => ts().unit };
}
