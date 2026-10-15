import { chillerDef, chillerDefault } from '../chiller/def.js';
import { CHILLER_DEFAULTS } from '../chiller/calc.js';
export const MFG = [chillerDef, chillerDefault];
const REF = { r_cuTube: 1400, r_steelFab: 68 }, ID = { r_cuTube: 'copper_tube', r_steelFab: 'hr_plate' };
// month mode scales each workbook rate by the commodity move since the base month used for the defaults
export const priceMap = (S) => Object.keys(REF).map((k) => ({ id: ID[k], key: k, get: () => S().mf.T.r[k], set: (v) => { S().mf.T.r[k] = CHILLER_DEFAULTS.r[k] * v / REF[k]; }, restore: (v) => { S().mf.T.r[k] = v; } }));
