// The categories an estimate line can draw on. Each entry prices one unit of a preset item from that model, with up to two size drivers
// that are re-solved by the model itself; anything else is scaled by the line's migration factor.
import { pumpDefault, computePump } from '../pump/calc.js';
import { ctDefault, computeTower } from '../ctower/calc.js';
import { stDefault, computeStatic } from '../static/calc.js';
import { chillerDefault, computeChiller } from '../chiller/calc.js';
import { swgrDefault, computeSwgr } from '../swgr/calc.js';
import { ciDefault, computeCI } from '../cicable/calc.js';
import { mhDefault, computeMH } from '../mh/calc.js';
import { waterDefault, computeWater, alarmDefault, computeAlarm, gasDefault, computeGas } from '../fire/calc.js';
import { plasticDefault, computePlastic } from '../piping/plastic.js';

export const GROUPS = ['STG island', 'BoP mechanical', 'Electrical', 'Specialised packages', 'FGD', 'Civil & structural', 'Other'];
const clone = (o) => JSON.parse(JSON.stringify(o));
const D = (k, label, unit, step = 'any') => ({ k, label, unit, step });
const wrap = (def, compute, o) => { const d = def(); return { list: d.list, T: d.T, price: (cfg) => compute(cfg, d.T), ...o }; };
const CATS = {
  static: wrap(stDefault, computeStatic, { label: 'Static equipment: condenser, heaters, vessels, deaerators', group: 'STG island', unit: 'units', drivers: (c) => (c.type === 'vessel' ? [D('id', 'ID', 'm', 0.1), D('tan', 'Length', 'm', 0.1), D('pVessel', 'Pressure', 'bar')] : c.type === 'dea' ? [D('flow', 'Flow', 't/h')] : [D('area', 'Area', 'm²')]) }),
  pump: wrap(pumpDefault, computePump, { label: 'Pumps (all families, fire pumps)', group: 'BoP mechanical', unit: 'pumps', drivers: () => [D('flow', 'Flow', 'm³/h'), D('head', 'Head', 'm')] }),
  ctower: wrap(ctDefault, computeTower, { label: 'Cooling towers', group: 'BoP mechanical', unit: 'towers', drivers: () => [D('kw', 'Heat load', 'kW')] }),
  chiller: wrap(chillerDefault, computeChiller, { label: 'Chillers', group: 'BoP mechanical', unit: 'chillers', drivers: () => [D('tr', 'Capacity', 'TR')] }),
  firew: wrap(waterDefault, computeWater, { label: 'Fire water system', group: 'BoP mechanical', unit: 'systems', drivers: () => [D('area', 'Protected area', 'm²')] }),
  firea: wrap(alarmDefault, computeAlarm, { label: 'Fire detection and alarm', group: 'BoP mechanical', unit: 'systems', drivers: () => [D('area', 'Area', 'm²')] }),
  fireg: wrap(gasDefault, computeGas, { label: 'Gas suppression', group: 'BoP mechanical', unit: 'systems', drivers: () => [] }),
  pipep: wrap(plasticDefault, computePlastic, { label: 'Plastic pipes (HDPE, PVC, PP-R, CPVC)', group: 'BoP mechanical', unit: 'm', drivers: () => [D('od', 'OD', 'mm')] }),
  swgr: wrap(swgrDefault, computeSwgr, { label: 'HT / LT switchgear', group: 'Electrical', unit: 'boards', drivers: () => [D('busA', 'Busbar', 'A', 50), D('kA', 'Fault level', 'kA')] }),
  cable: wrap(ciDefault, (c, T) => computeCI(c, T).totalKm / 1000 * 1000, { label: 'Control and instrumentation cables', group: 'Electrical', unit: 'm', drivers: () => [D('n', 'Cores / pairs', ''), D('size', 'mm²', 'mm²', 'any')] }),
  mh: wrap(mhDefault, computeMH, { label: 'Material handling package, supply', group: 'Specialised packages', unit: 'packages', drivers: () => [] }),
};
CATS.cable.price = (cfg) => computeCI(cfg, CATS.cable.T).total;            // Rs per metre
CATS.mh.price = (cfg) => computeMH(cfg, CATS.mh.T).total;
CATS.mherec = { ...CATS.mh, label: 'Material handling package, erection', price: (cfg) => computeMH(cfg, CATS.mh.T).erTotal };
export { CATS };
/** price of one unit of a line, in rupees; returns { price, error } */
export function priceLine(line) {
  if (line.cat === 'manual') return { price: line.rate || 0 };
  const cat = CATS[line.cat]; if (!cat) return { error: 'Unknown category' };
  const base = cat.list[Math.min(line.preset ?? 0, cat.list.length - 1)]; if (!base) return { error: 'No preset' };
  const cfg = { ...clone(base), ...(line.drivers || {}) };
  let r; try { r = cat.price(cfg); } catch (e) { return { error: 'Could not price this item' }; }
  const v = typeof r === 'number' ? r : r?.total; if (!(v > 0)) return { error: r?.error || 'No price for these inputs' };
  return { price: v * (line.factor ?? 1) };
}
