import { stDef, stDefault } from '../static/def.js';
import { ST_DEFAULTS } from '../static/calc.js';
export const MFG = [stDef, stDefault];
const REF = { plate: 68, plate304: 203, plate316: 354, tube304: 203, tube316: 354, tubeCs: 78, tubeBrass: 1400, tubeCuNi: 1400 }, ID = { plate: 'hr_plate', plate304: 'ss304_rm', plate316: 'ss316_rm', tube304: 'ss304_rm', tube316: 'ss316_rm', tubeCs: 'erw_pipe', tubeBrass: 'copper', tubeCuNi: 'copper' };
// month mode scales each price by the commodity move since the base month used for the defaults
export const priceMap = (S) => Object.keys(REF).map((k) => ({ id: ID[k], key: k, get: () => S().mf.T.prices[k], set: (v) => { S().mf.T.prices[k] = ST_DEFAULTS.prices[k] * v / REF[k]; }, restore: (v) => { S().mf.T.prices[k] = v; } }));
