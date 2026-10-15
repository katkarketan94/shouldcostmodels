import assert from 'node:assert';
import { linfit, trend, seasonality, pairStats, basketIndex, addMonths } from '../src/analytics.js';
// synthetic: 5% a year growth with a summer bump and a driver
const months = {}; for (let i = 0; i < 36; i++) { const k = addMonths('2023-01', i), m = i % 12, season = m === 6 ? 1.06 : m === 0 ? 0.95 : 1; months[k] = { a: 100 * 1.05 ** (i / 12) * season, b: 50 * (1 + 0.02 * Math.sin(i)) , c: 200 * (1 + 0.5 * 0.02 * Math.sin(i)) }; }
const t = trend(months, 'a', 6); assert(Math.abs(t.annual - 0.05) < 0.01, `annual growth ${t.annual}`); assert(t.fc.length === 6 && t.fc[0].lo < t.fc[0].v && t.fc[0].hi > t.fc[0].v);
const s = seasonality(months, 'a'); assert(s.strongest.m === 6 && s.weakest.m === 0, 'seasonality picks the injected months'); assert(Math.abs(s.idx[6].v - 1.06) < 0.02);
const p = pairStats(months, 'c', 'b'); assert(p.beta > 0.4 && p.beta < 0.6 && p.r2 > 0.95, `beta ${p.beta}`);
const w = { a: 0.5, b: 0.2 }, bi = basketIndex(months, w, '2023-01'); assert(Math.abs(bi[0].v - 1) < 1e-9 && bi.length === 36);
assert(addMonths('2024-11', 3) === '2025-02'); assert(Math.abs(linfit([1, 2, 3], [2, 4, 6]).b - 2) < 1e-9); console.log('analytics OK');
