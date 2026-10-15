import { hangerDef, hangerDefault } from '../hanger/def.js';
import { HANGER_DEFAULTS } from '../hanger/calc.js';
export const MFG = [hangerDef, hangerDefault];
// month mode scales the structural steel rate by the hot-rolled plate move since the base month used for the defaults
export const priceMap = (S) => [{ id: 'hr_plate', key: 'steelRate', get: () => S().mf.T.steelRate, set: (v) => { S().mf.T.steelRate = HANGER_DEFAULTS.steelRate * v / 68; }, restore: (v) => { S().mf.T.steelRate = v; } }];
