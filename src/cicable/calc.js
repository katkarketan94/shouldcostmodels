// Control, instrumentation and thermocouple-extension cables. Not a workbook model: constructions are built up layer by layer
// (conductor, insulation, lay-up, screen, bedding, armour, sheath) from IEC 60502 / IS 1554 style thicknesses, and priced bottom-up.
const R2 = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
export const FAMILIES = { control: 'Control cable (multicore)', instr: 'Instrumentation cable (pairs / triples)', tc: 'Thermocouple extension / compensating cable' };
export const SIZES = { control: [1, 1.5, 2.5, 4, 6], instr: [0.5, 0.75, 1, 1.5], tc: [0.5, 0.75, 1, 1.5] };
export const INSUL = { 'PVC': { rho: 1.4, price: 'pvc', k: 1.0, thk: 1 }, 'XLPE': { rho: 0.93, price: 'xlpe', k: 1.0, thk: 0.85 }, 'FRLS PVC': { rho: 1.5, price: 'frls', k: 1.0, thk: 1 }, 'LSZH': { rho: 1.5, price: 'lszh', k: 1.0, thk: 1.05 }, 'PE': { rho: 0.95, price: 'pe', k: 1.0, thk: 0.9 }, 'FEP': { rho: 2.15, price: 'fep', k: 1.0, thk: 0.6 } };
export const SHEATH = { 'PVC ST1': { rho: 1.45, price: 'pvc' }, 'FRLS PVC': { rho: 1.5, price: 'frls' }, 'LSZH': { rho: 1.55, price: 'lszh' }, 'PE': { rho: 0.95, price: 'pe' } };
export const SHIELDS = ['None', 'Overall Al-Mylar', 'Individual + overall Al-Mylar', 'Overall Cu braid', 'Individual Al-Mylar + overall Cu braid'];
export const ARMOURS = ['None', 'GI round wire', 'GI flat strip', 'Double GI strip'];
export const TC_TYPES = { 'K extension (KX)': { a: 'Chromel', b: 'Alumel', ra: 1500, rb: 1350, col: ['#cc3b3b', '#d9a441'] }, 'K compensating (KCA/KCB)': { a: 'Copper', b: 'Cu-Ni', ra: 0, rb: 900, col: ['#cc3b3b', '#d9a441'] }, 'J extension (JX)': { a: 'Iron', b: 'Constantan', ra: 95, rb: 1000, col: ['#e8e8e8', '#222222'] }, 'T extension (TX)': { a: 'Copper', b: 'Constantan', ra: 0, rb: 1000, col: ['#2b6fd6', '#d9a441'] }, 'N extension (NX)': { a: 'Nicrosil', b: 'Nisil', ra: 1700, rb: 1550, col: ['#e08a2e', '#d9a441'] }, 'R/S compensating (RCA/SCA)': { a: 'Copper', b: 'Cu-Ni (Cu-0.6Ni)', ra: 0, rb: 1100, col: ['#e08a2e', '#2b9a5f'] } };
const COND_D = { 0.5: 0.9, 0.75: 1.1, 1: 1.3, 1.5: 1.6, 2.5: 2.1, 4: 2.7, 6: 3.3 };
export const CI_DEFAULTS = {
  rates: { copper: 1400, tinPremium: 55, pvc: 100, xlpe: 125, frls: 128, lszh: 190, pe: 108, fep: 1850, steel_wire: 68, stripPremium: 6, filler: 70, alMylarPerM2: 55, copperDensity: 8.89 },
  conv: { stranding: 28, extrusion: 16, extrusionFine: 28, pairing: 0.45, layup: 0.5, layupPerElem: 0.12, screenOverall: 2.2, screenIndividual: 1.4, braid: 6.5, armourWire: 11, armourStrip: 13, sheathing: 14, bedding: 12, test: 0.6, tcDraw: 55 },
  stack: { scrap: 0.025, packing: 0.025, overheads: 0.08, margin: 0.09 },
  geometry: { fillerFill: 0.6, bedThin: 0.8, bedMid: 1.0, bedThick: 1.2, braidCover: 0.85, braidWire: 0.2, braidWeave: 1.35, drain: 0.5, laySlack: 1.04 },
};
const Tn = (cfg, o) => ({ tag: '', family: 'control', n: 7, size: 1.5, elem: 'Pair', cond: 'Copper', insul: 'PVC', shield: 'None', armour: 'GI round wire', sheath: 'PVC ST1', volt: '650/1100 V', tc: 'K extension (KX)', ...cfg, ...o });
export function ciDefault() {
  const mk = (tag, o) => Tn({ tag }, o);
  return { list: [
    mk('C-01 Control 7C × 1.5, armoured PVC', { family: 'control', n: 7, size: 1.5 }),
    mk('C-02 Control 12C × 2.5, armoured PVC', { family: 'control', n: 12, size: 2.5 }),
    mk('C-03 Control 4C × 1.5, FRLS unarmoured', { family: 'control', n: 4, size: 1.5, insul: 'FRLS PVC', sheath: 'FRLS PVC', armour: 'None' }),
    mk('C-04 Control 19C × 1.5, LSZH armoured', { family: 'control', n: 19, size: 1.5, insul: 'LSZH', sheath: 'LSZH' }),
    mk('I-01 Instrumentation 4P × 1.0, overall screen, armoured', { family: 'instr', n: 4, size: 1, elem: 'Pair', insul: 'PVC', shield: 'Overall Al-Mylar', volt: '300/500 V' }),
    mk('I-02 Instrumentation 12P × 0.5, individual + overall screen', { family: 'instr', n: 12, size: 0.5, shield: 'Individual + overall Al-Mylar', volt: '300/500 V', armour: 'GI round wire' }),
    mk('I-03 Instrumentation 6T × 1.0, FRLS, unarmoured', { family: 'instr', n: 6, size: 1, elem: 'Triple', insul: 'FRLS PVC', sheath: 'FRLS PVC', shield: 'Individual + overall Al-Mylar', armour: 'None', volt: '300/500 V' }),
    mk('TC-01 K-type extension 4P × 1.5, screened, armoured', { family: 'tc', n: 4, size: 1.5, elem: 'Pair', tc: 'K extension (KX)', shield: 'Individual + overall Al-Mylar', volt: '300/500 V' }),
    mk('TC-02 J-type extension 1P × 1.0', { family: 'tc', n: 1, size: 1, tc: 'J extension (JX)', shield: 'Overall Al-Mylar', armour: 'None', volt: '300/500 V' }),
  ], sel: 0, unit: 'm', qty: 1000, view: 'cut', btab: 'anatomy', editPrices: false, T: JSON.parse(JSON.stringify(CI_DEFAULTS)) };
}
const kPack = (n) => [0, 1, 2, 2.155, 2.414, 2.701, 3, 3][n] ?? 1.16 * Math.sqrt(n);
export function ciLayout(n, dE) {   // element centres for the cross-section drawings
  const pts = []; if (n === 1) return [[0, 0]];
  if (n <= 6) { const r = (kPack(n) - 1) * dE / 2; for (let i = 0; i < n; i++) pts.push([r * Math.cos(2 * Math.PI * i / n + Math.PI / 2), r * Math.sin(2 * Math.PI * i / n + Math.PI / 2)]); return pts; }
  pts.push([0, 0]); let ring = 1; while (pts.length < n) { const m = 6 * ring; for (let i = 0; i < m && pts.length < n; i++) pts.push([ring * dE * Math.cos(2 * Math.PI * i / m), ring * dE * Math.sin(2 * Math.PI * i / m)]); ring++; }
  return pts;
}
export function computeCI(c, T) {
  const fam = c.family, rt = T.rates, cv = T.conv, sk = T.stack, g = T.geometry;
  if (!(c.n >= 1)) return { error: 'Enter a number of cores or pairs' };
  const ins = INSUL[c.insul], sh = SHEATH[c.sheath]; if (!ins || !sh) return { error: 'Unknown insulation or sheath' };
  const instr = fam !== 'control', perElem = instr ? (c.elem === 'Triple' ? 3 : 2) : 1, nCond = c.n * perElem;
  const A = c.size, d = COND_D[A] ?? 1.13 * Math.sqrt(A) * 1.1;
  const tIns = (fam === 'control' ? (A <= 2.5 ? 0.8 : 1.0) : (A <= 0.75 ? 0.4 : 0.5)) * ins.thk, dc = d + 2 * tIns;
  const indiv = /Individual/.test(c.shield) && instr, overAl = /Al-Mylar/.test(c.shield), braid = /Cu braid/.test(c.shield);
  const dElem0 = instr ? (perElem === 3 ? 2.155 : 2) * dc : dc, dElem = dElem0 + (indiv ? 0.3 : 0.1 * (instr ? 1 : 0));
  const Dlay = kPack(c.n) * dElem * g.laySlack, D1 = Dlay + 0.2 + (overAl ? 0.1 : 0) + (braid ? 0.4 : 0);
  const armoured = c.armour !== 'None', bed = !armoured ? 0 : D1 < 15 ? g.bedThin : D1 < 30 ? g.bedMid : g.bedThick, D2 = D1 + 2 * bed;
  const wireD = D2 < 10 ? 0.9 : D2 < 15 ? 1.25 : D2 < 25 ? 1.6 : D2 < 35 ? 2.0 : 2.5, strip = c.armour !== 'GI round wire', layers = c.armour === 'Double GI strip' ? 2 : 1;
  const armT = !armoured ? 0 : strip ? 0.8 * layers : wireD, D3 = D2 + 2 * armT;
  const tS = Math.max(armoured ? 1.24 : (instr ? 0.9 : 1.0), 0.035 * D3 + (armoured ? 1.0 : 0.7)), D4 = D3 + 2 * tS;
  const m = {}, cost = {};      // kg/km and ₹/km
  const alloy = fam === 'tc' ? TC_TYPES[c.tc] : null;
  const cuRate = rt.copper + (c.cond === 'Tinned copper' ? rt.tinPremium : 0), cuKgPerCond = A * rt.copperDensity * 1.03;
  const dens = (alloy && (alloy.rb || alloy.ra)) ? 8.9 : rt.copperDensity;
  if (alloy) { const half = nCond / 2; m.alloyA = half * A * dens * 1.03; m.alloyB = half * A * dens * 1.03; cost.alloyA = m.alloyA * (alloy.ra || cuRate); cost.alloyB = m.alloyB * (alloy.rb || cuRate); }
  else { m.cu = nCond * cuKgPerCond; cost.cu = m.cu * cuRate; }
  const insMass = nCond * Math.PI / 4 * (dc ** 2 - d ** 2) * ins.rho, insRate = rt[ins.price]; m.ins = insMass; cost.ins = insMass * insRate;
  const coreArea = nCond * Math.PI / 4 * dc ** 2, fillArea = Math.max(0, Math.PI / 4 * Dlay ** 2 - coreArea) * g.fillerFill; m.filler = fillArea * 1.45; cost.filler = m.filler * rt.filler;
  let screenM2 = 0, drainKg = 0, braidKg = 0;
  if (indiv) { screenM2 += Math.PI * dElem0 * 1.25 * c.n; drainKg += c.n * g.drain * rt.copperDensity * 1.03; }
  if (overAl) { screenM2 += Math.PI * Dlay * 1.25; drainKg += g.drain * rt.copperDensity * 1.03; }
  if (braid) braidKg = g.braidCover * Math.PI * (Dlay + 0.3) * g.braidWire * g.braidWeave * rt.copperDensity;
  m.screen = screenM2 * 0.04; cost.screen = screenM2 * rt.alMylarPerM2; m.drain = drainKg; cost.drain = drainKg * (rt.copper + rt.tinPremium); m.braid = braidKg; cost.braid = braidKg * (rt.copper + rt.tinPremium);
  m.bed = armoured ? Math.PI / 4 * (D2 ** 2 - D1 ** 2) * 1.45 : 0; cost.bed = m.bed * rt.pvc * 0.95;
  let armArea = 0; if (armoured) { if (!strip) { const N = Math.floor(Math.PI * (D2 + wireD) / wireD * 0.92); armArea = N * Math.PI / 4 * wireD ** 2 * 1.04; } else { const N = Math.floor(Math.PI * (D2 + 0.8) / 4 / 1.0) * layers; armArea = N * 4 * 0.8 * 1.05; } }
  m.armour = armArea * 7.85; cost.armour = m.armour * (rt.steel_wire + (strip ? rt.stripPremium : 0));
  m.sheath = Math.PI / 4 * (D4 ** 2 - D3 ** 2) * sh.rho; cost.sheath = m.sheath * rt[sh.price];
  const matCost = Object.values(cost).reduce((s, v) => s + v, 0);
  // conversion, per km
  const conv = {}, fine = A <= 0.75 || instr;
  conv.Stranding = (m.cu ?? (m.alloyA + m.alloyB)) * (alloy ? cv.tcDraw : cv.stranding);
  conv.Insulation = m.ins * (fine ? cv.extrusionFine : cv.extrusion);
  conv['Pairing / twisting'] = instr ? c.n * 1000 * cv.pairing * (perElem === 3 ? 1.35 : 1) : 0;
  conv['Lay-up'] = 1000 * (cv.layup + cv.layupPerElem * c.n);
  conv.Screening = (indiv ? 1000 * c.n * cv.screenIndividual / 4 : 0) + (overAl ? 1000 * cv.screenOverall : 0) + (braid ? 1000 * cv.braid : 0);
  conv.Bedding = m.bed * cv.bedding; conv.Armouring = m.armour * (strip ? cv.armourStrip : cv.armourWire); conv.Sheathing = m.sheath * cv.sheathing; conv['Drum test'] = 1000 * cv.test;
  const convTotal = Object.values(conv).reduce((s, v) => s + v, 0), scrap = (matCost + convTotal) * sk.scrap, pack = (matCost + convTotal) * sk.packing;
  const direct = matCost + convTotal + scrap + pack, oh = direct * sk.overheads, mg = (direct + oh) * sk.margin, total = direct + oh + mg, kg = Object.values(m).reduce((s, v) => s + v, 0);
  const lines = [];
  const L = (group, label, kgkm, ratePerKg, amt) => lines.push({ group, label, qty: R2(kgkm, 1), unit: 'kg/km', rate: ratePerKg, amount: amt });
  if (alloy) { L('Metal', `${alloy.a} conductors`, m.alloyA, cost.alloyA / m.alloyA, cost.alloyA); L('Metal', `${alloy.b} conductors`, m.alloyB, cost.alloyB / m.alloyB, cost.alloyB); } else L('Metal', c.cond === 'Tinned copper' ? 'Tinned copper conductors' : 'Copper conductors', m.cu, cuRate, cost.cu);
  L('Insulation & sheath', `Core insulation, ${c.insul}`, m.ins, insRate, cost.ins); if (m.filler > 0) L('Insulation & sheath', 'Fillers and binder tape', m.filler, rt.filler, cost.filler); if (m.bed > 0) L('Insulation & sheath', 'Bedding (inner sheath)', m.bed, rt.pvc * 0.95, cost.bed); L('Insulation & sheath', `Outer sheath, ${c.sheath}`, m.sheath, rt[sh.price], cost.sheath);
  if (screenM2 > 0) lines.push({ group: 'Screen & armour', label: 'Al-Mylar screen tape', qty: R2(screenM2, 0), unit: 'm²/km', rate: rt.alMylarPerM2, amount: cost.screen });
  if (drainKg > 0) L('Screen & armour', 'Tinned copper drain wires', m.drain, rt.copper + rt.tinPremium, cost.drain); if (braidKg > 0) L('Screen & armour', 'Tinned copper braid', m.braid, rt.copper + rt.tinPremium, cost.braid); if (armoured) L('Screen & armour', c.armour === 'GI round wire' ? `Galvanised steel wire armour, ${wireD} mm` : `Galvanised steel strip armour, ${layers} layer${layers > 1 ? 's' : ''}`, m.armour, rt.steel_wire + (strip ? rt.stripPremium : 0), cost.armour);
  Object.entries(conv).forEach(([k, v]) => { if (v > 0) lines.push({ group: 'Conversion', label: k, qty: 1, unit: 'km', rate: v, amount: v }); });
  lines.push({ group: 'Conversion', label: 'Scrap and packing (drum)', qty: 1, unit: 'km', rate: scrap + pack, amount: scrap + pack });
  const groups = {}; lines.forEach((l) => { groups[l.group] = (groups[l.group] || 0) + l.amount; }); groups.Overheads = oh; groups.Margin = mg;
  const warn = []; if (fam === 'control' && c.n > 61) warn.push('Above 61 cores is rarely supplied as one cable.'); if (instr && c.n > 48) warn.push('Above 48 pairs is rarely supplied as one cable.'); if (D4 > 55) warn.push(`Overall diameter ${R2(D4, 1)} mm: check drum length and gland size.`);
  const nm = fam === 'control' ? `${c.n}C × ${A} mm²` : `${c.n}${c.elem === 'Triple' ? 'T' : 'P'} × ${A} mm²`;
  return { cfg: c, name: nm, nCond, perElem, d, dc, tIns, dElem, Dlay, D1, D2, D3, D4, tS, bed, wireD, armT, armoured, strip, layers, indiv, overAl, braid, alloy, kgKm: kg, m, cost, conv, matCost, convTotal, lines, groups, direct, total: total / 1000, totalKm: total, perKg: total / kg, warn };
}
