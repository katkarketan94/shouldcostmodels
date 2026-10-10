// Chiller should-cost: weight-based like the AHU workbook. Capacity sets heat-exchanger area (Q = U x A x LMTD), area sets tube and shell weight,
// compressor power sets the bought-out. This model is NOT taken from a workbook: every default is an engineering assumption to be replaced with quotes.
const TR_KW = 3.517, RHO_CU = 8960, RHO_AL = 2700, RHO_ST = 7850;

export const TYPES = {
  'WC screw':       { label: 'Water-cooled screw', cooled: 'water', kwTr: 0.62, comp: 'screw', refrig: 'R134a', minTr: 80, maxTr: 600 },
  'WC centrifugal': { label: 'Water-cooled centrifugal', cooled: 'water', kwTr: 0.57, comp: 'centrifugal', refrig: 'R134a', minTr: 250, maxTr: 2000 },
  'AC screw':       { label: 'Air-cooled screw', cooled: 'air', kwTr: 1.15, comp: 'screw', refrig: 'R134a', minTr: 80, maxTr: 500 },
  'AC scroll':      { label: 'Air-cooled scroll', cooled: 'air', kwTr: 1.22, comp: 'scroll', refrig: 'R410A', minTr: 20, maxTr: 200 },
};
export const REFRIGERANTS = { R134a: { price: 480, designBar: 21 }, R513A: { price: 650, designBar: 21 }, R1234ze: { price: 2600, designBar: 16 }, R410A: { price: 520, designBar: 42 } };

export const CHILLER_DEFAULTS = {
  prices: { 'Copper tube': 1400, 'Aluminium fin': 260, 'Steel plate': 73, 'GI sheet': 80 },
  dens: { 'Copper tube': RHO_CU, 'Aluminium fin': RHO_AL, 'Steel plate': RHO_ST, 'GI sheet': RHO_ST },
  refPrice: { R134a: 480, R513A: 650, R1234ze: 2600, R410A: 520 },
  thermal: { evapApproach: 2.5, evapU: 2.0, condApproach: 3, condU: 2.6, airDeltaT: 12, faceVel: 2.8, coilRows: 3, fpi: 14, fanDp: 150, fanEff: 0.5, lmtdFloor: 3 },
  geometry: { tubeOD: 19.05, tubeWall: 0.9, pitch: 25.4, bundleFill: 0.78, shellPad: 1.35, aspect: 4.5, coilTubeOD: 9.52, coilTubeWall: 0.35, coilPitch: 25, rowPitch: 21.65, finThk: 0.12, finHoleLoss: 0.15, bendAllow: 0.15 },
  shell: { stress: 138, jointEff: 0.85, corrosion: 1.5, minThk: 6, tubesheetFrac: 0.045, tubesheetMin: 25, waterboxThk: 10, headFactor: 1.1, scrap: 0.08, airCasingKgPerM2Face: 9 },
  bought: { compRate: { screw: 7500, centrifugal: 9000, scroll: 5200 }, compExp: 0.12, starterRate: 1800, vfdRate: 7500, fanRate: 20000, controlsFixed: 150000, controlsPerTr: 400, pipingPerTr: 800, economiserPerTr: 350, charge: { 'WC screw': 0.9, 'WC centrifugal': 0.6, 'AC screw': 1.1, 'AC scroll': 0.6 }, oilKg: 0.04, oilRate: 420, insulRate: 650 },
  frame: { kgPerTr: { 'WC screw': 11, 'WC centrifugal': 9, 'AC screw': 16, 'AC scroll': 14 }, rate: 73 },
  conv: { assemblyPerKg: 95, coilPerKg: 85, testPerTr: 450, packingPct: 0.01 },
  stack: { overheads: 0.10, margin: 0.12 },
};

export function chillerDefault() {
  return { list: [
    { tag: 'CH-01 Plant room, WC screw', type: 'WC screw', tr: 300, refrig: 'R134a', chwIn: 12, chwOut: 7, cwIn: 32, cwOut: 37.5, vfd: 'Y' },
    { tag: 'CH-02 Plant room, centrifugal', type: 'WC centrifugal', tr: 500, refrig: 'R134a', chwIn: 12, chwOut: 7, cwIn: 32, cwOut: 37.5, vfd: 'Y' },
    { tag: 'CH-03 Rooftop, AC screw', type: 'AC screw', tr: 200, refrig: 'R134a', chwIn: 12, chwOut: 7, cwIn: 32, cwOut: 37.5, vfd: 'N' },
    { tag: 'CH-04 Annexe, AC scroll', type: 'AC scroll', tr: 60, refrig: 'R410A', chwIn: 12, chwOut: 7, cwIn: 32, cwOut: 37.5, vfd: 'N' },
    { tag: 'CH-05 Process, WC screw 150', type: 'WC screw', tr: 150, refrig: 'R513A', chwIn: 12, chwOut: 7, cwIn: 32, cwOut: 37.5, vfd: 'N' },
  ], sel: 0, T: JSON.parse(JSON.stringify(CHILLER_DEFAULTS)), unit: 'tr', qty: 1 };
}

const lmtd = (hot1, hot2, cold1, cold2, floor) => { const a = hot1 - cold2, b = hot2 - cold1; if (a <= 0 || b <= 0) return null; const l = Math.abs(a - b) < 1e-6 ? a : (a - b) / Math.log(a / b); return Math.max(l, floor); };
const tubeKgM = (od, wall, rho) => Math.PI * (od - wall) * wall * rho / 1e6;   // kg per metre of tube, mm in
const plateT = (P, D, S, E, CA, min) => Math.max(min, P * D / (2 * S * E - 1.2 * P) + CA); // ASME VIII-1 shell, P in MPa/D in mm/S in MPa

/** shell & tube exchanger: tube area -> bundle -> shell diameter and length -> steel and copper weights */
function shellTube(areaM2, T, designBar) {
  const g = T.geometry, s = T.shell, od = g.tubeOD / 1000, p = g.pitch / 1000;
  const D = Math.cbrt((areaM2 * 3.464 * p * p * g.shellPad) / (Math.PI ** 2 * g.bundleFill * od * g.aspect));   // m, from A = N x pi x OD x L, L = aspect x D
  const L = g.aspect * D, N = Math.round(areaM2 / (Math.PI * od * L));
  const tubeLen = areaM2 / (Math.PI * od) * 1.03;                                                                    // 3% tube-sheet allowance
  const cuKg = tubeLen * tubeKgM(g.tubeOD, g.tubeWall, T.dens['Copper tube']);
  const tShell = plateT(designBar / 10, D * 1000, s.stress, s.jointEff, s.corrosion, s.minThk);
  const shellKg = Math.PI * D * L * tShell / 1000 * T.dens['Steel plate'];
  const tTs = Math.max(s.tubesheetMin, s.tubesheetFrac * D * 1000), tubesheetKg = 2 * Math.PI / 4 * D * D * tTs / 1000 * T.dens['Steel plate'];
  const headKg = 2 * Math.PI / 4 * D * D * s.headFactor * tShell / 1000 * T.dens['Steel plate'] + 2 * Math.PI / 4 * D * D * 1.15 * s.waterboxThk / 1000 * T.dens['Steel plate'];
  return { area: areaM2, D, L, N, tubeLen, cuKg, tShell, tTs, steelKg: (shellKg + tubesheetKg + headKg) * (1 + s.scrap), shellKg, tubesheetKg, headKg };
}

/** tube-fin air-cooled condenser: face area from airflow, copper and aluminium weights by the AHU workbook's coil geometry */
function finCoil(qKw, T) {
  const t = T.thermal, g = T.geometry, s = T.shell;
  const flow = qKw / (1.15 * 1.006 * t.airDeltaT), face = flow / t.faceVel;           // m3/s, m2
  const tubeLen = t.coilRows * face * 1000 / g.coilPitch * (1 + g.bendAllow);         // m (rows x face / vertical pitch)
  const cuKg = tubeLen * tubeKgM(g.coilTubeOD, g.coilTubeWall, T.dens['Copper tube']);
  const depth = t.coilRows * g.rowPitch / 1000;
  const alKg = face * 1000 * t.fpi / 25.4 * depth * (1 - g.finHoleLoss) * g.finThk / 1000 * T.dens['Aluminium fin'];
  const fanKw = flow * t.fanDp / (1000 * t.fanEff);
  const casingKg = face * s.airCasingKgPerM2Face * (1 + s.scrap);
  return { flow, face, tubeLen, cuKg, alKg, depth, fanKw, casingKg, W: Math.sqrt(face * 3), H: Math.sqrt(face / 3) };
}

export function computeChiller(cfg, T) {
  const ty = TYPES[cfg.type], P = T.prices, th = T.thermal, b = T.bought, c = T.conv;
  if (!ty) return { error: 'Unknown chiller type' };
  if (!(cfg.tr > 0)) return { error: 'Enter a capacity above zero' };
  if (cfg.chwIn <= cfg.chwOut) return { error: 'Chilled water return must be warmer than supply' };
  if (ty.cooled === 'water' && cfg.cwOut <= cfg.cwIn) return { error: 'Condenser water outlet must be warmer than inlet' };
  const qE = cfg.tr * TR_KW, pIn = cfg.tr * ty.kwTr, qC = qE + pIn;
  const tEvap = cfg.chwOut - th.evapApproach;
  const lmE = lmtd(cfg.chwIn, cfg.chwOut, tEvap, tEvap, th.lmtdFloor);
  if (!lmE) return { error: 'Chilled water temperatures leave no driving force in the evaporator' };
  const ev = shellTube(qE / (th.evapU * lmE), T, REFRIGERANTS[cfg.refrig].designBar * 0.8);
  let co, cond;
  if (ty.cooled === 'water') {
    const tC = cfg.cwOut + th.condApproach, lmC = lmtd(tC, tC, cfg.cwIn, cfg.cwOut, th.lmtdFloor);
    if (!lmC) return { error: 'Condenser water temperatures leave no driving force in the condenser' };
    co = shellTube(qC / (th.condU * lmC), T, REFRIGERANTS[cfg.refrig].designBar); cond = { kind: 'shell', ...co, lmtd: lmC, tSat: tC };
  } else { co = finCoil(qC, T); cond = { kind: 'coil', ...co }; }

  const cuKg = ev.cuKg + co.cuKg, alKg = cond.kind === 'coil' ? co.alKg : 0;
  const shellSteel = ev.steelKg + (cond.kind === 'shell' ? co.steelKg : 0), casingKg = cond.kind === 'coil' ? co.casingKg : 0;
  const frameKg = cfg.tr * T.frame.kgPerTr[cfg.type] * (1 + T.shell.scrap);
  const insArea = Math.PI * ev.D * ev.L + 2 * Math.PI / 4 * ev.D ** 2 * 1.1;
  const chargeKg = cfg.tr * b.charge[cfg.type], refR = T.refPrice[cfg.refrig];
  // A material
  const mat = { 'Copper tube': cuKg * P['Copper tube'], 'Aluminium fin': alKg * P['Aluminium fin'], 'Shell & plate steel': shellSteel * P['Steel plate'], 'Skid frame': frameKg * T.frame.rate, 'Air-cooled casing': casingKg * P['GI sheet'] };
  const A = Object.values(mat).reduce((x, y) => x + y, 0);
  // B bought-out
  const comp = b.compRate[ty.comp] * pIn * (pIn / 100) ** -b.compExp;
  const drive = (cfg.vfd === 'Y' ? b.vfdRate : b.starterRate) * pIn;
  const fans = cond.kind === 'coil' ? co.fanKw * b.fanRate : 0;
  const controls = b.controlsFixed + b.controlsPerTr * cfg.tr;
  const circuit = (b.pipingPerTr + (ty.comp === 'screw' ? b.economiserPerTr : 0)) * cfg.tr;
  const refrig = chargeKg * refR + cfg.tr * b.oilKg * b.oilRate;
  const insul = insArea * b.insulRate;
  const bought = { 'Compressor + motor': comp, [cfg.vfd === 'Y' ? 'VFD' : 'Starter']: drive, 'Condenser fans': fans, 'Controls & sensors': controls, 'Valves, piping, economiser': circuit, 'Refrigerant & oil': refrig, 'Evaporator insulation': insul };
  const B = Object.values(bought).reduce((x, y) => x + y, 0);
  // C conversion
  const conv = { 'Assembly, welding & brazing': (shellSteel + frameKg + casingKg) * c.assemblyPerKg, 'Coil / tube expansion & test': (cuKg + alKg) * c.coilPerKg, 'Factory test': cfg.tr * c.testPerTr };
  const Cs = Object.values(conv).reduce((x, y) => x + y, 0), C = Cs + (A + B + Cs) * c.packingPct;
  const D = T.stack.overheads * (A + B + C), E = T.stack.margin * (A + B + C + D), total = A + B + C + D + E;
  const weight = cuKg + alKg + shellSteel + frameKg + casingKg + chargeKg * 1.0;
  const len = cond.kind === 'shell' ? Math.max(ev.L, co.L) + 1.0 : Math.max(co.W, ev.L) + 0.6;
  return { cfg, ty, qE, pIn, qC, kwTr: ty.kwTr, cop: qE / pIn, ev: { ...ev, lmtd: lmE, tSat: tEvap }, cond, cuKg, alKg, shellSteel, frameKg, casingKg, chargeKg, insArea, mat, bought, conv, packing: (A + B + Cs) * c.packingPct, A, B, C, D, E, total, perTr: total / cfg.tr, weight, comp, size: { L: len, W: cond.kind === 'shell' ? ev.D + co.D + 0.9 : co.H + 1.1, H: cond.kind === 'shell' ? Math.max(ev.D, co.D) * 2 + 0.5 : co.H + 0.9 } };
}
