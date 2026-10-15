// Project estimate builder: lines priced from the category models (or typed by hand), rolled up by group, with an EPC layer on top
// and an optional previous estimate or quote per line for the optimisation potential.
import { CATS, GROUPS, priceLine } from './catalog.js';
const clone = (o) => JSON.parse(JSON.stringify(o));
const L = (cat, preset, qty, o = {}) => ({ cat, preset, qty, factor: 1, drivers: {}, prev: null, group: null, ...o });
export function estDefault() {
  return { project: { name: 'Project estimate', mw: 1320, basis: '2 × 660 MW thermal power plant, illustrative' }, l1: { eng: 0.02, freight: 0.02, oh: 0.05, profit: 0.10, cont: 0 }, unit: 'cr', tab: 'build',
    lines: [L('static', 0, 2, { drivers: { area: 50212 } }), L('static', 1, 8), L('static', 2, 16), L('static', 3, 2), L('pump', 2, 6, { drivers: { flow: 14000, head: 25 } }), L('ctower', 3, 2, { drivers: { kw: 1000000, range: 10 } }), L('pump', 7, 2), L('pump', 8, 2), L('pump', 9, 2),
      L('swgr', 0, 4), L('swgr', 3, 20), L('cable', 1, 190000), L('mh', 1, 1), L('mherec', 1, 1), { cat: 'manual', name: 'Civil and structural works (placeholder: replace with your BOQ-based estimate)', unit: 'lot', qty: 1, rate: 4500000000, group: 'Civil & structural', factor: 1, drivers: {}, prev: null }] };
}
export function evaluate(est) {
  const rows = est.lines.map((l, i) => { const p = priceLine(l), unit = l.cat === 'manual' ? l.unit : CATS[l.cat]?.unit, group = l.group || (l.cat === 'manual' ? 'Other' : CATS[l.cat]?.group) || 'Other'; const amount = p.error ? 0 : p.price * (l.qty || 0); return { i, l, price: p.price, error: p.error, amount, unit, group }; });
  const groups = {}; GROUPS.forEach((g) => { groups[g] = 0; }); rows.forEach((r) => { groups[r.group] = (groups[r.group] || 0) + r.amount; });
  const direct = rows.reduce((s, r) => s + r.amount, 0), l1 = est.l1, items = [['Engineering', direct * l1.eng], ['Freight and insurance', direct * l1.freight], ['Project overheads', direct * l1.oh], ['Contingency', direct * l1.cont]];
  const sub = direct + items.reduce((s, x) => s + x[1], 0), profit = sub * l1.profit, total = sub + profit;
  const withPrev = rows.filter((r) => r.l.prev > 0), prev = withPrev.reduce((s, r) => s + r.l.prev * 1e7, 0), cur = withPrev.reduce((s, r) => s + r.amount, 0);
  return { rows, groups, direct, items: [...items, ['Profit', profit]], total, perMw: est.project.mw > 0 ? total / 1e7 / est.project.mw : 0, prev, cur, potential: prev - cur };
}
export function createEstimateUI(ctx) {
  const { $, esc, nf, inr } = ctx, st = () => ctx.state().est;
  const U = () => (st().unit === 'lakh' ? { l: '₹ lakh', f: 1e5, d: 1 } : { l: '₹ Cr', f: 1e7, d: 2 }), m = (v) => nf(v / U().f, U().d);
  const num = (path, v, step = 'any', w = 84) => `<input class="cell" style="width:${w}px;text-align:right" type="number" step="${step}" data-el="${path}" value="${v ?? ''}">`;
  const sel = (path, items, cur, w) => `<select class="select" style="${w ? `width:${w}px` : ''}" data-el="${path}">${items.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;

  function build() {
    const e = st(), ev = evaluate(e), g = (k, v) => `<label class="sfield"><span>${k}</span>${v}</label>`;
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr">
      <div class="card pad"><div class="est-head"><div><div class="h3" style="margin:0">${esc(e.project.name)}</div><div class="note" style="padding:0">${esc(e.project.basis)}</div></div><div class="spacer"></div>
        <div class="kpis"><div><small>Direct</small><b class="num">${m(ev.direct)}</b></div><div><small>EPC layer</small><b class="num">${m(ev.total - ev.direct)}</b></div><div class="big"><small>Total ${U().l}</small><b class="num">${m(ev.total)}</b></div><div><small>₹ Cr per MW</small><b class="num">${nf(ev.perMw, 3)}</b></div>${ev.prev ? `<div><small>vs previous</small><b class="num ${ev.potential >= 0 ? 'pos' : 'neg'}">${ev.potential >= 0 ? '−' : '+'}${m(Math.abs(ev.potential))}</b></div>` : ''}</div></div>
        <div class="sfield-row" style="margin-top:12px">${g('Project name', `<input class="cell" style="width:200px;text-align:left" type="text" data-el="project.name" value="${esc(e.project.name)}">`)}${g('Plant capacity (MW)', num('project.mw', e.project.mw, 10, 90))}${g('Engineering %', num('l1.eng', +(e.l1.eng * 100).toFixed(2), 0.1, 70))}${g('Freight %', num('l1.freight', +(e.l1.freight * 100).toFixed(2), 0.1, 70))}${g('Overheads %', num('l1.oh', +(e.l1.oh * 100).toFixed(2), 0.1, 70))}${g('Contingency %', num('l1.cont', +(e.l1.cont * 100).toFixed(2), 0.1, 70))}${g('Profit %', num('l1.profit', +(e.l1.profit * 100).toFixed(2), 0.1, 70))}</div></div>
      <div class="card"><div class="pad" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><div class="h3" style="margin:0">Estimate lines</div><div class="spacer"></div><button class="btn pri" data-eladd="1">+ Add model line</button><button class="btn" data-eladdm="1">+ Add manual line</button></div>
        <div class="scroll"><table class="t num est"><thead><tr><th>#</th><th>Category</th><th>Item</th><th>Size drivers</th><th class="r">Qty</th><th>Unit</th><th class="r" title="Cost-migration factor on the model price">Factor</th><th class="r">Unit price ₹</th><th class="r">Amount ${U().l}</th><th class="r" title="Previous estimate or quote for the whole line">Previous ${U().l}</th><th class="r">Gap</th><th></th></tr></thead><tbody>${GROUPS.map((gr) => rowsOf(ev, gr)).join('')}
        <tr class="total"><td colspan="8">Direct cost</td><td class="r">${m(ev.direct)}</td><td colspan="3"></td></tr></tbody></table></div>
        <p class="note" style="padding:8px 16px">Model lines are priced by the category models from a preset item; change the size drivers to re-solve that model, or use the factor to migrate a price from the preset to your specification (for example ×1.25 for a larger machine). Manual lines take a unit price you type.</p></div></div>`;
  }
  function rowsOf(ev, gr) {
    const rs = ev.rows.filter((r) => r.group === gr); if (!rs.length) return '';
    const tot = rs.reduce((s, r) => s + r.amount, 0);
    return `<tr><td colspan="12" class="grp2"><b>${gr}</b> ${m(tot)} ${U().l}</td></tr>` + rs.map((r) => {
      const l = r.l, man = l.cat === 'manual', cat = CATS[l.cat], gap = l.prev > 0 ? l.prev * 1e7 - r.amount : null;
      const drv = !man && cat ? cat.drivers(cat.list[Math.min(l.preset ?? 0, cat.list.length - 1)]).map((d) => `<label class="drv"><span>${d.label}</span>${num(`drivers.${d.k}`, l.drivers?.[d.k] ?? cat.list[Math.min(l.preset ?? 0, cat.list.length - 1)][d.k], d.step, 78)}</label>`).join('') : '';
      return `<tr data-i="${r.i}"><td>${r.i + 1}</td><td>${man ? `<input class="cell" style="width:170px;text-align:left" type="text" data-el="name" data-i="${r.i}" value="${esc(l.name)}">` : sel('cat', [...Object.entries(CATS).map(([k, c]) => [k, c.label])], l.cat, 200).replace('data-el', `data-i="${r.i}" data-el`)}</td>
        <td>${man ? sel('group', GROUPS.map((x) => [x, x]), l.group, 150).replace('data-el', `data-i="${r.i}" data-el`) : sel('preset', cat.list.map((x, i) => [i, x.tag]), l.preset ?? 0, 230).replace('data-el', `data-i="${r.i}" data-el`)}</td>
        <td>${drv.replace(/data-el=/g, `data-i="${r.i}" data-el=`)}</td><td class="r">${num('qty', l.qty, 'any', 80).replace('data-el', `data-i="${r.i}" data-el`)}</td><td>${man ? `<input class="cell" style="width:50px" type="text" data-i="${r.i}" data-el="unit" value="${esc(l.unit)}">` : r.unit}</td>
        <td class="r">${man ? '' : num('factor', l.factor ?? 1, 0.01, 58).replace('data-el', `data-i="${r.i}" data-el`)}</td><td class="r">${man ? num('rate', l.rate, 'any', 120).replace('data-el', `data-i="${r.i}" data-el`) : r.error ? `<span class="warn">${esc(r.error)}</span>` : nf(r.price, r.price < 1000 ? 2 : 0)}</td>
        <td class="r"><b>${m(r.amount)}</b></td><td class="r">${num('prev', l.prev ?? '', 'any', 78).replace('data-el', `data-i="${r.i}" data-el`)}</td><td class="r ${gap == null ? '' : gap >= 0 ? 'pos' : 'neg'}">${gap == null ? '' : `${gap >= 0 ? '−' : '+'}${m(Math.abs(gap))}`}</td><td><button class="iconbtn" data-eldel="${r.i}" title="Remove">✕</button></td></tr>`;
    }).join('');
  }
  function summary() {
    const e = st(), ev = evaluate(e), W = 640, bars = GROUPS.map((g) => [g, ev.groups[g] || 0]).filter((x) => x[1] > 0), mx = Math.max(1, ...bars.map((b) => b[1])), PAL = ['#c27a2c', '#2563eb', '#0ea5a4', '#8b5cf6', '#e8b923', '#06b6d4', '#94a3b8'];
    const gb = bars.map(([g, v], i) => `<div class="gb"><span>${g}</span><div class="bar"><i style="width:${v / mx * 100}%;background:${PAL[GROUPS.indexOf(g) % PAL.length]}"></i></div><b class="num">${m(v)}</b><em>${(v / ev.direct * 100).toFixed(0)}%</em></div>`).join('');
    const steps = [['Direct cost', ev.direct], ...ev.items], run = [0]; steps.forEach((s, i) => run.push(run[i] + s[1]));
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(420px,1fr))">
      <div class="card pad"><div class="h3">Direct cost by group</div>${gb || '<p class="p">No priced lines.</p>'}<p class="note" style="padding:6px 0">Group shares are of the direct cost. The deck’s reference split for a coal handling plant: main equipment 39%, conveyor system 34%, utilities 11% of direct.</p></div>
      <div class="card pad"><div class="h3">From direct cost to project total</div><div class="wf num">${steps.map(([l, v], i) => `<div class="wf-row"><span>${l}</span><div class="wf-track"><div class="wf-seg" style="left:${(run[i] / ev.total) * 100}%;width:${Math.max((v / ev.total) * 100, 0.4)}%;background:#2563eb"></div></div><span style="text-align:right">${i ? '+ ' : ''}${m(v)}</span></div>`).join('')}<div class="wf-row"><span><b>Project total</b></span><div></div><span style="text-align:right"><b>${m(ev.total)} ${U().l}</b></span></div></div>
        <p class="note" style="padding:8px 0 0">${nf(ev.perMw, 3)} ₹ Cr per MW on ${nf(e.project.mw)} MW. Engineering, freight, overheads, contingency and profit are charged on the direct cost at the EPC level, on top of the supplier margins already inside each model.</p></div>
      <div class="card pad" style="grid-column:1/-1"><div class="h3">Optimisation potential against a previous estimate or quote</div>${ev.prev ? `<p class="p">For the lines with a previous figure, the should-cost is <b>${m(ev.cur)}</b> against <b>${m(ev.prev)}</b> ${U().l}: a potential of <b class="${ev.potential >= 0 ? 'pos' : 'neg'}">${m(Math.abs(ev.potential))} ${U().l} (${(Math.abs(ev.potential) / ev.prev * 100).toFixed(1)}%)</b> ${ev.potential >= 0 ? 'below' : 'above'} it.</p>
        <div class="scroll"><table class="t num"><thead><tr><th>Line</th><th class="r">Previous ${U().l}</th><th class="r">Should-cost ${U().l}</th><th class="r">Potential</th><th class="r">%</th></tr></thead><tbody>${ev.rows.filter((r) => r.l.prev > 0).map((r) => { const p = r.l.prev * 1e7, d = p - r.amount; return `<tr><td>${esc(r.l.cat === 'manual' ? r.l.name : `${CATS[r.l.cat].label}: ${CATS[r.l.cat].list[r.l.preset ?? 0].tag}`)}</td><td class="r">${m(p)}</td><td class="r">${m(r.amount)}</td><td class="r ${d >= 0 ? 'pos' : 'neg'}">${d >= 0 ? '' : '−'}${m(Math.abs(d))}</td><td class="r">${(d / p * 100).toFixed(1)}%</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="p">Enter a previous estimate or a quote against a line (the “Previous” column) to see the gap and the potential, line by line and in total.</p>'}</div></div>`;
  }
  function catalogue() {
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="h3">Categories you can price</div><p class="p">Each category is one of the cost models on this platform. A line picks a preset item; its size drivers re-solve the model. Categories not in the list (transformers, structural steel, DG sets, HVAC ducting, pipes in metal, civil) can be entered as manual lines until they are added here.</p>
      <div class="scroll"><table class="t num"><thead><tr><th>Category</th><th>Group</th><th>Unit</th><th>Size drivers</th><th>Presets (price of one unit, ${U().l})</th></tr></thead><tbody>${Object.entries(CATS).map(([k, c]) => `<tr><td>${esc(c.label)}</td><td>${c.group}</td><td>${c.unit}</td><td>${c.drivers(c.list[0]).map((d) => d.label).join(', ') || '–'}</td><td style="max-width:560px">${c.list.map((x) => { const p = priceLine({ cat: k, preset: c.list.indexOf(x) }); return `${esc(x.tag)}: ${p.error ? '–' : nf(p.price / U().f, p.price / U().f < 10 ? 3 : 2)}`; }).join('<br>')}</td></tr>`).join('')}</tbody></table></div></div></div>`;
  }
  function master() {
    const e = st();
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="h3">Estimate settings</div><div class="sfield-row"><label class="sfield"><span>Project name</span><input class="cell" style="width:260px;text-align:left" type="text" data-el="project.name" value="${esc(e.project.name)}"></label><label class="sfield"><span>Basis</span><input class="cell" style="width:360px;text-align:left" type="text" data-el="project.basis" value="${esc(e.project.basis)}"></label><label class="sfield"><span>Plant capacity (MW)</span>${num('project.mw', e.project.mw, 10, 100)}</label></div>
      <div class="h3" style="margin-top:18px">EPC layer, charged on the direct cost</div><div class="sfield-row">${[['eng', 'Engineering'], ['freight', 'Freight and insurance'], ['oh', 'Project overheads'], ['cont', 'Contingency'], ['profit', 'Profit']].map(([k, l]) => `<label class="sfield"><span>${l} %</span>${num(`l1.${k}`, +(e.l1[k] * 100).toFixed(2), 0.1, 90)}</label>`).join('')}</div>
      <p class="note" style="padding:10px 0 0">The reference coal-handling summary charged engineering 2%, freight 2%, overheads 5% and profit 10% on the direct cost. The category models already include their suppliers’ overheads and margins, so these are the EPC contractor’s own.</p><div style="margin-top:12px"><button class="btn" id="elreset">Reset to the starter estimate</button></div></div></div>`;
  }
  const pages = { build, batch: summary, calc: catalogue, master };
  const setPath = (o, p, v) => { const t = p.split('.'); for (let i = 0; i < t.length - 1; i++) o = o[t[i]]; o[t[t.length - 1]] = v; };
  function onClick(e, t) {
    const s = st();
    if (t.dataset.eladd) { s.lines.push(L('pump', 0, 1)); return 'refresh'; }
    if (t.dataset.eladdm) { s.lines.push({ cat: 'manual', name: 'New item', unit: 'lot', qty: 1, rate: 0, group: 'Other', factor: 1, drivers: {}, prev: null }); return 'refresh'; }
    if (t.dataset.eldel !== undefined) { s.lines.splice(+t.dataset.eldel, 1); return 'refresh'; }
    if (t.id === 'elreset') { Object.assign(s, estDefault()); s.tab = 'master'; return 'refresh'; }
    if (t.dataset.unit) { s.unit = t.dataset.unit; return 'refresh'; }
    return null;
  }
  function onChange(e) {
    const t = e.target, d = t.dataset; if (!d.el) return null; const s = st(), key = d.el, i = d.i === undefined ? null : +d.i;
    const num = t.type === 'number', v = num ? (t.value === '' ? null : parseFloat(t.value)) : t.value;
    if (i === null) { setPath(s, key, key.startsWith('l1.') ? Math.max(0, (v || 0) / 100) : (num ? (v ?? 0) : v)); return 'refresh'; }
    const l = s.lines[i]; if (!l) return 'refresh';
    if (key === 'cat') { l.cat = v; l.preset = 0; l.drivers = {}; l.factor = 1; l.group = null; }
    else if (key === 'preset') { l.preset = +v; l.drivers = {}; }
    else if (key.startsWith('drivers.')) { (l.drivers ||= {})[key.slice(8)] = v; }
    else if (key === 'prev') l.prev = v; else if (key === 'factor') l.factor = v || 1; else if (key === 'qty' || key === 'rate') l[key] = v ?? 0; else l[key] = v;
    return 'refresh';
  }
  return { renderPage: (tab) => { st().tab = tab; return pages[tab](); }, render: () => pages[ctx.state().tab || 'build'](), onClick, onInput: () => false, onChange, tabs: [['build', 'Estimate'], ['batch', 'Summary'], ['calc', 'Catalogue'], ['master', 'Settings']], units: { cr: '₹ Cr', lakh: '₹ lakh' }, getUnit: () => st().unit };
}
