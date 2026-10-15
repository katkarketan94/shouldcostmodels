import { makePkg } from '../mfg/pkg.js';
import { liftDefault, computeLift, LTYPES, FINISH } from './calc.js';
import { scene3, lineSVG, sweep, n } from '../mfg/s3.js';
export { liftDefault };
export const liftDef = makePkg({
  noun: 'elevator', qtyLabel: 'installations', typeTitle: 'Lift type', types: LTYPES, groups: ['Machine, drive and control', 'Car and doors', 'Shaft equipment', 'Installation and test'], pill: 'Lift',
  calcNote: 'Machine and car price scale with rated load and speed; each landing adds doors and fixtures; rails, ropes and cables scale with travel.', sectionLabel: 'Cost vs stops', sectionHint: 'Cost against number of stops',
  intro: 'The machine, drive and car are priced from rated load and speed; each stop adds landing doors and fixtures; rails, ropes and cables follow the travel. Shaft civil work is not included. Engineering, overheads and margin are grossed up on the selling price.',
  units: { unit: { label: '₹/installation', dec: 0, fn: (v) => v }, stop: { label: '₹/stop', dec: 0, fn: (v, r) => v / (r.cfg.stops * r.nos) } },
  fields: (c) => [{ k: 'cap', label: 'Rated load', unit: 'kg', sec: 'Duty' }, { k: 'speed', label: 'Speed', unit: 'm/s', step: 0.05, sec: 'Duty' }, { k: 'stops', label: 'Stops (landings)', step: 1, sec: 'Duty' }, { k: 'floorHt', label: 'Floor-to-floor height', unit: 'm', step: 0.1, sec: 'Duty' }, { k: 'nos', label: 'Lifts in the bank', step: 1, sec: 'Duty' },
    { k: 'door', label: 'Door type', seg: [['centre', 'Centre opening'], ['telescopic', 'Telescopic']], sec: 'Finish' }, { k: 'finish', label: 'Car finish', sel: Object.entries(FINISH).map(([k, t]) => [k, t[0]]), sec: 'Finish' }, { k: 'group', label: 'Group control', seg: [['No', 'Single'], ['Yes', 'Group']], sec: 'Finish', when: (c) => c.nos > 1 }],
  compute: computeLift, defaults: liftDefault,
  rates: (T, c) => [{ label: `${LTYPES[c.type].label}, base`, path: '', value: LTYPES[c.type].base, unit: '₹', ro: true }, { label: 'Landing door and fixtures, per stop', path: 'perStop', value: T.perStop, unit: '₹' }, { label: 'Rails, ropes, per metre', path: 'perMetre', value: T.perMetre, unit: '₹/m' }, { label: 'Load exponent', path: 'capExp', value: T.capExp, unit: '' }],
  batchCols: [['Type', (c) => LTYPES[c.type].label.split(',')[0]], ['kg', (c) => c.cap, 1], ['m/s', (c) => c.speed, 1], ['Stops', (c) => c.stops, 1], ['Lifts', (c) => c.nos, 1]],
  section: (r, T) => lineSVG(r.cfg.tag, `${r.cfg.cap} kg at ${r.cfg.speed} m/s: cost against number of stops`, sweep(r.cfg, 'stops', [0.4, 0.6, 0.8, 1, 1.25, 1.5, 2].map((f) => f), (c, T2) => computeLift({ ...c, stops: Math.max(2, Math.round(c.stops)) }, T2), T), { x: r.cfg.stops, y: r.total, label: `${r.cfg.stops} stops · ₹${n(r.total / 1e5, 1)} lakh` }, 'Stops', '₹ lakh', (v) => n(v / 1e5, 0)),
  scene(r) { const s = scene3(), H = Math.min(9, 2 + r.cfg.stops * 0.5), cars = Math.min(3, r.nos); for (let k = 0; k < cars; k++) { const x = (k - (cars - 1) / 2) * 1.7; s.box(1.4, H, 1.4, x, H / 2, 0, 0xc9ced6); s.box(1.1, 1.3, 1.1, x, H * 0.4, 0.1, 0x2f6fb0); s.box(0.5, H, 0.04, x, H / 2, 0.72, 0x5b6573); s.box(0.9, 0.5, 0.9, x, H + 0.3, 0, 0x33415a); for (let i = 0; i < Math.min(8, r.cfg.stops); i++) s.box(0.5, 0.45, 0.03, x, 0.3 + i * (H - 0.5) / Math.min(8, r.cfg.stops), 0.74, 0xe8b923); } s.box(cars * 1.7 + 1, 0.04, 2.6, 0, 0.02, 0, 0x8a8f78); return s.fit(5, 1.0, [0.9, 0.5, 1.2]); },
});
