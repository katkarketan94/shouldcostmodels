// Air-cooled condenser (direct dry cooling) for a steam turbine exhaust. Not a workbook model: the heat load and the temperature difference to ambient
// set the finned-tube surface and fan count; bundles, steam duct, A-frame structure, fans and vacuum system are then priced.
import { R2, STACK, adder, finish } from '../mfg/kit.js';
export const ACC_DEFAULTS = {
  dryness: 0.92, airRiseFrac: 0.45, U: 60, fanDutyPerK: 0.9, fanKw: 75, fanDia: 9.14,       // exhaust dryness, air rise / ITD, W/m²K on extended surface, MW thermal per fan per K of ITD
  tubeKgPerM2: 1.6, tubeRate: 700, ductV: 55, ductT: 0.008, ductRate: 140, headerFrac: 0.6, steelRate: 98, structKgPerFan: 38000, structFab: 120,
  fanSet: 3400000, vfd: 600000, panelPerFan: 350000, windwall: 400000, foundation: 900000, vacuum: 25e6, condTank: 22e6, ref: 1000, instr: 18e6,
  erectKg: 30, erectFan: 250000, test: 0.008, stack: { ...STACK },
};
const mk = (tag, o) => ({ tag, flow: 1500, bp: 15, amb: 35, duct: 150, ...o });
export function accDefault() {
  return { list: [mk('ACC-01 660 MW unit, 15 kPa at 35 °C', {}), mk('ACC-02 660 MW unit, 10 kPa design (cold site)', { bp: 10, amb: 25 }), mk('ACC-03 300 MW unit', { flow: 700, duct: 110 }), mk('ACC-04 100 MW unit', { flow: 250, bp: 18, duct: 60 })],
    sel: 0, unit: 'condenser', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(ACC_DEFAULTS)) };
}
export const tsat = (kPa) => { const mm = kPa * 7.50062; return 1730.63 / (8.07131 - Math.log10(mm)) - 233.426; };
export function computeAcc(c, T) {
  if (!(c.flow > 0) || !(c.bp > 0)) return { error: 'Enter steam flow and back pressure' };
  const Ts = tsat(c.bp), itd = Ts - c.amb; if (itd < 8) return { error: `Condensing temperature ${R2(Ts, 1)} °C is only ${R2(itd, 1)} K above ambient; raise the back pressure` };
  const hfg = 2501 - 2.36 * Ts, kgs = c.flow * 1000 / 3600, Q = kgs * T.dryness * hfg / 1000, rise = itd * T.airRiseFrac, lmtd = rise / Math.log(itd / (itd - rise)), area = Q * 1e6 / (T.U * lmtd);
  const fans = Math.max(4, Math.ceil(Q / (T.fanDutyPerK * itd))), rho = 101.325 / (0.4615 * (Ts + 273.15)) * c.bp / 101.325 * 1, vol = kgs / Math.max(rho, 0.02), dDuct = Math.sqrt(4 * vol / T.ductV / Math.PI);
  const lines = [], add = adder(lines), G1 = 'Heat-transfer bundles', G2 = 'Steam duct and headers', G3 = 'Structure', G4 = 'Fans and drives', G5 = 'Vacuum, condensate and controls', G6 = 'Civil, erection and test';
  const tubeKg = area * T.tubeKgPerM2; add(G1, `Finned-tube bundles, ${R2(area / 1e3, 0)}×10³ m² extended surface`, tubeKg, 'kg', T.tubeRate);
  const ductKg = Math.PI * dDuct * c.duct * T.ductT * 7850 * (1 + T.headerFrac); add(G2, `Main steam duct ${R2(dDuct, 1)} m dia, ${c.duct} m, with distribution headers and expansion joints`, ductKg, 'kg', T.ductRate);
  const structKg = fans * T.structKgPerFan; add(G3, 'A-frame support structure, walkways and platforms', structKg, 'kg', T.steelRate + T.structFab); add(G3, 'Wind walls and fan bridges', fans, 'fan', T.windwall);
  add(G4, `Axial fans ${T.fanDia} m with gearbox and ${T.fanKw} kW motor`, fans, 'fan', T.fanSet); add(G4, 'Variable-frequency drives', fans, 'fan', T.vfd); add(G4, 'Motor control centre and cabling', fans, 'fan', T.panelPerFan);
  const sc = (c.flow / T.ref) ** 0.7; add(G5, 'Vacuum system: ejectors or pumps with seal-water cooling', 1, 'lot', T.vacuum * sc); add(G5, 'Condensate tank, extraction pumps and drains', 1, 'lot', T.condTank * sc); add(G5, 'Instruments, freeze protection and DCS interface', 1, 'lot', T.instr * (0.5 + 0.5 * fans / 54));
  add(G6, 'Foundations: piers and slab', fans, 'fan', T.foundation); const steelKg = structKg + ductKg + tubeKg; add(G6, 'Erection of steel and bundles', steelKg, 'kg', T.erectKg); add(G6, 'Fan and bundle erection', fans, 'fan', T.erectFan);
  add(G6, 'Leak tests and performance test', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * T.test);
  const { base, total, parts, pm } = finish(lines, T.stack);
  return { cfg: c, lines, parts, pm, base, total, Ts, itd, Q, rise, lmtd, area, fans, dDuct, steelT: steelKg / 1000, fanMw: fans * T.fanKw / 1000, perMw: total / Q, hfg };
}
export function accCurve(c, T) { const pts = []; for (let bp = 6; bp <= 40; bp += 1) { const r = computeAcc({ ...c, bp }, T); if (!r.error) pts.push({ bp, total: r.total, fans: r.fans, Ts: r.Ts }); } return pts; }
