// Electric motors, LV and HT squirrel-cage. Not a workbook model: frame mass follows kW and pole count; copper, laminations and castings are priced by weight
// at the common commodity rates, then insulation, bearings, terminal box, cooling, machining, assembly and test.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const VOLT = { LV: { label: 'LV 415 V', insul: 60, tb: 18000, massF: 1 }, V3: { label: 'HT 3.3 kV', insul: 220, tb: 85000, massF: 1.08 }, V66: { label: 'HT 6.6 kV', insul: 260, tb: 110000, massF: 1.12 }, V11: { label: 'HT 11 kV', insul: 380, tb: 185000, massF: 1.2 } };
export const ENCL = { TEFC: ['TEFC (IP55)', 1], TEWAC: ['TEWAC, water-air cooler (IP55)', 1.22], CACA: ['CACA, air-air cooler', 1.18], Exd: ['Flameproof Ex d', 1.4], Exe: ['Increased safety Ex e', 1.2] };
export const EFF = { IE2: ['IE2', 0.93], IE3: ['IE3 premium', 1], IE4: ['IE4 super premium', 1.13] };
export const POLES = { 2: 0.85, 4: 1, 6: 1.35, 8: 1.7 };
export const MOTOR_DEFAULTS = { prices: { copper: 1400, crca: 76, cast: 95 }, kgK: 7.2, kgExp: 0.86, cuFrac: 0.17, lamFrac: 0.5, castFrac: 0.27, lamRate: 1.0, fab: { cu: 220, lam: 60, cast: 70 }, bearing: 4200, fanPerKg: 24, labour: 85, testLot: 6000, testPerKw: 22, pack: 0.02, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, kw: 90, poles: 4, volt: 'LV', encl: 'TEFC', eff: 'IE3', mount: 'Foot B3', nos: 1, ...o });
export const motorDefault = () => defState([mk('M-01 90 kW 415 V IE3, 4 pole', {}), mk('M-02 11 kW 415 V IE3', { kw: 11 }), mk('M-03 1,000 kW 6.6 kV TEFC', { kw: 1000, volt: 'V66' }), mk('M-04 3,000 kW 11 kV TEWAC', { kw: 3000, volt: 'V11', encl: 'TEWAC', poles: 6 }), mk('M-05 37 kW Ex d, IE3', { kw: 37, encl: 'Exd' })], MOTOR_DEFAULTS, 'motor');
export function computeMotor(c, T) {
  const vt = VOLT[c.volt]; if (!vt || !(c.kw > 0)) return { error: 'Enter a rating' };
  if (c.volt === 'LV' && c.kw > 400) return { error: 'Above about 400 kW use an HT motor' }; if (c.volt !== 'LV' && c.kw < 200) return { error: 'HT motors start near 200 kW' };
  const ef = EFF[c.eff][1], en = ENCL[c.encl][1], pf = POLES[c.poles] ?? 1, nos = Math.max(1, Math.round(c.nos)), active = ef, mass = T.kgK * c.kw ** T.kgExp * pf * vt.massF * (0.8 + 0.2 * ef) * (en > 1.3 ? 1.1 : 1), P = T.prices;
  const cu = mass * T.cuFrac * active, lam = mass * T.lamFrac * active, cast = mass * T.castFrac, lines = [], add = adder(lines);
  const G1 = 'Active material', G2 = 'Frame and mechanical', G3 = 'Insulation and electrical', G4 = 'Assembly and test';
  add(G1, `Winding copper (${R2(cu, 0)} kg)`, cu * nos, 'kg', P.copper + T.fab.cu); add(G1, `Silicon-steel laminations (${R2(lam, 0)} kg)`, lam * nos, 'kg', P.crca * 1.6 * T.lamRate + T.fab.lam);
  add(G2, `Frame, endshields and rotor casting (${R2(cast, 0)} kg)`, cast * nos, 'kg', P.cast + T.fab.cast); add(G2, 'Shaft, bearings, seals', nos, 'set', T.bearing * (mass / 100) ** 0.7 * 1.0); add(G2, 'Fan, cowl and cooling', mass * nos, 'kg', T.fanPerKg * en * 0.4 * (en > 1.1 ? 3 : 1));
  add(G3, `${c.volt === 'LV' ? 'Class F insulation' : 'VPI insulation system'}`, cu * nos, 'kg', vt.insul); add(G3, 'Terminal box, gland plate and accessories', nos, 'set', vt.tb * (c.encl.startsWith('Ex') ? 1.8 : 1));
  if (c.volt !== 'LV') add(G3, 'RTDs, bearing sensors, space heaters, vibration pads', nos, 'set', 55000);
  if (en > 1.15) add(G2, 'Heat exchanger / cooler (extra over TEFC)', nos, 'set', mass * 38 * (en - 1));
  const sub = lines.reduce((s, l) => s + l.amount, 0) * (1 + (c.encl.startsWith('Ex') ? 0.25 : 0)); lines.length && (lines[lines.length - 1].note = '');
  add(G4, 'Machining, winding and assembly labour', mass * nos, 'kg', T.labour); add(G4, 'Routine and type-test', nos, 'no', T.testLot + T.testPerKw * c.kw); add(G4, 'Packing', 1, 'lot', sub * T.pack);
  const { base, total, parts, pm } = finish(lines, T.stack);
  return { cfg: c, lines, parts, pm, base, total, mass, cu, lam, nos, perKw: total / (c.kw * nos), meta: `${vt.label} · ${c.kw} kW · ${c.poles} pole · ${ENCL[c.encl][0]} · ${EFF[c.eff][0]}`, pill: c.volt === 'LV' ? 'LV' : 'HT',
    metrics: [['Mass', `${Math.round(mass).toLocaleString('en-IN')} kg`], ['Copper', `${Math.round(cu)} kg`], ['Speed', `${Math.round(50 * 120 / c.poles)} rpm sync`], ['₹ per kW', `₹${Math.round(total / (c.kw * nos)).toLocaleString('en-IN')}`]],
    facts: [['Rated output (kW)', c.kw], ['Poles / synchronous speed (rpm)', `${c.poles} / ${50 * 120 / c.poles}`], ['Frame mass (kg)', R2(mass, 0)], ['Copper (kg)', R2(cu, 0)], ['Laminations (kg)', R2(lam, 0)], ['Motors', nos]] };
}
