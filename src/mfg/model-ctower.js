import { ctowerDef, ctDefault } from '../ctower/def.js';
import { CT_DEFAULTS } from '../ctower/calc.js';
export const MFG = [ctowerDef, ctDefault];
// month mode scales the galvanised-steel rate with the MS plate commodity series
export const priceMap = (S) => [{ id: 'ms_plate', key: 'hdgRate', get: () => S().mf.T.hdgRate, set: (v) => { S().mf.T.hdgRate = CT_DEFAULTS.hdgRate * v / 49; }, restore: (v) => { S().mf.T.hdgRate = v; } }];
