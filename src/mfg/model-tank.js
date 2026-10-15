import { tankDef, tankDefault } from '../tank/def.js';
import { TANK_DEFAULTS } from '../tank/calc.js';
export const MFG = [tankDef, tankDefault];
// month mode scales the carbon-steel plate rate by the hot-rolled plate move since the base month used for the defaults
export const priceMap = (S) => [{ id: 'hr_plate', key: 'plateRate', get: () => S().mf.T.plateRate, set: (v) => { S().mf.T.plateRate = TANK_DEFAULTS.plateRate * v / 68; }, restore: (v) => { S().mf.T.plateRate = v; } }];
