import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export const FLOWS = { pre: ['Raw water', 'Clarifier', 'Gravity filters', 'Filtered-water tank'], dm: ['Filtered water', 'Cation', 'Degasser', 'Anion', 'Mixed bed', 'DM tank'], ro: ['Feed', 'Media filters', 'Cartridge filter', 'HP pump', 'RO membranes', 'Permeate tank'], cpu: ['Condensate', 'Service vessels', 'Resin transfer', 'Regeneration', 'Polished condensate'],
  etp: ['Inlet', 'Equalisation', 'Chemical dosing', 'Clarifier', 'Aeration', 'Secondary clarifier', 'Filter'], stp: ['Sewage', 'Screen and grit', 'Equalisation', 'MBBR', 'Settler', 'Disinfection'], zld: ['Reject / effluent', 'Softener', 'Brine concentrator', 'Crystalliser', 'Centrifuge and dryer'] };

export function wtpScene(r) {
  const g = new THREE.Group(), st = FLOWS[r.cfg.type], n = st.length - 1, k = Math.min(1.5, 0.5 + Math.log10(r.cfg.cap) * 0.25);
  const cyl = (rt, h, x, y, z, col) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rt, h, 28), M({ color: col, metalness: 0.4, roughness: 0.6 })); m.position.set(x, y, z); m.castShadow = true; g.add(m); };
  const box = (sx, sy, sz, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.3, roughness: 0.7 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); };
  const w = 2.2 * k; box(n * w + 2, 0.05, 4 * k + 1, 0, 0.02, 0, 0x8a8f78);
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * w, col = [0x2f6fb0, 0x0ea5a4, 0xc27a2c, 0x7c8a9a][i % 4];
    if (i % 3 === 0) { cyl(0.9 * k, 0.5, x, 0.28, 0, 0x9aa6b2); cyl(0.85 * k, 0.12, x, 0.52, 0, 0x3a8fd0); } else if (i % 3 === 1) { cyl(0.55 * k, 2 * k, x, k + 0.1, 0, col); cyl(0.3 * k, 0.3, x, 2 * k + 0.3, 0, 0x555555); } else { box(1.4 * k, 0.9, 1.6 * k, x, 0.5, 0, 0x9aa6b2); box(1.3 * k, 0.1, 1.5 * k, x, 0.98, 0, 0x3a8fd0); }
    if (i < n - 1) cyl(0.07, w * 0.5, x + w / 2, 0.45, 0, 0xb8c0cc).rotation; }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(6 / Math.max(sz.x, sz.y * 3, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.7, 0.55, 1.2] };
}
export function wtpFlowSVG(r) {
  const st = FLOWS[r.cfg.type], W = 880, H = 360, n = st.length, bw = Math.min(120, (W - 80) / n - 14), gap = ((W - 80) - n * bw) / Math.max(1, n - 1), ink = '#1e2530', c = r.cfg, ty = r.ty;
  const boxes = st.map((s, i) => { const x = 40 + i * (bw + gap), edge = i === 0 || i === n - 1, col = edge ? '#e6eef8' : '#fff'; return `<rect x="${x}" y="150" width="${bw}" height="64" rx="8" fill="${col}" stroke="${edge ? '#2563eb' : '#5b6573'}" stroke-width="2"/><foreignObject x="${x + 4}" y="154" width="${bw - 8}" height="56"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 12px system-ui;color:${ink};display:flex;align-items:center;justify-content:center;text-align:center;height:56px">${esc(s)}</div></foreignObject>${i < n - 1 ? `<path d="M${x + bw} 182h${gap}" stroke="#2563eb" stroke-width="2.5" marker-end="url(#ar)"/>` : ''}`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Process flow"><defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#2563eb"/></marker></defs><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="${ink}">${esc(c.tag)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(ty.label)} · ${c.cap} ${ty.unit}${ty.load ? ` · ${ty.load[0].toLowerCase()} ${c.load} ${ty.load[1]}` : ''}</text>${boxes}
    <text x="40" y="270" font-size="12" fill="#6b7482">Output: ${esc(ty.out)}</text><text x="40" y="292" font-size="12" fill="#6b7482">Tank volume ${Number(r.volume).toLocaleString('en-IN', { maximumFractionDigits: 0 })} m³ · about ${Number(r.area).toLocaleString('en-IN', { maximumFractionDigits: 0 })} m² footprint · installed power about ${Number(r.kw).toLocaleString('en-IN', { maximumFractionDigits: 0 })} kW</text></svg>`;
}
