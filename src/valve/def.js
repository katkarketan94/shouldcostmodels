import { makePkg } from '../mfg/pkg.js';
import { valveDefault, computeValve, VTYPES, CLASS, VMAT, ACT } from './calc.js';
import { scene3, lineSVG, sweep, n } from '../mfg/s3.js';
export { valveDefault };
export const valveDef = makePkg({
  noun: 'valve', qtyLabel: 'valve lots', typeTitle: 'Valve type', types: VTYPES, groups: ['Body and bonnet', 'Trim and internals', 'Actuation', 'Test and packing'], pill: 'Valve',
  calcNote: 'Body mass = reference mass × (DN ÷ 100)^2.2 × class factor × material factor; price = mass × material rate × type complexity; actuators scale with valve mass.', sectionLabel: 'Cost vs size', sectionHint: 'Cost of one valve against nominal size',
  intro: 'Each row is one valve specification with its quantity. Body cost follows mass, material rate and type; trim, actuator, testing and packing are added. Engineering, overheads and margin are grossed up on the selling price.',
  units: { lot: { label: '₹/lot', dec: 0, fn: (v) => v }, each: { label: '₹/valve', dec: 0, fn: (v, r) => v / r.q }, kg: { label: '₹/kg of body', dec: 0, fn: (v, r) => v / (r.w * r.q) } },
  fields: (c) => [{ k: 'dn', label: 'Nominal size', unit: 'DN', step: 5, sec: 'Specification' }, { k: 'cls', label: 'Pressure class', seg: Object.keys(CLASS).map((k) => [Number(k), k]), sec: 'Specification' }, { k: 'mat', label: 'Body material', sel: Object.entries(VMAT).map(([k, t]) => [k, t[0]]), sec: 'Specification' }, { k: 'end', label: 'End connection', seg: [['Flanged', 'Flanged'], ['Butt-weld', 'Butt-weld']], sec: 'Specification' },
    { k: 'trim', label: 'Seat and trim', seg: [['std', 'Standard'], ['hard', '13Cr hard'], ['stellite', 'Stellite']], sec: 'Specification' }, { k: 'act', label: 'Operation', sel: Object.entries(ACT).map(([k, t]) => [k, t[0]]), sec: 'Operation' }, { k: 'qty', label: 'Quantity', step: 1, sec: 'Operation' }],
  compute: computeValve, defaults: valveDefault,
  rates: (T, c) => [{ label: `${VMAT[c.mat][0]}, finished body`, path: '', value: VMAT[c.mat][1], unit: '₹/kg', ro: true }, { label: 'Size exponent', path: 'sizeExp', value: T.sizeExp, unit: '' }, { label: 'Test and certificates', path: 'perUnitCert', value: T.perUnitCert, unit: '₹/valve' }, { label: 'Control trim base', path: 'ctrlTrim', value: T.ctrlTrim, unit: '₹' }],
  batchCols: [['Type', (c) => VTYPES[c.type].label.split(',')[0]], ['DN', (c) => c.dn, 1], ['Class', (c) => c.cls, 1], ['Qty', (c) => c.qty, 1], ['Each ₹', (c, r) => Math.round(r.unit).toLocaleString('en-IN'), 1]],
  section: (r, T) => lineSVG(r.cfg.tag, `${VTYPES[r.cfg.type].label}, class ${r.cfg.cls}: cost of one valve against size`, sweep({ ...r.cfg, qty: 1 }, 'dn', [0.25, 0.4, 0.6, 0.8, 1, 1.5, 2, 3], (c, T2) => computeValve({ ...c, dn: Math.max(15, Math.round(c.dn)) }, T2), T), { x: r.cfg.dn, y: r.unit, label: `DN${r.cfg.dn} · ₹${n(r.unit / 1e3, 0)} thousand each` }, 'Nominal size, DN', '₹ thousand', (v) => n(v / 1e3, 0)),
  scene(r) { const s = scene3(), k = Math.min(1.6, 0.5 + r.cfg.dn / 400), t = r.cfg.type; s.cyl(0.22 * k, 0.22 * k, 3.2 * k, 0, 0.9 * k, 0, 0x9aa6b2, [0, 0, Math.PI / 2]); s.cyl(0.38 * k, 0.38 * k, 0.14 * k, -0.9 * k, 0.9 * k, 0, 0x7e8794, [0, 0, Math.PI / 2]); s.cyl(0.38 * k, 0.38 * k, 0.14 * k, 0.9 * k, 0.9 * k, 0, 0x7e8794, [0, 0, Math.PI / 2]);
    if (t === 'ball') s.sph(0.55 * k, 0, 0.9 * k, 0, 0x2f6fb0); else if (t === 'bfly') s.cyl(0.5 * k, 0.5 * k, 0.4 * k, 0, 0.9 * k, 0, 0x2f6fb0, [0, 0, Math.PI / 2]); else s.box(0.9 * k, 0.9 * k, 0.8 * k, 0, 0.9 * k, 0, 0x2f6fb0); s.cyl(0.08 * k, 0.08 * k, 1.3 * k, 0, 1.9 * k, 0, 0xb8c0cc);
    if (r.cfg.act === 'manual') s.cyl(0.4 * k, 0.4 * k, 0.05 * k, 0, 2.6 * k, 0, 0xc0392b); else s.box(0.7 * k, 0.7 * k, 0.7 * k, 0, 2.4 * k, 0, r.cfg.act === 'electric' ? 0x2fbf71 : 0xd98a3d); return s.fit(5, 1.6); },
});
