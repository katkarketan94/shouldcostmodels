import * as THREE from 'three';
import { accCurve } from './calc.js';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

// Streets of A-frame modules, each with a fan under the tube bundles, and the steam duct running along the ridge.
export function accScene(r) {
  const g = new THREE.Group(), fans = Math.min(r.fans, 60), cols = Math.min(6, Math.ceil(Math.sqrt(fans / 1.5))), rows = Math.ceil(fans / cols), s = 2.2;
  const box = (sx, sy, sz, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.4, roughness: 0.6 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; g.add(m); };
  const cyl = (rt, h, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rt, h, 24), M({ color: col, metalness: 0.5, roughness: 0.5 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); };
  const dx = (cols - 1) * s / 2, dz = (rows - 1) * s / 2, legH = 3.2;
  for (let i = 0; i < fans; i++) {
    const cx = (i % cols) * s - dx, cz = Math.floor(i / cols) * s - dz;
    for (const sx of [-1, 1]) box(0.08, legH, 0.08, cx + sx * s * 0.45, legH / 2, cz + s * 0.45, 0x6f7b88), box(0.08, legH, 0.08, cx + sx * s * 0.45, legH / 2, cz - s * 0.45, 0x6f7b88);
    for (const sx of [-1, 1]) box(s * 0.62, 0.08, s * 0.92, cx + sx * s * 0.22, legH + 0.7, cz, 0xb8c0cc, [0, 0, -sx * 0.9]);
    cyl(s * 0.4, 0.06, cx, legH - 0.1, cz, 0x4a5563); cyl(0.12, 0.3, cx, legH - 0.3, cz, 0x2f6fb0);
  }
  cyl(Math.min(0.5, 0.18 + r.dDuct * 0.03), cols * s + 1, 0, legH + 1.7, -dz - s * 0.75, 0xd98a3d, [0, 0, Math.PI / 2]);
  for (let c = 0; c < cols; c++) cyl(0.12, rows * s, c * s - dx, legH + 1.3, 0, 0xd98a3d, [Math.PI / 2, 0, 0]);
  box(cols * s + 2, 0.05, rows * s + 2, 0, 0.02, 0, 0x8a8f78);
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(6 / Math.max(sz.x, sz.y * 2.5, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.7, 1.1] };
}
// Cost and fan count against turbine back pressure, with the design point.
export function accCurveSVG(r, T) {
  const c = r.cfg, pts = accCurve(c, T), W = 880, H = 440, L = 90, R = 90, Tt = 78, B = 64, pw = W - L - R, ph = H - Tt - B;
  const lo = Math.min(...pts.map((p) => p.total)) * 0.9, hi = Math.max(...pts.map((p) => p.total)) * 1.05, bmin = pts[0].bp, bmax = pts[pts.length - 1].bp, X = (b) => L + (b - bmin) / (bmax - bmin) * pw, Y = (v) => Tt + (1 - (v - lo) / (hi - lo)) * ph;
  const yt = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = lo + (hi - lo) * f; return `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${n(v / 1e7)}</text><line x1="${L}" x2="${L + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6eaf0"/>`; }).join('') + [10, 15, 20, 25, 30, 35].filter((b) => b >= bmin && b <= bmax).map((b) => `<text x="${X(b)}" y="${Tt + ph + 20}" text-anchor="middle" font-size="11" fill="#6b7482">${b}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="ACC cost against back pressure"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${n(c.flow)} t/h exhaust · ${c.amb} °C dry bulb · cost of the condenser against turbine back pressure (steam saturates at ${n(r.Ts, 1)} °C at ${c.bp} kPa)</text>
    ${yt}<line x1="${L}" x2="${L}" y1="${Tt}" y2="${Tt + ph}" stroke="#5b6573"/><line x1="${L}" x2="${L + pw}" y1="${Tt + ph}" y2="${Tt + ph}" stroke="#5b6573"/>
    <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${pts.map((p) => `${X(p.bp).toFixed(1)},${Y(p.total).toFixed(1)}`).join(' ')}"/>
    <circle cx="${X(c.bp)}" cy="${Y(r.total)}" r="7" fill="#fff" stroke="#1e2530" stroke-width="3"/><text x="${X(c.bp) + 12}" y="${Y(r.total) - 12}" font-size="12" font-weight="700" fill="#1e2530">design ${c.bp} kPa · ${r.fans} fans · ₹${n(r.total / 1e7)} Cr</text>
    <text x="${L + pw / 2}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#6b7482">Turbine back pressure, kPa(a)</text><text x="${L - 60}" y="${Tt - 10}" font-size="12" fill="#2563eb">₹ Cr</text></svg>`;
}
