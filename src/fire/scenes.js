// 3D scenes and plan drawings for the three fire & life safety models.
import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const fit = (g, size = 5.6) => { const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(size / Math.max(sz.x, sz.y * 2.2, sz.z * 1.4)); g.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2; g.position.z -= (b2.min.z + b2.max.z) / 2; };
const helpers = (g) => ({
  box: (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; },
  cyl: (r1, r2, h, x, y, z, m, rot = '') => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 14), m); c.position.set(x, y, z); if (rot === 'x') c.rotation.z = Math.PI / 2; if (rot === 'z') c.rotation.x = Math.PI / 2; c.castShadow = true; g.add(c); return c; },
});
const plateDims = (area, floors) => { const fa = area / floors, L = Math.sqrt(fa * 1.6), W = fa / L; return { L, W }; };

export function waterScene(r) {
  const g = new THREE.Group(), { box, cyl } = helpers(g), c = r.cfg, { L, W } = plateDims(c.area, c.floors);
  const slab = M({ color: 0xcfd6de, roughness: 0.9 }), red = M({ color: 0xd1342b, metalness: 0.4, roughness: 0.5 }), pipeM = M({ color: 0xc23b2f, metalness: 0.5, roughness: 0.45 }), head = M({ color: 0xe8c04a, metalness: 0.7, roughness: 0.3 });
  const fl = Math.min(c.floors, 3), fh = Math.max(3, c.height / c.floors) * (L / 60 > 1 ? 1 : 1);
  const sc = L / 60;                               // keep fittings readable on large plates
  for (let f = 0; f < fl; f++) {
    const y = f * fh * 1.0; box(L, 0.15 * sc + 0.1, W, 0, y, 0, slab);
    const ny = Math.max(2, Math.min(9, Math.round(W / (3.2 * sc)))), nx = Math.max(3, Math.min(22, Math.round(L / (3.2 * sc))));
    cyl(0.07 * sc, 0.07 * sc, L, 0, y + fh - 0.25 * sc, -W / 2 + 0.3 * sc, pipeM, 'x');                                   // cross main
    for (let j = 0; j < ny; j++) { const z = -W / 2 + 0.3 * sc + (j + 0.5) * ((W - 0.6 * sc) / ny); cyl(0.035 * sc, 0.035 * sc, L * 0.96, 0, y + fh - 0.25 * sc, z, pipeM, 'x'); for (let i = 0; i < nx; i++) { const x = -L / 2 + (i + 0.5) * (L / nx); cyl(0.045 * sc, 0.045 * sc, 0.18 * sc, x, y + fh - 0.36 * sc, z, head); } }
    for (let k = 0; k < 4; k++) box(0.12 * sc, fh, 0.12 * sc, -L / 2 + k * L / 3, y + fh / 2, -W / 2, M({ color: 0x9aa3ad, roughness: 0.8 }));   // columns
  }
  cyl(0.11 * sc, 0.11 * sc, fl * fh, -L / 2 + 0.3 * sc, fl * fh / 2, -W / 2 + 0.3 * sc, pipeM);                      // riser
  // pump house, tank and yard main
  box(0.18 * L, 0.25 * L * 0.5, 0.2 * W, -L / 2 - 0.15 * L, 0.06 * L, 0, M({ color: 0xb7c0ca, roughness: 0.7 }));
  for (let i = 0; i < 3; i++) { cyl(0.025 * L, 0.025 * L, 0.06 * L, -L / 2 - 0.19 * L + i * 0.06 * L, 0.16 * L, 0, M({ color: i === 2 ? 0x2f6fd6 : 0x1f6f5c, metalness: 0.5, roughness: 0.5 }), 'x'); }
  box(0.25 * L, 0.15 * L, 0.25 * W, -L / 2 - 0.55 * L, 0.04 * L, 0, M({ color: 0x6aa9d8, transparent: true, opacity: 0.6, roughness: 0.3 }));
  cyl(0.012 * L, 0.012 * L, L * 1.25, 0.1 * L, -0.02 * L, W / 2 + 0.12 * W, M({ color: 0x1b1d21, roughness: 0.7 }), 'x');
  for (let h = 0; h < Math.min(8, r.external); h++) cyl(0.008 * L, 0.008 * L, 0.05 * L, -0.5 * L + h * (L * 1.1 / 8), 0.02 * L, W / 2 + 0.12 * W, red);
  fit(g); return { group: g, preset: [0.6, 0.55, 1.2] };
}
export function alarmScene(r) {
  const g = new THREE.Group(), { box, cyl } = helpers(g), c = r.cfg, { L, W } = plateDims(c.area, c.floors), sc = L / 60;
  const slab = M({ color: 0xcfd6de, roughness: 0.9 });
  box(L, 0.15 * sc + 0.1, W, 0, 0, 0, slab); box(L, 0.04, W, 0, 3 * sc, 0, M({ color: 0xe6ebf0, transparent: true, opacity: 0.25, roughness: 0.5 }));
  const nx = Math.max(4, Math.min(30, Math.round(L / (5.5 * sc)))), ny = Math.max(2, Math.min(14, Math.round(W / (5.5 * sc))));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = -L / 2 + (i + 0.5) * L / nx, z = -W / 2 + (j + 0.5) * W / ny; cyl(0.17 * sc, 0.17 * sc, 0.1 * sc, x, 2.95 * sc, z, M({ color: 0xf6f7f9, roughness: 0.4 })); if ((i + j) % 4 === 0) cyl(0.07 * sc, 0.07 * sc, 0.05 * sc, x + 0.28 * sc, 2.97 * sc, z, M({ color: 0xd1342b })); }
  for (let j = 0; j < Math.min(ny, 6); j++) cyl(0.015 * sc, 0.015 * sc, L, 0, 3.02 * sc, -W / 2 + (j + 0.5) * W / ny, M({ color: 0x2b3340 }), 'x');
  for (let k = 0; k < 6; k++) { const x = -L / 2 + (k + 0.5) * L / 6; box(0.25 * sc, 0.35 * sc, 0.1 * sc, x, 1.1 * sc, -W / 2, M({ color: 0xd1342b })); box(0.3 * sc, 0.2 * sc, 0.1 * sc, x, 2.4 * sc, W / 2, M({ color: 0xe8a42b })); }
  box(0.7 * sc, 1.6 * sc, 0.4 * sc, -L / 2 + 0.6 * sc, 0.9 * sc, 0, M({ color: 0xe5e9ef, metalness: 0.3 })); box(0.4 * sc, 0.5 * sc, 0.02, -L / 2 + 0.6 * sc, 1.3 * sc, 0.22 * sc, M({ color: 0x1b2a3a }));
  fit(g); return { group: g, preset: [0.5, 0.6, 1.2] };
}
export function gasScene(r, cut) {
  const g = new THREE.Group(), { box, cyl } = helpers(g), c = r.cfg, area = r.floor / c.rooms, L = Math.sqrt(area * 1.5), W = area / L, H = c.height;
  const wall = M({ color: 0x8a96a3, metalness: 0.2, roughness: 0.7, transparent: cut, opacity: cut ? 0.14 : 1 });
  box(L, 0.1, W, 0, 0, 0, M({ color: 0xcfd6de })); box(L, H, 0.08, 0, H / 2, -W / 2, wall); box(L, H, 0.08, 0, H / 2, W / 2, wall); box(0.08, H, W, -L / 2, H / 2, 0, wall); box(0.08, H, W, L / 2, H / 2, 0, wall); box(L, 0.08, W, 0, H, 0, wall);
  const red = M({ color: r.ag.kind === 'inert' ? 0x2f8f4e : r.ag.kind === 'co2' ? 0x2b2f36 : 0xd1342b, metalness: 0.5, roughness: 0.4 });
  const nc = Math.min(r.cyl, 24), cols = Math.min(nc, 8), cr = Math.max(0.12, Math.min(0.2, Math.sqrt(r.cylSize / 1000 / (Math.PI * 1.5)))), ch = Math.max(0.9, Math.min(1.7, r.cylSize / 1000 / (Math.PI * cr * cr)));
  for (let i = 0; i < nc; i++) { const x = -L / 2 + 0.5 + (i % cols) * (cr * 2.3), z = -W / 2 + 0.45 + Math.floor(i / cols) * (cr * 2.4); cyl(cr, cr, ch, x, ch / 2 + 0.1, z, red); cyl(cr * 0.5, cr * 0.5, 0.12, x, ch + 0.16, z, M({ color: 0xb9a35a, metalness: 0.8 })); }
  const pipe = M({ color: 0xb8bec6, metalness: 0.7, roughness: 0.4 }); cyl(0.05, 0.05, L * 0.9, 0, H - 0.3, -W / 2 + 0.4, pipe, 'x');
  for (let n = 0; n < r.nozzles; n++) { const x = -L / 2 + (n + 0.5) * L / r.nozzles; cyl(0.03, 0.03, 0.5, x, H - 0.55, -W / 2 + 0.4, pipe); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 14), M({ color: 0xe8c04a, metalness: 0.7 })); cone.position.set(x, H - 0.85, -W / 2 + 0.4); cone.rotation.x = Math.PI; g.add(cone); }
  for (let i = 0; i < 6; i++) cyl(0.09, 0.09, 0.05, -L / 2 + (i + 0.5) * L / 6, H - 0.03, W * 0.15, M({ color: 0xf6f7f9 }));
  box(0.5, 0.7, 0.18, L / 2 - 0.5, 1.3, W / 2 - 0.1, M({ color: 0xd1342b })); box(1.0, 2.1, 0.06, L * 0.1, 1.05, W / 2 + 0.01, M({ color: 0x5b6573, transparent: cut, opacity: cut ? 0.3 : 1 }));
  fit(g, 5.2); return { group: g, preset: [0.6, 0.5, 1.2] };
}

export function planSVG(title, sub, L, W, dots, color, facts, extra = '') {
  const k = Math.min(520 / L, 230 / W), x0 = 60, y0 = 100, wpx = L * k, hpx = W * k, nx = Math.max(3, Math.round(Math.sqrt(dots * L / W))), ny = Math.max(2, Math.round(dots / nx)), step = Math.max(1, Math.ceil((nx * ny) / 900)), pts = [];
  for (let j = 0; j < ny; j += 1) for (let i = 0; i < nx; i += step) pts.push(`<circle cx="${x0 + (i + 0.5) * wpx / nx}" cy="${y0 + (j + 0.5) * hpx / ny}" r="${Math.max(1.4, Math.min(3, 160 / nx))}" fill="${color}"/>`);
  return `<svg viewBox="0 0 880 400" class="sxsvg" role="img" aria-label="Plan"><rect width="880" height="400" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(title)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(sub)}</text>
    <rect x="${x0}" y="${y0}" width="${wpx}" height="${hpx}" fill="#fff" stroke="#5b6573" stroke-width="2"/>${pts.join('')}${extra.replace(/\{x0\}/g, x0).replace(/\{y0\}/g, y0).replace(/\{w\}/g, wpx).replace(/\{h\}/g, hpx)}
    <g font-size="12" fill="#3a4350">${facts.map(([a, b], i) => `<text x="${x0 + wpx + 40}" y="${y0 + 14 + i * 40}" font-weight="700">${esc(a)}</text><text x="${x0 + wpx + 40}" y="${y0 + 32 + i * 40}">${esc(b)}</text>`).join('')}</g>
    <text x="${x0}" y="${y0 + hpx + 28}" font-size="12" fill="#6b7482">${L.toFixed(0)} × ${W.toFixed(0)} m typical floor plate (drawn with a representative grid)</text></svg>`;
}
export { plateDims };
