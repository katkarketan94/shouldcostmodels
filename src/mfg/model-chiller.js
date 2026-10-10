import { chillerDef, chillerDefault } from '../chiller/def.js';
export const MFG = [chillerDef, chillerDefault];
const bind = (obj, name, id, key) => ({ id, key, get: () => obj()[name], set: (v) => { obj()[name] = v; } });
export const priceMap = (S) => [['Copper tube', 'copper_tube'], ['Steel plate', 'ms_sheet'], ['Aluminium fin', 'al_fin']].map(([m, id]) => bind(() => S().mf.T.prices, m, id, m));
