// Sample trays for the structural-check workbook, with the dashboard's own results (used to verify the workbook after recalculation).
import { writeFileSync } from 'node:fs';
import { TRAY_DEFAULTS } from '../../src/dataTray.js';
import { STRUCT_DEFAULTS, CHECK_DEFAULTS, checkTray } from '../../src/trayStruct.js';
import { computeTray } from '../../src/calcTray.js';
const T = JSON.parse(JSON.stringify(TRAY_DEFAULTS)); T.struct = STRUCT_DEFAULTS;
const self = (cfg) => { const r = computeTray({ ...cfg, length: cfg.length ?? 2500 }, T); return r.weight / (r.length / 1000); };
const P = [
  ['Ladder 600 x 100 x 2.0, simple span', { kind: 'ladder', width: 600, depth: 100, thk: 2, length: 2500 }, {}],
  ['Ladder 300 x 75 x 2.0, continuous', { kind: 'ladder', width: 300, depth: 75, thk: 2, length: 2500 }, { support: 'continuous', load: 30, span: 3 }],
  ['Ladder 600 x 100 x 2.0, overloaded', { kind: 'ladder', width: 600, depth: 100, thk: 2, length: 2500 }, { load: 400 }],
  ['Perforated 300 x 100 x 2.0', { kind: 'perf', width: 300, depth: 100, thk: 2, length: 2500 }, { load: 25, span: 2 }],
  ['Trough 150 x 50 x 2.5', { kind: 'trough', width: 150, depth: 50, thk: 2.5, length: 2500 }, { load: 10, span: 1.5, point: 60 }],
  ['Cantilever arm 620 mm, 41 x 41 x 2.5', { kind: 'arm', width: 41, depth: 41, thk: 2.5, length: 620 }, { load: 20, span: 2, trayKgPerM: 8 }],
  ['Cantilever arm 320 mm, 41 x 41 x 2.5', { kind: 'arm', width: 41, depth: 41, thk: 2.5, length: 320 }, { load: 20, span: 2, trayKgPerM: 8 }],
  ['Channel 41 x 41 x 2.5, trapeze 600 mm', { kind: 'channel', width: 41, depth: 41, thk: 2.5, length: 1000 }, { channelSpan: 600, span: 2, trayKgPerM: 8, load: 20 }]];
const out = P.map(([tag, cfg, o]) => { const chk = { ...CHECK_DEFAULTS, trayKgPerM: 0, ...o }, sw = +self(cfg).toFixed(3), r = checkTray(cfg, T, chk, sw);
  return { tag, cfg, chk, self: sw, expect: { swl: r.swl, swlArm: r.swlArm ?? null, gov: r.governing, pass: r.pass, util: r.util, maxSpan: r.maxSpan ?? null, A: r.sec.A, I: r.sec.I, Zb: r.sec.Zb, Zt: r.sec.Zt } }; });
writeFileSync(new URL('./presets.json', import.meta.url), JSON.stringify({ struct: STRUCT_DEFAULTS, T: { ladder: T.ladder, perf: T.perf, trough: T.trough, channel: T.channel }, rows: out }, null, 1));
out.forEach((o) => console.log(o.tag.padEnd(42), 'self', o.self, 'SWL', o.expect.swl.toFixed(1), o.expect.gov, o.expect.pass, 'max span', o.expect.maxSpan?.toFixed(2)));
