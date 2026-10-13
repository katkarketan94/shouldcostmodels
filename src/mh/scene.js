import * as THREE from 'three';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n0 = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const WCOL = { 650: '#94a3b8', 800: '#94a3b8', 1000: '#7aa7c7', 1200: '#7aa7c7', 1400: '#4f86b8', 1600: '#2f6fb0', 1800: '#1f4f8f', 2000: '#183d70', 2200: '#102a50' };
// flow diagram of the package: front-end equipment chain, then every conveyor as a bar to scale
export function mhPlanSVG(r) {
  const c = r.cfg, W = 880, rows = r.convs, rh = 17, H = Math.max(440, 190 + rows.length * rh + 40), maxLen = Math.max(1, ...rows.map((x) => x.len)), x0 = 130, bw = 380;
  const chain = [['Wagon tippler', c.wt], ['Apron feeder', c.apron], ['Crusher', c.crusher], ['Vib. feeder', c.vfeeder], ['Stacker-reclaimer', c.scr]].filter((x) => x[1] > 0);
  const boxes = chain.map(([l, n], i) => { const x = 40 + i * 165; return `<rect x="${x}" y="78" width="140" height="44" rx="8" fill="#e9eef5" stroke="#5b6573"/><text x="${x + 70}" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="#1e2530">${l}</text><text x="${x + 70}" y="114" text-anchor="middle" font-size="11" fill="#6b7482">${n} nos</text>${i < chain.length - 1 ? `<path d="M${x + 142} 100 h21" stroke="#5b6573" stroke-width="2" marker-end="url(#mh)"/>` : ''}`; }).join('');
  const ash = c.ahs?.on ? `<rect x="40" y="78" width="200" height="44" rx="8" fill="#f3ede4" stroke="#5b6573"/><text x="140" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="#1e2530">Bottom ash · ${c.ahs.baTph} t/h per unit</text><text x="140" y="114" text-anchor="middle" font-size="11" fill="#6b7482">${c.ahs.units} units, ${c.ahs.hopper} hoppers</text><rect x="260" y="78" width="200" height="44" rx="8" fill="#f3ede4" stroke="#5b6573"/><text x="360" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="#1e2530">Fly ash · ${c.ahs.faTph} t/h per unit</text><text x="360" y="114" text-anchor="middle" font-size="11" fill="#6b7482">${c.ahs.silos} silos + MCSD ${c.ahs.mcsdTph} t/h</text>` : '';
  const bars = rows.map((x, i) => { const y = 160 + i * rh, w = Math.max(6, x.len / maxLen * bw), rise = Math.min(8, (x.lift || 0) / Math.max(1, x.len) * 120);
    return `<text x="${x0 - 8}" y="${y + 11}" text-anchor="end" font-size="11" fill="#1e2530">${esc(x.id)}${x.qty > 1 ? ` ×${x.qty}` : ''}</text><polygon points="${x0},${y + 13} ${x0 + w},${y + 13 - rise} ${x0 + w},${y + 13 - rise - 6} ${x0},${y + 7}" fill="${WCOL[x.width]}"/><circle cx="${x0}" cy="${y + 10}" r="4" fill="#c0392b"/><text x="${x0 + w + 10}" y="${y + 11}" font-size="10.5" fill="#556070">${n0(x.len)} m · B${x.width} · ${n0(x.v, 2)} m/s · ${x.nDrive > 1 ? '2×' : ''}${x.kwEach} kW · ${x.useCord ? 'ST' : 'NN'}${x.rating}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Package flow diagram"><defs><marker id="mh" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#5b6573"/></marker></defs><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${rows.length ? `${rows.length} conveyor routes, ${n0(r.route)} m of belt route; bars to scale (red dot = drive end)` : 'Ash handling package'}</text>${chain.length ? boxes : ash}
    <text x="40" y="150" font-size="12" font-weight="700" fill="#1e2530">${rows.length ? 'Conveyors' : ''}</text>${bars}</svg>`;
}
// gallery of the largest conveyor: stringers, idlers, head drive, tail pulley, chute
export function mhScene(r, cut) {
  const g = new THREE.Group(), x = r.convs.slice().sort((a, b) => b.kwEach * b.nDrive - a.kwEach * a.nDrive)[0];
  const M = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, metalness: o.m ?? 0.35, roughness: o.r ?? 0.6, transparent: !!o.t, opacity: o.t ? 0.25 : 1 });
  if (!x) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3, 32), M('#b8c2ce')); t.position.y = 1.5; g.add(t); return { group: g, preset: [0.8, 0.6, 1.2] }; }
  const Bm = x.Bm, L = Math.min(12, Math.max(5, x.len / 60)), rise = Math.min(L * 0.35, (x.lift || 0) / Math.max(1, x.len) * L * 3), ang = Math.atan2(rise, L), len = Math.hypot(L, rise);
  const bg = new THREE.Group(), box = (sx, sy, sz, px, py, pz, m, par = bg) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(px, py, pz); b.castShadow = true; par.add(b); return b; };
  const w = Bm * 1.0, steel = M('#5a6574'), belt = M('#1d2026', { m: 0.1, r: 0.9 });
  for (const s of [-1, 1]) box(len, 0.12, 0.06, 0, 0, s * (w / 2 + 0.12), steel);                  // stringers
  box(len, 0.03, w * 0.92, 0, 0.1, 0, belt); box(len, 0.03, w * 0.8, 0, -0.1, 0, belt);
  const nI = Math.floor(len / 0.35); for (let i = 0; i < nI; i++) { const px = -len / 2 + 0.2 + i * (len - 0.4) / nI; for (const [dz, rot] of [[0, 0], [-w * 0.3, 0.4], [w * 0.3, -0.4]]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, w * 0.34, 12), M('#9aa3ad')); c.rotation.x = Math.PI / 2 + rot; c.position.set(px, 0.07, dz); bg.add(c); } if (i % 3 === 0) box(0.03, 0.2, w + 0.3, px, 0.0, 0, steel); }
  for (let i = 0; i < Math.floor(len / 1.0); i++) { const px = -len / 2 + 0.5 + i * len / Math.floor(len / 1.0), c = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, w * 0.95, 10), M('#9aa3ad')); c.rotation.x = Math.PI / 2; c.position.set(px, -0.15, 0); bg.add(c); }
  const pulley = (px, rad, col) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, w * 1.05, 28), M(col)); c.rotation.x = Math.PI / 2; c.position.set(px, 0, 0); bg.add(c); };
  pulley(len / 2, 0.16, '#c0392b'); pulley(-len / 2, 0.13, '#8793a1');
  const kw = x.kwEach * x.nDrive; for (let d = 0; d < x.nDrive; d++) { const z = (d ? -1 : 1) * (w / 2 + 0.55); const mo = new THREE.Mesh(new THREE.CylinderGeometry(0.17 + kw / 6000, 0.17 + kw / 6000, 0.55, 20), M(x.ht ? '#2b4a7a' : '#33415a')); mo.rotation.x = Math.PI / 2; mo.position.set(len / 2 + 0.2, 0, z); bg.add(mo); box(0.34, 0.3, 0.3, len / 2, 0, z * 0.78, M('#1f6f5c')); }
  box(0.5, 0.45, w * 0.6, len / 2 + 0.55, -0.35, 0, M('#7a8794'));    // discharge chute
  for (let i = 0; i <= 5; i++) { const px = -len / 2 + i * len / 5; box(0.1, 0.8 + (px + len / 2) * Math.tan(ang) * -0.0, 0.1, px, -0.5, w / 2 + 0.2, steel); box(0.1, 0.8, 0.1, px, -0.5, -w / 2 - 0.2, steel); }
  if (cut) box(len, 0.02, w + 0.5, 0, 0.25, 0, M('#a8d0f0', { t: true }));
  bg.rotation.z = ang; bg.position.y = 1.2 + rise / 2; g.add(bg);
  const col = M('#c9ced6'); for (let i = 0; i <= 3; i++) { const px = -len / 2 * Math.cos(ang) + i * len * Math.cos(ang) / 3, top = 1.2 + rise / 2 + Math.sin(ang) * (px) - 0.4; box(0.16, Math.max(0.4, top), 0.16, px, Math.max(0.4, top) / 2, w / 2 + 0.3, col, g); box(0.16, Math.max(0.4, top), 0.16, px, Math.max(0.4, top) / 2, -w / 2 - 0.3, col, g); }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(6.2 / Math.max(sz.x, sz.y * 2.6, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.5, 1.3] };
}
