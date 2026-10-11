import { swgrDef, swgrDefault } from '../swgr/def.js';
export const MFG = [swgrDef, swgrDefault];
export const priceMap = (S) => [['copper', 'copper'], ['aluminium', 'aluminium'], ['crca', 'crca_sheet']].map(([k, id]) => ({ id, key: k, get: () => S().mf.T.prices[k], set: (v) => { S().mf.T.prices[k] = v; } }));
