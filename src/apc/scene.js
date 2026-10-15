import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export function apcScene(r) {
  const g = new THREE.Group();
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 32), M({ color: col, metalness: 0.4, roughness: 0.6 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); };
  const box = (sx, sy, sz, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.3, roughness: 0.7 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); };
  box(14, 0.05, 9, 0, 0.02, 0, 0x8a8f78);
  if (r.kind === 'esp') {
    const flds = r.fields, L = flds * 1.5, Wd = Math.max(2.5, Math.min(7, Math.sqrt(r.area / 20000))), Ht = Wd * 1.2, hop = Math.max(2, Math.min(5, Math.round(Wd / 1.3)));
    box(L, Ht, Wd, 0, Ht / 2 + 1.4, 0, 0xb9c0c9);
    for (let f = 0; f < flds; f++) for (let k = 0; k < hop; k++) { const m = new THREE.Mesh(new THREE.ConeGeometry(Wd / hop * 0.6, 1.3, 4), M({ color: 0x7e8794 })); m.rotation.x = Math.PI; m.rotation.y = Math.PI / 4; m.position.set(-L / 2 + (f + 0.5) * (L / flds), 0.75, -Wd / 2 + (k + 0.5) * (Wd / hop)); g.add(m); }
    for (let f = 0; f < flds; f++) box(0.5, 0.35, 0.5, -L / 2 + (f + 0.5) * (L / flds), Ht + 1.6, 0, 0xc27a2c);
    cyl(0.55, 0.55, 3, -L / 2 - 1.4, Ht / 2 + 1.4, 0, 0x8b929b, [0, 0, Math.PI / 2]); cyl(0.55, 0.55, 3, L / 2 + 1.4, Ht / 2 + 1.4, 0, 0x8b929b, [0, 0, Math.PI / 2]);
  } else {
    const D = Math.min(5, Math.max(2.4, r.dia / 3.5)), Hh = D * 2.4;
    cyl(D / 2, D / 2, Hh, -2, Hh / 2 + 0.3, 0, 0xc9ced6); for (let i = 0; i < r.levels; i++) cyl(D / 2 + 0.06, D / 2 + 0.06, 0.16, -2, 2 + i * (Hh - 3.5) / Math.max(1, r.levels), 0, 0x2f6fb0);
    cyl(D / 2, D * 0.18, 1.2, -2, Hh + 0.9, 0, 0xb9c0c9); cyl(0.9, 0.9, Hh * 0.55, 3.6, Hh * 0.28, 0, 0xd8dbe0);
    cyl(0.32, 0.32, 5.5, 0.8, 1.2, 0, 0x8b929b, [0, 0, Math.PI / 2]); cyl(0.5, 0.5, 1.2, 3.6, 0.5, 2.3, 0xc27a2c); box(1.6, 1, 1.6, 6.2, 0.5, 0, 0x7e8794);
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(6 / Math.max(sz.x, sz.y * 2.2, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.8, 0.55, 1.1] };
}
// Flue-gas train, with the chosen unit highlighted and its sizing underneath.
export function apcFlowSVG(r) {
  const c = r.cfg, W = 880, H = 360, ink = '#1e2530', esp = r.kind === 'esp', items = [['Boiler', 'APH'], ['ESP', 'dust'], ['ID fan', ''], ['FGD', 'SO₂'], ['Stack', '']], bw = 120, gap = (W - 80 - items.length * bw) / (items.length - 1);
  const boxes = items.map(([t, s], i) => { const x = 40 + i * (bw + gap), on = (esp && t === 'ESP') || (!esp && t === 'FGD'); return `<rect x="${x}" y="130" width="${bw}" height="70" rx="8" fill="${on ? '#e6eef8' : '#fff'}" stroke="${on ? '#2563eb' : '#5b6573'}" stroke-width="${on ? 3 : 2}"/><text x="${x + bw / 2}" y="170" text-anchor="middle" font-size="14" font-weight="700" fill="${ink}">${t}</text>${s ? `<text x="${x + bw / 2}" y="188" text-anchor="middle" font-size="11" fill="#6b7482">${s}</text>` : ''}${i < items.length - 1 ? `<path d="M${x + bw} 165h${gap}" stroke="#2563eb" stroke-width="2.5" marker-end="url(#ar)"/>` : ''}`; }).join('');
  const lines = esp ? [`Inlet dust ${n(c.dust, 0)} g/Nm³ → outlet ${n(c.outDust)} mg/Nm³ (${n(r.eta * 100, 3)}% efficiency)`, `Specific collecting area ${n(r.sca, 0)} m²/(m³/s) · ${n(r.area)} m² of plate · ${r.fields} fields`, `${r.trs} transformer-rectifier sets · ${r.hoppers} ash hoppers · ${n(r.Q)} m³/s at ${c.temp} °C`] : [`Inlet SO₂ ${n(c.so2)} mg/Nm³ → outlet ${n(c.outSo2)} mg/Nm³ (${n(r.eta * 100, 1)}% removal)`, `${r.towers} absorber${r.towers > 1 ? 's' : ''} of ${n(r.dia, 1)} m × ${n(r.height)} m with ${r.levels} spray levels`, `Limestone ${n(r.limeTh, 1)} t/h · gypsum ${n(r.gypTh, 1)} t/h · booster fan ${n(r.fanKw / 1000, 1)} MW`];
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Flue-gas train"><defs><marker id="ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#2563eb"/></marker></defs><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="${ink}">${esc(c.tag)}</text><text x="40" y="54" font-size="12" fill="#6b7482">${n(c.gas / 1e6, 2)} million Nm³/h flue gas at ${c.temp} °C</text>${boxes}
    ${lines.map((l, i) => `<text x="40" y="${250 + i * 22}" font-size="12.5" fill="${ink}">${esc(l)}</text>`).join('')}</svg>`;
}
