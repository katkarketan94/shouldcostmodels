// Sanity checks for the cable engineering check against typical catalogue ratings (within about 12%) and monotonic behaviour.
import assert from 'node:assert';
import { DEFAULTS, DEFAULTS_HT } from '../src/data.js';
import { compute } from '../src/model.js';
import { rating, checkCable, CHECK_DEFAULTS, groupFactor } from '../src/cableCheck.js';
const b = { shape: 'Circular', inner: 'PVC', armour: 'Galvanised steel flat strip', outer: 'PVC', special: {} };
const geom = (fam, cfg) => compute(fam, cfg, fam === 'lt' ? DEFAULTS.master : DEFAULTS_HT.master, fam === 'lt' ? DEFAULTS : DEFAULTS_HT);
const cases = [['lt', { ...b, cores: 3.5, size: 240, conductor: 'Aluminium', insulation: 'XLPE' }, { install: 'ground', groundT: 20 }, 355, 0], ['lt', { ...b, cores: 3, size: 95, conductor: 'Copper', insulation: 'XLPE' }, { install: 'air', ambient: 30 }, 300, 0], ['lt', { ...b, cores: 3, size: 16, conductor: 'Copper', insulation: 'PVC' }, { install: 'air', ambient: 30 }, 80, 0], ['ht', { ...b, cores: 3, size: 300, conductor: 'Aluminium', voltage: '11kV', insulation: 'XLPE' }, { install: 'ground', groundT: 20 }, 370, 6.35]];
for (const [fam, cfg, inp, ref, kv] of cases) { const x = rating(geom(fam, cfg), cfg, { ...CHECK_DEFAULTS, ...inp }, fam === 'ht', kv); const err = Math.abs(x.I0 / ref - 1); console.log(fam, cfg.size, cfg.conductor, Math.round(x.I0), 'vs', ref, `${(err * 100).toFixed(1)}%`); assert(err < 0.12, 'within 12% of catalogue'); }
const cfg = cases[1][1], g = geom('lt', cfg), a = rating(g, cfg, { ...CHECK_DEFAULTS, ambient: 40 }, false, 0), c = rating(g, cfg, { ...CHECK_DEFAULTS, ambient: 55 }, false, 0); assert(c.I0 < a.I0, 'hotter ambient lowers rating');
assert(groupFactor('ground', 'touching', 4) < groupFactor('ground', 'spaced', 4) && groupFactor('air', 'touching', 1) === 1);
const sizes = DEFAULTS.insul.area, chk = checkCable(g, cfg, { ...CHECK_DEFAULTS, load: 250, length: 300, fault: 30 }, false, 0, (sz) => geom('lt', { ...cfg, size: sz }), sizes); console.log('250 A over 300 m:', chk.ok, 'used', chk.used.toFixed(2), 'vd', chk.vdPct.toFixed(2), 'Isc', chk.iscKA.toFixed(1), 'min', chk.min && chk.min.size, 'binding', chk.bind); assert(chk.min && chk.min.size >= cfg.size || chk.ok);
const small = checkCable(geom('lt', { ...cfg, size: 25 }), { ...cfg, size: 25 }, { ...CHECK_DEFAULTS, load: 150 }, false, 0); assert(!small.ok && !small.curOk, 'overloaded small cable fails');
console.log('cable check OK');
