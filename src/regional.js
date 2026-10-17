// Access to the regional labour and utility file (regional-costs.js, loaded before each dashboard): wages, electricity, diesel and water by state and month.
const LOCAL_KEY = 'scm-regional-local';
export function loadRegional() {
  let d = typeof window !== 'undefined' ? window.REGIONAL_COSTS : null, local = false;
  try { const l = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); if (l && l.months) { d = l; local = true; } } catch { /* no storage */ }
  return d && d.months ? { ...d, local } : null;
}
export const RC = loadRegional(), LOCAL_STORAGE_KEY = LOCAL_KEY;
export const hasRegional = () => !!RC && Object.keys(RC.months).length > 0;
export const rMonths = () => (RC ? Object.keys(RC.months).sort() : []);
export const rLatest = () => rMonths().slice(-1)[0];
export const regionCodes = () => (RC ? Object.keys(RC.regions) : []);
export const regionName = (c) => (c === 'IN' ? 'India average' : RC?.regions?.[c]?.name || c);
export const seriesIds = () => (RC ? Object.keys(RC.series) : []);
export const SERIES_SHORT = { labour_skilled: 'Skilled labour', labour_unskilled: 'Unskilled labour', electricity_ht: 'Electricity', diesel: 'Diesel', water: 'Water' };
const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
/** value of a series for a state and month; region 'IN' is the plain average of all states in the file */
export function rValue(region, month, id, data = RC) {
  const m = data?.months?.[month]; if (!m) return null;
  if (region === 'IN') { const v = Object.values(m).map((r) => r[id]).filter((x) => typeof x === 'number'); return v.length ? mean(v) : null; }
  const v = m[region]?.[id]; return typeof v === 'number' ? v : null;
}
/** how exposed each cost bucket is to each regional series (shares of the bucket); the rest of the bucket does not move with region or time */
export const EXPOSURE = {
  conv: { labour_skilled: 0.62, labour_unskilled: 0.08, electricity_ht: 0.2, diesel: 0.07, water: 0.03 },
  log: { diesel: 0.6, labour_unskilled: 0.25, labour_skilled: 0.15 },
  oh: { labour_skilled: 0.35 },
  mat: {}, mg: {},
};
/** parts by bucket {mat, conv, log, oh, mg} in any unit; from/to {region, month}. Returns the factor on the whole price and a per-series breakdown. */
export function locationAdjust(byBucket, from, to, data = RC) {
  const total = Object.values(byBucket).reduce((s, v) => s + v, 0) || 1, ratio = {}, effect = {};
  for (const id of Object.keys(RC?.series || data?.series || {})) { const a = rValue(from.region, from.month, id, data), b = rValue(to.region, to.month, id, data); ratio[id] = a > 0 && b > 0 ? b / a : 1; effect[id] = 0; }
  let delta = 0;
  for (const [b, ex] of Object.entries(EXPOSURE)) for (const [id, w] of Object.entries(ex)) { const d = (byBucket[b] || 0) * w * ((ratio[id] ?? 1) - 1); effect[id] = (effect[id] || 0) + d; delta += d; }
  return { factor: 1 + delta / total, delta, ratio, effect, total };
}
