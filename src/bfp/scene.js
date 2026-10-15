import * as THREE from 'three';
import { bfpCurve } from './calc.js';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

// Feed pump set on one baseplate: booster pump, driver (turbine or motor), gearbox / coupling, barrel pump, oil console.
export function bfpScene(r, cut) {
  const g = new THREE.Group(), turb = r.cfg.drive === 'turbine', k = Math.min(1.6, 0.5 + r.P / 12000);
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, Math.PI / 2], o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 36), M({ color: col, metalness: 0.5, roughness: 0.5, transparent: !!o.ghost, opacity: o.ghost ? 0.32 : 1 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.4, roughness: 0.6 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const y0 = 0.55 * k, L = 9 * k;
  box(L, 0.12, 2.1 * k, 0, 0.06, 0, 0x3a4250);
  let x = -L / 2 + 0.6 * k;
  if (turb) { cyl(0.55 * k, 0.45 * k, 2.2 * k, x + 1.1 * k, y0 + 0.2, 0, 0x2f7f6b); box(1.2 * k, 0.5 * k, 0.8 * k, x + 1.1 * k, y0 + 0.75 * k, 0, 0x2f7f6b); cyl(0.2 * k, 0.2 * k, 1.1 * k, x + 1.1 * k, y0 + 1.3 * k, 0, 0xb8c0cc, [0, 0, 0]); x += 2.4 * k; }
  else { cyl(0.6 * k, 0.6 * k, 2.4 * k, x + 1.2 * k, y0 + 0.2, 0, 0x33415a); x += 2.6 * k; }
  box(0.9 * k, 0.9 * k, 0.9 * k, x + 0.45 * k, y0 + 0.2, 0, turb ? 0x6b7b8c : 0xc27a2c); x += 1.0 * k;
  cyl(0.12 * k, 0.12 * k, 0.5 * k, x + 0.25 * k, y0 + 0.2, 0, 0xb8c0cc); x += 0.6 * k;
  if (r.booster) { cyl(0.38 * k, 0.38 * k, 1.1 * k, x + 0.55 * k, y0 + 0.2, 0, 0x2f6fb0); x += 1.3 * k; }
  cyl(0.5 * k, 0.5 * k, 2.4 * k, x + 1.2 * k, y0 + 0.2, 0, 0x2f6fb0, [0, 0, Math.PI / 2], { ghost: cut });
  if (cut) for (let i = 0; i < Math.min(r.stages, 8); i++) cyl(0.34 * k, 0.34 * k, 0.1 * k, x + 0.3 * k + i * 0.27 * k, y0 + 0.2, 0, 0xd98a3d);
  cyl(0.55 * k, 0.55 * k, 0.15 * k, x + 2.4 * k, y0 + 0.2, 0, 0x7e8794);
  cyl(0.2 * k, 0.2 * k, 1.1 * k, x + 0.5 * k, y0 + 0.9 * k, 0.1, 0x9aa6b2, [0, 0, 0]); cyl(0.15 * k, 0.15 * k, 1.1 * k, x + 2.0 * k, y0 + 0.9 * k, 0.1, 0x9aa6b2, [0, 0, 0]);
  box(1.3 * k, 0.9 * k, 0.8 * k, -0.4 * k, 0.5, -1.7 * k, 0xc9a227);
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(5 / Math.max(sz.x, sz.y * 2.4, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.55, 1.1] };
}

export function bfpCurveSVG(r) {
  const c = r.cfg, W = 880, H = 440, L = 90, R = 90, T = 78, B = 64, pw = W - L - R, ph = H - T - B, pts = bfpCurve(r);
  const hmax = Math.max(...pts.map((p) => p.h)) * 1.1, qmax = c.flow * 1.45, X = (q) => L + q / qmax * pw, Y = (h) => T + (1 - h / hmax) * ph, YE = (e) => T + (1 - e) * ph;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text x="${L - 8}" y="${Y(hmax * f) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${n(hmax * f, 0)}</text><line x1="${L}" x2="${L + pw}" y1="${Y(hmax * f)}" y2="${Y(hmax * f)}" stroke="#e6eaf0"/>`).join('') + [0, 0.5, 1, 1.4].map((f) => `<text x="${X(c.flow * f)}" y="${T + ph + 20}" text-anchor="middle" font-size="11" fill="#6b7482">${n(c.flow * f)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Feed pump performance curve"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Feed pump')}</text><text x="40" y="54" font-size="12" fill="#6b7482">${n(c.flow)} m³/h at ${n(c.head)} m · ${r.stages} stages · ${n(r.P)} kW shaft · indicative curve, not a vendor curve</text>
    ${ticks}<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}" stroke="#5b6573"/><line x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}" stroke="#5b6573"/>
    <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${pts.map((p) => `${X(p.q).toFixed(1)},${Y(p.h).toFixed(1)}`).join(' ')}"/>
    <polyline fill="none" stroke="#0f9d6b" stroke-width="2.4" stroke-dasharray="6 4" points="${pts.filter((p) => p.eta > 0.05).map((p) => `${X(p.q).toFixed(1)},${YE(p.eta).toFixed(1)}`).join(' ')}"/>
    <circle cx="${X(c.flow)}" cy="${Y(c.head)}" r="7" fill="#fff" stroke="#1e2530" stroke-width="3"/><text x="${X(c.flow) + 12}" y="${Y(c.head) + 20}" font-size="12" font-weight="700" fill="#1e2530">duty ${n(c.flow)} m³/h · ${n(c.head)} m · η ${n(r.eta * 100, 0)}%</text>
    <text x="${L + pw / 2}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#6b7482">Flow m³/h</text><text x="${L - 60}" y="${T - 10}" font-size="12" fill="#2563eb">Head m</text><text x="${L + pw + 12}" y="${T - 10}" font-size="12" fill="#0f9d6b">Efficiency (dashed)</text></svg>`;
}
