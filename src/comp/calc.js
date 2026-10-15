// Air compressor packages (instrument and plant air). Not a workbook model: power follows free-air delivery and pressure; compressor, dryer, receiver,
// filters and controls are priced per kW, per m³/min and by receiver weight; duty and standby units multiply the set.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const CTYPES = { screw: { label: 'Oil-injected rotary screw', spec: 6.3, rate: 13600, exp: -0.15 }, oilfree: { label: 'Oil-free screw', spec: 7.0, rate: 29000, exp: -0.15 }, recip: { label: 'Reciprocating, 2-stage', spec: 5.8, rate: 11000, exp: -0.12 }, centri: { label: 'Centrifugal, oil-free', spec: 5.3, rate: 15500, exp: -0.2 } };
export const DRYER = { none: ['No dryer', 0, 0], refrig: ['Refrigerant dryer, +3 °C dew point', 12000, 0.04], heatless: ['Heatless desiccant, −40 °C dew point', 38000, 0.15], heated: ['Heat-of-compression desiccant, −40 °C', 45000, 0.02] };
export const COMP_DEFAULTS = { refKw: 100, receiverRate: 130, receiverKgPerM3: 380, receiverMin: 0.25, filters: 2500, piping: 900, starter: 1500, enclosure: 0.06, ctrl: 450000, vsd: 3200, water: 25000, inst: 0.06, test: 0.01, steelRate: 98, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, type: 'screw', fad: 20, bar: 7.5, dryer: 'heatless', duty: 2, standby: 1, vsd: 'No', cooling: 'Air', ...o });
export const compDefault = () => defState([mk('AC-01 Instrument air 2W+1S, 20 m³/min each', {}), mk('AC-02 Plant air 4 × 30 m³/min, oil-free', { type: 'oilfree', fad: 30, duty: 3, standby: 1, dryer: 'heated' }), mk('AC-03 Small workshop 5 m³/min', { fad: 5, duty: 1, standby: 0, dryer: 'refrig', vsd: 'Yes' }), mk('AC-04 Centrifugal 200 m³/min', { type: 'centri', fad: 200, duty: 1, standby: 1, bar: 8, cooling: 'Water', dryer: 'heated' }), mk('AC-05 Reciprocating 10 bar, 12 m³/min', { type: 'recip', fad: 12, bar: 10, duty: 1, standby: 1, dryer: 'refrig' })], COMP_DEFAULTS, 'comp');
export function computeComp(c, T) {
  const ty = CTYPES[c.type]; if (!ty || !(c.fad > 0) || !(c.duty >= 1)) return { error: 'Enter air delivery and at least one duty unit' };
  const dr = DRYER[c.dryer], n = c.duty + c.standby, spec = ty.spec * (1 + 0.075 * (c.bar - 7)) * (c.vsd === 'Yes' ? 0.95 : 1), kw = c.fad * spec, motor = Math.ceil(kw * 1.1 / 5) * 5, lines = [], add = adder(lines);
  const G1 = 'Compressors', G2 = 'Treatment and storage', G3 = 'Piping, electrics and controls', G4 = 'Installation and test';
  const price = ty.rate * motor * (motor / T.refKw) ** ty.exp * (1 + 0.07 * Math.max(0, c.bar - 8)); add(G1, `${ty.label}, ${R2(c.fad, 0)} m³/min at ${c.bar} bar, ${motor} kW motor`, n, 'no', price);
  if (c.vsd === 'Yes') add(G1, 'Variable-speed drive', n * motor, 'kW', T.vsd); if (c.cooling === 'Water') add(G1, 'Water-cooled intercooler and aftercooler circuit', n, 'no', T.water * motor ** 0.7 / 6);
  if (c.type === 'recip' || c.type === 'centri') add(G1, 'Foundation frame and vibration isolation', n, 'no', motor * 800);
  const dryerPrice = dr[1] * c.fad * c.duty ** 1 * (c.fad > 60 ? 0.8 : 1); if (dr[1]) add(G2, dr[0], c.duty, 'no', dr[1] * c.fad * (c.fad > 60 ? 0.8 : 1));
  const recVol = Math.max(T.receiverMin * c.fad * c.duty, 1), recKg = recVol * T.receiverKgPerM3 * (1 + 0.2 * (c.bar - 7) / 3); add(G2, `Air receiver ${R2(recVol, 1)} m³ with fittings (${R2(recKg, 0)} kg)`, recKg, 'kg', T.receiverRate + 20);
  add(G2, 'Pre- and after-filters, condensate drains', c.duty, 'set', T.filters * c.fad);
  add(G3, 'Interconnecting piping, valves and manifold', c.fad * c.duty, 'm³/min', T.piping * 8); add(G3, 'Motor starters and local panel', n, 'no', T.starter * motor); add(G3, 'Sequencing controller and monitoring', 1, 'lot', n > 1 ? T.ctrl : T.ctrl * 0.4);
  const sub = lines.reduce((s, l) => s + l.amount, 0); add(G4, 'Acoustic enclosure and silencing', 1, 'lot', sub * T.enclosure); add(G4, 'Installation, piping and commissioning', 1, 'lot', sub * T.inst); add(G4, 'Capacity and dew-point test', 1, 'lot', sub * T.test);
  const { base, total, parts, pm } = finish(lines, T.stack), conn = n * motor;
  return { cfg: c, lines, parts, pm, base, total, kw, motor, n, conn, spec, recVol, perFad: total / (c.fad * c.duty), meta: `${ty.label} · ${c.duty}W + ${c.standby}S × ${c.fad} m³/min at ${c.bar} bar`, pill: ty.label.split(' ')[0],
    metrics: [['Motor, each', `${motor} kW`], ['Specific power', `${R2(spec, 2)} kW per m³/min`], ['Receiver', `${R2(recVol, 1)} m³`], ['₹ per m³/min duty', `₹${Math.round(total / (c.fad * c.duty)).toLocaleString('en-IN')}`]],
    facts: [['Free-air delivery per unit (m³/min)', c.fad], ['Discharge pressure (bar g)', c.bar], ['Specific power (kW per m³/min)', R2(spec, 2)], ['Shaft power per unit (kW)', R2(kw, 0)], ['Motor per unit (kW)', motor], ['Units installed', n], ['Connected load (kW)', conn]] };
}
