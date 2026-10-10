import { xfmrDef, xfmrDefault } from '../xfmr/def.js';
import { layout } from '../xfmr/model.js';
export const MFG = [xfmrDef, xfmrDefault];
const REF = { copper: 1400, aluminium: 349, crgo: 95, hr_plate: 68, pressboard: 275, trafo_oil: 210, epoxy_resin: 450 };
const CID = [[/^Copper/, 'copper'], [/^Aluminium/, 'aluminium'], [/^CRGO/, 'crgo'], [/^(Mild steel|Steel)/, 'hr_plate'], [/^Pressboard/, 'pressboard'], [/oil/i, 'trafo_oil'], [/^Epoxy/, 'epoxy_resin']];
const IEEMA = { C: 'copper', ES: 'crgo', IS: 'hr_plate', IM: 'pressboard', TO: 'trafo_oil' };
// month mode: Section B material rates and the IEEMA delivery indices scale with the selected month's commodity price
export const priceMap = (S) => ['power', 'dist', 'dry'].flatMap((kind) => {
  const L = layout(kind), T = () => S().mf.T[kind].cells, items = [];
  const scaled = (sheet, addr, base, id, key) => ({ id, key, get: () => T()[`${sheet}!${addr}`] ?? base, set: (v) => { T()[`${sheet}!${addr}`] = base * v / REF[id]; }, restore: (v) => { T()[`${sheet}!${addr}`] = v; } });
  for (const p of L.pricesB) { const id = (CID.find(([re]) => re.test(p.label)) || [])[1]; if (id) items.push(scaled('Calculator', `D${p.row}`, p.value, id, `${kind}.B${p.row}`)); }
  for (const x of L.ieemaIdx) { const id = IEEMA[x.el]; if (id) items.push(scaled('IEEMA', `E${x.row}`, x.base, id, `${kind}.IE${x.row}`)); }
  return items;
});
