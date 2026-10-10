// Ductwork should-cost per metre of run, material-weight based like the AHU workbook. Not taken from a workbook: defaults are assumptions to be replaced.
const RHO = { 'GI sheet': 7850, 'Pre-coated GI': 7850, 'Aluminium': 2700, 'SS 304': 7900 };
export const SHAPES = ['Rectangular', 'Round', 'Flat oval'];
export const MATS = Object.keys(RHO);
export const PRESSURE = { Low: { mult: 1, label: 'Low (to 500 Pa)' }, Medium: { mult: 1.25, label: 'Medium (to 1000 Pa)' }, High: { mult: 1.5, label: 'High (to 2000 Pa)' } };
export const JOINTS = { 'Slip + drive cleat': { kgPerM: 0.35, label: 'Slip + drive cleat' }, 'TDF flange': { kgPerM: 0.9, label: 'Roll-formed TDF flange' }, 'Companion angle': { kgPerM: 1.35, label: 'Companion angle flange' } };
export const INSULATIONS = { None: { fix: 0, mm: 0, label: 'None' }, 'Glass wool + foil': { fix: 95, mm: 9, label: 'Glass wool + foil' }, 'Closed-cell nitrile': { fix: 60, mm: 32, label: 'Closed-cell nitrile' } };

export const DUCT_DEFAULTS = {
  prices: { 'GI sheet': 80, 'Pre-coated GI': 95, Aluminium: 360, 'SS 304': 260, 'Angle / hanger steel': 68 },
  gauge: [[300, 0.5], [750, 0.63], [1200, 0.8], [1800, 1.0], [99999, 1.25]],      // longest side mm -> sheet thickness mm (low pressure)
  scrap: 0.10, jointSpacing: 1.2, stiffAngleKg: 1.12, stiffAbove: 750, consumablesPct: 0.03,
  hanger: { spacing: 2.4, rodDrop: 0.6, rodKgM: 0.62, trapezeKgM: 2.97, trapezeExtra: 0.2, roundClampKg: 0.8 },
  damperRate: 5200,
  fab: { perKg: 28, fittingFactor: 1.5, installPerM2: 160, installInsulPerM2: 45 },
  insulRates: { 'Glass wool + foil': { fix: 95, mm: 9 }, 'Closed-cell nitrile': { fix: 60, mm: 32 } },
  stack: { overheads: 0.10, margin: 0.12 },
};
export function ductDefault() {
  const base = { shape: 'Rectangular', w: 600, h: 400, dia: 500, run: 20, mat: 'GI sheet', pressure: 'Low', joint: 'Slip + drive cleat', ins: 'Glass wool + foil', insThk: 25, fittings: 25, dampers: 0, install: 'Y' };
  return { list: [
    { tag: 'DT-01 Supply branch', ...base },
    { tag: 'DT-02 Main trunk', ...base, w: 1200, h: 600, joint: 'TDF flange', dampers: 1, fittings: 15, run: 40 },
    { tag: 'DT-03 Return, uninsulated', ...base, w: 800, h: 500, ins: 'None', insThk: 0, run: 30 },
    { tag: 'DT-04 Fresh-air round', ...base, shape: 'Round', dia: 600, run: 25, fittings: 20 },
    { tag: 'DT-05 Kitchen exhaust SS', ...base, w: 700, h: 400, mat: 'SS 304', joint: 'Companion angle', ins: 'None', insThk: 0, run: 15, pressure: 'Medium' },
    { tag: 'DT-06 High-pressure riser', ...base, w: 1000, h: 800, pressure: 'High', joint: 'TDF flange', run: 12, dampers: 2 },
  ], sel: 0, T: JSON.parse(JSON.stringify(DUCT_DEFAULTS)), unit: 'm', qty: 1 };
}
export const longestSide = (c) => (c.shape === 'Round' ? c.dia : Math.max(c.w, c.h));
export const perimeter = (c) => (c.shape === 'Rectangular' ? 2 * (c.w + c.h) / 1000 : c.shape === 'Round' ? Math.PI * c.dia / 1000 : (Math.PI * Math.min(c.w, c.h) + 2 * (Math.max(c.w, c.h) - Math.min(c.w, c.h))) / 1000);
export const faceArea = (c) => (c.shape === 'Rectangular' ? c.w * c.h / 1e6 : c.shape === 'Round' ? Math.PI * (c.dia / 2000) ** 2 : (Math.PI / 4 * Math.min(c.w, c.h) ** 2 + (Math.max(c.w, c.h) - Math.min(c.w, c.h)) * Math.min(c.w, c.h)) / 1e6);

export function computeDuct(c, T) {
  if (!(c.run > 0)) return { error: 'Enter a run length above zero' };
  if (!(longestSide(c) > 0) || (c.shape !== 'Round' && !(Math.min(c.w, c.h) > 0))) return { error: 'Enter the duct dimensions' };
  const per = perimeter(c), L = longestSide(c);
  const baseThk = T.gauge.find(([mx]) => L <= mx)[1], thk = baseThk * PRESSURE[c.pressure].mult;
  const rho = RHO[c.mat], fit = c.fittings / 100, h = T.hanger;
  const sheetPerM = per * thk / 1000 * rho * (1 + T.scrap);                       // kg per m of straight run
  const joints = JOINTS[c.joint].kgPerM * per / T.jointSpacing;
  const stiff = c.joint !== 'Companion angle' && L > T.stiffAbove ? T.stiffAngleKg * per / T.jointSpacing : 0;
  const hang = (c.shape === 'Rectangular' ? 2 * h.rodDrop * h.rodKgM + h.trapezeKgM * (c.w / 1000 + h.trapezeExtra) : 2 * h.rodDrop * h.rodKgM + 2 * h.roundClampKg) / h.spacing;
  const straightKg = sheetPerM + joints + stiff;
  const sheetKg = sheetPerM * c.run * (1 + fit), jointKg = (joints + stiff) * c.run * (1 + fit), hangKg = hang * c.run;
  const surface = per * c.run * (1 + fit);                                          // m2 of duct surface incl. fittings
  const insDef = INSULATIONS[c.ins] || INSULATIONS.None, ir = T.insulRates[c.ins];
  const insArea = c.ins === 'None' ? 0 : (per + 8 * c.insThk / 1000) * c.run * (1 + fit), insRate = ir ? ir.fix + ir.mm * c.insThk : 0;
  const dampers = c.dampers * faceArea(c) * T.damperRate;
  const mat = { 'Duct sheet': sheetKg * T.prices[c.mat], 'Joints & stiffeners': jointKg * T.prices['Angle / hanger steel'], 'Hangers & supports': hangKg * T.prices['Angle / hanger steel'], Insulation: insArea * insRate };
  const sub = Object.values(mat).reduce((x, y) => x + y, 0), consum = sub * T.consumablesPct;
  const A = sub + consum;
  const B = dampers;
  const fabKg = (sheetPerM + joints + stiff) * c.run;                               // straight fabrication
  const fab = (fabKg + (sheetPerM + joints + stiff) * c.run * fit * T.fab.fittingFactor) * T.fab.perKg;
  const inst = c.install === 'Y' ? surface * T.fab.installPerM2 + insArea * T.fab.installInsulPerM2 : 0;
  const C = fab + inst;
  const D = T.stack.overheads * (A + B + C), E = T.stack.margin * (A + B + C + D), total = A + B + C + D + E;
  const weight = sheetKg + jointKg + hangKg;
  return { cfg: c, per, baseThk, thk, rho, sheetPerM, sheetKg, jointKg, hangKg, weight, surface, insArea, insRate, consum, mat, damperCost: dampers, fab, inst, A, B, C, D, E, total, perM: total / c.run, perM2: total / surface, perKg: total / weight, face: faceArea(c) };
}
