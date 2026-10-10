// Generic dashboard UI for manufactured-equipment models (AHU & FCU, chillers, ducting): Build Up, Batch, Calculations, Master Data.
// A model plugs in through `def` (see the three defs in src/ahu, src/chiller, src/duct).
import { spark } from '../prices.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setPath = (o, p, v) => { const t = p.split('.'); for (let i = 0; i < t.length - 1; i++) { o[t[i]] ??= {}; o = o[t[i]]; } o[t[t.length - 1]] = v; };

export function createMfgUI(ctx, def) {
  const { $, esc, nf, inr, pct, big, ICON, persist, vhost, sxhost } = ctx;
  const st = () => ctx.state().mf;
  const grp = () => def.group(st());
  let cache = null;
  const results = () => (cache ||= def.compute(st()));
  const cur = () => results()[grp().sel] || { error: 'No item selected' };
  const invalidate = () => { cache = null; };
  const cfg = () => grp().list[grp().sel];

  const attr = (v) => esc(JSON.stringify(v));
  const h = {
    esc, nf, inr, pct,
    seg: (items, curv, path) => `<div class="seg block">${items.map(([v, l]) => `<button class="${String(curv) === String(v) ? 'on' : ''}" data-mset="${path}" data-mv="${attr(v)}">${l}</button>`).join('')}</div>`,
    chips: (items, curv, path) => `<div class="chips">${items.map(([v, l]) => `<button class="chip ${String(curv) === String(v) ? 'on' : ''}" data-mset="${path}" data-mv="${attr(v)}">${l}</button>`).join('')}</div>`,
    sel: (items, curv, path) => `<select class="select" data-mf="${path}" ${items.every(([v]) => typeof v === 'number') ? 'data-num="1"' : ''} aria-label="${path}">${items.map(([v, l]) => `<option value="${esc(v)}" ${String(curv) === String(v) ? 'selected' : ''}>${l}</option>`).join('')}</select>`,
    num: (label, path, value, step, unit) => `<div class="label">${label}${unit ? ` <small>${unit}</small>` : ''}</div><input class="cell fw" type="number" step="${step}" data-mf="${path}" data-num="1" value="${value ?? ''}" aria-label="${label}">`,
    slider: (label, path, value, min, max, step, unit, fmt = (v) => nf(v)) => `<div class="label">${label} <small>${unit || ''}</small></div><div class="sl"><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-mf="${path}" data-num="1" data-live="1" aria-label="${label}"><output class="num">${fmt(value)}</output></div>`,
    tag: (value) => `<div class="label">Tag / label</div><input class="cell fw" type="text" data-mf="tag" value="${esc(value ?? '')}" aria-label="Tag">`,
    th: (cols) => `<thead><tr>${cols.map(([l, r]) => `<th${r ? ' class="r"' : ''}>${l}</th>`).join('')}</tr></thead>`,
  };

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
    invalidate();
    if (!skipLeft) $('#left').innerHTML = def.left(st(), cur(), h);
    const r = cur();
    if (r.error) { $('#hero-head').innerHTML = `<div class="warn">${esc(r.error)}</div>`; $('#metrics').innerHTML = ''; $('#sc').innerHTML = ''; $('#bottom').innerHTML = ''; return; }
    hero(r); right(r); bottom(r); viewer(r);
  }

  const U = () => def.units[grp().unit] || Object.values(def.units)[0];
  const money = (v, r) => inr(U().fn(v, r), U().dec ?? 0);
  const unitKey = () => Object.keys(def.units).find((k) => def.units[k] === U());

  function hero(r) {
    const v = grp().view || def.views[0][0];
    $('#hero-head').innerHTML = `<div class="hero-h"><div><h1>${esc(def.title(r, st()))}</h1><div class="meta">${esc(def.meta(r, st()))}</div></div><div class="spacer"></div>
      <div class="seg">${def.views.map(([k, l]) => `<button data-mview="${k}" class="${v === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
    $('#metrics').innerHTML = def.metrics(r, st()).map(([k, val]) => `<div class="metric"><small>${k}</small><b class="num">${val}</b></div>`).join('') + `<div class="metric"><button class="link" data-tab="calc">Details →</button></div>`;
  }

  function viewer(r) {
    const v = grp().view || def.views[0][0], V = ctx.viewer(), flat = v === 'section';
    sxhost.classList.toggle('hide', !flat); vhost.classList.toggle('hide', flat);
    if (flat) sxhost.innerHTML = def.section(r, st());
    else { const s = def.scene(r, v, st()); V.showGroup(s.group, s.preset || 'iso'); }
    $('#vtools').innerHTML = flat ? `<button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`
      : `<button class="iconbtn" data-act="spin" title="Auto-rotate">${ICON.spin}</button><button class="iconbtn" data-act="zin" title="Zoom in">${ICON.zin}</button><button class="iconbtn" data-act="zout" title="Zoom out">${ICON.zout}</button><button class="iconbtn" data-act="home" title="Reset view">${ICON.reset}</button><button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`;
    $('#vhint').textContent = flat ? def.sectionHint : 'Drag to rotate · scroll to zoom';
    if (!flat) V.resize();
  }

  function right(r) {
    const g = grp(), parts = r.parts.filter((p) => p.v > 0), tot = r.total;
    $('#sc').innerHTML = `
      <div class="cap"><span>Should-cost</span><span class="pill">${esc(def.pillOf ? def.pillOf(r, st()) : '')}</span></div>
      <div class="big num">${money(tot, r)}<small> ${U().label.replace('₹', '')}</small></div>
      <div class="qty num">${big(def.qtyTotal ? def.qtyTotal(r, g.qty) : tot * g.qty)} for <input type="number" id="mqty" min="0" step="1" value="${g.qty}" aria-label="Quantity"> ${def.qtyLabel}</div>
      <div class="stack">${parts.map((p) => `<i style="width:${(p.v / tot) * 100}%;background:${p.col}" title="${esc(p.l)}"></i>`).join('')}</div>
      <div class="break num">${parts.map((p) => `<div><span><span class="dot" style="background:${p.col}"></span>${esc(p.l)}</span><span class="v">${money(p.v, r)}<em>${pct(p.v / tot)}</em></span></div>`).join('')}</div>
      <div class="range"><div class="cap"><span>Same item, other units</span></div>
        ${Object.entries(def.units).map(([k, u]) => `<div class="lp"><b>${u.label}</b><div class="price num">${inr(u.fn(tot, r), u.dec ?? 0)}</div></div>`).join('')}</div>`;
    const rates = def.rates(st()), edit = !!g.editPrices;
    const row = (x) => `<div class="lp"><b>${esc(x.label)}${x.cid ? spark(x.cid, ctx.binder.mode) : ''}</b>${edit ? `<div class="ed"><input type="number" class="cell" data-mt="${x.path}" ${x.price ? 'data-price="1"' : ''} value="${x.value}" step="${x.step ?? 1}" aria-label="${esc(x.label)}"> ${x.unit}</div>` : `<div class="price num">${nf(x.value, x.value % 1 ? 1 : 0)}<small> ${x.unit}</small></div>`}</div>`;
    $('#landed').innerHTML = `<div class="hd"><b>${esc(def.ratesTitle)}</b><button class="iconbtn" id="medit" title="Edit rates">${ICON.pencil}</button></div>${rates.map(row).join('')}
      <div class="note">${ctx.binder.isMonth() ? `Commodity rates from ${ctx.binder.label} in the common price file. Editing one switches to manual.` : edit ? 'Edits re-cost every view instantly.' : esc(def.ratesNote)}</div>`;
  }

  function bottom(r) {
    const t = grp().btab && def.bottom.some(([k]) => k === grp().btab) ? grp().btab : def.bottom[0][0];
    const tabs = `<div class="btabs">${def.bottom.map(([k, l]) => `<button class="btab ${t === k ? 'on' : ''}" data-mbtab="${k}">${l}</button>`).join('')}</div>`;
    const body = def.bottom.find(([k]) => k === t)[2](r, st(), h);
    $('#bottom').innerHTML = tabs + `<div class="pad">${body}</div>`;
  }

  /* ---------- Batch ---------- */
  function batchPage() {
    const g = grp(), res = results(), canAdd = g.list.length < (def.maxRows?.(st()) ?? 30);
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div><div class="h3" style="margin:0">${esc(def.batchTitle(st()))}</div><div class="note" style="padding:0">Click a row to open it in Build Up. Prices in ${U().label}. Changes are kept in this browser.</div></div><div class="spacer"></div>
      ${def.batchExtra ? def.batchExtra(st(), h) : ''}<button class="btn" id="madd" ${canAdd ? '' : 'disabled'}>Duplicate selected</button><button class="btn" id="mdel" ${g.list.length > 1 ? '' : 'disabled'}>Delete selected</button></div>
      <div class="scroll"><table class="t num"><thead><tr><th>Tag</th>${def.batchCols.map(([l, , r]) => `<th class="${r ? 'r' : ''}">${l}</th>`).join('')}<th class="r">Total ₹</th><th class="r">${U().label}</th></tr></thead><tbody>
      ${g.list.map((c, i) => { const r = res[i]; return `<tr class="click ${i === g.sel ? 'sel' : ''}" data-mload="${i}"><td>${esc(c.tag || '–')}</td>${def.batchCols.map(([, fn, rr]) => `<td class="${rr ? 'r' : ''}">${r.error ? '–' : fn(c, r)}</td>`).join('')}<td class="r">${r.error ? esc(r.error) : inr(r.total)}</td><td class="r"><b>${r.error ? '–' : money(r.total, r)}</b></td></tr>`; }).join('')}
      ${def.batchFoot ? def.batchFoot(st(), res) : ''}</tbody></table></div></div></div>`;
  }

  /* ---------- Calculations ---------- */
  function calcPage() {
    const r = cur();
    if (r.error) { $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="warn">${esc(r.error)}</div></div></div>`; return; }
    const cols = def.calcRows(r, st()); // [[column title, [[label, value] | ['#', group heading]]]]
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad"><div class="h3">Calculation build-up · ${esc(def.title(r, st()))}</div><p class="p">${esc(def.calcNote)}</p>
      <div class="two">${cols.map((c) => `<div class="kv">${c.map(([k, v]) => (k === '#' ? `<div class="grp">${v}</div>` : `<div class="k">${k}</div><div class="v">${v}</div>`)).join('')}</div>`).join('')}</div></div></div></div>`;
  }

  /* ---------- Master data ---------- */
  const ni = (path, val, step = 'any', scale = 1, kind = 'mt') => `<input class="cell" type="${typeof val === 'string' ? 'text' : 'number'}" step="${step}" data-${kind}="${path}" data-scale="${scale}" ${typeof val === 'string' ? 'data-text="1"' : ''} value="${typeof val === 'string' ? esc(val) : +(val * scale).toFixed(6)}">`;
  function masterPage() {
    const secs = def.master(st());
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(360px,1fr))">
      <div class="card pad wide" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Master data · ${esc(def.name)}</div><div class="note" style="padding:0">${esc(def.masterNote)}</div></div><div class="spacer"></div><button class="btn" id="mreset">${esc(def.resetLabel)}</button></div>
      ${secs.map((s) => `<div class="card pad ${s.wide ? 'wide' : ''}"><div class="h3">${esc(s.title)}</div>${s.note ? `<p class="p">${esc(s.note)}</p>` : ''}<table class="t num"><tbody>${s.rows.map(([l, path, v, step, scale, un, note]) => `<tr><td>${esc(l)}${note ? `<br><span class="mut">${esc(note)}</span>` : ''}</td><td class="r">${ni(path, v, step, scale || 1)} <span class="mut">${esc(un || '')}</span></td></tr>`).join('')}</tbody></table></div>`).join('')}</div>`;
  }

  /* ---------- events ---------- */
  const coerce = (v) => v;
  function onClick(e, t) {
    const d = t.dataset, g = grp();
    if (d.mset) { const v = JSON.parse(d.mv); if (d.mset.startsWith('$')) setPath(st(), d.mset.slice(1), v); else setPath(cfg(), d.mset, v); def.afterEdit?.(st(), d.mset); return 'refresh'; }
    if (d.mview) { g.view = d.mview; persist(); render(true); return 'done'; }
    if (d.mbtab) { g.btab = d.mbtab; render(true); return 'done'; }
    if (d.unit) { g.unit = d.unit; return 'refresh'; }
    if (d.mload !== undefined) { g.sel = +d.mload; return 'build'; }
    if (t.id === 'madd') { const c = clone(cfg()); c.tag = (c.tag || 'Item') + ' copy'; g.list.push(c); g.sel = g.list.length - 1; return 'refresh'; }
    if (t.id === 'mdel') { g.list.splice(g.sel, 1); g.sel = Math.max(0, g.sel - 1); return 'refresh'; }
    if (t.id === 'medit') { g.editPrices = !g.editPrices; render(true); return 'done'; }
    if (t.id === 'mreset') { def.reset(st()); return 'refresh'; }
    return def.onClick?.(e, t, st(), render) ?? null;
  }
  let raf = 0;
  function onInput(e) {
    const t = e.target;
    if (t.id === 'mqty') { grp().qty = Math.max(0, +t.value || 0); persist(); const r = cur(); const q = $('#sc .qty'); if (q && !r.error) q.firstChild.textContent = big(def.qtyTotal ? def.qtyTotal(r, grp().qty) : r.total * grp().qty) + ' for '; return true; }
    if (t.dataset.live) { // sliders: update live without rebuilding the left panel
      setPath(cfg(), t.dataset.mf, +t.value); const o = t.parentElement.querySelector('output'); if (o) o.textContent = nf(+t.value);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { persist(); render(true); }); return true;
    }
    return false;
  }
  function onChange(e) {
    const t = e.target, d = t.dataset;
    if (d.mf) {
      const v = d.num ? parseFloat(t.value) : t.value;
      if (d.num && Number.isNaN(v)) return 'refresh';
      if (d.mf.startsWith('$')) setPath(st(), d.mf.slice(1), v); else setPath(cfg(), d.mf, v);
      def.afterEdit?.(st(), d.mf); return 'refresh';
    }
    if (d.mt) {
      const v = d.text ? t.value : parseFloat(t.value); if (!d.text && Number.isNaN(v)) return 'done';
      if (d.price || def.isPricePath?.(d.mt)) ctx.priceEdited?.();
      setPath(st().T, d.mt, d.text ? v : v / (+d.scale || 1)); return 'refresh';
    }
    return null;
  }
  const pages = { build: page, batch: batchPage, calc: calcPage, master: masterPage };
  return { renderPage: (tab) => { invalidate(); return pages[tab](); }, render, onClick, onInput, onChange, tabs: def.tabs || [['build', 'Build Up'], ['batch', 'Batch'], ['calc', 'Calculations'], ['master', 'Master Data']],
    get units() { return Object.fromEntries(Object.entries(def.units).map(([k, u]) => [k, u.label])); }, getUnit: () => unitKey() };
}
export { clone };
