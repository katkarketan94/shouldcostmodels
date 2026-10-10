import { ahuDef, ahuDefault } from '../ahu/def.js';
export const MFG = [ahuDef, ahuDefault];
const bind = (obj, name, id, key) => ({ id, key, get: () => obj()[name], set: (v) => { obj()[name] = v; } });
const CID = { 'Copper tube': 'copper_tube', 'Aluminium fin': 'al_fin', 'GI sheet': 'gi_hvac', 'Pre-coated GI': 'precoated_gi', 'SS 304': 'ss304', PUF: 'puf', Rockwool: 'rockwool' };
export const priceMap = (S) => ['ahu', 'fcu'].flatMap((k) => Object.entries(CID).map(([m, id]) => bind(() => S().mf.T[k].price, m, id, `${k}.${m}`)));
