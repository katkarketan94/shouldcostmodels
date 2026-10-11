// HT and LT switchgear boards. Not a workbook model: each board is a schedule of bays (panels or modules). Every bay is costed from its
// sheet steel, busbar, switching device, instrument transformers, relay, wiring and test, with device prices that scale with rating.
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const HT_KINDS = { inc: ['Incomer VCB panel', 'A', 1250], fdr: ['Outgoing feeder VCB panel', 'A', 630], cpl: ['Bus coupler VCB panel', 'A', 1250], mtr: ['Motor feeder VCB panel', 'A', 400], pt: ['Bus PT, metering and surge-arrester panel', '', 0] };
export const LT_KINDS = { aci: ['ACB incomer', 'A', 2500], acc: ['ACB bus coupler', 'A', 2500], acf: ['ACB outgoing feeder', 'A', 800], mcf: ['MCCB feeder', 'A', 250], dol: ['MCC starter, DOL', 'kW', 15], sd: ['MCC starter, star-delta', 'kW', 55], vfd: ['MCC starter, VFD', 'kW', 30], pf: ['APFC bank', 'kVAr', 200] };
export const KV = [3.3, 6.6, 11, 22, 33];
export const RELAYS = { 'Electromechanical': 14000, 'Numeric O/C + E/F': 38000, 'IED, IEC 61850 + disturbance record': 98000 };
export const SW_DEFAULTS = {
  prices: { copper: 1400, aluminium: 349, crca: 76, galv: 82 },
  vcb: { 3.3: 380000, 6.6: 390000, 11: 450000, 22: 720000, 33: 950000, ampExp: 0.45, kaExp: 0.5 },     // ₹ at 1,250 A, 25 kA, draw-out
  htPanelKg: { 3.3: 620, 6.6: 640, 11: 700, 22: 1050, 33: 1450 }, htCtSet: { 3.3: 26000, 6.6: 28000, 11: 34000, 22: 62000, 33: 88000 }, htVtSet: { 3.3: 60000, 6.6: 66000, 11: 78000, 22: 140000, 33: 210000 }, htLa: { 3.3: 14000, 6.6: 16000, 11: 21000, 22: 48000, 33: 70000 },
  acbBase: 210000, acbAmpExp: 0.9, acbKaExp: 0.3, acb4p: 1.25, mccbBase: 80, mccbAmpExp: 1.05, mccbKaExp: 0.35,
  starter: { dolBase: 3000, dolPerKw: 1200, kwExp: 0.75, sdFactor: 1.55, vfdBase: 11000, vfdExp: 0.8 }, apfcPerKvar: 650, apfcBase: 62000,
  ctLt: 4800, relayLt: 9500, mfm: 7500, meterHt: 22000, lamps: 1800, selector: 1200, mccbAux: 6000, ammeterSet: 5500,
  steel: { acbKgBase: 160, acbKgPerA: 0.05, mccbKgBase: 28, mccbKgPerA: 0.04, mccKgBase: 24, mccKgPerKw: 0.6, apfcKgBase: 120, apfcKgPerKvar: 0.45, colKg: 90 },
  bus: { cuAmm2PerA: 0.8, alAmm2PerA: 1.25, htJ: 1.6, mccVerticalFrac: 0.5, bayWidthLt: 0.8, bayWidthHt: 0.8, fab: 95, sleeve: 220 },
  mult: { ip: { IP42: 1, IP54: 1.1, IP55: 1.14 }, form: { 'Form 2b': 1, 'Form 3b': 1.12, 'Form 4b': 1.28 }, arc: 1.2, drawout: 1.0 },
  rates: { powder: 14, gasket: 6, hdwr: 0.06, wiringPerBay: 6500, wiringPerDevice: 1800, assemblyPerKg: 38, testPerBay: 6500, typeTest: 0.02, dcSystem: 220000, dcPerBay: 14000, arcDetect: 85000, labelEarth: 4500, packing: 0.025, transport: 0.02, overheads: 0.09, margin: 0.1 },
};
const Cfg = (tag, o) => ({ tag, cls: 'HT', kv: 11, busA: 1250, kA: 25, relay: 'Numeric O/C + E/F', busMat: 'Copper', ip: 'IP42', form: 'Form 3b', arc: 'No', drawout: 'Yes', q: {}, a: {}, ...o });
export function swgrDefault() {
  const ht = (tag, kv, busA, kA, q, a, o = {}) => Cfg(tag, { cls: 'HT', kv, busA, kA, q, a, ...o }), lt = (tag, busA, kA, q, a, o = {}) => Cfg(tag, { cls: 'LT', kv: 0.415, busA, kA, q, a, relay: 'Numeric O/C + E/F', form: 'Form 3b', ip: 'IP54', busMat: 'Aluminium', ...o });
  return { list: [
    ht('HT-01 11 kV plant board, 13 panels', 11, 1250, 25, { inc: 2, cpl: 1, fdr: 6, mtr: 2, pt: 2 }, { inc: 1250, cpl: 1250, fdr: 630, mtr: 400 }),
    ht('HT-02 33 kV main board, 8 panels', 33, 2000, 31.5, { inc: 2, cpl: 1, fdr: 4, pt: 1 }, { inc: 2000, cpl: 2000, fdr: 1250 }, { relay: 'IED, IEC 61850 + disturbance record', arc: 'Yes' }),
    ht('HT-03 6.6 kV motor board, 10 panels', 6.6, 1250, 40, { inc: 1, fdr: 1, mtr: 7, pt: 1 }, { inc: 1250, fdr: 630, mtr: 400 }),
    lt('LT-01 PCC 3200 A, 2 incomers + coupler', 3200, 50, { aci: 2, acc: 1, acf: 4, mcf: 12 }, { aci: 3200, acc: 3200, acf: 800, mcf: 250 }, { form: 'Form 4b' }),
    lt('LT-02 MCC, 40 starters', 1000, 50, { aci: 1, mcf: 4, dol: 28, sd: 6, vfd: 6 }, { aci: 1000, mcf: 125, dol: 11, sd: 55, vfd: 30 }, { busMat: 'Copper', form: 'Form 3b' }),
    lt('LT-03 APFC panel 600 kVAr', 1000, 36, { aci: 1, pf: 3 }, { aci: 1000, pf: 200 }, { ip: 'IP42', form: 'Form 2b' }),
  ], sel: 0, unit: 'board', qty: 1, view: '3d', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(SW_DEFAULTS)) };
}
export function computeSwgr(c, T) {
  const ht = c.cls === 'HT', kinds = ht ? HT_KINDS : LT_KINDS, P = T.prices, rt = T.rates, S = T.steel, B = T.bus, kv = ht ? c.kv : 0.415;
  const bays = Object.keys(kinds).map((k) => ({ k, label: kinds[k][0], unit: kinds[k][1], n: Math.max(0, Math.round(c.q?.[k] ?? 0)), size: c.a?.[k] ?? kinds[k][2] })).filter((b) => b.n > 0);
  if (!bays.length) return { error: 'Add at least one bay' };
  if (ht && !T.vcb[kv]) return { error: 'Choose a standard voltage' };
  const lines = [], add = (group, bay, label, qty, unit, rate) => { if (qty > 0 && rate > 0) lines.push({ group, bay, label, qty: R2(qty), unit, rate, amount: qty * rate }); };
  const G1 = 'Enclosure & structure', G2 = 'Busbars & insulation', G3 = 'Switching devices', G4 = 'Protection & metering', G5 = 'Wiring & auxiliaries', G6 = 'Assembly & test';
  const mult = T.mult.ip[c.ip] * (ht ? 1 : T.mult.form[c.form]) * (c.arc === 'Yes' ? T.mult.arc : 1);
  const warn = [];
  let nBays = 0, devices = 0, steelTotal = 0, cols = 0, widthM = 0;
  const busA = c.busA, busMm2 = busA * (ht ? 1 / T.bus.htJ : (c.busMat === 'Copper' ? P && B.cuAmm2PerA : B.alAmm2PerA));
  for (const b of bays) {
    const n = b.n, lab = b.label; nBays += n; let steelKg = 0, devQty = 0;
    if (ht) {
      steelKg = T.htPanelKg[kv] * (b.k === 'pt' ? 0.8 : 1) * (b.size > 1600 ? 1.15 : 1) * mult;
      if (b.k !== 'pt') {
        const vcb = T.vcb[kv] * (b.size / 1250) ** T.vcb.ampExp * (c.kA / 25) ** T.vcb.kaExp * (b.k === 'mtr' ? 0.9 : 1);
        if (b.size > busA) warn.push(`${lab}: ${b.size} A is above the ${busA} A busbar.`);
        add(G3, lab, `${lab}: VCB ${b.size} A, ${c.kA} kA, draw-out`, n, 'no', vcb);
        add(G4, lab, 'CT set (protection + metering) and earth-fault CT', n, 'set', T.htCtSet[kv] * (1 + 0.15 * (c.kA / 25 - 1)) * 1.0);
        add(G4, lab, `Relay: ${c.relay}`, n, 'no', RELAYS[c.relay] * (b.k === 'inc' || b.k === 'cpl' ? 1.25 : 1));
        add(G4, lab, 'Multi-function meter', n, 'no', T.meterHt);
        if (b.k === 'inc') add(G4, lab, 'Incomer VT set (draw-out)', n, 'set', T.htVtSet[kv] * 0.8);
        add(G5, lab, 'Earth switch, interlocks, trip circuit supervision, heaters, lamps', n, 'set', 38000 * (kv >= 22 ? 1.6 : 1));
        devQty = 1;
      } else { add(G4, lab, 'Bus VT set, fused, draw-out', n, 'set', T.htVtSet[kv]); add(G4, lab, 'Surge arrester set', n, 'set', T.htLa[kv] * 3 / 3); add(G4, lab, 'Bus metering and voltage relays', n, 'set', RELAYS[c.relay] * 0.7 + T.meterHt); devQty = 1; }
    } else {
      const I = b.size; let dev = 0, devLabel = '';
      if (b.k === 'aci' || b.k === 'acc' || b.k === 'acf') { steelKg = (S.acbKgBase + S.acbKgPerA * I) * mult; dev = T.acbBase * (I / 1000) ** T.acbAmpExp * (c.kA / 50) ** T.acbKaExp * (b.k === 'acf' ? 1 : T.acb4p); devLabel = `ACB ${I} A, ${c.kA} kA, ${b.k === 'acf' ? '3P' : '4P'}, draw-out`;
        add(G4, lab, 'CTs, microprocessor release, MFM, ammeter / voltmeter set', n, 'set', T.ctLt * 4 + T.relayLt * 3 + T.mfm + T.ammeterSet);
        add(G5, lab, 'Shunt trip, closing coil, interlocks, lamps and selectors', n, 'set', 14000 + T.lamps * 3 + T.selector * 2); }
      else if (b.k === 'mcf') { steelKg = (S.mccbKgBase + S.mccbKgPerA * I) * mult; dev = T.mccbBase * I ** T.mccbAmpExp * (c.kA / 36) ** T.mccbKaExp; devLabel = `MCCB ${I} A, 3P, ${Math.max(36, c.kA)} kA`; add(G4, lab, 'Feeder CT, ammeter and indication', n, 'set', T.ctLt + T.mccbAux + T.lamps); }
      else if (b.k === 'dol' || b.k === 'sd' || b.k === 'vfd') { const st = T.starter; steelKg = (S.mccKgBase + S.mccKgPerKw * I ** 0.8) * mult * (b.k === 'vfd' ? 1.35 : 1);
        dev = b.k === 'vfd' ? st.vfdBase * I ** st.vfdExp : (st.dolBase + st.dolPerKw * I ** st.kwExp) * (b.k === 'sd' ? st.sdFactor : 1); devLabel = b.k === 'vfd' ? `VFD ${I} kW` : `${b.k === 'dol' ? 'DOL' : 'Star-delta'} starter ${I} kW (MPCB / contactor / overload)`;
        add(G4, lab, 'Starter CT, ammeter, lamps, push buttons and relay', n, 'set', T.ctLt + T.relayLt + T.lamps * 3 + T.selector * 2); }
      else if (b.k === 'pf') { steelKg = (S.apfcKgBase + S.apfcKgPerKvar * I) * mult; dev = T.apfcBase + T.apfcPerKvar * I; devLabel = `APFC ${I} kVAr (capacitors, detuned reactors, thyristor / contactor switching)`; add(G4, lab, 'APFC controller, CTs and metering', n, 'set', 28000); }
      add(G3, lab, `${lab}: ${devLabel}`, n, 'no', dev); devQty = b.k === 'mcf' ? 0.25 : 1;
    }
    add(G1, lab, `Sheet steel, enclosure and covers (${R2(steelKg, 0)} kg per bay)`, n * steelKg, 'kg', P.crca); add(G1, lab, 'Pre-treatment and powder coating', n * steelKg, 'kg', rt.powder); add(G1, lab, 'Gaskets, doors, hardware', n * steelKg, 'kg', rt.gasket + rt.hdwr * P.crca);
    add(G5, lab, 'Control wiring and terminals', n, 'bay', rt.wiringPerBay * (ht ? 1.6 : 1) * (b.k === 'mcf' ? 0.3 : 1));
    steelTotal += n * steelKg; devices += n * devQty;
    cols += ht ? n : (b.k === 'mcf' ? n / 4 : b.k === 'dol' || b.k === 'sd' || b.k === 'vfd' ? n / 8 : n); widthM += ht ? n * B.bayWidthHt : (b.k === 'mcf' ? n / 4 : b.k === 'dol' || b.k === 'sd' || b.k === 'vfd' ? n / 8 : n) * B.bayWidthLt;
    b.steelKg = steelKg;
  }
  // main busbar and risers
  const phases = ht ? 3 : 4, len = widthM + 1.2 * Math.ceil(cols), mass = phases * busMm2 * len * (c.busMat === 'Copper' || ht ? 8.9 : 2.7) / 1000;
  const rawRate = ht || c.busMat === 'Copper' ? P.copper : P.aluminium;
  add(G2, 'Board', `Main busbar, ${ht ? 'copper' : c.busMat.toLowerCase()} ${busA} A (${R2(busMm2, 0)} mm² per phase, ${R2(len, 1)} m)`, mass, 'kg', rawRate + B.fab);
  if (!ht && bays.some((b) => ['dol', 'sd', 'vfd'].includes(b.k))) { const nMcc = bays.filter((b) => ['dol', 'sd', 'vfd'].includes(b.k)).reduce((s, b) => s + b.n, 0), vcols = Math.ceil(nMcc / 8), vm = phases * busMm2 * B.mccVerticalFrac * 2.2 * vcols * (c.busMat === 'Copper' ? 8.9 : 2.7) / 1000; add(G2, 'Board', 'Vertical busbars, MCC sections', vm, 'kg', rawRate + B.fab); }
  add(G2, 'Board', 'Busbar sleeving, supports and barriers', len * phases, 'm', B.sleeve * (ht ? 1.8 : 1) * (c.form === 'Form 4b' ? 1.4 : 1));
  if (ht) { add(G5, 'Board', '110 V DC system: battery, charger, DC distribution', 1, 'set', rt.dcSystem + rt.dcPerBay * nBays); if (c.arc === 'Yes') add(G5, 'Board', 'Arc-flash detection and fast tripping', 1, 'set', rt.arcDetect + 9000 * nBays); }
  else if (c.arc === 'Yes') add(G5, 'Board', 'Arc-flash relay and sensors', 1, 'set', rt.arcDetect * 0.5);
  add(G5, 'Board', 'Earth bar, nameplates, labelling, end covers', Math.ceil(cols), 'column', rt.labelEarth);
  const material = lines.reduce((s, l) => s + l.amount, 0);
  add(G6, 'Board', 'Assembly, fabrication and wiring labour', steelTotal, 'kg', rt.assemblyPerKg * (c.form === 'Form 4b' ? 1.2 : 1) * (ht ? 1.5 : 1));
  add(G6, 'Board', 'Routine tests, FAT and inspection', nBays, 'bay', rt.testPerBay * (ht ? 1.8 : 1)); add(G6, 'Board', 'Type-test and certification allowance', 1, 'lot', material * rt.typeTest);
  add(G6, 'Board', 'Packing and transport', 1, 'lot', lines.reduce((s, l) => s + l.amount, 0) * (rt.packing + rt.transport));
  const direct = lines.reduce((s, l) => s + l.amount, 0), oh = direct * rt.overheads, mg = (direct + oh) * rt.margin, total = direct + oh + mg;
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; }); groups.Overheads = oh; groups.Margin = mg;
  const byBay = {}; lines.forEach((l) => { byBay[l.bay] = (byBay[l.bay] || 0) + l.amount; });
  const loadShare = direct > 0 ? 1 : 0, weight = steelTotal + mass * (1 + (c.busMat === 'Copper' || ht ? 0 : 0)) + devices * (ht ? 120 : 20);
  if (!ht && c.kA > 65) warn.push('Fault levels above 65 kA need special busbar bracing; confirm with the manufacturer.');
  return { cfg: c, ht, kv, bays, nBays, cols: Math.ceil(cols), widthM, depthM: ht ? (kv >= 22 ? 2.4 : 1.9) : (c.form === 'Form 4b' ? 0.9 : 0.8), heightM: ht ? (kv >= 22 ? 2.7 : 2.3) : 2.4, busMm2, busKg: mass, lines, groups, byBay, direct, total, perBay: total / nBays, perKw: null, steelTotal, weight, warn: [...new Set(warn)], loadShare };
}
