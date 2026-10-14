// Structural check of cable trays, channels and cantilever arms. Own calculation (the cost workbook has no engineering sheet):
// thin-wall section properties, elastic bending, shear and deflection under the cable load plus a concentrated load,
// with a splice efficiency for the coupler joint. Units: mm, N, MPa unless a name says kg or m.
export const STRUCT_DEFAULTS = {
  fy: 250, E: 200000, fs: 1.67, splice: 0.55, shearAllow: 0.4, g: 9.81,
  webSlender: 200, flangeSlender: 60, plateSlender: 500,
  simple: { kw: 1 / 8, kp: 1 / 4, dw: 5 / 384, dp: 1 / 48, kv: 0.5 },
  continuous: { kw: 1 / 10, kp: 0.2, dw: 1 / 145, dp: 1 / 106, kv: 0.6 },
  cantilever: { limit: 100 },
};
export const CHECK_DEFAULTS = { load: 40, span: 2.5, support: 'simple', defl: 200, point: 90, channelSpan: 800 };

/** Section from rectangular parts [area, y (mm from bottom), own I] -> A, y_bar, I, Z_bot, Z_top */
function section(parts, H) {
  const A = parts.reduce((s, p) => s + p.a, 0), y = parts.reduce((s, p) => s + p.a * p.y, 0) / A;
  const I = parts.reduce((s, p) => s + p.i + p.a * (p.y - y) ** 2, 0);
  return { A, y, I, Zb: I / y, Zt: I / (H - y), H };
}
const rect = (b, h, y) => ({ a: b * h, y, i: b * h ** 3 / 12 });
export function sectionOf(cfg, T) {
  const { kind, width: W, depth: Dp, thk: t } = cfg, c = T.struct ? T : { struct: STRUCT_DEFAULTS };
  const parts = [];
  if (kind === 'ladder') {                       // two C-section side rails: web Dp, top and bottom return = collar
    const col = T.ladder.collar; parts.push(rect(2 * t, Dp, Dp / 2), rect(2 * col, t, t / 2), rect(2 * col, t, Dp - t / 2));
    const rung = [rect(T.ladder.rungWidth, T.ladder.rungThk, T.ladder.rungThk / 2), rect(2 * T.ladder.rungThk, T.ladder.rungHeight, T.ladder.rungHeight / 2)];
    return { ...section(parts, Dp), tRail: t, web: 2 * Dp * t, flange: col, rung: section(rung, T.ladder.rungHeight), rungInfo: { span: W, pitch: 2500 / T.ladder.rungsPer2500, b: T.ladder.rungWidth, h: T.ladder.rungHeight, t: T.ladder.rungThk }, perfFactor: 1, flangeW: col, depth: Dp };
  }
  if (kind === 'perf' || kind === 'trough') {
    const A = T[kind], col = kind === 'perf' ? (W >= 300 && Dp >= 100 ? 15 : 0) : 0, perfRatio = Math.min(0.5, (A.perfPerRow * A.perfLen * A.perfWid) / (A.spacing * W));
    parts.push({ a: (W + 4) * t * (1 - perfRatio), y: t / 2, i: 0 }, rect(2 * t, Dp, Dp / 2)); if (col) parts.push(rect(2 * col, t, Dp - t / 2));
    return { ...section(parts, Dp), web: 2 * Dp * t, flangeW: col, perfFactor: 1 - perfRatio, depth: Dp, plate: W + 4 };
  }
  // channel and arm: 41 wide back, side height Dp, return lips
  const lip = T.channel.lip; parts.push(rect(W, t, t / 2), rect(2 * t, Dp, Dp / 2), rect(2 * lip, t, Dp - t / 2));
  return { ...section(parts, Dp), web: 2 * Dp * t, flangeW: lip, perfFactor: 1, depth: Dp, plate: W };
}
const kgToN = (kg, S) => kg * S.g;

/** capacity of a straight beam: returns the maximum cable load (kg/m) before strength, shear or deflection governs */
function beamCapacity(sec, Lmm, S, chk, self) {
  const k = S[chk.support] || S.simple, sigma = S.fy / S.fs, Mall = sigma * Math.min(sec.Zb, sec.Zt) * S.splice, EI = S.E * sec.I, Vall = S.shearAllow * S.fy * sec.web;
  const P = kgToN(chk.point, S), dLim = Lmm / chk.defl, wSelf = kgToN(self, S) / 1000;                       // N/mm
  const wStr = (Mall - k.kp * P * Lmm) / (k.kw * Lmm ** 2), wShr = (Vall - k.kv * P) / (k.kv * Lmm), wDef = (dLim - k.dp * P * Lmm ** 3 / EI) / (k.dw * Lmm ** 4 / EI);
  const cap = (w) => Math.max(0, w - wSelf) * 1000 / S.g;                                                     // kg/m of cable
  return { str: cap(wStr), shr: cap(wShr), def: cap(wDef), Mall, Vall, EI, dLim, sigma };
}
function evalTray(cfg, T, chk, selfKgPerM) {
  const S = T.struct, K = cfg.kind, sec = sectionOf(cfg, T), warn = [], rows = [];
  const out = { cfg, sec, warn, rows, applies: true };
  if (['hbend', 'vup', 'vdown', 'tee', 'cross'].includes(K)) { out.applies = false; out.message = 'Fittings are checked as the straight tray they connect to: choose the straight tray of the same width, depth and thickness. Their supports sit at the fitting, so keep the span at or below half the straight-run span.'; return out; }
  const g = S.g, P = kgToN(chk.point, S), sigma = S.fy / S.fs;
  if (sec.depth / cfg.thk > S.webSlender) warn.push(`Web depth/thickness ${(sec.depth / cfg.thk).toFixed(0)} exceeds ${S.webSlender}: web buckling is not covered by this check.`);
  if (sec.flangeW && sec.flangeW / cfg.thk > S.flangeSlender) warn.push(`Flange return/thickness ${(sec.flangeW / cfg.thk).toFixed(0)} exceeds ${S.flangeSlender}: flange local buckling may govern.`);
  if (sec.plate && sec.plate / cfg.thk > S.plateSlender) warn.push(`Base plate width/thickness ${(sec.plate / cfg.thk).toFixed(0)} is above ${S.plateSlender}: the base may deflect locally under point loads.`);
  if (K === 'arm') {                                                                                    // cantilever
    const La = cfg.length, sp = chk.span * 1000, EI = S.E * sec.I, Mall = sigma * Math.min(sec.Zb, sec.Zt), Vall = S.shearAllow * S.fy * sec.web, dLim = La / S.cantilever.limit;
    const Fn = kgToN(chk.load * chk.span, S), Pc = P / 3;                                                      // cable load on one arm; installer load at the tip
    const tray = kgToN(chk.trayKgPerM * chk.span, S);
    const Ftot = Fn + tray, M = Ftot * La / 2 + Pc * La, V = Ftot + Pc, defl = Ftot * La ** 3 / (8 * EI) + Pc * La ** 3 / (3 * EI);
    const capKg = (Mall - Pc * La) / (La / 2) / g - chk.trayKgPerM * chk.span, capShr = (Vall - Pc) / g - chk.trayKgPerM * chk.span, capDef = (dLim - Pc * La ** 3 / (3 * EI)) / (La ** 3 / (8 * EI)) / g - chk.trayKgPerM * chk.span;
    const swlArm = Math.max(0, Math.min(capKg, capShr, capDef)), swl = swlArm / chk.span;
    Object.assign(out, { kind: 'arm', swl, swlArm, governing: swlArm === Math.max(0, capKg) ? 'bending' : swlArm === Math.max(0, capDef) ? 'deflection' : 'shear', util: { bending: M / Mall, shear: V / Vall, deflection: defl / dLim }, M, V, defl, dLim, Mall, Vall, load: chk.load, loadPerArm: Ftot / g, span: chk.span });
    out.pass = Math.max(...Object.values(out.util)) <= 1;
    return out;
  }
  const isCh = K === 'channel', L = isCh ? chk.channelSpan : chk.span * 1000;
  // channel as trapeze beam: the tray load of one support spacing acts as a UDL on the channel span
  const cableW = isCh ? (chk.load + chk.trayKgPerM) * chk.span / (L / 1000) : chk.load, self = selfKgPerM;
  const cap = beamCapacity(sec, L, S, chk, self), wSelf = kgToN(self, S) / 1000, wCab = kgToN(cableW, S) / 1000, k = S[chk.support] || S.simple, EI = cap.EI;
  const M = k.kw * (wSelf + wCab) * L * L + k.kp * P * L, V = k.kv * ((wSelf + wCab) * L + P), defl = k.dw * (wSelf + wCab) * L ** 4 / EI + k.dp * P * L ** 3 / EI;
  const swl = Math.min(cap.str, cap.shr, cap.def), gov = swl === cap.str ? 'bending' : swl === cap.def ? 'deflection' : 'shear';
  const util = { bending: M / cap.Mall, shear: V / cap.Vall, deflection: defl / cap.dLim };
  // rung check (ladder)
  if (K === 'ladder') {
    const R = sec.rungInfo, Wr = R.span, qR = kgToN(chk.load * R.pitch / 1000, S), Mr = qR * Wr / 8 + (P / 3) * Wr / 4, Zr = Math.min(sec.rung.Zb, sec.rung.Zt) * 1, MrAll = sigma * Zr;
    util.rung = Mr / MrAll; out.rung = { Mr, MrAll, load: chk.load * R.pitch / 1000, pitch: R.pitch };
  }
  Object.assign(out, { kind: K, swl, governing: gov, util, M, V, defl, dLim: cap.dLim, Mall: cap.Mall, Vall: cap.Vall, cap, load: chk.load, span: L / 1000, self });
  out.pass = Math.max(...Object.values(util)) <= 1;
  return out;
}
export function checkTray(cfg, T, chk, selfKgPerM) {
  const o = evalTray(cfg, T, chk, selfKgPerM); if (!o.applies || o.kind === 'channel') return o;
  const at = (sp) => evalTray(cfg, T, { ...chk, span: sp }, selfKgPerM).swl;
  o.maxSpan = solveSpan(at, chk.load); o.curve = [1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map((sp) => ({ span: sp, swl: at(sp) })); return o;
}
function solveSpan(swlAt, load) {                       // largest span in [0.5, 12] m whose capacity still covers the load
  let lo = 0.5, hi = 12; if (swlAt(lo) < load) return null; if (swlAt(hi) >= load) return hi;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (swlAt(m) >= load) lo = m; else hi = m; } return lo;
}
