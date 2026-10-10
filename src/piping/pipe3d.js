// 3D model and cross-section of a pipe from layer thicknesses (mm): wall, linings, coatings, plus end treatment.
import * as THREE from 'three';

const M = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
const METAL = { 'Mild steel': 0x8f98a3, 'Carbon Steel': 0x7e8792, 'Stainless steel': 0xdfe5ec, 'Ductile Iron': 0x5f6670, 'Inconel 625': 0xb4bcc6, 'Inconel 825': 0xaab3be };

/** layers from the bore outwards: [{ ri, ro, color, metalness, roughness, name }] in mm */
export function metalLayers(r, c) {
  const od = r.od, id = r.id, ro = od / 2, ri = id / 2, ex = Math.max(od * 0.012, 3);          // coatings are drawn thicker than real so they stay visible
  const L = [{ ri, ro, color: METAL[c.moc] ?? 0x8f98a3, metalness: 0.85, roughness: 0.38, name: `${c.moc} wall · ${r.wall} mm` }];
  const inner = c.coatSurf === 'Inner coating only' || c.coatSurf === 'Inner+Outer coating', outer = c.coatSurf === 'Outer coating only' || c.coatSurf === 'Inner+Outer coating';
  const coatCol = c.coat === '3 LPE' ? 0x23262b : c.coat === 'NA' ? null : 0x2f8f83;
  if (c.cement === 'Yes') L.unshift({ ri: ri - ex * 1.6, ro: ri, color: 0xb9b6ad, metalness: 0.05, roughness: 0.95, name: 'Cement mortar lining' });
  if (inner && coatCol != null) L.unshift({ ri: ri - ex, ro: ri, color: coatCol, metalness: 0.2, roughness: 0.55, name: `${c.coat} (inside)` });
  if (c.galv === 'Yes') L.push({ ri: ro, ro: ro + ex * 0.7, color: 0xe9eef4, metalness: 0.9, roughness: 0.25, name: 'Zinc galvanising' });
  const top = () => L[L.length - 1].ro;
  if (c.paint !== 'NA') L.push({ ri: top(), ro: top() + ex * 0.8, color: c.paint === 'Zinc Primer' ? 0x9aa7a0 : 0xa8452f, metalness: 0.1, roughness: 0.7, name: `${c.paint} paint` });
  if (outer && coatCol != null) L.push({ ri: top(), ro: top() + ex, color: coatCol, metalness: 0.2, roughness: 0.55, name: `${c.coat} (outside)` });
  return L;
}
export function plasticLayers(r, c, color) {
  const L = [{ ri: r.id / 2, ro: r.cfg.od / 2, color, metalness: 0.05, roughness: 0.55, name: `${c.family} wall · ${r.wall} mm` }];
  if (c.family === 'HDPE PE100') L.push({ ri: r.cfg.od / 2, ro: r.cfg.od / 2 + 0.01, color: 0x2f6fd6, metalness: 0, roughness: 0.6, name: 'Blue identification stripe', stripe: true });
  return L;
}

function ring(g, ri, ro, len, x0, a0, a1, mat) {
  const N = 72, outer = [], inner = [];
  for (let i = 0; i <= N; i++) { const a = a0 + (a1 - a0) * i / N; outer.push(new THREE.Vector2(Math.sin(a) * ro, Math.cos(a) * ro)); inner.push(new THREE.Vector2(Math.sin(a) * ri, Math.cos(a) * ri)); }
  const full = a1 - a0 > Math.PI * 2 - 1e-6, shp = new THREE.Shape(full ? outer.slice(0, N) : [...outer, ...inner.slice().reverse()]);
  if (full) shp.holes.push(new THREE.Path(inner.slice(0, N).reverse()));
  const gm = new THREE.ExtrudeGeometry(shp, { depth: len, bevelEnabled: false, curveSegments: 1 }); gm.translate(0, 0, -len / 2); gm.rotateY(Math.PI / 2); gm.translate(x0, 0, 0);
  const me = new THREE.Mesh(gm, mat); me.castShadow = me.receiveShadow = true; g.add(me); return me;
}

export function pipeScene(layers, opt, cut) {
  const g = new THREE.Group(), od = Math.max(...layers.map((l) => l.ro)) * 2, L = Math.max(od * 2.4, layers[0].ro * 2 * 1.2);
  const a0 = cut ? 0.32 * Math.PI : 0, a1 = cut ? 1.68 * Math.PI : Math.PI * 2;
  for (const l of layers) { if (l.stripe) continue; ring(g, l.ri, l.ro, L, 0, a0, a1, M({ color: l.color, metalness: l.metalness, roughness: l.roughness })); }
  const wall = layers.find((l) => !l.stripe && !/lining|coating|galv|paint|\(inside\)|\(outside\)/.test(l.name)) || layers[0];
  if (opt.stripe) for (const ang of [0.15, 1.72, 3.29, 4.86]) { if (cut && ang + 0.1 > a0 && ang < a1 && ang > a0 - 0.1 && ang < a0 + 0.1) continue; ring(g, wall.ro * 0.995, wall.ro * 1.012, L, 0, ang, ang + 0.1, M({ color: 0x2f6fd6, metalness: 0, roughness: 0.6 })); }
  const top = Math.max(...layers.map((l) => l.ro));
  if (opt.end === 'Bevelled end') for (const s of [-1, 1]) ring(g, wall.ri, wall.ro, od * 0.018, s * (L / 2 - od * 0.009), a0, a1, M({ color: 0xe8edf3, metalness: 0.9, roughness: 0.25 }));
  if (opt.end === 'Threaded end') for (const s of [-1, 1]) for (let i = 0; i < 6; i++) ring(g, wall.ro, wall.ro * 1.025, od * 0.012, s * (L / 2 - od * (0.04 + i * 0.03)), a0, a1, M({ color: 0xcdd5de, metalness: 0.9, roughness: 0.3 }));
  if (opt.socket) { ring(g, top, top * 1.2, L * 0.16, -L / 2 + L * 0.08, a0, a1, M({ color: layers[0].color, metalness: 0.7, roughness: 0.45 })); ring(g, top * 1.2, top * 1.2 + wall.ro * 0.05, L * 0.02, -L / 2 + L * 0.17, a0, a1, M({ color: 0x1b1d21, roughness: 0.8 })); }
  if (opt.flange) for (const s of [-1, 1]) ring(g, wall.ri, top * 1.35, od * 0.05, s * (L / 2 - od * 0.025), a0, a1, M({ color: layers[0].color, metalness: 0.8, roughness: 0.4 }));
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.4 / Math.max(sz.x, sz.y * 2, sz.z * 2)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y;
  return { group: g, preset: [0.55, 0.45, 1.3] };
}

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const hex = (n) => '#' + n.toString(16).padStart(6, '0');
export function pipeSectionSVG(title, subtitle, layers, od, wall, id, notes) {
  const W = 880, H = 420, cx = 300, cy = 230, top = Math.max(...layers.map((l) => l.ro)), k = 150 / top;
  const wallLayer = layers.find((l) => !l.stripe && /wall/.test(l.name)) || layers[0];
  // keep thin walls visible: the drawn wall is at least 5 px
  const drawWall = Math.max(5, (wallLayer.ro - wallLayer.ri) * k), shift = drawWall - (wallLayer.ro - wallLayer.ri) * k;
  const rr = (l) => ({ ri: l.ri * k + (l.ri >= wallLayer.ro - 1e-9 ? shift : 0), ro: l.ro * k + (l.ro > wallLayer.ri + 1e-9 ? shift : 0) });
  const rings = layers.filter((l) => !l.stripe).map((l) => { const p = rr(l); return `<circle cx="${cx}" cy="${cy}" r="${(p.ri + p.ro) / 2}" fill="none" stroke="${hex(l.color)}" stroke-width="${Math.max(p.ro - p.ri, 1.5)}"/><circle cx="${cx}" cy="${cy}" r="${p.ro}" fill="none" stroke="#3a4350" stroke-width=".8"/>`; }).join('');
  const rOut = rr(wallLayer).ro, rIn = rr(wallLayer).ri;
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Pipe cross-section"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(title)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(subtitle)}</text>
    <circle cx="${cx}" cy="${cy}" r="${rIn}" fill="#eef3f9"/>${rings}
    <line x1="${cx - rOut}" y1="${cy + rOut + 26}" x2="${cx + rOut}" y2="${cy + rOut + 26}" stroke="#1e2530"/><text x="${cx}" y="${cy + rOut + 44}" text-anchor="middle" font-size="13" font-weight="600" fill="#1e2530">OD ${Number(od).toFixed(od % 1 ? 1 : 0)} mm</text>
    <line x1="${cx - rIn}" y1="${cy}" x2="${cx + rIn}" y2="${cy}" stroke="#2f6fd6" stroke-dasharray="4 3"/><text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="12" fill="#2f6fd6" font-weight="600">ID ${Number(id).toFixed(1)} mm</text>
    <g font-size="12" fill="#3a4350"><text x="560" y="110" font-weight="700">Wall</text><text x="560" y="128">${wall} mm (drawn thicker if thin)</text>
    ${layers.filter((l) => !l.stripe).map((l, i) => `<rect x="560" y="${152 + i * 26}" width="12" height="12" rx="3" fill="${hex(l.color)}" stroke="#3a4350" stroke-width=".6"/><text x="580" y="${163 + i * 26}">${esc(l.name)}</text>`).join('')}
    ${notes.map((n, i) => `<text x="560" y="${170 + layers.length * 26 + i * 18}" fill="#6b7482">${esc(n)}</text>`).join('')}</g></svg>`;
}
