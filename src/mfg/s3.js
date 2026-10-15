// Tiny three.js helpers shared by the simple equipment scenes.
import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);
export function scene3() {
  const g = new THREE.Group();
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 28), M({ color: col, metalness: 0.45, roughness: 0.55 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.35, roughness: 0.65 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const sph = (r, x, y, z, col) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), M({ color: col, metalness: 0.4, roughness: 0.5 })); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const fit = (size = 6, tall = 2.4, preset = [0.9, 0.6, 1.1]) => { const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(size / Math.max(sz.x, sz.y * tall, sz.z)); g.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2; return { group: g, preset }; };
  return { g, cyl, box, sph, fit };
}
export const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
// Generic "cost against size" line chart: pts [{x,y}], design point {x,y}
export function lineSVG(title, sub, pts, dp, xl, yl, yfmt = (v) => n(v / 1e7, 1)) {
  const W = 880, H = 440, L = 90, R = 60, T = 78, B = 64, pw = W - L - R, ph = H - T - B, xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) * 0.9, y1 = Math.max(...ys) * 1.05, X = (v) => L + (v - x0) / ((x1 - x0) || 1) * pw, Y = (v) => T + (1 - (v - y0) / ((y1 - y0) || 1)) * ph;
  const gy = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = y0 + (y1 - y0) * f; return `<text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${yfmt(v)}</text><line x1="${L}" x2="${L + pw}" y1="${Y(v)}" y2="${Y(v)}" stroke="#e6eaf0"/>`; }).join(''), gx = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = x0 + (x1 - x0) * f; return `<text x="${X(v)}" y="${T + ph + 20}" text-anchor="middle" font-size="11" fill="#6b7482">${n(v, v < 20 ? 1 : 0)}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="${esc(title)}"><rect width="${W}" height="${H}" fill="#f6f8fb"/><text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(title)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(sub)}</text>${gy}${gx}
    <line x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}" stroke="#5b6573"/><line x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}" stroke="#5b6573"/><polyline fill="none" stroke="#2563eb" stroke-width="3" points="${pts.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' ')}"/>
    <circle cx="${X(dp.x)}" cy="${Y(dp.y)}" r="7" fill="#fff" stroke="#1e2530" stroke-width="3"/><text x="${Math.min(X(dp.x) + 12, W - 200)}" y="${Y(dp.y) - 12}" font-size="12" font-weight="700" fill="#1e2530">${esc(dp.label)}</text>
    <text x="${L + pw / 2}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#6b7482">${esc(xl)}</text><text x="${L - 60}" y="${T - 10}" font-size="12" fill="#2563eb">${esc(yl)}</text></svg>`;
}
export const sweep = (c, key, fs, compute, T, tot = (r) => r.total) => fs.map((f) => { const r = compute({ ...c, [key]: c[key] * f }, T); return r.error ? null : { x: c[key] * f, y: tot(r) }; }).filter(Boolean);
