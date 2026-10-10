// Oil-immersed shunt reactor (gapped core). Not a workbook model: it reuses the Power transformer workbook's material prices, design constants,
// voltage-class tables and cost stack, and solves the winding by scanning volts per turn for the cheapest design that meets the loss limit.
import POWER from '../xfmr/power.json' with { type: 'json' };

const C = POWER.Calculator, R = POWER['Assumptions & Ref'], cv = (row) => C[`D${row}`].v, rv = (a) => R[a].v;
const MU0 = 4e-7 * Math.PI;

export const REACTOR_DEFAULTS = {
  prices: { copper: cv(34), crgo: cv(36), steel: cv(37), pressboard: cv(38), oil: cv(39) },                     // Rs/kg, Power workbook Section B
  dens: { copper: cv(62), crgo: cv(64), steel: cv(65), oil: cv(69), pressboard: cv(70) },
  design: { freq: cv(43), bm: 1.1, kc: 0.956, stack: cv(48), ratio: cv(49), fill: cv(58), jMin: cv(52), jMax: cv(53), jDesign: cv(55), rho: cv(60), stray: cv(59), fringeLoss: 0.1, build: cv(47), lossAt17: cv(45), lossN: cv(46),
    fringe: 1.15, gapFracMax: 0.35, gapEachMax: 0.06, etSeed: 0.75, lossLimitPct: 0.0025, fiveLimbAbove: 100, returnArea: 0.5, yokeArea: 0.6, shieldPct: 0.06, clampPct: cv(67), cover: cv(66) },
  tank: { shaping: cv(71), clearEnd: cv(72), below: cv(73), cover: cv(76), base: cv(77), stiff: cv(78), oilRise: cv(79) * cv(80), wallDiss: cv(81), radDiss: cv(82), radThk: cv(83), radGap: cv(84), radAllow: cv(85), conservator: cv(86), plate: cv(95) },
  waste: { copper: cv(92), crgo: cv(93), steel: cv(94), ins: cv(95) },
  stack: { design: cv(96), packing: cv(97), overheads: cv(98), margin: cv(99) },
  class: R && [6, 7, 8, 9, 10, 11].map((r) => ({ kv: rv(`B${r}`), coreGap: rv(`D${r}`), hvGap: rv(`E${r}`), phaseGap: rv(`F${r}`), endClear: rv(`G${r}`), hvTank: rv(`H${r}`), top: rv(`I${r}`), insRatio: rv(`J${r}`), wall: rv(`K${r}`), bushing: rv(`L${r}`), fittings: rv(`O${r}`), tests: rv(`P${r}`), labour: rv(`Q${r}`) })),
  neutralBushing: rv('C59'), monitoring: rv('C62'),
  ieema: { weights: { le400: [6, 32, 27, 12, 4, 9, 10], gt400: [9, 27, 24, 10, 8, 9, 13] }, idx: { C: [1375200, 1375200], ES: [95000, 95000], IS: [68000, 68000], IM: [275000, 275000], TO: [184800, 184800], W: [100, 100] } },
};

export function reactorDefault() {
  const mk = (tag, o) => ({ tag, mvar: 125, kv: 420, phases: 'Three phase', core: 'Auto', lossLimitPct: null, monitoring: 'No', refPrice: null, calib: 'None', qty: 1, ...o });
  return { list: [mk('SR-01 125 MVAr 420 kV', { refPrice: 125000000, calib: 'Own price', refSource: 'TBEA offer EQTR-25191 R6, shunt reactor (₹12.50 Cr)' }), mk('SR-02 80 MVAr 400 kV', { mvar: 80, kv: 400, calib: 'Model average' }), mk('SR-03 50 MVAr 220 kV', { mvar: 50, kv: 220, calib: 'Model average' }), mk('SR-04 25 MVAr 132 kV', { mvar: 25, kv: 132, lossLimitPct: 0.004, calib: 'Model average' }), mk('SR-05 16.7 MVAr single-phase 765 kV bank', { mvar: 16.7, kv: 765, phases: 'Single phase', lossLimitPct: 0.004, calib: 'None' })],
    sel: 0, unit: 'unit', qty: 1, view: 'cut', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(REACTOR_DEFAULTS)) };
}
const classRow = (T, kv) => T.class[Math.min(5, T.class.filter((c) => c.kv < kv / 1.06).length)];

/** one design for a given volts-per-turn: returns weights, losses, size and a feasibility flag */
function design(cfg, T, Et0) {
  const d = T.design, P = T.prices, rho = T.dens, k = classRow(T, cfg.kv);
  const ph = cfg.phases === 'Single phase' ? 1 : 3, Q = cfg.mvar * 1e6, Qph = Q / ph, Vph = cfg.kv * 1e3 / Math.sqrt(3), I = Qph / Vph, X = Vph / I, L = X / (2 * Math.PI * d.freq);
  const nW = ph, nR = ph === 1 ? 2 : (cfg.core === '5-limb' || (cfg.core !== '3-limb' && cfg.mvar >= d.fiveLimbAbove) ? 2 : 0);
  const N = Math.max(10, Math.round(Vph / Et0)), Et = Vph / N, phi = Et / (4.44 * d.freq), Anet = phi / d.bm, dia = Math.sqrt(Anet / (d.kc * Math.PI / 4 * d.stack));
  const H = d.ratio * dia, Hw = H + 2 * k.endClear / 1000, gapCW = k.hvGap / 1000;
  const limit = (cfg.lossLimitPct ?? d.lossLimitPct) * Q;
  // iron weight and loss
  const pitchOf = (Dout) => Dout + k.phaseGap / 1000;
  let J = d.jDesign, Rb, Din, Dout, MT, cuVol, Pcu, core, coreLoss, pitch, yokeLen;
  for (let it = 0; it < 8; it++) {
    Rb = N * I / (J * 1e6 * H * d.fill); Din = dia + 2 * gapCW; Dout = Din + 2 * Rb; MT = Math.PI * (Din + Rb);
    pitch = pitchOf(Dout); yokeLen = Math.max(1, nW + nR - 1) * pitch + dia;
    cuVol = N * MT * (I / (J * 1e6)); core = Anet * (nW * Hw + nR * Hw * d.returnArea + 2 * yokeLen * d.yokeArea) * rho.crgo;
    coreLoss = d.lossAt17 * (d.bm / 1.7) ** d.lossN * core * d.build;
    const Pcu0 = d.rho * N * MT * I * J, budget = (limit - coreLoss) / (1 + d.stray + d.fringeLoss);
    const Jn = budget > 0 ? budget / (d.rho * N * MT * I) : d.jMin;
    J = Math.min(d.jMax, Math.max(d.jMin, 0.5 * J + 0.5 * Jn)); Pcu = Pcu0;
  }
  Rb = N * I / (J * 1e6 * H * d.fill); Din = dia + 2 * gapCW; Dout = Din + 2 * Rb; MT = Math.PI * (Din + Rb); pitch = pitchOf(Dout); yokeLen = Math.max(1, nW + nR - 1) * pitch + dia;
  cuVol = N * MT * (I / (J * 1e6)); core = Anet * (nW * Hw + nR * Hw * d.returnArea + 2 * yokeLen * d.yokeArea) * rho.crgo; coreLoss = d.lossAt17 * (d.bm / 1.7) ** d.lossN * core * d.build;
  Pcu = d.rho * N * MT * I * J * nW; const copperLoss = Pcu * (1 + d.stray + d.fringeLoss), totalLoss = copperLoss + coreLoss;
  const lgTotal = MU0 * N * N * Anet * d.fringe / L, gapFrac = lgTotal / Hw, nGaps = Math.max(6, Math.ceil(lgTotal / d.gapEachMax)), gapEach = lgTotal / nGaps;
  const feasible = gapFrac <= d.gapFracMax && totalLoss <= limit * 1.0005 && J >= d.jMin - 1e-9;
  const cuKg = cuVol * nW * rho.copper, insKg = k.insRatio * cuKg * (1 + T.waste.ins) * (rho.pressboard ? 1 : 1);
  const clampKg = core * d.clampPct, shieldKg = core * d.shieldPct;
  // tank
  const tL = Math.max(1, nW + nR - 1) * pitch + Dout + 2 * k.hvTank / 1000, tW = Dout + 2 * k.hvTank / 1000 + (ph === 1 ? Dout : 0), tH = Hw + 2 * dia * 0.8 + k.top + T.tank.below;
  const t = k.wall / 1000, wallA = 2 * (tL + tW) * tH, plate = (wallA * t + (T.tank.cover + T.tank.base) * tL * tW * t) * (1 + T.tank.stiff) * rho.steel;
  const tankV = tL * tW * tH * T.tank.shaping, active = nW * cuVol * 1.0 + core / rho.crgo + insKg / rho.pressboard, oilM3 = Math.max(0, tankV - active);
  const wallDiss = wallA * T.tank.wallDiss * T.tank.oilRise, radW = Math.max(0, totalLoss - wallDiss), radA = radW / (T.tank.radDiss * T.tank.oilRise);
  const radSteel = radA * 2 * T.tank.radThk / 1000 * rho.steel * (1 + T.tank.radAllow), radOil = radA / 2 * T.tank.radGap / 1000;
  const consM3 = (oilM3 + radOil) * T.tank.conservator, consSteel = Math.PI * 0.3 * 4 * 0.3 * 1.0 * 0 + consM3 * 25 * rho.steel * 0.006 / 0.15 * 0.1;
  const steelKg = plate + radSteel + clampKg + consSteel, oilKg = (oilM3 + radOil + consM3 * 0.5) * rho.oil;
  const mat = { Copper: cuKg * (1 + T.waste.copper) * P.copper, 'CRGO core': core * (1 + T.waste.crgo) * P.crgo, 'Tank shielding': shieldKg * (1 + T.waste.crgo) * P.crgo, Steel: steelKg * (1 + T.waste.steel) * P.steel, Insulation: insKg * P.pressboard, 'Oil (first fill)': oilKg * P.oil };
  const A = Object.values(mat).reduce((s, v) => s + v, 0);
  return { ph, Q, Vph, I, X, L, nW, nR, N, Et, phi, Anet, dia, H, Hw, J, Rb, Din, Dout, MT, pitch, cuVol, cuKg, core, coreLoss, copperLoss, totalLoss, limit, lgTotal, gapFrac, nGaps, gapEach, feasible, insKg, clampKg, shieldKg, tL, tW, tH, tankV, oilM3, oilKg, plate, wallA, radA, radSteel, steelKg, mat, A, k, totalKg: cuKg + core + steelKg + insKg + oilKg + shieldKg };
}

export function computeReactor(cfg, T, avgFactor = 1) {
  if (!(cfg.mvar > 0) || !(cfg.kv > 0)) return { error: 'Enter a rating and a voltage' };
  const d = T.design, Et0 = d.etSeed * Math.sqrt(cfg.mvar * 1000 / (cfg.phases === 'Single phase' ? 1 : 3));
  let best = null, scan = [];
  for (let m = 0.3; m <= 3.2; m *= 1.07) { const x = design(cfg, T, Et0 * m); scan.push({ et: x.Et, cost: x.A, feasible: x.feasible, gapFrac: x.gapFrac, J: x.J }); const ok = x.feasible; if (!best || (ok && !best.feasible) || (ok === best.feasible && x.A < best.A)) best = x; }
  const x = best, k = x.k, P = T.prices;
  // B bought-out accessories and tests, by voltage class
  const bo = { 'HV bushings': (x.ph === 3 ? 3 : 1) * k.bushing, 'Neutral bushing': x.ph === 3 ? T.neutralBushing : 0, 'Fittings & protection': k.fittings, 'Routine & type tests': k.tests, 'Online DGA + bushing monitoring': cfg.monitoring === 'Yes' ? T.monitoring : 0, 'Extra oil allowance': x.oilKg * P.oil * 0.1 };
  const A = x.A, B = Object.values(bo).reduce((s, v) => s + v, 0), s = T.stack, Cc = s.design * A, Dd = k.labour * A, D2 = s.packing * A, E = s.overheads * (A + B), F = s.margin * (A + B + Cc + Dd + D2 + E), eng = A + B + Cc + Dd + D2 + E + F;
  const factor = cfg.calib === 'Own price' && cfg.refPrice > 0 ? cfg.refPrice / eng : cfg.calib === 'Model average' ? avgFactor : 1, cal = eng * factor;
  const idx = T.ieema.idx, wts = (cfg.kv > 400 ? T.ieema.weights.gt400 : T.ieema.weights.le400), den = wts.reduce((a, b) => a + b, 0), ratio = (e) => (idx[e][0] ? idx[e][1] / idx[e][0] : 1);
  const pv = (wts[0] + wts[1] * ratio('C') + wts[2] * ratio('ES') + wts[3] * ratio('IS') + wts[4] * ratio('IM') + wts[5] * ratio('TO') + wts[6] * ratio('W')) / den;
  return { cfg, ...x, bo, B, C: Cc, D: Dd, D2, E, F, eng, factor, cal, pv, delivery: cal * pv, scan, perMvar: cal / cfg.mvar, impedancePct: null, bm: d.bm, limitW: x.limit, class: k };
}
/** the model-average factor: mean calibration factor of the configurations priced "Own price" */
export function averageFactor(list, T) { const f = list.filter((c) => c.calib === 'Own price' && c.refPrice > 0).map((c) => { const e = computeReactor({ ...c, calib: 'None' }, T).eng; return c.refPrice / e; }); return f.length ? f.reduce((a, b) => a + b, 0) / f.length : 1; }
