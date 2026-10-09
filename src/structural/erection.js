// Bottom-up site erection cost: cranes and equipment (hire + operator + fuel), crew, bolting, field welding and site overheads.
// Rates are editable defaults for Indian project sites; replace them with your own quotes.
import { getEngine } from './costmap.js';

export const ERECTION_DEFAULTS = {
  shiftHours: 10, craneUtil: 0.65, craneFactor: 3.5,                    // crane rated for 3.5x the heaviest lift (working radius)
  cranes: [['Hydra 14 t', 14, 10000, 8000], ['Mobile crane 25 t', 25, 17000, 20000], ['Mobile crane 50 t', 50, 30000, 40000], ['Mobile crane 100 t', 100, 55000, 100000], ['Crawler crane 200 t', 200, 110000, 250000], ['Crawler crane 300 t', 300, 160000, 400000]], // name, capacity t, ₹/day (hire+operator+fuel), ₹ mobilisation (round trip)
  cycleBase: 20, cyclePerT: 7,                                          // crane minutes per lift = base + per tonne
  riggers: 4, helpers: 4,                                               // rigging gang working with each crane
  wage: { rigger: 1300, welder: 1800, helper: 800, supervisor: 2800 },  // loaded ₹ per 8-h day
  mewp: 7500, weldSet: 600, generator: 3500, toolsPct: 0.03,            // ₹/day, ₹/day per welder, ₹/day per gang, tools & PPE as % of labour
  heightRate: 0.012, heightFrom: 5, mewpMen: 2,                         // productivity loss per m above 5 m; men per MEWP
  boltMin: 5, boltKg: 0.3,                                              // minutes to fit and torque one bolt set, kg per set
  deposition: 1.8, duty: 0.4, weldOverhead: 1.6, electrodeLoss: 0.3, welderHelpers: 0.5,   // kg/h arc-on, arc-on factor, gouging/grinding/preheat multiplier on welder time, spatter and stub loss, helpers per welder
  ndtPct: 0.25, ndtRate: 300,                                           // share of butt-weld length tested, ₹/m
  siteMonth: 300000, mobLump: 150000, labourPerGang: 12, factor: 1,     // site establishment ₹/month, fixed lump, men per gang, productivity/access factor
};

const butt = (t) => 0.55 * t * t * 7.85e-3, fillet = (leg) => 0.5 * leg * leg * 7.85e-3 * 1.1;   // weld metal kg per metre

/** groups: takeoff groups after overrides (carry kg and kgModel) */
export function computeErection(tk, project, R, netKg, boltPct, gangsIn) {
  const ratio = (id) => { const g = tk.groups.find((x) => x.id === id); return g && g.kgModel > 0 ? g.kg / g.kgModel : 1; };
  const wb = getEngine(), weldRate = wb.get('Calculation Sheet', 'D244') ?? 150;
  const rows = []; const add = (k, label, amount, detail) => rows.push({ k, label, amount, detail });
  const acts = tk.erect.map((a) => ({ ...a, kgEach: a.kgEach * ratio(a.id) }));
  const lifts = acts.filter((a) => a.mode === 'crane' && a.pieces > 0), manual = acts.filter((a) => a.mode === 'manual' && a.pieces > 0);
  const heaviest = Math.max(0, ...lifts.map((a) => a.kgEach)) / 1000;
  const need = heaviest * R.craneFactor;
  const crane = R.cranes.find((c) => c[1] >= need) || R.cranes[R.cranes.length - 1];
  const warn = need > R.cranes[R.cranes.length - 1][1] ? [`The heaviest lift (${heaviest.toFixed(1)} t) needs more than the largest crane in the rate card.`] : [];
  // the crane stays on the hook while each piece is aligned and tacked by the rigging gang
  const craneHours = lifts.reduce((a, x) => a + x.pieces * ((R.cycleBase + R.cyclePerT * x.kgEach / 1000) / 60 + x.alignMh / (R.riggers + R.helpers)), 0);
  const craneDays = craneHours / (R.shiftHours * R.craneUtil);
  const hf = 1 + Math.min(0.6, R.heightRate * Math.max(0, tk.workH - R.heightFrom));
  const hr = R.wage; const hourly = (d) => d / 8;
  const fitterH = hourly((hr.rigger + hr.helper) / 2);
  const alignMh = [...lifts, ...manual].reduce((a, x) => a + x.pieces * x.alignMh, 0) * hf;
  const crewDay = R.riggers * hr.rigger + R.helpers * hr.helper + hr.supervisor;
  const bolts = (netKg * boltPct) / R.boltKg, boltMh = (bolts * R.boltMin) / 60 * hf;
  let weldKg = 0, buttM = 0;
  for (const w of tk.siteWeld) { weldKg += w.m * (w.kind === 'butt' ? butt(w.t) : fillet(w.leg)); if (w.kind === 'butt') buttM += w.m; }
  const welderH = weldKg / (R.deposition * R.duty) * R.weldOverhead * hf, welderDays = welderH / 8;
  const mewpDays = (alignMh + boltMh) * tk.mewpShare / (R.mewpMen * 8);
  const labourH = alignMh + boltMh + welderH * (1 + R.welderHelpers);
  const gangs = Math.max(1, gangsIn || Math.ceil(Math.max(craneDays, labourH / (R.labourPerGang * 8)) / 120));
  const days = Math.max(craneDays / gangs, labourH / (gangs * R.labourPerGang * 8));
  const months = days / 26;
  add('crane', `${crane[0]} hire and operation`, craneDays * crane[2], `${craneDays.toFixed(1)} crane-days at ₹${crane[2].toLocaleString('en-IN')}`);
  add('crew', 'Rigging gang with the crane', craneDays * crewDay, `${R.riggers} riggers, ${R.helpers} helpers, 1 supervisor`);
  add('fit', 'Fit-up, alignment and plumbing labour', alignMh * fitterH, `${Math.round(alignMh)} man-hours (height factor ${hf.toFixed(2)})`);
  add('bolt', 'Bolting and torqueing', boltMh * hourly(hr.rigger), `${Math.round(bolts).toLocaleString('en-IN')} bolt sets, ${Math.round(boltMh)} man-hours`);
  add('weldLab', 'Field welding labour', welderH * hourly(hr.welder) + welderH * R.welderHelpers * hourly(hr.helper), `${weldKg.toFixed(0)} kg weld metal, ${Math.round(welderH)} welder-hours`);
  add('weldCons', 'Welding consumables', weldKg * (1 + R.electrodeLoss) * weldRate, `₹${weldRate}/kg weld metal (workbook), ${(R.electrodeLoss * 100).toFixed(0)}% loss`);
  add('ndt', 'Weld inspection (NDT)', buttM * R.ndtPct * R.ndtRate, `${Math.round(buttM * R.ndtPct)} m tested`);
  add('equip', 'MEWPs, welding sets and generators', mewpDays * R.mewp + welderDays * R.weldSet + days * gangs * R.generator, `${mewpDays.toFixed(1)} MEWP-days, ${welderDays.toFixed(1)} welder-days`);
  const direct = rows.reduce((a, r) => a + r.amount, 0);
  add('tools', 'Tools, consumables and PPE', R.toolsPct * (rows.filter((r) => ['crew', 'fit', 'bolt', 'weldLab'].includes(r.k)).reduce((a, r) => a + r.amount, 0)), `${(R.toolsPct * 100).toFixed(0)}% of labour`);
  add('mob', 'Crane mobilisation and site set-up', crane[3] * gangs + R.mobLump, `${gangs} crane${gangs > 1 ? 's' : ''} + fixed lump`);
  add('site', 'Site establishment and supervision', months * R.siteMonth * gangs, `${months.toFixed(1)} months at ₹${R.siteMonth.toLocaleString('en-IN')}`);
  const total = rows.reduce((a, r) => a + r.amount, 0) * R.factor;
  return { rows, total, perT: total / (netKg / 1000), crane: crane[0], craneDays, days, months, gangs, bolts, weldKg, labourH, manDays: labourH / 8 + craneDays * (R.riggers + R.helpers + 1), heaviest, warn, direct, factor: R.factor };
}
