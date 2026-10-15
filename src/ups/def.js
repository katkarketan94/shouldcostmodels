import { makePkg } from '../mfg/pkg.js';
import { upsDefault, computeUps, TOPOLOGY, CHEM, REDUND } from './calc.js';
import { scene3, lineSVG, sweep, n } from '../mfg/s3.js';
export { upsDefault };
export const upsDef = makePkg({
  noun: 'UPS', qtyLabel: 'UPS systems', groups: ['Rectifier / inverter', 'Battery', 'Switchgear and distribution', 'Installation and test'], pill: 'UPS',
  calcNote: 'Converter price scales with kVA to a power; battery energy follows output kW, backup time, depth of discharge, ageing and temperature; redundancy multiplies the hardware.', sectionLabel: 'Cost vs rating', sectionHint: 'Cost against UPS rating',
  intro: 'The converter is priced from kVA with a power law and a topology factor; the battery from the energy needed for the backup time; distribution and bypass follow rating. Engineering, overheads and margin are grossed up on the selling price.',
  units: { unit: { label: '₹/UPS', dec: 0, fn: (v) => v }, kva: { label: '₹/kVA', dec: 0, fn: (v, r) => v / r.cfg.kva }, kwh: { label: '₹/kWh battery', dec: 0, fn: (v, r) => v / Math.max(1, r.kwh) } },
  fields: (c) => [{ k: 'topology', label: 'Topology', sel: Object.entries(TOPOLOGY).map(([k, t]) => [k, t.label]), sec: 'Topology and rating' }, { k: 'kva', label: 'Rating', unit: 'kVA', sec: 'Topology and rating' }, { k: 'pf', label: 'Output power factor', step: 0.01, sec: 'Topology and rating' }, { k: 'redundancy', label: 'Redundancy', sel: Object.entries(REDUND).map(([k, t]) => [k, t[0]]), sec: 'Topology and rating' },
    { k: 'backup', label: 'Backup time', unit: 'min', sec: 'Battery' }, { k: 'chem', label: 'Battery chemistry', seg: Object.entries(CHEM).map(([k]) => [k, k]), sec: 'Battery' }, { k: 'isoTx', label: 'Isolation transformer', seg: [['No', 'None'], ['Yes', 'Fitted']], sec: 'Battery' }],
  compute: computeUps, defaults: upsDefault,
  rates: (T, c) => [{ label: 'Converter constant', path: 'k', value: T.k, unit: '₹ · kVA^0.8' }, { label: `${c.chem} battery`, path: '', value: CHEM[c.chem].rate, unit: '₹/kWh', ro: true }, { label: 'Distribution', path: 'dist', value: T.dist, unit: '₹/kVA' }, { label: 'Installation share', path: 'inst', value: T.inst, unit: '' }],
  batchCols: [['kVA', (c) => c.kva, 1], ['Backup', (c) => `${c.backup} min`, 1], ['Battery', (c) => c.chem], ['kWh', (c, r) => Math.round(r.kwh * r.rd), 1]],
  section: (r, T) => lineSVG(r.cfg.tag, `${TOPOLOGY[r.cfg.topology].label} · ${r.cfg.backup} min ${r.cfg.chem}: cost against rating`, sweep(r.cfg, 'kva', [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4], computeUps, T), { x: r.cfg.kva, y: r.total, label: `${r.cfg.kva} kVA · ₹${n(r.total / 1e5, 1)} lakh` }, 'Rating, kVA', '₹ lakh', (v) => n(v / 1e5, 0)),
  scene(r) { const s = scene3(), k = Math.min(1.6, 0.6 + r.cfg.kva / 600), cab = (x, col) => s.box(1.2 * k, 2.2 * k, 0.9 * k, x, 1.1 * k, 0, col); cab(-1.4 * k, 0x33415a); if (r.rd > 1) cab(-0.1 * k, 0x33415a); for (let i = 0; i < Math.min(4, Math.max(1, Math.round(r.kwh * r.rd / 40))); i++) s.box(1.1 * k, 1.8 * k, 0.9 * k, 1.2 * k + i * 1.15 * k, 0.9 * k, 0, 0x7a8794); s.box(5 * k + 2, 0.04, 2 * k, 1, 0.02, 0, 0x8a8f78); s.box(0.6 * k, 0.3 * k, 0.05, -1.4 * k, 1.8 * k, 0.48 * k, 0x2fbf71); return s.fit(6, 2.4); },
});
