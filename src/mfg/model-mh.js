import { mhDef, mhDefault } from '../mh/def.js';
export const MFG = [mhDef, mhDefault];
export const priceMap = (S) => [['plate', 'hr_plate'], ['section', 'ismc_section'], ['tube', 'erw_pipe'], ['rubber', 'rubber'], ['nnFabric', 'nn_fabric'], ['steelCord', 'steel_cord'], ['copper', 'copper']].map(([k, id]) => ({ id, key: k, get: () => S().mf.T.prices[k], set: (v) => { S().mf.T.prices[k] = v; } }));
