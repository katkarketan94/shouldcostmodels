import { accDef, accDefault } from '../acc/def.js';
import { ACC_DEFAULTS } from '../acc/calc.js';
export const MFG = [accDef, accDefault];
// month mode scales the structure steel price by the move in hot-rolled plate since the base month used for the defaults
export const priceMap = (S) => [{ id: 'hr_plate', key: 'steelRate', get: () => S().mf.T.steelRate, set: (v) => { S().mf.T.steelRate = ACC_DEFAULTS.steelRate * v / 68; }, restore: (v) => { S().mf.T.steelRate = v; } }];
