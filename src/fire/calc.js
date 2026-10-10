// Fire & life safety: water systems (sprinkler + hydrant + pumps), detection & alarm, and gas suppression.
// Unit rates for valves, heads, hydrant sets and alarm devices are the supply-and-install rates (PSR) of the sample data-centre BOQ (FPS&FAPA sheet).
// Pipework is built bottom-up (weight, fittings, supports, paint, labour, overheads) and checked against the BOQ's per-metre rates.
// Pumps, gas suppression and the quantity rules are own models: assumptions, to be replaced with quotes.
const STEEL = 7850;

/* ---------- common: IS 1239 (BS 1387) heavy-grade steel pipe ---------- */
export const NB = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250];
export const PIPE_DIM = { 15: [21.3, 3.2], 20: [26.9, 3.6], 25: [33.7, 4.0], 32: [42.4, 4.5], 40: [48.3, 4.5], 50: [60.3, 5.0], 65: [76.1, 5.4], 80: [88.9, 5.4], 100: [114.3, 5.4], 125: [139.7, 5.4], 150: [165.1, 5.4], 200: [219.1, 5.9], 250: [273, 6.3] };
export const DI_K9 = { 80: [98, 6.0], 100: [118, 6.0], 150: [170, 6.0], 200: [222, 6.3], 250: [274, 6.8], 300: [326, 7.2] };   // OD, wall (mm), IS 8329 K9
const kgm = (od, t, rho = STEEL) => Math.PI * (od - t) * t * rho / 1e6;
export const BOQ_PIPE_RATE = { 15: 424.6, 25: 772, 32: 983, 40: 1141, 50: 1538, 65: 1966, 80: 2423, 100: 3467, 150: 5142 };            // ₹/RM, supply & install, sample BOQ
export const BOQ_DI_RATE = { 80: 3574, 100: 4196, 150: 5863 };
export const BOQ_CP_RATE = { 80: 4631, 100: 6618, 150: 9817 };                    // cathodic protection and anti-corrosive treatment, ₹/RM                                                  // DI K9 with coating & cathodic protection, ₹/RM

export const PIPE_DEFAULTS = {
  steelRate: 78, diRate: 88,                                   // ₹/kg pipe (ERW / DI)
  fittingsPct: { 15: 0.3, 20: 0.3, 25: 0.32, 32: 0.32, 40: 0.32, 50: 0.34, 65: 0.38, 80: 0.4, 100: 0.45, 125: 0.5, 150: 0.55, 200: 0.55, 250: 0.55 },   // couplings, elbows, tees as % of pipe
  supportKgM: { 15: 0.5, 20: 0.6, 25: 0.8, 32: 0.9, 40: 1.1, 50: 1.4, 65: 1.8, 80: 2.2, 100: 3.0, 125: 3.6, 150: 4.4, 200: 5.6, 250: 7.0 },    // hangers & seismic bracing, kg per m
  supportRate: 85, paintPerM2: 110, labourPerM: { 15: 110, 20: 130, 25: 175, 32: 210, 40: 240, 50: 300, 65: 340, 80: 430, 100: 620, 125: 760, 150: 900, 200: 1150, 250: 1450 },
  overheads: 0.12, profit: 0.10, testingPct: 0.02,
};
export function pipeRate(nb, P = PIPE_DEFAULTS) {
  const [od, t] = PIPE_DIM[nb], w = kgm(od, t), pipe = w * P.steelRate, fit = pipe * P.fittingsPct[nb], sup = P.supportKgM[nb] * P.supportRate, paint = Math.PI * od / 1000 * P.paintPerM2 * 1.35, lab = P.labourPerM[nb];
  const direct = pipe + fit + sup + paint + lab, withTest = direct * (1 + P.testingPct), rate = withTest * (1 + P.overheads) * (1 + P.profit);
  return { nb, od, t, kgM: w, pipe, fit, sup, paint, lab, direct, rate, boq: BOQ_PIPE_RATE[nb] ?? null };
}
export function diRate(dn, P = PIPE_DEFAULTS, extra = { coating: 1.0, joints: 0.18, laying: 1.0 }) {
  const [od, t] = DI_K9[dn], w = kgm(od, t, 7050) * 1.08 + (dn / 100) ** 1.5 * 6;       // socket and spigot allowance
  const pipe = w * P.diRate, joints = pipe * extra.joints, coating = Math.PI * od / 1000 * 480, laying = 250 + dn * 3.2, direct = pipe + joints + coating + laying;
  return { dn, od, t, kgM: w, pipe, joints, coating, laying, direct, rate: direct * (1 + P.overheads) * (1 + P.profit), boq: BOQ_DI_RATE[dn] ?? null };
}

/* ---------- 1. water systems ---------- */
export const HAZARD = {
  'Light': { cover: 20, density: 2.25, area: 84, hose: 570, minutes: 30, label: 'Light hazard' },
  'Ordinary 1': { cover: 12, density: 5.0, area: 72, hose: 1000, minutes: 60, label: 'Ordinary hazard 1' },
  'Ordinary 2': { cover: 12, density: 5.0, area: 144, hose: 1000, minutes: 60, label: 'Ordinary hazard 2' },
  'Extra high 1': { cover: 9, density: 7.5, area: 232, hose: 1900, minutes: 90, label: 'Extra high hazard 1' },
};
export const WATER_DEFAULTS = {
  pipe: JSON.parse(JSON.stringify(PIPE_DEFAULTS)),
  layout: { branchPerHead: 3.3, zoneMaxArea: 4800, headMix: { 'Pendent K80 68°C': 0.31, 'Upright K80 68°C': 0.15, 'Upright K80 93°C': 0.54 }, sizeMix: { 25: 0.57, 32: 0.08, 40: 0.10, 50: 0.135, 65: 0.047, 80: 0.026, 100: 0.002, 150: 0.04 }, riserPerFloor: 1, floorHeight: 4.2, voidFactor: 1.0 },
  hydrant: { internalAreaPer: 1000, minPerFloor: 2, externalSpacing: 45, yardMainDN: 150, riserDN: 150, extinguisherArea: 250, bucketsPerFloor: 1 },
  pumps: { rhoG: 9.81, eta: 0.68, motorEff: 0.93, serviceFactor: 1.15, hydrantFlow: 2850, residualSprinkler: 70, residualHydrant: 35, frictionPct: 0.25, dieselCover: true, tankRate: 7000,
    pumpPerKw: 5200, motorPerKw: 4200, dieselPerKw: 21000, electricCtrl: [120000, 800], dieselCtrl: [350000, 1500], jockeyKw: 7.5, jockeyFixed: 160000, headerPerFlow: 38, skid: 90000 },
  cpRate: { 80: 4631, 100: 6618, 150: 9817, 200: 12500, 250: 15500, 300: 18000 },
  rates: { 'Sprinkler head, pendent K80': 938, 'Sprinkler head, upright K80': 761, 'Sprinkler head, upright 93°C': 836, 'Dry pendent head (cold aisle)': 18337, 'OS&Y gate valve 150': 46665, 'OS&Y gate valve 80': 15932, 'Butterfly valve 150': 22550, 'Flow switch': 9424, 'Test & drain assembly': 7630, 'Pressure gauge 150 mm': 5115, 'Air purge valve': 6050, 'Ball valve 25': 4151,
    'Sprinkler control valve (ICV) 150': 64969, 'Pre-action package (double interlock, N2)': 5461313, 'NRV 150': 58080, 'PRV station 150': 555500, 'Landing valve 63 (2 way)': 24049, 'RRL hose 2 x 15 m': 17275, 'Branch pipe & nozzle': 4501, 'First-aid hose reel': 12138, 'Hose cabinet (internal)': 27845, 'Fire brigade inlet 4-way': 111237,
    'External hydrant set': 9016 + 16033 + 15306 + 4301 + 1997, 'Extinguisher ABC 6 kg': 2628, 'Clean-agent extinguisher 4 kg': 21306, 'Fire bucket set': 4620, 'Spare sprinkler cabinet': 5000, 'Signage': 3850 },
  lump: { design: 0.015, seismic: 0.03, testing: 0.025, designFixed: 0, ratesNote: 'BOQ: design ₹50.9 L, seismic ₹59.9 L, T&C ₹76.7 L on about ₹14 Cr of hardware' },
  stack: { overheads: 0, margin: 0 },
};
export function waterDefault() {
  const mk = (tag, o) => ({ tag, area: 12000, floors: 3, height: 12, hazard: 'Ordinary 2', zoneArea: 4800, preAction: 0, yardMain: 600, yardDN: 150, includePumps: 'Yes', includeTank: 'No', dc: 'No', ...o });
  return { list: [mk('FW-01 Data centre (sample BOQ basis)', { area: 25000, floors: 3, height: 15, zoneArea: 610, preAction: 20, yardMain: 3380, dc: 'Yes' }), mk('FW-02 Office block', { area: 12000, floors: 8, height: 32, hazard: 'Light', yardMain: 400 }), mk('FW-03 Warehouse', { area: 25000, floors: 1, height: 12, hazard: 'Extra high 1', yardMain: 1200 }), mk('FW-04 Factory shed', { area: 8000, floors: 1, height: 10, hazard: 'Ordinary 2', yardMain: 700 })],
    sel: 0, unit: 'm2', qty: 1, view: '3d', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(WATER_DEFAULTS)) };
}
export function computeWater(c, T) {
  if (!(c.area > 0) || !(c.floors >= 1)) return { error: 'Enter a protected area and the number of floors' };
  const hz = HAZARD[c.hazard], L = T.layout, H = T.hydrant, P = T.pumps, R = T.rates, pipeP = T.pipe;
  const dc = c.dc === 'Yes', floorArea = c.area / c.floors;
  const heads = Math.ceil(c.area / hz.cover * 1.08 * (dc ? 1 + 1.0 : 1) * L.voidFactor);
  const lines = []; const add = (group, label, qty, unit, rate, note = '') => { if (qty > 0) lines.push({ group, label, qty, unit, rate, amount: qty * rate, note }); };
  // sprinkler heads by type
  const dryPct = dc ? 0.3 : 0, mix = L.headMix;
  Object.entries(mix).forEach(([k, share]) => add('Sprinkler heads', `Sprinkler head · ${k}`, Math.round(heads * (1 - dryPct) * share), 'nos', k.startsWith('Pendent') ? R['Sprinkler head, pendent K80'] : k.includes('93') ? R['Sprinkler head, upright 93°C'] : R['Sprinkler head, upright K80']));
  add('Sprinkler heads', 'Dry pendent head, cold aisle', Math.round(heads * dryPct), 'nos', R['Dry pendent head (cold aisle)']);
  add('Sprinkler heads', 'Spare sprinkler cabinets', Math.max(1, Math.round(c.floors / 2)), 'nos', R['Spare sprinkler cabinet']);
  // pipework, bottom-up
  const branchLen = heads * L.branchPerHead, pipe = {}; let pipeTotal = 0;
  Object.entries(L.sizeMix).forEach(([nb, share]) => { const q = Math.round(branchLen * share), pr = pipeRate(+nb, pipeP); if (q > 0) { add('Sprinkler & riser pipework', `MS heavy-grade pipe ${nb} mm`, q, 'RM', pr.rate, `bottom-up ₹${Math.round(pr.rate)}/m vs BOQ ${pr.boq ?? '–'}`); pipe[nb] = pr; pipeTotal += q * pr.rate; } });
  const risers = Math.max(1, Math.ceil(c.area / L.zoneMaxArea / c.floors)) + 1, riserLen = risers * c.height * 1.1 + c.floors * 6;
  add('Sprinkler & riser pipework', 'MS riser pipe 150 mm (sprinkler)', Math.round(riserLen), 'RM', pipeRate(150, pipeP).rate);
  // zone control
  const zones = Math.max(c.floors, Math.ceil(c.area / (c.zoneArea || L.zoneMaxArea)));
  add('Zone control & valves', 'OS&Y gate valve 150 mm with supervisory switch', zones * 2 + risers, 'nos', R['OS&Y gate valve 150']);
  add('Zone control & valves', 'Butterfly valve 150 mm with supervisory switch', Math.ceil(zones / 2), 'nos', R['Butterfly valve 150']);
  add('Zone control & valves', 'Flow switch', zones, 'nos', R['Flow switch']);
  add('Zone control & valves', 'Sprinkler test and drain assembly', zones, 'nos', R['Test & drain assembly']);
  add('Zone control & valves', 'Pressure gauge', zones, 'nos', R['Pressure gauge 150 mm']);
  add('Zone control & valves', 'Air purge valves', Math.ceil(zones * 1.2), 'nos', R['Air purge valve']);
  add('Zone control & valves', 'Sprinkler control valve (wet), 150 mm', Math.max(0, zones - c.preAction), 'nos', R['Sprinkler control valve (ICV) 150']);
  add('Zone control & valves', 'Pre-action package, double interlock with nitrogen', c.preAction, 'nos', R['Pre-action package (double interlock, N2)']);
  if (c.height > 24) add('Zone control & valves', 'Pressure reducing station 150 mm', Math.ceil(c.height / 30), 'nos', R['PRV station 150']);
  add('Zone control & valves', 'Non-return valve 150 mm', 2, 'nos', R['NRV 150']);
  // hydrant system
  const internal = Math.max(H.minPerFloor * c.floors, Math.ceil(floorArea / H.internalAreaPer) * c.floors), external = Math.ceil(c.yardMain / H.externalSpacing);
  add('Hydrant system', 'Landing valve, 63 mm, 2 way', internal, 'nos', R['Landing valve 63 (2 way)']);
  add('Hydrant system', 'Reinforced rubber-lined hose 2 × 15 m', internal, 'nos', R['RRL hose 2 x 15 m']);
  add('Hydrant system', 'Branch pipe with 20 mm nozzle', internal, 'nos', R['Branch pipe & nozzle']);
  add('Hydrant system', 'First-aid hose reel', internal, 'nos', R['First-aid hose reel']);
  add('Hydrant system', 'Hose cabinet', internal, 'nos', R['Hose cabinet (internal)']);
  add('Hydrant system', 'Fire brigade inlet, 4 way', Math.max(1, Math.ceil(risers / 2)), 'nos', R['Fire brigade inlet 4-way']);
  add('Hydrant system', 'External hydrant set (valve, hose, branch, axe)', external, 'nos', R['External hydrant set']);
  const hydrantRiser = Math.round(c.height * 1.1 * Math.max(2, Math.ceil(floorArea / 3000)) + c.floors * 20), mainDN = c.yardDN;
  add('Hydrant system', `MS heavy-grade pipe ${H.riserDN} mm (hydrant risers and internal ring)`, hydrantRiser, 'RM', pipeRate(H.riserDN, pipeP).rate);
  const di = diRate(c.yardDN, pipeP); add('Hydrant system', `DI K9 yard main ${mainDN} mm with coating`, Math.round(c.yardMain), 'RM', di.rate, `bottom-up ₹${Math.round(di.rate)}/m vs BOQ ${di.boq ?? '–'}`);
  add('Hydrant system', `Cathodic protection and anti-corrosive treatment, ${mainDN} mm`, Math.round(c.yardMain), 'RM', T.cpRate[c.yardDN] ?? 9817);
  add('Hydrant system', 'OS&Y gate valve 150 mm (yard and riser isolation)', Math.ceil(external / 2) + Math.ceil(hydrantRiser / 60), 'nos', R['OS&Y gate valve 150']);
  // first aid
  add('First-aid fire fighting', 'ABC powder extinguisher 6 kg', Math.ceil(c.area / H.extinguisherArea * (dc ? 0.4 : 1)), 'nos', R['Extinguisher ABC 6 kg']);
  if (dc) add('First-aid fire fighting', 'Clean-agent extinguisher 4 kg', Math.ceil(c.area / 60), 'nos', R['Clean-agent extinguisher 4 kg']);
  add('First-aid fire fighting', 'Fire bucket sets', H.bucketsPerFloor * c.floors, 'sets', R['Fire bucket set']);
  add('First-aid fire fighting', 'Signage', 1, 'lot', R.Signage);
  // hydraulic demand and pumps
  const sprQ = hz.density * hz.area * 1.0 + hz.hose, hydQ = P.hydrantFlow, staticH = c.height, hSpr = staticH + P.residualSprinkler * (1 + P.frictionPct * 0.4), hHyd = staticH + P.residualHydrant * (1 + P.frictionPct) + 10;
  const kwOf = (q, hd) => (q / 60000) * 1000 * P.rhoG * hd / (P.eta * P.motorEff * 1000) * P.serviceFactor;                // lpm -> m3/s ; kW electrical
  const kwSpr = kwOf(sprQ, hSpr), kwHyd = kwOf(hydQ, hHyd);
  const setCost = (kw) => kw * (P.pumpPerKw + P.motorPerKw);
  let pumps = 0, tankM3 = (sprQ * hz.minutes + hydQ * 60) / 1000;
  if (c.includePumps === 'Yes') {
    add('Fire pumps', 'Sprinkler main pump set (electric)', 1, 'set', setCost(kwSpr) + P.electricCtrl[0] + P.electricCtrl[1] * kwSpr, `${Math.round(sprQ)} lpm × ${Math.round(hSpr)} m, ${kwSpr.toFixed(0)} kW`);
    add('Fire pumps', 'Hydrant main pump set (electric)', 1, 'set', setCost(kwHyd) + P.electricCtrl[0] + P.electricCtrl[1] * kwHyd, `${Math.round(hydQ)} lpm × ${Math.round(hHyd)} m, ${kwHyd.toFixed(0)} kW`);
    if (P.dieselCover) { add('Fire pumps', 'Diesel standby pump set (largest duty)', 1, 'set', Math.max(kwSpr, kwHyd) * (P.pumpPerKw + P.dieselPerKw) + P.dieselCtrl[0] + P.dieselCtrl[1] * Math.max(kwSpr, kwHyd), 'diesel engine drive, 100% standby'); }
    add('Fire pumps', 'Jockey pump set', 1, 'set', P.jockeyFixed + P.jockeyKw * (P.pumpPerKw + P.motorPerKw), '');
    add('Fire pumps', 'Pump header, valves and skid', 1, 'lot', P.headerPerFlow * (sprQ + hydQ) + P.skid);
  }
  if (c.includeTank === 'Yes') add('Fire water storage', 'RCC tank (civil), indicative', Math.round(tankM3), 'm³', P.tankRate);
  const hardware = lines.reduce((s, l) => s + l.amount, 0);
  add('Design, seismic & commissioning', 'Design calculations, shop drawings and approvals', 1, 'LS', hardware * T.lump.design);
  add('Design, seismic & commissioning', 'Seismic supports and accessories', 1, 'lot', hardware * T.lump.seismic);
  add('Design, seismic & commissioning', 'Testing and commissioning', 1, 'LS', hardware * T.lump.testing);
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; });
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { cfg: c, hz, heads, lines, groups, total, pipeTotal, branchLen, pipe, di, zones, risers, internal, external, sprQ, hydQ, hSpr, hHyd, kwSpr, kwHyd, tankM3, floorArea, hardware, perM2: total / c.area, perHead: total / heads };
}

/* ---------- 2. detection & alarm ---------- */
export const ALARM_DEFAULTS = {
  coverage: { smoke: 55, mcp: 450, hooter: 60, speaker: 38, monitor: 0.5, control: 0.04, isolator: 1 / 7 },    // m² per device, or devices per detector
  loopDevices: 220, cablePerM2: 0.9, dcCableFactor: 2.0, pointsPerDetector: 57, capillaryArea: 8, assdPipePerPoint: 1.54,
  rates: { 'Multi-sensor detector': 2832, 'Heat detector (ROR + FT)': 14132, 'Flame detector': 166603, 'Manual call point': 10654, 'Call point cover': 3500, 'Control module': 3627, 'Monitor module': 3627, 'Isolator module': 4849, 'Hooter cum strobe': 8384, 'Speaker, recessed': 9202, 'Speaker, surface': 18500, 'Power supply unit': 27851,
    'FACP 4-loop': 819844, 'FACP 2-loop': 350750, 'Loop card': 242440, 'Field charging PSU': 27851, 'Battery set': 125500, 'Voice controller': 225000, 'Amplifier 500 W': 622057, 'GUI station': 2530300, 'Network control station': 380400, 'Printer': 43380, 'Repeater panel': 662646,
    'Fire survival cable, 1-5 mm² armoured': 167, 'Fire survival cable, 2-5 mm² armoured': 195, 'GI conduit 25 mm': 190, 'ASSD detector, 4-pipe 2000 m²': 429477, 'ASSD detector, 1-pipe 1000 m²': 214739, 'ASSD sampling pipe': 323, 'Capillary set': 2500, 'ASSD PSU': 27851 },
  commissioning: 0.06, design: 0.02,
};
export function alarmDefault() {
  const mk = (tag, o) => ({ tag, area: 25000, floors: 3, dcArea: 18000, loopsPanel: 4, dc: 'Yes', voidLayers: 2, ...o });
  return { list: [mk('FA-01 Data centre (sample BOQ basis)', {}), mk('FA-02 Office block', { area: 12000, floors: 8, dcArea: 0, dc: 'No', voidLayers: 0 }), mk('FA-03 Warehouse', { area: 25000, floors: 1, dcArea: 0, dc: 'No', voidLayers: 0 }), mk('FA-04 Factory + control room', { area: 8000, floors: 1, dcArea: 400, dc: 'No', voidLayers: 0 })], sel: 0, unit: 'm2', qty: 1, view: '3d', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(ALARM_DEFAULTS)) };
}
export function computeAlarm(c, T) {
  if (!(c.area > 0)) return { error: 'Enter a protected area' };
  const k = T.coverage, R = T.rates, lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0) lines.push({ group, label, qty: Math.round(qty * 100) / 100, unit, rate, amount: qty * rate, note }); };
  const dcm = c.dc === 'Yes', smoke = Math.ceil(c.area / k.smoke * (1 + (c.voidLayers || 0))), heat = Math.max(0, Math.round(c.area / 6000)), flame = Math.round(c.dcArea / 220), mcp = Math.ceil(c.area / k.mcp * (dcm ? 3.4 : 1)), hooter = Math.ceil(c.area / k.hooter * (dcm ? 1.25 : 1)), spk = Math.ceil(c.area / k.speaker * (dcm ? 1.3 : 1));
  const detectors = smoke + heat + flame, monitors = Math.ceil(detectors * k.monitor), controls = Math.ceil(detectors * k.control) + Math.ceil(hooter * 0.1), isolators = Math.ceil((detectors + mcp) * k.isolator);
  const devices = detectors + mcp + monitors + controls + isolators + hooter, loops = Math.ceil(devices / T.loopDevices), panels = Math.max(1, Math.ceil(loops / c.loopsPanel));
  add('Detection', 'Intelligent multi-sensor detector', smoke, 'nos', R['Multi-sensor detector']); add('Detection', 'Heat detector', heat, 'nos', R['Heat detector (ROR + FT)']); add('Detection', 'Flame detector', flame, 'nos', R['Flame detector']);
  add('Initiating & modules', 'Manual call point', mcp, 'nos', R['Manual call point']); add('Initiating & modules', 'Call point cover', mcp, 'nos', R['Call point cover']); add('Initiating & modules', 'Monitor module', monitors, 'nos', R['Monitor module']); add('Initiating & modules', 'Control module', controls, 'nos', R['Control module']); add('Initiating & modules', 'Fault isolator module', isolators, 'nos', R['Isolator module']);
  add('Notification & voice', 'Hooter cum strobe', hooter, 'nos', R['Hooter cum strobe']); add('Notification & voice', 'Speaker, recessed', Math.round(spk * 0.75), 'nos', R['Speaker, recessed']); add('Notification & voice', 'Speaker, surface', Math.round(spk * 0.25), 'nos', R['Speaker, surface']);
  add('Notification & voice', 'Power supply units 24 V', Math.ceil(hooter / 4), 'nos', R['Power supply unit']);
  add('Notification & voice', 'Voice controller + slave', panels * 2, 'nos', R['Voice controller']); add('Notification & voice', 'Digital amplifier 500 W', Math.ceil(spk / 40), 'nos', R['Amplifier 500 W']);
  add('Panels & network', 'Addressable fire alarm panel', panels, 'nos', c.loopsPanel <= 2 ? R['FACP 2-loop'] : R['FACP 4-loop']); add('Panels & network', 'Additional loop cards', Math.max(0, loops - panels * 2), 'nos', R['Loop card']);
  add('Panels & network', 'Field charging power supply', panels * 2, 'nos', R['Field charging PSU']); add('Panels & network', 'Battery set (24 h + 30 min)', panels * 0.2, 'lot', R['Battery set']);
  add('Panels & network', 'Repeater panel', Math.max(0, panels - 1), 'nos', R['Repeater panel']); add('Panels & network', 'GUI and network control station', panels > 1 ? 2 : 1, 'set', R['GUI station'] + R['Network control station'] + R.Printer);
  const cable = c.area * T.cablePerM2 * (dcm ? T.dcCableFactor : 1); add('Cabling', 'Fire survival cable 2C × 1.5 mm² armoured', Math.round(cable * 0.8), 'm', R['Fire survival cable, 1-5 mm² armoured']); add('Cabling', 'Fire survival cable 2C × 2.5 mm² (notification)', Math.round(cable * 0.2), 'm', R['Fire survival cable, 2-5 mm² armoured']);
  add('Cabling', 'GI conduit 25 mm', Math.round(cable * 0.8 * 0.2), 'm', R['GI conduit 25 mm']);
  // ASSD for data halls
  const layers = 1 + (c.voidLayers || 0), points = c.dcArea > 0 ? Math.round(c.dcArea * layers / T.capillaryArea) : 0, assdN = Math.ceil(points / T.pointsPerDetector), assd4 = Math.round(assdN * 0.52), assd1 = assdN - assd4;
  add('Air sampling smoke detection', 'ASSD detector, 4 pipe, 2,000 m²', assd4, 'nos', R['ASSD detector, 4-pipe 2000 m²']); add('Air sampling smoke detection', 'ASSD detector, 1 pipe, 1,000 m²', assd1, 'nos', R['ASSD detector, 1-pipe 1000 m²']);
  add('Air sampling smoke detection', 'Sampling pipe', Math.round(points * T.assdPipePerPoint), 'm', R['ASSD sampling pipe']); add('Air sampling smoke detection', 'Capillary sets', points, 'nos', R['Capillary set']); add('Air sampling smoke detection', 'ASSD power supply', assd4 + assd1, 'nos', R['ASSD PSU']);
  const hw = lines.reduce((s, l) => s + l.amount, 0);
  add('Design & commissioning', 'Design, programming and cause-and-effect', 1, 'LS', hw * T.design); add('Design & commissioning', 'Testing and commissioning', 1, 'LS', hw * T.commissioning);
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; });
  const total = lines.reduce((s, l) => s + l.amount, 0);
  return { cfg: c, lines, groups, total, detectors, smoke, mcp, hooter, speakers: spk, devices, loops, panels, cable, assd: assd4 + assd1, assdPoints: points, perM2: total / c.area, perDevice: total / devices };
}

/* ---------- 3. gas suppression (clean agent / inert / CO2), own model ---------- */
export const AGENTS = {
  'FM-200 (HFC-227ea)': { conc: 7.0, svA: 0.1269, svB: 0.0005, fill: 1.15, rate: 2600, kind: 'clean', label: 'FM-200' },
  'Novec 1230 (FK-5-1-12)': { conc: 4.5, svA: 0.0664, svB: 0.0002741, fill: 1.2, rate: 3900, kind: 'clean', label: 'Novec 1230' },
  'Inergen (IG-541)': { conc: 40.0, svA: 0.707, svB: 0.00247, fill: 0, rate: 0, kind: 'inert', label: 'Inergen', perM3: 700, cylM3: 15 },
  'CO₂ (total flooding)': { conc: 34.0, svA: 0.5, svB: 0, fill: 0.67, rate: 90, kind: 'co2', label: 'CO₂' },
};
export const GAS_DEFAULTS = {
  tempC: 20, altitudeFactor: 1.0, designMargin: 1.0, cylinders: { sizes: [40, 67, 80, 106, 140, 180, 300], rate: { 40: 52000, 67: 72000, 80: 88000, 106: 112000, 140: 148000, 180: 190000, 300: 290000 } }, inertCylRate: 62000,
  nozzle: { coverM2: 70, rate: 14000 }, pipe: { perM2Floor: 0.18, rate: 2200, perCylinder: 14 }, valveSet: 18000, mountingPerCyl: 6500,
  detection: { coverM2: 50, rate: 2832, panel: 185000, abort: 7500, release: 9500, hooter: 8384, cablePerM2: 0.5, cableRate: 167, doorSign: 2400 },
  vent: { rate: 28000 }, discharge: { test: 0.015 }, install: 0.14, design: 0.025, commissioning: 0.03, overheads: 0.1, margin: 0.1, roomIntegrity: 38000,
};
export function gasDefault() {
  const mk = (tag, o) => ({ tag, volume: 900, height: 4.2, agent: 'FM-200 (HFC-227ea)', rooms: 1, hazard: 'Class A/electrical', ...o });
  return { list: [mk('GS-01 Data hall (900 m³)', {}), mk('GS-02 UPS room', { volume: 320, height: 3.6, rooms: 2 }), mk('GS-03 Battery room', { volume: 180, height: 3.6, agent: 'Novec 1230 (FK-5-1-12)' }), mk('GS-04 Archive / control room', { volume: 1500, height: 4.5, agent: 'Inergen (IG-541)' }), mk('GS-05 Cable vault', { volume: 600, height: 3.5, agent: 'CO₂ (total flooding)' })], sel: 0, unit: 'm3', qty: 1, view: '3d', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(GAS_DEFAULTS)) };
}
export function computeGas(c, T) {
  const ag = AGENTS[c.agent]; if (!ag) return { error: 'Unknown agent' };
  if (!(c.volume > 0) || !(c.height > 0)) return { error: 'Enter the protected volume and ceiling height' };
  const lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0) lines.push({ group, label, qty: Math.round(qty * 100) / 100, unit, rate, amount: qty * rate, note }); };
  const sv = ag.svA + ag.svB * T.tempC, conc = ag.conc * T.designMargin, V = c.volume * c.rooms;
  const floor = c.volume / c.height * c.rooms;
  let mass = 0, cyl = 0, cylSize = 0, agentCost = 0, hardware = 0;
  if (ag.kind === 'inert') {
    const free = V * -Math.log(1 - conc / 100);                                 // free-gas volume at the design concentration
    const gasM3 = free * T.altitudeFactor; cyl = Math.ceil(gasM3 / ag.cylM3); mass = gasM3; cylSize = 80;
    add('Agent and cylinders', 'IG-541 gas fill', Math.round(gasM3), 'm³ free gas', ag.perM3); add('Agent and cylinders', 'Cylinders 80 L / 300 bar with valves', cyl, 'nos', T.inertCylRate);
  } else {
    mass = ag.kind === 'co2' ? V * 0.8 : V / sv * (conc / (100 - conc));          // CO₂: 0.8 kg/m³ surface-fire flooding factor
    const perCyl = (s) => s * ag.fill, sizes = T.cylinders.sizes; cylSize = sizes.find((s) => perCyl(s) * c.rooms >= mass / c.rooms * 1.0 && s >= 40) ?? 0;
    const n = (s) => Math.ceil(mass / perCyl(s)), best = sizes.map((s) => ({ s, n: n(s), cost: n(s) * T.cylinders.rate[s] })).filter((x) => x.n <= 12 * c.rooms).sort((a, b) => a.cost - b.cost)[0] ?? { s: 300, n: n(300), cost: n(300) * T.cylinders.rate[300] };
    cyl = best.n; cylSize = best.s;
    add('Agent and cylinders', `${ag.label} agent`, Math.round(mass), 'kg', ag.rate, `${conc.toFixed(1)}% design concentration, ${sv.toFixed(4)} m³/kg`); add('Agent and cylinders', `Cylinders ${cylSize} L with valve and pressure gauge`, cyl, 'nos', T.cylinders.rate[cylSize]);
  }
  add('Agent and cylinders', 'Cylinder mounting, manifold and actuators', cyl, 'nos', T.mountingPerCyl);
  const nozzles = Math.max(2, Math.ceil(floor / T.nozzle.coverM2) * (c.height > 4.5 ? 2 : 1)); add('Distribution', 'Discharge nozzles', nozzles, 'nos', T.nozzle.rate);
  add('Distribution', 'Seamless steel pipework with fittings', Math.round(floor * T.pipe.perM2Floor + cyl * T.pipe.perCylinder), 'm', T.pipe.rate); add('Distribution', 'Selector/zone valve sets', c.rooms > 1 ? c.rooms : 0, 'nos', T.valveSet);
  const dets = Math.ceil(floor / T.detection.coverM2) * 2;
  add('Detection and release', 'Smoke detectors (cross-zone)', dets, 'nos', T.detection.rate); add('Detection and release', 'Extinguishing release panel', c.rooms, 'nos', T.detection.panel); add('Detection and release', 'Abort and manual release stations', c.rooms * 2, 'nos', T.detection.abort + T.detection.release); add('Detection and release', 'Hooter / strobe and door signs', c.rooms * 3, 'nos', T.detection.hooter + T.detection.doorSign / 3);
  add('Detection and release', 'Cabling', Math.round(floor * T.detection.cablePerM2 * 4), 'm', T.detection.cableRate);
  add('Room integrity', 'Pressure-relief vents and damper closers', Math.max(1, Math.ceil(V / 400)), 'nos', T.vent.rate); add('Room integrity', 'Door and penetration sealing', c.rooms, 'lot', T.roomIntegrity);
  const hw = lines.reduce((s, l) => s + l.amount, 0);
  add('Installation, design & tests', 'Installation labour', 1, 'lot', hw * T.install); add('Installation, design & tests', 'Design, calculations and shop drawings', 1, 'LS', hw * T.design); add('Installation, design & tests', 'Door-fan test and commissioning', 1, 'LS', hw * T.commissioning);
  const direct = lines.reduce((s, l) => s + l.amount, 0), oh = direct * T.overheads, mg = (direct + oh) * T.margin, total = direct + oh + mg;
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; });
  groups['Overheads'] = oh; groups['Margin'] = mg;
  return { cfg: c, ag, lines, groups, direct, total, mass, cyl, cylSize, nozzles, floor, V, sv, conc, perM3: total / V, perKgAgent: ag.kind === 'inert' ? null : total / mass };
}

/** the sample data-centre BOQ (FPS&FAPA sheet), quantity × PSR rate, in ₹ crore, for the benchmark tab */
export const BOQ_TOTALS = { 'Hydrant system': 5.24, 'Sprinkler system': 20.40, 'Fire detection & alarm': 8.04, 'Air sampling smoke detection': 6.10, 'Testing & commissioning (FAPA, ASSD)': 1.05 };
