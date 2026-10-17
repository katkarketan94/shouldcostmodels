// Regional costs: labour, electricity, diesel and water by state and month. Compare states, follow a series over time, edit the file.
import './style.css';
import './index/index.css';
import './prices-page.css';
import { RC, LOCAL_STORAGE_KEY, SERIES_SHORT } from './regional.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v, d = 1) => (typeof v === 'number' ? v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ml = (k) => `${MON[+k.slice(5) - 1]} ${k.slice(0, 4)}`;
let D = RC ? JSON.parse(JSON.stringify({ ...RC, local: undefined })) : null, dirty = false;
if (!D) { $('#app').innerHTML = '<div class="pp"><div class="ptop"><a class="homebtn" href="index.html">← All models</a><h1>Regional costs</h1></div><p class="phint"><b>regional-costs.js was not found</b> next to this page.</p></div>'; throw new Error('no regional file'); }
const ids = Object.keys(D.series), codes = Object.keys(D.regions), keys = () => Object.keys(D.months).sort();
let sel = ids[0], month = keys().slice(-1)[0], picked = ['MH', 'GJ', 'TN', 'DL', 'UP'], zone = 'All';
const val = (mo, c, id) => D.months[mo]?.[c]?.[id];
const avg = (mo, id) => { const v = codes.map((c) => val(mo, c, id)).filter((x) => typeof x === 'number'); return v.reduce((s, x) => s + x, 0) / (v.length || 1); };
const serial = () => `// Regional labour and utility costs for all should-cost dashboards. Edit this file (or use regional-costs.html) and reload.\n// "sample": true marks the numbers as ILLUSTRATIVE; see "note" and "anchors".\nwindow.REGIONAL_COSTS = ${JSON.stringify({ ...D, local: undefined, updated: new Date().toISOString().slice(0, 10) }, null, 0)};\n`;
const COLORS = ['#2563eb', '#d97706', '#0f9d6b', '#8b5cf6', '#e11d74', '#0ea5a4', '#64748b', '#b08968'];

function compare() {
  const rows = codes.filter((c) => zone === 'All' || D.regions[c].zone === zone).map((c) => ({ c, v: val(month, c, sel) })).filter((r) => typeof r.v === 'number').sort((a, b) => b.v - a.v), a = avg(month, sel), hi = Math.max(...rows.map((r) => r.v)), lo = Math.min(...rows.map((r) => r.v));
  return `<div class="ch"><h2>Compare states</h2><span class="mut">${esc(D.series[sel].unit)} · India average ${fmt(a, 2)}</span><div class="sp"></div>
    <select id="zone" class="select">${['All', ...new Set(codes.map((c) => D.regions[c].zone))].map((z) => `<option ${z === zone ? 'selected' : ''}>${z}</option>`).join('')}</select>
    <select id="month" class="select">${keys().slice().reverse().map((m) => `<option value="${m}" ${m === month ? 'selected' : ''}>${ml(m)}</option>`).join('')}</select></div>
    <div class="bars">${rows.map((r) => { const idx = r.v / a; return `<div class="brow"><span class="bn">${esc(D.regions[r.c].name)}</span><div class="bt"><i style="width:${(r.v / hi) * 100}%;background:${idx > 1.05 ? '#d97706' : idx < 0.95 ? '#2563eb' : '#94a3b8'}"></i></div><span class="bv num">${fmt(r.v, sel === 'diesel' || sel === 'electricity_ht' ? 2 : 0)} <small>${idx >= 1 ? '+' : ''}${((idx - 1) * 100).toFixed(0)}%</small></span></div>`; }).join('')}</div>
    <p class="mut" style="font-size:12px;margin:8px 0 0">Spread between the highest and lowest state: ${fmt((hi / lo - 1) * 100, 0)}%. Bars are coloured against the India average (amber more than 5% above, blue more than 5% below).</p>`;
}
function chart() {
  const ks = keys(), sers = [['IN', 'India average', '#0f172a'], ...picked.map((c, i) => [c, D.regions[c].name, COLORS[i % COLORS.length]])];
  const val2 = (c, mo) => (c === 'IN' ? avg(mo, sel) : val(mo, c, sel)), all = sers.flatMap(([c]) => ks.map((k) => val2(c, k))).filter((x) => typeof x === 'number');
  const W = 760, H = 270, L = 54, R = 14, T = 14, B = 30, lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo || 1) * 0.1, a = lo - pad, b = hi + pad, x = (i) => L + (i / (ks.length - 1)) * (W - L - R), y = (v) => T + (1 - (v - a) / (b - a)) * (H - T - B);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = a + (b - a) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e9ee"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${fmt(v, hi < 20 ? 1 : 0)}</text>`; }).join('');
  const step = Math.ceil(ks.length / 8), xl = ks.map((k, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7482">${ml(k).replace(' 20', " '")}</text>` : '')).join('');
  const lines = sers.map(([c, , col]) => `<polyline fill="none" stroke="${col}" stroke-width="${c === 'IN' ? 2.8 : 2}" ${c === 'IN' ? 'stroke-dasharray="6 4"' : ''} points="${ks.map((k, i) => (typeof val2(c, k) === 'number' ? `${x(i).toFixed(1)},${y(val2(c, k)).toFixed(1)}` : null)).filter(Boolean).join(' ')}"/>`).join('');
  const growth = ([c]) => { const f = val2(c, ks[0]), l = val2(c, ks[ks.length - 1]); return f > 0 ? (Math.pow(l / f, 12 / (ks.length - 1)) - 1) * 100 : null; };
  return `<div class="ch"><h2>Over time</h2><span class="mut">${esc(D.series[sel].unit)}</span></div>
    <div class="chips" style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px">${codes.map((c) => `<button class="catchip ${picked.includes(c) ? 'on' : ''}" data-pick="${c}">${esc(D.regions[c].name)}</button>`).join('')}</div>
    <svg viewBox="0 0 ${W} ${H}" class="chart">${grid}${xl}${lines}</svg>
    <div class="legend" style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;margin-top:6px">${sers.map(([c, n, col]) => `<span><i style="display:inline-block;width:14px;height:3px;background:${col};vertical-align:middle;margin-right:5px"></i>${esc(n)} <b class="num">${growth([c]) == null ? '' : `${growth([c]) >= 0 ? '+' : ''}${growth([c]).toFixed(1)}%/yr`}</b></span>`).join('')}</div>`;
}
function editor() {
  const ks = keys().slice().reverse();
  return `<div class="ch"><h2>Data · ${esc(D.series[sel].name)}</h2><span class="mut">${esc(D.series[sel].basis || '')}</span><div class="sp"></div><input id="newm" type="month" class="select"><button class="btn" id="addm">Add month</button></div>
    <div class="tw"><table class="pt"><thead><tr><th>Month</th>${codes.map((c) => `<th title="${esc(D.regions[c].name)}">${c}</th>`).join('')}<th></th></tr></thead><tbody>${ks.map((k) => `<tr><td>${ml(k)}</td>${codes.map((c) => `<td><input class="cell" data-m="${k}" data-c="${c}" type="number" step="any" value="${val(k, c, sel) ?? ''}" style="width:64px"></td>`).join('')}<td><button class="x" data-del="${k}" title="Delete month">✕</button></td></tr>`).join('')}</tbody></table></div>`;
}
function render() {
  const ks = keys(), last = ks[ks.length - 1], yago = ks[Math.max(0, ks.length - 13)];
  const row = (id) => { const a = avg(last, id), b = avg(yago, id), ch = b ? (a / b - 1) * 100 : null; return `<button class="crow ${id === sel ? 'on' : ''}" data-sel="${id}"><div><b>${esc(SERIES_SHORT[id] || D.series[id].name)}</b><small>${esc(D.series[id].group)}</small></div><div class="r"><b>${fmt(a, id === 'diesel' || id === 'electricity_ht' ? 2 : 0)}</b><small>${esc(D.series[id].unit)}${ch != null ? ` · <span class="${ch >= 0 ? 'up' : 'dn'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}% in 12 mo</span>` : ''}</small></div></button>`; };
  $('#app').innerHTML = `<div class="pp"><div class="ptop"><a class="homebtn" href="index.html">← All models</a><h1>Regional costs</h1>${D.sample ? '<span class="samplechip">estimated data</span>' : ''}${RC.local ? '<span class="samplechip" style="background:#e0ecff;color:#1d4ed8">local edits active</span>' : ''}${dirty ? '<span class="samplechip">unsaved changes</span>' : ''}<div class="sp"></div>
    <label class="chk"><input type="checkbox" id="sample" ${D.sample ? 'checked' : ''}> Mark as sample data</label><button class="btn" id="save">Save in this browser</button><button class="btn" id="clear">Clear local edits</button><button class="btn pri" id="dl">Download regional-costs.js</button></div>
    <p class="phint">Labour, electricity, diesel and water by state and month. Every cost page can re-cost its labour- and utility-exposed parts for a state and month (look for “Location and month” under the cost split), and the cost-migration tool can include them in a price-variation basket. Download the file and place it next to the pages to make changes permanent.</p>
    <div class="pgrid"><aside><div class="gh">Series</div>${ids.map(row).join('')}</aside>
    <section><div class="card">${compare()}</div><div class="card">${chart()}</div><div class="card">${editor()}</div>
    <div class="card"><div class="ch"><h2>About these numbers</h2></div><p class="mut" style="font-size:13px;margin:0 0 8px">${esc(D.note)}</p><ul class="mut" style="font-size:12.5px;margin:0;padding-left:18px">${(D.anchors || []).map((a) => `<li>${esc(a.what)} <i>(${esc(a.source)})</i></li>`).join('')}</ul></div></section></div></div>`;
  const app = $('#app');
  app.querySelectorAll('[data-sel]').forEach((b) => (b.onclick = () => { sel = b.dataset.sel; render(); }));
  app.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => { const c = b.dataset.pick; picked = picked.includes(c) ? picked.filter((x) => x !== c) : [...picked, c].slice(-6); render(); }));
  $('#zone').onchange = (e) => { zone = e.target.value; render(); }; $('#month').onchange = (e) => { month = e.target.value; render(); };
  app.querySelectorAll('.cell').forEach((i) => (i.onchange = () => { const v = parseFloat(i.value); const m = D.months[i.dataset.m][i.dataset.c] ||= {}; if (Number.isFinite(v)) m[sel] = v; else delete m[sel]; dirty = true; setTimeout(render, 0); }));
  app.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { if (confirm(`Delete ${ml(b.dataset.del)}?`)) { delete D.months[b.dataset.del]; dirty = true; render(); } }));
  $('#addm').onclick = () => { const v = $('#newm').value; if (!v || D.months[v]) return; const prev = keys().filter((k) => k < v).pop() || keys()[0]; D.months[v] = JSON.parse(JSON.stringify(D.months[prev] || {})); dirty = true; render(); };
  $('#sample').onchange = (e) => { D.sample = e.target.checked; dirty = true; render(); };
  $('#save').onclick = () => { try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...D, local: undefined })); dirty = false; alert('Saved in this browser. Dashboards opened here will now use these values.'); location.reload(); } catch { alert('Could not write to browser storage.'); } };
  $('#clear').onclick = () => { try { localStorage.removeItem(LOCAL_STORAGE_KEY); } catch { /* */ } location.reload(); };
  $('#dl').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([serial()], { type: 'text/javascript' })); a.download = 'regional-costs.js'; a.click(); };
}
render();
