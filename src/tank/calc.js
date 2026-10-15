// Storage tanks. Vertical tanks follow the API 650 one-foot method for shell courses; horizontal vessels follow thin-wall pressure thickness.
// Not a workbook model: weights come from the geometry, prices are plate rate plus fabrication and erection rates plus foundation and painting.
import { R2, STACK, adder, finish, defState } from '../mfg/kit.js';
export const TTYPES = { cone: { label: 'Vertical, fixed cone roof (API 650)', vert: true }, float: { label: 'Vertical, external floating roof', vert: true }, dome: { label: 'Vertical, aluminium dome with internal floater', vert: true }, horiz: { label: 'Horizontal cylindrical (above ground)', vert: false } };
export const TMAT = { cs: ['Carbon steel A36 / IS 2062', 160, 1], ss304: ['Stainless steel 304', 140, 3.0], ss316: ['Stainless steel 316L', 140, 5.2] };
export const TANK_DEFAULTS = { plateRate: 68, ssRate: { ss304: 203, ss316: 354 }, fab: 38, ss_fab: 120, annularT: 10, bottomT: 6, roofT: 5, rafterKgPerM2: 22, windGirder: 0.05, nozzleLot: 450000, ladder: 350000, perMNozzle: 0, floatKgPerM2: 55, domeRate: 18000, foundPerM2: 9000, paint: 320, test: 0.01, erectF: 1.0, stack: { ...STACK } };
const mk = (tag, o) => ({ tag, type: 'cone', cap: 5000, height: 12, sg: 1.0, mat: 'cs', ca: 1.5, found: 'Yes', ...o });
export const tankDefault = () => defState([mk('TK-01 Raw water 5,000 m³, fixed roof', {}), mk('TK-02 Fuel oil 2,000 m³', { cap: 2000, sg: 0.95, height: 10 }), mk('TK-03 Crude / HFO 20,000 m³, floating roof', { type: 'float', cap: 20000, sg: 0.9, height: 14.6 }), mk('TK-04 Chemical 100 m³ SS316L', { cap: 100, height: 6, mat: 'ss316', sg: 1.3 }), mk('TK-05 Hydrochloric acid 50 m³ horizontal', { type: 'horiz', cap: 50, sg: 1.2, mat: 'ss316', found: 'No' })], TANK_DEFAULTS, 'tank');
export function computeTank(c, T) {
  const ty = TTYPES[c.type], mt = TMAT[c.mat]; if (!ty || !(c.cap > 0)) return { error: 'Enter a capacity' };
  const lines = [], add = adder(lines), G1 = 'Shell and heads', G2 = 'Bottom and roof', G3 = 'Fittings and appurtenances', G4 = 'Foundation and finish', G5 = 'Erection and test', rho = 7850, facts = [], plateRate = c.mat === 'cs' ? T.plateRate : T.ssRate[c.mat], fab = (c.mat === 'cs' ? T.fab : T.ss_fab) * T.erectF;
  let shellKg, bottomKg = 0, roofKg = 0, D, H, extraRoof = 0, area;
  if (ty.vert) {
    H = c.height; D = Math.sqrt(4 * c.cap / (Math.PI * H)); if (D > 90) return { error: 'Diameter above 90 m: raise the height' };
    const courseH = 2.4, nc = Math.ceil(H / courseH), minT = D < 15 ? 5 : D < 36 ? 6 : D < 60 ? 8 : 10; shellKg = 0; const ts = [];
    for (let i = 0; i < nc; i++) { const hi = H - i * courseH, t = Math.max(minT, 4.9 * D * (hi - 0.3) * Math.max(c.sg, 1) / mt[1] + c.ca), tt = Math.ceil(t * 2) / 2; ts.push(tt); shellKg += Math.PI * D * Math.min(courseH, H - i * courseH) * tt / 1000 * rho; }
    area = Math.PI * D * D / 4; bottomKg = (area * T.bottomT / 1000 + Math.PI * D * 1.0 * (T.annularT - T.bottomT) / 1000) * rho * 1.08; roofKg = ty.vert && c.type !== 'float' ? area * 1.15 * (T.roofT / 1000 * rho + T.rafterKgPerM2) : area * T.floatKgPerM2 * (c.type === 'float' ? 1 : 0);
    if (c.type === 'float') roofKg = area * T.floatKgPerM2; const wind = shellKg * T.windGirder * (D > 20 ? 1.5 : 1); shellKg += wind; facts.push(['Diameter (m)', R2(D, 1)], ['Height (m)', H], ['Shell courses', nc], ['Bottom course thickness (mm)', ts[0]], ['Top course thickness (mm)', ts[nc - 1]]);
  } else {
    D = Math.cbrt(4 * c.cap / (Math.PI * 3)); const L = 3 * D, p = 0.5, t = Math.max(6, p * 1e5 * (D / 2) / (mt[1] * 1e6 * 0.85 - 0.6 * p * 1e5) * 1000 + c.ca); shellKg = (Math.PI * D * L * t / 1000 + 2 * 1.1 * Math.PI * D * D / 4 * t / 1000) * rho; area = D * L; H = D;
    facts.push(['Diameter (m)', R2(D, 2)], ['Length (m)', R2(L, 2)], ['Wall thickness (mm)', R2(t, 1)]); bottomKg = 0.12 * shellKg;
  }
  add(G1, `Shell plates ${mt[0]} (${R2(shellKg / 1000, 1)} t)`, shellKg, 'kg', plateRate + fab); if (ty.vert) add(G2, 'Bottom and annular plates', bottomKg, 'kg', plateRate + fab); else add(G2, 'Saddles, supports and base frame', bottomKg, 'kg', plateRate + fab);
  if (roofKg) add(G2, c.type === 'float' ? 'Floating roof with pontoons and seals' : 'Cone roof plates and rafters', roofKg, 'kg', plateRate + fab * (c.type === 'float' ? 1.8 : 1)); if (c.type === 'dome') add(G2, 'Aluminium geodesic dome and internal floater', Math.PI * D * D / 4, 'm²', T.domeRate);
  add(G3, 'Manholes, nozzles, level gauging and vents', 1, 'lot', T.nozzleLot * (c.cap / 5000) ** 0.4 * mt[2] ** 0.5); if (ty.vert) add(G3, 'Stairway, platforms and handrails', 1, 'lot', T.ladder * (H / 12) * (D / 25) ** 0.3);
  if (ty.vert && c.found === 'Yes') add(G4, 'Ring-wall, sand pad and bitumen sealing', Math.PI * D * D / 4, 'm²', T.foundPerM2 * (1 + D / 120)); if (!ty.vert && c.found === 'Yes') add(G4, 'Concrete saddle foundation', 1, 'lot', 180000 + c.cap * 1200);
  const sa = ty.vert ? Math.PI * D * H + Math.PI * D * D / 4 : Math.PI * D * (3 * D) + Math.PI * D * D / 2; add(G4, 'Surface preparation and painting', sa, 'm²', c.mat === 'cs' ? T.paint : T.paint * 0.15);
  const sub = lines.reduce((s, l) => s + l.amount, 0); add(G5, 'Hydrostatic and vacuum-box tests', 1, 'lot', sub * T.test + 120000);
  const { base, total, parts, pm } = finish(lines, T.stack), steelT = (shellKg + bottomKg + roofKg) / 1000;
  return { cfg: c, lines, parts, pm, base, total, D, H, steelT, shellKg, perM3: total / c.cap, meta: `${ty.label} · ${Number(c.cap).toLocaleString('en-IN')} m³ · ${mt[0]}`, pill: ty.vert ? 'Vertical' : 'Horizontal',
    metrics: [['Size', `${R2(D, 1)} m × ${R2(ty.vert ? H : 3 * D, 1)} m`], ['Steel', `${R2(steelT, 1)} t`], ['Steel per m³', `${R2(steelT * 1000 / c.cap, 1)} kg`], ['₹ per m³', `₹${Math.round(total / c.cap).toLocaleString('en-IN')}`]],
    facts: [['Capacity (m³)', c.cap], ...facts, ['Shell (t)', R2(shellKg / 1000, 1)], ['Total steel (t)', R2(steelT, 1)], ['Specific gravity', c.sg], ['Corrosion allowance (mm)', c.ca]] };
}
