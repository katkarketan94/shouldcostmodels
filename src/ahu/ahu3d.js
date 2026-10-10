// 3D model of an AHU / FCU from the computed casing size and section lengths (metres, workbook values).
import * as THREE from 'three';

const skin = (mat) => (mat === 'SS 304' ? { color: 0xd5dbe3, metalness: 0.85, roughness: 0.3 } : mat === 'Pre-coated GI' ? { color: 0xe9ecef, metalness: 0.2, roughness: 0.55 } : { color: 0xb3bac4, metalness: 0.55, roughness: 0.45 });

function coilFaceTexture(tubes, rows, copperFin) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = copperFin ? '#c98a4c' : '#c4cbd4'; g.fillRect(0, 0, 256, 256);
  const nx = Math.max(2, Math.min(rows, 12)), ny = Math.max(6, Math.min(Math.round(tubes), 46));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = ((i + 0.5 + (j % 2) * 0.5) / (nx + 0.5)) * 256, y = ((j + 0.5) / ny) * 256, rad = Math.min(256 / (nx + 1), 256 / ny) * 0.36;
    g.fillStyle = '#5b3a1e'; g.beginPath(); g.arc(x, y, rad * 1.1, 0, 7); g.fill();
    g.fillStyle = '#d98a3d'; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill();
    g.fillStyle = '#2b2118'; g.beginPath(); g.arc(x, y, rad * 0.55, 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function ahuScene(r, cutaway) {
  const W = r.W, H = r.H, L = r.L, c = r.cfg, k = r.kind, P = Math.max(0.035, Math.min(0.06, W * 0.02));
  const g = new THREE.Group();
  const casing = new THREE.MeshStandardMaterial({ ...skin(c.mat), side: THREE.DoubleSide });
  const mk = (m) => new THREE.MeshStandardMaterial(m);
  const box = (sx, sy, sz, x, y, z, m, parent = g) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; parent.add(me); return me; };
  const base = k === 'ahu' && c.mount === 'Floor mounted' ? 0.12 : k === 'ahu' && c.mount === 'Rooftop' ? 0.35 : 0;
  const y0 = base, x0 = -L / 2;
  // skeleton: floor, back wall, end plates; lid and front wall are hidden in the cutaway
  box(L, P, W, 0, y0 + P / 2, 0, casing);
  box(L, H, P, 0, y0 + H / 2, -W / 2 + P / 2, casing);
  if (!cutaway) { box(L, P, W, 0, y0 + H - P / 2, 0, casing); box(L, H, P, 0, y0 + H / 2, W / 2 - P / 2, casing); }
  else { // lid shown as a ghost so the shape reads
    const ghost = new THREE.Mesh(new THREE.BoxGeometry(L, H, W), new THREE.MeshBasicMaterial({ color: 0x7aa2d6, transparent: true, opacity: 0.07, depthWrite: false })); ghost.position.set(0, y0 + H / 2, 0); g.add(ghost);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6573 })); edges.position.copy(ghost.position); g.add(edges);
  }
  // insulation hint: thin inner liner in a contrasting colour
  const insMat = mk({ color: c.ins === 'PUF' ? 0xf2d78a : 0xc9c18e, roughness: 0.9 });
  box(L - 2 * P, 0.01, W - 2 * P, 0, y0 + P + 0.005, 0, insMat);
  box(L - 2 * P, H - 2 * P, 0.01, 0, y0 + H / 2, -W / 2 + P + 0.005, insMat);
  // plinth / suspension
  const steel = mk({ color: 0x4b5563, metalness: 0.6, roughness: 0.5 });
  if (k === 'ahu' && c.mount === 'Floor mounted') { for (const z of [-W / 2 + 0.1, W / 2 - 0.1]) box(L * 1.02, 0.12, 0.1, 0, 0.06, z, steel); }
  if (k === 'ahu' && c.mount === 'Rooftop') box(L * 1.06, 0.35, W * 1.06, 0, 0.175, 0, mk({ color: 0x8c96a3, roughness: 0.7 }));
  if (k === 'ahu' && c.mount === 'Ceiling suspended') for (const x of [-L * 0.4, L * 0.4]) for (const z of [-W * 0.45, W * 0.45]) box(0.02, 0.5, 0.02, x, y0 + H + 0.25, z, steel);
  if (k === 'fcu' && c.type === 'Cassette') box(L * 1.05, 0.03, W * 1.05, 0, y0 + H + 0.015, 0, mk({ color: 0xf1f3f6, roughness: 0.5 }));

  const flowMat = mk({ color: 0x2f6fd6, roughness: 0.4 });
  const inner = H - 2 * P, iy = y0 + P + inner / 2, iw = W - 2 * P;
  let x = x0;
  for (const s of r.sections) {
    const len = s.len, xc = x + len / 2;
    if (s.id === 'mix') {
      box(0.03, inner * 0.92, iw * 0.92, x + 0.04, iy, 0, mk({ color: 0x98a2ae, metalness: 0.7, roughness: 0.4 })); // damper frame
      const n = Math.max(4, Math.round(inner / 0.1)); for (let i = 0; i < n; i++) { const b = box(0.012, 0.085, iw * 0.9, x + len * 0.55, y0 + P + (i + 0.5) * (inner / n), 0, mk({ color: 0xaab3be, metalness: 0.6, roughness: 0.4 })); b.rotation.z = 0.5; }
    } else if (s.id === 'pre' || s.id === 'fine' || s.id === 'hepa') {
      const col = { pre: 0x9bd1a3, fine: 0x9ec5ee, hepa: 0xf4f7fb }[s.id];
      if (s.id === 'fine') { const n = Math.max(3, Math.round(iw / 0.28)); for (let i = 0; i < n; i++) for (const dy of [-1, 1]) { const b = box(len * 0.8, inner * 0.46, iw / n * 0.82, xc, iy + dy * inner * 0.245, -iw / 2 + (i + 0.5) * (iw / n), mk({ color: col, roughness: 0.95, transparent: true, opacity: 0.92 })); b.scale.set(1, 1, 1); } }
      else { box(0.035, inner * 0.94, iw * 0.94, xc, iy, 0, mk({ color: col, roughness: 0.9 })); const nPl = Math.round(iw / 0.05); for (let i = 0; i < nPl; i += 1) box(0.045, inner * 0.9, 0.004, xc, iy, -iw * 0.47 + (i + 0.5) * (iw * 0.94 / nPl), mk({ color: 0xffffff, roughness: 1 })); if (s.id === 'hepa') box(0.07, inner * 0.97, iw * 0.97, xc, iy, 0, mk({ color: 0xcdd3db, metalness: 0.5, roughness: 0.5 })); }
    } else if (s.id === 'cool' || s.id === 'heat' || (k === 'fcu' && s.id === 'coil')) {
      const hot = s.id === 'heat', depth = Math.min(len * 0.7, Math.max(0.1, r.depth || 0.15));
      const ch = Math.min(inner * 0.96, r.Hf), cw = Math.min(iw * 0.97, r.Lf);
      const tex = coilFaceTexture(r.tubesRow || 20, c.rows || 4, c.fin === 'Copper tube');
      const mats = Array.from({ length: 6 }, (_, i) => (i === 0 || i === 1 ? new THREE.MeshStandardMaterial({ map: tex, metalness: 0.7, roughness: 0.4 }) : new THREE.MeshStandardMaterial({ color: hot ? 0xd96a5a : 0xaeb7c2, metalness: 0.6, roughness: 0.5 })));
      const coil = new THREE.Mesh(new THREE.BoxGeometry(depth, ch, cw), mats); coil.position.set(xc - len * 0.05, y0 + P + ch / 2 + (inner - ch) / 2, 0); coil.castShadow = true; g.add(coil);
      box(depth * 0.5, 0.12 * Math.min(1, inner / 1.5), cw, xc + depth * 0.2, coil.position.y - ch / 2 - 0.02, 0, mk({ color: hot ? 0xd96a5a : 0x2b6fb0, metalness: 0.6, roughness: 0.4 }));  // header
      if (!hot) box(len * 0.9, 0.025, iw * 0.97, xc, y0 + P + 0.04, 0, mk({ color: 0xe6ebf1, metalness: 0.9, roughness: 0.25 })); // drain pan
    } else if (s.id === 'fan') {
      const D = Math.min(inner, iw) * (k === 'fcu' ? 0.6 : 0.82), hubZ = 0, fx = xc - len * 0.1;
      const rot = new THREE.Group(); rot.position.set(fx, iy, hubZ); g.add(rot);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.14, D * 0.14, 0.12, 24), mk({ color: 0x3a4250, metalness: 0.8, roughness: 0.4 })); hub.rotation.z = Math.PI / 2; rot.add(hub);
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(D / 2, D / 2, 0.015, 40), mk({ color: 0x2f6fd6, metalness: 0.5, roughness: 0.4 })); plate.rotation.z = Math.PI / 2; plate.position.x = 0.05; rot.add(plate);
      const nb = k === 'fcu' ? 18 : 11; for (let i = 0; i < nb; i++) { const a = (i / nb) * Math.PI * 2, b = new THREE.Mesh(new THREE.BoxGeometry(0.06, D * 0.34, 0.012), mk({ color: 0x9fb4d1, metalness: 0.6, roughness: 0.4 })); b.position.set(-0.02, Math.cos(a) * D * 0.34, Math.sin(a) * D * 0.34); b.rotation.x = a; rot.add(b); }
      const mw = Math.min(0.5, 0.18 + (r.motor || 0.2) * 0.012);
      const motor = new THREE.Mesh(new THREE.CylinderGeometry(mw / 2, mw / 2, 0.22 + mw * 0.6, 24), mk({ color: 0x1f6f5c, metalness: 0.5, roughness: 0.5 })); motor.rotation.z = Math.PI / 2; motor.position.set(fx + 0.2 + mw * 0.3, iy, 0); g.add(motor);
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.5, D * 0.5, 0.04, 40, 1, true), mk({ color: 0x8892a0, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.4 })); // inlet cone ring
      sh.rotation.z = Math.PI / 2; sh.position.set(fx - 0.1, iy, 0); g.add(sh);
    } else if (s.id === 'hum') {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, iw * 0.9, 12), mk({ color: 0x7aa6c9, metalness: 0.6, roughness: 0.4 })); pipe.rotation.x = Math.PI / 2; pipe.position.set(xc, y0 + P + inner * 0.6, 0); g.add(pipe);
      for (let i = 0; i < 7; i++) box(0.03, 0.12, 0.03, xc, y0 + P + inner * 0.52, -iw * 0.4 + i * (iw * 0.8 / 6), mk({ color: 0xb7d6ee, transparent: true, opacity: 0.6 }));
    }
    // section divider
    if (x > x0 + 1e-6) box(0.012, inner, iw, x, iy, 0, mk({ color: 0x9aa4b0, metalness: 0.6, roughness: 0.5 }));
    x += len;
  }
  // VFD cabinet on the back wall (floor-mounted drives only)
  if (k === 'ahu' && c.vfd === 'Y') box(0.5, 0.65, 0.22, L * 0.28, y0 + H * 0.5, -W / 2 - 0.12, mk({ color: 0xd9dee6, metalness: 0.3, roughness: 0.5 }));
  // airflow arrow
  const arrow = new THREE.Group(); const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 10), flowMat); sh.rotation.z = -Math.PI / 2; sh.position.x = -0.15; arrow.add(sh);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.2, 14), flowMat); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.3; arrow.add(tip); arrow.position.set(-L / 2 - 0.55, y0 + H * 0.5, 0); g.add(arrow);
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.6 / Math.max(sz.x, sz.y * 1.6, sz.z * 1.3)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y;
  return { group: g, preset: [0.45, 0.5, 1.3] };
}
