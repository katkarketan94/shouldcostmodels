// Maps a structure takeoff onto the workbook's Input sheet, runs the workbook's own formulas and reads the Output sheet.
import { Workbook } from './engine.js';
import WORKBOOK from './workbook.json' with { type: 'json' };

export const WASTAGE = { builtup: 0.065, hotroll: 0.035, hollow: 0.035, plate: 0.09 };  // mid-points of the ranges noted on the Input sheet
export const HOLLOW_EFFORT = 1.5;                                                         // hollow sections take 1.5x hot-roll effort (Input sheet note)

export const PAINTS = {
  primer: [['wb', 'Workbook rate (135 ₹/L)', 135], ['Red Oxide Metal Primer', 'Red oxide metal primer', 135], ['Red Oxide Zinc Chromate Primer', 'Red oxide zinc chromate primer', 175], ['Epoxy Zinc Phosphate Primer (Jagdamba)', 'Epoxy zinc phosphate primer', 180],
    ['Apcodur HB ZP Primer (Asian Paints)', 'Apcodur HB ZP primer', 220], ['Epoxy ZP Grey Primer (Plasma Paints)', 'Epoxy ZP grey primer', 265]],
  mid: [['wb', 'Workbook rate (215 ₹/L)', 215], ['Neropoxy HB MIO Primer Grey (Berger)', 'Neropoxy HB MIO grey', 215], ['Epoxy Grey Primer HB (Plasma Paints)', 'Epoxy grey primer HB', 295]],
  final: [['wb', 'Workbook rate (350 ₹/L)', 350], ['PU Finish Paint (Alfa Paints)', 'PU finish paint', 279], ['Nerothane PU Enamel (Berger)', 'Nerothane PU enamel', 330]],
};

export const PROJECT_DEFAULTS = {
  steelPrice: 64785, e350Premium: 0, wasteRecovery: 0.025, distance: 500, erection: 26000, contingency: 1000,
  margin: 0.05, adminPct: 0.02, mgmtPct: 0.02, boltPrice: 180, boltPct: null,       // boltPct null = template default
  shop: 'existing', primer: 'wb', mid: 'wb', final: 'wb', dft: [30, 50, 50], coats: [1, 1, 1],
};

const IN = 'Input', CS = 'Calculation Sheet', OUT = 'Output';

let engine;
export const getEngine = () => (engine ||= new Workbook(WORKBOOK));
export const resetEngine = () => { engine = new Workbook(WORKBOOK); return engine; };

/** low-level run: `x` is the list of workbook inputs (see costFromTakeoff) and `extra` any user overrides {"Sheet!A1": value} */
export function runWorkbook(x, extra = {}) {
  const wb = getEngine(); wb.clearOverrides();
  const set = (sheet, addr, v) => wb.setOverride(sheet, addr, v);
  const tot = x.payable * (1 + x.wastage);
  set(IN, 'D6', x.payable); set(IN, 'D7', x.wastage); set(IN, 'D10', x.wasteRecovery);
  set(IN, 'D15', tot * x.grade.E250); set(IN, 'D16', tot * x.grade.E350); set(IN, 'D17', 0);
  set(IN, 'E15', x.priceE250); set(IN, 'E16', x.priceE350);
  set(IN, 'E24', tot * x.fab.built); set(IN, 'E25', tot * x.fab.plate); set(IN, 'E26', tot * x.fab.hot);
  set(IN, 'C24', x.fab.built > 0 ? 'Yes' : 'No'); set(IN, 'C25', x.fab.plate > 0 ? 'Yes' : 'No'); set(IN, 'C26', x.fab.hot > 0 ? 'Yes' : 'No');
  set(IN, 'D51', x.weld.low); set(IN, 'D52', x.weld.mod); set(IN, 'D53', x.weld.heavy);
  set(IN, 'D63', 1); set(IN, 'D64', 0); set(CS, 'E261', x.paintArea);
  [0, 1, 2].forEach((i) => { set(IN, `E${69 + i}`, x.coats[i]); set(IN, `F${69 + i}`, x.dft[i]); });
  set(CS, 'F273', x.paintRates[0]); set(CS, 'F274', x.paintRates[1]); set(CS, 'F275', x.paintRates[2]);
  set(IN, 'D79', x.adminPct); set(IN, 'D80', x.mgmtPct);
  set(IN, 'D87', x.lightMT); set(IN, 'D88', x.heavyMT); set(IN, 'D90', x.distance);
  set(IN, 'D94', x.margin); set(IN, 'D99', x.boltPct); set(IN, 'D100', x.boltPrice); set(IN, 'D104', x.erection);
  set(OUT, 'D33', x.contingency);
  if (x.shop === 'existing') for (let r = 342; r <= 349; r++) set(CS, `D${r}`, 'No');
  const driven = Object.keys(wb.over);
  for (const [k, v] of Object.entries(extra)) { const [sh, a] = k.split('!'); set(sh, a, v); }
  const g = (a) => wb.get(OUT, a) ?? 0, c = (a) => wb.get(CS, a);
  const r = {
    payable: x.payable, requirement: tot,
    raw: g('C14'), machinery: g('C15'), salaries: g('C16'), overheads: g('C17'), utilities: g('C18'), consumables: g('C19'),
    weldCons: g('C20'), paintCons: g('C21'), otherCons: g('C22'), civil: g('C23'), civilAmort: g('C24'), setup: g('C25'), bolting: g('C26'),
    stage1: g('C13'), transport: g('C28'), erection: g('C32'), contingency: g('C33'), cost: g('C35'), fabrication: g('C37'), selling: g('C40'), profit: g('C43'),
    paintingCost: g('C47'),
    months: { built: c('H29'), plate: c('H30'), hot: c('H31'), paint: c('H32') },
    truckRate: c('D306'), vendorFactor: c('D38'),
  };
  r.driven = driven;
  r.margin = r.selling - r.cost; r.perMT = r.selling / x.payable; r.costPerMT = r.cost / x.payable;
  return r;
}

/** Build workbook inputs from a takeoff (groups already carry their final kg) and project settings */
export function costFromTakeoff(tk, project, extra = {}) {
  const gs = tk.groups.filter((g) => g.kg > 0);
  const net = gs.reduce((a, g) => a + g.kg, 0);
  if (net <= 0) return null;
  const gross = gs.reduce((a, g) => a + g.kg * (1 + WASTAGE[g.type]), 0);
  const wastage = gross / net - 1;
  const share = (f) => gs.reduce((a, g) => a + (f(g) ? g.kg * (1 + WASTAGE[g.type]) : 0), 0) / gross;
  const wshare = (w) => gs.filter((g) => g.weld === w).reduce((a, g) => a + g.kg, 0) / net;
  const hotEq = gs.reduce((a, g) => a + (g.type === 'hotroll' ? g.kg * (1 + WASTAGE.hotroll) : g.type === 'hollow' ? g.kg * (1 + WASTAGE.hollow) * HOLLOW_EFFORT : 0), 0) / gross;
  const area = gs.reduce((a, g) => a + (g.area || 0) * (g.kg / Math.max(g.kgModel ?? g.kg, 1e-9)), 0);
  const pick = (kind, id) => PAINTS[kind].find((p) => p[0] === id)?.[2] ?? PAINTS[kind][0][2];
  const x = {
    payable: net / 1000, wastage, wasteRecovery: project.wasteRecovery,
    grade: { E250: share((g) => g.grade === 'E250'), E350: share((g) => g.grade === 'E350') },
    priceE250: project.steelPrice, priceE350: project.steelPrice + project.e350Premium,
    fab: { built: share((g) => g.type === 'builtup'), plate: share((g) => g.type === 'plate'), hot: hotEq },
    weld: { low: wshare('low'), mod: wshare('mod'), heavy: wshare('heavy') },
    paintArea: area / (net / 1000), dft: project.dft, coats: project.coats,
    paintRates: [pick('primer', project.primer), pick('mid', project.mid), pick('final', project.final)],
    adminPct: project.adminPct, mgmtPct: project.mgmtPct,
    lightMT: gs.filter((g) => g.cls === 'light').reduce((a, g) => a + g.kg, 0) / 1000, heavyMT: gs.filter((g) => g.cls !== 'light').reduce((a, g) => a + g.kg, 0) / 1000,
    distance: project.distance, margin: project.margin, boltPct: project.boltPct ?? tk.bolts, boltPrice: project.boltPrice, erection: project.erection, contingency: project.contingency, shop: project.shop,
  };
  const r = runWorkbook(x, extra); r.inputs = x; r.netKg = net; r.grossKg = gross; return r;
}
