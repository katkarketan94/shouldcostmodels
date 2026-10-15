// Chiller should-cost, ported from the author's Chiller_Cost_Model workbook (Calculator, Assumptions & Ref, Summary). One row per configuration:
// duty -> temperatures -> evaporator and condenser sizing (Q = U x A x LMTD, tubes, shell, steel) -> priced build-up -> stack. Every rate is an unverified
// placeholder in the source workbook; the model is back-tested against the observed BOQ price on each row.
import WB from './workbook.json' with { type: 'json' };

const PI = Math.PI, ln = Math.log;
const ROUNDUP = (x, d = 0) => { const f = 10 ** d, v = +(Math.abs(x) * f).toPrecision(15); return Math.sign(x) * Math.ceil(v) / f; };
const TYPE_KEYS = ['name', 'code', 'wc', 'cls', 'volt', 'maxTR', 'evapApp', 'condApp', 'Ue', 'Uc', 'evPass', 'cdPass', 'vel', 'evtype', 'compRate', 'compPref', 'compN', 'motSep', 'lube', 'ctl', 'refKg'];
export const TYPE_NAMES = WB.types.map((t) => t[0]);
const tt = Object.fromEntries(WB.types.map((row) => { const o = Object.fromEntries(TYPE_KEYS.map((k, i) => [k, row[i]])); return [o.code, o]; }));
const { r_tubeAi, ...R0 } = WB.params;
export const CHILLER_DEFAULTS = { r: R0, tt, labels: WB.labels };
export const typeOf = (T, name) => Object.values(T.tt).find((t) => t.name === name);

export function chillerDefault() {
  return { list: WB.rows.map((x) => ({ ...x, atc: x.atc ?? 'No', cdFoul: x.cdFoul ?? 0.044, cwRange: x.cwRange ?? 0 })), sel: 0, unit: 'unit', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(CHILLER_DEFAULTS)) };
}

export function computeChiller(c, T) {
  const r = T.r, ty = typeOf(T, c.type); if (!ty) return { error: 'Choose a chiller type' };
  if (!(c.tr > 0)) return { error: 'Enter a capacity above zero' };
  if (!(c.cop > 0)) return { error: 'Enter the full-load COP' };
  if (!(c.chwIn > c.chwOut)) return { error: 'Chilled water return must be warmer than supply' };
  const WC = ty.wc === 1, HT = ty.volt === 'HT', BP = ty.evtype === 'BPHE', cwr = c.cwRange || 0;
  if (WC && !(cwr > 0)) return { error: 'Enter the condenser-water range for a water-cooled unit' };
  const tubeAi = PI / 4 * ((r.r_tubeOD - 2 * r.r_tubeWall) / 1000) ** 2, ID = (n, pass, a, b) => 0;
  const U = c.tr * 3.517, V = U / c.cop, W = U + V, X = c.chwOut - ty.evapApp, Y = WC ? c.cwIn + cwr + ty.condApp : c.cwIn + ty.condApp, Z = (X + 273.15) / (Y - X), AA = c.cop / Z;
  if (!(Y > X)) return { error: 'Condensing temperature is not above evaporating temperature' };
  const AB = (c.chwIn - c.chwOut) / ln((c.chwIn - X) / (c.chwOut - X)), AC = WC ? cwr / ln((Y - c.cwIn) / (Y - c.cwIn - cwr)) : 0;
  const AD = 1 / (1 / ty.Ue + (c.evFoul || 0)), AE = U / (AD * AB), AF = U / (r.r_cpw * (c.chwIn - c.chwOut)) * 3.6;
  const AG = BP ? 0 : ROUNDUP(AF / 3600 / (ty.vel * tubeAi), 0), AH = AG * ty.evPass, tubeCirc = PI * r.r_tubeOD / 1000;
  const AI = AH === 0 ? 0 : ROUNDUP(AE / (AH * tubeCirc) * 10, 0) / 10;
  const bundle = (n) => Math.sqrt(4 * n * 0.866 * (r.r_pitch * r.r_tubeOD / 1000) ** 2 / r.r_fill / PI) + r.r_shellClr;
  const thk = (pDes, D) => Math.max(r.r_tmin, ROUNDUP((pDes / 10) * D * 1000 / (2 * r.r_stress - 1.2 * pDes / 10) + r.r_ca, 0));
  const steel = (D, L, t) => (PI * D * (L + 0.3) * t / 1000 + (1 + r.r_wbFac) * 2 * PI / 4 * D ** 2 * r.r_tsheet / 1000) * r.r_rhoSt * (1 + r.r_supFac);
  const AJ = AH === 0 ? 0 : bundle(AH) * r.r_floodFac, AK = AH === 0 ? 0 : thk(r.r_pDesE, AJ), AL = AH === 0 ? 0 : steel(AJ, AI, AK);
  const AM = WC ? 1 / (1 / ty.Uc + (c.cdFoul || 0)) : 0, AN = WC ? W / (AM * AC) : 0, AO = WC ? W / (r.r_cpw * cwr) * 3.6 : 0;
  const AP = WC ? ROUNDUP(AO / 3600 / (ty.vel * tubeAi), 0) : 0, AQ = AP * ty.cdPass, AR = AQ === 0 ? 0 : ROUNDUP(AN / (AQ * tubeCirc) * 10, 0) / 10;
  const AS = AQ === 0 ? 0 : bundle(AQ), AT = AQ === 0 ? 0 : thk(r.r_pDesC, AS), AU = AQ === 0 ? 0 : steel(AS, AR, AT);
  const AV = WC ? 0 : W / (r.r_airCp * r.r_airRise * r.r_airRho), AW = AV / r.r_faceV, AX = WC ? 0 : ROUNDUP(AV / r.r_fanFlow, 0);
  const AY = ty.motSep === 1 ? ROUNDUP(V / r.r_motEff * r.r_motMargin / 10, 0) * 10 : 0, AZ = AY > 0 ? AY : ROUNDUP(V / r.r_motEff * r.r_motMargin / 5, 0) * 5;
  const vfd = c.vfd === 'Yes', atc = c.atc === 'Yes' && WC;
  const BA = AH * AI * r.r_tubeKgM * r.r_cuTube, BB = AL * r.r_steelFab, BC = AH === 0 ? 0 : PI * AJ * AI * 1.15 * r.r_insul, BD = BP ? AE * r.r_bphe : 0;
  const BE = AQ * AR * r.r_tubeKgM * r.r_cuTube, BF = AU * r.r_steelFab, BG = AW * r.r_coilFace + AX * r.r_fanAC + AW * r.r_frameKg * r.r_steelFab;
  const BH = ty.compRate * ty.compPref * (V / ty.compPref) ** ty.compN, BI = AY * (HT ? r.r_motHT : r.r_motLT), BJ = vfd ? AZ * (HT ? r.r_vfdHT : r.r_vfdLT) : 0, BK = HT ? r.r_swgrHT : r.r_swgrLTbase + r.r_swgrLTkw * AZ;
  const BL = ty.lube, BM = c.tr * ty.refKg * r.r_refrig, BN = ty.ctl, BO = atc ? AQ * r.r_atcTube + r.r_atcFixed : 0, BP_ = r.r_pipePct * (BA + BB + BC + BD + BE + BF + BG + BH), BQ = r.r_avm;
  const BR = BA + BB + BC + BD + BE + BF + BG + BH + BI + BJ + BK + BL + BM + BN + BO + BP_ + BQ, BS = BR * r.r_assyPct, BT = BR * r.r_testPct, BU = (BR + BS + BT) * r.r_logPct, BV = BR * r.r_dutyPct, BW = BR + BS + BT + BU + BV;
  const BX = BW * r.r_ohPct, BY = BW * r.r_warrPct, BZ = (BW + BX + BY) * r.r_marginPct, CA = BW + BX + BY + BZ, CC = CA * r.r_ecPct, nos = c.nos || 1;
  const groups = [['Heat exchangers', BA + BB + BC + BD + BE + BF + BG, '#c27a2c'], ['Compressor and drive', BH + BI + BJ + BK + BL, '#2563eb'], ['Refrigerant, controls, ATC, piping', BM + BN + BO + BP_ + BQ, '#0ea5a4'], ['Assembly and test', BS + BT, '#8b5cf6'], ['Logistics and duty', BU + BV, '#94a3b8'], ['Overheads, guarantee, margin', BX + BY + BZ, '#0f9d6b']];
  const lines = [['Heat exchangers', 'Evaporator tubes', BA], ['Heat exchangers', 'Evaporator shell, tubesheets, water boxes', BB], ['Heat exchangers', 'Evaporator insulation', BC], ['Heat exchangers', 'Evaporator brazed plate (scroll)', BD], ['Heat exchangers', 'Condenser tubes', BE], ['Heat exchangers', 'Condenser shell, tubesheets, water boxes', BF], ['Heat exchangers', 'Air-cooled coil, fans, frame', BG],
    ['Compressor and drive', 'Compressor assembly', BH], ['Compressor and drive', `Compressor motor${HT ? ' (HT)' : ''}`, BI], ['Compressor and drive', vfd ? 'VFD' : 'VFD (not fitted)', BJ], ['Compressor and drive', HT ? 'HT switchgear' : 'LV starter', BK], ['Compressor and drive', 'Lube and oil system', BL],
    ['Refrigerant, controls, ATC, piping', 'Refrigerant charge', BM], ['Refrigerant, controls, ATC, piping', 'Controls panel', BN], ['Refrigerant, controls, ATC, piping', 'Auto tube cleaning', BO], ['Refrigerant, controls, ATC, piping', 'Refrigerant piping, valves, instruments', BP_], ['Refrigerant, controls, ATC, piping', 'Anti-vibration, base, misc', BQ],
    ['Assembly and test', 'Assembly, piping fabrication, leak and pressure test', BS], ['Assembly and test', 'Factory performance test', BT], ['Logistics and duty', 'Packing, forwarding, freight, insurance', BU], ['Logistics and duty', 'Customs duty', BV], ['Overheads, guarantee, margin', 'Overheads', BX], ['Overheads, guarantee, margin', 'Guarantee provision', BY], ['Overheads, guarantee, margin', 'OEM margin', BZ]].filter((l) => l[2] > 0).map(([group, label, amount]) => ({ group, label, amount }));
  const flags = (c.tr > ty.maxTR ? 'TR above type max; ' : '') + (AI > r.r_Lmax ? 'Evap tube too long; ' : '') + (AR > r.r_Lmax ? 'Cond tube too long; ' : '') + (AA > r.r_carnotCap ? 'COP high vs lift; ' : '') + (WC && c.cwIn + cwr + ty.condApp >= X + 60 ? 'Check temps; ' : '');
  const obs = c.obsSupply > 0 ? c.obsSupply : null;
  return { cfg: c, ty, WC, HT, BP, qE: U, shaft: V, qC: W, tEvap: X, tCond: Y, carnot: Z, carnotFrac: AA, lmtdE: AB, lmtdC: AC, ev: { area: AE, flow: AF, tubesPass: AG, N: AH, L: AI, D: AJ, t: AK, steel: AL, U: AD }, cond: { kind: WC ? 'shell' : 'coil', area: AN, flow: WC ? AO : AV, tubesPass: AP, N: AQ, L: AR, D: AS, t: AT, steel: AU, U: AM, face: AW, fans: AX, air: AV }, motorKw: AY, driveKw: AZ,
    items: { BA, BB, BC, BD, BE, BF, BG, BH, BI, BJ, BK, BL, BM, BN, BO, BP: BP_, BQ }, material: BR, assembly: BS, test: BT, logistics: BU, duty: BV, direct: BW, oh: BX, warranty: BY, margin: BZ, total: CA, perTr: CA / c.tr, ec: CC, allUnits: (CA + CC) * nos, nos, groups, lines, flags: flags.trim(), stackOk: Math.abs(groups.reduce((s, g) => s + g[1], 0) - CA) < 1,
    obs, obsPerTr: obs ? obs / c.tr : null, vsObs: obs ? CA / obs - 1 : null, ecVsObs: c.obsEC > 0 ? CC / c.obsEC - 1 : null, kwTr: V / c.tr, cop: c.cop, weightApprox: AL + AU };
}
