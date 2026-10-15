import { makePkg } from '../mfg/pkg.js';
import { hangerDefault, computeHanger, SERVICE } from './calc.js';
import { scene3, lineSVG, sweep, n } from '../mfg/s3.js';
export { hangerDefault };
export const hangerDef = makePkg({
  noun: 'pipe support run', qtyLabel: 'runs', groups: ['Structural supports', 'Bought-out hangers', 'Fabrication and finish', 'Erection and design'], pill: 'Supports', pricePaths: ['steelRate'],
  ratesTitle: 'Rates · steel, hangers and labour', ratesNote: 'Not from a workbook: spacing follows standard practice; weights and prices are assumptions. Steel follows the common commodity file.',
  calcNote: 'Support count = run length ÷ spacing (by pipe size, tighter for hot or insulated lines); each support type is weighed from pipe size; hot service adds spring and constant-effort hangers.', sectionLabel: 'Cost vs pipe size', sectionHint: 'Cost against pipe size for the same run',
  intro: 'The run is divided into supports by standard spacing; rigid hangers, shoes, guides and anchors are weighed and priced as fabricated steel; spring and constant-effort hangers are bought-out units. Engineering, overheads and margin are grossed up on the selling price.',
  units: { unit: { label: '₹/run', dec: 0, fn: (v) => v }, m: { label: '₹/m of pipe', dec: 0, fn: (v, r) => v / r.cfg.length }, sup: { label: '₹/support', dec: 0, fn: (v, r) => v / r.N }, kg: { label: '₹/kg steel', dec: 0, fn: (v, r) => v / r.steelKg } },
  fields: (c) => [{ k: 'dn', label: 'Pipe size', unit: 'DN', step: 5, sec: 'Pipe run' }, { k: 'length', label: 'Run length', unit: 'm', sec: 'Pipe run' }, { k: 'service', label: 'Service', sel: Object.entries(SERVICE).map(([k, t]) => [k, t.label]), sec: 'Pipe run' }, { k: 'insulated', label: 'Insulation', seg: [['No', 'Bare'], ['Yes', 'Insulated']], sec: 'Pipe run' },
    { k: 'placement', label: 'Location', seg: [['Indoor', 'Indoor'], ['Outdoor', 'Outdoor']], sec: 'Pipe run' }],
  compute: computeHanger, defaults: hangerDefault,
  rates: (T) => [{ label: 'Structural steel', path: 'steelRate', value: T.steelRate, unit: '₹/kg', cid: 'hr_plate', price: true }, { label: 'Fabrication', path: 'fab', value: T.fab, unit: '₹/kg' }, { label: 'Variable-spring hanger, DN100', path: 'spring', value: T.spring, unit: '₹' }, { label: 'Constant-effort hanger, DN100', path: 'constant', value: T.constant, unit: '₹' }],
  batchCols: [['DN', (c) => c.dn, 1], ['Length m', (c) => Number(c.length).toLocaleString('en-IN'), 1], ['Service', (c) => c.service], ['Supports', (c, r) => r.N, 1], ['Steel kg', (c, r) => Math.round(r.steelKg).toLocaleString('en-IN'), 1]],
  section: (r, T) => lineSVG(r.cfg.tag, `${r.cfg.length.toLocaleString('en-IN')} m run, ${SERVICE[r.cfg.service].label.split(',')[0].toLowerCase()}: cost against pipe size`, sweep(r.cfg, 'dn', [0.25, 0.4, 0.6, 0.8, 1, 1.5, 2, 3], (c, T2) => computeHanger({ ...c, dn: Math.max(15, Math.round(c.dn)) }, T2), T), { x: r.cfg.dn, y: r.total, label: `DN${r.cfg.dn} · ₹${n(r.total / 1e5, 1)} lakh` }, 'Pipe size, DN', '₹ lakh', (v) => n(v / 1e5, 1)),
  scene(r) { const s = scene3(), k = Math.min(1.4, 0.4 + r.cfg.dn / 500), nS = Math.min(7, r.N); s.cyl(0.25 * k, 0.25 * k, 8, 0, 1.6, 0, r.cfg.insulated === 'Yes' ? 0xd8dbe0 : 0x9aa6b2, [0, 0, Math.PI / 2]); s.box(8.5, 0.08, 0.1, 0, 3.0, 0, 0x5b6573);
    for (let i = 0; i < nS; i++) { const x = (i - (nS - 1) / 2) * 7 / Math.max(1, nS - 1); s.cyl(0.02, 0.02, 1.3, x, 2.3, 0, 0x777777); if (r.cfg.service !== 'cold' && i % 3 === 1) s.cyl(0.14, 0.14, 0.45, x, 2.55, 0, 0xd98a3d); s.box(0.5 * k, 0.04, 0.3 * k, x, 1.3 * k - 0.1, 0, 0xc27a2c); if (i % 3 === 0) { s.box(0.1, 1.2, 0.1, x + 0.3, 0.6, 0, 0x6f7b88); s.box(0.5, 0.06, 0.3, x, 1.35 * k - 0.35, 0, 0x6f7b88); } } return s.fit(7, 1.6, [0.7, 0.4, 1.2]); },
});
