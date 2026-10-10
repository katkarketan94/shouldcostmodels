import { fireDef, fireDefault } from '../fire/def.js';
export const MFG = [fireDef, fireDefault];
export const priceMap = (S) => [{ id: 'erw_pipe', key: 'pipe.steelRate', get: () => S().mf.T.water.pipe.steelRate, set: (v) => { S().mf.T.water.pipe.steelRate = v; } }];
