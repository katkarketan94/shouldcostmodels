import './style.css';
import './index/index.css';
import './prices-page.css';
import { PRICES, LOCAL_STORAGE_KEY, monthLabel } from './prices.js';
import { trend, seasonality, pairStats, corrMatrix, seriesOf } from './analytics.js';

const base = window.COMMODITY_PRICES;
let D = PRICES ? JSON.parse(JSON.stringify({ ...PRICES, local: undefined })) : { version: 1, currency: 'INR', sample: false, commodities: {}, months: {} };
let sel = Object.keys(D.commodities)[0];
let dirty = false, hz = 6, drv = '', showTrend = true;
const $ = (s) => document.querySelector(s);
const keys = () => Object.keys(D.months).sort();
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '–');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const serial = () => `// Common commodity prices for all should-cost dashboards. Edit this file (or use commodity-prices.html) and reload.\n// "sample": true marks the numbers as ILLUSTRATIVE. Set it to false once they are real monthly prices.\nwindow.COMMODITY_PRICES = ${JSON.stringify({ ...D, local: undefined, updated: new Date().toISOString().slice(0, 10) }, null, 1)};\n`;

function chart() {
  const ks0 = keys(), tr = showTrend ? trend(D.months, sel, hz) : null, fcKs = tr ? tr.fc.map((f) => f.k) : [], ks = [...ks0, ...fcKs];
  const vs = ks0.map((k) => D.months[k][sel]).filter((v) => typeof v === 'number');
  if (ks0.length < 2 || !vs.length) return '<div class="empty">Not enough months to chart.</div>';
  const all = [...vs, ...(tr ? tr.fc.flatMap((f) => [f.lo, f.hi]) : [])];
  const W = 760, H = 260, L = 54, R = 14, T = 14, B = 30, lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo || 1) * 0.12, a = lo - pad, b = hi + pad;
  const x = (i) => L + (i / (ks.length - 1)) * (W - L - R), y = (v) => T + (1 - (v - a) / (b - a)) * (H - T - B), ix = (k) => ks.indexOf(k);
  const pts = ks0.map((k) => (typeof D.months[k][sel] === 'number' ? `${x(ix(k)).toFixed(1)},${y(D.months[k][sel]).toFixed(1)}` : null)).filter(Boolean);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = a + (b - a) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e9ee"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${fmt(Math.round(v * 10) / 10)}</text>`; }).join('');
  const step = Math.ceil(ks.length / 8), xl = ks.map((k, i) => (i % step === 0 || (i === ks.length - 1 && (i % step) > step / 2) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7482">${monthLabel(k).replace(' 20', " '")}</text>` : '')).join('');
  const last = ks0.length - 1, lv = D.months[ks0[last]][sel];
  let over = '';
  if (tr) {
    const band = [...tr.fc.map((f) => `${x(ix(f.k)).toFixed(1)},${y(f.hi).toFixed(1)}`), ...tr.fc.slice().reverse().map((f) => `${x(ix(f.k)).toFixed(1)},${y(f.lo).toFixed(1)}`)].join(' ');
    over = `<polyline fill="none" stroke="#94a3b8" stroke-width="1.6" stroke-dasharray="5 4" points="${tr.fit.map((f) => `${x(ix(f.k)).toFixed(1)},${y(f.v).toFixed(1)}`).join(' ')}"/>${tr.fc.length ? `<polygon points="${band}" fill="#f59e0b" opacity=".18"/><polyline fill="none" stroke="#d97706" stroke-width="2.2" points="${[`${x(last).toFixed(1)},${y(tr.fit[tr.fit.length - 1].v).toFixed(1)}`, ...tr.fc.map((f) => `${x(ix(f.k)).toFixed(1)},${y(f.v).toFixed(1)}`)].join(' ')}"/>` : ''}`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${grid}${xl}${over}<polyline fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linejoin="round" points="${pts.join(' ')}"/>${typeof lv === 'number' ? `<circle cx="${x(last)}" cy="${y(lv)}" r="4.5" fill="#2563eb"/>` : ''}</svg>`;
}

const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const sd1 = (v, d = 1) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(d)}%`;
function analysis() {
  const tr = trend(D.months, sel, hz), se = seasonality(D.months, sel), ids = Object.keys(D.commodities).filter((id) => id !== sel && seriesOf(D.months, id).length >= 12);
  const stats = ids.map((id) => ({ id, p: pairStats(D.months, sel, id) })).filter((o) => o.p).sort((a, b) => Math.abs(b.p.r) - Math.abs(a.p.r));
  if (!drv || !stats.some((o) => o.id === drv)) drv = stats[0]?.id || '';
  const cur = stats.find((o) => o.id === drv)?.p, name = (id) => D.commodities[id]?.name.split(' (')[0] || id;
  const sample = D.sample ? '<p class="mut" style="font-size:12px;margin:6px 0 0">The price file is marked as sample data, so these statistics describe the illustrative series, not the market.</p>' : '';
  if (!tr) return `<div class="card"><div class="ch"><h2>Trend, seasonality and relationships</h2></div><div class="empty">Needs at least six months of prices for this commodity.</div></div>`;
  const fcRows = tr.fc.map((f) => `<tr><td>${monthLabel(f.k)}</td><td class="r">${fmt(f.v)}</td><td class="r mut">${fmt(f.lo)} to ${fmt(f.hi)}</td></tr>`).join('');
  // seasonality bars
  let sv = '<div class="empty">Seasonality needs at least a year of prices.</div>';
  if (se && tr.n >= 12) { const W = 380, H = 150, bw = W / 12, amp = Math.max(0.03, se.amp * 1.2), Y = (v) => 70 - ((v - 1) / amp) * 55; sv = `<svg viewBox="0 0 ${W} ${H}" class="chart"><line x1="0" x2="${W}" y1="70" y2="70" stroke="#94a3b8"/>${se.idx.map((o, i) => o.v == null ? '' : `<rect x="${i * bw + 4}" y="${Math.min(70, Y(o.v))}" width="${bw - 8}" height="${Math.abs(Y(o.v) - 70)}" rx="2" fill="${o.v >= 1 ? '#d97706' : '#2563eb'}" opacity="${o.n >= 2 ? 1 : 0.45}"><title>${MN[i]}: ${sd1(o.v - 1)} (${o.n} observations)</title></rect><text x="${i * bw + bw / 2}" y="${H - 38}" text-anchor="middle" font-size="9.5" fill="#6b7482">${MN[i]}</text><text x="${i * bw + bw / 2}" y="${H - 26}" text-anchor="middle" font-size="9" fill="#9aa3b0">n=${o.n}</text>`).join('')}</svg>
      <p class="mut" style="font-size:12.5px;margin:4px 0 0">Highest around <b>${MN[se.strongest.m]}</b> (${sd1(se.strongest.v - 1)}), lowest around <b>${MN[se.weakest.m]}</b> (${sd1(se.weakest.v - 1)}) relative to trend. ${se.minObs < 3 ? `Only ${se.minObs} to 3 observations per month (${se.years.toFixed(1)} years of data), so treat as indicative.` : ''}</p>`; }
  // scatter
  let rel = '<div class="empty">Not enough overlapping months with another commodity.</div>';
  if (cur) {
    const W = 380, H = 220, L = 40, B = 24, xs = cur.pts.map((q) => q.x), ys = cur.pts.map((q) => q.y), ex = Math.max(...xs.map(Math.abs)) * 1.1 || 0.05, ey = Math.max(...ys.map(Math.abs)) * 1.1 || 0.05, X = (v) => L + (v + ex) / (2 * ex) * (W - L - 8), Y = (v) => 8 + (1 - (v + ey) / (2 * ey)) * (H - 8 - B);
    rel = `<svg viewBox="0 0 ${W} ${H}" class="chart"><line x1="${L}" x2="${W - 8}" y1="${Y(0)}" y2="${Y(0)}" stroke="#cbd5e1"/><line x1="${X(0)}" x2="${X(0)}" y1="8" y2="${H - B}" stroke="#cbd5e1"/>${cur.pts.map((q) => `<circle cx="${X(q.x)}" cy="${Y(q.y)}" r="3.2" fill="#2563eb" opacity=".7"><title>${monthLabel(q.k)}: ${sd1(q.x)} vs ${sd1(q.y)}</title></circle>`).join('')}<line x1="${X(-ex)}" y1="${Y(cur.alpha - cur.beta * ex)}" x2="${X(ex)}" y2="${Y(cur.alpha + cur.beta * ex)}" stroke="#d97706" stroke-width="2"/><text x="${W / 2}" y="${H - 6}" text-anchor="middle" font-size="10.5" fill="#6b7482">${esc(name(drv))} monthly change</text><text x="6" y="14" font-size="10.5" fill="#6b7482">${esc(name(sel))}</text></svg>
      <p class="mut" style="font-size:12.5px;margin:4px 0 0">Beta <b>${cur.beta.toFixed(2)}</b>, correlation <b>${cur.r.toFixed(2)}</b>, R² ${cur.r2.toFixed(2)} over ${cur.n} months. A 10% rise in ${esc(name(drv))} goes with ${sd1(cur.beta * 0.1)} in ${esc(name(sel))} on average${cur.r2 < 0.2 ? ', but the fit is weak' : ''}.</p>`;
  }
  const top = stats.slice(0, 6).map((o) => `<div class="tp-row"><span>${esc(name(o.id))}</span><span class="num">${o.p.r >= 0 ? '+' : ''}${o.p.r.toFixed(2)} <small>n=${o.p.n}</small></span></div>`).join('');
  return `<div class="card"><div class="ch"><h2>Trend, seasonality and relationships</h2><div class="sp"></div><label class="chk"><input type="checkbox" id="trendon" ${showTrend ? 'checked' : ''}> Show trend and forecast</label></div>
    <div class="agrid"><div><h3 class="sh">Trend and forecast</h3>
      <p class="mut" style="font-size:12.5px;margin:0 0 6px">Log-linear fit over ${tr.n} months: <b>${sd1(tr.annual)}</b> a year, R² ${tr.r2.toFixed(2)}. Residual scatter ±${(tr.sd * 100).toFixed(1)}% a month.</p>
      <label class="mut" style="font-size:12px">Forecast horizon <select id="hz" class="select">${[3, 6, 9, 12].map((n) => `<option ${n === hz ? 'selected' : ''}>${n}</option>`).join('')}</select> months</label>
      <table class="pt" style="margin-top:8px"><thead><tr><th>Month</th><th class="r">Trend</th><th class="r">95% band</th></tr></thead><tbody>${fcRows}</tbody></table></div>
     <div><h3 class="sh">Seasonality</h3>${sv}</div>
     <div><h3 class="sh">Relationship with another commodity</h3><label class="mut" style="font-size:12px">Driver <select id="drv" class="select">${stats.map((o) => `<option value="${o.id}" ${o.id === drv ? 'selected' : ''}>${esc(name(o.id))} (r ${o.p.r.toFixed(2)})</option>`).join('')}</select></label>${rel}
      <h3 class="sh" style="margin-top:10px">Closest movers</h3>${top}</div></div>${sample}
    <p class="mut" style="font-size:12px;margin:8px 0 0">Statistics use monthly averages. Trend is exponential growth fitted to the whole series; the forecast band is a statistical interval, not a price view. Short series and sample data limit what these figures mean.</p></div>`;
}

function render() {
  const ids = Object.keys(D.commodities), ks = keys();
  const groups = {}; ids.forEach((id) => (groups[D.commodities[id].group || 'Other'] ||= []).push(id));
  const row = (id) => {
    const c = D.commodities[id], last = D.months[ks[ks.length - 1]]?.[id], prev = D.months[ks[ks.length - 2]]?.[id];
    const ch = typeof last === 'number' && typeof prev === 'number' && prev ? ((last / prev - 1) * 100) : null;
    return `<button class="crow ${id === sel ? 'on' : ''}" data-sel="${id}"><div><b>${esc(c.name)}</b><small>${esc(c.models || '')}</small></div><div class="r"><b>${fmt(last)}</b><small>${esc(c.unit)}${ch != null ? ` · <span class="${ch >= 0 ? 'up' : 'dn'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%</span>` : ''}</small></div></button>`;
  };
  const c = D.commodities[sel];
  $('#app').innerHTML = `<div class="pp">
   <div class="ptop"><a class="homebtn" href="index.html">← All models</a><h1>Commodity prices</h1>
    ${D.sample ? '<span class="samplechip">sample data</span>' : ''}${PRICES?.local ? '<span class="samplechip" style="background:#e0ecff;color:#1d4ed8">local edits active</span>' : ''}${dirty ? '<span class="samplechip">unsaved changes</span>' : ''}
    <div class="sp"></div>
    <label class="chk"><input type="checkbox" id="sample" ${D.sample ? 'checked' : ''}> Mark as sample data</label>
    <button class="btn" id="save">Save in this browser</button><button class="btn" id="clear">Clear local edits</button><button class="btn pri" id="dl">Download commodity-prices.js</button></div>
   <p class="phint">Dashboards read <code>commodity-prices.js</code> from the same folder. To make changes permanent for everyone, download the file below and replace the one next to the pages. “Save in this browser” only affects this browser. ${base ? '' : '<b>commodity-prices.js was not found.</b>'}</p>
   <div class="pgrid"><aside>${Object.entries(groups).map(([g, l]) => `<div class="gh">${esc(g)}</div>${l.map(row).join('')}`).join('')}</aside>
   <section><div class="card"><div class="ch"><h2>${esc(c?.name || '')}</h2><span class="mut">${esc(c?.unit || '')}</span></div>${chart()}</div>
    ${analysis()}
    <div class="card"><div class="ch"><h2>Monthly table</h2><div class="sp"></div><input id="newm" type="month" class="select"><button class="btn" id="addm">Add month</button></div>
     <div class="tw"><table class="pt"><thead><tr><th>Month</th>${ids.map((id) => `<th title="${esc(D.commodities[id].name)}">${esc(D.commodities[id].name.split(' (')[0])}<small>${esc(D.commodities[id].unit)}</small></th>`).join('')}<th></th></tr></thead>
     <tbody>${ks.slice().reverse().map((k) => `<tr><td>${monthLabel(k)}</td>${ids.map((id) => `<td><input class="cell" data-m="${k}" data-c="${id}" type="number" step="any" value="${D.months[k][id] ?? ''}"></td>`).join('')}<td><button class="x" data-del="${k}" title="Delete month">✕</button></td></tr>`).join('')}</tbody></table></div></div>
   </section></div></div>`;
  $('#app').querySelectorAll('[data-sel]').forEach((b) => (b.onclick = () => { sel = b.dataset.sel; render(); }));
  $('#app').querySelectorAll('.cell').forEach((i) => (i.onchange = () => {
    const v = parseFloat(i.value); const m = D.months[i.dataset.m];
    if (Number.isFinite(v)) m[i.dataset.c] = v; else delete m[i.dataset.c];
    dirty = true; setTimeout(render, 0);
  }));
  $('#app').querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { if (confirm(`Delete ${monthLabel(b.dataset.del)}?`)) { delete D.months[b.dataset.del]; dirty = true; render(); } }));
  $('#trendon') && ($('#trendon').onchange = (e) => { showTrend = e.target.checked; render(); });
  $('#hz') && ($('#hz').onchange = (e) => { hz = +e.target.value; render(); });
  $('#drv') && ($('#drv').onchange = (e) => { drv = e.target.value; render(); });
  $('#addm').onclick = () => {
    const v = $('#newm').value; if (!v || D.months[v]) return;
    const prev = keys().filter((k) => k < v).pop() || keys()[0];
    D.months[v] = { ...(D.months[prev] || {}) }; dirty = true; render();
  };
  $('#sample').onchange = (e) => { D.sample = e.target.checked; dirty = true; render(); };
  $('#save').onclick = () => { try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...D, local: undefined })); dirty = false; alert('Saved in this browser. Dashboards opened here will now use these prices.'); location.reload(); } catch { alert('Could not write to browser storage.'); } };
  $('#clear').onclick = () => { try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch { /* */ } location.reload(); };
  $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([serial()], { type: 'text/javascript' })); a.download = 'commodity-prices.js'; a.click(); };
}
render();
