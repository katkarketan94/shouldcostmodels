import '../style.css';
import './index.css';
import { PRICES, hasPrices, monthKeys, monthLabel } from '../prices.js';

const ill = {
  cables: `<svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="34" fill="#26282d"/><circle cx="60" cy="40" r="30" fill="#9aa3ad"/><circle cx="60" cy="40" r="27" fill="#e9dfc6"/><circle cx="60" cy="27" r="9" fill="#d64545"/><circle cx="48" cy="48" r="9" fill="#e8b923"/><circle cx="72" cy="48" r="9" fill="#3b6fd4"/><circle cx="60" cy="27" r="5" fill="#d98a3d"/><circle cx="48" cy="48" r="5" fill="#d98a3d"/><circle cx="72" cy="48" r="5" fill="#d98a3d"/></svg>`,
  trays: `<svg viewBox="0 0 120 80" fill="none" stroke="#5b6573" stroke-width="3" stroke-linecap="round"><path d="M20 66L48 18M44 70L72 22M60 70L100 18" stroke="#8d97a4"/><path d="M14 58h92M22 48h86M30 38h78M38 28h70" stroke="#b3bcc7" stroke-width="2.5"/><path d="M14 60V50M106 60V50" stroke="#8d97a4"/></svg>`,
  busduct: `<svg viewBox="0 0 120 80"><rect x="14" y="16" width="92" height="48" rx="4" fill="#8c96a3"/><rect x="19" y="21" width="82" height="38" fill="#f1f3f6"/><rect x="30" y="26" width="9" height="28" fill="#d64545"/><rect x="43" y="26" width="9" height="28" fill="#e8b923"/><rect x="56" y="26" width="9" height="28" fill="#3b6fd4"/><rect x="69" y="26" width="9" height="28" fill="#2a2d33"/><rect x="82" y="26" width="5" height="28" fill="#1f9d55"/></svg>`,
  structural: `<svg viewBox="0 0 120 80" fill="none" stroke="#2d6cb0" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 68V36L60 12l44 24v32"/><path d="M16 36h88M38 68V30M82 68V30" stroke="#8aa9cc" stroke-width="2.5"/><path d="M16 68h88" stroke="#5b6573"/></svg>`,
  prices: `<svg viewBox="0 0 120 80" fill="none"><path d="M12 64h96M12 14v50" stroke="#c4cad2" stroke-width="2"/><polyline points="14,54 28,46 42,52 56,34 70,40 84,22 98,28 108,16" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="108" cy="16" r="4.5" fill="#2563eb"/><polyline points="14,60 28,58 42,56 56,52 70,54 84,46 98,48 108,42" stroke="#c27a2c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/></svg>`,
  soon: `<svg viewBox="0 0 120 80"><circle cx="60" cy="40" r="30" fill="#d9dde3"/><g fill="#fff"><circle cx="48" cy="32" r="6"/><circle cx="62" cy="30" r="6"/><circle cx="72" cy="42" r="6"/><circle cx="56" cy="48" r="6"/><circle cx="44" cy="44" r="6"/></g></svg>`,
};
const MODELS = [
  { file: 'cables.html', title: 'Power cables', blurb: 'LT 1.1 kV and HT 3.3–33 kV XLPE / PVC cables. Conductor, armour, sheaths, screens and special constructions.', tags: ['LT + HT', '3D cable', 'Low–high range'], ill: 'cables', bg: '#fbf1e4' },
  { file: 'cable-trays.html', title: 'Cable trays', blurb: 'Ladder, perforated and U-trough trays, bends, tees, channels and cantilever arms, with the full BoQ roll-up.', tags: ['10 item types', 'BoQ ₹16.9 Cr', '3D + plan'], ill: 'trays', bg: '#eef1f5' },
  { file: 'busduct.html', title: 'Busduct', blurb: 'Air-insulated, sandwich and fire-rated busduct from 800 to 6,300 A, compared against FY26 purchases.', tags: ['37 specs', 'FY26 benchmark', 'Cutaway'], ill: 'busduct', bg: '#eef3f8' },
  { file: 'structural-steel.html', title: 'Structural steel & PEB', blurb: 'Factory sheds, pipe racks, façades and large-diameter pipes from drawing parameters, with bottom-up erection.', tags: ['5 structures', 'Takeoff', 'Erection model'], ill: 'structural', bg: '#e9f1fb' },
  { file: 'commodity-prices.html', title: 'Commodity prices', blurb: 'The common monthly price file every dashboard reads. View history, edit months and export the file.', tags: ['10 commodities', 'Monthly', 'Shared'], ill: 'prices', bg: '#eef4ff' },
  { file: null, title: 'Control & instrumentation cables', blurb: 'Multi-core, pair and triad cables with screens and drain wires.', tags: ['Needs the workbook'], ill: 'soon', bg: '#f1f2f4' },
];
const priceLine = () => {
  if (!hasPrices()) return '<span class="warnchip">commodity-prices.js not found next to these pages</span>';
  const ks = monthKeys();
  return `<span class="okchip">Price file: ${ks.length} months, latest ${monthLabel(ks[0])}</span>${PRICES.sample ? '<span class="samplechip">sample data</span>' : ''}${PRICES.local ? '<span class="samplechip" style="background:#e0ecff;color:#1d4ed8">local edits</span>' : ''}`;
};
document.querySelector('#app').innerHTML = `
  <div class="wrap">
    <header><div class="eyebrow">Should-cost models</div><h1>Pick a model</h1>
      <p>Each model runs your workbook's own logic and opens as its own dashboard. All of them read one shared monthly commodity price file, so you can re-cost any item at a past month.</p>
      <div class="status">${priceLine()}</div></header>
    <div class="cards">${MODELS.map((m) => `<${m.file ? 'a' : 'div'} class="mcard ${m.file ? '' : 'off'}" ${m.file ? `href="${m.file}"` : ''}>
      <div class="art" style="background:${m.bg}">${ill[m.ill]}</div>
      <div class="body"><h2>${m.title}</h2><p>${m.blurb}</p><div class="tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div></div>
      <div class="go">${m.file ? 'Open →' : 'Coming soon'}</div></${m.file ? 'a' : 'div'}>`).join('')}</div>
    <footer>Open these pages from one folder: they share <code>commodity-prices.js</code>, and each model keeps its own edits in your browser.</footer>
  </div>`;
