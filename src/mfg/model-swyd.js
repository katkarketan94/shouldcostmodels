import { swydDef, swydDefault } from '../swyd/def.js';
import { SY_DEFAULTS } from '../swyd/calc.js';
export const MFG = [swydDef, swydDefault];
const REF = { steelRate: 68, alRate: 349 }, ID = { steelRate: 'hr_plate', alRate: 'aluminium' };
// month mode scales each price by the commodity move since the base month used for the defaults
export const priceMap = (S) => Object.keys(REF).map((k) => ({ id: ID[k], key: k, get: () => S().mf.T[k], set: (v) => { S().mf.T[k] = SY_DEFAULTS[k] * v / REF[k]; }, restore: (v) => { S().mf.T[k] = v; } }));
