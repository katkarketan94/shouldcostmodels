// 3D model of a DG set from the workbook's computed sizes: skid, engine, alternator, radiator, panel, tank, exhaust and the acoustic enclosure.
import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
const ENGINE = { Cummins: 0xc8372d, Kirloskar: 0x2f8f4e, Mahindra: 0xb8372e, 'Volvo Eicher': 0xd8a31a, Baudouin: 0x2c5da8, Perkins: 0x2b6cb0, Caterpillar: 0xe3b01c };
const ALT = { Stamford: 0x2b4f8f, 'Leroy Somer': 0x3a7d5f, CG: 0x8f2f3c, Kirloskar: 0x2f7a4a };

export function dgScene(r, cutaway) {
  const c = r.cfg, g = new THREE.Group(), enc = c.enclosure !== 'None';
  const L = enc ? r.encl.L : r.skid.L + 0.5, W = enc ? r.encl.W : r.skid.W + 0.2, H = enc ? r.encl.H : 1.5, t = 0.04;
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const cyl = (rad, len, x, y, z, m, axis = 'x') => { const cy = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 32), m); if (axis === 'x') cy.rotation.z = Math.PI / 2; else if (axis === 'z') cy.rotation.x = Math.PI / 2; cy.position.set(x, y, z); cy.castShadow = true; g.add(cy); return cy; };
  const steel = M({ color: 0x3f4753, metalness: 0.7, roughness: 0.5 });
  // skid: two longitudinal channels and cross members, with a fuel tank below
  const sl = r.skid.L, sw = r.skid.W, fh = 0.2;
  for (const z of [-sw / 2, sw / 2]) box(sl, 0.2, 0.09, 0, fh / 2, z, steel);
  for (let i = 0; i <= 6; i++) box(0.07, 0.12, sw, -sl / 2 + i * sl / 6, 0.1, 0, steel);
  const tankH = Math.min(0.5, Math.max(0.18, r.tankL / 1000 / (sl * 0.6 * sw * 0.85)));
  box(sl * 0.6, tankH, sw * 0.85, -sl * 0.05, -tankH / 2, 0, M({ color: 0xc7ccd4, metalness: 0.6, roughness: 0.55 }));
  const base = fh;
  // engine, alternator, radiator along x (radiator at -x, alternator at +x)
  const eL = sl * 0.34, eH = Math.min(H * 0.42, 0.9 + r.engineKw / 1500), eW = sw * 0.62, ex = -sl * 0.18, ec = ENGINE[c.engine] ?? 0xc8372d;
  box(eL, eH, eW, ex, base + eH / 2, 0, M({ color: ec, metalness: 0.5, roughness: 0.55 }));
  box(eL * 0.9, eH * 0.18, eW * 0.8, ex, base + eH + eH * 0.09, 0, M({ color: 0x2e3238, metalness: 0.7, roughness: 0.45 }));
  cyl(eW * 0.16, eW * 0.7, ex - eL * 0.15, base + eH * 0.78, eW / 2 + 0.12, M({ color: 0x9a9fa8, metalness: 0.8, roughness: 0.35 }), 'z');
  const aR = Math.min(sw * 0.33, 0.2 + r.std / 5200), aL = sl * 0.26, ax = ex + eL / 2 + aL / 2 + 0.1;
  cyl(aR, aL, ax, base + aR + 0.05, 0, M({ color: ALT[c.alternator] ?? 0x2b4f8f, metalness: 0.4, roughness: 0.55 }));
  box(aL * 0.7, aR * 0.35, aR * 1.1, ax, base + aR * 2 + 0.12, 0, M({ color: 0x2b3340, metalness: 0.6, roughness: 0.5 })); // terminal box
  cyl(0.06, 0.12, ex + eL / 2 + 0.05, base + aR + 0.05, 0, steel);
  const rW = sw * 0.9, rH = Math.min(H * 0.8, eH * 1.5), rx = -sl / 2 + 0.2;
  box(0.16, rH, rW, rx, base + rH / 2, 0, M({ color: 0x2e3238, metalness: 0.7, roughness: 0.5 }));
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(rH, rW) * 0.42, Math.min(rH, rW) * 0.42, 0.04, 32), M({ color: 0x14171b, metalness: 0.5, roughness: 0.5 })); fan.rotation.z = Math.PI / 2; fan.position.set(rx + 0.12, base + rH / 2, 0); g.add(fan);
  // control panel beside the alternator end
  box(0.45, 1.0, 0.7, sl / 2 - 0.1, base + 0.5, -sw / 2 + 0.35, M({ color: 0xe5e9ef, metalness: 0.3, roughness: 0.5 }));
  box(0.02, 0.25, 0.3, sl / 2 + 0.13, base + 0.8, -sw / 2 + 0.35, M({ color: 0x1b2a3a, roughness: 0.3 }));
  // exhaust: silencer on the roof, pipe down to the engine
  const exY = (enc ? H : base + eH) + 0.2;
  cyl(0.17, Math.min(1.4, 0.6 + r.engineKw / 700), ex + eL * 0.2, exY + 0.2, -eW * 0.25, M({ color: 0x4a4f57, metalness: 0.7, roughness: 0.45 }));
  cyl(0.045, exY - base - eH * 0.5, ex + eL * 0.2, (exY + base + eH * 0.5) / 2 - 0.2, -eW * 0.25, M({ color: 0x4a4f57, metalness: 0.7, roughness: 0.45 }), 'y');
  // enclosure
  if (enc) {
    const al = c.enclosure === 'Acoustic', col = al ? 0x4b6a8c : 0x6b7a88, wall = M({ color: col, metalness: 0.3, roughness: 0.6 });
    const eY = H / 2, e0 = -L / 2;
    box(L, H, t, 0, eY, -W / 2 + t / 2, wall); box(t, H, W, e0 + t / 2, eY, 0, wall); box(t, H, W, L / 2 - t / 2, eY, 0, wall);
    for (let i = 0; i < 6; i++) box(0.02, 0.04, W * 0.7, e0 + 0.02, H * 0.15 + i * H * 0.1, 0, M({ color: 0x1c2631, roughness: 0.6 }));  // inlet louvers
    if (!cutaway) { box(L, t, W, 0, H - t / 2, 0, wall); box(L, H, t, 0, eY, W / 2 - t / 2, wall); for (let i = 0; i < 5; i++) box(L * 0.5, 0.035, 0.02, 0, H * 0.2 + i * H * 0.1, W / 2 + 0.005, M({ color: 0x1c2631, roughness: 0.6 })); }
    else { const gh = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), new THREE.MeshBasicMaterial({ color: 0x7aa2d6, transparent: true, opacity: 0.07, depthWrite: false })); gh.position.set(0, eY, 0); g.add(gh); const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6573 })); ed.position.copy(gh.position); g.add(ed); }
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.8 / Math.max(sz.x, sz.y * 2.2, sz.z * 1.6)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.5, 0.5, 1.3] };
}
