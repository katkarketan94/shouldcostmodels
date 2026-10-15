import { swydDefault, computeSwyd } from '../src/swyd/calc.js';
import assert from 'node:assert';
const d = swydDefault(), res = d.list.map((c) => computeSwyd(c, d.T));
res.forEach((r, i) => { assert(!r.error, d.list[i].tag); assert(Math.abs(r.lines.reduce((s, l) => s + l.amount, 0) - r.base) < 1); console.log(d.list[i].tag.padEnd(50), 'bays', r.bays, 'CB', r.cb, 'steel t', Math.round(r.steelT), 'ha', r.areaHa.toFixed(1), 'Rs Cr', (r.total / 1e7).toFixed(1), 'Rs Cr/bay', (r.perBay / 1e7).toFixed(2)); });
const kvs = [66, 132, 220, 400, 765].map((kv) => computeSwyd({ ...d.list[1], kv }, d.T).total); assert(kvs.every((v, i) => !i || v > kvs[i - 1]), 'cost rises with kV');
const one = computeSwyd({ ...d.list[0], scheme: 'single' }, d.T), half = computeSwyd(d.list[0], d.T); assert(half.cb > one.cb, '1.5 breaker has more breakers');
const ais = computeSwyd(d.list[3], d.T), g = computeSwyd({ ...d.list[3], gis: 'AIS' }, d.T); assert(ais.areaHa < g.areaHa, 'GIS needs less land'); assert(ais.total !== g.total);
assert(computeSwyd({ ...d.list[0], lines: 0, xfmr: 0, reactor: 0 }, d.T).error);
console.log('swyd calc OK');
