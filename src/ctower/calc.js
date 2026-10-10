// Mechanical-draught cooling tower. Not a workbook model: the thermal sizing is a Merkel-number calculation (Chebyshev four-point integration),
// the fill depth follows from the fill characteristic, and the weights and bought-outs are priced bottom-up with assumed rates.
const CPW = 4.186, P_ATM = 101.325;
const psat = (t) => 0.61078 * Math.exp(17.27 * t / (t + 237.3));
const hsat = (t) => { const ps = psat(t), w = 0.622 * ps / (P_ATM - ps); return 1.006 * t + w * (2501 + 1.86 * t); };   // kJ/kg dry air

export const TYPES = {
  'Counterflow, induced draught, FRP': { fill: 'Film PVC', c: 1.05, n: 0.62, loading: 14, dp: 150, frameKgM2: 0, casing: 'FRP', basin: 'FRP', cellMax: 700, ductile: false },
  'Crossflow, induced draught, FRP': { fill: 'Splash / low-clog film', c: 0.8, n: 0.58, loading: 12, dp: 110, casing: 'FRP', basin: 'FRP', cellMax: 600 },
  'Counterflow, induced draught, RCC': { fill: 'Film PVC', c: 1.05, n: 0.62, loading: 14, dp: 150, casing: 'RCC', basin: 'RCC', cellMax: 3500 },
  'Counterflow, induced draught, HDG steel': { fill: 'Film PVC', c: 1.05, n: 0.62, loading: 14, dp: 150, casing: 'HDG steel', basin: 'Steel', cellMax: 1200 },
  'Natural draught, hyperbolic (RCC)': { fill: 'Film PVC', c: 1.0, n: 0.6, loading: 10, dp: 0, casing: 'RCC', basin: 'RCC', cellMax: 60000, natural: true },
};
export const CT_DEFAULTS = {
  psych: { pressure: 101.325, lgMin: 0.9, lgMax: 2.1, drift: 0.0005 },
  fill: { depthMin: 0.9, depthMax: 1.8, rates: { 'Film PVC': 31000, 'Splash / low-clog film': 17000 } },   // ₹/m³ installed
  eliminator: 2300, distribution: 4200, louvre: 1900, fanEff: 0.62, velocity: 7.2, fanBase: 42000, fanExp: 1.8, gearboxPerKw: 5200, motorPerKw: 4300, vfdPerKw: 7500, hdgRate: 108, hdgKgPerM2Plan: 85, frpPerM2: 5200, rccPerM3: 9800, rccM3PerM2Plan: 0.55, basinFrpPerM2: 3600, basinSteelKgM2: 70,
  accessories: 90000, vibrationSwitch: 28000, labour: 0.16, transport: 0.025, overheads: 0.08, margin: 0.08, makeupBlowdown: 1.0,
};
export function ctDefault() {
  const mk = (tag, o) => ({ tag, kw: 3517, range: 5, approach: 4, wb: 28, type: 'Counterflow, induced draught, FRP', vfd: 'No', ...o });
  return { list: [mk('CT-01 1,000 TR chiller plant (FRP)', {}), mk('CT-02 3,000 TR plant (FRP, VFD)', { kw: 10551, vfd: 'Yes' }), mk('CT-03 Process, steel (HDG)', { kw: 6000, range: 8, approach: 5, wb: 27, type: 'Counterflow, induced draught, HDG steel' }), mk('CT-04 Power plant, RCC', { kw: 60000, range: 10, approach: 7, wb: 28, type: 'Counterflow, induced draught, RCC' }), mk('CT-05 Small crossflow (FRP)', { kw: 800, range: 5, approach: 4.5, wb: 28, type: 'Crossflow, induced draught, FRP' })],
    sel: 0, unit: 'tr', qty: 1, view: '3d', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(CT_DEFAULTS)) };
}
/** Merkel number demanded by the duty at a given liquid-to-gas ratio (Chebyshev 4-point) */
export function merkel(tIn, tOut, wb, lg) {
  const range = tIn - tOut, hIn = hsat(wb), pts = [0.1, 0.4, 0.6, 0.9];
  const s = pts.reduce((a, x) => { const t = tOut + x * range, h = hIn + x * range * CPW * lg, d = hsat(t) - h; return a + (d > 0 ? 1 / d : 1e9); }, 0);
  return range * CPW / 4 * s;
}
export function computeTower(c, T) {
  const ty = TYPES[c.type]; if (!ty) return { error: 'Unknown tower type' };
  if (!(c.kw > 0) || !(c.range > 0)) return { error: 'Enter a heat load and a range' };
  if (c.approach < 2.8) return { error: 'An approach below about 2.8 °C is not practical for a mechanical-draught tower' };
  const tOut = c.wb + c.approach, tIn = tOut + c.range, flow = c.kw / (1.163 * c.range);                         // m³/h
  // choose L/G: scan, fill depth from KaV/L = c (L/G)^-n per metre of fill; cost proxy = fill volume + fan power
  let best = null; const scan = [];
  for (let lg = T.psych.lgMin; lg <= T.psych.lgMax + 1e-9; lg += 0.05) {
    const me = merkel(tIn, tOut, c.wb, lg); if (!isFinite(me) || me > 25) continue;
    const kavl = ty.c * lg ** -ty.n, depth = me / kavl, plan = flow / ty.loading, air = flow * 1000 / 3600 / lg;     // L kg/s -> G kg/s
    const rho = 1.15, airM3s = air / rho, fanKw = ty.natural ? 0 : airM3s * ty.dp / (T.fanEff * 1000), fillM3 = plan * depth;
    const cost = fillM3 * T.fill.rates[ty.fill] + fanKw * 60000;
    scan.push({ lg, me, depth, fanKw, cost });
    if (!best || cost < best.cost) best = { lg, me, kavl, depth, plan, air, airM3s, fanKw, fillM3, cost };
  }
  if (!best) return { error: 'No feasible L/G ratio for this duty' };
  let { lg, me, depth, plan, air, airM3s, fanKw, fillM3 } = best;
  const dClamped = Math.min(Math.max(depth, T.fill.depthMin), T.fill.depthMax * 2.2); if (dClamped !== depth) { fillM3 = plan * dClamped; depth = dClamped; }
  const cells = Math.max(1, Math.ceil(flow / ty.cellMax)), planCell = plan / cells, side = Math.sqrt(planCell), height = depth + 1.2 + 0.9 + (ty.natural ? 0 : 0.8) + (ty.casing === 'RCC' ? 1.0 : 0);
  const motorKw = ty.natural ? 0 : Math.ceil(fanKw * 1.15 / cells * 2) / 2, fanDia = ty.natural ? 0 : Math.sqrt(4 * (airM3s / cells) / (Math.PI * T.velocity)) * 1.0;
  const lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0) lines.push({ group, label, qty: Math.round(qty * 100) / 100, unit, rate, amount: qty * rate, note }); };
  add('Fill & drift', `Fill, ${ty.fill}`, fillM3, 'm³', T.fill.rates[ty.fill], `depth ${depth.toFixed(2)} m`); add('Fill & drift', 'Drift eliminators', plan, 'm²', T.eliminator); add('Fill & drift', 'Water distribution headers and nozzles', plan, 'm²', T.distribution);
  const perim = 4 * side * cells, face = perim * (depth + 0.6);
  if (ty.casing === 'FRP') { add('Casing, structure & basin', 'FRP casing, panels and framing', perim * height + plan, 'm²', T.frpPerM2); add('Casing, structure & basin', 'Cold-water basin, FRP', plan, 'm²', T.basinFrpPerM2); }
  else if (ty.casing === 'HDG steel') { add('Casing, structure & basin', 'Hot-dip galvanised structure and casing', plan * T.hdgKgPerM2Plan * (height / 8), 'kg', T.hdgRate); add('Casing, structure & basin', 'Steel basin and sheeting', plan * T.basinSteelKgM2, 'kg', T.hdgRate * 0.9); }
  else add('Casing, structure & basin', 'RCC shell, columns, fan deck and basin', plan * T.rccM3PerM2Plan * (ty.natural ? 3.2 : 1), 'm³', T.rccPerM3);
  add('Casing, structure & basin', 'Air-inlet louvres', face, 'm²', T.louvre);
  let fanCost = 0, gear = 0, motor = 0, vfd = 0;
  if (!ty.natural) { fanCost = cells * T.fanBase * (fanDia ** T.fanExp); gear = motorKw * cells * T.gearboxPerKw; motor = motorKw * cells * T.motorPerKw; vfd = c.vfd === 'Yes' ? motorKw * cells * T.vfdPerKw : 0;
    add('Fans & drives', `Axial fans, ${fanDia.toFixed(1)} m dia`, cells, 'nos', fanCost / cells); add('Fans & drives', 'Gearbox and drive shaft', motorKw * cells, 'kW', T.gearboxPerKw); add('Fans & drives', 'Fan motors, IE3', motorKw * cells, 'kW', T.motorPerKw); add('Fans & drives', 'VFDs', vfd > 0 ? motorKw * cells : 0, 'kW', T.vfdPerKw); }
  add('Accessories', 'Ladders, handrails, level and make-up controls', cells, 'cells', T.accessories); add('Accessories', 'Vibration switches', cells, 'nos', T.vibrationSwitch);
  const material = lines.reduce((s, l) => s + l.amount, 0);
  add('Assembly & supply', 'Erection and assembly labour', 1, 'lot', material * T.labour); add('Assembly & supply', 'Transport to site', 1, 'lot', material * T.transport);
  const direct = lines.reduce((s, l) => s + l.amount, 0), oh = direct * T.overheads, mg = (direct + oh) * T.margin, total = direct + oh + mg;
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; }); groups.Overheads = oh; groups.Margin = mg;
  const tr = c.kw / 3.517;
  return { scan, cfg: c, ty, tIn, tOut, flow, lg, me, depth, plan, planCell, side, height, cells, air, airM3s, fanKw, motorKw, fanDia, fillM3, lines, groups, direct, total, perTr: total / tr, perFlow: total / flow, tr, makeup: flow * 0.00153 * c.range * T.makeupBlowdown };
}
