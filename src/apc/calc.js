// Air-pollution control for coal-fired boilers: electrostatic precipitator (Deutsch-Anderson sizing) and wet limestone FGD (absorber, recirculation,
// limestone and gypsum plants). Not a workbook model: sizes follow from gas flow and the required removal; prices are assumed rates per kg, per kW or per lot.
import { R2, STACK, adder, finish } from '../mfg/kit.js';
export const APC_DEFAULTS = {
  esp: { w: 0.055, plateKgPerM2: 11.5, plateRate: 200, casingKgPerM2: 6, casingRate: 110, supportKgPerM2: 3.5, supportRate: 98, electrodePerM2: 90, rapperPerM2: 12, trUnitArea: 6000, trSet: 4.2e6, hopperArea: 1500, hopper: 0.9e6, insulatorHeating: 6e6, ashIface: 0.35e6, foundPerM2: 28, insulation: 40, erectKg: 28, test: 0.01 },
  fgd: { velocity: 3.8, lg: 12, towerExtra: 18, levelH: 2.2, shellT: 0.012, steelRate: 98, fabRate: 450, lining: 9000, alloyF: 2.6, sprayPerLevelM2: 45000, mistElim: 10e6, pumpKwRate: 75000, pumpHead: 22, fanKwRate: 22000, fanDp: 3.0, limeMill: 9e6, limePurity: 0.92, stoich: 1.03, gypsum: 5e6, wwtp: 150e6, ducts: 0.4e6, instr: 70e6, civilPerM2: 1400000, bop: 0.35, erect: 0.07, test: 0.008 },
  stack: { ...STACK },
};
const mk = (tag, type, o) => ({ tag, type, gas: 2.6e6, temp: 140, dust: 70, outDust: 30, so2: 1800, outSo2: 100, material: 'Rubber / glass-flake lined carbon steel', ...o });
export function apcDefault() {
  return { list: [mk('ESP-01 660 MW boiler, 30 mg/Nm³', 'esp', {}), mk('ESP-02 660 MW boiler, 50 mg/Nm³ (legacy)', 'esp', { outDust: 50 }), mk('ESP-03 300 MW boiler', 'esp', { gas: 1.15e6 }),
    mk('FGD-01 660 MW wet limestone, 1,800 mg/Nm³', 'fgd', {}), mk('FGD-02 660 MW, high-sulphur coal', 'fgd', { so2: 3200 }), mk('FGD-03 300 MW wet limestone', 'fgd', { gas: 1.15e6 })],
    sel: 0, unit: 'unit', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(APC_DEFAULTS)) };
}
const nm3s = (c) => c.gas / 3600, actual = (c) => nm3s(c) * (c.temp + 273.15) / 273.15;
export function computeApc(c, T) { return c.type === 'esp' ? esp(c, T) : fgd(c, T); }
function esp(c, T) {
  const E = T.esp, Q = actual(c); if (!(c.gas > 0) || !(c.dust > c.outDust / 1000) || !(c.outDust > 0)) return { error: 'Outlet dust must be below inlet dust' };
  const eta = 1 - (c.outDust / 1000) / c.dust, sca = -Math.log(1 - eta) / E.w, area = sca * Q, fields = eta > 0.9995 ? 6 : eta > 0.999 ? 5 : 4;
  const lines = [], add = adder(lines), G1 = 'Collecting system', G2 = 'Casing, hoppers and structure', G3 = 'Electrical', G4 = 'Civil, erection and test';
  add(G1, `Collecting plates and emitting frames, ${R2(area / 1e3, 0)}×10³ m² of plate`, area * E.plateKgPerM2, 'kg', E.plateRate); add(G1, 'Discharge electrodes', area, 'm²', E.electrodePerM2); add(G1, 'Rapping systems and gear drives', area, 'm²', E.rapperPerM2);
  const hop = Math.ceil(area / E.hopperArea); add(G2, 'Casing, roof and gas distribution screens', area * E.casingKgPerM2, 'kg', E.casingRate); add(G2, 'Support structure, platforms and stairs', area * E.supportKgPerM2, 'kg', E.supportRate); add(G2, 'Insulation and cladding', area, 'm²', E.insulation); add(G2, `Ash hoppers with heating and level probes (${hop})`, hop, 'no', E.hopper + E.ashIface);
  const trs = Math.ceil(area / E.trUnitArea); add(G3, `HV transformer-rectifier sets with controllers (${trs})`, trs, 'no', E.trSet); add(G3, 'Support insulators, heating, cabling and instrumentation', 1, 'lot', E.insulatorHeating * (area / 140000) ** 0.7);
  const steelKg = area * (E.plateKgPerM2 + E.casingKgPerM2 + E.supportKgPerM2); add(G4, 'Foundations', area, 'm²', E.foundPerM2); add(G4, 'Erection', steelKg, 'kg', E.erectKg); add(G4, 'Guarantee tests', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * E.test);
  const { base, total, parts, pm } = finish(lines, T.stack);
  return { cfg: c, kind: 'esp', lines, parts, pm, base, total, Q, eta, sca, area, fields, steelT: steelKg / 1000, hoppers: hop, trs, perUnit: total / area, size: `${R2(area / 1e3, 0)}×10³ m² plate` };
}
function fgd(c, T) {
  const F = T.fgd, Q = nm3s(c) * (50 + 273.15) / 273.15 * 1.05; if (!(c.gas > 0) || !(c.so2 > c.outSo2)) return { error: 'Outlet SO₂ must be below inlet SO₂' };
  const eta = 1 - c.outSo2 / c.so2, levels = Math.min(7, (eta > 0.98 ? 5 : eta > 0.96 ? 4 : eta > 0.92 ? 3 : 2) + (c.so2 > 2500 ? 1 : 0)), area = Q / F.velocity, towers = area > 330 ? 2 : 1, dia = Math.sqrt(4 * area / towers / Math.PI), height = F.towerExtra + F.levelH * levels + 5;
  const alloy = c.material.startsWith('Alloy'), lines = [], add = adder(lines), G1 = 'Absorber', G2 = 'Recirculation and fans', G3 = 'Limestone and gypsum', G4 = 'Waste water and BoP', G5 = 'Civil, erection and test';
  const shellKg = towers * Math.PI * dia * height * F.shellT * 7850, linedM2 = towers * (Math.PI * dia * height + area / towers * 1.2);
  add(G1, `Absorber shell, ${towers} × ${R2(dia, 1)} m dia × ${R2(height, 0)} m, ${levels} spray levels`, shellKg, 'kg', F.steelRate + F.fabRate); add(G1, alloy ? 'Alloy 2205 cladding' : 'Rubber / glass-flake lining', linedM2, 'm²', F.lining * (alloy ? F.alloyF : 1));
  add(G1, 'Spray headers, nozzles (SiC) and internals', levels * area, 'm²', F.sprayPerLevelM2 * 1); add(G1, 'Mist eliminators and wash system', towers, 'no', F.mistElim * (area / towers / 200));
  const flowPerLevel = F.lg * c.gas / 1000 / levels / towers, pumpKw = flowPerLevel * F.pumpHead * 1000 * 9.81 / 3600 / 0.8 / 1000 * 1.0; add(G2, `Recirculation pumps, ${levels * towers} × ${R2(flowPerLevel, 0)} m³/h, ${R2(pumpKw, 0)} kW each`, levels * towers * pumpKw, 'kW', F.pumpKwRate);
  const fanKw = Q * F.fanDp / 0.8; add(G2, `Booster / ID fan ${R2(fanKw / 1000, 1)} MW`, fanKw, 'kW', F.fanKwRate); add(G2, 'Gas ducts, dampers and expansion joints', Q, 'm³/s', F.ducts);
  const so2Kg = nm3s(c) * (c.so2 - c.outSo2) / 1e6 * 3600, limeTh = so2Kg * 100 / 64 * F.stoich / F.limePurity / 1000, gypTh = so2Kg * 172 / 64 / 1000 * 1.1;
  add(G3, `Limestone preparation: ball mill and slurry tanks, ${R2(limeTh, 1)} t/h`, limeTh, 't/h', F.limeMill * 2.2); add(G3, `Gypsum dewatering: hydrocyclones and belt filters, ${R2(gypTh, 1)} t/h`, gypTh, 't/h', F.gypsum);
  add(G4, 'Waste-water treatment and bleed handling', 1, 'lot', F.wwtp * (c.gas / 2.6e6) ** 0.6); add(G4, 'Instruments, analysers, DCS and electrics', 1, 'lot', F.instr * (c.gas / 2.6e6) ** 0.6);
  const eq = lines.reduce((s, l) => s + l.amount, 0); add(G4, 'Piping, valves, structure and building services', 1, 'lot', eq * F.bop);
  add(G5, 'Foundations, tanks and buildings', area, 'm²', F.civilPerM2); add(G5, 'Erection and commissioning', 1, 'lot', eq * F.erect); add(G5, 'Performance tests', 1, 'lot', eq * F.test);
  const { base, total, parts, pm } = finish(lines, T.stack), mw = c.gas / 2.6e6 * 660;
  return { cfg: c, kind: 'fgd', lines, parts, pm, base, total, Q, eta, levels, towers, dia, height, area, pumpKw, fanKw, limeTh, gypTh, steelT: shellKg / 1000, perUnit: total / mw, mwEq: mw, size: `${towers} × ${R2(dia, 1)} m absorber` };
}
