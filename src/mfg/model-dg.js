import { dgDef, dgDefault } from '../dg/def.js';
export const MFG = [dgDef, dgDefault];
const bind = (obj, name, id, key) => ({ id, key, get: () => obj()[name], set: (v) => { obj()[name] = v; } });
import WB from '../dg/workbook.json' with { type: 'json' };
const cell = (S, k, id) => ({ id, key: k, get: () => S().mf.T.cells[k] ?? WB[k.split('!')[0]][k.split('!')[1]].v, set: (v) => { S().mf.T.cells[k] = v; } });
export const priceMap = (S) => [['Rate Library!D5', 'hr_plate'], ['Rate Library!D6', 'crca_sheet'], ['Rate Library!D7', 'ismc_section'], ['Rate Library!D12', 'rockwool']].map(([k, id]) => cell(S, k, id));
