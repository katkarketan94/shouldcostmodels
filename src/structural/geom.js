// Three.js models for the structure templates. Units are metres; every group is scaled to a common size at the end.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const mats = {};
const M = (key, color, o = {}) => (mats[key + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.5, side: THREE.DoubleSide, ...o }));
const COL = { frame: 0x2d6cb0, second: 0xbec5cf, crane: 0xe8a31c, rack: 0x44566b, rackBeam: 0x2f6f9f, brace: 0x8f99a6, mull: 0x3b4650, glass: 0x8fc4e8, shell: 0x7d8b99, ring: 0xb4533a, flange: 0x3c4856, saddle: 0x58606b, floor: 0xe3e6ea };

const add = (g, mesh) => { mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh; };
const box = (g, sx, sy, sz, x, y, z, m) => { const me = add(g, new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m)); me.position.set(x, y, z); return me; };
function cylBetween(g, a, b, r, m, seg = 8) {
  const d = b.clone().sub(a), len = d.length();
  const me = add(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg), m));
  me.position.copy(a.clone().add(b).multiplyScalar(0.5)); me.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return me;
}

/** I-section member from a to b with flanges along `lat`; depth tapers d0 -> d1 (metres) */
function iMember(g, a, b, lat, d0, d1, bf, tf, tw, m) {
  const axis = b.clone().sub(a), len = axis.length(); axis.normalize();
  const n = lat.clone().cross(axis).normalize();
  const prof = (d) => [[-bf / 2, -d / 2], [bf / 2, -d / 2], [bf / 2, -d / 2 + tf], [tw / 2, -d / 2 + tf], [tw / 2, d / 2 - tf], [bf / 2, d / 2 - tf], [bf / 2, d / 2], [-bf / 2, d / 2],
    [-bf / 2, d / 2 - tf], [-tw / 2, d / 2 - tf], [-tw / 2, -d / 2 + tf], [-bf / 2, -d / 2 + tf]];
  const rings = d0 === d1 ? [0, 1] : [0, 0.25, 0.5, 0.75, 1], pos = [], idx = [], N = 12;
  for (const s of rings) { const d = d0 + (d1 - d0) * s, c = a.clone().addScaledVector(axis, s * len); for (const [u, v] of prof(d)) pos.push(...c.clone().addScaledVector(lat, u).addScaledVector(n, v).toArray()); }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < N; j++) { const p = i * N + j, q = i * N + (j + 1) % N, r = (i + 1) * N + (j + 1) % N, s2 = (i + 1) * N + j; idx.push(p, q, s2, q, r, s2); }
  const tri = THREE.ShapeUtils.triangulateShape(prof(d0).map(([u, v]) => new THREE.Vector2(u, v)), []);
  for (const [i, j, k] of tri) { idx.push(i, k, j); idx.push((rings.length - 1) * N + i, (rings.length - 1) * N + j, (rings.length - 1) * N + k); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  const ng = geo.toNonIndexed(); ng.computeVertexNormals();
  return add(g, new THREE.Mesh(ng, m));
}

function finish(g, target = 6.5) {
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(V(0, 0, 0));
  const k = target / Math.max(sz.x, sz.y * 1.3, sz.z);
  g.scale.setScalar(k); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2; g.position.z -= (b2.min.z + b2.max.z) / 2;
  return g;
}

/* ================================= PEB ================================= */
function buildPeb(d, opt) {
  const g = new THREE.Group(), { S, nb: nbAll, B, H, rise, raf, crane, colT, colB = d.colT, rafK, rafM, cr } = d;
  const nb = Math.min(nbAll, 10), Lt = nb * B; g.userData.note = nbAll > nb ? `Showing ${nb} of ${nbAll} bays` : '';
  const frame = M('frame', COL.frame), sec = M('second', COL.second, { metalness: 0.7, roughness: 0.4 }), cm = M('crane', COL.crane);
  const lat = V(1, 0, 0);
  const sec_ = (s) => [s.d / 1000, s.bf / 1000, s.tf / 1000, s.tw / 1000];
  const [cd, cb, ctf, ctw] = sec_(colT), [rd, rb, rtf, rtw] = sec_(rafK);
  for (let i = 0; i <= nb; i++) {
    const x = i * B;
    for (const sgn of [-1, 1]) {
      iMember(g, V(x, 0, sgn * S / 2), V(x, H, sgn * S / 2), lat, Math.max(0.3, cd * 0.45), cd, cb, ctf, ctw, frame);
      iMember(g, V(x, H, sgn * S / 2), V(x, H + rise, 0), lat, rd, Math.max(0.3, rd * 0.55), rb, rtf, rtw, frame);
    }
  }
  // purlins & girts
  const nLines = Math.ceil(raf / 1.5), th = Math.atan2(rise, S / 2);
  for (const sgn of [-1, 1]) for (let k = 0; k <= nLines; k++) {
    const s = k / nLines, z = sgn * (S / 2) * (1 - s), y = H + rise * s;
    const me = box(g, Lt, 0.05, 0.2, Lt / 2, y + 0.12, z, sec); me.rotation.x = sgn * th;
  }
  const rows = Math.ceil(H / 1.8);
  for (let k = 1; k <= rows; k++) { const y = (H / rows) * k - 0.15;
    for (const sgn of [-1, 1]) box(g, Lt, 0.2, 0.05, Lt / 2, y, sgn * (S / 2 + cd / 2 + 0.03), sec);
    for (const xx of [0, Lt]) box(g, 0.05, 0.2, S, xx, y, 0, sec); }
  // bracing
  const braced = Math.max(2, Math.ceil(nb / 5)), br = M('brace', COL.brace);
  const bayAt = (k) => (braced === 1 ? 0 : Math.round((k * (nb - 1)) / (braced - 1)));
  for (let k = 0; k < braced; k++) { const i = bayAt(k), x0 = i * B, x1 = (i + 1) * B;
    for (const sgn of [-1, 1]) { cylBetween(g, V(x0, H, sgn * S / 2), V(x1, 0.4, sgn * S / 2), 0.03, br); cylBetween(g, V(x1, H, sgn * S / 2), V(x0, 0.4, sgn * S / 2), 0.03, br);
      cylBetween(g, V(x0, H, sgn * S / 2), V(x1, H + rise, 0), 0.03, br); cylBetween(g, V(x1, H, sgn * S / 2), V(x0, H + rise, 0), 0.03, br); } }
  // crane
  if (crane > 0 && cr) {
    const yc = Math.min(H - 1.2, H * 0.75), gz = S / 2 - 0.45;
    for (const sgn of [-1, 1]) { box(g, Lt, cr.d / 1000, 0.22, Lt / 2, yc, sgn * gz, cm); for (let i = 0; i <= nb; i++) box(g, 0.3, 0.5, 0.45, i * B, yc - 0.3, sgn * (S / 2 - 0.2), cm); }
    const mid = Lt * 0.4;
    box(g, 0.6, 0.55, S - 0.7, mid, yc + 0.5, 0, M('bridge', 0xd64545)); box(g, 1.6, 0.8, 1.2, mid, yc - 0.2, 0, M('trolley', 0x222a33));
  }
  if (d.mezz > 0) { const w = Math.min(S, 14), l = d.mezz / w; box(g, l, 0.25, w, l / 2, 4, -S / 2 + w / 2 + 0.3, M('mezz', 0x9aa4b0));
    for (let i = 0; i <= Math.ceil(l / 6); i++) for (const z of [-S / 2 + 0.4, -S / 2 + w]) box(g, 0.3, 4, 0.3, Math.min(l, i * 6), 2, z, frame); }
  if (opt.cladding) {
    const cl = M('clad', 0x9fb7cf, { transparent: true, opacity: 0.16, metalness: 0.1, roughness: 0.3, depthWrite: false });
    for (const sgn of [-1, 1]) { const me = box(g, Lt, 0.02, raf, Lt / 2, H + rise / 2, sgn * S / 4, cl); me.rotation.x = sgn * th; box(g, Lt, H, 0.02, Lt / 2, H / 2, sgn * (S / 2 + cd / 2 + 0.08), cl); }
    for (const xx of [-0.05, Lt + 0.05]) box(g, 0.02, H, S, xx, H / 2, 0, cl);
  }
  return finish(g, 7);
}

/* ================================ pipe rack ================================ */
function buildRack(d) {
  const g = new THREE.Group(), { Wr, nb: nbAll, B, nt, Ht, H1, Hc, cols, colSec, bm, st, nl } = d;
  const nb = Math.min(nbAll, 8), Lr = nb * B; g.userData.note = nbAll > nb ? `Showing ${nb} of ${nbAll} bays` : '';
  const mCol = M('rcol', COL.rack), mBeam = M('rbeam', COL.rackBeam), br = M('brace', COL.brace);
  const lat = V(1, 0, 0), zs = cols === 3 ? [-Wr / 2, 0, Wr / 2] : [-Wr / 2, Wr / 2];
  const hb = (bm.h || bm.d) / 1000;
  for (let i = 0; i <= nb; i++) {
    const x = i * B;
    for (const z of zs) iMember(g, V(x, 0, z), V(x, Hc, z), lat, colSec.h / 1000, colSec.h / 1000, colSec.b / 1000, 0.016, 0.01, mCol);
    for (let t = 0; t < nt; t++) iMember(g, V(x, H1 + t * Ht, -Wr / 2), V(x, H1 + t * Ht, Wr / 2), lat, hb, hb, (bm.b || bm.bf) / 1000, 0.012, 0.008, mBeam);
  }
  const sj = V(0, 0, 1);
  for (let t = 0; t < nt; t++) for (let k = 0; k < nl; k++) {
    const z = -Wr / 2 + (Wr * k) / (nl - 1), y = H1 + t * Ht + hb / 2 + (st.h || st.d) / 2000;
    iMember(g, V(0, y, z), V(Lr, y, z), sj, st.h / 1000, st.h / 1000, st.b / 1000, 0.009, 0.006, mBeam);
  }
  const braced = Math.max(2, Math.ceil(nb / 4));
  for (let k = 0; k < braced; k++) { const i = braced === 1 ? 0 : Math.round((k * (nb - 1)) / (braced - 1)), x0 = i * B, x1 = (i + 1) * B;
    for (const z of [-Wr / 2, Wr / 2]) for (let t = 0; t < nt; t++) { const y0 = t === 0 ? 0 : H1 + (t - 1) * Ht, y1 = H1 + t * Ht;
      cylBetween(g, V(x0, y0, z), V(x1, y1, z), 0.035, br); cylBetween(g, V(x1, y0, z), V(x0, y1, z), 0.035, br); } }
  // pipes
  const pc = [0x3e8e5a, 0x2f6fb0, 0x8b97a5, 0xc0462f, 0xd6a53a, 0x6b4fa0], pd = [0.15, 0.25, 0.35, 0.2, 0.45, 0.3, 0.2, 0.55];
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let t = 0; t < nt; t++) { let z = -Wr / 2 + 0.3, k = 0; const yb = H1 + t * Ht + hb / 2 + st.h / 1000 + 0.02;
    while (true) { const r = pd[(k * 5 + t * 3) % pd.length] / 2; if (z + 2 * r > Wr / 2 - 0.2) break; const c = pc[(k + t) % pc.length];
      const me = add(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r, Lr, 20), M('pipe' + c, c, { metalness: 0.3, roughness: 0.55 }))); me.rotation.z = Math.PI / 2; me.position.set(Lr / 2, yb + r, z + r); z += 2 * r + 0.08 + rnd() * 0.04; k++; } }
  return finish(g, 7.5);
}

/* ================================== façade ================================== */
function buildFacade(d, opt) {
  const g = new THREE.Group(), { W, Ht, Bm, nm, floors, Hf, rows, mull, tran, off, glazing } = d;
  const mm = M('mull', COL.mull), mb = mull.b / 1000, mh = mull.h / 1000, tb = tran.b / 1000, th = tran.h / 1000;
  for (let i = 0; i < nm; i++) box(g, mb, Ht, mh, Math.min(W, i * Bm), Ht / 2, 0, mm);
  const rowY = []; for (let f = 0; f < floors; f++) { const n = Math.max(1, Math.round(Hf / glazing)); for (let k = 0; k < n; k++) rowY.push(f * Hf + (Hf * k) / n); } rowY.push(Math.min(Ht, floors * Hf));
  for (const y of rowY) box(g, W, th, tb, W / 2, Math.min(Ht, y) , mh / 2 + tb / 2, mm);
  const bk = M('bk', 0x8a929c);
  for (let i = 0; i < nm; i++) for (let f = 0; f <= floors; f++) { const y = Math.min(Ht, f * Hf); box(g, 0.1, 0.12, off, Math.min(W, i * Bm), y, -off / 2, bk); }
  for (let f = 0; f <= floors; f++) box(g, W + 0.6, 0.28, 0.9, W / 2, Math.min(Ht, f * Hf) - 0.2, -off - 0.45, M('slab', COL.floor, { metalness: 0.05, roughness: 0.9 }));
  if (opt.cladding) {
    const gl = M('glass', COL.glass, { transparent: true, opacity: 0.28, metalness: 0.2, roughness: 0.08, depthWrite: false });
    const nPan = Math.max(1, (nm - 1)) * (rowY.length - 1);
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), gl, nPan); let c = 0; const m4 = new THREE.Matrix4();
    for (let r = 0; r < rowY.length - 1; r++) for (let i = 0; i < nm - 1; i++) { const h = Math.min(Ht, rowY[r + 1]) - rowY[r] - th; if (h <= 0) continue;
      m4.compose(V((i + 0.5) * Bm, rowY[r] + (rowY[r + 1] - rowY[r]) / 2, mh / 2 + 0.02), new THREE.Quaternion(), V(Bm - mb, h, 0.03)); im.setMatrixAt(c++, m4); }
    im.count = c; g.add(im);
  }
  return finish(g, 7);
}

/* ============================== large-diameter pipe ============================ */
function buildPipe(d, opt) {
  const g = new THREE.Group(), { D, t, nSp, nr, web, rt, fl, fw, nSup, manholes, Ls } = d;
  const shownSp = Math.min(nSp, 3), L = Math.min(d.L, shownSp * Ls), R = D / 2 + t / 2;
  g.userData.note = nSp > shownSp ? `Showing ${shownSp} of ${nSp} spools` : '';
  const cut = opt.cut, th0 = cut ? Math.PI * 0.55 : 0, thL = cut ? Math.PI * 1.45 : Math.PI * 2;
  const band = (r, h, x, m, tt = 1) => { const me = add(g, new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 72, 1, true, th0, thL), m)); me.rotation.z = Math.PI / 2; me.position.set(x, 0, 0); return me; };
  const shell = M('shell', COL.shell, { metalness: 0.55, roughness: 0.5 });
  band(R, L, L / 2, shell); band(D / 2 - 0.0, L, L / 2, shell);
  const ringM = M('ring', COL.ring), flM = M('flange', COL.flange);
  if (nr > 0) { const sp = d.L / (nr + 1); for (let i = 1; i <= nr; i++) { const x = i * sp; if (x > L) break; band(R + web / 1000, rt / 1000, x, ringM); } }
  for (let i = 0; i <= shownSp; i++) { const x = Math.min(L, i * Ls); band(R + fw, fl, x, flM); }
  for (let i = 0; i <= Math.min(nSup, shownSp + 1); i++) { const x = Math.min(L, i * Ls); box(g, 0.5 + D * 0.05, D * 0.22, D * 0.9, x, -D / 2 - D * 0.05, 0, M('sad', COL.saddle)); }
  for (let i = 0; i < Math.min(manholes, 3); i++) { const x = ((i + 0.5) * L) / Math.min(manholes, 3); const me = add(g, new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.5, 24), flM)); me.position.set(x, D / 2 + 0.15, 0); }
  return finish(g, 7.5);
}

export function buildStructure3D(id, dims, opt = {}) {
  if (id === 'peb') return buildPeb(dims, opt);
  if (id === 'rack') return buildRack(dims, opt);
  if (id === 'facade') return buildFacade(dims, opt);
  if (id === 'pipe') return buildPipe(dims, opt);
  return null;
}
