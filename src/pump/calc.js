// Pumps: one weight-based model for every family. Not a workbook model; every rate and constant is an editable assumption.
// Hydraulic duty -> efficiency -> shaft kW -> motor frame; weight from shaft kW and stages -> casting + machining; bought-outs by type.
export const MATERIALS = { 'Cast iron': { rate: 95, mass: 1.0 }, 'Ductile iron': { rate: 128, mass: 1.0 }, 'Carbon steel (WCB)': { rate: 215, mass: 1.05 }, 'SS 316 (CF8M)': { rate: 540, mass: 1.05 }, 'Duplex (CD4MCu)': { rate: 800, mass: 1.05 }, 'Super duplex': { rate: 1150, mass: 1.05 }, 'Bronze': { rate: 720, mass: 1.1 }, 'Hastelloy C': { rate: 3800, mass: 1.05 } };
export const SEALS = { 'Packing / gland': 6000, 'Single mechanical (API Plan 11)': 45000, 'Double mechanical (API Plan 53A)': 140000, 'Dry gas / tandem (API Plan 72)': 320000 };
export const STD_KW = [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 3.7, 5.5, 7.5, 9.3, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000, 1250, 1600, 2000, 2500, 3150, 4000];
const T = (cat, label, o) => ({ cat, label, orient: 'H', etaMax: 0.78, q0: 60, hps: 90, maxSt: 1, k: 14, mach: 70, drive: 'elec', seal: 'Single mechanical (API Plan 11)', rpm: 2900, motorMargin: 1.15, test: 1, pdp: false, ...o });
export const TYPES = {
  'OH1': T('Centrifugal', 'Overhung, foot mounted (OH1)', { etaMax: 0.78, q0: 70, hps: 90, k: 14, mach: 70, seal: 'Single mechanical (API Plan 11)' }),
  'OH2': T('Centrifugal', 'Overhung, centreline, API 610 (OH2)', { etaMax: 0.79, q0: 80, hps: 140, k: 24, mach: 105, seal: 'Single mechanical (API Plan 11)', motorMargin: 1.2, test: 2.2, api: true }),
  'BB1': T('Centrifugal', 'Between bearings, axially split (BB1)', { etaMax: 0.85, q0: 250, hps: 150, k: 20, mach: 85, seal: 'Single mechanical (API Plan 11)', test: 1.6 }),
  'BB2': T('Centrifugal', 'Between bearings, radially split (BB2)', { etaMax: 0.83, q0: 220, hps: 170, maxSt: 2, k: 28, mach: 115, motorMargin: 1.2, test: 2.2, api: true }),
  'BB3': T('Centrifugal', 'Between bearings, multistage axial split (BB3)', { etaMax: 0.81, q0: 200, hps: 120, maxSt: 9, k: 26, mach: 105, motorMargin: 1.15, test: 2, api: true }),
  'BB5': T('Centrifugal', 'Between bearings, barrel multistage (BB5)', { etaMax: 0.79, q0: 160, hps: 135, maxSt: 14, k: 38, mach: 135, seal: 'Double mechanical (API Plan 53A)', motorMargin: 1.2, test: 2.6, api: true }),
  'VS6': T('Centrifugal', 'Vertically suspended, can type (VS6)', { orient: 'V', etaMax: 0.80, q0: 150, hps: 110, maxSt: 8, k: 22, mach: 95, seal: 'Single mechanical (API Plan 11)', test: 2, column: true, defLen: 6, api: true }),
  'SEALLESS': T('Centrifugal', 'Sealless, magnetic drive', { etaMax: 0.68, q0: 50, hps: 70, maxSt: 1, k: 17, mach: 120, seal: 'Packing / gland', sealless: true, test: 1.4 }),
  'SUBC': T('Centrifugal', 'Submersible (motor in the liquid)', { orient: 'S', etaMax: 0.74, q0: 60, hps: 60, maxSt: 12, k: 12, mach: 80, drive: 'sub', seal: 'Single mechanical (API Plan 11)', rpm: 2900 }),
  'SELFPR': T('Centrifugal', 'Horizontal self-priming', { etaMax: 0.62, q0: 60, hps: 60, k: 18, mach: 75, seal: 'Single mechanical (API Plan 11)', selfpr: true }),
  'VT_CW': T('Vertical turbine', 'Circulating cooling water (VS1)', { orient: 'V', etaMax: 0.87, q0: 600, hps: 55, maxSt: 4, k: 17, mach: 70, seal: 'Packing / gland', rpm: 1450, column: true, defLen: 7, test: 1.6, motorMargin: 1.1 }),
  'VT_AUX': T('Vertical turbine', 'Auxiliary cooling water (VS1)', { orient: 'V', etaMax: 0.82, q0: 150, hps: 60, maxSt: 6, k: 17, mach: 75, seal: 'Packing / gland', rpm: 1450, column: true, defLen: 6, test: 1.3 }),
  'VT_RAW': T('Vertical turbine', 'Raw water intake (VS1, long column)', { orient: 'V', etaMax: 0.84, q0: 300, hps: 50, maxSt: 6, k: 19, mach: 78, seal: 'Packing / gland', rpm: 1450, column: true, defLen: 18, test: 1.4, intake: true }),
  'H_SVC': T('Horizontal service', 'Service water, end suction', { etaMax: 0.76, q0: 60, hps: 80, k: 13, mach: 68 }),
  'H_AUX': T('Horizontal service', 'Auxiliary water, split case / end suction', { etaMax: 0.80, q0: 120, hps: 100, k: 16, mach: 72 }),
  'H_SEAL': T('Horizontal service', 'Seal water, high-pressure multistage', { etaMax: 0.62, q0: 20, hps: 85, maxSt: 12, k: 15, mach: 95, seal: 'Single mechanical (API Plan 11)', test: 1.3 }),
  'SUMP': T('Submersible', 'Sump pump (drain, clean water)', { orient: 'S', etaMax: 0.68, q0: 30, hps: 30, maxSt: 3, k: 10, mach: 65, drive: 'sub', seal: 'Single mechanical (API Plan 11)' }),
  'DRAIN': T('Submersible', 'Drainage, dewatering', { orient: 'S', etaMax: 0.64, q0: 40, hps: 28, maxSt: 2, k: 11, mach: 65, drive: 'sub', seal: 'Double mechanical (API Plan 53A)', sealPlain: true }),
  'SEWAGE': T('Submersible', 'Sewage / non-clog', { orient: 'S', etaMax: 0.60, q0: 60, hps: 35, maxSt: 1, k: 14, mach: 70, drive: 'sub', seal: 'Double mechanical (API Plan 53A)', rpm: 1450 }),
  'PISTON': T('Positive displacement', 'Reciprocating, piston / plunger', { orient: 'PD', pd: true, etaMax: 0.82, q0: 1, hps: 4000, k: 32, mach: 180, seal: 'Packing / gland', rpm: 1450, test: 2, motorMargin: 1.2 }),
  'DIAPH': T('Positive displacement', 'Reciprocating, diaphragm (metering / process)', { orient: 'PD', pd: true, etaMax: 0.55, q0: 1, hps: 1500, k: 30, mach: 210, seal: 'Packing / gland', rpm: 1450, test: 1.5, sealless: true }),
  'GEAR': T('Positive displacement', 'Rotary, external gear', { orient: 'PD', pd: true, etaMax: 0.72, q0: 1, hps: 1000, k: 20, mach: 150, seal: 'Single mechanical (API Plan 11)', rpm: 1450, test: 1.3 }),
  'LOBE': T('Positive displacement', 'Rotary, lobe', { orient: 'PD', pd: true, etaMax: 0.68, q0: 1, hps: 600, k: 28, mach: 190, seal: 'Single mechanical (API Plan 11)', rpm: 750, test: 1.3 }),
  'VANE': T('Positive displacement', 'Rotary, sliding vane', { orient: 'PD', pd: true, etaMax: 0.7, q0: 1, hps: 400, k: 18, mach: 150, seal: 'Single mechanical (API Plan 11)', rpm: 1450, test: 1.3 }),
  'SCREW': T('Positive displacement', 'Rotary, twin screw', { orient: 'PD', pd: true, etaMax: 0.78, q0: 1, hps: 1500, k: 36, mach: 210, seal: 'Single mechanical (API Plan 11)', rpm: 1450, test: 1.8, motorMargin: 1.15 }),
  'F_ELEC_SPLIT': T('Fire', 'Electric main, horizontal split case', { fire: 'elec', etaMax: 0.84, q0: 150, hps: 120, k: 22, mach: 95, seal: 'Packing / gland', rpm: 2900, test: 2.2 }),
  'F_ELEC_ES': T('Fire', 'Electric main, end suction', { fire: 'elec', etaMax: 0.78, q0: 90, hps: 100, k: 17, mach: 85, seal: 'Single mechanical (API Plan 11)', rpm: 2900, test: 2.2 }),
  'F_DIESEL': T('Fire', 'Diesel engine main, horizontal split case', { fire: 'diesel', etaMax: 0.84, q0: 150, hps: 120, k: 22, mach: 95, seal: 'Packing / gland', rpm: 2100, test: 2.4, drive: 'diesel' }),
  'F_VT': T('Fire', 'Vertical turbine fire pump (electric)', { fire: 'elec', orient: 'V', etaMax: 0.82, q0: 200, hps: 90, maxSt: 5, k: 20, mach: 85, seal: 'Packing / gland', rpm: 2900, column: true, defLen: 6, test: 2.2 }),
  'F_JOCKEY': T('Fire', 'Jockey, multistage', { fire: 'jockey', orient: 'V', etaMax: 0.55, q0: 5, hps: 60, maxSt: 14, k: 11, mach: 90, seal: 'Single mechanical (API Plan 11)', rpm: 2900, test: 1.2 }),
};
export const CATS = ['Centrifugal', 'Vertical turbine', 'Horizontal service', 'Submersible', 'Positive displacement', 'Fire'];
export const PUMP_DEFAULTS = {
  mat: JSON.parse(JSON.stringify(MATERIALS)), seals: { ...SEALS },
  motorPerKw: 4300, motorExp: -0.18, motorExProof: 1.35, subMotorFactor: 1.7, dieselPerKw: 9800, dieselExp: -0.12, vfdPerKw: 7500,
  couplingPerKw: 360, couplingMin: 12000, baseplateKgPerKgPump: 0.55, baseplateRate: 95, fireController: { elec: 480000, diesel: 320000, jockey: 78000 }, dieselExtras: 240000,
  columnPerM: 26000, columnDiaExp: 0.7, subCablePerM: 1800, cableLen: 15, guideRail: 40000, instrumentation: 120000, bearingsPerKw: 450, bearingsMin: 15000,
  wettedFraction: 0.72, rotatingFraction: 0.22, selfPrimingFactor: 1.25, viscosityK: 0.012, listingPremium: 1.18, intakeStrainer: 90000, pdHeadKwK: 1,
  assemblyRate: 0.18, testPerKw: 900, testMin: 8000, packing: 0.025, transport: 0.02, overheads: 0.09, margin: 0.09,
};
const R = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export function pumpDefault() {
  const mk = (tag, type, o) => ({ tag, type, flow: 100, head: 50, sg: 1, visc: 1, material: 'Cast iron', seal: null, vfd: 'No', exproof: 'No', len: null, ...o });
  return { list: [
    mk('P-01 Process, OH2 API', 'OH2', { flow: 150, head: 90, material: 'Carbon steel (WCB)', sg: 0.85 }),
    mk('P-02 Boiler feed, BB5 barrel', 'BB5', { flow: 120, head: 1100, material: 'Carbon steel (WCB)' }),
    mk('P-03 Cooling-water circulation (VT)', 'VT_CW', { flow: 3000, head: 28, material: 'Ductile iron', len: 7 }),
    mk('P-04 Raw water intake (VT)', 'VT_RAW', { flow: 800, head: 40, material: 'Ductile iron', len: 18 }),
    mk('P-05 Basement sump, submersible', 'SUMP', { flow: 40, head: 18 }),
    mk('P-06 Dosing, diaphragm', 'DIAPH', { flow: 1.2, head: 400, material: 'SS 316 (CF8M)' }),
    mk('P-07 Fuel oil transfer, screw', 'SCREW', { flow: 30, head: 60, sg: 0.85, visc: 40, material: 'Carbon steel (WCB)' }),
    mk('FP-01 Fire main, electric 2850 lpm', 'F_ELEC_SPLIT', { flow: 171, head: 85, material: 'Cast iron' }),
    mk('FP-02 Fire main, diesel 2850 lpm', 'F_DIESEL', { flow: 171, head: 85, material: 'Cast iron' }),
    mk('FP-03 Jockey', 'F_JOCKEY', { flow: 10.8, head: 95, material: 'Cast iron' }),
  ], sel: 0, unit: 'unit', qty: 1, view: 'curve', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(PUMP_DEFAULTS)), };
}
export const stdMotor = (kw) => STD_KW.find((x) => x >= kw - 1e-9) ?? Math.ceil(kw / 500) * 500;
const efficiency = (ty, Q, visc, T) => { const base = ty.pd ? ty.etaMax * (0.55 + 0.45 * (1 - Math.exp(-Q / 1.5))) : ty.etaMax * (1 - 0.5 * Math.exp(-((Q / ty.q0) ** 0.6))); const v = ty.pd ? 1 : 1 / (1 + T.viscosityK * Math.max(0, visc - 1) ** 0.6); return Math.max(0.25, Math.min(ty.etaMax, base * v)); };
/** performance curve for the drawing: head and efficiency against flow (centrifugal); flat flow against pressure for PD */
export function curve(r) {
  const ty = r.ty, ch = r.fireChurn || 1.18, pts = [];
  for (let i = 0; i <= 24; i++) {
    const f = i * 1.7 / 24;
    if (ty.pd) { pts.push({ f, q: r.Q * f, h: r.head, eta: 0 }); continue; }
    const h = r.head * (ch - (ch - 1) * f ** 2 - (f > 1 ? 0.5 * (f - 1) ** 1.6 : 0)), eta = r.eta * Math.max(0, 1 - 1.15 * (f - 1) ** 2) * (f < 1 ? 1 : 1);
    pts.push({ f, q: r.Q * f, h: Math.max(0, h), eta });
  }
  return pts;
}
export function computePump(c, T) {
  const ty = TYPES[c.type]; if (!ty) return { error: 'Unknown pump type' };
  if (!(c.flow > 0) || !(c.head > 0)) return { error: 'Enter a flow and a head' };
  const mat = (T.mat || MATERIALS)[c.material] || (T.mat || MATERIALS)['Cast iron'], Q = c.flow, H = c.head, sg = c.sg || 1;
  const bar = H * sg * 0.0980665;
  const stages = ty.pd ? 1 : Math.max(1, Math.ceil(H / ty.hps)), warn = [];
  if (!ty.pd && stages > ty.maxSt) warn.push(`${H} m needs ${stages} stages; ${ty.label} is normally limited to ${ty.maxSt}. Choose a multistage type.`);
  if (ty.pd && H > ty.hps) warn.push(`${R(bar, 0)} bar is above the usual range of this pump (${R(ty.hps * 0.0981, 0)} bar).`);
  if (ty.pd && c.visc < 1) warn.push('');
  const eta = efficiency(ty, Q, c.visc || 1, T) * (ty.pd ? 1 : 1 - 0.008 * (stages - 1)), Ph = Q * H * sg * 9.80665 / 3600, shaft = Ph / eta;
  let fireChurn = 0, p150 = 0;
  if (ty.fire && ty.fire !== 'jockey') {   // NFPA 20: churn <= 140% of rated head, motor not overloaded at 150% flow (65% head)
    fireChurn = 1.2; p150 = 1.5 * Q * 0.65 * H * sg * 9.80665 / 3600 / (eta * 0.92);
  }
  const need = Math.max(shaft, p150), fire = ty.fire;
  const drive = ty.drive, kwReq = need * ty.motorMargin;
  const motorKw = drive === 'diesel' ? Math.ceil(kwReq / 5) * 5 : stdMotor(kwReq);
  // weight: pump mass ~ k * kW^0.75, plus stage and speed effects
  const w0 = ty.k * Math.max(motorKw, 1) ** 0.75 * (ty.pd ? 1 : stages ** 0.18) * (ty.rpm < 1000 ? 1.5 : ty.rpm < 1800 ? 1.25 : 1) * (ty.selfpr ? T.selfPrimingFactor : 1) * (1 + 0.08 * Math.log10(Math.max(1, (c.visc || 1))));
  const wetKg = w0 * T.wettedFraction, otherKg = w0 - wetKg, colLen = ty.column ? (c.len || ty.defLen) : 0;
  const colDia = Math.max(100, Math.sqrt(Q / 3600 / (Math.PI / 4 * 2.2)) * 1000), colKg = ty.column ? Math.PI * colDia / 1000 * 0.008 * 7850 * colLen * 1.6 : 0;
  const lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, label, qty: R(qty), unit, rate, amount: qty * rate, note }); };
  const G1 = 'Wetted parts & casting', G2 = 'Rotating assembly & sealing', G3 = 'Drive & bought-outs', G4 = 'Baseplate, column & accessories', G5 = 'Machining, assembly & test';
  add(G1, `Wetted castings, ${c.material}`, wetKg * mat.mass, 'kg', mat.rate); add(G1, 'Bearing housing, frame, stool (cast iron)', otherKg, 'kg', (T.mat || MATERIALS)['Cast iron'].rate);
  if (ty.column) add(G4, `Column pipe, shaft and bearings, ${R(colLen, 1)} m`, colLen, 'm', T.columnPerM * (colDia / 300) ** T.columnDiaExp, `Ø${R(colDia, 0)} mm`);
  add(G2, 'Shaft, impeller wear rings, sleeves', (wetKg * mat.mass * mat.rate + otherKg * 95) * T.rotatingFraction, 'lot', 1);
  const sealName = c.seal || ty.seal, sealRate = ty.sealless ? 0 : (T.seals || SEALS)[sealName] * Math.max(0.6, Math.min(3, (motorKw / 30) ** 0.35));
  if (ty.sealless) add(G2, ty.pd ? 'Diaphragm and valve set' : 'Magnetic coupling and containment shell', 1, 'set', Math.max(60000, motorKw * 6500)); else add(G2, `Shaft seal: ${sealName}`, 1, 'set', sealRate);
  add(G2, 'Bearings and lubrication', 1, 'set', Math.max(T.bearingsMin, motorKw * T.bearingsPerKw));
  let motorCost = 0, drivePerKw;
  if (drive === 'elec') { drivePerKw = T.motorPerKw * Math.max(motorKw, 1) ** T.motorExp * 1; if (c.exproof === 'Yes') drivePerKw *= T.motorExProof; motorCost = motorKw * drivePerKw; add(G3, `Motor ${motorKw} kW, IE3${c.exproof === 'Yes' ? ', flameproof' : ''}`, motorKw, 'kW', drivePerKw); }
  else if (drive === 'sub') { drivePerKw = T.motorPerKw * Math.max(motorKw, 1) ** T.motorExp * T.subMotorFactor; motorCost = motorKw * drivePerKw; add(G3, `Submersible motor ${motorKw} kW`, motorKw, 'kW', drivePerKw); }
  else if (drive === 'diesel') { drivePerKw = T.dieselPerKw * Math.max(motorKw, 1) ** T.dieselExp; motorCost = motorKw * drivePerKw; add(G3, `Diesel engine ${motorKw} kW (UL / FM / LPCB)`, motorKw, 'kW', drivePerKw); add(G3, 'Fuel tank, batteries, exhaust, cooling loop', 1, 'set', T.dieselExtras); }
  if (c.vfd === 'Yes' && drive !== 'diesel') add(G3, 'VFD', motorKw, 'kW', T.vfdPerKw);
  if (ty.pd) add(G3, 'Relief valve and pulsation dampener', 1, 'set', Math.max(25000, motorKw * 4000));
  if (!ty.orient || ty.orient === 'H' || ty.orient === 'PD') add(G4, 'Coupling and guard', 1, 'set', Math.max(T.couplingMin, motorKw * T.couplingPerKw));
  if (ty.orient === 'H' || ty.orient === 'PD') add(G4, 'Fabricated baseplate', (w0 + motorKw * 6) * T.baseplateKgPerKgPump, 'kg', T.baseplateRate);
  if (ty.orient === 'V') add(G4, 'Discharge head / motor stool and sole plate', 1, 'set', Math.max(30000, (w0 + colKg) * 0.35 * T.baseplateRate));
  if (ty.orient === 'S') { add(G4, `Power and control cable, ${T.cableLen} m`, T.cableLen, 'm', T.subCablePerM * Math.max(1, motorKw / 7.5) ** 0.5); add(G4, 'Guide rails, base elbow and lifting chain', 1, 'set', T.guideRail * Math.max(1, (w0 / 120) ** 0.5)); }
  if (ty.api) add(G4, 'Vibration, bearing temperature and seal-plan instruments', 1, 'set', T.instrumentation * Math.max(0.6, Math.min(3, motorKw / 100)));
  if (ty.intake) add(G4, 'Suction bell, strainer and intake accessories', 1, 'set', T.intakeStrainer);
  if (fire) { add(G3, fire === 'elec' ? 'Electric fire-pump controller (NFPA 20)' : fire === 'diesel' ? 'Diesel engine controller and alarm panel' : 'Jockey pump controller', 1, 'set', T.fireController[fire === 'jockey' ? 'jockey' : fire]); }
  const bought = lines.filter((l) => l.group === G3 || /Shaft seal|Magnetic|Bearings|Column|cable|Coupling|Discharge head|instruments/.test(l.label)).reduce((s, l) => s + l.amount, 0);
  const material = lines.reduce((s, l) => s + l.amount, 0), machKg = w0 + colKg;
  add(G5, 'Machining, balancing and assembly', machKg, 'kg', ty.mach * T.assemblyRate * 6 * mat.mass ** 0.5, '');
  add(G5, `Hydro and performance test${ty.api ? ' (witnessed, API 610)' : fire ? ' (UL / FM witness)' : ''}`, 1, 'lot', Math.max(T.testMin, motorKw * T.testPerKw) * ty.test);
  if (fire) add(G5, 'Listing, certification and label (UL / FM / LPCB)', 1, 'lot', (lines.reduce((s, l) => s + l.amount, 0)) * (T.listingPremium - 1));
  add(G5, 'Packing and transport', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * (T.packing + T.transport));
  const direct = lines.reduce((s, l) => s + l.amount, 0), oh = direct * T.overheads, mg = (direct + oh) * T.margin, total = direct + oh + mg;
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; }); groups.Overheads = oh; groups.Margin = mg;
  return { cfg: c, ty, Q, head: H, sg, bar, stages, eta, Ph, shaft, p150, motorKw, kwReq, fireChurn, weight: w0 + colKg, w0, colLen, colDia, lines, groups, direct, total, perKw: total / Math.max(motorKw, 0.01), perM3h: total / Q, warn: warn.filter(Boolean), bought, speciesFire: fire || '' };
}
