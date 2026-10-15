import { makePkg } from '../mfg/pkg.js';
import { lightDefault, computeLight, FIX, CONTROLS } from './calc.js';
import { scene3, lineSVG, sweep, n } from '../mfg/s3.js';
export { lightDefault };
export const lightDef = makePkg({
  noun: 'lighting area', qtyLabel: 'areas', groups: ['Luminaires', 'Poles and mounting', 'Wiring and distribution', 'Controls and emergency', 'Installation and test'], pill: 'LED',
  calcNote: 'Fixtures = lux × area ÷ (lumens × utilisation × maintenance factor); mounting height lowers the utilisation factor; poles carry two fixtures each.', sectionLabel: 'Cost vs illuminance', sectionHint: 'Cost against target lux',
  intro: 'The lumen method gives the fixture count for the target lux; each fixture then carries mounting, wiring, earthing, controls and its share of distribution boards. Engineering, overheads and margin are grossed up on the selling price.',
  units: { unit: { label: '₹/area', dec: 0, fn: (v) => v }, m2: { label: '₹/m²', dec: 0, fn: (v, r) => v / r.cfg.area }, fix: { label: '₹/fixture', dec: 0, fn: (v, r) => v / r.n } },
  fields: (c) => [{ k: 'fixture', label: 'Luminaire', sel: Object.entries(FIX).map(([k, t]) => [k, t.label]), sec: 'Luminaire' }, { k: 'controls', label: 'Controls', sel: Object.entries(CONTROLS).map(([k, t]) => [k, t[0]]), sec: 'Luminaire' },
    { k: 'area', label: 'Area to light', unit: 'm²', sec: 'Space' }, { k: 'lux', label: 'Illuminance on working plane', unit: 'lux', sec: 'Space' }, { k: 'height', label: 'Mounting height', unit: 'm', step: 0.5, sec: 'Space' }, { k: 'utilisation', label: 'Utilisation factor (0 = automatic)', step: 0.01, sec: 'Space' }],
  compute: computeLight, defaults: lightDefault,
  rates: (T, c) => [{ label: `${FIX[c.fixture].label}`, path: '', value: FIX[c.fixture].price, unit: '₹ each', ro: true }, { label: 'Fixture wiring', path: 'wiring', value: T.wiring, unit: '₹/fixture' }, { label: 'Distribution board', path: 'ldb', value: T.ldb, unit: '₹' }, { label: 'Maintenance factor', path: 'mf', value: T.mf, unit: '' }],
  batchCols: [['Luminaire', (c) => FIX[c.fixture].label], ['Area m²', (c) => Number(c.area).toLocaleString('en-IN'), 1], ['Lux', (c) => c.lux, 1], ['Fixtures', (c, r) => r.n, 1], ['kW', (c, r) => r.kw.toFixed(1), 1]],
  section: (r, T) => lineSVG(r.cfg.tag, `${FIX[r.cfg.fixture].label}: cost against target illuminance`, sweep(r.cfg, 'lux', [0.25, 0.5, 0.75, 1, 1.5, 2, 3], computeLight, T), { x: r.cfg.lux, y: r.total, label: `${r.cfg.lux} lux · ₹${n(r.total / 1e5, 1)} lakh` }, 'Illuminance, lux', '₹ lakh', (v) => n(v / 1e5, 1)),
  scene(r) { const s = scene3(), cols = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(r.n)))), rows = Math.min(6, Math.max(1, Math.ceil(Math.min(r.n, 40) / cols))), pole = FIX[r.cfg.fixture].pole; s.box(cols * 1.6 + 1, 0.05, rows * 1.6 + 1, 0, 0.02, 0, 0x8a8f78);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const x = (i - (cols - 1) / 2) * 1.6, z = (j - (rows - 1) / 2) * 1.6; if (pole) { s.cyl(0.04, 0.06, 2.6, x, 1.3, z, 0x9aa3ad); s.box(0.5, 0.08, 0.25, x, 2.65, z, 0xf4d35e); } else { s.cyl(0.015, 0.015, 0.6, x, 2.4, z, 0x666666); s.cyl(0.3, 0.12, 0.2, x, 2.05, z, 0xf4d35e); } }
    return s.fit(6, 2.4); },
});
