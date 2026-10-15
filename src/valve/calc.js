// Industrial valves. Not a workbook model: body mass follows size, type and pressure class; cost is mass × material rate × type complexity,
// plus trim, actuator, testing and packing. Each row is one valve specification with a quantity.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const VTYPES = { gate: { label: 'Gate valve', w0: 55, cx: 1.0 }, globe: { label: 'Globe valve', w0: 60, cx: 1.15 }, check: { label: 'Swing check valve', w0: 45, cx: 0.85 }, ball: { label: 'Ball valve, floating / trunnion', w0: 40, cx: 1.5 }, bfly: { label: 'Butterfly valve', w0: 18, cx: 0.7 }, ctrl: { label: 'Control valve with positioner', w0: 70, cx: 3.2 }, prv: { label: 'Safety / relief valve', w0: 38, cx: 7 } };
export const CLASS = { 150: 1, 300: 1.55, 600: 2.5, 900: 4.2, 1500: 6.5 };
export const VMAT = { wcb: ['Carbon steel WCB', 330, 1], wc6: ['Alloy steel WC6 (1¼Cr)', 560, 1.15], c12: ['Alloy steel C12 (9Cr)', 720, 1.2], cf8m: ['Stainless CF8M (316)', 900, 1], a105: ['Forged steel A105', 430, 0.45], f22: ['Forged alloy F22', 700, 0.45], ci: ['Cast iron', 210, 1.1] };
export const ACT = { manual: ['Handwheel / lever', 0, 0], gear: ['Gearbox', 6500, 0.12], electric: ['Electric actuator', 52000, 0.55], pneu: ['Pneumatic actuator with positioner', 38000, 0.35], hyd: ['Hydraulic / piston actuator', 120000, 0.8] };
export const VALVE_DEFAULTS = { sizeExp: 2.2, trim: { std: 1, hard: 1.12, stellite: 1.28 }, flangeBW: 1.0, bwF: 0.92, actPerDn: 0, test: 0.04, pack: 0.015, perUnitCert: 1800, ctrlTrim: 250000, ctrlDnExp: 1.6, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, type: 'gate', dn: 100, cls: 150, mat: 'wcb', end: 'Flanged', trim: 'std', act: 'manual', qty: 1, ...o });
export const valveDefault = () => defState([mk('V-01 Isolation gate valve DN100 class 150', { qty: 40 }), mk('V-02 HP steam globe valve DN150 class 900, WC6', { type: 'globe', dn: 150, cls: 900, mat: 'wc6', end: 'Butt-weld', trim: 'stellite', qty: 8 }), mk('V-03 Cooling water butterfly valve DN600 electric', { type: 'bfly', dn: 600, mat: 'wcb', act: 'electric', qty: 6 }), mk('V-04 Feed water control valve DN200 class 1500', { type: 'ctrl', dn: 200, cls: 1500, mat: 'wc6', end: 'Butt-weld', trim: 'stellite', act: 'pneu', qty: 2 }), mk('V-05 Boiler safety valve DN100 class 600', { type: 'prv', dn: 100, cls: 600, mat: 'a105', end: 'Butt-weld', trim: 'hard', qty: 4 })], VALVE_DEFAULTS, 'valve');
export function computeValve(c, T) {
  const ty = VTYPES[c.type]; if (!ty || !(c.dn >= 15) || !(c.qty >= 1)) return { error: 'Enter size from DN15 and a quantity' };
  const m = VMAT[c.mat], ac = ACT[c.act], lines = [], add = adder(lines), G1 = 'Body and bonnet', G2 = 'Trim and internals', G3 = 'Actuation', G4 = 'Test and packing';
  const w = ty.w0 * (c.dn / 100) ** T.sizeExp * CLASS[c.cls] * m[2], end = c.end === 'Butt-weld' ? T.bwF : 1, q = c.qty, trimF = T.trim[c.trim];
  add(G1, `${ty.label} DN${c.dn} class ${c.cls}, ${m[0]} (${R2(w, 1)} kg)`, w * q, 'kg', m[1] * ty.cx * (c.type === 'ctrl' ? 0.5 : 1) * end);
  if (c.trim !== 'std') add(G2, c.trim === 'stellite' ? 'Stellite-faced seats and disc' : 'Hard-faced 13Cr trim', q, 'no', w * m[1] * 0.12 * (trimF - 1) / 0.12 * 0.5 * ty.cx);
  if (c.type === 'ctrl') add(G2, 'Control trim, cage and plug', q, 'no', T.ctrlTrim * (c.dn / 100) ** T.ctrlDnExp * CLASS[c.cls] ** 0.5);
  if (c.act !== 'manual') add(G3, ac[0], q, 'no', ac[1] * (1 + ac[2] * (w / 100) ** 0.8 * (c.type === 'bfly' ? 1 : 0.8)));
  const sub = lines.reduce((s, l) => s + l.amount, 0); add(G4, 'Hydrostatic, seat-leak test and certificates', q, 'no', T.perUnitCert); add(G4, 'Testing share and packing', 1, 'lot', sub * (T.test + T.pack));
  const { base, total, parts, pm } = finish(lines, T.stack);
  return { cfg: c, lines, parts, pm, base, total, w, q, unit: total / q, meta: `${ty.label} · DN${c.dn} · class ${c.cls} · ${m[0]} · ${c.act === 'manual' ? 'manual' : ac[0].toLowerCase()} · ${q} off`, pill: `Class ${c.cls}`,
    metrics: [['Weight each', `${R2(w, 1)} kg`], ['Quantity', `${q}`], ['Each', `₹${Math.round(total / q).toLocaleString('en-IN')}`], ['Total weight', `${Math.round(w * q).toLocaleString('en-IN')} kg`]],
    facts: [['Size (DN)', c.dn], ['Pressure class', c.cls], ['Body mass each (kg)', R2(w, 1)], ['Material', m[0]], ['Quantity', q], ['Price each (₹)', Math.round(total / q)]] };
}
