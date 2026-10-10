import * as THREE from 'three';
import { curve } from './calc.js';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const C = { pump: 0x2f6fb0, motor: 0x33415a, steel: 0x7e8794, base: 0x3a4250, pipe: 0x9aa6b2, fire: 0xc0392b, diesel: 0x2b6a4f };

export function pumpScene(r, cut) {
  const g = new THREE.Group(), ty = r.ty, kw = Math.max(r.motorKw, 1), fire = !!ty.fire;
  const pumpCol = fire ? C.fire : C.pump, md = Math.min(1.4, 0.16 * kw ** 0.33), ml = md * 1.9;
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, 0], o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 36, 1, !!o.open), M({ color: col, metalness: 0.45, roughness: 0.55, transparent: !!o.ghost, opacity: o.ghost ? 0.3 : 1, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, col, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.4, roughness: 0.6, transparent: !!o.ghost, opacity: o.ghost ? 0.3 : 1 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const pd = ty.pd, pr = md * 0.9;
  if (ty.orient === 'H' || pd) {
    const L = md * 5.2; box(L, 0.1 * md, md * 2, 0, 0.05 * md, 0, C.base);
    cyl(md * 0.5, md * 0.5, ml, -L * 0.3, md * 0.2 + md * 0.5 + 0.1 * md, 0, fire && ty.drive === 'diesel' ? C.diesel : C.motor, [0, 0, Math.PI / 2]);
    cyl(md * 0.16, md * 0.16, md * 0.5, -L * 0.3 + ml * 0.5 + md * 0.25, md * 0.8, 0, 0xb8c0cc, [0, 0, Math.PI / 2]);
    const px = -L * 0.3 + ml * 0.5 + md * 0.5 + pr * 0.4;
    if (!pd) { cyl(pr * 0.85, pr * 0.85, md * 0.55, px + pr * 0.4, md * 0.8, 0, pumpCol, [0, 0, Math.PI / 2], { ghost: cut }); cyl(md * 0.2, md * 0.2, pr * 1.4, px + pr * 0.4, md * 0.8 + pr * 0.7, 0, C.pipe); cyl(md * 0.22, md * 0.22, pr * 1.2, px + pr * 1.4, md * 0.8, 0, C.pipe, [0, 0, Math.PI / 2]); if (cut) cyl(pr * 0.6, pr * 0.6, md * 0.12, px + pr * 0.4, md * 0.8, 0, 0xd98a3d, [0, 0, Math.PI / 2]); }
    else { box(pr * 1.8, pr * 1.2, pr * 1.2, px + pr * 0.6, md * 0.8, 0, pumpCol, { ghost: cut }); if (cut) for (const z of [-0.22, 0.22]) cyl(pr * 0.22, pr * 0.22, pr * 1.0, px + pr * 0.6, md * 0.8, z * pr * 1.2, 0xd98a3d, [Math.PI / 2, 0, 0]); cyl(md * 0.14, md * 0.14, pr, px + pr * 0.6, md * 0.8 + pr * 0.9, 0, C.pipe); }
  } else if (ty.orient === 'V') {
    const len = Math.min(4, 0.9 + (r.colLen || 1) * 0.16), pit = fire ? 0 : 1;
    cyl(md * 0.5, md * 0.5, ml, 0, len + md * 0.9 + ml / 2, 0, fire ? C.motor : C.motor);
    cyl(md * 0.55, md * 0.55, md * 0.8, 0, len + md * 0.4, 0, pumpCol);
    cyl(md * 0.2, md * 0.2, len, 0, len / 2, 0, 0xb8c0cc);
    cyl(md * 0.22, md * 0.22, pr * 1.2, pr * 0.6, len + md * 0.4, 0, C.pipe, [0, 0, Math.PI / 2]);
    const bowls = Math.min(4, r.stages) || 1; for (let i = 0; i < bowls; i++) cyl(md * 0.55, md * 0.4, md * 0.5, 0, md * 0.3 + i * md * 0.5, 0, pumpCol, [0, 0, 0], { ghost: cut });
    cyl(md * 0.5, md * 0.3, md * 0.35, 0, -md * 0.15, 0, C.steel);
    if (r.cfg.type !== 'F_JOCKEY' && !fire) box(md * 3, 0.05, md * 3, 0, 0, 0, 0x6b7b8c, { ghost: true });
  } else {   // submersible
    const h = md * 1.6;
    cyl(md * 0.55, md * 0.55, h, 0, md * 0.9 + h / 2, 0, C.motor, [0, 0, 0]);
    cyl(md * 0.7, md * 0.55, md * 0.9, 0, md * 0.45 + 0.02, 0, pumpCol, [0, 0, 0], { ghost: cut });
    cyl(md * 0.6, md * 0.6, md * 0.12, 0, md * 0.06, 0, C.steel);
    if (cut) cyl(md * 0.45, md * 0.45, md * 0.1, 0, md * 0.4, 0, 0xd98a3d);
    cyl(md * 0.14, md * 0.14, md * 1.8, md * 0.7, md * 1.4, 0, C.pipe, [0, 0, 0.45]);
    box(0.05, md * 4, 0.05, -md * 0.9, md * 2, 0, 0x888888);
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, md * 2, 8), M({ color: 0x111111 })); cab.position.set(md * 0.2, md * 1.9 + h, 0); g.add(cab);
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(4.2 / Math.max(sz.x, sz.y * 2.0, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.9, 0.55, 1.1] };
}

// Performance curves with the duty point (and the NFPA 20 points for fire pumps)
export function pumpCurveSVG(r) {
  const c = r.cfg, W = 880, H = 440, L = 90, R = 90, T = 78, B = 64, pw = W - L - R, ph = H - T - B, pts = curve(r), ty = r.ty;
  const hmax = Math.max(...pts.map((p) => p.h)) * 1.1, qmax = r.Q * 1.7, X = (q) => L + q / qmax * pw, Y = (h) => T + (1 - h / hmax) * ph, YE = (e) => T + (1 - e / 1) * ph;
  const head = ty.pd ? `<line x1="${L}" x2="${L + pw}" y1="${Y(r.head)}" y2="${Y(r.head)}" stroke="#2563eb" stroke-width="3"/><text x="${L + 8}" y="${Y(r.head) - 8}" font-size="12" fill="#2563eb">constant flow ${n(r.Q, 1)} m³/h · pressure set by the system (relief valve at ${n(r.bar * 1.1, 0)} bar)</text>` : `<polyline fill="none" stroke="#2563eb" stroke-width="3" points="${pts.map((p) => `${X(p.q).toFixed(1)},${Y(p.h).toFixed(1)}`).join(' ')}"/>`;
  const eff = ty.pd ? '' : `<polyline fill="none" stroke="#0f9d6b" stroke-width="2.4" stroke-dasharray="6 4" points="${pts.filter((p) => p.eta > 0.05).map((p) => `${X(p.q).toFixed(1)},${YE(p.eta).toFixed(1)}`).join(' ')}"/>`;
  const fire = r.fireChurn ? `<circle cx="${X(0)}" cy="${Y(r.head * r.fireChurn)}" r="5" fill="#c0392b"/><text x="${X(0) + 10}" y="${Y(r.head * r.fireChurn) - 6}" font-size="11" fill="#c0392b">churn ${n(r.head * r.fireChurn, 0)} m (${n(r.fireChurn * 100, 0)}% · limit 140%)</text><circle cx="${X(r.Q * 1.5)}" cy="${Y(r.head * 0.65)}" r="5" fill="#c0392b"/><text x="${X(r.Q * 1.5) - 8}" y="${Y(r.head * 0.65) - 10}" text-anchor="end" font-size="11" fill="#c0392b">150% flow at 65% head</text>` : '';
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text x="${L - 8}" y="${Y(hmax * f / 1.1 * 1.1) + 4}" text-anchor="end" font-size="11" fill="#6b7482">${n(hmax * f, 0)}</text><line x1="${L}" x2="${L + pw}" y1="${Y(hmax * f)}" y2="${Y(hmax * f)}" stroke="#e6eaf0"/>`).join('') + [0, 0.5, 1, 1.5].map((f) => `<text x="${X(r.Q * f)}" y="${T + ph + 20}" text-anchor="middle" font-size="11" fill="#6b7482">${n(r.Q * f, r.Q < 20 ? 1 : 0)}</text>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Pump performance curve"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Pump')}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(ty.label)} · ${n(r.Q, 1)} m³/h at ${n(r.head, 0)} m · ${r.stages} stage${r.stages > 1 ? 's' : ''} · ${ty.rpm} rpm class · indicative curve, not a vendor curve</text>
    ${ticks}<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}" stroke="#5b6573"/><line x1="${L}" x2="${L + pw}" y1="${T + ph}" y2="${T + ph}" stroke="#5b6573"/>${head}${eff}${fire}
    <circle cx="${X(r.Q)}" cy="${Y(r.head)}" r="7" fill="#fff" stroke="#1e2530" stroke-width="3"/><text x="${X(r.Q) + 12}" y="${Y(r.head) + 20}" font-size="12" font-weight="700" fill="#1e2530">duty ${n(r.Q, 1)} m³/h · ${n(r.head, 0)} m · η ${n(r.eta * 100, 0)}%</text>
    <text x="${L + pw / 2}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#6b7482">Flow m³/h</text><text x="${L - 60}" y="${T - 10}" font-size="12" fill="#2563eb">Head m</text>${ty.pd ? '' : `<text x="${L + pw + 12}" y="${T - 10}" font-size="12" fill="#0f9d6b">Efficiency (dashed)</text>`}</svg>`;
}
