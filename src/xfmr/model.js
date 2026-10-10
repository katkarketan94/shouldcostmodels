// Transformers: run the workbooks' own Calculator -> Calculations -> Outputs -> IEEMA formulas for up to five configurations side by side.
// Three workbooks share one layout: power (oil), distribution (oil), dry-type (cast resin).
import { Workbook } from '../structural/engine.js';
import POWER from './power.json' with { type: 'json' };
import DIST from './dist.json' with { type: 'json' };
import DRY from './dry.json' with { type: 'json' };

export const TYPES = { power: { label: 'Power transformer', sub: 'Oil-immersed, above 2.5 MVA or 33 kV', data: POWER }, dist: { label: 'Distribution transformer', sub: 'Oil-immersed, up to 2.5 MVA', data: DIST }, dry: { label: 'Dry-type', sub: 'Cast resin', data: DRY } };
export const COLS = ['D', 'E', 'F', 'G', 'H'];
const CALC = 'Calculator', CAL = 'Calculations', OUT = 'Outputs', IEEMA = 'IEEMA', REF = 'Assumptions & Ref';

const cache = {};
function ctx(type) {
  if (cache[type]) return cache[type];
  const data = TYPES[type].data, sheets = Object.fromEntries(Object.entries(data).filter(([k]) => k !== '_dv'));
  const wb = new Workbook(sheets), v = (sh, a) => sheets[sh]?.[a]?.v, col = (sh, c) => { const o = []; for (let r = 1; r <= 260; r++) { const x = sheets[sh]?.[`${c}${r}`]; if (x !== undefined) o.push([r, x.v ?? x.c]); } return o; };
  // layout by label, since the three workbooks differ in row numbers
  const rows = (sh) => col(sh, 'B').filter(([, t]) => typeof t === 'string');
  const calc = rows(CALC), secB = calc.find(([, t]) => /^SECTION B/.test(t))[0], secC = calc.find(([, t]) => /^SECTION C/.test(t))[0], secA = calc.find(([, t]) => /^SECTION A/.test(t))[0];
  const lists = (() => { const r6 = rows(REF).find(([, t]) => /^R\.6/.test(t))[0], o = {}; for (const c of 'BCDEFGHIJ') { const h = v(REF, `${c}${r6 + 1}`); if (!h) continue; o[h] = []; for (let r = r6 + 2; r < r6 + 12; r++) { const x = v(REF, `${c}${r}`); if (x !== undefined && x !== null) o[h].push(x); } } return o; })();
  const listFor = (label) => /^Phases/.test(label) ? lists.phases : /connection/.test(label) ? lists.conn : /^Tap changer/.test(label) ? lists.tap : /^Cooling/.test(label) ? lists.cool : /^Conductor/.test(label) ? lists.cond : /^Loss (level|basis)/.test(label) ? lists.loss : /^Calibration/.test(label) ? lists.calib : /^Online|monitoring/.test(label) ? lists.yesno : /^Enclosure/.test(label) ? lists.encl : null;
  const field = (r) => { const label = v(CALC, `B${r}`), unit = v(CALC, `C${r}`) ?? '', list = listFor(label); return { row: r, label, unit, note: v(CALC, `I${r}`) ?? '', list, kind: list ? 'list' : /^(Description|Reference price source)/.test(label) ? 'text' : 'num' }; };
  const fieldsA = calc.filter(([r]) => r > secA + 1 && r < secB && !/^Parameter$/.test(calc.find(([q]) => q === r)[1])).map(([r]) => field(r));
  const pricesB = calc.filter(([r]) => r > secB + 1 && r < secC).map(([r, t]) => ({ row: r, label: t, unit: v(CALC, `C${r}`), note: v(CALC, `I${r}`) ?? '', value: v(CALC, `D${r}`) })).filter((x) => typeof x.value === 'number');
  const constsC = calc.filter(([r]) => r > secC + 1).map(([r, t]) => ({ row: r, label: t, unit: v(CALC, `C${r}`) ?? '', note: v(CALC, `I${r}`) ?? '', value: v(CALC, `D${r}`) })).filter((x) => typeof x.value === 'number');
  const ratingRow = fieldsA.find((f) => /^Rating/.test(f.label)).row;
  const cl = rows(CAL), find = (re, from = 0) => { const x = cl.find(([r, t]) => r > from && re.test(t)); return x ? x[0] : null; };
  const geom = find(/^3\.\s+WINDING/), tankSec = find(/^4\.\s+/), costSec = find(/^5\.\s+COST/), calSec = find(/^6\.\s+CALIB/);
  const R = {
    solver: find(/^Solver status/), impTarget: find(/^Impedance used/), impFinal: find(/^Impedance — final/, geom), nllUsed: find(/^No-load loss used/), nllCalc: find(/^No-load loss — computed/, geom), fllUsed: find(/^Load loss used/), fllCalc: find(/^Load loss — computed/, geom), suggestedBm: find(/^Suggested Bm/, geom),
    vpt: find(/^Volts per turn/, geom), hvTurns: find(/^HV turns/, geom), lvTurns: find(/^LV turns/, geom), coreD: find(/^Core circle diameter d/, geom), coilH: find(/^Coil height/, geom), J: find(/^Current density/, geom), lvRad: find(/^LV radial build/, geom), hvRad: find(/^HV radial build/, geom),
    lvIn: find(/^LV inner diameter/, geom), hvIn: find(/^HV inner diameter/, geom), hvOut: find(/^HV outer diameter/, geom), windowH: find(/^Window height/, geom), limbC: find(/^Limb centre distance/, geom), yokeL: find(/^Yoke length/, geom),
    coreKg: find(/^CORE WEIGHT/), condKg: find(/^CONDUCTOR WEIGHT/), insKg: find(/^(INSULATION WEIGHT|LV INTERLAYER)/), clampKg: find(/^Core clamping/), resinKg: find(/^CAST RESIN WEIGHT/), enclKg: find(/^ENCLOSURE WEIGHT/), oilKg: find(/^OIL WEIGHT/), steelKg: find(/^STEEL WEIGHT/), totalKg: find(/^Total weight/),
    boxL: find(/^(Tank|Enclosure) length/, tankSec), boxW: find(/^(Tank|Enclosure) width/, tankSec), boxH: find(/^(Tank|Enclosure) height/, tankSec), oilL: find(/^Oil volume used/), radN: find(/^Number of radiators/), radA: find(/^Radiator \/ corrugation panel area/), coolKw: find(/^Forced-cooling duty|AF fan kit/),
    A: find(/^A\.\s+RAW/), B: find(/^B\.\s+BOUGHT/), C: find(/^C\.\s+Design/), D: find(/^D\.\s+Labour/), D2: find(/^D2\./), E: find(/^E\.\s+Overheads/), F: find(/^F\.\s+Profit/), eng: find(/^ENGINEERING SHOULD/), factor: find(/^FACTOR APPLIED/), cal: find(/^CALIBRATED SHOULD/), perKva: find(/^Calibrated Rs per kVA/), totalQty: find(/^Total for quantity/), ownFactor: find(/^Own calibration/), refVs: find(/^Reference price vs/),
  };
  const rawLines = cl.filter(([r]) => r > costSec && r < R.A).map(([r, t]) => [r, t]), boLines = cl.filter(([r, t]) => r > R.A && r < R.B && /^\s+/.test(t)).map(([r, t]) => [r, t.trim()]);
  const outRows = rows(OUT), out = (re) => (outRows.find(([, t]) => re.test(t)) || [])[0];
  R.delivery = out(/^Price at delivery/); R.pvRow = rows(IEEMA).find(([, t]) => /^PV factor/.test(t))?.[0]; R.pvVariant = rows(IEEMA).find(([, t]) => /^Variant$/.test(t) && 0) ?? null;
  const ieemaIdx = []; for (let r = 6; r <= 11; r++) ieemaIdx.push({ row: r, el: v(IEEMA, `B${r}`), what: v(IEEMA, `C${r}`), base: v(IEEMA, `D${r}`), unit: v(IEEMA, `F${r}`) });
  return (cache[type] = { wb, sheets, v, fieldsA, pricesB, constsC, ratingRow, lists, R, rawLines, boLines, ieemaIdx, secA, secB, secC, costSec });
}
export const layout = (type) => { const c = ctx(type); return { fieldsA: c.fieldsA, pricesB: c.pricesB, constsC: c.constsC, lists: c.lists, ieemaIdx: c.ieemaIdx }; };

/** the workbook's own configurations (Calculator columns D..H) */
export function seedConfigs(type) {
  const c = ctx(type), out = [];
  for (const col of COLS) {
    if (c.v(CALC, `${col}${c.ratingRow}`) === undefined || c.v(CALC, `${col}${c.ratingRow}`) === '') continue;
    const o = {}; for (const f of c.fieldsA) { const x = c.v(CALC, `${col}${f.row}`); o[f.row] = x === undefined ? null : x; }
    out.push(o);
  }
  return out;
}

/** T = { cells: { 'Calculator!D34': value, 'IEEMA!E6': value, 'Assumptions & Ref!L11': value } } */
export function runXfmr(type, configs, T = {}) {
  const c = ctx(type), w = c.wb; w.clearOverrides();
  for (const [k, val] of Object.entries(T.cells || {})) w.over[k] = val;
  COLS.forEach((col, i) => { const cfg = configs[i]; for (const f of c.fieldsA) w.over[`${CALC}!${col}${f.row}`] = cfg ? (cfg[f.row] === '' || cfg[f.row] === undefined ? null : cfg[f.row]) : null; });
  w.memo.clear();
  const g = (sh, a) => w.get(sh, a), R = c.R;
  return configs.map((cfg, i) => {
    const col = COLS[i];
    if (g(CAL, `${col}6`) === '' || g(CAL, `${col}6`) === null) return { error: 'Enter a rating' };
    const val = (key) => (R[key] ? g(CAL, `${col}${R[key]}`) : null);
    const eng = val('eng'), cal = val('cal');
    if (typeof eng !== 'number') return { error: 'The workbook returned no cost for this configuration' };
    const r = { col, eng, cal: typeof cal === 'number' ? cal : eng, factor: val('factor'), ownFactor: val('ownFactor'), refVs: val('refVs'), solver: val('solver'), perKva: val('perKva'), totalQty: val('totalQty') };
    for (const k of ['impTarget', 'impFinal', 'nllUsed', 'nllCalc', 'fllUsed', 'fllCalc', 'suggestedBm', 'vpt', 'hvTurns', 'lvTurns', 'coreD', 'coilH', 'J', 'lvRad', 'hvRad', 'lvIn', 'hvIn', 'hvOut', 'windowH', 'limbC', 'yokeL', 'coreKg', 'condKg', 'insKg', 'clampKg', 'resinKg', 'enclKg', 'oilKg', 'steelKg', 'totalKg', 'boxL', 'boxW', 'boxH', 'oilL', 'radN', 'radA', 'coolKw', 'A', 'B', 'C', 'D', 'D2', 'E', 'F']) r[k] = val(k);
    r.raw = c.rawLines.map(([row, t]) => ({ label: t, v: g(CAL, `${col}${row}`) })).filter((x) => typeof x.v === 'number');
    r.bo = c.boLines.map(([row, t]) => ({ label: t, v: g(CAL, `${col}${row}`), n: null })).filter((x) => typeof x.v === 'number' && x.v !== 0);
    r.pv = R.pvRow ? g(IEEMA, `${col}${R.pvRow}`) : null; r.delivery = R.pvRow ? g(IEEMA, `${col}${R.pvRow + 1}`) : null;
    r.cfg = cfg; r.ratingKva = g(CAL, `${col}6`); r.hvKv = cfg[c.fieldsA.find((f) => /^HV line/.test(f.label)).row]; r.lvKv = cfg[c.fieldsA.find((f) => /^LV line/.test(f.label)).row];
    r.phases = g(CAL, `${col}8`);
    r.outputs = outputsOf(c, w, col);
    return r;
  });
}
function outputsOf(c, w, col) {
  const out = [], sh = c.sheets[OUT]; let group = '';
  for (let r = 5; r <= 60; r++) {
    const b = sh[`B${r}`]?.v; if (typeof b !== 'string') continue;
    if (sh[`C${r}`] === undefined && sh[`D${r}`] === undefined) { group = b; continue; }
    out.push({ group, label: b, unit: sh[`C${r}`]?.v ?? '', v: w.get(OUT, `${col}${r}`) });
  }
  return out;
}
export const refTables = (type) => { const c = ctx(type), sh = c.sheets[REF], tables = []; let cur = null;
  for (let r = 1; r <= 120; r++) {
    const b = sh[`B${r}`]?.v;
    if (typeof b === 'string' && /^R\.\d/.test(b)) { if (/DROPDOWN/.test(b)) break; cur = { title: b.replace(/\s+/g, ' ').slice(0, 90), header: null, rows: [], note: '' }; tables.push(cur); continue; }
    if (!cur || b === undefined) continue;
    const cells = 'BCDEFGHIJKLMNOPQ'.split('').map((cc) => ({ addr: `${cc}${r}`, v: sh[`${cc}${r}`]?.v })).filter((x) => x.v !== undefined);
    if (!cur.header && cells.every((x) => typeof x.v === 'string')) { cur.header = cells.map((x) => x.v); continue; }
    if (cells.length === 1 && typeof b === 'string' && b.length > 30) { cur.note = b; continue; }
    if (sh[`B${r}`]?.f !== undefined || cells.every((x) => typeof x.v !== 'number' && typeof x.v !== 'string')) continue;
    cur.rows.push(cells);
  } return tables; };
export const ieemaWeights = (type) => { const c = ctx(type), o = []; for (let r = 14; r <= 26; r++) { const b = c.v(IEEMA, `B${r}`); if (typeof b === 'string' && typeof c.v(IEEMA, `C${r}`) === 'number') o.push({ label: b, cells: 'CDEFGHI'.split('').map((cc) => ({ addr: `${cc}${r}`, v: c.v(IEEMA, `${cc}${r}`) })) }); } return o; };
