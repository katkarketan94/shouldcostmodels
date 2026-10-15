// Water and effluent treatment plants. Not a workbook model: each plant is a capacity-scaled package (reference price, power-law exponent, quality
// factor) split into process equipment, tanks, pumps and piping, dosing, instruments and electrics, plus civil tankage from retention time.
import { R2, STACK, adder, finish } from '../mfg/kit.js';
export const TYPES = {
  pre: { label: 'Pre-treatment: clarifier and gravity filters', unit: 'm³/h', ref: 500, base: 45e6, exp: 0.65, hrt: 3, kwh: 0.1, load: ['Raw-water turbidity', 'NTU', 50, 0.2], dflt: 500, out: 'Clarified, filtered water' },
  dm: { label: 'DM plant: cation, anion and mixed bed', unit: 'm³/h', ref: 100, base: 70e6, exp: 0.6, hrt: 4, kwh: 0.3, load: ['Raw-water TDS', 'ppm', 300, 0.3], dflt: 100, out: 'Boiler make-up, below 0.2 µS/cm' },
  ro: { label: 'Reverse osmosis: brackish or seawater', unit: 'm³/h', ref: 100, base: 90e6, exp: 0.7, hrt: 1.5, kwh: 2.5, load: ['Feed TDS', 'ppm', 3000, 0.45], dflt: 100, out: 'Permeate' },
  cpu: { label: 'Condensate polishing unit', unit: 'm³/h', ref: 1000, base: 220e6, exp: 0.6, hrt: 0.2, kwh: 0.1, load: null, dflt: 1500, out: 'Polished condensate' },
  etp: { label: 'Effluent treatment: physico-chemical and biological', unit: 'm³/d', ref: 500, base: 60e6, exp: 0.65, hrt: 18, kwh: 1.0, load: ['Inlet COD', 'mg/l', 1200, 0.35], dflt: 1000, out: 'Treated effluent for reuse or discharge' },
  stp: { label: 'Sewage treatment: MBBR', unit: 'm³/d', ref: 500, base: 45e6, exp: 0.7, hrt: 20, kwh: 0.8, load: ['Inlet BOD', 'mg/l', 300, 0.3], dflt: 500, out: 'Treated sewage for horticulture' },
  zld: { label: 'Zero liquid discharge: brine concentrator and crystalliser', unit: 'm³/d', ref: 500, base: 450e6, exp: 0.7, hrt: 6, kwh: 25, load: ['Feed TDS', 'ppm', 10000, 0.3], dflt: 500, out: 'Distillate and solid salt' },
};
export const MATERIALS = { 'FRP / rubber-lined MS': 1, 'SS 316': 1.35, 'Duplex 2205': 1.8 };
export const WTP_DEFAULTS = {
  share: { process: 0.42, tanks: 0.16, pumps: 0.16, dosing: 0.06, ice: 0.2 },        // split of the package price
  civilPerM3: 14000, civilM3: 0.35, depth: 4, erect: 0.07, fill: 0.015, test: 0.01, standby: 1.12, stack: { ...STACK },
};
const mk = (tag, type, o = {}) => ({ tag, type, cap: TYPES[type].dflt, load: TYPES[type].load ? TYPES[type].load[2] : 0, material: 'FRP / rubber-lined MS', standby: 'No', ...o });
export function wtpDefault() {
  return { list: [mk('WT-01 Pre-treatment 500 m³/h', 'pre'), mk('WT-02 DM plant 100 m³/h', 'dm'), mk('WT-03 Seawater RO 100 m³/h', 'ro', { load: 35000, material: 'Duplex 2205' }), mk('WT-04 Condensate polishing 1,500 m³/h', 'cpu'), mk('WT-05 Effluent treatment 1,000 m³/d', 'etp'), mk('WT-06 Sewage treatment 500 m³/d', 'stp'), mk('WT-07 ZLD 500 m³/d', 'zld', { material: 'Duplex 2205' })],
    sel: 0, unit: 'plant', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(WTP_DEFAULTS)) };
}
export function computeWtp(c, T) {
  const ty = TYPES[c.type]; if (!ty) return { error: 'Choose a plant type' }; if (!(c.cap > 0)) return { error: 'Enter a capacity' };
  const lines = [], add = adder(lines), S = T.share, perHour = ty.unit === 'm³/h', lf = ty.load ? (Math.max(c.load, 1) / ty.load[2]) ** ty.load[3] : 1, mat = MATERIALS[c.material] ?? 1, sb = c.standby === 'Yes' ? T.standby : 1;
  const pack = ty.base * (c.cap / ty.ref) ** ty.exp * lf * sb, G1 = 'Process equipment', G2 = 'Tanks and vessels', G3 = 'Pumps and piping', G4 = 'Dosing and chemicals', G5 = 'Instruments and electrics', G6 = 'Civil tankage', G7 = 'Erection and commissioning';
  add(G1, `${ty.label}: process skids and media (${c.cap} ${ty.unit})`, 1, 'set', pack * S.process * mat); add(G2, 'Storage tanks, vessels and sumps', 1, 'set', pack * S.tanks * (0.5 + 0.5 * mat)); add(G3, 'Transfer, backwash and sludge pumps with interconnecting piping', 1, 'set', pack * S.pumps * (0.6 + 0.4 * mat));
  add(G4, 'Chemical preparation, dosing and neutralisation', 1, 'set', pack * S.dosing); add(G5, 'Instruments, analysers, MCC, PLC and cabling', 1, 'set', pack * S.ice);
  const volume = (perHour ? c.cap : c.cap / 24) * ty.hrt, area = volume / T.depth * 1.8, civil = volume * T.civilM3 * T.civilPerM3 / T.civilM3;
  add(G6, `Tankage: ${R2(volume, 0)} m³ of liquid volume, RCC`, volume, 'm³', T.civilPerM3);
  const eq = lines.reduce((s, l) => s + l.amount, 0); add(G7, 'Erection, piping and cabling at site', 1, 'lot', (eq - lines.filter((l) => l.group === G6).reduce((s, l) => s + l.amount, 0)) * T.erect); add(G7, 'First fill of chemicals and media, commissioning', 1, 'lot', pack * T.fill); add(G7, 'Performance guarantee tests', 1, 'lot', eq * T.test);
  const { base, total, parts, pm } = finish(lines, T.stack), kw = ty.kwh * (perHour ? c.cap : c.cap / 24) * 1.15;
  return { cfg: c, ty, lines, parts, pm, base, total, perUnit: total / c.cap, volume, area, kw, lf, pack, civil };
}
