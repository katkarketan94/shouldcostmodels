// Statistics for the commodity price view: log-linear trend with forecast band, seasonality by calendar month, return correlations and pass-through regression.
export const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
export function linfit(x, y) {
  const n = x.length, mx = mean(x), my = mean(y); let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
  const b = sxx ? sxy / sxx : 0, a = my - b * mx, sse = y.reduce((s, v, i) => s + (v - a - b * x[i]) ** 2, 0), r2 = syy ? 1 - sse / syy : 0, sd = n > 2 ? Math.sqrt(sse / (n - 2)) : 0;
  return { a, b, r2, sd, n, mx, sxx };
}
export const seriesOf = (months, id) => Object.keys(months).sort().map((k, i) => ({ k, i, v: months[k][id] })).filter((p) => typeof p.v === 'number' && p.v > 0);
const monthIndex = (k) => { const [y, m] = k.split('-').map(Number); return y * 12 + (m - 1); };
export const addMonths = (k, n) => { const t = monthIndex(k) + n, y = Math.floor(t / 12), m = t % 12; return `${y}-${String(m + 1).padStart(2, '0')}`; };

/** log-linear trend on calendar-month time, with a forecast band (prediction interval, 1.96 sd) */
export function trend(months, id, horizon = 6) {
  const s = seriesOf(months, id); if (s.length < 6) return null;
  const t0 = monthIndex(s[0].k), x = s.map((p) => monthIndex(p.k) - t0), y = s.map((p) => Math.log(p.v)), f = linfit(x, y), last = x[x.length - 1];
  const fit = s.map((p, i) => ({ k: p.k, v: Math.exp(f.a + f.b * x[i]) }));
  const fc = Array.from({ length: horizon }, (_, j) => { const xt = last + j + 1, se = f.sd * Math.sqrt(1 + 1 / f.n + (xt - f.mx) ** 2 / (f.sxx || 1)), mid = f.a + f.b * xt; return { k: addMonths(s[s.length - 1].k, j + 1), v: Math.exp(mid), lo: Math.exp(mid - 1.96 * se), hi: Math.exp(mid + 1.96 * se) }; });
  return { s, fit, fc, annual: Math.exp(f.b * 12) - 1, r2: f.r2, sd: f.sd, n: f.n, f };
}
/** seasonal index: mean of price / trend by calendar month, normalised to 1 */
export function seasonality(months, id) {
  const tr = trend(months, id, 0); if (!tr) return null;
  const by = Array.from({ length: 12 }, () => []); tr.s.forEach((p, i) => { by[+p.k.slice(5) - 1].push(p.v / tr.fit[i].v); });
  const raw = by.map((a) => (a.length ? mean(a) : null)), ok = raw.filter((v) => v != null), norm = mean(ok);
  const idx = raw.map((v, m) => ({ m, v: v == null ? null : v / norm, n: by[m].length, sd: by[m].length > 1 ? Math.sqrt(mean(by[m].map((q) => (q / (raw[m] || 1) - 1) ** 2))) : 0 }));
  const amp = Math.max(...idx.filter((o) => o.v).map((o) => Math.abs(o.v - 1)));
  return { idx, years: tr.n / 12, amp, minObs: Math.min(...idx.map((o) => o.n)), strongest: idx.filter((o) => o.v).sort((a, b) => b.v - a.v)[0], weakest: idx.filter((o) => o.v).sort((a, b) => a.v - b.v)[0] };
}
/** month-on-month % changes for a commodity, keyed by month */
export function returns(months, id) { const s = seriesOf(months, id), r = {}; for (let i = 1; i < s.length; i++) if (monthIndex(s[i].k) - monthIndex(s[i - 1].k) === 1) r[s[i].k] = s[i].v / s[i - 1].v - 1; return r; }
export function pairStats(months, yId, xId) {
  const ry = returns(months, yId), rx = returns(months, xId), ks = Object.keys(ry).filter((k) => k in rx); if (ks.length < 8) return null;
  const x = ks.map((k) => rx[k]), y = ks.map((k) => ry[k]), f = linfit(x, y), r = Math.sign(f.b) * Math.sqrt(Math.max(0, f.r2));
  return { beta: f.b, alpha: f.a, r2: f.r2, r, n: ks.length, pts: ks.map((k, i) => ({ k, x: x[i], y: y[i] })) };
}
export function corrMatrix(months, ids) { return ids.map((a) => ids.map((b) => (a === b ? { r: 1, n: 0 } : (() => { const p = pairStats(months, a, b); return p ? { r: p.r, n: p.n } : null; })()))); }
/** basket index: fixed share + sum weight_i * price_i(t) / price_i(base), for every month with all prices present */
export function basketIndex(months, weights, base) {
  const ids = Object.keys(weights), fixed = 1 - ids.reduce((s, id) => s + weights[id], 0), out = [];
  for (const k of Object.keys(months).sort()) { let v = fixed, ok = true; for (const id of ids) { const p = months[k][id], p0 = months[base]?.[id]; if (!(p > 0) || !(p0 > 0)) { ok = false; break; } v += weights[id] * p / p0; } if (ok) out.push({ k, v }); }
  return out;
}
