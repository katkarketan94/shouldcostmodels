// Boiler feed pump sets: the high-pressure barrel pump with its driver (steam turbine, or electric motor with a variable-speed coupling),
// booster pump, lube-oil system, seals, instruments and test. Not a workbook model: weights and prices scale with shaft power.
import { computePump, PUMP_DEFAULTS } from '../pump/calc.js';
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const DRIVES = { turbine: 'Steam turbine (with gearbox)', motor: 'Electric motor with variable-speed coupling' };
export const BFP_DEFAULTS = {
  eff: { max: 0.84, flowKnee: 600 }, rho: 890, stageHead: 280, boosterHead: 110, boosterEff: 0.8,
  pump: { kgK: 9.5, kgExp: 0.85, perKg: 1150, stageAdd: 0.03 },        // mass = kgK x kW^kgExp, rate per kg finished, +3% per stage above 6
  seals: { lot: 3500000, perKw: 120 }, lube: { lot: 5500000, perKw: 400 }, instr: 4500000,
  turbine: { k: 136000, exp: 0.8, ancillary: 0.18 },                    // price = k x kW^exp, plus governor, lube, drains and controls as a share
  motor: { k: 36400, exp: 0.75, coupling: 4500, gear: 2500, motorMargin: 1.1, voltageF: 1.0 },
  test: { lot: 4000000, pct: 0.012 }, stack: { engineering: 0.03, overheads: 0.06, margin: 0.09, misc: 0.01 },
};
const mk = (tag, drive, o) => ({ tag, drive, flow: 1300, head: 2100, temp: 180, booster: 'Yes', ...o });
export function bfpDefault() {
  return { list: [mk('BFP-01 Turbine-driven, 50% duty (660 MW unit)', 'turbine', {}), mk('BFP-02 Motor-driven, start-up / standby 30%', 'motor', { flow: 800 }), mk('BFP-03 Turbine-driven, 100 MW industrial unit', 'turbine', { flow: 450, head: 1200, temp: 160 }), mk('BFP-04 Motor-driven, 100 MW industrial unit', 'motor', { flow: 450, head: 1200, temp: 160 })],
    sel: 0, unit: 'set', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(BFP_DEFAULTS)) };
}
export function computeBfp(c, T) {
  if (!(c.flow > 0) || !(c.head > 0)) return { error: 'Enter a flow and a head' };
  const rho = T.rho * (1 - 0.0004 * (c.temp - 180)), Q = c.flow, H = c.head, g = 9.81;
  const eta = Math.max(0.5, T.eff.max * (1 - 0.35 * Math.exp(-((Q / T.eff.flowKnee) ** 0.6)))), Ph = Q * H * rho * g / 3600 / 1000, P = Ph / eta, stages = Math.max(1, Math.ceil(H / T.stageHead));
  const lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, label, qty: R2(qty), unit, rate, amount: qty * rate, note }); };
  const mass = T.pump.kgK * P ** T.pump.kgExp * (1 + T.pump.stageAdd * Math.max(0, stages - 6)), G1 = 'Pump', G2 = 'Driver and drive train', G3 = 'Auxiliaries', G4 = 'Test';
  add(G1, `Barrel pump, ${stages} stages (casing, diffusers, impellers, shaft)`, mass, 'kg', T.pump.perKg);
  add(G1, 'Mechanical seals, coolers and piping', 1, 'set', T.seals.lot + T.seals.perKw * P);
  let boosterKw = 0, booster = null;
  if (c.booster === 'Yes') { const bq = computePump({ type: 'BB1', flow: Q, head: T.boosterHead, sg: rho / 1000, visc: 1, material: 'Carbon steel (WCB)', seal: null, vfd: 'No', exproof: 'No' }, PUMP_DEFAULTS); booster = bq; boosterKw = bq.motorKw; add(G1, `Booster pump with ${bq.motorKw} kW motor`, 1, 'set', bq.total); }
  let driverKw;
  if (c.drive === 'turbine') { driverKw = Math.ceil(P * 1.05 / 100) * 100; add(G2, `Steam turbine ${fmt(driverKw)} kW with reduction gear and governor`, 1, 'set', T.turbine.k * driverKw ** T.turbine.exp * (1 + T.turbine.ancillary)); }
  else { driverKw = Math.ceil(P * T.motor.motorMargin / 100) * 100; add(G2, `HT motor ${fmt(driverKw)} kW`, 1, 'set', T.motor.k * driverKw ** T.motor.exp * T.motor.voltageF); add(G2, 'Variable-speed hydraulic coupling and step-up gear', driverKw, 'kW', T.motor.coupling + T.motor.gear); }
  add(G3, 'Lube-oil system: console, pumps, coolers, filters', 1, 'set', T.lube.lot + T.lube.perKw * P); add(G3, 'Instruments, vibration and temperature monitoring, protection', 1, 'lot', T.instr);
  add(G3, 'Baseplate and foundation frame', mass * 0.35, 'kg', 120);
  const eq = lines.reduce((s, l) => s + l.amount, 0); add(G4, 'Witnessed performance, NPSH and string test', 1, 'lot', T.test.lot + eq * T.test.pct);
  const base = lines.reduce((s, l) => s + l.amount, 0), st = T.stack, load = st.engineering + st.overheads + st.margin + st.misc, total = base / (1 - load);
  const parts = {}; lines.forEach((l) => { parts[l.group] = (parts[l.group] || 0) + l.amount; }); parts['Engineering'] = total * st.engineering; parts['Overheads'] = total * st.overheads; parts['Margin'] = total * st.margin; parts['Supervision, spares'] = total * st.misc;
  return { cfg: c, lines, parts, pm: parts, base, total, rho, eta, Ph, P, stages, mass, driverKw, boosterKw, booster, perKw: total / P, weightT: (mass * 1.35 + (c.drive === 'turbine' ? driverKw * 4 : driverKw * 6 + 3000)) / 1000 };
}
const fmt = (v) => Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
export function bfpCurve(r) { const pts = []; for (let i = 0; i <= 24; i++) { const f = i * 1.4 / 24; pts.push({ q: r.cfg.flow * f, h: r.cfg.head * (1.22 - 0.22 * f * f - (f > 1 ? 0.4 * (f - 1) ** 1.6 : 0)), eta: r.eta * Math.max(0, 1 - 1.1 * (f - 1) ** 2) }); } return pts; }
