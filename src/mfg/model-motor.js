import { motorDef, motorDefault } from '../motor/def.js';
import { MOTOR_DEFAULTS } from '../motor/calc.js';
export const MFG = [motorDef, motorDefault];
const REF = { copper: 1400, crca: 76 }, ID = { copper: 'copper', crca: 'crca_sheet' };
// month mode scales each price by the commodity move since the base month used for the defaults
export const priceMap = (S) => Object.keys(REF).map((k) => ({ id: ID[k], key: k, get: () => S().mf.T.prices[k], set: (v) => { S().mf.T.prices[k] = MOTOR_DEFAULTS.prices[k] * v / REF[k]; }, restore: (v) => { S().mf.T.prices[k] = v; } }));
