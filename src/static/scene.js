import * as THREE from 'three';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n0 = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export function stScene(r, cut) {
  const g = new THREE.Group(), M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, metalness: o.m ?? 0.5, roughness: o.r ?? 0.55, transparent: !!o.t, opacity: o.t ? 0.28 : 1, side: THREE.DoubleSide });
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, 0], o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 40, 1, !!o.open), M(col, o)); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, col, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M(col, o)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const ty = r.ty, ghost = cut;
  if (ty === 'cond') {
    const { width: W, height: H, length: L } = r.geo, w = Math.min(W, L * 0.7), h = Math.min(H, w * 0.8);
    box(L, h, w, 0, h / 2 + 0.6, 0, '#8f9aa8', { t: ghost }); box(0.5, h * 1.05, w * 1.05, -L / 2 - 0.25, h / 2 + 0.6, 0, '#2f6fb0'); box(0.5, h * 1.05, w * 1.05, L / 2 + 0.25, h / 2 + 0.6, 0, '#2f6fb0');
    box(L * 0.4, h * 0.5, w * 0.8, 0, h + 0.6 + h * 0.25, 0, '#a3adba', { t: ghost }); for (const x of [-L * 0.3, L * 0.3]) box(0.5, 0.6, w * 0.9, x, 0.3, 0, '#4b5563');
    if (cut) for (let i = -4; i <= 4; i++) for (let j = -2; j <= 2; j++) cyl(0.04, 0.04, L, 0, 0.6 + h / 2 + j * h * 0.12, i * w * 0.09, '#d98a3d', [0, 0, Math.PI / 2], { m: 0.9 });
    cyl(0.25, 0.25, 1.4, -L / 2 - 0.9, h * 0.35 + 0.6, w * 0.25, '#7a8794', [0, 0, Math.PI / 2]); cyl(0.25, 0.25, 1.4, L / 2 + 0.9, h * 0.35 + 0.6, -w * 0.25, '#7a8794', [0, 0, Math.PI / 2]);
  } else if (ty === 'fwh' || ty === 'hx') {
    const D = r.geo.Dsh / 1000, L = r.geo.length;
    cyl(D / 2, D / 2, L, 0, D / 2 + 0.5, 0, '#6e7b8a', [0, 0, Math.PI / 2], { open: false, t: ghost }); for (const s of [-1, 1]) { const hd = new THREE.Mesh(new THREE.SphereGeometry(D / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M('#2f6fb0')); hd.scale.set(0.5, 1, 1); hd.rotation.z = s * -Math.PI / 2; hd.position.set(s * L / 2, D / 2 + 0.5, 0); g.add(hd); }
    for (const x of [-L * 0.3, L * 0.3]) box(0.3, 0.5, D * 0.8, x, 0.25, 0, '#4b5563'); cyl(D * 0.12, D * 0.12, D * 0.6, L * 0.15, D + 0.5 + D * 0.2, 0, '#9aa6b2'); cyl(D * 0.1, D * 0.1, D * 0.5, -L * 0.2, D * 0.1 + 0.5 - D * 0.5, 0, '#9aa6b2');
    if (cut) for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (Math.hypot(i, j) < 3.4) cyl(D * 0.018, D * 0.018, L * 0.98, 0, D / 2 + 0.5 + j * D * 0.1, i * D * 0.1, '#d98a3d', [0, 0, Math.PI / 2], { m: 0.9 });
  } else {
    const D = (r.geo.D || r.cfg.id * 1000) / 1000, L = (r.geo.Lt || r.cfg.tan * 1000) / 1000, horiz = ty === 'dea';
    const rot = horiz ? [0, 0, Math.PI / 2] : [0, 0, 0], cx = 0, cy = horiz ? D / 2 + 0.6 : L / 2 + 1;
    cyl(D / 2, D / 2, L, cx, cy, 0, '#7f8c9b', rot, { t: ghost });
    for (const s of [-1, 1]) { const hd = new THREE.Mesh(new THREE.SphereGeometry(D / 2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M('#6e7b8a')); hd.scale.set(1, 0.5, 1); if (horiz) { hd.rotation.z = s * -Math.PI / 2; hd.scale.set(0.5, 1, 1); hd.position.set(s * L / 2, cy, 0); } else { hd.rotation.x = s < 0 ? Math.PI : 0; hd.position.set(0, cy + s * L / 2, 0); } g.add(hd); }
    if (horiz) { for (const x of [-L * 0.3, L * 0.3]) box(0.4, 0.6, D * 0.8, x, 0.3, 0, '#4b5563'); cyl(D * 0.3, D * 0.3, L * 0.5, L * 0.05, cy + D / 2 + D * 0.25, 0, '#a3adba', [0, 0, Math.PI / 2], { t: ghost }); }
    else cyl(D * 0.52, D * 0.6, 1, 0, 0.5, 0, '#4b5563', [0, 0, 0], { open: true });
    cyl(D * 0.08, D * 0.08, D * 0.5, horiz ? -L * 0.25 : D / 2 + 0.2, horiz ? cy + D / 2 + D * 0.2 : cy + L * 0.3, horiz ? 0 : 0, '#9aa6b2', horiz ? [0, 0, 0] : [0, 0, Math.PI / 2]);
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(5.8 / Math.max(sz.x, sz.y * 1.5, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.55, 1.2] };
}
// cross-section of the tube bundle (tubes drawn on the real pitch, up to a few hundred) with the shell dimensions
export function stSectionSVG(r) {
  const c = r.cfg, W = 880, H = 440, cx = 300, cy = 240, S = 260, ty = r.ty;
  let body = '', dims = [];
  if (ty === 'cond') {
    const { cols, rows } = r.geo, bw = 400, bh = Math.min(300, bw * rows / cols), k = bw / cols, tr = Math.max(1.1, k * 0.32);
    const x0 = cx - bw / 2, y0 = cy - bh / 2; let dots = '';
    const nc = Math.min(cols, 60), nr = Math.min(rows, Math.round(60 * rows / cols)); for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) dots += `<circle cx="${(x0 + (i + 0.5) * bw / nc).toFixed(1)}" cy="${(y0 + (j + 0.5) * bh / nr).toFixed(1)}" r="${Math.max(1.4, bw / nc * 0.3).toFixed(1)}" fill="#d98a3d"/>`;
    body = `<rect x="${x0 - 14}" y="${y0 - 14}" width="${bw + 28}" height="${bh + 28}" rx="6" fill="#eef1f5" stroke="#5b6573" stroke-width="2"/><rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="#f7f1e6" stroke="#9aa6b2"/>${dots}`;
    dims = [['Tubes', `${n0(r.N)} × Ø${c.tubeOD} × ${c.tubeWall} mm`], ['Tube array (drawn)', `about ${cols} × ${rows}`], ['Tube length', `${c.tubeLen} m`], ['Shell (approx.)', `${n0(r.geo.width, 1)} × ${n0(r.geo.height, 1)} m`], ['Weight', `${n0(r.weight / 1000)} t`]];
  } else if (ty === 'fwh' || ty === 'hx') {
    const Dsh = r.geo.Dsh, Db = r.geo.Db, k = S / Dsh, p = 1.25 * c.tubeOD * k; let dots = '', n = 0;
    for (let j = -60; j <= 60 && n < 1500; j++) for (let i = -60; i <= 60; i++) { const x = (i + (j % 2 ? 0.5 : 0)) * p, y = j * p * 0.866; if (Math.hypot(x, y) < Db * k / 2 - p * 0.3) { dots += `<circle cx="${(cx + x).toFixed(1)}" cy="${(cy + y).toFixed(1)}" r="${Math.max(1.2, c.tubeOD * k / 2).toFixed(1)}" fill="#d98a3d"/>`; n++; } }
    body = `<circle cx="${cx}" cy="${cy}" r="${S / 2 + 6}" fill="#eef1f5" stroke="#5b6573" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${S / 2}" fill="#f7f1e6" stroke="#9aa6b2"/>${dots}`;
    dims = [['Tubes', `${n0(r.N)} × Ø${c.tubeOD} × ${c.tubeWall} mm`], ['Shell ID', `${n0(Dsh)} mm, ${r.geo.shellT} mm wall`], ['Tube sheet', `${r.geo.tsT} mm`], ['Head', `${r.geo.headT} mm`], ['Weight', `${n0(r.weight / 1000, 1)} t`]];
  } else {
    const D = r.geo.D, L = r.geo.Lt, horiz = ty === 'dea', sc = Math.min(520 / (horiz ? L : D), 330 / (horiz ? D : L)), w = (horiz ? L : D) * sc, h = (horiz ? D : L) * sc, x0 = cx + 150 - w / 2 - 150, y0 = cy - h / 2;
    body = `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.25}" fill="#eef1f5" stroke="#5b6573" stroke-width="3"/>` + (horiz ? `<rect x="${x0 + w * 0.4}" y="${y0 - h * 0.45}" width="${w * 0.3}" height="${h * 0.45}" rx="10" fill="#e1e6ec" stroke="#5b6573" stroke-width="2.5"/>` : '') + `<line x1="${x0 + w * 0.1}" x2="${x0 + w * 0.9}" y1="${y0 + h * 0.5}" y2="${y0 + h * 0.5}" stroke="#c9d2dc" stroke-dasharray="6 5"/>`;
    dims = [['Shell', `ID ${n0(D)} mm × ${n0(L)} mm, ${r.geo.shellT} mm wall`], ['Heads', `${r.geo.headT} mm, 2:1 ellipsoidal`], ['Design pressure', `${c.pVessel} bar g`], ['Volume', `${n0(r.geo.vol, 1)} m³`], ['Weight', `${n0(r.weight / 1000, 1)} t`]];
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Section"><rect width="${W}" height="${H}" fill="#f6f8fb"/><text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${ty === 'cond' || ty === 'fwh' || ty === 'hx' ? 'Tube bundle cross-section, tubes on the calculated pitch' : 'Vessel elevation'} · ${esc(c.shellMat)}</text>${body}
    ${dims.map(([k, v], i) => `<text x="620" y="${130 + i * 34}" font-size="11.5" fill="#6b7482">${k}</text><text x="620" y="${146 + i * 34}" font-size="13" font-weight="600" fill="#1e2530">${esc(v)}</text>`).join('')}</svg>`;
}
