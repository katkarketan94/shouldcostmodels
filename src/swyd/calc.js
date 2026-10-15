// Substation switchyards, 66 to 765 kV, air-insulated (AIS) or gas-insulated (GIS). Not a workbook model: a bay-based bottom-up of the primary
// equipment, structures, bus, protection, cabling, earthing and civil works, with unit prices by voltage that scale with current and fault level.
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const KV = [66, 132, 220, 400, 765];
export const SCHEMES = { single: ['Single bus', 1, 1, 2, 0], mainTransfer: ['Main and transfer bus', 2, 1, 3, 1], double: ['Double main bus', 2, 1, 3, 1], oneHalf: ['One-and-a-half breaker', 2, 1.5, 4, 0] };   // label, buses, breakers per feeder, isolators per feeder, coupler bays
const by = (a, b, c, d, e) => ({ 66: a, 132: b, 220: c, 400: d, 765: e });
export const SY_DEFAULTS = {
  steelRate: 98, alRate: 349,                       // fabricated, galvanised structure ₹/kg; aluminium ₹/kg (follows the commodity file)
  cb: by(2400000, 4800000, 9500000, 21000000, 62000000), ampExp: 0.3, kaExp: 0.35,        // SF6 breaker at 2,000 A, 40 kA
  iso: by(450000, 900000, 1800000, 3600000, 11000000), isoNoEs: 0.8,                       // three-pole isolator with earth switch
  ct: by(250000, 450000, 900000, 1900000, 5500000), cvt: by(300000, 520000, 1000000, 1400000, 3800000), la: by(120000, 200000, 450000, 950000, 2600000), wt: by(900000, 1200000, 1600000, 2600000, 5000000),
  structT: by(9, 14, 24, 42, 90), bayW: by(7, 12, 18, 27, 45), bayL: by(25, 40, 55, 75, 120),    // steel t per bay, bay width and length m
  insul: by(150000, 350000, 700000, 1500000, 3500000), earth: by(400000, 700000, 1200000, 1800000, 3000000),
  prot: { line: 1600000, xfmr: 2200000, reactor: 1800000, coupler: 1200000, kvF: by(0.8, 1, 1.15, 1.5, 1.9), station: 12000000, perBay: 600000 },
  cable: { m: by(1500, 2500, 4000, 7000, 12000), rate: 150 },
  civil: by(1800000, 3500000, 7000000, 14000000, 32000000), yard: { aux: 15000000, auxPerBay: 400000, light: 8000000, lightPerBay: 250000 },
  gis: { f: 1.8, steel: 0.2, civil: 0.35, building: by(3000000, 4500000, 6500000, 9000000, 14000000), area: 0.15 },
  busAperMm2: 0.9, fabAl: 120, erect: { steelRate: 22, pct: 0.06 }, test: { lot: 3000000, pct: 0.01 }, stack: { engineering: 0.03, overheads: 0.05, margin: 0.08, misc: 0.01 },
};
const mk = (tag, o) => ({ tag, kv: 400, scheme: 'oneHalf', gis: 'AIS', amps: 3150, kA: 40, lines: 6, xfmr: 4, reactor: 2, spare: 2, ...o });
export function swydDefault() {
  return { list: [mk('SY-01 400 kV AIS, one-and-a-half breaker', {}), mk('SY-02 220 kV AIS, double bus', { kv: 220, scheme: 'double', amps: 2000, kA: 40, lines: 4, xfmr: 3, reactor: 1, spare: 2 }),
    mk('SY-03 132 kV AIS, main and transfer', { kv: 132, scheme: 'mainTransfer', amps: 1600, kA: 31.5, lines: 4, xfmr: 2, reactor: 0, spare: 1 }), mk('SY-04 400 kV GIS, double bus', { scheme: 'double', gis: 'GIS', lines: 4, xfmr: 2, reactor: 1, spare: 1 }),
    mk('SY-05 765 kV AIS, one-and-a-half breaker', { kv: 765, amps: 4000, kA: 50, lines: 4, xfmr: 2, reactor: 4, spare: 1 })],
    sel: 0, unit: 'yard', qty: 1, view: 'section', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(SY_DEFAULTS)) };
}
export function computeSwyd(c, T) {
  const kv = c.kv, sc = SCHEMES[c.scheme], gis = c.gis === 'GIS', n = (v) => Math.max(0, Math.round(v || 0));
  if (!T.cb[kv] || !sc) return { error: 'Choose a standard voltage and scheme' };
  const lines_ = n(c.lines), xf = n(c.xfmr), rx = n(c.reactor), spare = n(c.spare), feeders = lines_ + xf + rx + spare;
  if (lines_ + xf + rx < 1) return { error: 'Add at least one feeder bay' };
  const [, buses, cbPer, isoPer, couplers] = sc, cb = Math.ceil(feeders * cbPer) + couplers, iso = feeders * isoPer + couplers * 3, esIso = lines_ + xf + rx + spare, plainIso = iso - esIso;
  const bays = feeders + couplers + (c.scheme === 'oneHalf' ? 0 : 0), lines = [], add = (group, label, qty, unit, rate, note = '') => { if (qty > 0 && rate > 0) lines.push({ group, label, qty: R2(qty), unit, rate, amount: qty * rate, note }); };
  const G1 = 'Primary equipment', G2 = 'Structures and bus', G3 = 'Protection and control', G4 = 'Cables and earthing', G5 = 'Civil and auxiliaries', G6 = 'Erection and test';
  const aF = (c.amps / 2000) ** T.ampExp, kF = (c.kA / 40) ** T.kaExp, gF = gis ? T.gis.f : 1;
  const cbP = T.cb[kv] * aF * kF, isoP = T.iso[kv] * aF, la = (lines_ + xf + rx) * 3 + 3 * buses, ctSets = cb, cvt = 3 * (lines_ + buses), wt = lines_;
  const tag = gis ? 'GIS bay: ' : '';
  if (gis) {
    const prim = (cb * cbP + esIso * isoP + plainIso * isoP * T.isoNoEs + ctSets * T.ct[kv]) * gF;
    add(G1, `${tag}SF6 GIS bays: breaker, isolators, earth switches, CTs, enclosure and bus duct (${cb} breakers, ${iso} isolators)`, 1, 'lot', prim);
  } else {
    add(G1, `Circuit breaker ${kv} kV, ${c.amps} A, ${c.kA} kA, SF6`, cb, 'no', cbP); add(G1, 'Isolator with earth switch', esIso, 'no', isoP); add(G1, 'Isolator without earth switch', plainIso, 'no', isoP * T.isoNoEs); add(G1, 'Current transformer set (3 phase, protection + metering)', ctSets, 'set', T.ct[kv]);
  }
  add(G1, 'Capacitive voltage transformer', cvt, 'no', T.cvt[kv]); add(G1, 'Surge arrester', la, 'no', T.la[kv]); add(G1, 'Wave trap with line-matching unit', wt, 'no', T.wt[kv]);
  const steelT = (feeders + couplers) * T.structT[kv] * (gis ? T.gis.steel : 1);
  add(G2, `Gantries and equipment structures, fabricated and galvanised (${R2(steelT, 0)} t)`, steelT * 1000, 'kg', T.steelRate);
  const busLen = (feeders + couplers) * T.bayW[kv] * buses * 3, busMm2 = c.amps / T.busAperMm2, busKg = gis ? 0 : busLen * busMm2 * 2.7 / 1000;
  if (!gis) add(G2, `Bus conductor: aluminium, ${R2(busMm2, 0)} mm² per phase, ${R2(busLen, 0)} m`, busKg, 'kg', T.alRate + T.fabAl);
  if (!gis) add(G2, 'Insulator strings, clamps, connectors and hardware', bays, 'bay', T.insul[kv]);
  const kvF = T.prot.kvF[kv]; add(G3, 'Line protection and control panels', lines_, 'bay', T.prot.line * kvF); add(G3, 'Transformer protection and control panels', xf, 'bay', T.prot.xfmr * kvF); add(G3, 'Reactor protection and control panels', rx, 'bay', T.prot.reactor * kvF);
  add(G3, 'Spare-bay panels', spare, 'bay', T.prot.line * kvF * 0.6); add(G3, 'Bus coupler / bus protection and control', couplers + (buses > 1 ? 1 : 0), 'bay', T.prot.coupler * kvF); add(G3, 'Station SCADA, bay controllers, GPS clock, communications', 1, 'lot', T.prot.station + T.prot.perBay * bays);
  const cabM = bays * T.cable.m[kv]; add(G4, 'Control and power cables, laid in trench', cabM, 'm', T.cable.rate); add(G4, 'Earth mat, risers and lightning protection', bays, 'bay', T.earth[kv] * (gis ? 0.6 : 1));
  const civil = bays * T.civil[kv] * (gis ? T.gis.civil : 1); add(G5, gis ? 'Foundations, trenches, roads and fencing (GIS site)' : 'Foundations, trenches, roads, drainage and fencing', 1, 'lot', civil);
  if (gis) add(G5, 'GIS building with crane and ventilation', bays, 'bay', T.gis.building[kv]);
  add(G5, 'Station auxiliaries: AC / DC systems, batteries, transformers', 1, 'lot', T.yard.aux + T.yard.auxPerBay * bays); add(G5, 'Yard lighting, fire protection and drainage', 1, 'lot', T.yard.light + T.yard.lightPerBay * bays);
  const sup = lines.filter((l) => l.group === G1 || l.group === G3).reduce((s, l) => s + l.amount, 0);
  add(G6, 'Erection of structures', steelT * 1000, 'kg', T.erect.steelRate); add(G6, 'Erection and commissioning of equipment', 1, 'lot', sup * T.erect.pct);
  add(G6, 'Pre-commissioning tests and site acceptance', 1, 'lot', T.test.lot + lines.reduce((s, l) => s + l.amount, 0) * T.test.pct);
  const base = lines.reduce((s, l) => s + l.amount, 0), st = T.stack, load = st.engineering + st.overheads + st.margin + st.misc, total = base / (1 - load);
  const parts = {}; lines.forEach((l) => { parts[l.group] = (parts[l.group] || 0) + l.amount; }); parts.Engineering = total * st.engineering; parts.Overheads = total * st.overheads; parts['Supervision, spares'] = total * st.misc; parts.Margin = total * st.margin;
  const areaHa = (feeders + couplers) * T.bayW[kv] * T.bayL[kv] * 1.3 * (gis ? T.gis.area : 1) / 10000;
  return { cfg: c, kv, gis, sc, feeders, bays, cb, iso, esIso, plainIso, ct: ctSets, cvt, la, wt, steelT, busLen, busKg, busMm2, areaHa, lines, parts, base, total, perBay: total / bays, lines_, xf, rx, spare, couplers, buses };
}
