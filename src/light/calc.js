// Lighting by the lumen method: fixtures needed for the target lux on the working plane, then fixtures, mounting, wiring, controls and distribution.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const FIX = { highbay: { label: 'LED high-bay', w: 150, lm: 21000, price: 9500, pole: 0 }, flood: { label: 'LED flood light', w: 200, lm: 24000, price: 11000, pole: 1 }, panel: { label: 'LED panel 600×600', w: 36, lm: 3600, price: 1800, pole: 0 }, linear: { label: 'LED batten / linear', w: 36, lm: 4300, price: 1300, pole: 0 }, street: { label: 'LED street light', w: 120, lm: 14400, price: 7200, pole: 1 }, tunnel: { label: 'LED tunnel / hazardous (Ex)', w: 100, lm: 11000, price: 14500, pole: 0 } };
export const CONTROLS = { manual: ['Manual switching', 0], occupancy: ['Occupancy and daylight sensors', 1100], dali: ['DALI dimming with gateway', 2600] };
export const LIGHT_DEFAULTS = { mf: 0.8, wiring: 1800, mount: 450, poleKm: 14000, poleH: 9, emerg: 0.1, emergAdd: 2600, ldb: 140000, perLdb: 40, inst: 650, earth: 220, cableM: 14, test: 0.01, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, fixture: 'highbay', area: 2000, lux: 200, height: 10, utilisation: 0, controls: 'manual', ...o });
export const lightDefault = () => defState([mk('LT-01 Workshop 2,000 m², 200 lux', {}), mk('LT-02 Office floor 800 m², 400 lux', { fixture: 'panel', area: 800, lux: 400, height: 3, controls: 'occupancy' }), mk('LT-03 Yard flood lighting 10,000 m², 30 lux', { fixture: 'flood', area: 10000, lux: 30, height: 12 }), mk('LT-04 Plant road 1,500 m × 7 m, 20 lux', { fixture: 'street', area: 10500, lux: 20, height: 9 }), mk('LT-05 Boiler area (Ex), 1,200 m², 150 lux', { fixture: 'tunnel', area: 1200, lux: 150, height: 6 })], LIGHT_DEFAULTS, 'light');
export function computeLight(c, T) {
  const fx = FIX[c.fixture]; if (!fx || !(c.area > 0) || !(c.lux > 0)) return { error: 'Enter area and illuminance' };
  const uf = c.utilisation > 0 ? c.utilisation : Math.max(0.3, 0.62 - 0.018 * Math.max(0, c.height - 3)) * (fx.pole ? 0.7 : 1), n = Math.ceil(c.lux * c.area / (fx.lm * uf * T.mf)), kw = n * fx.w / 1000, lines = [], add = adder(lines);
  const G1 = 'Luminaires', G2 = 'Poles and mounting', G3 = 'Wiring and distribution', G4 = 'Controls and emergency', G5 = 'Installation and test';
  add(G1, `${fx.label}, ${fx.w} W, ${fx.lm.toLocaleString('en-IN')} lm`, n, 'no', fx.price);
  const poles = fx.pole ? Math.ceil(n / 2) : 0; if (poles) add(G2, `Poles / masts ${T.poleH} m with brackets`, poles, 'no', T.poleKm * (c.height / T.poleH) ** 1.5 * 1); add(G2, 'Brackets, clamps and chains', n, 'no', T.mount);
  add(G3, 'Fixture wiring, conduit and cable', n, 'no', T.wiring); add(G3, 'Lighting distribution boards', Math.ceil(n / T.perLdb), 'no', T.ldb); add(G3, 'Earthing of poles and fixtures', n, 'no', T.earth);
  const ctl = CONTROLS[c.controls]; if (ctl[1] > 0) add(G4, ctl[0], n, 'no', ctl[1]); const em = Math.ceil(n * T.emerg); add(G4, 'Emergency fixtures with battery (3 h)', em, 'no', T.emergAdd);
  const sub = lines.reduce((s, l) => s + l.amount, 0); add(G5, 'Fixing, pulling and connection labour', n, 'no', T.inst); add(G5, 'Lux survey and acceptance', 1, 'lot', sub * T.test);
  const { base, total, parts, pm } = finish(lines, T.stack);
  return { cfg: c, lines, parts, pm, base, total, n, kw, uf, poles, lpd: kw * 1000 / c.area, perM2: total / c.area, meta: `${fx.label} · ${c.lux} lux over ${Number(c.area).toLocaleString('en-IN')} m² · ${n} fixtures`, pill: fx.label.split(' ')[1] || 'LED',
    metrics: [['Fixtures', n.toLocaleString('en-IN')], ['Connected load', `${R2(kw, 1)} kW`], ['Power density', `${R2(kw * 1000 / c.area, 1)} W/m²`], ['₹ per m²', `₹${Math.round(total / c.area).toLocaleString('en-IN')}`]],
    facts: [['Illuminance target (lux)', c.lux], ['Area (m²)', c.area], ['Utilisation factor', R2(uf, 2)], ['Maintenance factor', T.mf], ['Fixtures', n], ['Connected load (kW)', R2(kw, 1)], ['Lighting power density (W/m²)', R2(kw * 1000 / c.area, 2)], ['Poles', poles]] };
}
