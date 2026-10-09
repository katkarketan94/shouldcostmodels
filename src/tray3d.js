// 3D models of the cable-tray items (three.js), built from the same dimensions the cost model uses (mm).
import * as THREE from 'three';
import { KINDS } from './calcTray.js';

let galvMat;
function galvanised() {
  if (galvMat) return galvMat;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = '#c3cad3'; g.fillRect(0, 0, 256, 256);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) { // zinc spangle: soft polygonal patches
    const x = rnd() * 256, y = rnd() * 256, r = 6 + rnd() * 20, a = rnd() * 6.28;
    g.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '90,100,112'},${0.05 + rnd() * 0.09})`;
    g.beginPath(); for (let k = 0; k < 5; k++) { const t = a + (k / 5) * 6.28; g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r * (0.6 + rnd() * 0.4)); } g.fill();
  }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(0.004, 0.004); tex.colorSpace = THREE.SRGBColorSpace;
  galvMat = new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, metalness: 0.6, roughness: 0.42, side: THREE.DoubleSide });
  return galvMat;
}

// Sweeps a closed 2D outline [[u,v]...] along mapFn(u, v, s) for s in 0..1 and caps both ends.
function sweep(profile, segs, mapFn) {
  const n = profile.length, pos = [], idx = [];
  for (let i = 0; i <= segs; i++) for (const [u, v] of profile) { const p = mapFn(u, v, i / segs); pos.push(p.x, p.y, p.z); }
  for (let i = 0; i < segs; i++) for (let j = 0; j < n; j++) {
    const a = i * n + j, b = i * n + ((j + 1) % n), c = (i + 1) * n + ((j + 1) % n), d = (i + 1) * n + j;
    idx.push(a, b, d, b, c, d);
  }
  const tri = THREE.ShapeUtils.triangulateShape(profile.map(([u, v]) => new THREE.Vector2(u, v)), []);
  for (const [a, b, c] of tri) { idx.push(a, c, b); idx.push(segs * n + a, segs * n + b, segs * n + c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  const m = new THREE.Mesh(ng, galvanised()); m.castShadow = true; m.receiveShadow = true; return m;
}

// Paths: pos/tan/lat/up frames, lat runs left -> right across the tray
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const linePath = (x0, z0, a, len) => (s) => {
  const d = V(Math.cos(a), 0, Math.sin(a));
  return { pos: V(x0, 0, z0).addScaledVector(d, s * len), tan: d, lat: V(-Math.sin(a), 0, Math.cos(a)), up: V(0, 1, 0) };
};
const arcPath = (R, mode) => (s) => {
  const a = s * Math.PI / 2, sa = Math.sin(a), ca = Math.cos(a);
  if (mode === 'h') return { pos: V(R * sa, 0, R * (1 - ca)), tan: V(ca, 0, sa), lat: V(-sa, 0, ca), up: V(0, 1, 0) };
  const sign = mode === 'vup' ? 1 : -1;
  return { pos: V(R * sa, sign * R * (1 - ca), 0), tan: V(ca, sign * sa, 0), lat: V(0, 0, 1), up: V(-sign * sa, ca, 0) };
};

function railProfile(side, W, D, t, c) { // side -1 left, +1 right; C opening inwards
  const u0 = -W / 2 - t, f = c > 0 ? c : t;
  const pts = c > 0
    ? [[u0, 0], [u0 + f, 0], [u0 + f, t], [u0 + t, t], [u0 + t, D - t], [u0 + f, D - t], [u0 + f, D], [u0, D]]
    : [[u0, 0], [u0 + t, 0], [u0 + t, D], [u0, D]];
  return side < 0 ? pts : pts.map(([u, v]) => [-u, v]).reverse();
}

function rail(path, s0, s1, side, W, D, t, c, segs) {
  const prof = railProfile(side, W, D, t, c);
  return sweep(prof, segs, (u, v, s) => { const f = path(s0 + (s1 - s0) * s); return f.pos.clone().addScaledVector(f.lat, u).addScaledVector(f.up, v); });
}

function rungAt(path, s, W, t, p) {
  const w = p.rungWidth, h = p.rungHeight, rt = p.rungThk;
  const hat = [[-w / 2, 0], [w / 2, 0], [w / 2, h], [w / 2 - rt, h], [w / 2 - rt, rt], [-w / 2 + rt, rt], [-w / 2 + rt, h], [-w / 2, h]];
  const f = path(s);
  return sweep(hat, 1, (a, v, q) => f.pos.clone().addScaledVector(f.lat, -W / 2 + q * W).addScaledVector(f.tan, a).addScaledVector(f.up, v));
}

function ladderRun(g, path, len, W, D, t, p, opt = {}) {
  const segs = opt.segs ?? 1, c = p.collar;
  const rails = opt.rails ?? { l: [[0, 1]], r: [[0, 1]] };
  for (const [a, b] of rails.l) g.add(rail(path, a, b, -1, W, D, t, c, segs));
  for (const [a, b] of rails.r) g.add(rail(path, a, b, 1, W, D, t, c, segs));
  const n = opt.rungs ?? Math.max(2, Math.round(len / 250));
  for (let i = 0; i < n; i++) g.add(rungAt(path, opt.rungsAtEnds ? i / (n - 1) : (i + 0.5) / n, W, t, p));
}

function perforatedPlate(L, W, t, A, rows, g) {
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, -W / 2); sh.lineTo(L / 2, -W / 2); sh.lineTo(L / 2, W / 2); sh.lineTo(-L / 2, W / 2); sh.closePath();
  const hx = A.perfLen / 2, hz = A.perfWid / 2;
  for (let r = 0; r < rows; r++) for (let j = 0; j < A.perfPerRow; j++) {
    const x = -L / 2 + (r + 1) * A.spacing, z = -W / 2 + (j + 0.5) * (W / A.perfPerRow);
    if (x + hx > L / 2) continue;
    const h = new THREE.Path(); h.moveTo(x - hx, z - hz); h.lineTo(x - hx, z + hz); h.lineTo(x + hx, z + hz); h.lineTo(x + hx, z - hz); h.closePath(); sh.holes.push(h);
  }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, galvanised()); m.castShadow = m.receiveShadow = true; g.add(m);
}

function strut(g, L, W, D, t, T) {
  const A = T.channel, lip = A.lip;
  const leg = (side) => { const pts = [[-W / 2, 0], [-W / 2 + t, 0], [-W / 2 + t, D - t], [-W / 2 + lip, D - t], [-W / 2 + lip, D], [-W / 2, D]];
    return side < 0 ? pts : pts.map(([u, v]) => [-u, v]).reverse(); };
  for (const side of [-1, 1]) g.add(sweep(leg(side), 1, (u, v, s) => V(-L / 2 + s * L, v, u)));
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, -W / 2); sh.lineTo(L / 2, -W / 2); sh.lineTo(L / 2, W / 2); sh.lineTo(-L / 2, W / 2); sh.closePath();
  const n = Math.floor(L / A.pitch + 1e-9);
  for (let i = 0; i < n; i++) { const x = -L / 2 + (i + 0.5) * A.pitch, hx = A.slotLen / 2, hz = A.slotWidth / 2;
    const h = new THREE.Path(); h.moveTo(x - hx, -hz); h.lineTo(x - hx, hz); h.lineTo(x + hx, hz); h.lineTo(x + hx, -hz); h.closePath(); sh.holes.push(h); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(geo, galvanised()); m.castShadow = m.receiveShadow = true; g.add(m);
}

export function buildTray3D(r, T) {
  const { cfg } = r, kind = cfg.kind, W = cfg.width, D = cfg.depth, t = cfg.thk, L = r.length;
  const g = new THREE.Group();
  const lad = T.ladder;
  if (kind === 'ladder') {
    const path = linePath(-L / 2, 0, 0, L);
    ladderRun(g, path, L, W, D, t, lad, { rungs: lad.rungsPer2500, rungsAtEnds: false });
  } else if (kind === 'perf' || kind === 'trough') {
    const A = T[kind], c = kind === 'perf' && W >= 300 && D >= 100 ? 15 : 0;
    const rows = Math.ceil(L / A.spacing - 1 - 1e-9);
    perforatedPlate(L, W, t, A, rows, g);
    for (const side of [-1, 1]) g.add(sweep(railProfile(side, W, D, t, c), 1, (u, v, s) => V(-L / 2 + s * L, v, u)));
  } else if (kind === 'hbend' || kind === 'vup' || kind === 'vdown') {
    const R = kind === 'hbend' ? 1200 : 1050, path = arcPath(R, kind === 'hbend' ? 'h' : kind);
    ladderRun(g, path, R * Math.PI / 2, W, D, t, lad, { segs: 28, rungs: 8 });
  } else if (kind === 'tee') {
    const A = 1200, gap = (W / 2 + t) / (2 * A), main = linePath(-A, 0, 0, 2 * A);
    ladderRun(g, main, 2 * A, W, D, t, lad, { rails: { l: [[0, 1]], r: [[0, 0.5 - gap], [0.5 + gap, 1]] }, rungs: 9, rungsAtEnds: true });
    const branch = linePath(0, W / 2 + t, Math.PI / 2, A);
    ladderRun(g, branch, A, W, D, t, lad, { rungs: 4 });
  } else if (kind === 'cross') {
    const A = 1200, off = W / 2 + t;
    for (let q = 0; q < 4; q++) ladderRun(g, linePath(Math.cos(q * Math.PI / 2) * off, Math.sin(q * Math.PI / 2) * off, q * Math.PI / 2, A), A, W, D, t, lad, { rungs: 4 });
  } else if (kind === 'channel' || kind === 'arm') {
    strut(g, L, W, D, t, T);
  }
  const box = new THREE.Box3().setFromObject(g); const sz = box.getSize(new THREE.Vector3());
  const k = 5 / Math.max(sz.x, sz.z, sz.y);
  g.scale.setScalar(k);
  g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; // sit on the floor
  return g;
}

export const isFlat = (kind) => KINDS[kind].fitting && kind !== 'vup' && kind !== 'vdown';
