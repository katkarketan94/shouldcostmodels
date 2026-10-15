// UPS systems. Not a workbook model: converter price scales with kVA, battery with the energy needed for the backup time, plus cabinets and distribution.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const TOPOLOGY = { online: { label: 'Online double-conversion', f: 1 }, modular: { label: 'Modular online (hot-swap power modules)', f: 1.15 }, interactive: { label: 'Line-interactive / offline', f: 0.7 } };
export const CHEM = { VRLA: { rate: 10000, kgPerKwh: 28, life: 8, label: 'VRLA lead-acid' }, 'Ni-Cd': { rate: 30000, kgPerKwh: 40, life: 20, label: 'Ni-Cd' }, 'Li-ion': { rate: 28000, kgPerKwh: 9, life: 12, label: 'Li-ion LFP' } };
export const REDUND = { single: ['Single UPS', 1], parallel: ['N+1 parallel redundant', 1.35], dual: ['2N dual bus', 2.0] };
export const UPS_DEFAULTS = { k: 17500, exp: 0.8, effInv: 0.93, aging: 1.25, temp: 1.1, dod: 0.8, rack: 1200, bcb: 120000, dist: 600, sts: 10000, mbp: 0.04, isoTx: 4500, inst: 0.06, test: 0.01, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, topology: 'online', kva: 100, pf: 0.9, backup: 30, redundancy: 'single', chem: 'VRLA', isoTx: 'No', ...o });
export const upsDefault = () => defState([mk('UPS-01 100 kVA online, 30 min', {}), mk('UPS-02 250 kVA 2N, Ni-Cd 60 min', { kva: 250, redundancy: 'dual', chem: 'Ni-Cd', backup: 60 }), mk('UPS-03 20 kVA line-interactive', { kva: 20, topology: 'interactive', backup: 15 }), mk('UPS-04 500 kVA N+1, Li-ion 15 min', { kva: 500, redundancy: 'parallel', chem: 'Li-ion', backup: 15, isoTx: 'Yes' })], UPS_DEFAULTS, 'ups');
export function computeUps(c, T) {
  if (!(c.kva > 0)) return { error: 'Enter a rating' };
  const lines = [], add = adder(lines), kw = c.kva * c.pf, rd = REDUND[c.redundancy][1], tp = TOPOLOGY[c.topology].f, ch = CHEM[c.chem];
  const kwh = kw / T.effInv * c.backup / 60 / T.dod * T.aging * T.temp, G1 = 'Rectifier / inverter', G2 = 'Battery', G3 = 'Switchgear and distribution', G4 = 'Installation and test';
  const conv = T.k * c.kva ** T.exp * tp; add(G1, `${TOPOLOGY[c.topology].label}, ${c.kva} kVA`, 1, 'set', conv * rd);
  if (c.redundancy !== 'single' || c.topology !== 'interactive') add(G1, 'Static bypass switch with maintenance bypass', 1, 'set', T.sts * c.kva ** 0.8 * rd * 0.5 + conv * T.mbp);
  if (c.isoTx === 'Yes') add(G1, 'Input isolation transformer', c.kva * rd, 'kVA', T.isoTx);
  add(G2, `${ch.label} battery, ${R2(kwh, 0)} kWh for ${c.backup} min at ${R2(kw, 0)} kW`, kwh * rd, 'kWh', ch.rate); add(G2, 'Battery racks, cabinets and ventilation', kwh * rd, 'kWh', T.rack); add(G2, 'Battery circuit breaker and DC cabling', rd, 'set', T.bcb * (c.kva / 100) ** 0.5);
  add(G3, 'Input / output distribution panels', c.kva * rd, 'kVA', T.dist);
  add(G4, 'Installation, cabling and commissioning', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * T.inst); add(G4, 'Battery discharge test and factory test', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * T.test);
  const { base, total, parts, pm } = finish(lines, T.stack), battKg = kwh * rd * ch.kgPerKwh;
  return { cfg: c, lines, parts, pm, base, total, kw, kwh, battKg, rd, perKva: total / c.kva, meta: `${TOPOLOGY[c.topology].label} · ${c.kva} kVA · ${c.backup} min ${c.chem}`, pill: REDUND[c.redundancy][0],
    metrics: [['Output', `${R2(kw, 0)} kW`], ['Battery', `${Math.round(kwh * rd)} kWh`], ['Battery mass', `${Math.round(battKg).toLocaleString('en-IN')} kg`], ['₹ per kVA', `₹${Math.round(total / c.kva).toLocaleString('en-IN')}`]],
    facts: [['Output rating (kVA)', c.kva], ['Output power (kW)', R2(kw, 0)], ['Redundancy factor', rd], ['Battery energy per string (kWh)', R2(kwh, 0)], ['Battery mass, all strings (kg)', Math.round(battKg)], ['Battery life (years)', ch.life]] };
}
