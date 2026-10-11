import * as THREE from 'three';
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const COL = { inc: '#2563eb', fdr: '#0ea5a4', cpl: '#8b5cf6', mtr: '#e8923a', pt: '#94a3b8', aci: '#2563eb', acc: '#8b5cf6', acf: '#0ea5a4', mcf: '#0ea5a4', dol: '#e8923a', sd: '#d9a441', vfd: '#c0392b', pf: '#2b9a5f' };
// the board as a row of columns, in the order of the schedule
function columns(r) {
  const cols = [], push = (k, w, label, extra = {}) => cols.push({ k, w, label, ...extra });
  for (const b of r.bays) {
    if (r.ht) for (let i = 0; i < b.n; i++) push(b.k, 0.8, b.label.split(' ')[0], { size: b.size });
    else if (b.k === 'mcf') for (let i = 0; i < Math.ceil(b.n / 4); i++) push(b.k, 0.8, 'MCCB', { size: b.size, mods: Math.min(4, b.n - i * 4) });
    else if (['dol', 'sd', 'vfd'].includes(b.k)) for (let i = 0; i < Math.ceil(b.n / 8); i++) push(b.k, 0.8, 'MCC', { size: b.size, mods: Math.min(8, b.n - i * 8) });
    else for (let i = 0; i < b.n; i++) push(b.k, 0.8, b.k === 'pf' ? 'APFC' : 'ACB', { size: b.size });
  }
  return cols;
}
export function swgrScene(r, cut) {
  const g = new THREE.Group(), cols = columns(r), W = 0.8, D = r.depthM, Hh = r.heightM, M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, metalness: o.m ?? 0.3, roughness: o.r ?? 0.6, transparent: !!o.t, opacity: o.t ? 0.22 : 1, side: THREE.DoubleSide });
  const box = (sx, sy, sz, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  const x0 = -cols.length * W / 2;
  box(cols.length * W + 0.1, 0.12, D + 0.05, 0, 0.06, 0, M(0x2b3340));
  cols.forEach((c, i) => {
    const x = x0 + (i + 0.5) * W, body = r.cfg.cls === 'HT' ? '#d9dee6' : '#cfd6df';
    box(W * 0.98, Hh - 0.12, D, x, 0.12 + (Hh - 0.12) / 2, 0, M(body, { t: cut })); box(W * 0.98, 0.1, D, x, Hh + 0.05, 0, M('#aeb6c2'));
    const fz = D / 2 + 0.01, acc = COL[c.k];
    box(W * 0.9, 0.05, 0.02, x, Hh - 0.25, fz, M('#222a35'));
    if (r.ht) { box(W * 0.7, 0.55, 0.03, x, Hh - 0.7, fz, M('#1c242e')); box(0.3, 0.3, 0.03, x, Hh - 0.65, fz + 0.02, M('#e6ecf3')); box(W * 0.8, 0.12, 0.03, x, Hh * 0.55, fz, M(acc)); box(W * 0.6, 0.7, 0.03, x, 0.9, fz, M('#9aa6b4')); if (c.k !== 'pt') box(0.14, 0.14, 0.04, x, 1.35, fz, M(0xc0392b)); }
    else if (c.mods) for (let m = 0; m < c.mods; m++) { const hh = (Hh - 0.4) / (c.k === 'mcf' ? 4 : 8); box(W * 0.84, hh * 0.86, 0.03, x, 0.25 + hh * (m + 0.5), fz, M(m % 2 ? '#b8c2ce' : '#c4ccd6')); box(0.12, 0.05, 0.04, x + 0.2, 0.25 + hh * (m + 0.5), fz + 0.02, M(acc)); }
    else { box(W * 0.8, Hh * 0.55, 0.03, x, Hh * 0.55, fz, M('#2f3a48')); box(W * 0.6, 0.18, 0.04, x, Hh * 0.62, fz + 0.02, M(acc)); box(0.12, 0.12, 0.04, x, Hh * 0.45, fz + 0.02, M(0xc0392b)); }
    if (cut) { for (let p = -1; p <= 1; p++) box(0.06, 0.06, D * 0.9, x + p * 0.18, Hh - 0.15, 0, M('#c98a4b', { m: 0.9, r: 0.3 })); }
  });
  if (cut) for (let p = -1; p <= 1; p++) box(cols.length * W, 0.05, 0.05, 0, Hh - 0.15 + p * 0.0, p * 0.18, M('#c98a4b', { m: 0.9, r: 0.3 }));
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); g.scale.setScalar(6 / Math.max(sz.x, sz.y * 2.4, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.7, 0.45, 1.4] };
}
// front elevation to scale, with a legend
export function swgrElevationSVG(r) {
  const cols = columns(r), W = 880, H = 440, pw = Math.min(46, 740 / cols.length), x0 = (W - cols.length * pw) / 2, ph = Math.min(230, pw * 2.9), y0 = 150;
  const body = cols.map((c, i) => { const x = x0 + i * pw, acc = COL[c.k];
    let inner = `<rect x="${x + 3}" y="${y0 + 8}" width="${pw - 6}" height="14" fill="#2a3340" rx="2"/>`;
    if (c.mods) { const m = c.mods, mh = (ph - 40) / (c.k === 'mcf' ? 4 : 8); for (let j = 0; j < m; j++) inner += `<rect x="${x + 4}" y="${y0 + 28 + j * mh}" width="${pw - 8}" height="${mh - 2}" fill="${j % 2 ? '#c4ccd6' : '#d3d9e1'}" stroke="#8793a1" stroke-width=".6"/><rect x="${x + pw - 12}" y="${y0 + 28 + j * mh + mh / 2 - 2}" width="6" height="4" fill="${acc}"/>`; }
    else inner += `<rect x="${x + 5}" y="${y0 + 30}" width="${pw - 10}" height="${ph * 0.4}" fill="#2f3a48" rx="2"/><rect x="${x + 8}" y="${y0 + 36}" width="${pw - 16}" height="9" fill="${acc}"/><circle cx="${x + pw / 2}" cy="${y0 + ph * 0.6}" r="${Math.max(3, pw * 0.08)}" fill="#c0392b"/>`;
    return `<rect x="${x}" y="${y0}" width="${pw}" height="${ph}" fill="#e6eaf0" stroke="#5b6573"/>${inner}<text x="${x + pw / 2}" y="${y0 + ph + 16}" text-anchor="middle" font-size="9" fill="#556070">${c.size ? `${c.size}` : ''}</text><text x="${x + pw / 2}" y="${y0 + ph + 28}" text-anchor="middle" font-size="9" fill="#8793a1">${i + 1}</text>`; }).join('');
  const leg = [...new Set(r.bays.map((b) => b.k))].map((k, i) => { const b = r.bays.find((x) => x.k === k); return `<rect x="${40 + (i % 4) * 205}" y="${H - 66 + Math.floor(i / 4) * 20}" width="12" height="12" fill="${COL[k]}"/><text x="${58 + (i % 4) * 205}" y="${H - 56 + Math.floor(i / 4) * 20}" font-size="11" fill="#556070">${esc(b.label)} × ${b.n}</text>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Switchboard front elevation"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(r.cfg.tag || 'Switchboard')}</text><text x="40" y="54" font-size="12" fill="#6b7482">Front elevation · ${r.cols} columns · ${(r.widthM).toFixed(1)} m × ${r.heightM} m high × ${r.depthM} m deep</text>
    <text x="${x0}" y="${y0 - 14}" font-size="12" fill="#556070">${r.ht ? r.kv + ' kV' : '415 V'} · busbar ${r.cfg.busA} A (${esc(r.cfg.busMat)}) · ${r.cfg.kA} kA</text>${body}${leg}</svg>`;
}
