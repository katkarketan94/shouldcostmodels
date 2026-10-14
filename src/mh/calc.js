// Material-handling packages (coal, ash, bulk conveying). Not a workbook model: the reference workbooks supply the scope, the
// quantities and the vendor billing rates, and this model stitches them into a bottom-up should-cost.
//   conveyors: belt sizing (capacity, speed, power, tension) -> belt, idlers, pulleys, drives, structure, chutes, electrical
//   front end (tipplers, stacker-reclaimers, crushers, feeders, cranes): mass-based, calibrated to the Elecon purchase order
//   ash handling: hoppers, slurry pumps, pneumatic conveying, silos, compressors
//   erection: built up from structure tonnes, belt metres, idler sets and drives
import { STD_KW, computePump, PUMP_DEFAULTS } from '../pump/calc.js';
import { computeCI, CI_DEFAULTS } from '../cicable/calc.js';
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d, G = 9.81;
export const WIDTHS = [650, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200];
const VMAX = { 650: 2.0, 800: 2.5, 1000: 2.5, 1200: 3.15, 1400: 3.15, 1600: 3.15, 1800: 3.5, 2000: 3.5, 2200: 4.0 };
const SPEEDS = [1.25, 1.6, 2.0, 2.5, 3.15, 3.5, 4.0];
const ROLL = { 650: [89, 250, 20], 800: [102, 315, 20], 1000: [127, 380, 25], 1200: [133, 465, 30], 1400: [159, 530, 35], 1600: [159, 600, 40], 1800: [178, 670, 40], 2000: [178, 750, 45], 2200: [194, 800, 50] };   // dia, centre-roll length (mm), shaft dia
export const NN = [315, 400, 500, 630, 800, 1000, 1250, 1600], ST = [1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000];
export const MATERIALS = { 'Coal': { rho: 0.85, top: 8, bot: 4 }, 'Crushed coal': { rho: 0.85, top: 8, bot: 4 }, 'Limestone': { rho: 1.4, top: 10, bot: 5 }, 'Bottom ash': { rho: 1.0, top: 10, bot: 5 }, 'Gypsum': { rho: 1.1, top: 8, bot: 4 }, 'Iron ore': { rho: 2.2, top: 12, bot: 6 }, 'Sand / aggregate': { rho: 1.6, top: 10, bot: 5 } };
export const LOTS = ['L01', 'L02', 'L03', 'L04', 'L05', 'L06', 'L07', 'L08', 'L09', 'L10', 'L11', 'L12'];
export const MH_DEFAULTS = {
  prices: { plate: 68, section: 66, tube: 78, shaft: 130, rubber: 150, nnFabric: 420, steelCord: 105, copper: 1400 },
  belt: { fric: 0.022, mu: 0.35, wrapSingle: 3.67, wrapDual: 6.98, sfFabric: 10, sfCord: 8, convFabric: 2400, convCord: 2900, rollRotFrac: 0.55, dualAbove: 450, htFrom: 200, driveEff: 0.9, designMargin: 1.1, cordAbove: 1600, cordLen: 1200 },
  idler: { pitchCarry: 1.2, pitchReturn: 3.0, saEvery: 15, impactSets: 15, transitionSets: 5, rollConv: 350, housing: 110, bearingPair: 950, seals: 350, frameCarryKg: 0.034, frameReturnKg: 0.015, frameConv: 45, impactMult: 1.3, saFrameMult: 2.0 },
  pulley: { kg: 0.0012, exp: 2.05, ndFrac: 0.5, conv: 45, shaftFrac: 0.3, lagDriveM2: 9000, lagNd: 2400, bearing: 72000, plummer: 75000, sleeve: 9600 },
  drive: { htKw: 36400, htExp: 0.75, ltKw: 4300, ltExp: -0.18, gbK: 17000, gbExp: 0.78, hsBase: 350000, hsPerKw: 650, lsFrac: 0.2, brakeBase: 40000, brakePerKw: 90 },
  structure: { kgPerM: 62, kgExp: 1.5, conv: 15000, paint: 8000, transport: 4000, wastage: 1.08, chuteKg: 7000, chuteExp: 2.1, linerFrac: 0.25, linerRate: 160, chuteConv: 30000, gateEach: 1058400, gateExp: 1.6, gatesPerConv: 1.5, skirtKgPerM: 3.2, skirtConv: 22000, foundation: 700000 },
  tripper: { structT: 28, chuteT: 7, lumpBought: 5500000, ref: 3300 },
  scraper: { primary: 51800, secondary: 70000, internal: 42000, per: 1.1, misc: 330000, vulcanizer: 3053400 },
  qd: { magnet: 5600000, susp: 4089120, metalDet: 901320, weigher: 484400, detExp: 1.5, ref: 2000, sampling: 8000000, ilmsOil: 5600000 },
  elec: { ctrlPerM: 1.3, instrPerM: 1.3, powerLen: 130, powerLtBase: 400, powerLtPerKw: 6.2, powerHtBase: 1900, powerHtPerKw: 1.4, trayPerM: 1700, condPerM: 850, pullCordPerM: 1000, swayPerM: 600, panelPerConv: 700000, jbPerConv: 250000, other: 1500000 },
  frontEnd: { wtT: 520, sacT: 120, shifterT: 60, wtLump: 35000000, scrPerTph: 0.33, scrLump: 40000000, crT: 95, crKw: 1000, vfT: 12, vfLump: 3500000, afT: 70, afLump: 5000000, craneBase: 190000, craneSpan: 18, vent: 10000000, heavyRate: 118000, cal: 1.014 },
  dust: { de: 8500000, dryFog: 32000000, dss: 18000000 },
  ahs: { hopperT: 85, hopperRate: 130000, slurryFactor: 2.2, pipeKm: 4.2, pipeRate: 24000000, hydrobin: 4500000, pneuPerTph: 280000, pneuExp: 0.8, siloRccM3Rate: 15000, siloSteelRate: 90, compressorPerKw: 28000, dryerPerM3: 160000, screwConv: 2500000 },
  erect: { structPerT: 16000, chutePerT: 22000, beltPerM: 520, spliceEach: 120000, idlerSet: 420, driveEach: 450000, pulleyEach: 90000, commissionConv: 600000, feFrac: 0.09, elecFrac: 0.3, dustFrac: 0.15, cranes: 1.0 },
  stack: { spares: 0.049, overheads: 0.08, margin: 0.09 },
  debundle: { di: 0.04, proc: 0.006, inventory: 0.008, freight: 0.004 },
  budget: { control: 220, supplyAndErection: 1 },
};
const stdKw = (kw) => STD_KW.find((x) => x >= kw - 1e-9) ?? Math.ceil(kw / 500) * 500;
const NB = (n) => n;
export function sizeConveyor(x, T, mats = MATERIALS) {
  const m = mats[x.mat || 'Coal'] || mats.Coal, Q = x.tph, L = x.len, H = x.lift || 0, b = T.belt, i = T.idler;
  let width = x.width || WIDTHS.find((w) => { const A = 0.115 * (0.9 * w / 1000 - 0.05) ** 2; return 3600 * A * VMAX[w] * m.rho * 0.95 >= Q; }) || WIDTHS[WIDTHS.length - 1];
  const A = 0.115 * (0.9 * width / 1000 - 0.05) ** 2, vReq = Q / (3600 * A * m.rho * 0.95), v = x.speed || SPEEDS.find((s) => s >= vReq && s <= VMAX[width]) || VMAX[width];
  const Bm = width / 1000, mLoad = Q / (3.6 * v), r = ROLL[width], rollKg = (Math.PI * r[0] / 1000 * 0.006 * r[1] / 1000 * 7850) + (Math.PI / 4 * (r[2] / 1000) ** 2 * (r[1] / 1000 + 0.12) * 7850) + 6;
  const mIdl = (3 * rollKg * b.rollRotFrac) / i.pitchCarry + (2 * rollKg * 1.2 * b.rollRotFrac) / i.pitchReturn;
  const C = 1.05 + 70 / (L + 25), cover = m.top + m.bot;
  let useCord = !!x.cord || L > b.cordLen, rating = 630, beltKgM2 = 0, Te = 0, Pshaft = 0, T1 = 0, nDrive = 1;
  for (let it = 0; it < 4; it++) {
    beltKgM2 = useCord ? 0.0115 * rating + cover * 1.15 + 3 : 0.0014 * rating + cover * 1.15 + 1.5;
    const mBelt = beltKgM2 * Bm, main = b.fric * G * C * L * (mIdl + 2 * mBelt + mLoad), slope = mLoad * G * H;
    Te = Math.max(main + slope, 0.2 * main) * (x.trip ? 1.08 : 1); Pshaft = Te * v / 1000; nDrive = Pshaft / b.driveEff * b.designMargin > b.dualAbove ? 2 : 1;
    const phi = nDrive === 2 ? b.wrapDual : b.wrapSingle; T1 = Te * (1 + 1 / (Math.exp(b.mu * phi) - 1));
    const need = T1 * (useCord ? b.sfCord : b.sfFabric) / width; const table = useCord ? ST : NN, pick = table.find((s) => s >= need);
    if (!pick && !useCord) { useCord = true; rating = ST[0]; continue; } rating = pick || table[table.length - 1];
  }
  const Preq = Pshaft / b.driveEff * b.designMargin, kwEach = stdKw(Preq / nDrive), ht = kwEach >= b.htFrom;
  return { width, v, A, Bm, mLoad, rollKg, mIdl, C, useCord, rating, beltKgM2, Te, Pshaft, Preq, nDrive, kwEach, ht, T1, cover, rho: m.rho, capacity: 3600 * A * v * m.rho * 0.95 };
}
function stdEng() { return null; }
export function mhDefault() {
  const mk = (id, tph, len, lift, o = {}) => ({ id, tph, len, lift, qty: 2, mat: 'Coal', ...o });
  const nab = [mk('BC-15A/B', 1815, 118, 4), mk('BC-16A/B', 1815, 410, 25), mk('BC-18A/B', 1815, 182, 8), mk('BC-19A/B', 3300, 775, 32), mk('BC-20A/B', 1815, 320, 18), mk('BC-21A/B', 1815, 320, 18), mk('BC-22A/B', 1815, 273, 15), mk('BC-23A/B', 3300, 228, 6), mk('BC-24A/B', 3300, 683, 28), mk('BC-25A/B', 1815, 364, 20), mk('BC-26A/B', 3300, 228, 6), mk('BC-27A/B', 1815, 320, 18), mk('BC-28A/B', 1815, 182, 3), mk('BC-29A/B', 1815, 118, 2), mk('BC-30A/B', 1815, 146, 4)];
  const anu = nab.map((c) => ({ ...c, id: c.id.replace('BC-', 'AC-'), len: Math.round(c.len * 0.667) }));
  const none = { wt: 0, wtTips: 25, scr: 0, scrTph: 3300, apron: 0, apronTph: 2200, crusher: 0, crTph: 1815, vfeeder: 0, vfTph: 1815, crane: 0, craneT: 25, vent: 0 };
  const fe = { wt: 3, wtTips: 25, scr: 2, scrTph: 3300, apron: 3, apronTph: 2200, crusher: 4, crTph: 1815, vfeeder: 4, vfTph: 1815, crane: 3, craneT: 25, vent: 1 };
  const base = { conv: [], trippers: 0, tripTph: 3300, bfeeders: 0, mag: 0, susp: 0, md: 0, weigher: 0, sampling: 0, vulc: 0, de: 0, dryfog: 0, dss: 0, ...none, ahs: { on: 0, units: 2, baTph: 295, faTph: 354, mcsdTph: 472, silos: 3, mcsdSilo: 1, silosM3: 1500, compKw: 800, hopper: 2, hydrobins: 3 }, spares: 1, erection: 1 };
  const P = (tag, o) => JSON.parse(JSON.stringify({ tag, ...base, ...o }));
  return { list: [
    P('Reference conveying package, 3 × 800 MW (inferred schedule)', { conv: nab, trippers: 6, bfeeders: 4, mag: 6, susp: 4, md: 8, weigher: 6, sampling: 2, vulc: 1 }),
    P('Coal handling package, 2 × 800 MW (scaled, placeholder)', { conv: anu, trippers: 4, bfeeders: 3, mag: 4, susp: 2, md: 6, weigher: 4, sampling: 2, vulc: 1, de: 4, dryfog: 1, dss: 1, ...fe }),
    P('Ash handling package, 2 × 800 MW', { ahs: { on: 1, units: 2, baTph: 295, faTph: 354, mcsdTph: 472, silos: 3, mcsdSilo: 1, silosM3: 1500, compKw: 800, hopper: 2, hydrobins: 3 }, spares: 1 }),
    P('Limestone conveying, 800 TPH, 1.2 km', { conv: [mk('LC-1', 800, 1200, 18, { qty: 1, mat: 'Limestone' })], mag: 1, md: 1, vulc: 1, de: 2 }),
  ], sel: 0, unit: 'cr', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(MH_DEFAULTS)) };
}
export function computeMH(c, T, ctx = {}) {
  const P = T.prices, lines = [], add = (group, lot, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, lot, label, qty: R2(qty), unit, rate, amount: qty * rate, note }); };
  const convs = (c.conv || []).filter((x) => x.tph > 0 && x.len > 0).map((x) => { const s = sizeConveyor(x, T); return { ...x, ...s }; });
  const route = convs.reduce((s, x) => s + x.len * x.qty, 0), beltsN = convs.reduce((s, x) => s + x.qty, 0);
  const tot = (f) => convs.reduce((s, x) => s + f(x) * x.qty, 0);
  const warn = [];
  // belting
  let beltM = 0, nSplice = 0; const beltRows = {};
  for (const x of convs) {
    const len = (2 * Math.hypot(x.len, x.lift || 0) * 1.01 + 20) * x.qty, area = len * x.Bm; beltM += len; nSplice += x.qty * 2;
    const rubber = x.cover * 1.15 + (x.useCord ? 3 : 1.5), core = x.useCord ? 0.0115 * x.rating * P.steelCord : 0.0014 * x.rating * P.nnFabric;
    const perM2 = core + rubber * P.rubber + (x.useCord ? T.belt.convCord : T.belt.convFabric), key = x.useCord ? 'Steel cord belt' : 'Nylon-nylon belt';
    (beltRows[key] ||= { area: 0, amt: 0, m: 0 }); beltRows[key].area += area; beltRows[key].amt += area * perM2; beltRows[key].m += len;
  }
  for (const [k, v] of Object.entries(beltRows)) add('Belting', 'L02', `${k}, ${R2(v.m, 0)} m`, v.area, 'm²', v.amt / v.area);
  // idlers
  const i = T.idler; let cStd = 0, cImp = 0, cSa = 0, cTr = 0, rV = 0, rF = 0, rollCostSum = 0, rollN = 0, frameKg = 0, frameN = 0;
  for (const x of convs) {
    const nC = Math.ceil(x.len / i.pitchCarry), nImp = Math.min(nC, i.impactSets), nSa = Math.ceil(x.len / i.saEvery), nTr = i.transitionSets, nStd = Math.max(0, nC - nImp - nSa - nTr), nR = Math.ceil(x.len / i.pitchReturn), v = x.width >= 1400;
    cStd += nStd * x.qty; cImp += nImp * x.qty; cSa += nSa * x.qty; cTr += nTr * x.qty; if (v) rV += nR * x.qty; else rF += nR * x.qty;
    const rl = ROLL[x.width], roll = (Math.PI * rl[0] / 1000 * 0.006 * rl[1] / 1000 * 7850) * (P.tube + 8) + (Math.PI / 4 * (rl[2] / 1000) ** 2 * (rl[1] / 1000 + 0.12) * 7850) * P.shaft * 0.85 + 6 * i.housing + i.bearingPair + i.seals + i.rollConv;
    x._roll = roll; x._frameC = i.frameCarryKg * x.width * (P.section + i.frameConv); x._frameR = i.frameReturnKg * x.width * (P.section + i.frameConv);
  }
  const wavg = (f, n) => (convs.reduce((s, x) => s + f(x) * x.len * x.qty, 0) / Math.max(1, route));
  const rollAvg = wavg((x) => x._roll), fcAvg = wavg((x) => x._frameC), frAvg = wavg((x) => x._frameR);
  add('Idlers & frames', 'L03', 'Carrying idler rollers', cStd * 3, 'nos', rollAvg); add('Idlers & frames', 'L03', 'Carrying idler frames', cStd, 'nos', fcAvg);
  add('Idlers & frames', 'L03', 'Impact idler rollers and frames', cImp * 3, 'nos', rollAvg * i.impactMult + fcAvg / 3 * 1.1); add('Idlers & frames', 'L03', 'Self-aligning and guide idler sets', cSa, 'sets', (rollAvg * 3 + fcAvg) * i.saFrameMult * 0.6);
  add('Idlers & frames', 'L03', 'Transition idler sets', cTr, 'sets', rollAvg * 3 + fcAvg); add('Idlers & frames', 'L03', 'Return idler rollers (V-type, wide belts)', rV * 2, 'nos', rollAvg * 1.2); add('Idlers & frames', 'L03', 'Return idler frames (V-type)', rV, 'nos', frAvg);
  add('Idlers & frames', 'L03', 'Return idler rollers (flat)', rF, 'nos', rollAvg * 1.2); add('Idlers & frames', 'L03', 'Return idler frames (flat)', rF, 'nos', frAvg);
  // pulleys, bearings
  const pu = T.pulley; let nPul = 0, pulAmt = 0, brgAmt = 0, deflAmt = 0, nDefl = 0, nDriveP = 0, driveAmt = 0;
  for (const x of convs) {
    const mDrive = pu.kg * x.width ** pu.exp, n = x.qty, nD = x.nDrive, nN = 5 + (nD - 1);
    const dr = mDrive * (P.plate + pu.conv) + mDrive * pu.shaftFrac * (P.shaft - P.plate) + Math.PI * 1.25 * (x.width / 1000 + 0.2) * (x.width >= 1400 ? pu.lagDriveM2 : pu.lagNd), ndp = mDrive * pu.ndFrac * (P.plate + pu.conv) + mDrive * pu.ndFrac * pu.shaftFrac * (P.shaft - P.plate) + Math.PI * 0.8 * (x.width / 1000 + 0.2) * pu.lagNd;
    driveAmt += dr * nD * n; pulAmt += ndp * nN * n; nDriveP += nD * n; nPul += nN * n; const k = (x.width / 2000) ** 1.4, bp = (pu.bearing + pu.plummer + pu.sleeve) * 2 * k * (nD + nN) * n; brgAmt += bp; nDefl += 0.9 * n; deflAmt += 0.9 * n * 270000 * (x.width / 2000) ** 2;
  }
  add('Pulleys & deflector rollers', 'L06', 'Drive pulleys, lagged', nDriveP, 'nos', driveAmt / Math.max(1, nDriveP)); add('Pulleys & deflector rollers', 'L06', 'Tail, bend, snub and take-up pulleys', nPul, 'nos', pulAmt / Math.max(1, nPul)); add('Pulleys & deflector rollers', 'L06', 'Deflector rollers', nDefl, 'nos', deflAmt / Math.max(1, nDefl));
  add('Bearings & plummer blocks', 'L10', 'Pulley bearings, plummer blocks and adapter sleeves', 2 * (nPul + nDriveP), 'nos', brgAmt / Math.max(1, 2 * (nPul + nDriveP)));
  // drives
  const d = T.drive; let htKw = 0, ltKw = 0, gbAmt = 0, cpAmt = 0, brAmt = 0, nMotors = 0, nHt = 0, nLt = 0;
  for (const x of convs) { const n = x.nDrive * x.qty, kw = x.kwEach; nMotors += n; if (x.ht) { htKw += kw * n; nHt += n; } else { ltKw += kw * n; nLt += n; }
    gbAmt += n * d.gbK * kw ** d.gbExp; cpAmt += n * (d.hsBase + d.hsPerKw * kw) * 1 + n * (d.hsBase + d.hsPerKw * kw) * d.lsFrac * 0.3; brAmt += n * (d.brakeBase + d.brakePerKw * kw); x._motor = (x.ht ? d.htKw * kw ** d.htExp : kw * d.ltKw * Math.max(kw, 1) ** d.ltExp); }
  const motorHt = convs.filter((x) => x.ht).reduce((s, x) => s + x._motor * x.nDrive * x.qty, 0), motorLt = convs.filter((x) => !x.ht).reduce((s, x) => s + x._motor * x.nDrive * x.qty, 0);
  add('Drive train', 'L05', `HT motors (${nHt} nos, ${R2(htKw, 0)} kW)`, nHt, 'nos', motorHt / Math.max(1, nHt)); add('Drive train', 'L05', `LT motors (${nLt} nos, ${R2(ltKw, 0)} kW)`, nLt, 'nos', motorLt / Math.max(1, nLt));
  add('Drive train', 'L05', 'Gearboxes', nMotors, 'nos', gbAmt / Math.max(1, nMotors)); add('Drive train', 'L05', 'High- and low-speed couplings', nMotors, 'nos', cpAmt / Math.max(1, nMotors)); add('Drive train', 'L05', 'Brakes and holdbacks', nMotors, 'nos', brAmt / Math.max(1, nMotors));
  // structure and chutes
  const st = T.structure, structRate = P.section * st.wastage + st.conv / 1000 * 1 + st.paint / 1000 + st.transport / 1000;
  const structT = tot((x) => st.kgPerM * (x.width / 1000) ** st.kgExp * x.len) / 1000, chuteT = tot((x) => st.chuteKg * (x.width / 1000) ** st.chuteExp) / 1000, skirtT = tot((x) => st.skirtKgPerM * x.len * 0.3) / 1000;
  add('Technological structure', 'L04', 'Technological structure: stringers, short posts, head and tail frames', structT, 'T', structRate * 1000);
  const chuteRate = ((P.plate * 1.1) + st.linerFrac * st.linerRate + st.chuteConv / 1000) * 1000;
  add('Chutes, gates & tripper', 'L01', 'Discharge, interconnecting and debris chutes (with liners)', chuteT, 'T', chuteRate); add('Chutes, gates & tripper', 'L01', 'Skirt boards and sealing', skirtT, 'T', (P.plate + st.skirtConv / 1000) * 1000);
  const gates = tot((x) => st.gatesPerConv * (x.width / 2000) ** st.gateExp) / 1; add('Chutes, gates & tripper', 'L01', 'Flap, rod and rack-and-pinion gates', gates, 'nos', st.gateEach * 0.8 * (P.plate / 68));
  add('Chutes, gates & tripper', 'L01', 'Foundation bolts and embedment', 1, 'lot', st.foundation * Math.max(0.2, route / 9340));
  const tp = T.tripper, tk = (c.tripTph / tp.ref) ** 0.7;
  add('Chutes, gates & tripper', 'L01', 'Travelling tripper structure, chute and rails', c.trippers, 'nos', (tp.structT * tk * (structRate * 1.3 * 1000) + tp.chuteT * tk * chuteRate) + 600000 * tk);
  add('Drive train', 'L05', 'Tripper travel drives, brakes and clamps', c.trippers, 'nos', 1500000 * tk); add('Pulleys & deflector rollers', 'L06', 'Tripper pulleys and bearings', c.trippers * 2, 'nos', 1300500 * tk * (P.plate / 68));
  add('Electrical & C&I', 'L07', 'Tripper cable chain, panel and gear', c.trippers, 'nos', tp.lumpBought * 0.35 * tk);
  add('Chutes, gates & tripper', 'L01', 'Belt feeders with bias bin', c.bfeeders, 'nos', 1295000 * (P.plate / 68));
  // electrical & C&I
  const e = T.elec, ci = ctx.ci || computeCI(ctx.ctrlCfg || { family: 'control', n: 12, size: 2.5, volt: '650/1100 V', insul: 'PVC', sheath: 'PVC ST1', armour: 'GI round wire', shield: 'None', cond: 'Copper' }, { ...CI_DEFAULTS, rates: { ...CI_DEFAULTS.rates, copper: P.copper } }), ii = ctx.ii || computeCI(ctx.instrCfg || { family: 'instr', n: 4, size: 1, elem: 'Pair', volt: '300/500 V', insul: 'PVC', sheath: 'PVC ST1', armour: 'GI round wire', shield: 'Overall Al-Mylar', cond: 'Copper' }, { ...CI_DEFAULTS, rates: { ...CI_DEFAULTS.rates, copper: P.copper } });
  add('Electrical & C&I', 'L07', `Control cable, 12C × 2.5 mm² armoured (from the cable model)`, route * e.ctrlPerM, 'm', ci.total); add('Electrical & C&I', 'L07', 'Instrumentation cable, 4P × 1.0 mm² screened', route * e.instrPerM, 'm', ii.total);
  const lenP = e.powerLen; add('Electrical & C&I', 'L07', 'HT power cable to drives', nHt, 'drives', lenP * (e.powerHtBase + e.powerHtPerKw * (htKw / Math.max(1, nHt)))); add('Electrical & C&I', 'L07', 'LT power cable to drives', nLt + c.trippers * 2, 'drives', lenP * (e.powerLtBase + e.powerLtPerKw * (ltKw / Math.max(1, nLt))) * 0.6);
  add('Electrical & C&I', 'L07', 'Cable trays', route, 'm', e.trayPerM); add('Electrical & C&I', 'L07', 'Conduit, glands and accessories', route, 'm', e.condPerM); add('Electrical & C&I', 'L07', 'Pull-cord, belt-sway, zero-speed and chute-block switches', route, 'm', e.pullCordPerM + e.swayPerM);
  add('Electrical & C&I', 'L07', 'Local panels, junction boxes, PLC and belt-watch', beltsN, 'belts', e.panelPerConv + e.jbPerConv); add('Electrical & C&I', 'L07', 'Hooters, limit switches, push-button stations and misc', 1, 'lot', e.other * Math.max(0.1, route / 9340));
  // scrapers, misc, vulcaniser
  const s = T.scraper; add('Scrapers, misc & vulcaniser', 'L11', 'Primary, secondary and internal belt scrapers', beltsN * s.per * 3, 'nos', (s.primary + s.secondary + s.internal) / 3 * (P.plate / 68) ** 0.3);
  add('Scrapers, misc & vulcaniser', 'L11', 'Impact pads, bunker sealing, rail clamps', c.trippers + beltsN * 0.2, 'sets', s.misc / 2);
  add('Scrapers, misc & vulcaniser', 'L11', 'Belt vulcanising machine', c.vulc, 'nos', s.vulcanizer);
  // quality devices
  const q = T.qd, wref = convs.length ? convs.reduce((a, x) => a + x.width * x.len, 0) / Math.max(1, convs.reduce((a, x) => a + x.len, 0)) : 2000, wk = (wref / q.ref) ** q.detExp;
  add('Magnets, detection & weighing', 'L09', 'Inline magnetic separators with drive', c.mag, 'nos', q.magnet * wk * (P.copper / 1400) ** 0.2); add('Magnets, detection & weighing', 'L09', 'Suspended magnets', c.susp, 'nos', q.susp * wk); add('Magnets, detection & weighing', 'L09', 'Metal detectors', c.md, 'nos', q.metalDet * wk);
  add('Magnets, detection & weighing', 'L09', 'Belt weighers', c.weigher, 'nos', q.weigher); if (c.mag > 0) add('Magnets, detection & weighing', 'L09', 'ILMS oil and reject trolleys', 1, 'lot', q.ilmsOil * 0.2 * (c.mag / 6));
  add('Coal sampling', 'L12', 'Coal sampling units (primary sampler, crusher, divider, PLC)', c.sampling, 'sets', q.sampling);
  // front end
  const f = T.frontEnd, hr = f.heavyRate * P.plate / 68, calF = f.cal; let fe = 0;
  const feAdd = (label, n, unit, each) => { if (n > 0) { add('Front-end CHS equipment', 'FE', label, n, unit, each * calF); fe += n * each * calF; } };
  feAdd('Wagon tippler complex (tippler, side-arm charger, shifter, pusher, dribble conveyor)', c.wt, 'nos', ((f.wtT + f.sacT + f.shifterT) * hr + f.wtLump) * (c.wtTips / 25) ** 0.55);
  feAdd('Stacker-cum-reclaimer, bucket wheel', c.scr, 'nos', (c.scrTph * f.scrPerTph * hr + f.scrLump * (c.scrTph / 3300) ** 0.7));
  feAdd('Ring granulator crushers with HT drive', c.crusher, 'nos', f.crT * hr * (c.crTph / 1815) ** 0.8 + T.drive.htKw * stdKw(f.crKw * (c.crTph / 1815)) ** T.drive.htExp);
  feAdd('Vibrating feeders and screens', c.vfeeder, 'nos', f.vfT * hr * (c.vfTph / 1815) + f.vfLump * (c.vfTph / 1815) ** 0.8); feAdd('Apron feeders', c.apron, 'nos', f.afT * hr * (c.apronTph / 2200) ** 0.8 + f.afLump * (c.apronTph / 2200) ** 0.6);
  if (c.crane > 0) { const each = f.craneBase * c.craneT ** 0.6 * 1; add('Front-end CHS equipment', 'FE', `DG EOT cranes ${c.craneT} T`, c.crane, 'nos', each); fe += c.crane * each; }
  if (c.vent > 0) { add('Front-end CHS equipment', 'FE', 'Tunnel ventilation', c.vent, 'set', f.vent); fe += c.vent * f.vent; }
  // dust
  const du = T.dust; add('Dust management', 'DUST', 'Dust extraction systems (bag filter, fan, ducting)', c.de, 'nos', du.de); add('Dust management', 'DUST', 'Dry fog dust-suppression system', c.dryfog, 'nos', du.dryFog); add('Dust management', 'DUST', 'Dust suppression system (DSS)', c.dss, 'nos', du.dss);
  // ash handling
  const a = c.ahs || {}, ah = T.ahs;
  if (a.on) {
    const slurry = (tph, label) => { const flow = tph * 1.0 / 0.12 / 1000 * 1000 / 1000 * 10; return flow; };
    add('Ash handling', 'AHS', 'Bottom-ash hoppers (water-impounded, refractory-lined)', a.hopper, 'nos', ah.hopperT * 1000 * ah.hopperRate / 1000 * (a.baTph / 295) ** 0.7 * (P.plate / 68));
    const slurryQ = a.baTph * 8, pump = computePump({ type: 'H_AUX', flow: slurryQ, head: 90, sg: 1.15, visc: 1, material: 'Carbon steel (WCB)', seal: 'Packing / gland', vfd: 'No', exproof: 'No' }, PUMP_DEFAULTS);
    add('Ash handling', 'AHS', 'Bottom-ash slurry pumps (pump model × slurry duty factor)', 2 * a.units + 2, 'nos', pump.total * ah.slurryFactor); add('Ash handling', 'AHS', 'MCSD slurry pumps', 3, 'nos', pump.total * ah.slurryFactor * 1.1);
    add('Ash handling', 'AHS', 'Slurry piping (lined)', ah.pipeKm * a.units / 2, 'km', ah.pipeRate); add('Ash handling', 'AHS', 'Hydrobins (dewatering)', a.hydrobins, 'nos', ah.hydrobin);
    add('Ash handling', 'AHS', 'Pressure pneumatic fly-ash conveying systems', a.units, 'units', ah.pneuPerTph * a.faTph ** ah.pneuExp * 12); add('Ash handling', 'AHS', 'Fly-ash silos, steel', a.silos, 'nos', a.silosM3 * 0.12 * 1000 * ah.siloSteelRate + 4000000);
    add('Ash handling', 'AHS', 'MCSD fly-ash silo, RCC', a.mcsdSilo, 'nos', a.silosM3 * 1.2 * ah.siloRccM3Rate); add('Ash handling', 'AHS', 'Screw conveyors', 1, 'lot', ah.screwConv * a.units);
    add('Ash handling', 'AHS', 'Air compressors', a.compKw, 'kW', ah.compressorPerKw); add('Ash handling', 'AHS', 'Air dryers', a.compKw / 100, 'Nm³/min-eq', ah.dryerPerM3 * 6);
  }
  // spares
  const supply0 = lines.reduce((x, l) => x + l.amount, 0);
  if (c.spares) add('Mandatory spares', 'L08', `Mandatory spares, ${T.stack.spares * 100}% of supply`, 1, 'lot', supply0 * T.stack.spares / (1 - T.stack.spares));
  const direct = lines.reduce((x, l) => x + l.amount, 0), oh = direct * T.stack.overheads, mg = (direct + oh) * T.stack.margin, total = direct + oh + mg;
  // erection, built up
  const er = T.erect, erLines = [], eadd = (label, qty, unit, rate) => { if (qty > 0) erLines.push({ label, qty: R2(qty), unit, rate, amount: qty * rate }); };
  eadd('Technological structure erection', structT, 'T', er.structPerT); eadd('Chute and gate erection', chuteT + skirtT, 'T', er.chutePerT); eadd('Belt laying and hot vulcanised splices', beltM, 'm', er.beltPerM); eadd('Belt splices', nSplice, 'nos', er.spliceEach);
  eadd('Idler sets: fixing and alignment', cStd + cImp + cSa + cTr + rV + rF, 'sets', er.idlerSet); eadd('Drive and pulley erection and alignment', nMotors, 'drives', er.driveEach); eadd('Pulley erection', nPul, 'nos', er.pulleyEach);
  eadd('Front-end equipment erection', 1, 'lot', fe * er.feFrac); eadd('Cabling and electrical erection', lines.filter((l) => l.lot === 'L07').reduce((x, l) => x + l.amount, 0) * er.elecFrac, 'lot', 1); eadd('Dust management erection', lines.filter((l) => l.lot === 'DUST').reduce((x, l) => x + l.amount, 0) * er.dustFrac, 'lot', 1);
  eadd('Commissioning, trials and performance guarantee', beltsN, 'belts', er.commissionConv);
  const erTotal = erLines.reduce((x, l) => x + l.amount, 0);
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; }); groups.Overheads = oh; groups.Margin = mg;
  const lots = {}; lines.forEach((l) => { lots[l.lot] = (lots[l.lot] || 0) + l.amount * (1 + T.stack.overheads) * (1 + T.stack.margin); });
  const mechTonnes = structT + chuteT + skirtT;
  return { cfg: c, convs, route, beltsN, beltM, structT, chuteT, skirtT, mechTonnes, htKw, ltKw, nMotors, nHt, nLt, nPul, cStd, cImp, cSa, rV, rF, lines, groups, lots, direct, oh, mg, total, erLines, erTotal, erPct: erTotal / total, fe, feTotal: fe * (1 + T.stack.overheads) * (1 + T.stack.margin), warn, ci: ci.total, ii: ii.total };
}
