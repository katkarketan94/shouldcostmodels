// 3D transformer from the workbook's solved geometry: core, windings, tank / enclosure, bushings, radiators and conservator.
import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
const rowOf = (L, re) => L.fieldsA.find((f) => re.test(f.label)).row;

export function xfmrScene(r, kind, cutaway, L) {
  const g = new THREE.Group(), dry = kind === 'dry', c = r.cfg, one = r.phases === 1, hvKv = +r.hvKv || 11;
  const tap = c[rowOf(L, /^Tap changer/)], cool = String(c[rowOf(L, /^Cooling/)] ?? '');
  const add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  const box = (sx, sy, sz, x, y, z, m) => add(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z);
  const cyl = (rt, rb, h, x, y, z, m, seg = 32) => add(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y, z);
  const ring = (ro, ri, h, x, y, z, m) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(hole); const gm = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 40 }); gm.rotateX(-Math.PI / 2); return add(gm, m, x, y, z); };
  const W = r.boxW, Ln = r.boxL, H = r.boxH, nLimb = one ? 2 : 3, limbC = r.limbC, coreD = r.coreD, winH = r.windowH, yokeH = coreD * 0.8;
  const x0 = -((nLimb - 1) * limbC) / 2, floor = dry ? 0.35 : 0.12, ay = floor + yokeH;                       // active-part bottom of window
  const iron = M({ color: 0x5c6470, metalness: 0.75, roughness: 0.4 }), cu = M({ color: dry ? 0xd98a3d : 0xc27a2c, metalness: 0.85, roughness: 0.35 }), resin = M({ color: 0xb8741a, metalness: 0.1, roughness: 0.55 }), paper = M({ color: 0xe0c68a, metalness: 0.05, roughness: 0.8 });
  // core: limbs, yokes (and two return limbs on a large single-phase unit)
  const span = (nLimb - 1) * limbC + coreD;
  box(span + coreD * 0.3, yokeH, coreD * 0.9, 0, floor + yokeH / 2, 0, iron); box(span + coreD * 0.3, yokeH, coreD * 0.9, 0, ay + winH + yokeH / 2, 0, iron);
  for (let i = 0; i < nLimb; i++) cyl(coreD / 2 * 0.95, coreD / 2 * 0.95, winH, x0 + i * limbC, ay + winH / 2, 0, iron);
  if (one && r.coreD > 0.9) { for (const s of [-1, 1]) cyl(coreD * 0.32, coreD * 0.32, winH, s * (limbC / 2 + limbC * 0.9), ay + winH / 2, 0, iron); }
  // windings: LV inside, HV outside
  const coilH = r.coilH, cy0 = ay + (winH - coilH) / 2;
  for (let i = 0; i < nLimb; i++) {
    ring(r.lvIn / 2 + r.lvRad, r.lvIn / 2, coilH, x0 + i * limbC, cy0, 0, dry ? M({ color: 0x2f3a46, metalness: 0.4, roughness: 0.6 }) : cu);
    ring(r.hvOut / 2, r.hvIn / 2, coilH, x0 + i * limbC, cy0, 0, dry ? resin : cu);
    if (!dry) ring(r.hvOut / 2 + 0.01, r.hvOut / 2, coilH, x0 + i * limbC, cy0, 0, paper);
  }
  const top = ay + winH + yokeH;
  if (dry) {
    for (let i = 0; i < nLimb; i++) { cyl(0.03, 0.03, 0.18, x0 + i * limbC - r.hvOut * 0.18, cy0 + coilH + 0.09, 0, M({ color: 0xcfd6de, metalness: 0.8, roughness: 0.3 })); }
    box(span + 0.5, 0.06, coreD * 1.2, 0, 0.3, 0, M({ color: 0x3f4753, metalness: 0.6, roughness: 0.5 }));
    const eL = r.boxL, eW = r.boxW, eH = r.boxH, encl = String(c[rowOf(L, /^Enclosure/)] ?? '');
    if (!/IP00/.test(encl)) {
      const wall = M({ color: 0x8a96a3, metalness: 0.4, roughness: 0.55 });
      if (!cutaway) { box(eL, eH, 0.02, 0, eH / 2, -eW / 2, wall); box(eL, eH, 0.02, 0, eH / 2, eW / 2, wall); box(0.02, eH, eW, -eL / 2, eH / 2, 0, wall); box(0.02, eH, eW, eL / 2, eH / 2, 0, wall); box(eL, 0.02, eW, 0, eH, 0, wall); for (let i = 0; i < 6; i++) box(eL * 0.6, 0.025, 0.012, 0, eH * 0.25 + i * eH * 0.08, eW / 2 + 0.012, M({ color: 0x1c2631 })); }
      else { const gh = new THREE.Mesh(new THREE.BoxGeometry(eL, eH, eW), new THREE.MeshBasicMaterial({ color: 0x7aa2d6, transparent: true, opacity: 0.07, depthWrite: false })); gh.position.set(0, eH / 2, 0); g.add(gh); const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(eL, eH, eW)), new THREE.LineBasicMaterial({ color: 0x5b6573 })); ed.position.copy(gh.position); g.add(ed); }
    }
  } else {
    // tank around the active part
    const tank = M({ color: 0x6f8aa6, metalness: 0.45, roughness: 0.55, transparent: cutaway, opacity: cutaway ? 0.2 : 1 });
    const ty = H / 2 + floor * 0.2;
    box(Ln, H, 0.02, 0, ty, -W / 2, tank); box(Ln, H, 0.02, 0, ty, W / 2, tank); box(0.02, H, W, -Ln / 2, ty, 0, tank); box(0.02, H, W, Ln / 2, ty, 0, tank); box(Ln, 0.03, W, 0, ty + H / 2, 0, tank);
    if (cutaway) { const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(Ln, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6573 })); ed.position.set(0, ty, 0); g.add(ed); }
    const lid = ty + H / 2;
    // bushings: HV on the near side, LV on the far side, with shed discs
    const bush = (x, z, h, col) => { cyl(0.05 + h * 0.03, 0.05 + h * 0.03, h, x, lid + h / 2, z, M({ color: col, roughness: 0.4 })); for (let k = 1; k < Math.max(3, Math.round(h * 6)); k++) cyl(0.09 + h * 0.04, 0.09 + h * 0.04, 0.012, x, lid + (h * k) / Math.max(3, Math.round(h * 6)), z, M({ color: col, roughness: 0.4 })); };
    const hvH = Math.min(2.4, 0.3 + hvKv * 0.0042), lvH = Math.min(1.1, 0.25 + (+r.lvKv || 0.4) * 0.016);
    for (let i = 0; i < (one ? 1 : 3); i++) { const x = one ? 0 : x0 + i * limbC; bush(x, -W * 0.22, hvH, 0xb86b3a); bush(x, W * 0.22, lvH, 0xa9b4c0); }
    bush(x0 - (one ? 0 : limbC * 0.5), -W * 0.22, hvH * 0.45, 0xb86b3a);
    if (!/corrugated/i.test(cool)) { // conservator over the tank with its support and pipe
      const cd = Math.max(0.15, Math.min(1.4, H * 0.16)); const cons = cyl(cd / 2, cd / 2, Ln * 0.7, 0, lid + hvH * 0.4 + cd / 2 + 0.2, W * 0.1, M({ color: 0x7f93a8, metalness: 0.5, roughness: 0.5 })); cons.rotation.z = Math.PI / 2;
      cyl(0.03, 0.03, hvH * 0.4 + 0.2, Ln * 0.3, lid + (hvH * 0.4 + 0.2) / 2, W * 0.1, tank);
    }
    // radiators or corrugations
    if (/corrugated/i.test(cool)) { const n = Math.min(60, Math.round(Ln / 0.05)); for (let i = 0; i < n; i++) { box(0.02, H * 0.85, 0.07, -Ln / 2 + (i + 0.5) * (Ln / n), ty, W / 2 + 0.03, tank); box(0.02, H * 0.85, 0.07, -Ln / 2 + (i + 0.5) * (Ln / n), ty, -W / 2 - 0.03, tank); } }
    else if (r.radN > 0) { const n = Math.min(r.radN, 30), rh = Math.min(2.5, H * 0.85), per = Math.min(n, Math.max(4, Math.floor(Ln / 0.65))); for (let i = 0; i < n; i++) { const row = Math.floor(i / per), col = i % per, side = row % 2 ? -1 : 1, x = -Ln / 2 + 0.4 + col * ((Ln - 0.8) / Math.max(per - 1, 1)); box(0.52, rh, 0.06, x, ty - H * 0.05, side * (W / 2 + 0.2 + Math.floor(row / 2) * 0.12), M({ color: 0x8794a1, metalness: 0.5, roughness: 0.5 })); } }
    if (/ODAF|OFAF/.test(cool)) for (let i = 0; i < 3; i++) box(0.6, 0.6, 0.6, -Ln / 2 + 0.8 + i * 1.2, 0.4, W / 2 + 0.7, M({ color: 0x2f6fd6, metalness: 0.3, roughness: 0.5 }));
    if (tap === 'OLTC') box(0.5, Math.min(1.4, H * 0.5), 0.45, Ln / 2 + 0.25, ty, 0, M({ color: 0xd9dee6, metalness: 0.3, roughness: 0.55 }));
    box(Ln * 1.04, 0.12, W * 1.04, 0, 0.0, 0, M({ color: 0x3f4753, metalness: 0.6, roughness: 0.5 }));
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.6 / Math.max(sz.x, sz.y * 1.7, sz.z * 1.6)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.55, 0.45, 1.3] };
}
