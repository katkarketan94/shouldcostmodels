import { ciDef, ciDefault } from '../cicable/def.js';
export const MFG = [ciDef, ciDefault];
export const priceMap = (S) => [['copper', 'copper'], ['pvc', 'pvc'], ['xlpe', 'xlpe'], ['steel_wire', 'steel_wire']].map(([k, id]) => ({ id, key: k, get: () => S().mf.T.rates[k], set: (v) => { S().mf.T.rates[k] = v; } }));
