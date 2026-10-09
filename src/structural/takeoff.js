// Parametric structures -> preliminary steel takeoff. Member sizes come from simplified sizing rules (documented in each
// template's `notes`); every group weight can be overridden in the UI with a figure from the actual drawings.
import { RHO, ISMB, ISHB, RHS, ANGLES, lightest, builtUp, zFor } from './catalog.js';

const FYD = { E250: 250 / 1.1, E350: 345 / 1.1 };       // design strength, MPa
const zReq = (M_kNm, fyd) => (M_kNm * 1e3) / fyd;        // cm³ from kN·m and MPa
const deg = (r) => (r * 180) / Math.PI;
const r1 = (x) => Math.round(x * 10) / 10;
// required I (cm⁴) for a simply supported member: w in kN/m (= N/mm), span in m, deflection limit span/ratio
const iReq = (w, L, ratio) => (5 * w * (L * 1000) ** 4) / (384 * 210000 * (L * 1000 / ratio)) / 1e4;
const brace = (len, lim = 9) => (len < lim ? ANGLES[1] : len < lim + 3 ? ANGLES[2] : ANGLES[3]);
const G = (id, name, section, qty, kg, area, o = {}) => ({ id, name, section, qty, kg, area, type: 'hotroll', grade: 'E250', weld: 'low', cls: 'heavy', ...o });

/* ============================== PEB factory ============================== */
function peb(p) {
  const S = p.span, Lt = p.length, nb = Math.max(1, Math.round(Lt / p.bay)), B = Lt / nb, nf = nb + 1, H = p.eave;
  const th = Math.atan(1 / p.slope), rise = S / 2 / p.slope, raf = S / 2 / Math.cos(th);
  const pz = 0.6 * p.wind ** 2 / 1000;                    // kN/m² design wind pressure
  const wu = 1.5 * (0.25 + p.live) * B;                   // kN/m factored roof UDL per frame
  const Mk = (wu * S * S) / 11, Mr = (wu * S * S) / 16;
  const Mw = 1.5 * 0.6 * pz * B * H * H / 2;
  const Rcol = p.crane > 0 ? 9 * p.crane + 35 : 0;
  const Mcr = 1.5 * 1.25 * Rcol * 0.55;
  const N = (wu * S) / 2 + 12 + 1.5 * Rcol;
  const dk = Math.min(1200, Math.max(450, Math.round(S * 1000 / 32 / 50) * 50));
  const fyd = FYD.E350;
  const rafK = builtUp(zReq(Mk, fyd), dk), rafM = builtUp(zReq(Mr, fyd), Math.max(300, Math.round(dk * 0.55 / 50) * 50));
  const Mc = Math.max(Mk, Mw) + Mcr + 0.12 * N * (dk / 1000);
  const colT = builtUp(zReq(Mc, fyd), dk), colB = builtUp(zReq(0.18 * Mc, fyd), Math.max(300, Math.round(dk * 0.45 / 50) * 50));
  const rafKg = 2 * raf * (0.3 * rafK.kg + 0.7 * rafM.kg) * nf;
  const colKg = 2 * H * (0.55 * colT.kg + 0.45 * colB.kg) * nf;
  const plate = 1.08;                                     // splice / end-plate / stiffener allowance
  const bpT = Math.min(40, Math.max(20, Math.round(16 + N / 35)));
  const bpKg = 2 * nf * ((colT.d + 120) * (colT.bf + 120) * bpT * RHO * 1e-9);
  const frameArea = (2 * raf * (0.3 * rafK.perim + 0.7 * rafM.perim) + 2 * H * (0.55 * colT.perim + 0.45 * colB.perim)) * nf;
  const g = [];
  g.push(G('cols', 'Main frame columns', `${colT.name} (top) → ${colB.name} (base), tapered`, `${2 * nf} nos × ${H} m`, colKg * plate, (2 * H * (0.55 * colT.perim + 0.45 * colB.perim)) * nf, { type: 'builtup', grade: 'E350', weld: 'mod' }));
  g.push(G('rafters', 'Main frame rafters', `${rafK.name} (knee) → ${rafM.name} (ridge), tapered`, `${2 * nf} nos × ${r1(raf)} m`, rafKg * plate, 2 * raf * (0.3 * rafK.perim + 0.7 * rafM.perim) * nf, { type: 'builtup', grade: 'E350', weld: 'mod' }));
  g.push(G('baseplates', 'Base plates', `${colT.d + 120}×${colT.bf + 120}×${bpT} mm`, `${2 * nf} nos`, bpKg, 2 * nf * 2 * ((colT.d + 120 + colT.bf + 120) / 1000) * 0.2, { type: 'hotroll', grade: 'E250', weld: 'mod' }));
  // crane
  let cr = null;
  if (p.crane > 0) {
    const wheel = Rcol / 2, Mg = 1.5 * 1.25 * wheel * Math.max(B - 1.5, B * 0.4) ** 2 / (2 * B);
    cr = builtUp(zReq(Mg, FYD.E350), Math.min(1400, Math.max(400, Math.round(B * 1000 / 12 / 50) * 50)));
    const gl = 2 * nb * (B + 0.2);
    g.push(G('cranegirders', 'Crane runway girders', `${cr.name} + surge plate`, `${2 * nb} nos × ${r1(B + 0.2)} m`, gl * cr.kg * 1.12, gl * cr.perim * 1.1, { type: 'builtup', grade: 'E350', weld: 'heavy' }));
    g.push(G('cranebrackets', 'Crane brackets & stoppers', 'Built-up corbels', `${2 * nf} nos`, 2 * nf * (30 + 0.45 * Rcol), 2 * nf * 1.4, { type: 'builtup', grade: 'E350', weld: 'heavy' }));
    g.push(G('cranerail', 'Crane rails', 'Rail 45 kg/m', `${r1(2 * Lt)} m`, 2 * Lt * 45, 2 * Lt * 0.35, { type: 'hotroll', weld: 'low' }));
  }
  // secondary
  const nLines = Math.ceil(raf / 1.5), pStep = (p.wind > 50 || p.live > 1) ? 1 : 0;
  const pz_ = zFor(B, pStep);
  const purlinLen = 2 * (nLines + 1) * Lt * 1.1;
  g.push(G('purlins', 'Roof purlins', `${pz_.name} at ${r1(raf / nLines)} m c/c`, `${2 * (nLines + 1)} lines × ${r1(Lt)} m`, purlinLen * pz_.kg, purlinLen * pz_.perim, { cls: 'light' }));
  const rows = Math.ceil(H / 1.8), girtLen = (2 * Lt + 2 * S) * rows * 1.1, gz = zFor(B, pStep);
  g.push(G('girts', 'Wall girts', `${gz.name}, ${rows} rows`, `${r1(girtLen)} m`, girtLen * gz.kg, girtLen * gz.perim, { cls: 'light' }));
  g.push(G('eave', 'Eave & ridge struts', 'C-section 8 kg/m', `${r1(2 * Lt + Lt)} m`, 3 * Lt * 8, 3 * Lt * 0.6, { cls: 'light' }));
  const braced = Math.max(2, Math.ceil(nb / 5)), a = brace(Math.hypot(B, raf), 10);
  const diag = braced * (2 * 2 * Math.hypot(B, raf) + 2 * 2 * Math.hypot(B, H)) * 1.08;
  g.push(G('bracing', 'Roof & wall X-bracing', `${a.name}`, `${braced} braced bays`, diag * a.kg, diag * a.perim, { cls: 'light' }));
  g.push(G('sag', 'Sag rods, clips & misc.', 'Rods / small plates', '', 0.35 * 2 * raf * Lt + 0.1 * (2 * Lt * H), 0.1 * (2 * raf * Lt), { cls: 'light' }));
  if (p.mezz > 0) g.push(G('mezz', 'Mezzanine floor framing', 'ISMB primary + secondary beams, columns', `${p.mezz} m²`, p.mezz * 32, p.mezz * 32 * 0.026, { weld: 'mod' }));
  return {
    groups: g, area: S * Lt, areaLabel: 'covered area', unitArea: 'm²',
    dims: { S, Lt, nb, B, nf, H, rise, raf, crane: p.crane, dk, colT, colB, rafK, rafM, cr, wu, mezz: p.mezz },
    notes: [`Wind pressure ${r1(pz * 1000) / 1000} kN/m², factored roof load ${r1(wu)} kN/m per frame.`, `Knee moment ${Math.round(Mk)} kN·m (wuS²/11), rafter mid ${Math.round(Mr)} kN·m (wuS²/16).`,
      p.crane > 0 ? `Crane ${p.crane} t: wheel load ${Math.round(Rcol)} kN per column, corbel moment ${Math.round(Mcr)} kN·m.` : 'No crane.',
      'Frames are sized as tapered welded I-sections at 345 MPa (design strength 314 MPa); purlins and girts are cold-formed Z sections.'],
    bolts: 0.025,
  };
}

/* ================================ Pipe rack ================================ */
function rack(p) {
  const Lr = p.length, Wr = p.width, nb = Math.max(1, Math.round(Lr / p.bay)), B = Lr / nb, nf = nb + 1, nt = p.tiers;
  const Ht = p.tierGap, H1 = p.firstTier, Hc = H1 + (nt - 1) * Ht + 0.6;
  const cols = Wr > 9 ? 3 : 2;
  const fyd = FYD.E250, q = p.load;
  const g = [];
  // cross beams (one per tier per frame), simply supported on columns
  const qLine = q * B * 1.5 + 0.8;
  const spanB = Wr / (cols - 1);
  const Mb = (qLine * spanB * spanB) / 8 * (cols === 3 ? 1.1 : 1);
  const bm = lightest(ISMB, zReq(Mb, fyd), iReq(qLine / 1.5, spanB, 325)) || builtUp(zReq(Mb, fyd), Math.round(spanB * 1000 / 18 / 50) * 50);
  const beamLen = nt * nf * Wr;
  g.push(G('xbeams', 'Cross beams (per tier)', `${bm.name}`, `${nt * nf} nos × ${r1(Wr)} m`, beamLen * bm.kg * 1.04, beamLen * bm.perim, bm.kind === 'builtup' ? { type: 'builtup', grade: 'E350', weld: 'heavy' } : { weld: 'mod' }));
  // stringers (longitudinal pipe-support beams)
  const nl = Math.max(2, Math.round(Wr / 2) + 1), qL = q * (Wr / (nl - 1)) * 1.5 + 0.4;
  const Ml = (qL * B * B) / 8, st = lightest(ISMB, zReq(Ml, fyd), iReq(qL / 1.5, B, 325)) || ISMB[ISMB.length - 1];
  const stLen = nt * nl * Lr;
  g.push(G('stringers', 'Longitudinal stringers', `${st.name}`, `${nt * nl} lines × ${r1(Lr)} m`, stLen * st.kg * 1.03, stLen * st.perim, { weld: 'low' }));
  // columns
  const Ncol = (1.5 * nt * q * B * Wr) / cols + 1.2 * Hc * 60 / 10;
  let colSec = null;
  for (const s of ISHB) {
    const lam = (Hc * 100) / s.ry, sig = fyd / (1 + (lam / 105) ** 2), cap = sig * s.A * 100 / 1000;     // kN
    if (cap >= 1.3 * Ncol) { colSec = s; break; }
  }
  colSec = colSec || ISHB[ISHB.length - 1];
  const nCol = cols * nf, colLen = nCol * Hc;
  g.push(G('columns', 'Columns', `${colSec.name}`, `${nCol} nos × ${r1(Hc)} m`, colLen * colSec.kg, colLen * colSec.perim, { weld: 'mod' }));
  g.push(G('baseplates', 'Base plates & cap plates', '500×500×28 mm + 10 mm caps', `${nCol} nos`, nCol * (500 * 500 * 28 * RHO * 1e-9 + 500 * 500 * 10 * RHO * 1e-9), nCol * 1.1, { weld: 'mod' }));
  // bracing
  const braced = Math.max(2, Math.ceil(nb / 4)), vb = brace(Math.hypot(B, Ht), 7.5);
  const vLen = braced * 2 * cols * nt * 2 * Math.hypot(B, Ht) * 0.6 + braced * 2 * 2 * Math.hypot(B, Hc - 0) * 0.0;
  g.push(G('vbrace', 'Vertical bracing (braced bays)', `${vb.name}`, `${braced} bays × ${cols} lines × ${nt} tiers`, vLen * vb.kg * 1.06, vLen * vb.perim, { cls: 'light' }));
  const hb = brace(Math.hypot(B, Wr), 9), hLen = braced * 2 * Math.hypot(B, Wr);
  g.push(G('hbrace', 'Plan bracing (top tier)', `${hb.name}`, `${braced} bays`, hLen * hb.kg, hLen * hb.perim, { cls: 'light' }));
  const slp = Lr * Wr * nt * 6;
  g.push(G('sleepers', 'Pipe sleepers & supports', 'ISMC 100 / angles at 1.5 m', `${nt} tiers`, slp, slp * 0.032, { cls: 'light' }));
  const subtotal = g.reduce((a, x) => a + x.kg, 0);
  g.push(G('access', 'Ladders, platforms & misc. (3%)', 'Allowance', '', subtotal * 0.03, subtotal * 0.03 * 0.03 * 1000 / 1000, { cls: 'light' }));
  return {
    groups: g, area: Lr * Wr, areaLabel: 'rack plan area', unitArea: 'm²', lengthBased: Lr,
    dims: { Lr, Wr, nb, B, nf, nt, Ht, H1, Hc, cols, colSec, bm, st, nl },
    notes: [`Cross beam ${bm.name} for ${r1(qLine)} kN/m over ${r1(spanB)} m (M = ${Math.round(Mb)} kN·m).`, `Column ${colSec.name} for ${Math.round(Ncol)} kN per column over ${r1(Hc)} m.`, 'Rolled sections at 250 MPa. Pipe loads are the user figure (kN/m² per tier) times 1.5.'],
    bolts: 0.02,
  };
}

/* ================================== Façade ================================= */
function facade(p) {
  const W = p.width, Ht = p.height, Bm = p.module, Hf = p.floor, pw = p.wind, off = p.standoff / 1000;
  const nm = Math.max(2, Math.round(W / Bm) + 1), floors = Math.max(1, Math.ceil(Ht / Hf));
  const wch = pw * Bm;                                     // kN/m char wind on a mullion
  const Mm = (1.5 * wch * Hf * Hf) / 8, Ireq = iReq(wch, Hf, 175);
  const mull = lightest(RHS, zReq(Mm, FYD.E350), Ireq) || RHS[RHS.length - 1];
  const mLen = nm * Ht * 1.03;
  const rows = floors + 1 + Math.max(0, Math.round(Hf / p.glazing) - 1) * floors;
  const wT = 1.5 * pw * p.glazing, vT = 1.35 * 0.5 * p.glazing;     // horizontal (wind) and vertical (glass) line loads, kN/m
  const Mt = Math.hypot((wT * Bm * Bm) / 8, (vT * Bm * Bm) / 8);
  const It = iReq(Math.max(pw * p.glazing, 0.5 * p.glazing), Bm, 250);
  const tran = lightest(RHS, zReq(Mt, FYD.E350), It) || RHS[RHS.length - 1];
  const tLen = rows * (nm - 1) * Bm;
  const brk = nm * (floors + 1), bkg = 8 + 18 * off;
  const g = [];
  g.push(G('mullions', 'Mullions (vertical)', `${mull.name}`, `${nm} lines × ${r1(Ht)} m`, mLen * mull.kg, mLen * mull.perim, { type: 'hollow', grade: 'E350', weld: 'low', cls: 'light' }));
  g.push(G('transoms', 'Transoms (horizontal)', `${tran.name}`, `${rows} rows × ${nm - 1} bays`, tLen * tran.kg, tLen * tran.perim, { type: 'hollow', grade: 'E350', weld: 'low', cls: 'light' }));
  g.push(G('brackets', 'Fixing brackets & outriggers', `${Math.round(off * 1000)} mm stand-off, welded plate/angle`, `${brk} nos`, brk * bkg, brk * (0.35 + off), { type: 'hotroll', weld: 'mod', cls: 'light' }));
  g.push(G('splice', 'Splice sleeves, cleats & cover plates', 'Allowance (4%)', '', (mLen * mull.kg + tLen * tran.kg) * 0.04, 0.5, { type: 'hotroll', weld: 'low', cls: 'light' }));
  return {
    groups: g, area: W * Ht, areaLabel: 'facade area', unitArea: 'm²',
    dims: { W, Ht, Bm, Hf, nm, floors, rows, mull, tran, off, glazing: p.glazing },
    notes: [`Mullion ${mull.name}: wind ${pw} kPa on ${Bm} m module over ${Hf} m (M = ${Math.round(Mm)} kN·m, deflection L/175).`, `Transom ${tran.name}: wind and glass weight (0.5 kPa) over ${Bm} m.`, 'Hollow sections are fabricated on the hot-roll bay at 1.5× the hot-roll effort, as the workbook notes.'],
    bolts: 0.03,
  };
}

/* ============================ Large-diameter pipe ========================== */
function pipe(p) {
  const D = p.diameter, L = p.length, t = p.thickness / 1000, Ls = p.spool;
  const shell = Math.PI * (D + t) * t * L * RHO * 1.02;
  const nSp = Math.max(1, Math.ceil(L / Ls));
  // stiffener rings: flat bar rings welded outside
  const rgS = p.ringSpacing, nr = rgS > 0 ? Math.max(0, Math.floor(L / rgS)) : 0;
  const web = Math.max(100, Math.round(D * 1000 / 25 / 10) * 10), rt = Math.max(10, Math.round(web / 9 / 2) * 2);
  const ringKg = nr * Math.PI * (D + t + web / 1000) * (web / 1000) * (rt / 1000) * RHO;
  // flanges at each spool joint (both faces of a joint share two flanges)
  const fl = p.flange / 1000, fw = Math.max(0.12, D * 0.04);
  const nFl = p.joint === 'flanged' ? 2 * (nSp + 1) : 2;
  const flKg = nFl * Math.PI * (D + t + fw) * fw * fl * RHO;
  const nSup = Math.ceil(L / Ls) + 1, supKg = nSup * (90 * D * D + 60 * D);
  const mhKg = p.manholes * 320;
  const area = 2 * Math.PI * D * L + nr * 2 * Math.PI * D * (web / 1000) * 2;
  const g = [];
  g.push(G('shell', 'Rolled shell plate', `${p.thickness} mm plate, ID ${D} m`, `${nSp} spools × ${Math.min(Ls, L)} m`, shell, 2 * Math.PI * D * L, { type: 'plate', grade: 'E350', weld: 'heavy' }));
  if (nr > 0) g.push(G('rings', 'Stiffener rings', `${web}×${rt} mm flat ring`, `${nr} nos @ ${rgS} m`, ringKg, nr * 2 * Math.PI * D * (web / 1000) * 2, { type: 'plate', grade: 'E350', weld: 'heavy' }));
  g.push(G('flanges', p.joint === 'flanged' ? 'Joint flanges' : 'End flanges', `${p.flange} mm × ${Math.round(fw * 1000)} mm ring`, `${nFl} nos`, flKg, nFl * 2 * Math.PI * D * fw, { type: 'plate', grade: 'E350', weld: 'heavy' }));
  g.push(G('saddles', 'Saddle / ring-girder supports', 'Fabricated plate saddles', `${nSup} nos`, supKg, nSup * 6 * D, { type: 'builtup', grade: 'E350', weld: 'heavy' }));
  if (p.manholes > 0) g.push(G('manholes', 'Manholes & nozzles', '600 NB neck, cover, reinforcement', `${p.manholes} nos`, mhKg, p.manholes * 1.6, { type: 'plate', grade: 'E350', weld: 'heavy' }));
  const tReq = (p.pressure * 0.1 * D * 1000) / (2 * 138 * 0.85) + 1.5;
  return {
    groups: g, area: L, areaLabel: 'pipe length', unitArea: 'm', lengthBased: L,
    dims: { D, L, t, nSp, nr, web, rt, fl, fw, nSup, nFl, manholes: p.manholes, joint: p.joint, Ls },
    notes: [`Hoop check: ${p.pressure} bar needs about ${r1(tReq)} mm (S = 138 MPa, E = 0.85, 1.5 mm corrosion); you entered ${p.thickness} mm.`, `Weight ${Math.round(shell / L)} kg per metre of shell plate.`, 'Plate is rolled and welded on the bridge-and-girder bay (plate rolling machine), with heavy weld complexity.'],
    bolts: p.joint === 'flanged' ? 0.012 : 0.004,
    warn: p.thickness < tReq ? [`Plate is thinner than the ${r1(tReq)} mm the hoop check suggests.`] : [],
  };
}

/* ============================== Custom takeoff ============================= */
function custom(p) {
  const g = [];
  const rows = [['bu', 'Built-up members (columns, rafters, girders)', 'builtup', 'E350', 'mod', 'heavy'], ['hr', 'Hot-rolled sections (beams, channels, angles)', 'hotroll', 'E250', 'low', 'heavy'],
    ['ho', 'Hollow sections (SHS / RHS / pipe)', 'hollow', 'E350', 'low', 'light'], ['pl', 'Plate-rolled items (pipes, tanks, cylinders)', 'plate', 'E350', 'heavy', 'heavy'], ['lt', 'Light secondary (purlins, girts, bracing)', 'hotroll', 'E250', 'low', 'light']];
  for (const [k, name, type, grade, weld, cls] of rows) {
    const t = p[k] || 0; if (t <= 0) continue;
    g.push(G(k, name, 'As per drawings', `${t} t`, t * 1000, t * 1000 * (p.areaPerT || 25) / 1000, { type, grade, weld, cls }));
  }
  return { groups: g, area: 0, areaLabel: '', unitArea: '', dims: {}, notes: ['Enter the tonnage for each fabrication category from your drawings or BoQ. Paint area uses the m²/t entered below.'], bolts: 0.03 };
}

/* ================================ Registry ================================= */
const P = (k, l, u, v, min, max, step, o = {}) => ({ k, l, u, v, min, max, step, ...o });
export const TEMPLATES = {
  peb: {
    id: 'peb', name: 'Factory shed (PEB)', blurb: 'Portal frames, purlins, girts, bracing, optional crane and mezzanine', run: peb, erection: 26000,
    params: [P('span', 'Clear span', 'm', 30, 12, 60, 1), P('length', 'Building length', 'm', 60, 20, 240, 2), P('bay', 'Bay spacing', 'm', 7.5, 5, 12, 0.5), P('eave', 'Eave height', 'm', 9, 5, 25, 0.5),
      P('slope', 'Roof slope, 1 in', '', 10, 5, 20, 1), P('crane', 'EOT crane capacity', 't', 10, 0, 50, 5), P('wind', 'Basic wind speed', 'm/s', 44, 33, 55, 1), P('live', 'Roof live load', 'kN/m²', 0.75, 0.4, 1.5, 0.05), P('mezz', 'Mezzanine floor', 'm²', 0, 0, 3000, 50)],
  },
  rack: {
    id: 'rack', name: 'Pipe rack', blurb: 'Multi-tier portal frames with stringers and bracing', run: rack, erection: 26000,
    params: [P('length', 'Rack length', 'm', 120, 20, 600, 6), P('width', 'Rack width', 'm', 6, 2, 12, 0.5), P('bay', 'Bay spacing', 'm', 6, 4, 12, 0.5), P('tiers', 'Number of tiers', '', 2, 1, 4, 1),
      P('firstTier', 'Height of first tier', 'm', 4.5, 3, 8, 0.25), P('tierGap', 'Tier-to-tier gap', 'm', 1.8, 1.2, 3, 0.1), P('load', 'Pipe load per tier', 'kN/m²', 3.5, 1, 10, 0.25)],
  },
  facade: {
    id: 'facade', name: 'Façade framing', blurb: 'Steel mullions and transoms with fixing brackets', run: facade, erection: 26000,
    params: [P('width', 'Facade width', 'm', 60, 6, 300, 1), P('height', 'Facade height', 'm', 24, 3, 120, 0.5), P('module', 'Mullion spacing', 'm', 1.5, 0.9, 3, 0.1), P('floor', 'Floor-to-floor height', 'm', 4, 3, 6, 0.1),
      P('glazing', 'Transom spacing (glazing height)', 'm', 2, 1, 4, 0.1), P('wind', 'Design wind pressure', 'kPa', 1.5, 0.6, 3, 0.1), P('standoff', 'Bracket stand-off', 'mm', 400, 150, 900, 25)],
  },
  pipe: {
    id: 'pipe', name: 'Large-dia pipe', blurb: 'Rolled-plate pipe 1–6 m with rings, flanges and saddles', run: pipe, erection: 26000,
    params: [P('diameter', 'Inside diameter', 'm', 3.5, 1, 6, 0.1), P('length', 'Total length', 'm', 240, 12, 3000, 12), P('thickness', 'Shell plate thickness', 'mm', 14, 6, 50, 1), P('spool', 'Spool length', 'm', 12, 6, 24, 1),
      P('ringSpacing', 'Stiffener ring spacing (0 = none)', 'm', 3, 0, 12, 0.5), P('flange', 'Flange plate thickness', 'mm', 28, 12, 60, 2), P('manholes', 'Manholes', 'nos', 4, 0, 40, 1), P('pressure', 'Design pressure (check only)', 'bar', 6, 0, 30, 0.5),
      P('joint', 'Joint type', '', 'flanged', 0, 0, 0, { options: [['flanged', 'Flanged'], ['welded', 'Butt-welded']] })],
  },
  custom: {
    id: 'custom', name: 'Custom takeoff', blurb: 'Enter tonnage by fabrication category', run: custom, erection: 26000,
    params: [P('bu', 'Built-up members', 't', 400, 0, 50000, 10), P('hr', 'Hot-rolled sections', 't', 250, 0, 50000, 10), P('ho', 'Hollow sections', 't', 50, 0, 50000, 10), P('pl', 'Plate-rolled items', 't', 0, 0, 50000, 10), P('lt', 'Light secondary members', 't', 120, 0, 50000, 10), P('areaPerT', 'Paint area', 'm²/t', 30, 10, 60, 1)],
  },
};
export const defaultParams = (id) => Object.fromEntries(TEMPLATES[id].params.map((q) => [q.k, q.v]));
export function takeoff(id, params) {
  const t = TEMPLATES[id].run(params);
  t.groups.forEach((g) => { g.kg = Math.max(0, g.kg); });
  return t;
}
