// Shared pieces for the weight- and capacity-based equipment models: the engineering / overhead / margin gross-up and the cost-anatomy table.
export const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const STACK = { engineering: 0.03, overheads: 0.05, margin: 0.08, misc: 0.01 };
const PALETTE = ['#2563eb', '#c27a2c', '#8b5cf6', '#0ea5a4', '#94a3b8', '#e8b923', '#7c6fd6', '#64748b', '#b08968', '#0f9d6b'];
export const mkParts = (groups) => [...groups, 'Engineering', 'Overheads', 'Supervision, spares', 'Margin'].map((k, i) => [k, PALETTE[i % PALETTE.length]]);
export const adder = (lines) => (group, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, label, qty: R2(qty), unit, rate, amount: qty * rate, note }); };
export function finish(lines, st) {
  const base = lines.reduce((s, l) => s + l.amount, 0), load = st.engineering + st.overheads + st.margin + st.misc, total = base / (1 - load), parts = {};
  lines.forEach((l) => { parts[l.group] = (parts[l.group] || 0) + l.amount; });
  parts.Engineering = total * st.engineering; parts.Overheads = total * st.overheads; parts['Supervision, spares'] = total * st.misc; parts.Margin = total * st.margin;
  return { base, total, parts, pm: parts };
}
export const stackRows = (T, P) => [P('stack.engineering', 'Engineering', T.stack.engineering, '%', 100), P('stack.overheads', 'Overheads', T.stack.overheads, '%', 100), P('stack.margin', 'Margin', T.stack.margin, '%', 100), P('stack.misc', 'Supervision, spares', T.stack.misc, '%', 100)];
export const costRows = (r, f) => [['#', 'Cost lines (₹)'], ...r.lines.map((l) => [l.label, f(l.amount, 0)]), ['Direct cost', f(r.base, 0)], ['Engineering', f(r.pm.Engineering, 0)], ['Overheads', f(r.pm.Overheads, 0)], ['Supervision, spares', f(r.pm['Supervision, spares'], 0)], ['Margin', f(r.pm.Margin, 0)], ['Total', f(r.total, 0)]];
export function anatomy(r, h, title, intro) {
  const { nf } = h, groups = {}; r.lines.forEach((l) => { (groups[l.group] ||= []).push(l); });
  let run = 0; const wf = r.parts.filter((p) => p.v > 0).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  const lot = (l) => l.unit === 'lot' || l.unit === 'set';
  return `<div class="h3">${title}</div><p class="p">${intro}</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Cost</th><th>Share</th></tr></thead><tbody>${Object.entries(groups).map(([g, ls]) => { const tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="5" class="grp2"><b>${g}</b> ₹${nf(tot)}</td></tr>${ls.map((l) => `<tr><td>${l.label}${l.note ? ` <small>${l.note}</small>` : ''}</td><td class="r">${lot(l) ? '–' : `${nf(l.qty, l.qty < 10 ? 2 : 0)} ${l.unit}`}</td><td class="r">${lot(l) ? '–' : nf(l.rate)}</td><td class="r">₹${nf(l.amount)}</td><td><div class="bar"><i style="width:${l.amount / tot * 100}%"></i></div></td></tr>`).join('')}`; }).join('')}
    <tr><td colspan="5" class="grp2"><b>Engineering, overheads, supervision and margin</b></td></tr>${['Engineering', 'Overheads', 'Supervision, spares', 'Margin'].map((k) => `<tr><td>${k}</td><td></td><td></td><td class="r">₹${nf(r.pm[k])}</td><td></td></tr>`).join('')}<tr class="total"><td>Should-cost</td><td></td><td></td><td class="r">₹${nf(r.total)}</td><td></td></tr></tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
export const defState = (list, T, unit, qtyUnit = 'unit') => ({ list, sel: 0, unit: qtyUnit, qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(T)) });
