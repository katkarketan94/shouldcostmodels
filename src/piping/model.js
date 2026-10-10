// Metal pipes: runs the workbook's own 'Cost Model' sheet formulas (plus Assumptions, Assumption backup and Pipe schedule) for any set of inputs.
// Every pipe is evaluated on the 'Cost Model_600' sheet: the workbook's Assumptions!D29 (grade premium) reads that sheet's material cells.
import { Workbook } from '../structural/engine.js';
import WORKBOOK from './workbook.json' with { type: 'json' };

export const SHEET = 'Cost Model_600', AS = 'Assumptions';
export const IN = { moc: 'E15', grade: 'E16', type: 'E20', end: 'E21', di: 'E22', galv: 'E23', paint: 'E24', coat: 'E25', coatSurf: 'E26', cement: 'E27', ibr: 'E30', nace: 'E31', h2: 'E32', doc: 'E33', docType: 'E34',
  nps: 'E55', std: 'E56', od: 'E57', wt: 'E58', sch: 'E59', len: 'E60', months: 'E67', rate: 'E68', dist: 'E72', truckT: 'E73', load: 'E74', destr: 'E125', ndt: 'E126' };
const OUT = { density: 'E17', od: 'E61', wall: 'E62', id: 'E63', rmType: 'E81', wtM: 'E82', loss: 'E83', rmKgM: 'E84', rmPx: 'E86', gradePx: 'E87', rmTotalPx: 'E88', scrapPct: 'E90', scrapPx: 'E91',
  opexHi: 'E100', opexLo: 'F100', areaIn: 'E103', areaOut: 'E104', paintReq: 'E106', paintCost: 'E107', coatReq: 'E108', coatCost: 'E109', galvCost: 'E110', zinc: 'E113', cementCost: 'E114', docKg: 'E124', endKg: 'E129', endPct: 'E130', tolMm: 'E135', tolPct: 'E136',
  transHi: 'E139', transLo: 'F139', rm: 'E142', opexHiM: 'E143', opexLoM: 'F143', scrap: 'E144', coating: 'E145', galvM: 'E146', testing: 'E147', endM: 'E148', margin: 'E149', interest: 'E150', hi: 'E152', lo: 'F152', kgHi: 'E153', kgLo: 'F153' };
const AO = ['E94', 'E95', 'E96', 'E97', 'E98', 'E99'];

export const OPTIONS = {
  type: ['Welded', 'Seamless'], end: ['Plain end', 'Bevelled end', 'Threaded end'], di: ['Socket & spiget ends', 'Double flange type'], paint: ['NA', 'Basic', 'Zinc Primer'],
  coat: ['NA', '3 LPE', 'Epoxy Coating - 1000 Micron', 'Food grade epoxy coating - 500 Micron'], coatSurf: ['No coating', 'Inner coating only', 'Outer coating only', 'Inner+Outer coating'], docType: [3.1, 3.2],
};
// materials the workbook can price end to end (alloy steel and nickel have no raw-material price or margin row in the workbook)
export const MOC = {
  'Mild steel': { label: 'Mild steel', grades: ['Mild steel'] },
  'Carbon Steel': { label: 'Carbon steel', grades: ['A106 Grade A', 'A106 Grade B', 'A106 Grade C', 'ASTM A335 GRADE P11', 'ASTM A672 GRADE C65 CLASS 22', 'ASTM A672 GRADE C65 CLASS 12', 'API 5L GRADE B-PSL1'] },
  'Stainless steel': { label: 'Stainless steel', grades: ['ASTM A312 GRADE TP304', 'ASTM A312 GRADE TP304L', 'ASTM A312 GRADE TP410', 'ASTM A358 TP304L', 'A358 Gr TP316L', 'ASTM A312 GRADE TP316/316L'] },
  'Ductile Iron': { label: 'Ductile iron', grades: ['Ductile Iron'] },
  'Inconel 625': { label: 'Inconel 625', grades: ['ASTM B444 UNS N06625'] },
  'Inconel 825': { label: 'Inconel 825', grades: ['ASTM B423 UNS N08825'] },
};

let wb; const eng = () => { if (!wb) { wb = new Workbook(WORKBOOK); wb.names = { USDtoINR: { sheet: AS, addr: 'D6' } }; } return wb; };
const val = (sheet, a) => eng().get(sheet, a);
const base = (sheet, a) => WORKBOOK[sheet]?.[a]?.v;

/** the workbook's procurement register (Summary sheet): 8 non-standard pipes with FY25-26 quantities in running metres */
export function seedPipes() {
  const sums = WORKBOOK.Summary, out = [];
  for (let r = 4; r <= 11; r++) {
    const dia = sums[`C${r}`].v, sheet = `Cost Model_${dia}`, S = WORKBOOK[sheet];
    const o = {}; for (const [k, a] of Object.entries(IN)) o[k] = S[a]?.v ?? null;
    Object.assign(o, { std: 'Non-standard', od: dia, wt: sums[`D${r}`].v, qty: sums[`E${r}`].v, tag: `MS ${dia} mm × ${sums[`D${r}`].v} mm` });
    if (dia === 1800) Object.assign(o, { end: 'Bevelled end', coat: 'Food grade epoxy coating - 500 Micron', coatSurf: 'Inner coating only', docType: 3.1 });
    o.len = 1; out.push(o);
  }
  return out;
}
export const defaultPipe = () => ({ ...seedPipes()[3], tag: 'MS 12 inch', std: 'Standard', nps: 12, sch: 'SCH 40', od: 600, wt: 5, qty: 1000, coat: 'NA', coatSurf: 'No coating', end: 'Plain end', docType: 3.2 });

/** standard sizes from the workbook's Pipe schedule: NPS (inch) list, DN list, and the schedules that exist for a size */
export function npsList() { const o = []; for (let r = 52; r <= 87; r++) { const v = val('Pipe schedule', `A${r}`); if (typeof v === 'number') o.push(v); } return o; }
export function dnList() { const o = []; for (let r = 99; r <= 115; r++) { const v = val('Pipe schedule', `A${r}`); if (v !== null && v !== '') o.push(+v); } return o; }
const COLS = 'CDEFGHIJKLMNOPQRS';
export function schedulesFor(nps) {
  for (let r = 52; r <= 87; r++) if (val('Pipe schedule', `A${r}`) === nps) {
    const o = []; for (const c of COLS) { const w = val('Pipe schedule', `${c}${r}`), h = val('Pipe schedule', `${c}51`); if (typeof w === 'number' && w > 0) o.push([h, w]); } return o;
  }
  return [];
}
export const dnClasses = (dn) => { for (let r = 99; r <= 115; r++) if (+val('Pipe schedule', `A${r}`) === dn) { const o = []; for (const [c, h] of [['E', 'C class'], ['F', 'K10'], ['G', 'K9'], ['H', 'K7']]) { const w = val('Pipe schedule', `${c}${r}`); if (typeof w === 'number' && w > 0) o.push([h, w]); } return o; } return []; };
export const npsLabel = (n) => { const w = Math.floor(n + 1e-9), f = n - w, fr = { 0.125: '1/8', 0.25: '1/4', 0.375: '3/8', 0.5: '1/2', 0.75: '3/4' }[Math.round(f * 1000) / 1000]; return f < 1e-6 ? String(w) : `${w ? w + ' ' : ''}${fr}`; };

export const assumptionValue = (a) => val(AS, a);
/** run one pipe; T = { ass: { 'D55': value } } overrides workbook assumption cells */
export function runPipe(p, T = {}) {
  const w = eng(); w.clearOverrides();
  for (const [a, v] of Object.entries(T.ass || {})) w.over[`${AS}!${a}`] = v;
  for (const [k, a] of Object.entries(IN)) { const v = p[k]; w.over[`${SHEET}!${a}`] = v === undefined || v === '' ? null : v; }
  w.memo.clear();
  try {
    const r = {}; for (const [k, a] of Object.entries(OUT)) r[k] = w.cell(SHEET, a);
    if (typeof r.hi !== 'number' || typeof r.wtM !== 'number') return { error: !(typeof r.wall === 'number') ? 'No wall thickness for this size and schedule. Pick another schedule or use a non-standard size.' : 'The workbook returned no price for this combination' };
    r.opexParts = AO.map((a) => w.get(SHEET, a)); r.opexLabels = AO.map((_, i) => w.get(SHEET, `C${94 + i}`));
    return r;
  } catch (e) { return { error: e.code ? `The workbook returned ${e.code} for this combination` : String(e.message) }; }
}
export const raw = { ass: (a) => base(AS, a) };
