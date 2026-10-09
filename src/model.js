import { computeCable } from './calc.js';
import { computeHT } from './calcHT.js';
export const compute = (fam, cfg, master, T) => (fam === 'ht' ? computeHT(cfg, master, T) : computeCable(cfg, master, T));
