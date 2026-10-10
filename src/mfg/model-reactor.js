import { reactorDef, reactorDefault } from '../reactor/def.js';
import { REACTOR_DEFAULTS } from '../reactor/calc.js';
export const MFG = [reactorDef, reactorDefault];
const REF = { copper: 1400, crgo: 95, hr_plate: 68, pressboard: 275, trafo_oil: 210 };
const MAP = [['copper', 'copper'], ['crgo', 'crgo'], ['steel', 'hr_plate'], ['pressboard', 'pressboard'], ['oil', 'trafo_oil']];
const IDX = { C: 'copper', ES: 'crgo', IS: 'hr_plate', IM: 'pressboard', TO: 'trafo_oil' };
// month mode scales the material rates and the IEEMA delivery indices with the selected month's commodity price
export const priceMap = (S) => [...MAP.map(([k, id]) => ({ id, key: `p.${k}`, get: () => S().mf.T.prices[k], set: (v) => { S().mf.T.prices[k] = REACTOR_DEFAULTS.prices[k] * v / REF[id]; }, restore: (v) => { S().mf.T.prices[k] = v; } })),
  ...Object.entries(IDX).map(([e, id]) => ({ id, key: `i.${e}`, get: () => S().mf.T.ieema.idx[e][1], set: (v) => { S().mf.T.ieema.idx[e][1] = REACTOR_DEFAULTS.ieema.idx[e][0] * v / REF[id]; }, restore: (v) => { S().mf.T.ieema.idx[e][1] = v; } }))];
