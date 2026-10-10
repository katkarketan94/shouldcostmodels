import { pipesDef, pipesDefault } from '../piping/def.js';
import { assumptionValue } from '../piping/model.js';
export const MFG = [pipesDef, pipesDefault];
const bind = (obj, name, id, key) => ({ id, key, get: () => obj()[name], set: (v) => { obj()[name] = v; } });
const ass = (S, a, id) => ({ id, key: `ass.${a}`, get: () => S().mf.T.ass[a] ?? assumptionValue(a), set: (v) => { S().mf.T.ass[a] = v; } });
export const priceMap = (S) => [...[['D55', 'ms_plate'], ['D57', 'pig_iron'], ['D47', 'ss304_rm'], ['D48', 'ss304_rm'], ['D52', 'ss316_rm'], ['D116', 'zinc']].map(([a, id]) => ass(S, a, id)),
  ...[['HDPE PE100', 'hdpe_resin'], ['PVC-U', 'pvc_resin'], ['PP-R', 'ppr_resin'], ['CPVC', 'cpvc_resin']].map(([f, id]) => bind(() => S().mf.T.resin, f, id, `resin.${f}`))];
