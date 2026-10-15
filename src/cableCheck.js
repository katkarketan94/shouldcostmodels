// Cable engineering check: current rating from a simplified IEC 60287 thermal model (conductor, insulation, bedding, sheath and external thermal
// resistances, skin and proximity effect, dielectric loss for HT), derating for grouping, voltage drop and short-circuit withstand.
// Technical validation only; it never changes the should-cost. Geometry comes from the cost build (diameters and thicknesses).
const PI = Math.PI;
export const INSTALL = { air: 'In air, on perforated tray or ladder', ground: 'Direct buried', duct: 'Buried in a duct bank' };
export const CHECK_DEFAULTS = { load: 200, length: 150, volt: 415, pf: 0.85, install: 'air', ambient: 40, groundT: 30, depth: 0.8, soilRho: 1.5, circuits: 1, spacing: 'touching', vdLimit: 5, fault: 25, faultTime: 1, parallel: 1, freq: 50 };
const RHO = { Copper: 17.241e-9, Aluminium: 28.264e-9 }, ALPHA = { Copper: 0.00393, Aluminium: 0.00403 };
const KSC = { XLPE: { Copper: 143, Aluminium: 94 }, PVC: { Copper: 115, Aluminium: 76 } }, THETA = { XLPE: [90, 250], PVC: [70, 160] };
const GROUP = { air: { touching: [1, 1, 0.88, 0.82, 0.79, 0.77, 0.76, 0.75, 0.74, 0.73], spaced: [1, 1, 0.96, 0.94, 0.92, 0.91, 0.9, 0.89, 0.88, 0.88] }, ground: { touching: [1, 1, 0.75, 0.65, 0.6, 0.55, 0.5, 0.48, 0.46, 0.44], spaced: [1, 1, 0.82, 0.72, 0.66, 0.62, 0.58, 0.55, 0.52, 0.5] } };
export const groupFactor = (install, spacing, n) => { const t = GROUP[install === 'air' ? 'air' : 'ground'][spacing === 'spaced' ? 'spaced' : 'touching'], k = Math.max(1, Math.round(n)); return k >= 10 ? t[9] * (k >= 12 ? 0.98 : 1) : t[k]; };

// Current rating of one cable (A) at the conductor's maximum temperature, with the heat balance terms returned for display.
export function rating(g, cfg, inp, ht, kvU0) {
  const ins = cfg.insulation === 'PVC' ? 'PVC' : 'XLPE', thMax = THETA[ins][0], amb = inp.install === 'air' ? inp.ambient : inp.groundT, d = thMax - amb; if (d <= 5) return { error: 'Ambient is too close to the conductor limit' };
  const n = cfg.cores === 1 ? 1 : cfg.cores === 2 ? 2 : 3, single = cfg.cores === 1, A = cfg.size, dc = g.condDia / 1000, t1 = g.insThk / 1000, f = inp.freq;
  const rho20 = RHO[cfg.conductor] * 1.02, R20 = rho20 / (A * 1e-6), Rdc = R20 * (1 + ALPHA[cfg.conductor] * (thMax - 20)), ks = cfg.shape === 'Circular' ? 1 : 0.435, kp = cfg.shape === 'Circular' ? 1 : 0.37;
  const xs4 = (8 * PI * f / Rdc * 1e-7 * ks) ** 2, ys = xs4 / (192 + 0.8 * xs4), De0 = single ? dc + 2 * t1 : g.laidUp / 1000, s = single ? De0 : (dc + 2 * t1), xp4 = (8 * PI * f / Rdc * 1e-7 * kp) ** 2, fp = xp4 / (192 + 0.8 * xp4);
  const yp = single ? 0 : fp * (dc / s) ** 2 * (0.312 * (dc / s) ** 2 + 1.18 / (fp + 0.27)) * (n === 3 ? 1 : 0.7), Rac = Rdc * (1 + ys + yp);
  const rhoIns = ins === 'XLPE' ? 3.5 : 5.0, rhoBed = 6.0, rhoSh = 5.0, Di = dc + 2 * t1;
  const T1 = single ? rhoIns / (2 * PI) * Math.log(1 + 2 * t1 / dc) : rhoIns / (6 * PI) * (1.2 + 6.6 * t1 / dc), Dc3 = single ? Di : g.laidUp / 1000;
  const t2 = (g.innerThk || 1) / 1000, Dbed = Dc3 + 2 * t2, T2 = single ? 0 : rhoBed / (2 * PI) * Math.log(1 + 2 * t2 / Dc3), t3 = g.outerThk / 1000, Da = g.armourDia ? g.armourDia / 1000 : Dbed, De = g.od / 1000, T3 = rhoSh / (2 * PI) * Math.log(1 + 2 * t3 / Math.max(Da, 1e-3));
  const arm = g.armourDia > 0 && !single, lam2 = arm ? 0.02 + 0.03 * (A / 300) : 0;
  let Wd = 0; if (ht) { const eps = 2.5, C = eps / (18 * Math.log(Di / dc)) * 1e-9, U0 = kvU0 * 1000; Wd = 2 * PI * f * C * U0 * U0 * 0.004; }
  const Deq = single ? 2.15 * De : De;
  let T4;
  if (inp.install === 'air') T4 = airT4(Deq, thMax, amb, T1, T2, T3, n, Rac, Wd, lam2);
  else { const L = inp.depth + Deq / 2, u = 2 * L / Deq; T4 = inp.soilRho / (2 * PI) * Math.log(u + Math.sqrt(u * u - 1)); if (inp.install === 'duct') T4 += 0.25; }   // duct: air gap and duct wall add about 0.25 K·m/W
  const num = d - Wd * (0.5 * T1 + n * (T2 + T3 + T4)), den = Rac * T1 + n * Rac * T2 * (1 + 0) + n * Rac * (1 + lam2) * (T3 + T4);
  if (num <= 0) return { error: 'Dielectric loss exceeds the thermal limit' };
  const I = Math.sqrt(num / den), gf = groupFactor(inp.install, inp.spacing, inp.circuits);
  return { I0: I, I: I * gf, gf, Rac, Rdc, R20, T1, T2, T3, T4, Wd, thMax, amb, De, ys, yp, n };
}
function airT4(Deq, thMax, amb, T1, T2, T3, n, Rac, Wd, lam2) {
  let dTs = 10, T4 = 0; for (let i = 0; i < 30; i++) { const h = 0.21 / Deq ** 0.6 + 3.94; T4 = 1 / (PI * Deq * h * Math.max(dTs, 0.3) ** 0.25); const Ip2 = (thMax - amb - Wd * (0.5 * T1 + n * (T2 + T3 + T4))) / (Rac * T1 + n * Rac * T2 + n * Rac * (1 + lam2) * (T3 + T4)), Wtot = n * (Ip2 * Rac * (1 + lam2) + Wd), nd = Wtot * T4; if (Math.abs(nd - dTs) < 0.01) { dTs = nd; break; } dTs = 0.5 * dTs + 0.5 * nd; } return T4;
}
export function checkCable(g, cfg, inp, ht, kvU0, geomFor, sizes) {
  const rt = rating(g, cfg, inp, ht, kvU0); if (rt.error) return rt;
  const ins = cfg.insulation === 'PVC' ? 'PVC' : 'XLPE', par = Math.max(1, Math.round(inp.parallel)), Irate = rt.I * par, Iload = inp.load, used = Iload / Irate, loadFrac = Math.min(1, used);
  const theta = rt.amb + (rt.thMax - rt.amb) * loadFrac * loadFrac, Rop = (rt.R20 * (1 + ALPHA[cfg.conductor] * (theta - 20))) * (1 + rt.ys + rt.yp * 0.5);
  const X = (ht ? 0.105 : cfg.cores === 1 ? 0.085 : 0.078) / 1000, phi = Math.acos(Math.min(1, Math.max(0.1, inp.pf))), V = inp.volt, Ip = Iload / par, vd = Math.sqrt(3) * Ip * inp.length * (Rop * Math.cos(phi) + X * Math.sin(phi)), vdPct = vd / V * 100;
  const k = KSC[ins][cfg.conductor], iscKA = k * cfg.size * par / Math.sqrt(inp.faultTime) / 1000, scOk = iscKA >= inp.fault, vdOk = vdPct <= inp.vdLimit, curOk = used <= 1, ok = scOk && vdOk && curOk;
  let min = null; if (geomFor && sizes) for (const sz of sizes) { const c2 = { ...cfg, size: sz }, g2 = geomFor(sz), r2 = rating(g2, c2, inp, ht, kvU0); if (r2.error) continue; const I2 = r2.I * par, th2 = r2.amb + (r2.thMax - r2.amb) * Math.min(1, Iload / I2) ** 2, R2o = r2.R20 * (1 + ALPHA[cfg.conductor] * (th2 - 20)) * (1 + r2.ys + r2.yp * 0.5), vd2 = Math.sqrt(3) * (Iload / par) * inp.length * (R2o * Math.cos(phi) + X * Math.sin(phi)) / V * 100, sc2 = k * sz * par / Math.sqrt(inp.faultTime) / 1000; if (Iload <= I2 && vd2 <= inp.vdLimit && sc2 >= inp.fault) { min = { size: sz, I: I2, vd: vd2, sc: sc2 }; break; } }
  const bind = [['Current', used], ['Voltage drop', vdPct / inp.vdLimit], ['Short circuit', inp.fault / iscKA]].sort((a, b) => b[1] - a[1])[0][0];
  return { ...rt, par, Irate, used, vdPct, iscKA, scOk, vdOk, curOk, ok, min, bind, theta, k, kvU0 };
}
