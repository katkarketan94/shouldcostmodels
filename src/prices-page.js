import './style.css';
import './index/index.css';
import './prices-page.css';
import { PRICES, LOCAL_STORAGE_KEY, monthLabel } from './prices.js';

const base = window.COMMODITY_PRICES;
let D = PRICES ? JSON.parse(JSON.stringify({ ...PRICES, local: undefined })) : { version: 1, currency: 'INR', sample: false, commodities: {}, months: {} };
let sel = Object.keys(D.commodities)[0];
let dirty = false;
const $ = (s) => document.querySelector(s);
const keys = () => Object.keys(D.months).sort();
const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '–');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const serial = () => `// Common commodity prices for all should-cost dashboards. Edit this file (or use commodity-prices.html) and reload.\n// "sample": true marks the numbers as ILLUSTRATIVE. Set it to false once they are real monthly prices.\nwindow.COMMODITY_PRICES = ${JSON.stringify({ ...D, local: undefined, updated: new Date().toISOString().slice(0, 10) }, null, 1)};\n`;

function chart() {
  const ks = keys(), vs = ks.map((k) => D.months[k][sel]).filter((v) => typeof v === 'number');
  if (ks.length < 2 || !vs.length) return '<div class="empty">Not enough months to chart.</div>';
  const W = 760, H = 240, L = 54, R = 14, T = 14, B = 30, lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo || 1) * 0.12, a = lo - pad, b = hi + pad;
  const x = (i) => L + (i / (ks.length - 1)) * (W - L - R), y = (v) => T + (1 - (v - a) / (b - a)) * (H - T - B);
  const pts = ks.map((k, i) => (typeof D.months[k][sel] === 'number' ? `${x(i).toFixed(1)},${y(D.months[k][sel]).toFixed(1)}` : null)).filter(Boolean);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = a + (b - a) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e9ee"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${fmt(Math.round(v * 10) / 10)}</text>`; }).join('');
  const xl = ks.map((k, i) => (i % Math.ceil(ks.length / 8) === 0 || i === ks.length - 1 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7482">${monthLabel(k).replace(' 20', " '")}</text>` : '')).join('');
  const last = ks.length - 1, lv = D.months[ks[last]][sel];
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${grid}${xl}<polyline fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linejoin="round" points="${pts.join(' ')}"/>${typeof lv === 'number' ? `<circle cx="${x(last)}" cy="${y(lv)}" r="4.5" fill="#2563eb"/>` : ''}</svg>`;
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
