// Shared access to the common commodity price file (commodity-prices.js, loaded before each dashboard) and
// a small binder that lets a dashboard run on a chosen month instead of its own manual prices.

const LOCAL_KEY = 'scm-prices-local';
export function loadPrices() {
  let d = typeof window !== 'undefined' ? window.COMMODITY_PRICES : null, local = false;
  try { const l = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null'); if (l && l.months) { d = l; local = true; } } catch { /* no storage */ }
  return d && d.months ? { ...d, local } : null;
}
export const PRICES = loadPrices();
export const hasPrices = () => !!PRICES && Object.keys(PRICES.months).length > 0;
export const monthKeys = () => (PRICES ? Object.keys(PRICES.months).sort().reverse() : []);
export const monthLabel = (k) => { const [y, m] = k.split('-'); return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m - 1]} ${y}`; };
export const priceOf = (month, id) => PRICES?.months?.[month]?.[id];
export const meta = (id) => PRICES?.commodities?.[id];
export const series = (id) => monthKeys().slice().reverse().map((k) => [k, PRICES.months[k][id]]).filter((x) => typeof x[1] === 'number');
export const LOCAL_STORAGE_KEY = LOCAL_KEY;

/** tiny inline trend line for one commodity, with a dot on the selected month */
export function spark(id, month, w = 70, h = 18) {
  if (!hasPrices()) return '';
  const s = series(id); if (s.length < 2) return '';
  const vs = s.map((x) => x[1]), lo = Math.min(...vs), hi = Math.max(...vs), rng = hi - lo || 1;
  const x = (i) => (i / (s.length - 1)) * (w - 4) + 2, y = (v) => h - 2 - ((v - lo) / rng) * (h - 4);
  const idx = s.findIndex((q) => q[0] === month);
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="#94a3b8" stroke-width="1.4" points="${s.map((q, i) => `${x(i).toFixed(1)},${y(q[1]).toFixed(1)}`).join(' ')}"/>${idx >= 0 ? `<circle cx="${x(idx).toFixed(1)}" cy="${y(s[idx][1]).toFixed(1)}" r="2.8" fill="#2563eb"/>` : ''}</svg>`;
}

/**
 * map: [{ id: commodity id, key: unique key, get(), set(v) }]  — the dashboard inputs that take their price from a commodity.
 * Mode is 'manual' (the dashboard's own prices) or a month key such as '2026-09'. Manual values are backed up while a month is applied.
 */
export function createPriceBinder(storeKey, map) {
  const SK = `scm-pb-${storeKey}`;
  let st = { mode: 'manual', backup: {} };
  try { const v = JSON.parse(localStorage.getItem(SK) || 'null'); if (v) st = v; } catch { /* ignore */ }
  const save = () => { try { localStorage.setItem(SK, JSON.stringify(st)); } catch { /* ignore */ } };
  const covered = (m) => priceOf(st.mode, m.id) != null;
  const apply = () => { for (const m of map) { const v = priceOf(st.mode, m.id); if (typeof v === 'number') m.set(v); } };
  const b = {
    get mode() { return st.mode; },
    get label() { return st.mode === 'manual' ? 'Manual' : monthLabel(st.mode); },
    isMonth: () => st.mode !== 'manual',
    /** call once after the dashboard state has loaded */
    init() { if (st.mode !== 'manual' && !hasPrices()) { st = { mode: 'manual', backup: {} }; save(); } else if (st.mode !== 'manual') { if (!PRICES.months[st.mode]) { b.restore(); } else apply(); } },
    restore() { for (const m of map) if (st.backup[m.key] != null) (m.restore || m.set)(st.backup[m.key]); st = { mode: 'manual', backup: {} }; save(); },
    setMode(mode) {
      if (mode === st.mode) return;
      if (mode === 'manual') return b.restore();
      if (st.mode === 'manual') { st.backup = Object.fromEntries(map.map((m) => [m.key, m.get()])); }
      st.mode = mode; apply(); save();
    },
    /** a price was edited by hand: keep the values on screen and treat them as manual from now on */
    ensureManual() { if (st.mode !== 'manual') { st = { mode: 'manual', backup: {} }; save(); return true; } return false; },
    covers: (id) => st.mode !== 'manual' && priceOf(st.mode, id) != null,
  };
  return b;
}

/** <select> for the top bar */
export function priceSelectHtml(binder) {
  if (!hasPrices()) return `<span class="chip-note" title="commodity-prices.js was not found next to this page">No price file</span>`;
  const opts = [`<option value="manual" ${binder.mode === 'manual' ? 'selected' : ''}>Manual · workbook prices</option>`, ...monthKeys().map((k) => `<option value="${k}" ${binder.mode === k ? 'selected' : ''}>${monthLabel(k)}</option>`)];
  return `<label class="pricesel"><span>Prices</span><select class="select" id="pmonth" aria-label="Commodity price month">${opts.join('')}</select>${PRICES.sample ? '<span class="samplechip" title="The price file holds an illustrative series. Replace it with real prices.">sample data</span>' : ''}${PRICES.local ? '<span class="samplechip" style="background:#e0ecff;color:#1d4ed8" title="Using prices saved in this browser from the price editor">local edits</span>' : ''}</label>`;
}
