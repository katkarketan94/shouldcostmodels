// Cost migration: move a price from one month to another by the commodity basket behind it (a price-variation formula), for one price or a pasted list.
import './style.css';
import './index/index.css';
import './prices-page.css';
import { PRICES, monthLabel, monthKeys } from './prices.js';
import { BASKETS } from './baskets.js';
import { RC as RCD, hasRegional, regionCodes, regionName, rValue, SERIES_SHORT } from './regional.js';

const KEY = 'scm-migrate-v1', $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : '–');
const sd = (v, d = 1) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(d)}%`;
const months = PRICES ? Object.keys(PRICES.months).sort() : [];
const latest = months[months.length - 1] || '', first = months[0] || '';
const def = () => ({ basket: 'cable_lt_al', rows: Object.entries(BASKETS.cable_lt_al[1]).map(([id, w]) => ({ id, w: Math.round(w * 100) })), price: 100000, unit: '₹ per unit', base: months[Math.max(0, months.length - 13)] || first, target: latest, baseR: 'IN', targetR: 'IN', bulk: 'LT cable PO-1, 250000, 2025-03\nLT cable PO-2, 262000, 2025-09' });
let S = def(); try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.rows) S = { ...S, ...v }; } catch { /* ignore */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* ignore */ } };
const commodities = () => PRICES?.commodities || {}, cname = (id) => (commodities()[id]?.name || id).split(' (')[0];
const weights = () => Object.fromEntries(S.rows.filter((r) => r.id && r.w > 0).map((r) => [r.id, r.w / 100]));

const pv = (id, mo, reg) => (id.startsWith('rc:') ? rValue(reg, mo, id.slice(3)) : PRICES.months[mo]?.[id]);
function idxAt(w, base, k, rb = S.baseR, rt = S.targetR) { const fixed = 1 - Object.values(w).reduce((s2, v) => s2 + v, 0); let v = fixed; for (const id of Object.keys(w)) { const a = pv(id, k, rt), b = pv(id, base, rb); if (!(a > 0) || !(b > 0)) return null; v += w[id] * a / b; } return v; }
const indexSeries = (w) => Object.keys(PRICES.months).sort().map((k) => ({ k, v: idxAt(w, S.base, k, S.baseR, S.targetR) })).filter((p) => p.v != null);

function chart(series, base, target) {
  if (series.length < 2) return '<div class="empty">Not enough months with prices for every commodity in the basket.</div>';
  const W = 760, H = 250, L = 54, R = 14, T = 14, B = 30, vs = series.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), pad = (hi - lo || 0.02) * 0.15, a = lo - pad, b = hi + pad, n = series.length;
  const x = (i) => L + i / (n - 1) * (W - L - R), y = (v) => T + (1 - (v - a) / (b - a)) * (H - T - B), at = (k) => series.findIndex((p) => p.k === k);
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = a + (b - a) * f; return `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#e6e9ee"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${v.toFixed(hi - lo < 0.06 ? 3 : 2)}</text>`; }).join('');
  const step = Math.ceil(n / 8), xl = series.map((p, i) => (i % step === 0 ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#6b7482">${monthLabel(p.k).replace(' 20', " '")}</text>` : '')).join('');
  const mark = (k, col, t) => { const i = at(k); return i < 0 ? '' : `<line x1="${x(i)}" x2="${x(i)}" y1="${T}" y2="${H - B}" stroke="${col}" stroke-dasharray="4 4"/><circle cx="${x(i)}" cy="${y(series[i].v)}" r="5" fill="${col}"/><text x="${x(i)}" y="${T + 10}" text-anchor="${i > n / 2 ? 'end' : 'start'}" font-size="11" font-weight="700" fill="${col}"> ${t}</text>`; };
  return `<svg viewBox="0 0 ${W} ${H}" class="chart">${grid}${xl}<polyline fill="none" stroke="#2563eb" stroke-width="2.4" points="${series.map((p, i) => `${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')}"/>${mark(base, '#64748b', 'Base')}${mark(target, '#d97706', 'Target')}</svg>`;
}

function render() {
  if (!PRICES || !months.length) { $('#app').innerHTML = '<div class="pp"><div class="ptop"><a class="homebtn" href="index.html">← All models</a><h1>Cost migration</h1></div><p class="phint"><b>commodity-prices.js was not found</b> next to this page.</p></div>'; return; }
  const w = weights(), wsum = Object.values(w).reduce((s, v) => s + v, 0), fixed = 1 - wsum, k = idxAt(w, S.base, S.target);
  const series = indexSeries(w), mig = k != null ? S.price * k : null;
  const rows = S.rows.map((r, i) => { const p0 = r.id ? pv(r.id, S.base, S.baseR) : null, p1 = r.id ? pv(r.id, S.target, S.targetR) : null, ch = p0 > 0 && p1 > 0 ? p1 / p0 - 1 : null; return `<tr><td><select class="select" data-r="${i}" data-f="id"><option value="">Choose commodity</option>${Object.keys(commodities()).map((id) => `<option value="${id}" ${r.id === id ? 'selected' : ''}>${esc(cname(id))}</option>`).join('')}${hasRegional() ? `<optgroup label="Labour and utilities (by state)">${Object.keys(RCD.series).map((id) => `<option value="rc:${id}" ${r.id === 'rc:' + id ? 'selected' : ''}>${esc(SERIES_SHORT[id] || RCD.series[id].name)}</option>`).join('')}</optgroup>` : ''}</select></td><td class="r"><input class="cell" type="number" step="1" data-r="${i}" data-f="w" value="${r.w}" style="width:70px"> %</td><td class="r">${fmt(p0, 1)}</td><td class="r">${fmt(p1, 1)}</td><td class="r">${ch == null ? '–' : sd(ch)}</td><td class="r">${ch == null ? '–' : sd(r.w / 100 * ch, 2)}</td><td><button class="x" data-del="${i}" title="Remove">✕</button></td></tr>`; }).join('');
  const bulk = S.bulk.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const p = l.split(',').map((x) => x.trim()), mo = p[p.length - 1], v = parseFloat(p[p.length - 2]), name = p.slice(0, -2).join(', '); const a = idxAt(w, mo, S.target, S.baseR, S.targetR); return { name, v, mo, a, out: a != null && Number.isFinite(v) ? v * a : null }; });
  $('#app').innerHTML = `<div class="pp"><div class="ptop"><a class="homebtn" href="index.html">← All models</a><h1>Cost migration</h1>${PRICES.sample ? '<span class="samplechip">sample data</span>' : ''}<div class="sp"></div><a class="btn" href="commodity-prices.html">Commodity prices</a></div>
    <p class="phint">Move a price from one month to another using the commodities behind it. Migrated price = price × (fixed share + Σ weight × commodity price at target ÷ commodity price at base). Add labour and utilities, and pick a base and target state, to carry a price between places as well as dates. Use it to re-base an old purchase order, check a price-variation clause, or compare quotes given at different dates.</p>
    <div class="agrid" style="grid-template-columns:minmax(320px,380px) 1fr;align-items:start">
    <div class="card"><div class="ch"><h2>Price to migrate</h2></div>
      <label class="mut">Item type</label><select class="select" id="basket" style="width:100%;margin:4px 0 12px">${Object.entries(BASKETS).map(([k2, [l]]) => `<option value="${k2}" ${S.basket === k2 ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
      <label class="mut">Price at the base month</label><input class="cell" id="price" type="number" step="any" value="${S.price}" style="width:100%;margin:4px 0 4px;text-align:left"><input class="cell" id="unit" value="${esc(S.unit)}" style="width:100%;margin:0 0 12px;text-align:left" aria-label="Unit label">
      <div class="two2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="mut">Base month</label><select class="select" id="base" style="width:100%">${monthKeys().slice().reverse().map((m) => `<option value="${m}" ${S.base === m ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}</select></div>
      <div><label class="mut">Target month</label><select class="select" id="target" style="width:100%">${monthKeys().slice().reverse().map((m) => `<option value="${m}" ${S.target === m ? 'selected' : ''}>${monthLabel(m)}</option>`).join('')}</select></div></div>
      ${hasRegional() ? `<div class="two2" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div><label class="mut">Base state</label><select class="select" id="baseR" style="width:100%">${['IN', ...regionCodes()].map((c) => `<option value="${c}" ${S.baseR === c ? 'selected' : ''}>${esc(regionName(c))}</option>`).join('')}</select></div><div><label class="mut">Target state</label><select class="select" id="targetR" style="width:100%">${['IN', ...regionCodes()].map((c) => `<option value="${c}" ${S.targetR === c ? 'selected' : ''}>${esc(regionName(c))}</option>`).join('')}</select></div></div>` : ''}
      ${mig != null ? `<div class="mres"><small>Migrated price at ${monthLabel(S.target)}</small><div class="big">${fmt(mig, mig < 1000 ? 2 : 0)}</div><div class="${mig >= S.price ? 'up' : 'dn'}" style="font-weight:700">${sd(k - 1, 2)} · ${mig >= S.price ? '+' : '−'}${fmt(Math.abs(mig - S.price), 0)}</div><small>${esc(S.unit)} · index ${k.toFixed(4)}${S.baseR !== S.targetR ? ` · ${esc(regionName(S.baseR))} to ${esc(regionName(S.targetR))}` : ''}</small></div>` : '<div class="banner" style="margin-top:12px">A commodity in the basket has no price for the base or target month.</div>'}
    </div>
    <div style="display:grid;gap:16px"><div class="card"><div class="ch"><h2>Commodity basket</h2><div class="sp"></div>${hasRegional() ? '<button class="btn" id="addreg">Add labour and utilities</button>' : ''}<button class="btn" id="addrow">Add commodity</button></div>
      <div class="tw"><table class="pt"><thead><tr><th>Commodity</th><th class="r">Weight</th><th class="r">Base</th><th class="r">Target</th><th class="r">Change</th><th class="r">Effect</th><th></th></tr></thead><tbody>${rows}
      <tr><td><b>Fixed share</b> <small class="mut">labour, overheads, bought-outs, margin</small></td><td class="r ${fixed < 0 ? 'dn' : ''}"><b>${(fixed * 100).toFixed(0)}%</b></td><td></td><td></td><td class="r">0.0%</td><td class="r">+0.00%</td><td></td></tr></tbody></table></div>
      <p class="mut" style="font-size:12px;margin:8px 0 0">Weights are indicative shares of the price that follow each commodity. Adjust them to match your price-variation clause. ${fixed < 0 ? '<b style="color:#b4134f">Weights add up to more than 100%.</b>' : ''}</p></div>
    <div class="card"><div class="ch"><h2>Basket index over time</h2><span class="mut">base month = 1.00</span></div>${chart(series, S.base, S.target)}</div>
    <div class="card"><div class="ch"><h2>Migrate a list of prices</h2><span class="mut">one per line: description, price, month (YYYY-MM)</span><div class="sp"></div><button class="btn" id="csv">Download CSV</button></div>
      <textarea id="bulk" class="cell" rows="4" style="width:100%;font-family:ui-monospace,monospace;text-align:left">${esc(S.bulk)}</textarea>
      <div class="tw" style="margin-top:8px"><table class="pt"><thead><tr><th>Description</th><th>Month</th><th class="r">Price</th><th class="r">Index to ${monthLabel(S.target)}</th><th class="r">Migrated</th></tr></thead><tbody>${bulk.map((b) => `<tr><td>${esc(b.name)}</td><td>${PRICES.months[b.mo] ? monthLabel(b.mo) : `<span class="dn">${esc(b.mo)}?</span>`}</td><td class="r">${fmt(b.v, 0)}</td><td class="r">${b.a != null ? b.a.toFixed(4) : '–'}</td><td class="r"><b>${b.out != null ? fmt(b.out, 0) : '–'}</b></td></tr>`).join('')}</tbody></table></div></div>
    </div></div></div>`;
  const bind = (sel, fn) => { const el = $(sel); if (el) el.onchange = fn; };
  bind('#basket', (e) => { S.basket = e.target.value; if (S.basket !== 'custom') S.rows = Object.entries(BASKETS[S.basket][1]).map(([id, wt]) => ({ id, w: Math.round(wt * 100) })); save(); render(); });
  bind('#price', (e) => { S.price = parseFloat(e.target.value) || 0; save(); render(); }); bind('#unit', (e) => { S.unit = e.target.value; save(); render(); });
  bind('#baseR', (e) => { S.baseR = e.target.value; save(); render(); }); bind('#targetR', (e) => { S.targetR = e.target.value; save(); render(); });
  bind('#base', (e) => { S.base = e.target.value; save(); render(); }); bind('#target', (e) => { S.target = e.target.value; save(); render(); });
  document.querySelectorAll('[data-r]').forEach((el) => (el.onchange = () => { const r = S.rows[+el.dataset.r]; r[el.dataset.f] = el.dataset.f === 'w' ? parseFloat(el.value) || 0 : el.value; S.basket = 'custom'; save(); render(); }));
  document.querySelectorAll('[data-del]').forEach((el) => (el.onclick = () => { S.rows.splice(+el.dataset.del, 1); S.basket = 'custom'; save(); render(); }));
  if ($('#addreg')) $('#addreg').onclick = () => { for (const [id, wt] of [['rc:labour_skilled', 8], ['rc:labour_unskilled', 2], ['rc:electricity_ht', 3], ['rc:diesel', 2], ['rc:water', 1]]) if (!S.rows.some((r) => r.id === id)) S.rows.push({ id, w: wt }); S.basket = 'custom'; save(); render(); };
  $('#addrow').onclick = () => { S.rows.push({ id: '', w: 5 }); save(); render(); };
  $('#bulk').onchange = (e) => { S.bulk = e.target.value; save(); render(); };
  $('#csv').onclick = () => { const lines = [['Description', 'Month', 'Price', 'Index', 'Migrated', 'Target month'], ...bulk.map((b) => [b.name, b.mo, b.v, b.a?.toFixed(4) ?? '', b.out != null ? Math.round(b.out) : '', S.target])]; const a = document.createElement('a'); a.download = 'cost-migration.csv'; a.href = URL.createObjectURL(new Blob([lines.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' })); a.click(); };
}
render();
