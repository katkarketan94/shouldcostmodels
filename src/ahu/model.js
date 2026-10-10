// AHU & FCU: runs the workbook's own formulas (AHU / FCU Batch Calculator + Assumptions & Ref) for any set of inputs.
import { Workbook } from '../structural/engine.js';
import WORKBOOK from './workbook.json' with { type: 'json' };

export const AS = 'Assumptions & Ref';
export const SHEET = { ahu: 'AHU Batch Calculator', fcu: 'FCU Batch Calculator' };
export const FIRST_ROW = 9, MAX_ROWS = { ahu: 20, fcu: 25 };
export const MATERIALS = ['Copper tube', 'Aluminium fin', 'GI sheet', 'Pre-coated GI', 'SS 304', 'PUF', 'Rockwool'];
const MCOL = Object.fromEntries(MATERIALS.map((m, i) => [m, 'CDEFGHI'[i]]));

// input fields -> workbook columns (rows start at 9)
export const IN = {
  ahu: { tag: 'B', cfm: 'C', tr: 'E', kw: 'F', esp: 'G', casing: 'H', panel: 'I', mat: 'J', ins: 'K', insThk: 'L', fan: 'M', vfd: 'N', rows: 'O', fpi: 'P', tube: 'Q', fin: 'R', filter: 'S', mount: 'T', air: 'U', mix: 'V', heat: 'W', hum: 'X' },
  fcu: { tag: 'B', cfm: 'C', tr: 'D', type: 'E', rows: 'F', esp: 'G', mat: 'H', panel: 'I', ins: 'J', insThk: 'K', fpi: 'L', fin: 'M' },
};
export const OUT = {
  ahu: { total: 'Y', perCfm: 'Z', perTr: 'AA', weight: 'AB', cuKg: 'AC', alKg: 'AD', sheetKg: 'AE', insKg: 'AF', motor: 'AG', size: 'AH', cmh: 'AJ', ms: 'AK', face: 'AL', cross: 'AM', W: 'AN', H: 'AO', filterL: 'AP', L: 'AQ', surface: 'AR', sheetPx: 'AU', insPx: 'AX', frameKg: 'BB', frameRs: 'BC', Hf: 'BD', Lf: 'BE', tubesRow: 'BF', tubesTot: 'BG', tubeLen: 'BH', nFins: 'BK', depth: 'BL', isp: 'BO', tsp: 'BP', fanKw: 'BQ', fanRs: 'BS', vfdRs: 'BT', filterM2: 'BU', filterRs: 'BV', damperM2: 'BW', damperRs: 'BX', panKg: 'BY', panRs: 'BZ', A: 'CA', B: 'CB', C: 'CC', D: 'CD', E: 'CE', labour: 'CI', ohm: 'CJ' },
  fcu: { total: 'N', perCfm: 'O', perTr: 'P', weight: 'Q', cuKg: 'R', alKg: 'S', sheetKg: 'T', insKg: 'U', blowerW: 'V', cmh: 'X', ms: 'Y', face: 'Z', cross: 'AA', W: 'AB', H: 'AC', L: 'AD', surface: 'AE', sheetPx: 'AG', insPx: 'AJ', Hf: 'AM', Lf: 'AN', tubesRow: 'AO', tubesTot: 'AP', tubeLen: 'AQ', nFins: 'AT', depth: 'AU', isp: 'AX', tsp: 'AY', blowerRs: 'BA', panKg: 'BB', panRs: 'BC', A: 'BD', B: 'BE', C: 'BF', D: 'BG', E: 'BH', labour: 'BL', ohm: 'BM' },
};

export const OPTIONS = {
  ahu: { casing: ['Single skin', 'Double skin'], mat: ['GI sheet', 'Pre-coated GI', 'SS 304'], ins: ['PUF', 'Rockwool'], fan: ['Plug fan', 'Belt-driven'], vfd: ['Y', 'N'], tube: ['Copper tube'], fin: ['Aluminium fin', 'Copper tube'], filter: ['Pre only', 'Pre+Fine', 'Pre+Fine+HEPA'], mount: ['Floor mounted', 'Ceiling suspended', 'Rooftop'], air: ['Return air', 'Mixed (return+fresh)', '100% fresh air'], mix: ['Y', 'N'], heat: ['Y', 'N'], hum: ['Y', 'N'] },
  fcu: { type: ['Ceiling concealed', 'Cassette', 'Ducted', 'Floor standing'], mat: ['GI sheet', 'Pre-coated GI', 'SS 304'], ins: ['PUF', 'Rockwool'], fin: ['Aluminium fin', 'Copper tube'] },
};

/** the workbook's seeded cases, read from its input cells */
export function seedRows(kind) {
  const sh = WORKBOOK[SHEET[kind]], rows = [];
  for (let r = FIRST_ROW; r < FIRST_ROW + MAX_ROWS[kind]; r++) {
    if (sh[`C${r}`]?.v === undefined) break;
    const o = {}; for (const [k, col] of Object.entries(IN[kind])) o[k] = sh[col + r]?.v ?? null;
    rows.push(o);
  }
  return rows;
}
export const wbValue = (addr, sheet = AS) => WORKBOOK[sheet]?.[addr]?.v;
export const masterDefaults = (kind) => ({ price: Object.fromEntries(MATERIALS.map((m) => [m, wbValue(MCOL[m] + '6', SHEET[kind])])), density: Object.fromEntries(MATERIALS.map((m) => [m, wbValue(MCOL[m] + '5', SHEET[kind])])) });

/** assumption cells exposed on the Master Data tab: [section, label, addr(AHU / single), addr(FCU or null), unit, note] */
export function assumptionRows() {
  const A = WORKBOOK[AS], out = []; let section = '';
  for (let r = 4; r <= 98; r++) {
    const b = A[`B${r}`]?.v, c = A[`C${r}`]?.v;
    if (typeof b === 'string' && /^\d+\./.test(b)) { section = b.replace(/^\d+\.\s*/, ''); continue; }
    if (typeof b === 'string' && typeof c === 'number') out.push({ section, label: b, addr: `C${r}`, unit: typeof A[`D${r}`]?.v === 'string' ? A[`D${r}`].v : '', note: A[`H${r}`]?.v ?? '', value: c, r });
    else if (typeof b === 'string' && typeof c === 'string' && typeof A[`D${r}`]?.v === 'string' && section.startsWith('FCU CASING')) out.push({ section, label: b, addr: `C${r}`, unit: '', note: '', value: c, r, text: true });
  }
  return out;
}
export const motorSizes = () => { const A = WORKBOOK[AS], o = []; for (let r = 44; r <= 61; r++) o.push(A[`B${r}`].v); return o; };

let wb; const engine = () => (wb ||= new Workbook(WORKBOOK));

/**
 * rows: [{...inputs}] (row 0 is evaluated on workbook row 9, and so on); T: { ahu:{price,density}, fcu:{price,density}, ass:{ 'C6': value } } overrides
 * returns an array of result objects (null for an empty/invalid row)
 */
export function runBatch(kind, rows, T = {}) {
  const w = engine(); w.clearOverrides();
  const sheet = SHEET[kind];
  for (const [addr, v] of Object.entries(T.ass || {})) w.over[`${AS}!${addr}`] = v;
  for (const [i, v] of Object.entries(T.motors || {})) w.over[`${AS}!B${44 + +i}`] = v;
  const m = T[kind] || {};
  for (const mat of MATERIALS) {
    if (m.price?.[mat] != null) w.over[`${sheet}!${MCOL[mat]}6`] = m.price[mat];
    if (m.density?.[mat] != null) w.over[`${sheet}!${MCOL[mat]}5`] = m.density[mat];
  }
  rows.forEach((row, i) => { const r = FIRST_ROW + i; for (const [k, col] of Object.entries(IN[kind])) w.over[`${sheet}!${col}${r}`] = row[k] === undefined || row[k] === '' ? null : row[k]; });
  w.memo.clear();
  return rows.map((row, i) => {
    const r = FIRST_ROW + i, o = { r };
    try {
      for (const [k, col] of Object.entries(OUT[kind])) o[k] = w.cell(sheet, col + r);
      return o;
    } catch (e) { return { r, error: e.code || e.message }; }
  });
}
export const readCell = (kind, addr, i) => engine().get(SHEET[kind], addr + (FIRST_ROW + i));
