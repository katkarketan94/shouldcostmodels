import * as THREE from 'three';

const M = (o) => new THREE.MeshStandardMaterial(o);
function tubeSheetTexture(n) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#9aa3ad'; g.fillRect(0, 0, 256, 256);
  const cols = Math.max(6, Math.min(Math.round(Math.sqrt(n)), 26)), step = 236 / cols;
  for (let i = 0; i < cols; i++) for (let j = 0; j < cols; j++) { const x = 10 + (i + 0.5 + (j % 2) * 0.5) * step, y = 10 + (j + 0.5) * step; if (Math.hypot(x - 128, y - 128) > 118) continue; g.fillStyle = '#d98a3d'; g.beginPath(); g.arc(x, y, step * 0.36, 0, 7); g.fill(); g.fillStyle = '#2b2118'; g.beginPath(); g.arc(x, y, step * 0.18, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function shell(g, D, L, x, y, z, n, cut, col) {
  const mat = M({ color: col, metalness: 0.5, roughness: 0.5, transparent: cut, opacity: cut ? 0.28 : 1, side: THREE.DoubleSide });
  const s = new THREE.Mesh(new THREE.CylinderGeometry(D / 2, D / 2, L, 48, 1, true), mat); s.rotation.z = Math.PI / 2; s.position.set(x, y, z); s.castShadow = true; g.add(s);
  const tex = tubeSheetTexture(n);
  for (const sg of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(D / 2, 48), M({ map: sg < 0 ? tex : null, color: sg < 0 ? 0xffffff : col, metalness: 0.5, roughness: 0.5, side: THREE.DoubleSide }));
    cap.position.set(x + sg * L / 2, y, z); cap.rotation.y = Math.PI / 2; g.add(cap);
    const wb = new THREE.Mesh(new THREE.CylinderGeometry(D / 2 * 1.04, D / 2 * 1.04, D * 0.14, 48), M({ color: 0x3f6f9f, metalness: 0.5, roughness: 0.5 })); wb.rotation.z = Math.PI / 2; wb.position.set(x + sg * (L / 2 + D * 0.07), y, z); g.add(wb);
  }
  if (cut) { const bundle = new THREE.Mesh(new THREE.CylinderGeometry(D * 0.4, D * 0.4, L * 0.98, 32), M({ color: 0xd98a3d, metalness: 0.9, roughness: 0.3 })); bundle.rotation.z = Math.PI / 2; bundle.position.set(x, y, z); g.add(bundle); }
}
export function chillerScene(r, cut) {
  const g = new THREE.Group(), ev = r.ev, co = r.cond, water = co.kind === 'shell', c = r.cfg;
  const Lb = Math.max(ev.L, water ? co.L : 0, 1.2) + 0.6, sk = M({ color: 0x3a4250, metalness: 0.6, roughness: 0.5 });
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const dEv = ev.D, dCo = water ? co.D : 0, width = Math.max(dEv, dCo) * 1.15 + 0.2;
  const x0 = -Lb / 2 - 0.3, x1 = Lb / 2 + 2.4;
  box(x1 - x0, 0.12, width, (x0 + x1) / 2, 0.06, 0, sk);
  shell(g, dEv, ev.L, 0, 0.12 + dEv / 2 + 0.05, water ? -width * 0.22 : 0, ev.N, cut, 0x2f6fb0);
  if (water) shell(g, dCo, co.L, 0, 0.12 + dEv + dCo / 2 + 0.15, width * 0.12 - width * 0.22 + 0.05, co.N, cut, 0xc0453c);
  else { // V-bank air-cooled condenser with fans on top
    const cw = Math.min(co.face / 3, 4.5), ch = Math.sqrt(co.face / 3) * 1.1, top = 0.12 + dEv + 0.5;
    for (const sgn of [-1, 1]) { const p = box(Lb * 0.9, 0.05, ch * 1.2, 0, top + ch * 0.45, sgn * ch * 0.5, M({ color: 0xaeb7c2, metalness: 0.6, roughness: 0.5 })); p.rotation.x = -sgn * 0.5; }
    const nf = Math.max(2, Math.round(co.flow / 7)); for (let i = 0; i < Math.min(nf, 8); i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 28), M({ color: 0x2b3340, metalness: 0.6, roughness: 0.5 })); f.position.set(-Lb * 0.4 + (i + 0.5) * (Lb * 0.8 / Math.min(nf, 8)), top + ch * 0.95, 0); g.add(f); }
  }
  // compressor + motor at the +x end
  const cx = Lb / 2 + 0.6, cy = 0.12 + 0.45;
  const comp = new THREE.Mesh(r.ty.comp === 'centrifugal' ? new THREE.CylinderGeometry(0.55, 0.55, 0.4, 32) : new THREE.CylinderGeometry(0.3, 0.3, 1.1, 28), M({ color: 0x1f6f5c, metalness: 0.5, roughness: 0.5 }));
  if (r.ty.comp !== 'centrifugal') comp.rotation.z = Math.PI / 2; else comp.rotation.x = Math.PI / 2; comp.position.set(cx, cy, 0); g.add(comp);
  const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.8, 28), M({ color: 0x33415a, metalness: 0.5, roughness: 0.5 })); mot.rotation.z = Math.PI / 2; mot.position.set(cx + 0.9, cy, 0); g.add(mot);
  box(0.5, 1.2, 0.35, cx + 0.2, 0.6 + 0.12, -width * 0.6, M({ color: 0xe5e9ef, metalness: 0.3, roughness: 0.5 }));  // control panel
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.6 / Math.max(sz.x, sz.y * 2, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.8, 0.6, 1.1] };
}
