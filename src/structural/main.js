import '../style.css';
import './extra.css';
import { TEMPLATES, defaultParams, takeoff } from './takeoff.js';
import { costFromTakeoff, PROJECT_DEFAULTS, PAINTS, getEngine } from './costmap.js';
import { buildStructure3D } from './geom.js';
import { createViewer } from '../viewer.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const LS = 'scm-structural-v1';
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (n, d = 0) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const inr = (n, d = 0) => '₹' + nf(n, d);
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
const crore = (v) => (v >= 1e7 ? `₹${nf(v / 1e7, 2)} Cr` : v >= 1e5 ? `₹${nf(v / 1e5, 2)} lakh` : inr(v));
const ICON = {
  reset: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/></svg>',
  spin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 3v6h-6"/></svg>',
  zin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
  zout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>',
  full: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  layers: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01" stroke-linecap="round"/></svg>',
};
const GLYPH = {
  peb: '<path d="M4 26V12L16 5l12 7v14M4 26h24M10 26V13M22 26V13M10 13l6-4 6 4"/>', rack: '<path d="M5 28V8M16 28V8M27 28V8M5 12h22M5 19h22M5 8h22M10 28l6-9M16 28l6-9"/>',
  facade: '<path d="M5 4v24M13 4v24M21 4v24M29 4v24M5 10h24M5 17h24M5 24h24"/>', pipe: '<ellipse cx="9" cy="16" rx="4" ry="9"/><path d="M9 7h18M9 25h18M27 7c3 2 3 16 0 18"/><path d="M17 8v16M23 8v16"/>',
  custom: '<path d="M6 6h20v20H6zM6 12h20M6 19h20M13 6v20"/>',
};
const glyph = (k) => `<svg viewBox="0 0 32 32" fill="none" stroke="#5b6573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPH[k]}</svg>`;
const TYPE_LABEL = { builtup: 'Built-up', hotroll: 'Hot-roll', hollow: 'Hollow', plate: 'Plate-rolled' };
const WELD_LABEL = { low: 'Low', mod: 'Moderate', heavy: 'Heavy' };
const PARTS = [['raw', 'Raw steel', '#64748b'], ['machinery', 'Machinery', '#2563eb'], ['salaries', 'Labour', '#0ea5a4'], ['consumables', 'Consumables', '#8b5cf6'], ['utilities', 'Utilities', '#f59e0b'],
  ['civil', 'Civil, infra & set-up', '#94a3b8'], ['overheads', 'Overheads', '#06b6d4'], ['bolting', 'Bolts', '#c27a2c'], ['transport', 'Transport', '#e11d74'], ['erection', 'Erection', '#16a34a'], ['contingency', 'Contingency', '#a3a3a3'], ['margin', 'Vendor margin', '#0f9d6b']];

/* ---------- state ---------- */
const defaultState = () => ({
  tpl: 'peb', tab: 'build', view: '3d', btab: 'cost', clad: true, commercial: false,
  params: Object.fromEntries(Object.keys(TEMPLATES).map((k) => [k, defaultParams(k)])), over: {}, project: clone(PROJECT_DEFAULTS), extra: {}, filter: '', sheet: 'Input',
});
let S = defaultState();
try { const v = JSON.parse(localStorage.getItem(LS) || 'null'); if (v) { S = { ...S, ...v, project: { ...S.project, ...v.project } }; for (const k of Object.keys(TEMPLATES)) S.params[k] = { ...defaultParams(k), ...(v.params?.[k] || {}) }; } } catch { /* no storage */ }
const persist = () => { try { localStorage.setItem(LS, JSON.stringify({ tpl: S.tpl, view: S.view, clad: S.clad, params: S.params, over: S.over, project: S.project, extra: S.extra })); } catch { /* ignore */ } };

/* ---------- evaluation ---------- */
let cache = null;
function evaluate() {
  const tk = takeoff(S.tpl, S.params[S.tpl]);
  const ov = S.over[S.tpl] || {};
  tk.groups.forEach((g) => { g.kgModel = g.kg; if (ov[g.id] != null && ov[g.id] !== '') g.kg = Math.max(0, +ov[g.id]); g.overridden = ov[g.id] != null && ov[g.id] !== ''; });
  const cost = costFromTakeoff(tk, S.project, S.extra);
  cache = { tk, cost, net: tk.groups.reduce((a, g) => a + g.kg, 0), area: tk.groups.reduce((a, g) => a + (g.area || 0) * (g.kg / Math.max(g.kgModel, 1e-9)), 0) };
  return cache;
}

/* ---------- shell ---------- */
const root = $('#app');
let viewer = null;
const vhost = document.createElement('div'); vhost.className = 'pane'; vhost.id = 'pane-3d';
function shell() {
  root.innerHTML = `
  <div class="top"><div class="crumb"><a href="#">Should Cost Analysis</a> / <b>Structural steel &amp; PEB</b></div></div>
  <div class="sub"><select class="select" id="tpl" aria-label="Structure type">${Object.values(TEMPLATES).map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}</select>
    <div class="tabs" id="tabs"></div><div class="spacer"></div><button class="iconbtn" id="reset-all" title="Reset everything">${ICON.reset}</button></div>
  <div id="page"></div>`;
  $('#tabs').innerHTML = [['build', 'Build Up'], ['takeoff', 'Takeoff'], ['calc', 'Cost model'], ['master', 'Workbook inputs']].map(([id, l]) => `<button class="tab" data-tab="${id}">${l}</button>`).join('');
}
const sync = () => { $('#tpl').value = S.tpl; document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab)); };

/* ---------- Build Up ---------- */
function buildPage() {
  $('#page').innerHTML = `<div class="grid">
    <aside class="card col-l" id="left"></aside>
    <section class="col-c">
      <div class="card" style="overflow:hidden"><div class="hero" id="hero-head"></div>
        <div class="viewer-wrap" id="vw"><div class="float tr" id="vtools"></div><div class="hint" id="vhint"></div></div><div class="metrics" id="metrics"></div></div>
      <div class="card" id="bottom"></div></section>
    <aside class="col-r"><div class="card sc" id="sc"></div><div class="card landed" id="basis"></div></aside></div>`;
  $('#vw').prepend(vhost);
  if (!viewer) viewer = createViewer(vhost); else viewer.resume();
  renderBuild();
}
function renderBuild(skipLeft) {
  const e = evaluate();
  if (!skipLeft) left();
  hero(e); right(e); bottom(e); view3d(e);
}

function paramRow(q, v) {
  if (q.options) return `<div class="label">${esc(q.l)}</div><div class="seg block">${q.options.map(([k, l]) => `<button data-opt="${q.k}" data-val="${k}" class="${v === k ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  return `<div class="prow"><div class="label" style="margin:12px 0 4px"><span>${esc(q.l)}</span><small>${q.u}</small></div>
    <div class="pbox"><input type="range" data-sl="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${v}" aria-label="${esc(q.l)}"><input class="cell pnum" type="number" data-pn="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${v}"></div></div>`;
}
function left() {
  const T = TEMPLATES[S.tpl], P = S.params[S.tpl], pr = S.project;
  const sel = (id, kind) => `<select class="select" data-paint="${id}" style="width:100%;min-width:0;margin-top:2px">${PAINTS[kind].map(([k, l]) => `<option value="${esc(k)}" ${pr[id] === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  $('#left').innerHTML = `
    <div class="sec-h"><span class="step">1</span>Structure</div>
    <div class="fam" style="grid-template-columns:repeat(3,1fr)">${Object.values(TEMPLATES).map((t) => `<button data-tpl="${t.id}" class="${S.tpl === t.id ? 'on' : ''}">${glyph(t.id)}<span>${t.name.replace(' (PEB)', '').replace('Large-dia ', 'Large ')}</span></button>`).join('')}</div>
    <div class="note" style="padding:8px 0 0">${esc(T.blurb)}</div>
    <hr class="divider">
    <div class="sec-h"><span class="step">2</span>Drawing parameters</div>
    ${T.params.map((q) => paramRow(q, P[q.k])).join('')}
    <hr class="divider">
    <button class="link" id="comm">Commercial basis ${S.commercial ? '▴' : '▾'}</button>
    ${S.commercial ? `
      <div class="label">Fabrication basis</div><div class="seg block"><button data-shop="existing" class="${pr.shop === 'existing' ? 'on' : ''}">Existing shop</button><button data-shop="yard" class="${pr.shop === 'yard' ? 'on' : ''}">Project yard</button></div>
      <div class="note" style="padding:6px 0 0">${pr.shop === 'yard' ? 'Adds the workbook’s one-off yard set-up (₹2.4 Cr): roughly ₹24,000/t on a 1,000 t job.' : 'Excludes the one-off yard set-up that the workbook recovers over a 37,000 t order.'}</div>
      ${[['steelPrice', 'Steel price', '₹/t', 500], ['e350Premium', 'E350 premium', '₹/t', 500], ['distance', 'Distance to site', 'km', 10], ['erection', 'Erection rate', '₹/t', 500], ['contingency', 'Contingency', '₹/t', 100]].map(([k, l, u, st]) => `<div class="label"><span>${l}</span><small>${u}</small></div><input class="cell" style="width:100%;text-align:left;padding:7px 10px" type="number" step="${st}" data-pj="${k}" value="${pr[k]}">`).join('')}
      <div class="label"><span>Vendor margin</span><small>% of cost</small></div><input class="cell" style="width:100%;text-align:left;padding:7px 10px" type="number" step="0.5" data-pj="margin" data-scale="100" value="${+(pr.margin * 100).toFixed(2)}">
      <div class="label"><span>Bolts</span><small>% of steel weight</small></div><input class="cell" style="width:100%;text-align:left;padding:7px 10px" type="number" step="0.1" data-pj="boltPct" data-scale="100" placeholder="${(T.run === undefined ? 3 : (evaluate().tk.bolts * 100).toFixed(1))} (template)" value="${pr.boltPct == null ? '' : +(pr.boltPct * 100).toFixed(2)}">
      <div class="label">Paint system</div>${sel('primer', 'primer')}${sel('mid', 'mid')}${sel('final', 'final')}
      <div class="label"><span>Dry film thickness</span><small>µm per coat</small></div><div style="display:flex;gap:6px">${[0, 1, 2].map((i) => `<input class="cell" style="width:100%;text-align:center;padding:7px 4px" type="number" step="5" data-dft="${i}" value="${pr.dft[i]}" aria-label="Coat ${i + 1} thickness">`).join('')}</div>` : ''}`;
}

function hero(e) {
  const T = TEMPLATES[S.tpl], c = e.cost;
  const views = [['3d', '3D model'], ['elev', 'Elevation'], ['plan', 'Plan view'], ...(S.tpl === 'pipe' ? [['cut', 'Cutaway']] : [])];
  if (!views.find((v) => v[0] === S.view)) S.view = '3d';
  $('#hero-head').innerHTML = `<div class="hero-h"><div><h1>${esc(titleOf())}</h1><div class="meta">${esc(subtitleOf())}</div></div><div class="spacer"></div>
    <div class="seg">${views.map(([v, l]) => `<button data-view="${v}" class="${S.view === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  if (!c) { $('#metrics').innerHTML = ''; return; }
  const intensity = e.tk.area ? `${nf((e.net / e.tk.area), 1)} kg/${e.tk.unitArea}` : '–';
  $('#metrics').innerHTML = [['Net steel', `${nf(e.net / 1000, 1)} t`], ['Intensity', intensity], ['With wastage', `${nf(c.requirement, 1)} t`], ['Paint area', `${nf(e.area)} m²`]]
    .map(([k, v]) => `<div class="metric"><small>${k}</small><b class="num">${v}</b></div>`).join('') + `<div class="metric"><button class="link" data-tab="takeoff">Takeoff →</button></div>`;
}
function titleOf() {
  const p = S.params[S.tpl], T = TEMPLATES[S.tpl];
  return { peb: `${p.span} m × ${p.length} m factory shed`, rack: `${p.length} m pipe rack, ${p.tiers} tier${p.tiers > 1 ? 's' : ''}`, facade: `${p.width} × ${p.height} m façade framing`, pipe: `Ø${p.diameter} m × ${p.length} m rolled-plate pipe`, custom: 'Custom takeoff' }[S.tpl] || T.name;
}
function subtitleOf() {
  const p = S.params[S.tpl], d = cache.tk.dims;
  return { peb: `${d.nb} bays of ${nf(d.B, 2)} m · eave ${p.eave} m · slope 1:${p.slope} · ${p.crane ? p.crane + ' t crane' : 'no crane'} · ${nf(d.S * d.Lt)} m²`,
    rack: `${d.nb} bays of ${nf(d.B, 2)} m · ${p.width} m wide · ${d.cols} columns per frame · top of steel ${nf(d.Hc, 1)} m`, facade: `${d.nm} mullions at ${p.module} m · ${d.floors} floors · ${nf(d.W * d.Ht)} m²`,
    pipe: `${d.t * 1000} mm plate · ${d.nSp} spools of ${p.spool} m · ${d.nr} stiffener rings · ${p.joint === 'flanged' ? 'flanged' : 'butt-welded'} joints`, custom: 'Tonnage entered by category' }[S.tpl];
}

const ELEV = { peb: [1, 0.04, 0.0001], rack: [1, 0.04, 0.0001], facade: [0.0001, 0.02, 1], pipe: [0.0001, 0.05, 1], custom: [1, 0.1, 0.5] };
function view3d(e) {
  const sup = S.tpl !== 'custom';
  $('#vtools').innerHTML = `${S.tpl === 'peb' || S.tpl === 'facade' ? `<button class="iconbtn ${S.clad ? 'act' : ''}" data-act="clad" title="Show / hide cladding">${ICON.layers}</button>` : ''}<button class="iconbtn" data-act="spin" title="Auto-rotate">${ICON.spin}</button><button class="iconbtn" data-act="zin" title="Zoom in">${ICON.zin}</button><button class="iconbtn" data-act="zout" title="Zoom out">${ICON.zout}</button><button class="iconbtn" data-act="home" title="Reset view">${ICON.reset}</button><button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`;
  if (!sup) { vhost.style.visibility = 'hidden'; $('#vhint').textContent = 'Custom takeoff has no drawing. Choose a structure type to see a model.'; return; }
  vhost.style.visibility = 'visible';
  const g = buildStructure3D(S.tpl, e.tk.dims, { cladding: S.clad, cut: S.view === 'cut' });
  viewer.showGroup(g, S.view === 'plan' ? 'top' : S.view === 'elev' ? ELEV[S.tpl] : 'iso');
  $('#vhint').textContent = (g.userData.note ? g.userData.note + ' · ' : '') + 'Drag to rotate · scroll to zoom';
  viewer.resize();
}

function right(e) {
  const c = e.cost;
  if (!c) { $('#sc').innerHTML = '<div class="warn">Enter a structure with steel weight to see a cost.</div>'; $('#basis').innerHTML = ''; return; }
  const parts = PARTS.map(([k, l, col]) => ({ k, l, col, v: c[k] ?? (k === 'margin' ? c.margin : 0) })).filter((p) => p.v > 0);
  const area = e.tk.area;
  $('#sc').innerHTML = `<div class="cap"><span>Structure cost · supplied and erected</span></div>
    <div class="big num">${crore(c.selling)}</div>
    <div class="qty num">${inr(c.perMT)} per tonne${area ? ` · ${inr(c.selling / area)} per ${e.tk.unitArea}` : ''}</div>
    <div class="stack">${parts.map((p) => `<i style="width:${(p.v / c.selling) * 100}%;background:${p.col}" title="${p.l}"></i>`).join('')}</div>
    <div class="break num">${parts.map((p) => `<div><span><span class="dot" style="background:${p.col}"></span>${p.l}</span><span class="v">${crore(p.v)}<em>${pct(p.v / c.selling)}</em></span></div>`).join('')}</div>
    <div class="range"><div class="cap"><span>Cost before margin</span><span class="num"><b>${crore(c.cost)}</b></span></div>
      <div class="note num" style="padding:6px 0 0">Raw steel ${pct(c.raw / c.selling, 0)} · fabrication ${pct((c.stage1 - c.raw) / c.selling, 0)} · erection ${pct(c.erection / c.selling, 0)}</div></div>`;
  const pr = S.project;
  $('#basis').innerHTML = `<div class="hd"><b>Basis</b><button class="iconbtn" data-tab="master" title="Open workbook inputs">${ICON.info}</button></div>
    ${[['Steel', `${inr(pr.steelPrice)}/t`], ['Wastage', pct(c.inputs.wastage)], ['Distance', `${pr.distance} km`], ['Erection', `${inr(pr.erection)}/t`], ['Fabrication', pr.shop === 'yard' ? 'Project yard' : 'Existing shop'], ['Paint', `${c.inputs.paintArea.toFixed(1)} m²/t · ${pr.dft.reduce((a, b) => a + (+b || 0), 0)} µm`]].map(([k, v]) => `<div class="lp"><b>${k}</b><div class="price num" style="font-size:13px">${v}</div></div>`).join('')}
    <div class="note">Costs run through your workbook’s own formulas. Change the commercial basis on the left.</div>`;
}

function bottom(e) {
  const tabs = `<div class="btabs">${[['cost', 'Cost anatomy'], ['members', 'Members'], ['notes', 'Sizing notes']].map(([k, l]) => `<button class="btab ${S.btab === k ? 'on' : ''}" data-btab="${k}">${l}</button>`).join('')}</div>`;
  const c = e.cost; let body = '';
  if (!c) { $('#bottom').innerHTML = tabs; return; }
  if (S.btab === 'cost') {
    const parts = PARTS.map(([k, l, col]) => ({ l, col, v: c[k] ?? 0 })).filter((p) => p.v > 0);
    let run = 0; const wf = parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
    body = `<div class="pad"><div class="h3">Cost per tonne · ${nf(c.payable, 1)} t payable</div><p class="p">Each step comes from the workbook’s Output sheet; machinery, labour and utilities are plant-months at the vendor’s capacity.</p>
      <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / c.selling) * 100}%;width:${Math.max((s.v / c.selling) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}${inr(s.v / c.payable)}<span class="mut"> /t</span></span></div>`).join('')}
      <div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Selling price</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">${inr(c.perMT)}<span class="mut"> /t</span></b></div></div>
      <div class="note" style="margin-top:10px">Plant months at the vendor: built-up ${nf(c.months.built || 0, 1)} · plate ${nf(c.months.plate || 0, 1)} · hot-roll ${nf(c.months.hot || 0, 1)} · blasting & painting ${nf(c.months.paint || 0, 1)}.</div></div>`;
  } else if (S.btab === 'members') {
    body = `<div class="pad"><div class="scroll"><table class="t num"><thead><tr><th>Member group</th><th>Section</th><th class="r">Weight kg</th><th class="r">Share</th></tr></thead><tbody>${e.tk.groups.map((g) => `<tr><td>${esc(g.name)}</td><td class="mut">${esc(g.section)}</td><td class="r">${nf(g.kg)}</td><td><div class="bar"><i style="width:${(g.kg / e.net) * 100}%"></i></div></td></tr>`).join('')}
      <tr class="total"><td colspan="2">Net steel</td><td class="r">${nf(e.net)}</td><td>${nf(e.net / 1000, 2)} t</td></tr></tbody></table></div></div>`;
  } else {
    body = `<div class="pad"><div class="h3">How the members were sized</div><ul class="notes">${e.tk.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>${(e.tk.warn || []).map((w) => `<div class="warn">${esc(w)}</div>`).join('')}
      <div class="banner" style="margin-top:12px">${ICON.info}<div><b>Preliminary takeoff.</b> Sizes come from simplified rules, good for early should-cost within roughly ±15%. For a tender, enter the weights from your drawings on the Takeoff tab; they flow through the cost model unchanged.</div></div></div>`;
  }
  $('#bottom').innerHTML = tabs + body;
}

/* ---------- Takeoff ---------- */
function takeoffPage() {
  const e = evaluate(), ov = S.over[S.tpl] || {};
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Steel takeoff · ${esc(titleOf())}</div><div class="note" style="padding:0">Type a weight in the yellow column to replace the model figure with your drawing quantity. Wastage, grades, welding class and paint area follow automatically.</div></div><div class="spacer"></div><button class="btn" id="csv">Export CSV</button></div>
    <div class="scroll"><table class="t num"><thead><tr><th>Member group</th><th>Section</th><th>Quantity</th><th>Fabrication</th><th>Grade</th><th>Weld</th><th class="r">Model kg</th><th class="r">Your kg</th><th class="r">Used kg</th><th class="r">Paint m²</th></tr></thead><tbody>
    ${e.tk.groups.map((g) => `<tr><td><b>${esc(g.name)}</b></td><td class="mut">${esc(g.section)}</td><td class="mut">${esc(g.qty)}</td><td>${TYPE_LABEL[g.type]}</td><td>${g.grade}</td><td>${WELD_LABEL[g.weld]}</td><td class="r">${nf(g.kgModel)}</td><td class="r"><input class="cell" type="number" min="0" data-ov="${g.id}" value="${ov[g.id] ?? ''}" placeholder="–"></td><td class="r"><b>${nf(g.kg)}</b></td><td class="r">${nf((g.area || 0) * (g.kg / Math.max(g.kgModel, 1e-9)))}</td></tr>`).join('')}
    <tr class="total"><td colspan="8">Total net steel</td><td class="r">${nf(e.net)}</td><td class="r">${nf(e.area)}</td></tr></tbody></table></div>
    ${e.cost ? `<div class="pad"><div class="kv num" style="max-width:520px"><div class="k">Net weight</div><div class="v">${nf(e.net / 1000, 2)} t</div><div class="k">Weighted wastage</div><div class="v">${pct(e.cost.inputs.wastage)}</div><div class="k">Requirement incl. wastage</div><div class="v">${nf(e.cost.requirement, 2)} t</div>
      <div class="k">Grade E250 / E350</div><div class="v">${pct(e.cost.inputs.grade.E250, 0)} / ${pct(e.cost.inputs.grade.E350, 0)}</div><div class="k">Fabrication: built-up / plate / hot-roll equivalent</div><div class="v">${pct(e.cost.inputs.fab.built, 0)} / ${pct(e.cost.inputs.fab.plate, 0)} / ${pct(e.cost.inputs.fab.hot, 0)}</div>
      <div class="k">Weld complexity low / moderate / heavy</div><div class="v">${pct(e.cost.inputs.weld.low, 0)} / ${pct(e.cost.inputs.weld.mod, 0)} / ${pct(e.cost.inputs.weld.heavy, 0)}</div><div class="k">Light / medium-heavy for transport</div><div class="v">${nf(e.cost.inputs.lightMT, 1)} t / ${nf(e.cost.inputs.heavyMT, 1)} t</div></div></div>` : ''}</div></div>`;
}

/* ---------- Cost model (Output sheet) ---------- */
function calcPage() {
  const e = evaluate(), c = e.cost, wb = getEngine();
  if (!c) { $('#page').innerHTML = '<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="warn">No steel weight yet.</div></div></div>'; return; }
  const v = (a) => wb.get('Output', a) ?? 0;
  const L = (label, a, ind = 0, bold = false) => `<tr ${bold ? 'class="total"' : ''}><td style="padding-left:${10 + ind * 18}px">${label}</td><td class="r">${nf(v(a))}</td><td class="r">${nf(v(a) / c.payable)}</td><td class="r">${pct(v(a) / c.selling)}</td></tr>`;
  const drivers = c.driven.map((k) => { const [sh, a] = k.split('!'); const lab = labelFor(sh, a); return `<tr><td class="mut">${sh} ${a}</td><td>${esc(lab)}</td><td class="r">${fmtVal(wb.get(sh, a))}</td></tr>`; }).join('');
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)"><div class="card"><div class="pad"><div class="h3">Workbook output · ${esc(titleOf())}</div><p class="p">The Output sheet of your cost model, evaluated for this structure. Amounts in ₹.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Line</th><th class="r">Total ₹</th><th class="r">₹ per tonne</th><th class="r">Share</th></tr></thead><tbody>
    ${L('Raw material (net of wastage recovery)', 'C14', 1)}${L('Machinery', 'C15', 1)}${L('Salaries', 'C16', 1)}${L('Utilities (power, water)', 'C18', 1)}${L('Consumables', 'C19', 1)}${L('– Welding', 'C20', 2)}${L('– Blasting & painting', 'C21', 2)}${L('– Others', 'C22', 2)}${L('Civil, infra & mobilisation', 'C23', 1)}${L('Bolting', 'C26', 1)}${L('Overheads', 'C17', 1)}${L('Stage 1: fabrication at vendor unit', 'C13', 0, true)}
    ${L('Stage 2: transport to site', 'C28', 0, true)}${L('Stage 3: erection', 'C32', 0, true)}${L('Contingency', 'C33', 0, true)}${L('Total cost (excl. profit)', 'C35', 0, true)}
    <tr class="total"><td>Vendor margin (${pct(S.project.margin, 1)} on non-steel cost)</td><td class="r">${nf(c.margin)}</td><td class="r">${nf(c.margin / c.payable)}</td><td class="r">${pct(c.margin / c.selling)}</td></tr>
    <tr class="total"><td><b>Selling price</b></td><td class="r"><b>${nf(c.selling)}</b></td><td class="r"><b>${nf(c.perMT)}</b></td><td class="r">100%</td></tr></tbody></table></div></div></div>
    <div class="card"><div class="pad"><div class="h3">What the structure feeds into the workbook</div><p class="p">These Input and Calculation cells are set from the takeoff and the commercial basis. Everything else is as in your file (edit it on the Workbook inputs tab).</p><div class="scroll"><table class="t num"><tbody>${drivers}</tbody></table></div></div></div></div>`;
}
const fmtVal = (x) => (typeof x === 'number' ? (Math.abs(x) < 1 && x !== 0 ? nf(x, 4) : nf(x, 2)) : esc(x ?? ''));
function labelFor(sheet, addr) {
  const wb = getEngine(), row = +addr.replace(/\D/g, '');
  for (const col of ['B', 'C']) { const c = wb.raw(sheet, col + row); if (c && typeof c.v === 'string') return c.v; }
  return '';
}

/* ---------- Workbook inputs explorer ---------- */
function masterPage() {
  const wb = getEngine(); evaluate();
  const driven = new Set(cache.cost?.driven || []);
  const sheet = S.sheet, cells = wb.sheets[sheet], f = S.filter.toLowerCase();
  const rows = [];
  for (const [addr, c] of Object.entries(cells)) {
    if (c.f !== undefined || typeof c.v !== 'number') continue;
    const lab = labelFor(sheet, addr); if (f && !(`${lab} ${addr}`.toLowerCase().includes(f))) continue;
    rows.push({ addr, lab, v: c.v, row: +addr.replace(/\D/g, '') });
  }
  rows.sort((a, b) => a.row - b.row || a.addr.localeCompare(b.addr));
  const shown = rows.slice(0, 250);
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Workbook inputs</div><div class="note" style="padding:0">Every numeric constant in your cost model. Edit a value to override it; cells set by the structure are locked. Overrides are kept in this browser.</div></div><div class="spacer"></div>
    <div class="seg">${['Input', 'Calculation Sheet'].map((s) => `<button data-sheet="${s}" class="${sheet === s ? 'on' : ''}">${s === 'Input' ? 'Input sheet' : 'Calculation sheet'}</button>`).join('')}</div>
    <input class="cell" style="width:200px;text-align:left;padding:7px 10px" id="flt" placeholder="Filter, e.g. crane, salary…" value="${esc(S.filter)}"><button class="btn" id="clr">Clear overrides (${Object.keys(S.extra).length})</button></div>
    <div class="scroll"><table class="t num"><thead><tr><th>Cell</th><th>Item</th><th class="r">Value</th><th>Status</th></tr></thead><tbody>
    ${shown.map((r) => { const k = `${sheet}!${r.addr}`, d = driven.has(k), ex = k in S.extra; return `<tr><td class="mut">${r.addr}</td><td>${esc(r.lab)}</td><td class="r">${d ? nf(wb.get(sheet, r.addr), 4) : `<input class="cell" type="number" step="any" data-x="${k}" value="${ex ? S.extra[k] : r.v}">`}</td><td>${d ? '<span class="soonpill">from structure</span>' : ex ? '<span class="pill">overridden</span>' : ''}</td></tr>`; }).join('')}
    </tbody></table></div>${rows.length > 250 ? `<div class="note" style="padding:10px 18px">Showing 250 of ${rows.length} cells. Use the filter to narrow the list.</div>` : ''}</div></div>`;
}

/* ---------- routing / events ---------- */
function show(tab) {
  S.tab = tab; sync();
  if (tab !== 'build') viewer?.pause();
  ({ build: buildPage, takeoff: takeoffPage, calc: calcPage, master: masterPage })[tab]();
}
const refresh = () => { persist(); if (S.tab === 'build') renderBuild(true); else show(S.tab); };
const setParam = (k, v) => { S.params[S.tpl][k] = v; persist(); renderBuild(true); };
const clampP = (q, v) => Math.min(q.max, Math.max(q.min, v));

root.addEventListener('click', (ev) => {
  const t = ev.target.closest('button'); if (!t) return;
  const d = t.dataset;
  if (d.tab) return show(d.tab);
  if (d.tpl) { S.tpl = d.tpl; S.view = '3d'; persist(); return S.tab === 'build' ? renderBuild() : show(S.tab); }
  if (d.opt) { setParam(d.opt, d.val); return left(); }
  if (d.view) { S.view = d.view; persist(); return renderBuild(true); }
  if (d.btab) { S.btab = d.btab; return renderBuild(true); }
  if (d.shop) { S.project.shop = d.shop; persist(); return renderBuild(); }
  if (d.sheet) { S.sheet = d.sheet; return masterPage(); }
  if (t.id === 'comm') { S.commercial = !S.commercial; return left(); }
  if (t.id === 'clr') { S.extra = {}; persist(); return masterPage(); }
  if (t.id === 'reset-all') { S = defaultState(); try { localStorage.removeItem(LS); } catch { /* ignore */ } return show('build'); }
  if (t.id === 'csv') {
    const e = evaluate(), rows = [['Group', 'Section', 'Quantity', 'Fabrication', 'Grade', 'Weld', 'Model kg', 'Used kg']];
    e.tk.groups.forEach((g) => rows.push([g.name, g.section, g.qty, TYPE_LABEL[g.type], g.grade, WELD_LABEL[g.weld], Math.round(g.kgModel), Math.round(g.kg)]));
    const a = document.createElement('a'); a.download = `takeoff-${S.tpl}.csv`; a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.click(); return;
  }
  if (d.act) {
    if (d.act === 'full') { const vw = $('#vw'); return document.fullscreenElement ? document.exitFullscreen() : vw.requestFullscreen?.(); }
    if (d.act === 'spin') return viewer.toggleSpin(); if (d.act === 'zin') return viewer.zoom(0.82); if (d.act === 'zout') return viewer.zoom(1.22); if (d.act === 'home') return viewer.resetView();
    if (d.act === 'clad') { S.clad = !S.clad; persist(); return view3d(cache), $('[data-act=clad]')?.classList.toggle('act', S.clad); }
  }
});
root.addEventListener('input', (ev) => {
  const t = ev.target, T = TEMPLATES[S.tpl];
  if (t.id === 'flt') { S.filter = t.value; masterPage(); const f = $('#flt'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); return; }
  if (t.dataset.sl) { const q = T.params.find((x) => x.k === t.dataset.sl), v = clampP(q, +t.value); S.params[S.tpl][q.k] = v; const n = $(`[data-pn="${q.k}"]`); if (n) n.value = v; persist(); renderBuild(true); }
});
root.addEventListener('change', (ev) => setTimeout(() => onChange(ev), 0));  // re-render after the browser has finished the blur
function onChange(ev) {
  const t = ev.target, T = TEMPLATES[S.tpl], d = t.dataset;
  if (t.id === 'tpl') { S.tpl = t.value; S.view = '3d'; persist(); return S.tab === 'build' ? renderBuild() : show(S.tab); }
  if (d.pn) { const q = T.params.find((x) => x.k === d.pn), v = clampP(q, +t.value || q.min); S.params[S.tpl][q.k] = v; persist(); renderBuild(); return; }
  if (d.pj) { const v = t.value === '' ? null : parseFloat(t.value) / (+d.scale || 1); S.project[d.pj] = Number.isNaN(v) ? null : v; persist(); renderBuild(true); return; }
  if (d.paint) { S.project[d.paint] = t.value; persist(); renderBuild(true); return; }
  if (d.dft !== undefined) { S.project.dft[+d.dft] = Math.max(0, +t.value || 0); persist(); renderBuild(true); return; }
  if (d.ov) { const o = (S.over[S.tpl] ||= {}); if (t.value === '') delete o[d.ov]; else o[d.ov] = Math.max(0, +t.value); persist(); return takeoffPage(); }
  if (d.x) { const v = parseFloat(t.value); if (Number.isNaN(v)) delete S.extra[d.x]; else S.extra[d.x] = v; persist(); return masterPage(); }
}

shell(); show(S.tab);
window.__scs = { get state() { return S; }, evaluate };
