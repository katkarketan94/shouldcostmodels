import * as THREE from 'three';
import { barLayout } from './busductGeom.js';

export function buildBusduct3D(r, cutaway) {
  const { width: W, height: H, effThk: t, cfg } = r, lay = barLayout(r);
  const L = Math.max(2400, W * 7), stub = L * 0.1;
  const g = new THREE.Group();
  const alEnc = cfg.enclosure === 'Aluminium';
  const enc = new THREE.MeshStandardMaterial({ color: alEnc ? 0xbac2cc : 0x8c96a3, metalness: alEnc ? 0.85 : 0.35, roughness: alEnc ? 0.36 : 0.55, side: THREE.DoubleSide });
  const box = (sx, sy, sz, x, y, z, m) => { const me = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  // enclosure shell (x along length, y up, z across); cutaway removes the lid and the front wall
  box(L, t, W, 0, t / 2, 0, enc);
  box(L, H, t, 0, H / 2, -W / 2 + t / 2, enc);
  if (!cutaway) { box(L, t, W, 0, H - t / 2, 0, enc); box(L, H, t, 0, H / 2, W / 2 - t / 2, enc); }
  // flanged joint plates at the closed end
  box(t * 1.4, H + 24, W + 24, -L / 2 - t * 0.7, H / 2, 0, enc);
  const cu = cfg.conductor === 'Copper';
  const barMat = new THREE.MeshStandardMaterial({ color: cu ? 0xd98a3d : 0xd5dae2, metalness: 0.95, roughness: 0.28 });
  const cy = H / 2;
  for (const b of lay.bars) {
    const zc = b.x + b.w / 2;
    box(L + stub, lay.hb, b.w, stub / 2, cy, zc, barMat);
    if (cfg.variant !== 'Air Insulated (AIB)') {
      const col = cfg.variant === 'Fire Rated' ? 0xefe6cf : new THREE.Color(b.color);
      const sl = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide });
      box(L, lay.hb + 2 * b.sleeve, b.w + 2 * b.sleeve, 0, cy, zc, sl);
    }
  }
  if (cfg.variant === 'Air Insulated (AIB)') { // resin support blocks every ~600 mm
    const sup = new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.6 });
    const zs = lay.bars[0].x, ze = lay.bars[4].x + lay.bars[4].w;
    for (let x = -L / 2 + 300; x < L / 2; x += 600) box(26, lay.hb * 0.22, ze - zs + 20, x, cy + lay.hb * 0.18, (zs + ze) / 2, sup);
  }
  const bb = new THREE.Box3().setFromObject(g); const sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.4 / Math.max(sz.x, sz.y * 2, sz.z));
  g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y;
  return g;
}
