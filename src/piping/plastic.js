// Plastic pipes (HDPE PE100, PVC-U, PP-R, CPVC). Not taken from a workbook: it follows the metal workbook's cost structure
// (raw material with yield loss and scrap credit, conversion, testing, margin, payment interest, logistics) with extrusion-specific rates.
const RHO = { 'HDPE PE100': 0.95, 'PVC-U': 1.40, 'PP-R': 0.90, CPVC: 1.55 };
export const FAMILIES = {
  'HDPE PE100': { label: 'HDPE PE100', std: 'IS 4984 / ISO 4427', od: [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500, 560, 630], ratings: [['SDR 33', 33], ['SDR 26', 26], ['SDR 21', 21], ['SDR 17', 17], ['SDR 13.6', 13.6], ['SDR 11', 11], ['SDR 9', 9], ['SDR 7.4', 7.4]], minWall: 2.0, resin: 'hdpe_resin', color: 0x20242b },
  'PVC-U': { label: 'PVC-U', std: 'IS 4985', od: [63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400], ratings: [['0.25 MPa (2.5 kgf)', 0.25], ['0.4 MPa (4 kgf)', 0.4], ['0.6 MPa (6 kgf)', 0.6], ['0.8 MPa (8 kgf)', 0.8], ['1.0 MPa (10 kgf)', 1.0], ['1.25 MPa (12.5 kgf)', 1.25]], minWall: 1.6, resin: 'pvc_resin', color: 0xb9bdc4 },
  'PP-R': { label: 'PP-R', std: 'DIN 8077 / IS 15801', od: [20, 25, 32, 40, 50, 63, 75, 90, 110], ratings: [['SDR 11 (PN 10)', 11], ['SDR 7.4 (PN 16)', 7.4], ['SDR 6 (PN 20)', 6]], minWall: 1.9, resin: 'ppr_resin', color: 0x5aa66a },
  CPVC: { label: 'CPVC', std: 'ASTM F441 (IPS)', od: [21.34, 26.67, 33.4, 42.16, 48.26, 60.33, 73.03, 88.9, 114.3], ratings: [['SCH 40', 40], ['SCH 80', 80]], minWall: 1.5, resin: 'cpvc_resin', color: 0xe9dcb8 },
};
const CPVC_WALL = { 40: [2.77, 2.87, 3.38, 3.56, 3.68, 3.91, 5.16, 5.49, 6.02], 80: [3.73, 3.91, 4.55, 4.85, 5.08, 5.54, 7.01, 7.62, 8.56] };
export const CPVC_NPS = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"'];

export const PLASTIC_DEFAULTS = {
  resin: { 'HDPE PE100': 108, 'PVC-U': 82, 'PP-R': 135, CPVC: 215 },                          // ₹/kg
  additivePct: { 'HDPE PE100': 0.03, 'PVC-U': 0.12, 'PP-R': 0.04, CPVC: 0.18 },               // masterbatch, stabilisers, fillers, lubricants (% of resin)
  stress: { 'PVC-U': 10 },                                                                     // MPa design stress for the PVC wall formula
  yieldLoss: 0.025, regrindRecovery: 0.8,                                                      // start-up and trim scrap, share of its value recovered by regrind
  conversion: { 'HDPE PE100': { energy: 3.6, labour: 3.2, deprec: 4.5, other: 2.2 }, 'PVC-U': { energy: 2.8, labour: 3.0, deprec: 4.0, other: 2.0 }, 'PP-R': { energy: 3.4, labour: 3.4, deprec: 5.0, other: 2.4 }, CPVC: { energy: 4.2, labour: 4.0, deprec: 6.0, other: 3.0 } }, // ₹/kg
  thickWallPct: 0.015,                                                                         // extra conversion per 1 mm of wall above 10 mm (slower line speed), % of conversion
  testing: { hydroPerKg: 0.8, docPerKg: 2.0 },                                                 // ₹/kg
  finishing: { socketPerM: 0 },
  margin: { 'HDPE PE100': 0.10, 'PVC-U': 0.10, 'PP-R': 0.12, CPVC: 0.14 },
  interest: { months: 3, rate: 0.09 },
  logistics: { loadingPerTon: 1400, loadFactor: [[110, 0.6], [315, 0.4], [99999, 0.25]] },    // OD (mm) up to -> truck loading factor (bulk-limited)
};

export function plasticDefault() {
  const mk = (tag, family, od, rating, qty) => ({ tag, family, od, rating, len: 1, qty });
  return { list: [mk('HDPE 110 SDR 11', 'HDPE PE100', 110, 11, 20000), mk('HDPE 315 SDR 17', 'HDPE PE100', 315, 17, 4000), mk('PVC-U 110 · 0.6 MPa', 'PVC-U', 110, 0.6, 15000), mk('PVC-U 200 · 0.8 MPa', 'PVC-U', 200, 0.8, 6000), mk('PP-R 32 SDR 7.4', 'PP-R', 32, 7.4, 8000), mk('CPVC 2" SCH 80', 'CPVC', 60.33, 80, 3000)], sel: 0, unit: 'm', qty: 1, view: '3d', btab: 'anatomy', T: JSON.parse(JSON.stringify(PLASTIC_DEFAULTS)) };
}

export function wallOf(c, T) {
  const f = FAMILIES[c.family];
  let t;
  if (c.family === 'CPVC') { const i = f.od.findIndex((o) => Math.abs(o - c.od) < 0.5); t = i < 0 ? NaN : CPVC_WALL[c.rating][i]; }
  else if (c.family === 'PVC-U') t = c.rating * c.od / (2 * T.stress['PVC-U'] + c.rating);
  else t = c.od / c.rating;
  return Math.ceil(Math.max(f.minWall, t) * 10 - 1e-9) / 10;
}

export function computePlastic(c, T) {
  const f = FAMILIES[c.family];
  if (!f) return { error: 'Unknown pipe family' };
  if (!(c.od > 0)) return { error: 'Enter an outside diameter' };
  const wall = wallOf(c, T);
  if (!(wall > 0) || wall * 2 >= c.od) return { error: 'This size has no wall thickness in the standard. Pick a listed size and rating.' };
  const id = c.od - 2 * wall, rho = RHO[c.family];
  const area = Math.PI / 4 * (c.od ** 2 - id ** 2), wtM = area * rho / 1000;                // kg/m
  const rmKg = wtM * (1 + T.yieldLoss), resin = T.resin[c.family], addPct = T.additivePct[c.family], compound = resin * (1 + addPct);
  const rm = rmKg * compound, scrap = -(rmKg - wtM) * compound * T.regrindRecovery;
  const cv = T.conversion[c.family], convKg = (cv.energy + cv.labour + cv.deprec + cv.other) * (1 + Math.max(0, wall - 10) * T.thickWallPct);
  const conversion = wtM * convKg, testing = wtM * (T.testing.hydroPerKg + T.testing.docPerKg);
  const base = rm + scrap + conversion + testing, margin = T.margin[c.family], interest = T.interest.rate / 12 * T.interest.months;
  const lf = T.logistics.loadFactor.find(([mx]) => c.od <= mx)[1], transport = T.logistics.loadingPerTon / (lf * 1000) * rmKg;
  const total = base * (1 + margin) * (1 + interest) + transport;
  const parts = { rm: rm + scrap, conversion, testing, margin: base * margin, interest: base * (1 + margin) * interest, transport };
  return { cfg: c, family: f, wall, id, rho, wtM, rmKg, resin, compound, addPct, rm, scrap, conversion, convKg, testing, base, margin, marginAmt: base * margin, interest, interestAmt: parts.interest, transport, loadFactor: lf, total, perKg: total / wtM, parts, area, surface: Math.PI * c.od / 1000 };
}
