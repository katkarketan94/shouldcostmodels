import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export function ctowerScene(r, cut) {
  const g = new THREE.Group(), ty = r.ty, nat = !!ty.natural, cells = Math.min(r.cells, 8);
  const col = ty.casing === 'FRP' ? 0x6f9fbf : ty.casing === 'RCC' ? 0xaab0b8 : 0x8a95a3, mat = M({ color: col, metalness: 0.2, roughness: 0.6, transparent: cut, opacity: cut ? 0.3 : 1, side: THREE.DoubleSide });
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  if (nat) {
    const R = Math.sqrt(r.plan / Math.PI), H = R * 1.6, prof = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20, rad = R * (1 - 0.42 * Math.sin(Math.min(1, t / 0.75) * Math.PI / 2) + 0.12 * Math.max(0, t - 0.75) * 4); prof.push(new THREE.Vector2(rad, t * H)); }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), mat));
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.96, R * 0.96, r.depth, 40), M({ color: 0x35505f, roughness: 0.9 })); fill.position.y = r.depth / 2 + 0.2; g.add(fill);
  } else {
    const side = r.side, gap = side * 0.08, tot = cells * side + (cells - 1) * gap, hCell = r.height;
    for (let i = 0; i < cells; i++) {
      const x = -tot / 2 + side / 2 + i * (side + gap);
      box(side, 0.4, side, x, 0.2, 0, M({ color: 0x4b5563, roughness: 0.8 }));
      box(side, hCell - 0.6, side, x, 0.4 + (hCell - 0.6) / 2, 0, mat);
      box(side * 0.98, r.depth, side * 0.98, x, 1.3 + r.depth / 2, 0, M({ color: 0x2d4658, roughness: 0.9 }));
      if (!cut) for (let k = 0; k < 6; k++) box(side * 1.01, 0.06, side * 1.01, x, 0.5 + k * 0.15, 0, M({ color: 0x1f2a36 }));
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(r.fanDia * 0.62, r.fanDia * 0.78, hCell * 0.22, 36, 1, true), M({ color: 0x7e8794, side: THREE.DoubleSide, metalness: 0.3, roughness: 0.6 })); stack.position.set(x, hCell + hCell * 0.11 - 0.1, 0); g.add(stack);
      for (let b = 0; b < 6; b++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(r.fanDia * 0.5, 0.03, r.fanDia * 0.09), M({ color: 0xe5e9ef })); bl.geometry.translate(r.fanDia * 0.27, 0, 0); bl.position.set(x, hCell + 0.05, 0); bl.rotation.y = b * Math.PI / 3; g.add(bl); }
      const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 20), M({ color: 0x33415a })); mot.position.set(x, hCell + 0.35, 0); g.add(mot);
    }
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5.6 / Math.max(sz.x, sz.y * 1.3, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.55, 1.1] };
}

export function ctowerSectionSVG(r) {
  const c = r.cfg, W = 880, H = 440, x0 = 300, w = 280, top = 90, bas = 380, fillH = Math.min(120, 55 + r.depth * 30), fy = 215;
  const arrow = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" marker-end="url(#ah)"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Cooling tower section"><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#5b6573"/></marker></defs><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Cooling tower')}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(c.type)} · ${r.cells} cell${r.cells > 1 ? 's' : ''} · section through one cell</text>
    <rect x="${x0}" y="${bas}" width="${w}" height="14" fill="#9fb3c8" stroke="#5b6573"/><rect x="${x0}" y="${top + 40}" width="${w}" height="${bas - top - 40}" fill="none" stroke="#5b6573" stroke-width="2"/>
    <rect x="${x0 + 2}" y="${fy}" width="${w - 4}" height="${fillH}" fill="#4c7087" opacity=".75"/>${Array.from({ length: 7 }, (_, i) => `<line x1="${x0 + 2}" x2="${x0 + w - 2}" y1="${fy + (i + 1) * fillH / 8}" y2="${fy + (i + 1) * fillH / 8}" stroke="#d6e2ea"/>`).join('')}
    <rect x="${x0 + 2}" y="${fy - 22}" width="${w - 4}" height="8" fill="#2f6fd6" opacity=".35"/>
    <path d="M${x0 + 40} ${top + 40} L${x0 + 40} ${top} L${x0 + w - 40} ${top} L${x0 + w - 40} ${top + 40}" fill="#e7ebf3" stroke="#5b6573" stroke-width="2"/><circle cx="${x0 + w / 2}" cy="${top + 20}" r="10" fill="#1f2a36"/><line x1="${x0 + w / 2 - 60}" y1="${top + 22}" x2="${x0 + w / 2 + 60}" y2="${top + 18}" stroke="#444" stroke-width="5"/>
    ${arrow(x0 + w / 2, top - 6, x0 + w / 2, top - 40, '#7a8794')}<text x="${x0 + w / 2 + 14}" y="${top - 22}" font-size="12" fill="#556070">warm saturated air · ${n(r.airM3s / r.cells, 0)} m³/s per cell</text>
    ${arrow(x0 - 80, 300, x0 - 4, 300, '#6b7a89')}${arrow(x0 + w + 80, 300, x0 + w + 4, 300, '#6b7a89')}<text x="${x0 - 230}" y="320" font-size="12" fill="#556070">ambient air · wet-bulb ${c.wb} °C</text>
    ${arrow(60, 170, x0 + w / 2 - 20, 170, '#d64545')}<text x="60" y="152" font-size="13" font-weight="700" fill="#d64545">Hot water in ${n(r.tIn, 1)} °C</text><text x="60" y="190" font-size="12" fill="#6b7482">${n(r.flow, 0)} m³/h · ${n(c.kw)} kW</text>
    ${arrow(x0 + w / 2, bas + 16, x0 + w / 2, bas + 40, '#2f6fd6')}<text x="${x0 + w / 2 + 14}" y="${bas + 36}" font-size="13" font-weight="700" fill="#2f6fd6">Cold water out ${n(r.tOut, 1)} °C</text>
    <text x="${x0 + w + 20}" y="${fy + fillH / 2}" font-size="12" fill="#556070">fill ${n(r.depth, 2)} m deep</text><text x="${x0 + w + 20}" y="${fy + fillH / 2 + 16}" font-size="12" fill="#556070">L/G ${n(r.lg, 2)} · Merkel ${n(r.me, 2)}</text>
    <text x="40" y="425" font-size="12" fill="#6b7482">Range ${c.range} K · approach ${c.approach} K · fan ${n(r.fanKw, 0)} kW total</text></svg>`;
}
