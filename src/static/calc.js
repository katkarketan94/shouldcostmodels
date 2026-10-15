// Static equipment: surface condensers, feed-water heaters, shell-and-tube exchangers, pressure vessels and deaerators.
// Not a workbook model. Weights come from the geometry (ASME shell and head thickness, TEMA-style tubesheet, tube count from area),
// priced by material, then conversion (fabrication, tube joints, testing) and a cost stack grossed up like the reference cost sheet:
// price = (raw material + bought-outs + conversion) / (1 - engineering - overheads - profit - supervision, spares and finance).
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const PLATES = { 'Carbon steel plate (SA 516-70)': { rho: 7850, S: 138, price: 'plate' }, 'SS 304 plate': { rho: 7900, S: 115, price: 'plate304' }, 'SS 316L plate': { rho: 7980, S: 115, price: 'plate316' }, 'Duplex 2205 plate': { rho: 7800, S: 205, price: 'plateDup' } };
export const TUBES = { 'SS 304 (SA 249 TP304)': { rho: 7900, price: 'tube304' }, 'SS 316L': { rho: 7980, price: 'tube316' }, 'Carbon steel (SA 179 / SA 210)': { rho: 7850, price: 'tubeCs' }, 'Admiralty brass': { rho: 8530, price: 'tubeBrass' }, 'Cu-Ni 90/10': { rho: 8900, price: 'tubeCuNi' }, 'Titanium Gr 2': { rho: 4510, price: 'tubeTi' }, 'Duplex 2205': { rho: 7800, price: 'tubeDup' } };
export const TYPES = { cond: 'Surface condenser', fwh: 'Feed-water heater (HP / LP)', hx: 'Shell & tube heat exchanger', vessel: 'Pressure vessel', dea: 'Deaerator' };
export const ST_DEFAULTS = {
  prices: { plate: 68, plate304: 203, plate316: 354, plateDup: 520, tube304: 288, tube316: 470, tubeCs: 105, tubeBrass: 760, tubeCuNi: 1150, tubeTi: 2400, tubeDup: 780 },
  // condenser specific weights, kg per m2 of tube surface, with the price as a multiple of the plate rate (from the reference sheet)
  cond: { shell: [3.53, 1.0], tubesheet: [2.56, 1.39], waterbox: [2.03, 1.11], other: [2.61, 1.39], connections: [0.93, 2.3], boPerM2: 241 },
  geom: { pitch: 1.25, fill: 0.9, clearance: 35, jointEff: 0.85, ca: 3, minT: 6, baffleT: 6, baffleSpacing: 0.75, nozzlePct: 0.08, supportPct: 0.06, internalsPct: 0.05, headFactor: 1.084, tubesheetF: 1.25 },
  conv: { fab: 38, headFab: 55, tubesheetPerHole: 20, jointCond: 55, jointFwh: 160, pwhtPerKg: 6, testPerKg: 3.5, testLot: 60000, paintPerKg: 2.5, tubeHandling: 0.8 },
  bought: { fwhPerM2: 1200, hxPerM2: 350, vesselLot: 150000, vesselPerM3: 6000, deaLot: 1200000, deaPerTph: 3500 },
  stack: { engineering: 0.02, overheads: 0.05, profit: 0.10, misc: 0.01 },
  dea: { rho: 900, fill: 0.75, lOverD: 3.5, trayKgPerTph: 20, domeRatio: 0.6 },
};
const Cfg = (tag, type, o) => ({ tag, type, area: 1000, tubeOD: 19.05, tubeWall: 1.65, tubeLen: 8, tubeMat: 'SS 304 (SA 249 TP304)', shellMat: 'Carbon steel plate (SA 516-70)', pShell: 10, pTube: 16, id: 2.4, tan: 8, pVessel: 16, flow: 1900, storage: 5, qty: 1, ...o });
export function stDefault() {
  return { list: [
    Cfg('SC-01 Surface condenser, 50,000 m²', 'cond', { area: 50212, tubeOD: 25.4, tubeWall: 0.76, tubeLen: 12, pShell: 1.08, pTube: 5.4 }),
    Cfg('HP-01 HP feed-water heater, 900 m²', 'fwh', { area: 900, tubeOD: 19.05, tubeWall: 2.4, tubeLen: 10, tubeMat: 'Carbon steel (SA 179 / SA 210)', pShell: 60, pTube: 250 }),
    Cfg('LP-01 LP feed-water heater, 450 m²', 'fwh', { area: 450, tubeOD: 19.05, tubeWall: 0.9, tubeLen: 8, pShell: 8, pTube: 40 }),
    Cfg('DA-01 Deaerator, 1,900 t/h', 'dea', { flow: 1900, storage: 5, pVessel: 10 }),
    Cfg('PV-01 Pressure vessel, 2.4 m × 8 m', 'vessel', { id: 2.4, tan: 8, pVessel: 16 }),
    Cfg('HX-01 Shell & tube exchanger, 1,000 m²', 'hx', { area: 1000, tubeOD: 19.05, tubeWall: 1.65, tubeLen: 6, pShell: 10, pTube: 16 }),
  ], sel: 0, unit: 'unit', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(ST_DEFAULTS)) };
}
const shellT = (P, Dmm, S, T, kind = 'shell') => { const p = P / 10, E = T.geom.jointEff, t = kind === 'shell' ? p * (Dmm / 2) / (S * E - 0.6 * p) : p * Dmm / (2 * S * E - 0.2 * p); return Math.max(T.geom.minT, Math.ceil(t + T.geom.ca - 1e-9)); };
export function computeStatic(c, T) {
  const g = T.geom, cv = T.conv, P = T.prices, ty = c.type, lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, label, qty: R2(qty), unit, rate, amount: qty * rate, note }); };
  const plate = PLATES[c.shellMat], tube = TUBES[c.tubeMat]; if (!plate || !tube) return { error: 'Unknown material' };
  const pr = P[plate.price], tr = P[tube.price], rho = plate.rho / 1e9;                  // kg per mm3
  let N = 0, geo = {}, tubeKg = 0, fabKg = 0, headKg = 0, tsKg = 0, joints = 0, holes = 0, bo = 0, tsMm = 0, shellMm = 0, pwhtKg = 0, totalKg = 0;
  const G = 'Raw material', B = 'Bought-outs';
  if (ty === 'cond') {
    const A = c.area, od = c.tubeOD, wl = c.tubeWall; N = A / (Math.PI * od / 1000 * c.tubeLen);
    tubeKg = A * (od - wl) / od * wl / 1000 * tube.rho;
    add(G, `Tubes, ${c.tubeMat}, ${fmt0(N)} tubes × ${c.tubeLen} m`, tubeKg, 'kg', tr);
    const sp = T.cond, parts = [['Shell', sp.shell], ['Tube sheets', sp.tubesheet], ['Water box assembly', sp.waterbox], ['Other structures (expansion joint, stub pieces, air baffles, bracing, deflectors)', sp.other], ['Connections', sp.connections]];
    for (const [l, [kgm2, mult]] of parts) { const kg = A * kgm2; add(G, l, kg, 'kg', pr * mult); fabKg += l === 'Tube sheets' ? 0 : kg; tsKg += l === 'Tube sheets' ? kg : 0; }
    holes = N; joints = N * 2; bo = A * sp.boPerM2; totalKg = tubeKg + A * (sp.shell[0] + sp.tubesheet[0] + sp.waterbox[0] + sp.other[0] + sp.connections[0]);
    const cols = Math.round(Math.sqrt(N * 1.6)), rows = Math.round(N / cols), pit = g.pitch * od / 1000; geo = { N, cols, rows, width: cols * pit + 0.8, height: rows * pit + 0.8, length: c.tubeLen + 1.2 };
  } else if (ty === 'fwh' || ty === 'hx') {
    const od = c.tubeOD, wl = c.tubeWall, A = c.area, p = g.pitch * od; N = A / (Math.PI * od / 1000 * c.tubeLen);
    const Db = Math.sqrt(N * 0.866 * p * p * 4 / (Math.PI * g.fill)), Dsh = Db + 2 * g.clearance, S = plate.S, Pmax = Math.max(c.pShell, c.pTube);
    const ls = ty === 'fwh' ? c.tubeLen / 2 + 0.6 : c.tubeLen + 0.4, ts = shellT(c.pShell, Dsh, S, T), hd = shellT(c.pTube, Dsh, S, T, 'head');
    shellMm = ts; tsMm = Math.ceil(Dsh / 3 * Math.sqrt(g.tubesheetF * Pmax / 10 / (0.8 * S)) + g.ca);
    const shellKg = Math.PI * (Dsh + ts) * ts * ls * 1000 * rho, headsKg = 2 * g.headFactor * (Dsh / 1000) ** 2 * hd / 1000 * plate.rho, sheetKg = Math.PI / 4 * (Dsh + 60) ** 2 * tsMm * rho * (ty === 'fwh' ? 1 : 1);
    tubeKg = N * Math.PI * (od - wl) * wl / 1e6 * c.tubeLen * tube.rho; const nb = Math.ceil(ls / g.baffleSpacing), baffleKg = nb * Math.PI / 4 * Db * Db * 0.75 * g.baffleT * rho;
    const sub = shellKg + headsKg + baffleKg, noz = sub * g.nozzlePct, sup = sub * g.supportPct;
    add(G, `Tubes, ${c.tubeMat}, ${fmt0(N)} tubes × ${c.tubeLen} m`, tubeKg, 'kg', tr); add(G, `Shell, ${ts} mm, ID ${R2(Dsh, 0)} mm`, shellKg, 'kg', pr); add(G, `${ty === 'fwh' ? 'Channel and ' : ''}dished heads, ${hd} mm`, headsKg, 'kg', pr * 1.15);
    add(G, `Tube sheet, ${tsMm} mm`, sheetKg, 'kg', pr * 1.45); add(G, `Baffles and support plates, ${nb} nos`, baffleKg, 'kg', pr); add(G, 'Nozzles, flanges and manways', noz, 'kg', pr * 2.0); add(G, 'Supports and lugs', sup, 'kg', pr);
    fabKg = shellKg + baffleKg + noz + sup; headKg = headsKg; tsKg = sheetKg; holes = N; joints = N * (ty === 'fwh' ? 2 : 2); pwhtKg = ts > 38 ? shellKg + headsKg : 0;
    bo = A * (ty === 'fwh' ? T.bought.fwhPerM2 : T.bought.hxPerM2); totalKg = tubeKg + shellKg + headsKg + sheetKg + baffleKg + noz + sup; geo = { N, Dsh, Db, length: ls, shellT: ts, tsT: tsMm, headT: hd };
  } else {                                                    // pressure vessel and deaerator
    let D = c.id * 1000, Lt = c.tan * 1000, extraSs = 0, dome = 0;
    if (ty === 'dea') { const d = T.dea, vol = c.flow * 1000 / d.rho * c.storage / 60 / d.fill; D = Math.cbrt(4 * vol / (Math.PI * d.lOverD)) * 1000; Lt = D * d.lOverD; extraSs = c.flow * d.trayKgPerTph; geo.vol = vol; }
    const ts = shellT(c.pVessel, D, plate.S, T), hd = shellT(c.pVessel, D, plate.S, T, 'head'); shellMm = ts;
    const shellKg = Math.PI * (D + ts) * ts * Lt * rho, headsKg = 2 * g.headFactor * (D / 1000) ** 2 * hd / 1000 * plate.rho; let sub = shellKg + headsKg;
    if (ty === 'dea') { const Dd = D * T.dea.domeRatio, Ld = Lt * 0.5, tsd = shellT(c.pVessel, Dd, plate.S, T); dome = Math.PI * (Dd + tsd) * tsd * Ld * rho + 2 * g.headFactor * (Dd / 1000) ** 2 * tsd / 1000 * plate.rho; sub += dome; }
    const noz = sub * g.nozzlePct, sup = sub * (ty === 'dea' ? 0.1 : 0.09), intr = sub * (ty === 'dea' ? 0 : g.internalsPct);
    add(G, `Shell, ${ts} mm, ID ${R2(D, 0)} mm × ${R2(Lt, 0)} mm`, shellKg, 'kg', pr); add(G, `Dished heads (2), ${hd} mm`, headsKg, 'kg', pr * 1.15); if (dome) add(G, 'Deaerating dome (spray section)', dome, 'kg', pr);
    add(G, 'Nozzles, flanges and manways', noz, 'kg', pr * 2.0); add(G, 'Saddles / skirt and lugs', sup, 'kg', pr); if (intr) add(G, 'Internals (vortex breaker, distributor, supports)', intr, 'kg', pr * 1.2);
    if (extraSs) add(G, 'Spray valves, trays and internals, SS 304', extraSs, 'kg', P.plate304 * 1.3);
    fabKg = shellKg + dome + noz + sup + intr; headKg = headsKg; pwhtKg = ts > 38 && ty !== 'dea' && c.shellMat.startsWith('Carbon') ? shellKg + headsKg : 0; totalKg = sub + noz + sup + intr + extraSs;
    const vol = Math.PI / 4 * (D / 1000) ** 2 * Lt / 1000; bo = ty === 'dea' ? T.bought.deaLot + c.flow * T.bought.deaPerTph : T.bought.vesselLot + vol * T.bought.vesselPerM3; geo = { ...geo, D, Lt, shellT: ts, headT: hd, vol };
  }
  add(B, ty === 'cond' ? 'Ball cleaning, instruments, bought-out fittings' : ty === 'fwh' ? 'Level control, safety valves, instruments, drains' : ty === 'dea' ? 'Spray valves, safety valves, instruments, vent condenser' : 'Safety valves, instruments, gauges', 1, 'lot', bo);
  const C = 'Conversion';
  add(C, 'Fabrication: rolling, welding, assembly', fabKg, 'kg', cv.fab); if (headKg) add(C, 'Head forming and welding', headKg, 'kg', cv.headFab);
  if (tsKg) add(C, 'Tube sheet machining and drilling', holes, 'holes', cv.tubesheetPerHole + (ty === 'cond' ? 0 : 0)); if (ty === 'cond') add(C, 'Tube sheet and water box fabrication', tsKg, 'kg', cv.fab);
  if (joints) add(C, 'Tube insertion and expanding / welding of joints', joints, 'joints', ty === 'cond' ? cv.jointCond : cv.jointFwh); if (ty !== 'vessel' && ty !== 'dea' && tubeKg) add(C, 'Tube handling, cleaning and bundle assembly', tubeKg, 'kg', cv.tubeHandling);
  if (pwhtKg) add(C, 'Post-weld heat treatment', pwhtKg, 'kg', cv.pwhtPerKg); add(C, 'NDT, hydro / vacuum test and inspection', totalKg, 'kg', cv.testPerKg); add(C, 'Test rig and documentation', 1, 'lot', cv.testLot * Math.max(0.3, Math.sqrt(totalKg / 100000))); add(C, 'Blasting and painting', totalKg, 'kg', cv.paintPerKg);
  const sum = (grp) => lines.filter((l) => l.group === grp).reduce((s, l) => s + l.amount, 0), rm = sum(G), boA = sum(B), conv = sum(C), base = rm + boA + conv, st = T.stack, load = st.engineering + st.overheads + st.profit + st.misc, total = base / (1 - load);
  const parts = { 'Raw material': rm, 'Bought-outs': boA, 'Conversion': conv, 'Design & engineering': total * st.engineering, 'Overheads': total * st.overheads, 'Profit': total * st.profit, 'Supervision, spares, finance': total * st.misc };
  return { cfg: c, ty, lines, parts, rm, bo: boA, conv, base, total, weight: totalKg, tubeKg, N, geo, perM2: c.area ? total / c.area : null, perKg: total / totalKg, shellMm, tsMm, share: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, v / total])) };
}
const fmt0 = (v) => Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 });
