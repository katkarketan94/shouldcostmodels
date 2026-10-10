import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);

// duct made from a cross-section ring (round / oval) or four plates (rectangular), extruded along x; the cutaway leaves the front (+z) side open
export function ductScene(r, cut) {
  const c = r.cfg, g = new THREE.Group(), round = c.shape === 'Round', rect = c.shape === 'Rectangular';
  const w = (round ? c.dia : c.w) / 1000, h = (round ? c.dia : c.h) / 1000, L = Math.min(Math.max(c.run, 3.6), 4.8);
  const t = Math.max(0.008, r.thk / 1000 * 5), ins = c.ins === 'None' ? 0 : Math.max(0.025, c.insThk / 1000 * 1.8);
  const sheet = M({ color: { 'GI sheet': 0xaab3be, 'Pre-coated GI': 0xe6e9ee, Aluminium: 0xc9d0d9, 'SS 304': 0xd7dde6 }[c.mat], metalness: 0.6, roughness: 0.42, side: THREE.DoubleSide });
  const insM = M({ color: c.ins === 'Glass wool + foil' ? 0xdfe3e8 : 0x2b2f36, metalness: c.ins === 'Glass wool + foil' ? 0.7 : 0.05, roughness: c.ins === 'Glass wool + foil' ? 0.35 : 0.95, side: THREE.DoubleSide });
  const flM = M({ color: 0x7c8794, metalness: 0.7, roughness: 0.45 }), rod = M({ color: 0x8a949f, metalness: 0.8, roughness: 0.4 });
  const mesh = (geo, m, x = 0, y = 0, z = 0) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  const box = (sx, sy, sz, x, y, z, m) => mesh(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z);
  const a0 = cut ? 0.35 * Math.PI : 0, a1 = cut ? 1.65 * Math.PI : 2 * Math.PI;           // open wedge faces +z (angle measured from +z)

  function ring(ro, ri, len, m) {
    const rz = (round ? 1 : w / h), shp = new THREE.Shape(), N = 72; // ellipse for oval; circle for round
    const P = (R, ang) => new THREE.Vector2(Math.sin(ang) * R * rz, Math.cos(ang) * R);
    const outer = [], inner = [];
    for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; outer.push(P(ro, a)); inner.push(P(ri, a)); }
    const pts = [...outer, ...inner.reverse()]; shp.setFromPoints(pts);
    const gm = new THREE.ExtrudeGeometry(shp, { depth: len, bevelEnabled: false }); gm.translate(0, 0, -len / 2); gm.rotateY(Math.PI / 2); mesh(gm, m);
  }
  function plates(ex, thick, len, m) { // four plates around the rectangle; front plate skipped in the cutaway
    const a = w / 2 + ex, b = h / 2 + ex;
    box(len, thick, 2 * a, 0, b - thick / 2, 0, m); box(len, thick, 2 * a, 0, -b + thick / 2, 0, m);
    box(len, 2 * b, thick, 0, 0, -a + thick / 2, m); if (!cut) box(len, 2 * b, thick, 0, 0, a - thick / 2, m);
  }
  if (rect) { plates(t, t, L, sheet); if (ins) plates(t + ins, ins, L * 0.998, insM); } else { ring(h / 2 + t, h / 2, L, sheet); if (ins) ring(h / 2 + t + ins, h / 2 + t, L * 0.998, insM); }
  const hw = round ? w : w, ho = round ? h : h, outerH = ho / 2 + t + ins, outerW = hw / 2 + t + ins;

  // joints every 1.2 m
  const fl = c.joint === 'Slip + drive cleat' ? 0.012 : 0.035;
  for (let x = -L / 2 + 1.2; x < L / 2 - 0.05; x += 1.2) {
    if (rect) { box(fl, 2 * outerH + 0.07, 2 * outerW + 0.07, x, 0, 0, flM); } else { const rg = mesh(new THREE.TorusGeometry(Math.max(outerH, 0.01) + fl / 2, fl, 10, 56), flM, x, 0, 0); rg.rotation.y = Math.PI / 2; rg.scale.set(1, round ? 1 : outerW / outerH, 1); }
  }
  // hangers: two threaded rods and a trapeze angle at each end
  const drop = 0.8;
  for (const x of [-L / 2 + 0.7, L / 2 - 0.7]) {
    const span = outerW + 0.07;
    box(0.04, 0.04, span * 2 + 0.1, x, -outerH - 0.04, 0, rod);
    for (const z of [-span, span]) mesh(new THREE.CylinderGeometry(0.009, 0.009, drop + outerH, 8), rod, x, (drop - outerH) / 2 - 0.0, z);
  }
  // volume dampers: blades across the duct, visible in the cutaway or through the open end
  for (let d = 0; d < Math.min(c.dampers, 2); d++) {
    const dx = L * 0.3 - d * 0.9, n = 6;
    for (let i = 0; i < n; i++) { const b = box(0.012, ho / n * 0.9, hw * 0.94, dx, -ho / 2 + (i + 0.5) * ho / n, 0, M({ color: 0x8892a0, metalness: 0.7, roughness: 0.4 })); b.rotation.z = 0.7; }
    box(0.05, 0.05, hw * 1.05 + 0.1, dx - 0.06, ho / 2 + t + ins + 0.04, 0, flM);
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.8 / Math.max(sz.x, sz.y * 2.4, sz.z * 1.8)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y;
  return { group: g, preset: [0.7, 0.5, 1.3] };
}
