// Two cards that sit under the should-cost on every page: how this build's cost structure compares with a typical one, and a quote-vs-should-cost check.
// Typical structures are indicative benchmarks, not supplier data; edit TYPICAL below to match your own experience.
import { hasRegional, regionCodes, regionName, rMonths, rLatest, locationAdjust, SERIES_SHORT, RC } from './regional.js';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const BUCKETS = [['mat', 'Materials & bought-outs', '#c27a2c'], ['conv', 'Conversion & labour', '#2563eb'], ['log', 'Logistics, packing & site', '#0ea5a4'], ['oh', 'Overheads & engineering', '#64748b'], ['mg', 'Margin', '#0f9d6b']];
export const TYPICAL = {
  cable: { mat: 72, conv: 8, log: 4, oh: 8, mg: 8 }, tray: { mat: 62, conv: 14, log: 5, oh: 10, mg: 9 }, busduct: { mat: 64, conv: 13, log: 4, oh: 10, mg: 9 }, structural: { mat: 63, conv: 16, log: 5, oh: 8, mg: 8 },
  ahu: { mat: 58, conv: 16, log: 4, oh: 12, mg: 10 }, chiller: { mat: 70, conv: 8, log: 3, oh: 10, mg: 9 }, duct: { mat: 60, conv: 20, log: 4, oh: 8, mg: 8 }, pipes: { mat: 70, conv: 10, log: 5, oh: 8, mg: 7 },
  dg: { mat: 72, conv: 6, log: 3, oh: 9, mg: 10 }, xfmr: { mat: 58, conv: 28, log: 2, oh: 6, mg: 6 }, reactor: { mat: 56, conv: 30, log: 2, oh: 7, mg: 5 }, fire: { mat: 58, conv: 18, log: 3, oh: 11, mg: 10 },
  ctower: { mat: 55, conv: 18, log: 5, oh: 11, mg: 11 }, pump: { mat: 48, conv: 30, log: 3, oh: 9, mg: 10 }, swgr: { mat: 62, conv: 12, log: 4, oh: 11, mg: 11 }, mh: { mat: 52, conv: 22, log: 6, oh: 10, mg: 10 },
  static: { mat: 62, conv: 14, log: 4, oh: 10, mg: 10 }, bfp: { mat: 66, conv: 8, log: 3, oh: 12, mg: 11 }, swyd: { mat: 48, conv: 30, log: 5, oh: 9, mg: 8 }, wtp: { mat: 52, conv: 24, log: 4, oh: 10, mg: 10 },
  acc: { mat: 56, conv: 22, log: 5, oh: 9, mg: 8 }, apc: { mat: 52, conv: 24, log: 5, oh: 10, mg: 9 }, ups: { mat: 68, conv: 8, log: 3, oh: 10, mg: 11 }, light: { mat: 56, conv: 24, log: 4, oh: 9, mg: 7 },
  lift: { mat: 55, conv: 20, log: 4, oh: 11, mg: 10 }, motor: { mat: 66, conv: 10, log: 3, oh: 10, mg: 11 }, comp: { mat: 62, conv: 12, log: 4, oh: 10, mg: 12 }, tank: { mat: 50, conv: 30, log: 4, oh: 8, mg: 8 },
  valve: { mat: 58, conv: 14, log: 5, oh: 11, mg: 12 }, hanger: { mat: 48, conv: 32, log: 4, oh: 8, mg: 8 },
};
export const bucketOf = (label) => {
  const s = String(label).toLowerCase();
  if (/margin|mark-up|markup|profit/.test(s)) return 'mg';
  if (/overhead|engineering|supervision|finance|design|spares|contingen|guarantee|warranty/.test(s)) return 'oh';
  if (/transport|packing|drum|logistic|freight/.test(s)) return 'log';
  if (/conversion|labour|labor|erection|installation|assembly|fabrication|test|commission|machining|welding|processing|galvanis|civil|foundation/.test(s)) return 'conv';
  return 'mat';
};
const pct = (v, d = 0) => `${(v * 100).toFixed(d)}%`;
const inr = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

/** parts: [{l, v}] in any grouping; returns HTML for the typical-structure comparison */
export function typicalStrip(item, parts, total) {
  const typ = TYPICAL[item]; if (!typ || !(total > 0)) return '';
  const loc = locationCard(parts);
  const got = { mat: 0, conv: 0, log: 0, oh: 0, mg: 0 }; parts.forEach((p) => { got[bucketOf(p.l)] += p.v; });
  const sum = Object.values(got).reduce((s, v) => s + v, 0) || 1;
  const bar = (o, k) => BUCKETS.map(([b, l, col]) => `<i style="width:${(o[b] / k) * 100}%;background:${col}" title="${esc(l)}"></i>`).join('');
  const rows = BUCKETS.map(([b, l, col]) => { const m = got[b] / sum * 100, t = typ[b], d = m - t, off = Math.abs(d) >= 5; return `<div class="tp-row"><span><span class="dot" style="background:${col}"></span>${esc(l)}</span><span class="num">${m.toFixed(0)}% <small>vs ${t}%</small> <em class="${off ? (d > 0 ? 'hi' : 'lo') : ''}">${d >= 0 ? '+' : ''}${d.toFixed(0)}</em></span></div>`; }).join('');
  return `<div class="tp"><div class="cap"><span>Typical cost structure</span><span class="pill">indicative</span></div>
    <div class="tp-bars"><small>This build</small><div class="stack">${bar(got, sum)}</div><small>Typical</small><div class="stack">${bar(typ, 100)}</div></div>${rows}
    <div class="note" style="padding:6px 0 0">Benchmark shares for this kind of item, not supplier data. A gap of 5 points or more is flagged.</div></div>${loc}`;
}


// ---- location and month: re-cost the labour- and utility-exposed parts for a state and month ----
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], ml = (k) => `${MON[+k.slice(5) - 1]} ${k.slice(0, 4)}`;
const LK = 'scm-location';
const loadLoc = () => { const d = { fromR: 'IN', fromM: rLatest(), toR: 'IN', toM: rLatest() }; try { return { ...d, ...JSON.parse(localStorage.getItem(LK) || '{}') }; } catch { return d; } };
let lastParts = null;
const bucketsOf = (parts) => { const b = { mat: 0, conv: 0, log: 0, oh: 0, mg: 0 }; parts.forEach((p) => { b[bucketOf(p.l)] += p.v; }); return b; };
function locationCard(parts) {
  if (!hasRegional()) return ''; lastParts = parts; return `<div class="lc" id="lc">${locationBody()}</div>`;
}
function locationBody() {
  const L = loadLoc(), ms = rMonths().slice().reverse(), regs = ['IN', ...regionCodes()];
  const sel = (k, opts, v) => `<select class="select" data-lc="${k}">${opts.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
  const ro = regs.map((c) => [c, regionName(c)]), mo = ms.map((m) => [m, ml(m)]);
  const adj = locationAdjust(bucketsOf(lastParts), { region: L.fromR, month: L.fromM }, { region: L.toR, month: L.toM }), pc = (adj.factor - 1) * 100;
  const rows = Object.keys(adj.ratio).filter((id) => Math.abs(adj.ratio[id] - 1) > 0.0005 || Math.abs(adj.effect[id]) > 0).map((id) => { const e = adj.effect[id] / adj.total * 100; return `<div class="tp-row"><span>${SERIES_SHORT[id] || id}</span><span class="num">${adj.ratio[id] >= 1 ? '+' : ''}${((adj.ratio[id] - 1) * 100).toFixed(1)}% <em class="${Math.abs(e) >= 0.5 ? (e > 0 ? 'hi' : 'lo') : ''}">${e >= 0 ? '+' : ''}${e.toFixed(2)} pts</em></span></div>`; }).join('');
  return `<div class="cap"><span>Location and month</span><span class="pill ${RC.sample ? 'warn' : ''}">${RC.sample ? 'estimated data' : 'regional data'}</span></div>
    <div class="note" style="padding:0 0 4px">Model rates are for</div><div class="lcsel">${sel('fromR', ro, L.fromR)}${sel('fromM', mo, L.fromM)}</div>
    <div class="note" style="padding:6px 0 4px">Re-cost for</div><div class="lcsel">${sel('toR', ro, L.toR)}${sel('toM', mo, L.toM)}</div>
    <div class="lcres"><b class="num ${pc > 0.05 ? 'hi' : pc < -0.05 ? 'lo' : ''}">${pc >= 0 ? '+' : ''}${pc.toFixed(2)}%</b><span class="mut">on the price above (× ${adj.factor.toFixed(4)})</span></div>${rows || '<div class="note">Same place and month: no adjustment.</div>'}
    <div class="note" style="padding:6px 0 0">Applies the labour, electricity, diesel and water indices to the parts of the price that depend on them (conversion, logistics and some overheads). Materials follow commodity prices instead. <a href="regional-costs.html">Regional costs</a></div>`;
}

// ---- quote vs should-cost ----
const QK = 'scm-quotes';
const loadQ = () => { try { return JSON.parse(localStorage.getItem(QK) || '{}'); } catch { return {}; } };
const saveQ = (o) => { try { localStorage.setItem(QK, JSON.stringify(o)); } catch { /* ignore */ } };
let last = null;

/** ctx: { item, key, label (basis, e.g. '₹/km'), value (should-cost in that basis), parts:[{l,v}] } */
export function quoteCard(ctx) { last = ctx; return `<div class="qc" id="qc">${quoteBody(ctx)}</div>`; }
function verdict(gap) { return gap <= -0.15 ? ['Far below', 'lo', 'Check scope, quality and what is excluded.'] : gap <= 0.02 ? ['At should-cost', 'ok', 'Accept if scope and terms match.'] : gap <= 0.08 ? ['Close', 'ok', 'Small room: ask for a modest discount.'] : gap <= 0.18 ? ['Negotiate', 'mid', 'Ask for the cost break-up; target the overhead and margin lines.'] : ['Challenge', 'hi', 'Well above should-cost: seek a re-quote or an alternative source.']; }
function quoteBody(c) {
  const q = loadQ(), id = `${c.key}|${c.label}`, rows = q[id] || [], sc = c.value, got = { mat: 0, conv: 0, log: 0, oh: 0, mg: 0 }; (c.parts || []).forEach((p) => { got[bucketOf(p.l)] += p.v; });
  const sum = Object.values(got).reduce((s, v) => s + v, 0) || 1, direct = (got.mat + got.conv + got.log) / sum;
  const res = rows.map((r) => ({ ...r, gap: r.v > 0 ? r.v / sc - 1 : null })), valid = res.filter((r) => r.gap != null), lo = valid.length ? Math.min(...valid.map((r) => r.v)) : null, hi = valid.length ? Math.max(...valid.map((r) => r.v)) : null;
  const line = (r, i) => { const vd = r.gap != null ? verdict(r.gap) : null, implied = r.v > 0 ? 1 - (direct * sc) / r.v : null; return `<div class="qrow"><input class="cell" data-qc="name" data-i="${i}" value="${esc(r.name)}" placeholder="Supplier" aria-label="Supplier name"><input class="cell" data-qc="v" data-i="${i}" type="number" step="any" value="${r.v || ''}" placeholder="${esc(c.label)}" aria-label="Quote"><button class="x" data-qc="del" data-i="${i}" title="Remove">✕</button>
    ${vd ? `<div class="qres"><span class="qchip ${vd[1]}">${vd[0]}</span><b class="num">${r.gap >= 0 ? '+' : ''}${(r.gap * 100).toFixed(1)}%</b><span class="num mut">${r.gap >= 0 ? '+' : '−'}₹${inr(Math.abs(r.v - sc))}</span></div><div class="note" style="padding:2px 0 0">${vd[2]} ${implied != null && implied > 0 ? `If materials and conversion are as modelled, this quote carries ${pct(implied, 0)} for overheads and margin (modelled ${pct(1 - direct, 0)}).` : ''}</div>` : ''}</div>`; };
  return `<div class="hd"><b>Quote vs should-cost</b><button class="btn sm" data-qc="add">Add quote</button></div>
    <div class="note" style="padding:0 0 8px">Enter supplier quotes in the same basis as the headline price (${esc(c.label)}). Should-cost: <b class="num">₹${inr(sc, sc < 1000 ? 2 : 0)}</b>.</div>
    ${rows.length ? res.map(line).join('') : '<div class="note">No quotes yet. Add one to see the gap, a verdict and the implied overhead and margin.</div>'}
    ${valid.length > 1 ? `<div class="note num" style="padding:8px 0 0">Lowest ₹${inr(lo, lo < 1000 ? 2 : 0)} · highest ₹${inr(hi, hi < 1000 ? 2 : 0)} · spread ${((hi / lo - 1) * 100).toFixed(0)}% · lowest is ${(lo / sc - 1) * 100 >= 0 ? '+' : ''}${((lo / sc - 1) * 100).toFixed(1)}% to should-cost</div>` : ''}
    ${valid.length ? `<div class="note" style="padding:6px 0 0">Suggested counter-offer: should-cost plus 3% = <b class="num">₹${inr(sc * 1.03, sc < 1000 ? 2 : 0)}</b>. Walk-away guide: should-cost plus 12% = <b class="num">₹${inr(sc * 1.12, sc < 1000 ? 2 : 0)}</b>.</div>` : ''}`;
}
let installed = false;
export function installInsights() {
  if (installed) return; installed = true;
  const refresh = () => { const el = document.getElementById('qc'); if (el && last) el.innerHTML = quoteBody(last); };
  document.addEventListener('change', (e) => {
    const t = e.target.closest('select[data-lc]'); if (!t || !lastParts) return; let L = loadLoc(); L[t.dataset.lc] = t.value; try { localStorage.setItem(LK, JSON.stringify(L)); } catch { /* ignore */ }
    const el = document.getElementById('lc'); if (el) el.innerHTML = locationBody();
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-qc]'); if (!t || !last) return; const q = loadQ(), id = `${last.key}|${last.label}`; q[id] ||= [];
    if (t.dataset.qc === 'add') q[id].push({ name: `Supplier ${String.fromCharCode(65 + q[id].length)}`, v: 0 });
    else if (t.dataset.qc === 'del') q[id].splice(+t.dataset.i, 1); else return;
    saveQ(q); refresh();
  });
  document.addEventListener('change', (e) => {
    const t = e.target.closest('input[data-qc]'); if (!t || !last) return; const q = loadQ(), id = `${last.key}|${last.label}`; q[id] ||= []; const r = q[id][+t.dataset.i]; if (!r) return;
    if (t.dataset.qc === 'name') r.name = t.value; else if (t.dataset.qc === 'v') r.v = parseFloat(t.value) || 0; saveQ(q); refresh();
  });
}
