// Writes site/commodity-prices.js with a SAMPLE series (a seeded random walk that ends at the base values the cost-model workbooks use).
// Replace the numbers with real monthly prices; keep the structure. Run only to regenerate the sample.
import { writeFileSync } from 'node:fs';

const COMMODITIES = {
  copper:           { name: 'Copper (conductor grade)', unit: '₹/kg', group: 'Metals', base: 1400, vol: 0.030, models: 'Power cables, busduct' },
  aluminium:        { name: 'Aluminium (conductor grade)', unit: '₹/kg', group: 'Metals', base: 349, vol: 0.025, models: 'Power cables, busduct' },
  zinc:             { name: 'Zinc (galvanising)', unit: '₹/kg', group: 'Metals', base: 425.6, vol: 0.030, models: 'Cable trays, galvanised pipes' },
  xlpe:             { name: 'XLPE compound', unit: '₹/kg', group: 'Polymers', base: 125, vol: 0.015, models: 'Power cables' },
  pvc:              { name: 'PVC compound', unit: '₹/kg', group: 'Polymers', base: 100, vol: 0.015, models: 'Power cables' },
  steel_wire:       { name: 'Galvanised steel wire / strip (armour)', unit: '₹/kg', group: 'Steel', base: 68, vol: 0.012, models: 'Power cables' },
  gi_sheet:         { name: 'GI sheet (enclosure)', unit: '₹/kg', group: 'Steel', base: 68, vol: 0.012, models: 'Busduct' },
  al_sheet:         { name: 'Aluminium sheet (enclosure)', unit: '₹/kg', group: 'Metals', base: 360, vol: 0.022, models: 'Busduct' },
  ms_sheet:         { name: 'MS sheet (tray fabrication)', unit: '₹/kg', group: 'Steel', base: 73, vol: 0.012, models: 'Cable trays' },
  structural_steel: { name: 'Structural steel, rolled sections and plate', unit: '₹/t', group: 'Steel', base: 64785, vol: 0.012, models: 'Structural steel & PEB' },
  copper_tube:      { name: 'Copper tube (coil / heat exchanger)', unit: '₹/kg', group: 'Metals', base: 1400, vol: 0.030, models: 'AHU & FCU, chillers' },
  al_fin:           { name: 'Aluminium fin stock', unit: '₹/kg', group: 'Metals', base: 260, vol: 0.022, models: 'AHU & FCU, chillers' },
  gi_hvac:          { name: 'GI sheet (HVAC casing and duct)', unit: '₹/kg', group: 'Steel', base: 80, vol: 0.012, models: 'AHU & FCU, chillers, ducting' },
  precoated_gi:     { name: 'Pre-coated GI sheet', unit: '₹/kg', group: 'Steel', base: 95, vol: 0.012, models: 'AHU & FCU, ducting' },
  ss304:            { name: 'Stainless steel 304 sheet', unit: '₹/kg', group: 'Steel', base: 260, vol: 0.020, models: 'AHU & FCU, ducting' },
  puf:              { name: 'PUF insulation (polyurethane foam)', unit: '₹/kg', group: 'Insulation', base: 350, vol: 0.015, models: 'AHU & FCU' },
  rockwool:         { name: 'Rockwool insulation', unit: '₹/kg', group: 'Insulation', base: 85, vol: 0.012, models: 'AHU & FCU' },
  ms_plate:         { name: 'MS / carbon steel plate (pipe raw material)', unit: '₹/kg', group: 'Steel', base: 49, vol: 0.012, models: 'Pipes' },
  pig_iron:         { name: 'Pig iron (ductile iron pipes)', unit: '₹/kg', group: 'Steel', base: 40.5, vol: 0.015, models: 'Pipes' },
  ss304_rm:         { name: 'Stainless 304 plate (pipe raw material)', unit: '₹/kg', group: 'Steel', base: 203, vol: 0.020, models: 'Pipes' },
  ss316_rm:         { name: 'Stainless 316 plate (pipe raw material)', unit: '₹/kg', group: 'Steel', base: 354, vol: 0.022, models: 'Pipes' },
  hdpe_resin:       { name: 'HDPE PE100 resin', unit: '₹/kg', group: 'Polymers', base: 108, vol: 0.015, models: 'Pipes' },
  pvc_resin:        { name: 'PVC-U pipe compound', unit: '₹/kg', group: 'Polymers', base: 82, vol: 0.015, models: 'Pipes' },
  ppr_resin:        { name: 'PP-R resin', unit: '₹/kg', group: 'Polymers', base: 135, vol: 0.015, models: 'Pipes' },
  cpvc_resin:       { name: 'CPVC compound', unit: '₹/kg', group: 'Polymers', base: 215, vol: 0.018, models: 'Pipes' },
  hr_plate:         { name: 'HR plate and sheet (fabrication)', unit: '₹/kg', group: 'Steel', base: 68, vol: 0.012, models: 'DG sets' },
  crca_sheet:       { name: 'CRCA sheet', unit: '₹/kg', group: 'Steel', base: 76, vol: 0.012, models: 'DG sets' },
  ismc_section:     { name: 'Structural channel (ISMC)', unit: '₹/kg', group: 'Steel', base: 66, vol: 0.012, models: 'DG sets' },
};
let seed = 20260930; const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
const gauss = () => { let s = 0; for (let i = 0; i < 6; i++) s += rnd(); return (s - 3) / 0.7071; };
const months = [];
for (let y = 2024, m = 10, i = 0; i < 24; i++) { months.push(`${y}-${String(m).padStart(2, '0')}`); if (++m > 12) { m = 1; y++; } }
const out = {};
for (const k of months) out[k] = {};
for (const [id, c] of Object.entries(COMMODITIES)) {
  let v = c.base; const series = [v];
  for (let i = months.length - 2; i >= 0; i--) { v *= 1 + 0.002 + c.vol * gauss(); series.unshift(v); }  // walk backwards from the base month
  months.forEach((k, i) => { out[k][id] = +(c.base >= 1000 ? Math.round(series[i] / 5) * 5 : series[i].toFixed(c.base < 100 ? 2 : 1)); });
}
const meta = Object.fromEntries(Object.entries(COMMODITIES).map(([id, c]) => [id, { name: c.name, unit: c.unit, group: c.group, models: c.models }]));
const file = `// Common commodity prices for all should-cost dashboards. Edit this file (or use commodity-prices.html) and reload.
// "sample": true marks the numbers below as ILLUSTRATIVE: a seeded random walk ending at the base prices used in the workbooks.
// Replace them with real monthly prices, then set "sample" to false.
window.COMMODITY_PRICES = ${JSON.stringify({ version: 1, currency: 'INR', updated: '2026-10-09', sample: true, note: 'Sample series for demonstration. Replace with actual monthly prices.', commodities: meta, months: out }, null, 1)};
`;
writeFileSync('site/commodity-prices.js', file);
console.log('wrote site/commodity-prices.js', months.length, 'months,', Object.keys(meta).length, 'commodities');
