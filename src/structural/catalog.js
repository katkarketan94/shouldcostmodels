// Section catalogues and member-sizing helpers (SI: mm, kg/m, cm³, cm⁴). Used only for the preliminary takeoff.
export const RHO = 7850;                       // kg/m³
export const FY = { E250: 250, E350: 345 };    // MPa
export const GAMMA_M0 = 1.1;

// Rolled sections (IS 808): name, depth h, flange b, mass kg/m, Zxx cm³, Ixx cm⁴, ry cm, area cm²
export const ISMB = [
  ['ISMB 150', 150, 80, 14.9, 96.9, 726, 1.7, 19.0], ['ISMB 175', 175, 90, 19.3, 145.4, 1272, 1.9, 24.6], ['ISMB 200', 200, 100, 25.4, 223.5, 2235, 2.2, 32.3],
  ['ISMB 250', 250, 125, 37.3, 410.5, 5132, 2.8, 47.5], ['ISMB 300', 300, 140, 44.2, 573.6, 8603, 3.0, 56.3], ['ISMB 350', 350, 140, 52.4, 778.9, 13630, 3.1, 66.7],
  ['ISMB 400', 400, 140, 61.6, 1022.9, 20458, 3.0, 78.5], ['ISMB 450', 450, 150, 72.4, 1350.7, 30390, 3.3, 92.3], ['ISMB 500', 500, 180, 86.9, 1808.7, 45218, 4.0, 110.7],
  ['ISMB 550', 550, 190, 103.7, 2359.8, 64894, 4.2, 132.1], ['ISMB 600', 600, 210, 122.6, 3060.4, 91813, 4.7, 156.2],
].map(([name, h, b, kg, Z, I, ry, A]) => ({ name, h, b, kg, Z, I, ry, A, perim: 2 * (h + 2 * b) / 1000, kind: 'ismb' }));

export const ISHB = [
  ['ISHB 200', 200, 200, 37.3, 311, 3608, 4.7, 47.5], ['ISHB 225', 225, 225, 43.1, 394, 5280, 5.2, 54.9], ['ISHB 250', 250, 250, 51.0, 540, 7737, 5.9, 65.0],
  ['ISHB 300', 300, 250, 58.8, 736, 11350, 6.3, 74.9], ['ISHB 350', 350, 250, 67.4, 956, 16720, 6.2, 85.9], ['ISHB 400', 400, 250, 77.4, 1192, 23160, 6.1, 98.7],
  ['ISHB 450', 450, 250, 87.2, 1460, 33000, 6.1, 111.1],
].map(([name, h, b, kg, Z, I, ry, A]) => ({ name, h, b, kg, Z, I, ry, A, perim: 2 * (h + 2 * b) / 1000, kind: 'ishb' }));

export const ANGLES = [ // equal angles: name, mass kg/m
  ['ISA 65×65×6', 5.8], ['ISA 75×75×6', 6.8], ['ISA 90×90×8', 10.8], ['ISA 100×100×8', 12.1], ['ISA 130×130×10', 19.7], ['ISA 150×150×12', 27.3],
].map(([name, kg]) => ({ name, kg, perim: 0.4 }));
export const angleFor = (len) => (len < 3 ? ANGLES[1] : len < 5 ? ANGLES[3] : len < 7 ? ANGLES[4] : ANGLES[5]);

// Cold-formed Z purlin / girt: [maxSpan m, name, kg/m]
export const ZSEC = [[6, 'Z200×2.0', 4.9], [8, 'Z250×2.0', 5.9], [10, 'Z300×2.5', 8.9], [12, 'Z350×2.5', 10.2], [99, 'Z400×3.0', 13.4]];
export const zFor = (span, step = 0) => { let i = ZSEC.findIndex((z) => span <= z[0]); i = Math.min(ZSEC.length - 1, i + step); return { name: ZSEC[i][1], kg: ZSEC[i][2], perim: 0.75 }; };

// Rectangular hollow sections generated on a grid of sizes
function genRHS() {
  const out = [];
  for (const h of [80, 100, 120, 150, 180, 200, 250, 300, 350, 400]) for (const r of [0.5, 0.4]) {
    const b = Math.round(h * r / 10) * 10;
    for (const t of [3, 4, 5, 6, 8, 10, 12]) {
      if (t * 2 >= b * 0.5 || h / t > 55) continue;
      const A = h * b - (h - 2 * t) * (b - 2 * t);
      const I = (b * h ** 3 - (b - 2 * t) * (h - 2 * t) ** 3) / 12, Iy = (h * b ** 3 - (h - 2 * t) * (b - 2 * t) ** 3) / 12;
      out.push({ name: `RHS ${h}×${b}×${t}`, h, b, t, kg: A * RHO * 1e-6, Z: I / (h / 2) / 1e3, I: I / 1e4, Zy: Iy / (b / 2) / 1e3, Iy: Iy / 1e4, A: A / 100, perim: 2 * (h + b) / 1000, kind: 'rhs' });
    }
  }
  return out.sort((a, b) => a.kg - b.kg);
}
export const RHS = genRHS();

/** lightest catalogue section meeting Z (cm³) and I (cm⁴); returns null if none */
export function lightest(list, Zreq, Ireq = 0, key = 'Z', ikey = 'I') {
  const ok = list.filter((s) => s[key] >= Zreq && s[ikey] >= Ireq);
  return ok.length ? ok.reduce((a, b) => (b.kg < a.kg ? b : a)) : null;
}

/** Welded I-section for a required Z (cm³) at depth d (mm): returns geometry and mass */
export function builtUp(Zreq, d, fy = 345) {
  let depth = d;
  for (let k = 0; k < 40; k++) {
    const tw = Math.max(5, Math.round(depth / 150));
    const bf = Math.min(450, Math.max(150, Math.round(depth * 0.32 / 10) * 10));
    let tf = Math.max(8, Math.ceil(bf / 23)), ok = false;
    for (; tf <= 40; tf += 1) {
      const I = (bf * depth ** 3 - (bf - tw) * (depth - 2 * tf) ** 3) / 12;
      if (I / (depth / 2) / 1e3 >= Zreq) { ok = true; break; }
    }
    if (ok) {
      const A = 2 * bf * tf + (depth - 2 * tf) * tw;
      return { d: depth, bf, tf, tw, kg: A * RHO * 1e-6, A: A / 100, perim: (4 * bf + 2 * depth - 2 * tw) / 1000, kind: 'builtup', name: `${depth}×${bf}×${tf}/${tw}` };
    }
    depth += 50;
  }
  return null;
}
