import './style.css';
import { DEFAULTS } from './data.js';
import FIXTURES from '../test/fixtures.json';
import { ARMOURS, computeCable, configLabel } from './calc.js';
import { crossSectionSVG } from './section.js';
import { createViewer } from './viewer.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const LS_KEY = 'scm-cable-lt-v1';
const SIZES = DEFAULTS.insul.area;
const CORES = [1, 2, 3, 3.5, 4];
const PART_META = [
  ['material', 'Materials', '#c27a2c'], ['conversion', 'Conversion & other', '#2563eb'], ['transport', 'Transportation', '#0ea5a4'],
  ['drum', 'Drum', '#8b5cf6'], ['overheads', 'Overheads & finance', '#64748b'], ['special', 'Special construction', '#e11d74'], ['margin', 'Margin', '#0f9d6b'],
];
const UNITS = { km: { f: 1, d: 0, label: '₹/km' }, m: { f: 1 / 1000, d: 2, label: '₹/m' }, ft: { f: 0.3048 / 1000, d: 2, label: '₹/ft' } };

const defaultState = () => ({
  tab: 'build', btab: 'anatomy', view: '3d', scenario: 's1', unit: 'km', qty: 25, more: false, editPrices: false,
  cfg: { cores: 3.5, shape: 'Circular', size: 240, conductor: 'Aluminium', insulation: 'XLPE', inner: 'PVC', armour: 'Galvanised steel flat strip', outer: 'PVC', special: {} },
  master: clone(DEFAULTS.master), T: clone(DEFAULTS),
  batch: FIXTURES.map((f) => ({ cfg: { ...f.cfg, special: f.special } })),
});
let S = defaultState();
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  if (saved) S = { ...S, ...saved, T: { ...S.T, ...saved.T } };
} catch { /* storage unavailable: run without persistence */ }
const persist = () => { try { localStorage.setItem(LS_KEY, JSON.stringify({ cfg: S.cfg, scenario: S.scenario, unit: S.unit, qty: S.qty, master: S.master, T: S.T, batch: S.batch, view: S.view })); } catch { /* ignore */ } };

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nf = (n, d = 0) => Number(n).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const inr = (n, d = 0) => '₹' + nf(n, d);
const money = (kmVal) => { const u = UNITS[S.unit]; return inr(kmVal * u.f, u.d); };
const pct = (x, d = 1) => (x * 100).toFixed(d) + '%';
const big = (v) => (v >= 1e7 ? `₹${nf(v / 1e7, 2)} crore` : v >= 1e5 ? `₹${nf(v / 1e5, 2)} lakh` : inr(v));
const $ = (sel, root = document) => root.querySelector(sel);
const calc = () => computeCable(S.cfg, S.master, S.T);
const coresLabel = (c) => (c === 3.5 ? '3½' : c);

const ICON = {
  pencil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
  reset: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/></svg>',
  spin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 11-3-6.7"/><path d="M21 3v6h-6"/></svg>',
  zin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg>',
  zout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>',
  full: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
  info: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01" stroke-linecap="round"/></svg>',
  gauge: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 18a9 9 0 1116 0"/><path d="M12 14l4-5"/></svg>',
};

function famIcon(dots, ring) {
  const pos = { 1: [[0, 0]], 2: [[-4.5, 0], [4.5, 0]], 3: [[0, -4.6], [-4.4, 3], [4.4, 3]], 4: [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]], 7: [[0, 0], ...[0, 1, 2, 3, 4, 5].map((i) => [7 * Math.cos(i * Math.PI / 3), 7 * Math.sin(i * Math.PI / 3)])] };
  const n = dots.length > 4 ? 7 : dots.length; const sz = n === 7 ? 2.3 : n === 1 ? 6 : 3.6;
  return `<svg viewBox="-14 -14 28 28"><circle r="12.5" fill="#2b2e35"/>${ring ? '<circle r="10" fill="#9aa3ad"/><circle r="8.5" fill="#e9dfc6"/>' : '<circle r="10.3" fill="#e9dfc6"/>'}${pos[n].map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${sz}" fill="${dots[i % dots.length]}"/>`).join('')}</svg>`;
}
const FAMILIES = [
  { id: 'lt', name: 'LT power', dots: ['#d64545', '#e8b923', '#3b6fd4'], ring: true, on: true },
  { id: 'ht', name: 'HT power', dots: ['#d64545', '#e8b923', '#3b6fd4'], ring: true },
  { id: 'ctl', name: 'Control', dots: ['#2a2d33', '#fff', '#d64545', '#3b6fd4', '#e8b923', '#2a2d33', '#0f9d6b'] },
  { id: 'ins', name: 'Instru-mentation', dots: ['#3b6fd4', '#fff', '#3b6fd4', '#fff'] },
  { id: 'tc', name: 'Thermo-couple', dots: ['#d64545', '#e8b923'] },
  { id: 'flex', name: 'Flexible', dots: ['#d64545', '#2a2d33', '#e8b923', '#3b6fd4'] },
  { id: 'vfd', name: 'VFD / EMC', dots: ['#0f9d6b', '#2a2d33', '#d64545'], ring: true },
  { id: 'rub', name: 'Rubber / HOFR', dots: ['#2a2d33', '#d64545', '#3b6fd4'] },
  { id: 'dc', name: 'Solar DC', dots: ['#d64545', '#2a2d33'] },
  { id: 'aer', name: 'Aerial bunched', dots: ['#2a2d33', '#2a2d33', '#2a2d33'] },
  { id: 'ear', name: 'Earthing', dots: ['#0f9d6b'] },
  { id: 'bw', name: 'Building wire', dots: ['#d64545'] },
];

const armourShort = (a) => ARMOURS.find((x) => x.id === a)?.short ?? a;
const standard = (c) => (c.insulation === 'XLPE' ? 'IS 7098 Pt 1' : 'IS 1554 Pt 1');
const title = (c) => `${coresLabel(c.cores)}C × ${c.size} mm² ${c.conductor === 'Copper' ? 'Cu' : 'Al'}`;

/* ---------- shell ---------- */
const root = $('#app');
let viewer = null;
const vhost = document.createElement('div'); vhost.className = 'pane'; vhost.id = 'pane-3d';
const sxhost = document.createElement('div'); sxhost.className = 'pane sxbox'; sxhost.id = 'pane-sx';

function shell() {
  root.innerHTML = `
  <div class="top"><div class="crumb"><a href="#">Should Cost Analysis</a> / <b>Cable</b></div></div>
  <div class="sub">
    <select class="select" id="family" aria-label="Item family"><option>Cable</option><option disabled>Cable tray (coming soon)</option><option disabled>Conduit (coming soon)</option></select>
    <div class="tabs" id="tabs"></div><div class="spacer"></div>
    <div class="seg" id="units" role="group" aria-label="Price unit"></div>
    <button class="iconbtn" id="reset-all" title="Reset everything to workbook defaults">${ICON.reset}</button>
  </div>
  <div id="page"></div>`;
  $('#tabs').innerHTML = [['build', 'Build Up'], ['batch', 'Batch'], ['calc', 'Calculations'], ['master', 'Master Data']]
    .map(([id, l]) => `<button class="tab" data-tab="${id}">${l}</button>`).join('');
  $('#units').innerHTML = Object.entries(UNITS).map(([k, u]) => `<button data-unit="${k}">${u.label}</button>`).join('');
}

function syncChrome() {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
  document.querySelectorAll('[data-unit]').forEach((b) => b.classList.toggle('on', b.dataset.unit === S.unit));
}

/* ---------- Build Up ---------- */
function buildPage() {
  $('#page').innerHTML = `<div class="grid">
    <aside class="card col-l" id="left"></aside>
    <section class="col-c">
      <div class="card" style="overflow:hidden">
        <div class="hero" id="hero-head"></div>
        <div class="viewer-wrap" id="vw">
          <div class="float tr" id="vtools"></div><div class="hint" id="vhint"></div>
        </div>
        <div class="metrics" id="metrics"></div>
      </div>
      <div class="card" id="bottom"></div>
    </section>
    <aside class="col-r"><div class="card sc" id="sc"></div><div class="card landed" id="landed"></div></aside>
  </div>`;
  const vw = $('#vw'); vw.prepend(sxhost); vw.prepend(vhost);
  if (!viewer) viewer = createViewer(vhost); else viewer.resume();
  renderBuild();
}

function renderBuild(skipLeft) {
  const r = calc();
  if (!skipLeft) renderLeft();
  renderHero(r); renderRight(r); renderBottom(r); renderViewer(r);
}

function seg(items, cur, attr, block = true) {
  return `<div class="seg ${block ? 'block' : ''}">${items.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-${attr}="${esc(v)}">${l}</button>`).join('')}</div>`;
}

function renderLeft() {
  const c = S.cfg;
  const idx = SIZES.indexOf(c.size);
  const T = S.T;
  const opts = T.special.map((o) => `<label class="toggle ${c.special[o.key] ? 'on' : ''}" data-sp="${o.key}"><span>${esc(o.label)}<em>+${(o.loading * 100).toFixed(1)}%</em></span><span class="sw"></span></label>`).join('');
  $('#left').innerHTML = `
    <div class="sec-h"><span class="step">1</span>Cable family</div>
    <div class="fam">${FAMILIES.map((f) => `<button ${f.on ? 'class="on"' : 'disabled'} title="${f.on ? '' : 'Model not added yet'}">${famIcon(f.dots, f.ring)}${f.on ? '' : '<span class="soon">soon</span>'}<span>${f.name}</span></button>`).join('')}</div>
    <hr class="divider">
    <div class="sec-h"><span class="step">2</span>Construction</div>
    <div class="label">Conductor</div>${seg([['Copper', 'Copper'], ['Aluminium', 'Aluminium']], c.conductor, 'cond')}
    <div class="label">Cores</div>${seg(CORES.map((n) => [n, coresLabel(n)]), c.cores, 'cores')}
    <div class="label">Conductor size <small>IS table, sq mm</small></div>
    <div class="slider-val num" id="size-val">${c.size}<small>sq mm</small></div>
    <input type="range" id="size" min="0" max="${SIZES.length - 1}" step="1" value="${idx}" aria-label="Conductor size">
    <div class="ticks">${[SIZES[0], 25, 120, 400, SIZES[SIZES.length - 1]].map((v) => `<span style="left:${(SIZES.indexOf(v) / (SIZES.length - 1)) * 100}%">${v}</span>`).join('')}</div>
    <div class="label">Armour</div>
    <div class="chips">${ARMOURS.map((a) => `<button class="chip ${c.armour === a.id ? 'on' : ''}" data-armour="${esc(a.id)}">${a.label}</button>`).join('')}</div>
    <div class="label">Insulation</div>${seg([['XLPE', 'XLPE'], ['PVC', 'PVC']], c.insulation, 'ins')}
    <hr class="divider">
    <button class="link" id="more">More options · ${T.special.length + 3} <span>${S.more ? '▴' : '▾'}</span></button>
    ${S.more ? `
      <div class="label">Conductor shape</div>${seg([['Circular', 'Circular'], ['Sector shaped', 'Sector']], c.shape, 'shape')}
      <div class="label">Inner sheath</div>${seg([['PVC', 'PVC'], ['XLPE', 'XLPE']], c.inner, 'inner')}
      <div class="label">Outer sheath</div>${seg([['PVC', 'PVC'], ['XLPE', 'XLPE']], c.outer, 'outer')}
      <div class="label">Special construction <small>% of total cost, stacks</small></div>${opts}` : ''}`;
}

function renderHero(r) {
  const c = S.cfg;
  if (r.error) { $('#hero-head').innerHTML = `<div class="warn">${esc(r.error)}</div>`; $('#metrics').innerHTML = ''; return; }
  $('#hero-head').innerHTML = `<div class="hero-h"><div><h1>${title(c)} ${c.insulation}</h1><div class="meta">LT · 1.1 kV · ${standard(c)} · ${armourShort(c.armour)} · ${c.shape === 'Circular' ? 'circular' : 'sector'} conductor · ${c.inner} inner / ${c.outer} outer sheath</div></div>
    <div class="spacer"></div><div class="seg" id="views">${[['section', 'Cross-section'], ['stripped', 'Stripped view'], ['3d', '3D model']].map(([v, l]) => `<button data-view="${v}" class="${S.view === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  const share = r.cost.conductor / r.scen[S.scenario].selling;
  $('#metrics').innerHTML = [['Overall diameter', `Ø ${r.od} mm`], ['Cable weight', `${nf(r.weight)} kg/km`], ['Conductor metal', `${nf(r.wCond)} kg/km`], ['Conductor share', pct(share)]]
    .map(([k, v]) => `<div class="metric"><small>${k}</small><b class="num">${v}</b></div>`).join('')
    + `<div class="metric"><button class="link" data-tab="calc">Details →</button></div>`;
}

function renderViewer(r) {
  if (r.error) return;
  const v = S.view;
  sxhost.classList.toggle('hide', v !== 'section');
  vhost.classList.toggle('hide', v === 'section');
  if (v === 'section') sxhost.innerHTML = crossSectionSVG(r);
  else viewer.setModel(r, v);
  $('#vtools').innerHTML = v === 'section' ? `<button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`
    : `<button class="iconbtn" data-act="spin" title="Auto-rotate">${ICON.spin}</button><button class="iconbtn" data-act="zin" title="Zoom in">${ICON.zin}</button><button class="iconbtn" data-act="zout" title="Zoom out">${ICON.zout}</button><button class="iconbtn" data-act="home" title="Reset view">${ICON.reset}</button><button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`;
  $('#vhint').textContent = v === 'section' ? 'Drawn from computed dimensions (mm)' : 'Drag to rotate · scroll to zoom';
  if (v !== 'section') viewer.resize();
}

function partsFor(r) {
  const sc = r.scen[S.scenario];
  return PART_META.map(([k, l, col]) => ({ k, l, col, v: sc.parts[k] })).filter((p) => p.k !== 'special' || p.v > 0);
}

function renderRight(r) {
  if (r.error) { $('#sc').innerHTML = ''; $('#landed').innerHTML = ''; return; }
  const sc = r.scen[S.scenario], u = UNITS[S.unit], parts = partsFor(r);
  const a = S.scenario === 's1' ? 's2' : 's1';
  const span = r.high - r.low || 1;
  const pos = (v) => ((v - r.low) / span) * 100;
  $('#sc').innerHTML = `
    <div class="cap"><span>Should-cost</span><div class="seg" id="scen">${[['s1', 'Scenario 1'], ['s2', 'Scenario 2']].map(([k, l]) => `<button data-scen="${k}" class="${S.scenario === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="big num">${money(sc.selling)}<small> /${S.unit}</small></div>
    <div class="qty num">${big(sc.selling * S.qty)} for <input type="number" id="qty" min="0" step="1" value="${S.qty}" aria-label="Quantity in km"> km</div>
    <div class="stack">${parts.map((p) => `<i style="width:${(p.v / sc.selling) * 100}%;background:${p.col}" title="${p.l}"></i>`).join('')}</div>
    <div class="break num">${parts.map((p) => `<div><span><span class="dot" style="background:${p.col}"></span>${p.l}</span><span class="v">${money(p.v)}<em>${pct(p.v / sc.selling)}</em></span></div>`).join('')}</div>
    <div class="range"><div class="cap"><span>Negotiation range</span><span class="pill">Scenario ${S.scenario === 's1' ? 1 : 2} is the ${sc.selling >= r.scen[a].selling ? 'high' : 'low'} end</span></div>
      <div class="track"><i style="left:0;right:0"></i><b class="mk" style="left:${pos(sc.selling)}%"></b></div>
      <div class="ends num"><span><small>Low · Scenario ${r.scen.s1.selling <= r.scen.s2.selling ? 1 : 2}</small>${money(r.low)}</span><span style="text-align:right"><small>High · Scenario ${r.scen.s1.selling <= r.scen.s2.selling ? 2 : 1}</small>${money(r.high)}</span></div>
      <div class="note num" style="padding:8px 0 0">Spread ${money(r.high - r.low)} (${pct((r.high - r.low) / r.low)}) per ${S.unit}</div></div>`;
  const mats = Object.entries(S.master);
  $('#landed').innerHTML = `<div class="hd"><b>Material prices <span style="color:var(--mute);font-weight:500">· Rs/kg</span></b><button class="iconbtn" id="edit-prices" title="Edit prices and densities">${ICON.pencil}</button></div>
    ${mats.map(([m, v]) => `<div class="lp"><b>${m}</b>${S.editPrices
      ? `<div class="ed"><input type="number" class="cell" data-mp="${m}.price" value="${v.price}" step="1" aria-label="${m} price"> Rs/kg</div>`
      : `<div class="price num">${inr(v.price, v.price % 1 ? 1 : 0)}<small>/kg</small></div>`}
      <span class="src">${DEFAULTS.links[m] ? `<a href="${DEFAULTS.links[m]}" target="_blank" rel="noopener">↗ price source</a>` : 'manual price'} · ${v.density} g/cm³</span>${S.editPrices ? `<div class="ed"><input type="number" class="cell" data-mp="${m}.density" value="${v.density}" step="0.01" aria-label="${m} density"> g/cm³</div>` : '<span></span>'}</div>`).join('')}
    <div class="note">${S.editPrices ? 'Edits re-cost every view instantly.' : 'Edit to re-price. Same master as the workbook’s yellow block.'}</div>`;
}

function renderBottom(r) {
  const tabs = `<div class="btabs"><button class="btab ${S.btab === 'anatomy' ? 'on' : ''}" data-btab="anatomy">Cost anatomy</button><button class="btab ${S.btab === 'eng' ? 'on' : ''}" data-btab="eng">${ICON.gauge} Engineering check</button></div>`;
  if (r.error) { $('#bottom').innerHTML = tabs; return; }
  let body = '';
  const sc = r.scen[S.scenario];
  if (S.btab === 'anatomy') {
    const c = S.cfg, W = r.weight;
    const rows = [
      ['Conductor', c.conductor, r.wCond, r.cost.conductor], ['Insulation', c.insulation, r.wIns, r.cost.insulation],
      ['Inner sheath', c.inner, r.wInner, r.cost.inner], ['Outer sheath', c.outer, r.wOuter, r.cost.outer],
      ...(c.armour !== 'Unarmored' ? [['Armour', armourShort(c.armour).replace(' armoured', ''), r.wArmour, r.cost.armour]] : []),
    ];
    let run = 0; const wf = PART_META.filter((m) => m[0] !== 'special' || sc.parts.special > 0).map(([k, l, col]) => { const s = run; run += sc.parts[k]; return { l, col, v: sc.parts[k], s, e: run }; });
    body = `<div class="pad"><div class="h3">Material build-up</div><p class="p">Weights include ${pct(S.T.wastage, 0)} wastage. Rates come from the material master.</p>
      <div class="scroll"><table class="t num"><thead><tr><th>Component</th><th>Material</th><th class="r">Weight kg/km</th><th class="r">Rate ₹/kg</th><th class="r">Cost ${UNITS[S.unit].label}</th><th>Share of material</th></tr></thead><tbody>
      ${rows.map(([n, m, w, cost]) => `<tr><td>${n}</td><td class="mut">${esc(m)}</td><td class="r">${nf(w, 1)}</td><td class="r">${nf(cost / w, 1)}</td><td class="r">${money(cost)}</td><td><div class="bar"><i style="width:${(cost / r.mat) * 100}%"></i></div></td></tr>`).join('')}
      <tr class="total"><td colspan="2">Material cost</td><td class="r">${nf(W, 1)}</td><td class="r">${nf(r.mat / W, 1)}</td><td class="r">${money(r.mat)}</td><td>${pct(1, 0)}</td></tr></tbody></table></div>
      <div class="h3" style="margin-top:22px">From material to selling price <span class="pill" style="margin-left:6px">Scenario ${S.scenario === 's1' ? 1 : 2}</span></div><p class="p">Each step is a share of total cost taken from the cost-structure grid for ${S.cfg.conductor.toLowerCase()}.</p>
      <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l.split(',')[0]}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s / sc.selling) * 100}%;width:${Math.max((s.v / sc.selling) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s ? '+ ' : ''}${money(s.v)}</span></div>`).join('')}
      <div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Selling price</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">${money(sc.selling)}</b></div></div></div>`;
  } else {
    body = `<div class="pad"><div class="banner">${ICON.info}<div><b>Technical validation, not a cost calculation.</b> This will check current rating, voltage drop and heating for the selected build. It never changes the should-cost.</div></div>
      <div class="field-row">${['Load current|A', 'Route length|m', 'System voltage|V', 'Power factor|', 'Installation|', 'Ambient|°C', 'Grouping factor|', 'Voltage drop limit|%'].map((x) => { const [l, u] = x.split('|'); return `<div class="field"><span>${l}</span><div>${u || '–'}</div></div>`; }).join('')}</div>
      <div class="tiles"><div class="tile"><small>Rated capacity</small><b>—</b></div><div class="tile"><small>Capacity used</small><b>—</b></div><div class="tile"><small>Voltage drop</small><b>—</b></div><div class="tile"><small>Verdict</small><b>—</b></div></div>
      <p class="note" style="margin-top:12px"><span class="soonpill">Coming soon</span>&nbsp; Needs conductor resistance and current-rating tables, which are not in the workbook yet. Send them over and this tab will go live.</p></div>`;
  }
  $('#bottom').innerHTML = tabs + body;
}

/* ---------- Batch ---------- */
function renderBatch() {
  const rows = S.batch.map((b, i) => ({ i, b, r: computeCable(b.cfg, S.master, S.T) }));
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Batch comparison</div><div class="note" style="padding:0">One row per configuration, like the workbook. Click a row to open it in Build Up. Prices in ${UNITS[S.unit].label}.</div></div><div class="spacer"></div><button class="btn" id="b-csv">Export CSV</button><button class="btn pri" id="b-add">+ Add current build</button></div>
    <div class="scroll"><table class="t num"><thead><tr><th>Configuration</th><th>Insulation</th><th>Armour</th><th>Special</th><th class="r">OD mm</th><th class="r">Conductor kg/km</th><th class="r">Material</th><th class="r">Selling low</th><th class="r">Selling high</th><th></th></tr></thead><tbody>
    ${rows.map(({ i, b, r }) => r.error ? `<tr><td colspan="10">${esc(r.error)}</td></tr>` : `<tr class="click" data-load="${i}"><td><b>${esc(configLabel(b.cfg))}</b></td><td class="mut">${b.cfg.insulation}</td><td class="mut">${armourShort(b.cfg.armour)}</td><td class="mut">${r.specialPct ? '+' + pct(r.specialPct) : '–'}</td><td class="r">${r.od}</td><td class="r">${nf(r.wCond)}</td><td class="r">${money(r.mat)}</td><td class="r">${money(r.low)}</td><td class="r"><b>${money(r.high)}</b></td><td class="r"><button class="link" data-del="${i}" title="Remove row">✕</button></td></tr>`).join('')}
    </tbody></table></div></div></div>`;
}

/* ---------- Calculations ---------- */
function renderCalc() {
  const r = calc();
  if (r.error) { $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="warn">${esc(r.error)}</div></div></div>`; return; }
  const c = S.cfg, s1 = r.scen.s1, s2 = r.scen.s2;
  const G = (n) => `<div class="grp">${n}</div>`;
  const R = (k, v, ref) => `<div class="k">${k} <span style="color:var(--mute);font-size:11px">${ref ? '· col ' + ref : ''}</span></div><div class="v">${v}</div>`;
  const left = G('Conductor') + R('Included angle (deg)', nf(r.angle, 1), 'AA') + R('Conductor diameter (mm)', nf(r.condDia, 2), 'AB') + R('Conductor density (g/cm³)', r.condDens, 'AC')
    + G('Insulation') + R('Insulation thickness (mm)', r.insThk, 'AD') + R('Insulated core diameter (mm)', nf(r.insDia, 2), 'AE') + R('Insulation density (g/cm³)', r.insDens, 'AF')
    + (c.cores === 3.5 ? G('Neutral core (3½ core only)') + R('Neutral area (sq mm)', r.neutArea, 'AG') + R('Neutral diameter (mm)', nf(r.neutDia, 2), 'AH') + R('Neutral insulation thickness (mm)', r.neutInsThk, 'AI') + R('Neutral core diameter (mm)', nf(r.neutCoreDia, 2), 'AJ') : '')
    + G('Laying-up and sheaths') + R('Laid-up diameter (mm)', nf(r.laidUp, 1), 'AK') + R('Inner sheath thickness (mm)', r.innerThk, 'AL') + R('Diameter over inner sheath (mm)', nf(r.innerDia, 2), 'AM')
    + R('Armour thickness / wire dia (mm)', r.armourThk, 'AO') + R('Diameter over armour (mm)', nf(r.armourDia, 2), 'AP') + R('Outer sheath thickness (mm)', r.outerThk, 'AR') + R('Diameter over outer sheath (mm)', nf(r.outerDia, 2), 'AS') + R('Approx. overall diameter (mm)', r.od, 'AU');
  const right = G('Weights (kg/km, incl. wastage)') + R('Conductor', nf(r.wCond, 1), 'AV') + R('Insulation', nf(r.wIns, 1), 'AW') + R('Inner sheath', nf(r.wInner, 1), 'AX') + R('Outer sheath', nf(r.wOuter, 1), 'AY') + R('Armour', nf(r.wArmour, 1), 'AZ') + R('Total cable weight', nf(r.weight, 1), '')
    + G('Material cost (₹/km)') + R('Conductor', nf(r.cost.conductor), '') + R('Insulation', nf(r.cost.insulation), '') + R('Inner sheath', nf(r.cost.inner), '') + R('Outer sheath', nf(r.cost.outer), '') + R('Armour', nf(r.cost.armour), '') + R('Material cost', nf(r.mat), 'BA')
    + G('Special construction') + R('Combined loading', pct(r.specialPct, 2), 'BB')
    + G('Scenario 1') + R('Load on material (conversion + transport + drum + overheads) ÷ material %', nf(s1.load, 4), 'BC') + R('Total cost (₹/km)', nf(s1.total), 'BE') + R('Selling price (₹/km)', nf(s1.selling), 'BG')
    + G('Scenario 2') + R('Load on material', nf(s2.load, 4), 'BD') + R('Total cost (₹/km)', nf(s2.total), 'BF') + R('Selling price (₹/km)', nf(s2.selling), 'BH');
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad"><div class="h3">Calculation build-up · ${esc(configLabel(c))}</div><p class="p">Every intermediate figure from the workbook's grey working columns for the current Build Up selection.</p>
    <div class="two"><div class="kv">${left}</div><div class="kv">${right}</div></div>
    ${r.warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join('')}
    <div class="note" style="margin-top:14px">Carried over from the workbook: inner and outer sheaths are priced at the PVC rate whichever material is named; only the insulation takes the XLPE / PVC split.</div></div></div></div>`;
}

/* ---------- Master data ---------- */
function ni(path, val, step = 'any', scale = 1) {
  return `<input class="cell" type="number" step="${step}" data-p="${path}" data-scale="${scale}" value="${+(val * scale).toFixed(6)}">`;
}
function renderMaster() {
  const T = S.T, cs = T.costStructure;
  const csTable = (id, name) => `<div class="card pad"><div class="h3">${name}</div><table class="t num"><thead><tr><th>Cost element</th><th class="r">Copper</th><th class="r">Aluminium</th></tr></thead><tbody>
    ${Object.keys(cs[id]).map((k) => `<tr><td>${{ material: 'Material cost', conversion: 'Conversion & other', transport: 'Transportation', drum: 'Drum cost', overheads: 'Overheads / insurance / finance', margin: 'Margin (on cable cost)' }[k]}</td>
    <td class="r">${ni(`T.costStructure.${id}.${k}.Copper`, cs[id][k].Copper, 0.5, 100)}%</td><td class="r">${ni(`T.costStructure.${id}.${k}.Aluminium`, cs[id][k].Aluminium, 0.5, 100)}%</td></tr>`).join('')}</tbody></table></div>`;
  const tbl = (cols, head, p) => `<div class="scroll"><table class="t num"><thead><tr>${head.map((h) => `<th class="r">${h}</th>`).join('')}</tr></thead><tbody>${cols[0].map((_, i) => `<tr>${cols.map((col, j) => `<td class="r">${j === 0 && p[0] === 'area' ? col[i] : col[i] === undefined || col[i] === null ? '' : ni(`${p[j]}.${i}`, col[i], 'any')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  $('#page').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">
    <div class="card pad wide" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Master data</div><div class="note" style="padding:0">Every yellow cell in the workbook, editable here. Changes apply to all tabs and are kept in this browser.</div></div><div class="spacer"></div><button class="btn" id="reset-master">Reset to workbook values</button></div>
    <div class="card pad"><div class="h3">Material master</div><table class="t num"><thead><tr><th>Material</th><th class="r">Density g/cm³</th><th class="r">Price Rs/kg</th></tr></thead><tbody>${Object.entries(S.master).map(([m, v]) => `<tr><td>${m}</td><td class="r">${ni(`master.${m}.density`, v.density, 0.01)}</td><td class="r">${ni(`master.${m}.price`, v.price, 1)}</td></tr>`).join('')}</tbody></table>
      <div class="h3" style="margin-top:18px">Wastage</div><table class="t num"><tbody><tr><td>All materials</td><td class="r">${ni('T.wastage', T.wastage, 0.5, 100)}%</td></tr></tbody></table></div>
    ${csTable('s1', 'Cost structure · Scenario 1 (higher)')}${csTable('s2', 'Cost structure · Scenario 2 (leaner)')}
    <div class="card pad"><div class="h3">Special construction loadings</div><table class="t num"><tbody>${T.special.map((o, i) => `<tr><td>${esc(o.label)}</td><td class="r">${ni(`T.special.${i}.loading`, o.loading, 0.5, 100)}%</td></tr>`).join('')}</tbody></table></div>
    <div class="card pad"><div class="h3">Insulation thickness · IS table</div>${tbl([T.insul.area, T.insul.oneCoreArmd, T.insul.multi], ['Area mm²', '1-core unarmoured', 'Multi / armoured'], ['area', 'T.insul.oneCoreArmd', 'T.insul.multi'])}</div>
    <div class="card pad"><div class="h3">Inner sheath · by laid-up dia</div>${tbl([T.inner.lb, T.inner.thk], ['Dia ≥ mm', 'Thickness mm'], ['T.inner.lb', 'T.inner.thk'])}
      <div class="h3" style="margin-top:18px">Armour · by dia over inner sheath</div>${tbl([T.armour.lb, T.armour.strip, T.armour.round], ['Dia ≥ mm', 'Strip mm', 'Round dia mm'], ['T.armour.lb', 'T.armour.strip', 'T.armour.round'])}</div>
    <div class="card pad"><div class="h3">Outer sheath · by dia over armour</div>${tbl([T.outer.lb, T.outer.unarmd, T.outer.armd], ['Dia ≥ mm', 'Unarmoured mm', 'Armoured (min) mm'], ['T.outer.lb', 'T.outer.unarmd', 'T.outer.armd'])}
      <div class="h3" style="margin-top:18px">Neutral size for 3½ core</div>${tbl([T.neutral.phase, T.neutral.neutral], ['Phase mm²', 'Neutral mm²'], ['T.neutral.phase', 'T.neutral.neutral'])}</div>
  </div>`;
}

/* ---------- routing / events ---------- */
function show(tab) {
  S.tab = tab; syncChrome();
  if (tab !== 'build') { viewer?.pause(); }
  ({ build: buildPage, batch: renderBatch, calc: renderCalc, master: renderMaster })[tab]();
}
const refresh = () => { persist(); if (S.tab === 'build') renderBuild(); else show(S.tab); syncChrome(); };

const setPath = (path, v) => {
  const t = path.split('.'); let o = t[0] === 'master' ? S.master : S.T;
  for (let i = 1; i < t.length - 1; i++) o = o[t[i]];
  o[t[t.length - 1]] = v;
};

function onClick(e) {
  const t = e.target.closest('button, [data-sp], tr[data-load]'); if (!t) return;
  const d = t.dataset, c = S.cfg;
  if (d.tab) return show(d.tab);
  if (d.unit) { S.unit = d.unit; return refresh(); }
  if (d.cond) { c.conductor = d.cond; return refresh(); }
  if (d.cores) { c.cores = +d.cores; return refresh(); }
  if (d.armour) { c.armour = d.armour; return refresh(); }
  if (d.ins) { c.insulation = d.ins; return refresh(); }
  if (d.shape) { c.shape = d.shape; return refresh(); }
  if (d.inner) { c.inner = d.inner; return refresh(); }
  if (d.outer) { c.outer = d.outer; return refresh(); }
  if (d.sp) { c.special[d.sp] = !c.special[d.sp]; return refresh(); }
  if (t.id === 'more') { S.more = !S.more; return renderLeft(); }
  if (d.view) { S.view = d.view; persist(); return renderBuild(true); }
  if (d.scen) { S.scenario = d.scen; return refresh(); }
  if (d.btab) { S.btab = d.btab; return renderBuild(true); }
  if (t.id === 'edit-prices') { S.editPrices = !S.editPrices; return renderBuild(true); }
  if (d.act) {
    if (d.act === 'full') { const vw = $('#vw'); return document.fullscreenElement ? document.exitFullscreen() : vw.requestFullscreen?.(); }
    if (d.act === 'spin') return viewer.toggleSpin();
    if (d.act === 'zin') return viewer.zoom(0.82);
    if (d.act === 'zout') return viewer.zoom(1.22);
    if (d.act === 'home') return viewer.resetView();
  }
  if (t.id === 'b-add') { S.batch.push({ cfg: clone(S.cfg) }); return refresh(); }
  if (d.del !== undefined) { e.stopPropagation(); S.batch.splice(+d.del, 1); return refresh(); }
  if (d.load !== undefined) { S.cfg = clone(S.batch[+d.load].cfg); S.cfg.special ||= {}; return show('build'); }
  if (t.id === 'b-csv') {
    const rows = [['Configuration', 'Insulation', 'Armour', 'Special %', 'OD mm', 'Conductor kg/km', 'Material Rs/km', 'Selling low Rs/km', 'Selling high Rs/km']];
    S.batch.forEach((b) => { const r = computeCable(b.cfg, S.master, S.T); if (!r.error) rows.push([configLabel(b.cfg), b.cfg.insulation, armourShort(b.cfg.armour), (r.specialPct * 100).toFixed(1), r.od, r.wCond.toFixed(1), r.mat.toFixed(0), r.low.toFixed(0), r.high.toFixed(0)]); });
    const a = document.createElement('a'); a.download = 'cable-batch.csv'; a.href = URL.createObjectURL(new Blob([rows.map((x) => x.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.click(); return;
  }
  if (t.id === 'reset-master') { const keep = { cfg: S.cfg, batch: S.batch }; S.master = clone(DEFAULTS.master); S.T = clone(DEFAULTS); Object.assign(S, keep); return refresh(); }
  if (t.id === 'reset-all') { S = defaultState(); try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ } return show('build'); }
}

root.addEventListener('click', onClick);
root.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'size') { S.cfg.size = SIZES[+t.value]; $('#size-val').firstChild.textContent = S.cfg.size; persist(); renderBuild(true); }
  if (t.id === 'qty') { S.qty = Math.max(0, +t.value || 0); persist(); const r = calc(); if (!r.error) { const q = $('#sc .qty'); if (q) q.firstChild.textContent = big(r.scen[S.scenario].selling * S.qty) + ' for '; } }
});
root.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.p) { const v = parseFloat(t.value); if (!Number.isNaN(v)) { setPath(t.dataset.p, v / (+t.dataset.scale || 1)); refresh(); } }
  if (t.dataset.mp) { const [m, k] = t.dataset.mp.split('.'); const v = parseFloat(t.value); if (!Number.isNaN(v)) { S.master[m][k] = v; persist(); renderBuild(true); } }
});

shell(); syncChrome();
show(S.tab);
window.__scm = { get state() { return S; }, calc };
