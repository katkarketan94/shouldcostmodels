import { ductDef, ductDefault } from '../duct/def.js';
export const MFG = [ductDef, ductDefault];
const bind = (obj, name, id, key) => ({ id, key, get: () => obj()[name], set: (v) => { obj()[name] = v; } });
export const priceMap = (S) => [['GI sheet', 'gi_hvac'], ['Pre-coated GI', 'precoated_gi'], ['SS 304', 'ss304'], ['Aluminium', 'al_sheet'], ['Angle / hanger steel', 'gi_sheet']].map(([m, id]) => bind(() => S().mf.T.prices, m, id, m));
