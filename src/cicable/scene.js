import * as THREE from 'three';
import { ciLayout, TC_TYPES } from './calc.js';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const PAL = ['#8b5a2b', '#222222', '#c0392b', '#2b6fd6', '#e8e8e8', '#2b9a5f', '#e8b923', '#8e44ad', '#e67e22', '#16a085'];
const SHEATH_COL = { 'PVC ST1': '#2f343b', 'FRLS PVC': '#b5382e', LSZH: '#6c7a89', PE: '#23272e' };
const elemCols = (r, i) => {   // colours of the conductors in element i
  const c = r.cfg; if (c.family === 'control') return [PAL[i % PAL.length]];
  if (c.family === 'tc') { const col = TC_TYPES[c.tc].col; return [col[0], col[1]]; }
  return r.perElem === 3 ? ['#e8e8e8', '#222222', '#c0392b'] : ['#e8e8e8', '#222222'];
};
// 2D cross-section, drawn to scale
export function ciSectionSVG(r) {
  const W = 880, H = 440, cx = 440, cy = 235, S = Math.min(300 / r.D4, 22), c = r.cfg, pts = ciLayout(c.n, r.dElem);
  const circ = (rad, fill, stroke = '#00000030') => `<circle cx="${cx}" cy="${cy}" r="${(rad / 2 * S).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width=".6"/>`;
  let s = circ(r.D4, SHEATH_COL[c.sheath]);
  if (r.armoured) { s += circ(r.D3, '#9aa3ad'); if (!r.strip) { const N = Math.floor(Math.PI * (r.D2 + r.wireD) / r.wireD * 0.92); for (let i = 0; i < N; i++) { const a = 2 * Math.PI * i / N, rr = (r.D2 + r.wireD) / 2; s += `<circle cx="${(cx + rr * S * Math.cos(a)).toFixed(1)}" cy="${(cy + rr * S * Math.sin(a)).toFixed(1)}" r="${(r.wireD / 2 * S).toFixed(1)}" fill="#c7ced6" stroke="#5b6573" stroke-width=".4"/>`; } } else s += circ(r.D2 + 2 * r.armT * 0.5, '#aeb6bf'); s += circ(r.D2, '#d6d9dd'); }
  s += circ(r.D1, '#c9ccd2'); if (r.braid) s += circ(r.D1 - 0.2, 'none', '#b87333'); if (r.overAl) s += `<circle cx="${cx}" cy="${cy}" r="${(r.Dlay / 2 * S + 1).toFixed(1)}" fill="none" stroke="#cfd8e0" stroke-width="2.2"/>`;
  s += circ(r.Dlay, '#e2e0d6', '#00000020');
  pts.forEach(([x, y], i) => {
    const ex = cx + x * S, ey = cy + y * S, cols = elemCols(r, i);
    if (c.family === 'control') s += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(r.dc / 2 * S).toFixed(1)}" fill="${cols[0]}" stroke="#00000040"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(r.d / 2 * S).toFixed(1)}" fill="#c98a4b"/>${c.n > 1 ? `<text x="${ex.toFixed(1)}" y="${(ey + 3).toFixed(1)}" text-anchor="middle" font-size="${Math.max(7, r.dc * S * 0.45).toFixed(0)}" fill="#fff" font-weight="700">${i + 1}</text>` : ''}`;
    else { if (r.indiv) s += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(r.dElem / 2 * S).toFixed(1)}" fill="#eef1f4" stroke="#9aa6b2" stroke-width="1.3"/>`; const k = cols.length, rr = k === 1 ? 0 : r.dc / 2 * (k === 2 ? 1 : 1.155); cols.forEach((col, j) => { const a = 2 * Math.PI * j / k - Math.PI / 2, px = ex + rr * S * Math.cos(a) * (k === 2 ? 1 : 1), py = ey + rr * S * Math.sin(a) * (k === 2 ? 0 : 1); const q = k === 2 ? [ex + (j ? 1 : -1) * r.dc / 2 * S, ey] : [px, py]; s += `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(r.dc / 2 * S).toFixed(1)}" fill="${col}" stroke="#00000050"/><circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${(r.d / 2 * S).toFixed(1)}" fill="#c98a4b"/>`; }); }
  });
  const dim = (label, val, y) => `<text x="40" y="${y}" font-size="12" fill="#556070">${label}</text><text x="250" y="${y}" font-size="12" text-anchor="end" font-weight="600" fill="#1e2530">${val}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Cable cross-section"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Cable')}</text><text x="40" y="54" font-size="12" fill="#6b7482">Cross-section to scale · overall Ø ${r.D4.toFixed(1)} mm</text>${s}
    ${dim('Conductor Ø', `${r.d.toFixed(2)} mm`, 100)}${dim('Insulation wall', `${r.tIns.toFixed(2)} mm`, 120)}${dim('Cabled core Ø', `${r.Dlay.toFixed(1)} mm`, 140)}${dim('Armour', r.armoured ? (r.strip ? `strip ×${r.layers}` : `${r.wireD} mm wire`) : 'none', 160)}${dim('Sheath wall', `${r.tS.toFixed(2)} mm`, 180)}${dim('Weight', `${Math.round(r.kgKm)} kg/km`, 200)}
    <text x="${cx}" y="${H - 14}" text-anchor="middle" font-size="12" fill="#6b7482">${esc(c.insul)} insulation · ${esc(c.sheath)} sheath · ${esc(c.shield)}</text></svg>`;
}
// 3D cable with every layer stripped back in steps
export function ciScene(r, cut) {
  const g = new THREE.Group(), c = r.cfg, L = 3.2, S = 1.0, M = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, metalness: o.m ?? 0.2, roughness: o.r ?? 0.6, side: THREE.DoubleSide });
  const tube = (ro, ri, len, y0, col, o) => { const sh = new THREE.Shape(); sh.absarc(0, 0, ro, 0, Math.PI * 2); const hole = new THREE.Path(); hole.absarc(0, 0, ri, 0, Math.PI * 2, true); sh.holes.push(hole); const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: false, curveSegments: 36 }), M(col, o)); m.rotation.x = -Math.PI / 2; m.position.y = y0; g.add(m); return m; };
  const k = 1, step = L * 0.11, d4 = r.D4 * k / 2, d3 = r.D3 * k / 2, d2 = r.D2 * k / 2, d1 = r.D1 * k / 2, dl = r.Dlay * k / 2;
  tube(d4, d3, L, 0, SHEATH_COL[c.sheath]);
  if (r.armoured) { const len = L - step; if (r.strip) tube(d3, d2, len, 0, '#aeb6bf', { m: 0.7, r: 0.35 }); else { const N = Math.floor(Math.PI * (r.D2 + r.wireD) / r.wireD * 0.92), rr = (r.D2 + r.wireD) / 2 * k; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * i / N, w = new THREE.Mesh(new THREE.CylinderGeometry(r.wireD / 2 * k, r.wireD / 2 * k, len, 6), M('#c7ced6', { m: 0.7, r: 0.3 })); w.position.set(rr * Math.cos(a), len / 2, rr * Math.sin(a)); g.add(w); } } tube(d2, d1, len * 0.92, 0, '#d6d9dd'); }
  const len1 = L - step * 2.2; tube(d1, dl, len1, 0, '#c9ccd2'); if (r.overAl || r.braid) tube(dl + 0.04, dl, len1 + step * 0.4, 0, r.braid ? '#b87333' : '#cfd8e0', { m: 0.8, r: 0.25 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(dl, dl, len1, 36), M('#e2e0d6')); body.position.y = len1 / 2; g.add(body);
  const pts = ciLayout(c.n, r.dElem * k);
  pts.forEach(([x, z], i) => {
    const cols = elemCols(r, i), ext = L + 0.3 + (i % 4) * 0.12, sub = cols.length;
    cols.forEach((col, j) => { const off = sub === 1 ? [0, 0] : sub === 2 ? [(j ? 1 : -1) * r.dc / 2 * k, 0] : [Math.cos(2 * Math.PI * j / 3 - Math.PI / 2) * r.dc * 0.58 * k, Math.sin(2 * Math.PI * j / 3 - Math.PI / 2) * r.dc * 0.58 * k];
      const ins = new THREE.Mesh(new THREE.CylinderGeometry(r.dc / 2 * k, r.dc / 2 * k, ext, 20), M(col)); ins.position.set(x + off[0], ext / 2, z + off[1]); g.add(ins);
      const cu = new THREE.Mesh(new THREE.CylinderGeometry(r.d / 2 * k, r.d / 2 * k, 0.35, 14), M('#c98a4b', { m: 0.9, r: 0.3 })); cu.position.set(x + off[0], ext + 0.12, z + off[1]); g.add(cu); });
  });
  g.rotation.z = Math.PI / 2 * 0.0; const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(5 / Math.max(sz.x, sz.y * 0.8, sz.z)); g.rotation.x = 0; g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2; g.position.z -= (b2.min.z + b2.max.z) / 2; g.rotation.z = -Math.PI / 2.4; g.position.y += 1.2;
  return { group: g, preset: [0.8, 0.5, 1.2] };
}
