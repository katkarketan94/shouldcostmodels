// 3D shunt reactor: gapped limbs with spacer blocks, single winding per limb, return limbs, tank, bushings and radiators.
import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, ...o });
export function reactorScene(r, cut) {
  const g = new THREE.Group(), ph = r.ph, nW = r.nW, nR = r.nR, add = (geo, m, x, y, z) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; };
  const box = (sx, sy, sz, x, y, z, m) => add(new THREE.BoxGeometry(sx, sy, sz), m, x, y, z), cyl = (rt, rb, h, x, y, z, m, n = 32) => add(new THREE.CylinderGeometry(rt, rb, h, n), m, x, y, z);
  const ring = (ro, ri, h, x, y, z, m) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false); const hole = new THREE.Path(); hole.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(hole); const gm = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 40 }); gm.rotateX(-Math.PI / 2); return add(gm, m, x, y, z); };
  const n = nW + nR, x0 = -((n - 1) * r.pitch) / 2, floor = 0.15, yoke = r.dia * 0.6, ay = floor + yoke, Hw = r.Hw;
  const iron = M({ color: 0x5c6470, metalness: 0.75, roughness: 0.4 }), cu = M({ color: 0xc27a2c, metalness: 0.85, roughness: 0.35 }), paper = M({ color: 0xe0c68a, roughness: 0.8 }), spacer = M({ color: 0xe9e2d0, roughness: 0.6 });
  const span = (n - 1) * r.pitch + r.dia;
  box(span + r.dia * 0.3, yoke, r.dia * 0.8, 0, floor + yoke / 2, 0, iron); box(span + r.dia * 0.3, yoke, r.dia * 0.8, 0, ay + Hw + yoke / 2, 0, iron);
  const order = []; for (let i = 0; i < n; i++) order.push(nR === 2 && (i === 0 || i === n - 1) || (ph === 1 && i !== 1) ? 'ret' : 'wound');
  order.forEach((kind, i) => {
    const x = x0 + i * r.pitch;
    if (kind === 'ret') { cyl(r.dia * 0.3, r.dia * 0.3, Hw, x, ay + Hw / 2, 0, iron); return; }
    const gapH = Math.min(0.08, r.gapEach) * 1.0, total = r.nGaps, usable = Hw * 0.85;
    const segH = (usable - total * gapH * 0.3) / (total + 1);
    // limb as stacked iron discs separated by gap spacers
    for (let k = 0; k <= total; k++) cyl(r.dia / 2 * 0.95, r.dia / 2 * 0.95, Math.max(0.02, segH), x, ay + Hw * 0.075 + k * (segH + gapH * 0.3) + segH / 2, 0, iron);
    for (let k = 0; k < total; k++) cyl(r.dia / 2 * 0.95, r.dia / 2 * 0.95, gapH * 0.3, x, ay + Hw * 0.075 + (k + 1) * segH + k * (gapH * 0.3) + gapH * 0.15, 0, spacer);
    ring(r.Dout / 2, r.Din / 2, r.H, x, ay + (Hw - r.H) / 2, 0, cu); ring(r.Dout / 2 + 0.012, r.Dout / 2, r.H, x, ay + (Hw - r.H) / 2, 0, paper);
  });
  const tank = M({ color: 0x6f8aa6, metalness: 0.45, roughness: 0.55, transparent: cut, opacity: cut ? 0.2 : 1 }), L = r.tL, W = r.tW, H = r.tH, ty = H / 2 + 0.05, lid = ty + H / 2;
  box(L, H, 0.02, 0, ty, -W / 2, tank); box(L, H, 0.02, 0, ty, W / 2, tank); box(0.02, H, W, -L / 2, ty, 0, tank); box(0.02, H, W, L / 2, ty, 0, tank); box(L, 0.03, W, 0, ty + H / 2, 0, tank);
  if (cut) { const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x5b6573 })); ed.position.set(0, ty, 0); g.add(ed); }
  const bush = (x, z, h, col) => { cyl(0.05 + h * 0.03, 0.05 + h * 0.03, h, x, lid + h / 2, z, M({ color: col, roughness: 0.4 })); const m = Math.max(3, Math.round(h * 6)); for (let k = 1; k < m; k++) cyl(0.09 + h * 0.04, 0.09 + h * 0.04, 0.012, x, lid + h * k / m, z, M({ color: col, roughness: 0.4 })); };
  const hvH = Math.min(2.6, 0.3 + r.cfg.kv * 0.0042), wx = []; order.forEach((k, i) => { if (k === 'wound') wx.push(x0 + i * r.pitch); });
  wx.forEach((x) => bush(x, -W * 0.15, hvH, 0xb86b3a)); if (ph === 3) bush(wx[wx.length - 1] + r.pitch * 0.55, W * 0.15, hvH * 0.4, 0xa9b4c0);
  const cd = Math.max(0.2, H * 0.14); cyl(cd / 2, cd / 2, L * 0.7, 0, lid + hvH * 0.4 + cd / 2 + 0.2, W * 0.1, M({ color: 0x7f93a8, metalness: 0.5, roughness: 0.5 })).rotation.z = Math.PI / 2;
  const nrad = Math.min(24, Math.max(2, Math.round(r.radA / (2.5 * 0.52 * 2)))), rh = Math.min(2.5, H * 0.8);
  for (let i = 0; i < nrad; i++) box(0.52, rh, 0.06, -L / 2 + 0.4 + (i % 12) * ((L - 0.8) / 11), ty - H * 0.05, (i < 12 ? 1 : -1) * (W / 2 + 0.2), M({ color: 0x8794a1, metalness: 0.5, roughness: 0.5 }));
  box(L * 1.04, 0.12, W * 1.04, 0, 0, 0, M({ color: 0x3f4753, metalness: 0.6, roughness: 0.5 }));
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.6 / Math.max(sz.x, sz.y * 1.7, sz.z * 1.6)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.55, 0.45, 1.3] };
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n2 = (v, d = 2) => Number(v).toFixed(d);
export function reactorSectionSVG(r) {
  const k = 240 / r.Hw, cx = 300, X0 = 150, top = 90, Hp = r.Hw * k, w = r.dia * k * 0.9, nG = Math.min(r.nGaps, 14), segs = [];
  const gapPx = Math.max(2, Math.min(10, Hp * 0.4 / nG)), segH = (Hp - nG * gapPx) / (nG + 1);
  for (let i = 0; i <= nG; i++) segs.push(`<rect x="${cx - w / 2}" y="${top + i * (segH + gapPx)}" width="${w}" height="${segH}" fill="#5c6470"/>`);
  for (let i = 0; i < nG; i++) segs.push(`<rect x="${cx - w / 2}" y="${top + (i + 1) * segH + i * gapPx}" width="${w}" height="${gapPx}" fill="#e9e2d0" stroke="#b9ad8a" stroke-width=".6"/>`);
  const rb = Math.max(8, r.Rb * k), gcw = (r.Din - r.dia) / 2 * k, wy = top + (Hp - r.H * k) / 2;
  const coil = [-1, 1].map((s) => `<rect x="${cx + s * (w / 2 + gcw) - (s > 0 ? 0 : rb)}" y="${wy}" width="${rb}" height="${r.H * k}" fill="#d29a52" stroke="#2a3340" stroke-width=".8"/>`).join('');
  return `<svg viewBox="0 0 880 400" class="sxsvg" role="img" aria-label="Gapped limb"><rect width="880" height="400" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">Gapped limb · ${n2(r.cfg.mvar, 1)} MVAr ${r.cfg.kv} kV</text><text x="40" y="54" font-size="12" fill="#6b7482">One wound limb in elevation: iron stack interrupted by ${r.nGaps} gaps, with the winding around it (${r.nW} wound limb${r.nW > 1 ? 's' : ''}${r.nR ? `, ${r.nR} return limbs` : ''})</text>
    ${segs.join('')}${coil}
    <line x1="${cx + w / 2 + gcw + rb + 36}" y1="${top}" x2="${cx + w / 2 + gcw + rb + 36}" y2="${top + Hp}" stroke="#1e2530"/><text x="${cx + w / 2 + gcw + rb + 46}" y="${top + Hp / 2}" font-size="12.5" font-weight="600" fill="#1e2530">window ${n2(r.Hw)} m</text>
    <g font-size="12" fill="#3a4350"><text x="520" y="110" font-weight="700">Total air gap</text><text x="520" y="128">${n2(r.lgTotal * 1000, 0)} mm in ${r.nGaps} gaps of ${n2(r.gapEach * 1000, 1)} mm</text>
    <text x="520" y="156" font-weight="700">Flux density</text><text x="520" y="174">${n2(r.bm)} T at rated voltage · net iron ${n2(r.Anet, 3)} m²</text>
    <text x="520" y="202" font-weight="700">Winding</text><text x="520" y="220">${r.N} turns · J ${n2(r.J)} A/mm² · radial build ${n2(r.Rb * 1000, 0)} mm</text>
    <text x="520" y="248" font-weight="700">Rated current</text><text x="520" y="266">${n2(r.I, 0)} A per phase · X ${n2(r.X, 0)} Ω · L ${n2(r.L, 2)} H</text></g></svg>`;
}
