import * as THREE from 'three';
const M = (o) => new THREE.MeshStandardMaterial(o);
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// A row of bays: gantry, bus tubes, isolators, breaker, CT and arrester stands (AIS), or a GIS hall with bay modules.
export function swydScene(r) {
  const g = new THREE.Group(), n = Math.min(r.bays, 10), s = Math.max(0.5, Math.min(1.6, r.kv / 300)), w = 1.5 * s + 0.6;
  const cyl = (rt, rb, h, x, y, z, col, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 16), M({ color: col, metalness: 0.45, roughness: 0.55 })); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = true; g.add(m); return m; };
  const box = (sx, sy, sz, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), M({ color: col, metalness: 0.35, roughness: 0.7 })); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const x0 = -(n - 1) * w / 2;
  box(n * w + 1, 0.04, 6 * s + 2, 0, 0.02, 0, 0x8a8f78);
  if (r.gis) {
    box(n * w + 0.6, 2.2 * s + 0.8, 3 * s + 1.4, 0, (2.2 * s + 0.8) / 2, 0, 0xc9ced6); box(n * w + 0.8, 0.12, 3 * s + 1.6, 0, 2.2 * s + 0.86, 0, 0x6b7480);
    for (let i = 0; i < n; i++) { cyl(0.3 * s, 0.3 * s, 2.6 * s, x0 + i * w, 2.2 * s + 1.4, -0.4 * s, 0xe6e9ee); cyl(0.05 * s, 0.05 * s, 1.2 * s, x0 + i * w, 2.2 * s + 2.8 * s, -0.4 * s, 0x333333); }
  } else {
    const H = 2.6 * s + 1.4;
    for (let b = 0; b < r.buses; b++) { const z = -1.4 * s + b * 0.8 * s; cyl(0.05 * s, 0.05 * s, n * w + 0.4, 0, 1.2 * s + 0.4, z, 0xc8ccd2, [0, 0, Math.PI / 2]); for (let i = 0; i < n; i++) box(0.08, 1.2 * s + 0.4, 0.08, x0 + i * w, (1.2 * s + 0.4) / 2, z, 0x9aa3ad); }
    for (let i = 0; i < n; i++) {
      const x = x0 + i * w; box(0.1, H, 0.1, x - w * 0.42, H / 2, 1.8 * s, 0x6f7b88); box(0.1, H, 0.1, x + w * 0.42, H / 2, 1.8 * s, 0x6f7b88); box(w * 0.88, 0.08, 0.1, x, H, 1.8 * s, 0x6f7b88);
      cyl(0.08 * s, 0.08 * s, 0.9 * s, x, 0.5 * s + 0.4, -0.2 * s, 0xb38b4a); cyl(0.11 * s, 0.11 * s, 1.1 * s, x, 1.0 * s, 0.7 * s, 0x2f6fb0, [Math.PI / 2, 0, 0]); cyl(0.08 * s, 0.08 * s, 1.0 * s, x + 0.35 * s, 0.7 * s + 0.4, 1.3 * s, 0xb38b4a);
      cyl(0.05 * s, 0.05 * s, 0.8 * s, x - 0.35 * s, 0.6 * s + 0.4, 1.3 * s, 0x777777);
    }
  }
  const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3());
  g.scale.setScalar(6 / Math.max(sz.x, sz.y * 3, sz.z)); g.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(g); g.position.y -= b2.min.y; g.position.x -= (b2.min.x + b2.max.x) / 2;
  return { group: g, preset: [0.7, 0.5, 1.2] };
}

// Single-line diagram of the chosen scheme: up to four feeders drawn, remaining ones noted.
export function swydSldSVG(r) {
  const W = 880, H = 460, c = r.cfg, sc = c.scheme, fd = Math.min(r.feeders, 4), x0 = 140, dx = fd > 3 ? 150 : 180, ink = '#1e2530', blue = '#2563eb';
  const cbx = (x, y) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#fff" stroke="${ink}" stroke-width="2"/>`, isox = (x, y) => `<path d="M${x} ${y - 9}v4M${x - 6} ${y + 6}l6-10M${x} ${y + 6}v3" stroke="${ink}" stroke-width="2" fill="none"/>`;
  const line = (x1, y1, x2, y2, col = ink, w = 2) => `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${col}" stroke-width="${w}" fill="none"/>`, txt = (x, y, t, a = 'middle', col = '#6b7482', fs = 11) => `<text x="${x}" y="${y}" text-anchor="${a}" font-size="${fs}" fill="${col}">${esc(t)}</text>`;
  const kinds = []; for (let i = 0; i < r.lines_; i++) kinds.push('Line'); for (let i = 0; i < r.xf; i++) kinds.push('Transformer'); for (let i = 0; i < r.rx; i++) kinds.push('Reactor'); for (let i = 0; i < r.spare; i++) kinds.push('Spare');
  // show a mix: first line, first transformer, then others
  const order = [...new Set(['Line', 'Transformer', 'Reactor', 'Spare'].filter((k) => kinds.includes(k)))], pick = []; for (let i = 0; pick.length < fd; i++) pick.push(order[i % order.length]);
  let body = '';
  if (sc === 'oneHalf') {
    const yT = 100, yB = 380, nd = Math.min(3, Math.ceil(r.feeders / 2));
    body += line(60, yT, W - 60, yT, blue, 5) + line(60, yB, W - 60, yB, blue, 5) + txt(62, yT - 10, 'Bus 1', 'start', blue, 12) + txt(62, yB + 22, 'Bus 2', 'start', blue, 12);
    for (let d = 0; d < nd; d++) {
      const x = 200 + d * 230; body += line(x, yT, x, yB);
      [165, 240, 315].forEach((y, i) => { body += isox(x, y - 26) + cbx(x, y) + isox(x, y + 26); }); [(165 + 240) / 2, (240 + 315) / 2].forEach((y, i) => { const out = pick[(d * 2 + i) % pick.length]; body += line(x, y, x + 62, y) + isox(x + 62, y) + line(x + 70, y, x + 100, y) + txt(x + 104, y + 4, out, 'start', ink, 12); });
      body += txt(x, yB + 22, `Diameter ${d + 1}`, 'middle', '#6b7482');
    }
    body += txt(W / 2, H - 14, `${r.cb} breakers serve ${r.feeders} feeders: every feeder keeps two breakers, so a bus fault or a breaker out of service drops no circuit`, 'middle', '#6b7482', 12);
  } else {
    const yB1 = 110, yB2 = 160, single = sc === 'single'; body += line(60, yB1, W - 60, yB1, blue, 5) + txt(62, yB1 - 10, single ? 'Bus' : sc === 'mainTransfer' ? 'Main bus' : 'Bus 1', 'start', blue, 12);
    if (!single) body += line(60, yB2, W - 60, yB2, '#0ea5a4', 5) + txt(62, yB2 + 22, sc === 'mainTransfer' ? 'Transfer bus' : 'Bus 2', 'start', '#0ea5a4', 12);
    pick.forEach((k, i) => { const x = x0 + i * dx, y1 = single ? yB1 : yB1;
      body += line(x, yB1, x, 330, ink) + (single ? '' : line(x + 18, yB2, x + 18, 236, ink) + line(x, 236, x + 18, 236) + isox(x + 18, 214)) + `<circle cx="${x}" cy="${yB1}" r="3" fill="${ink}"/>` + isox(x, 215 - (single ? 40 : 0)) + cbx(x, 255) + isox(x, 292) + line(x, 330, x, 360) + txt(x, 384, k, 'middle', ink, 12);
      body += `<path d="M${x - 6} 360h12l-6 9z" fill="${ink}"/>`; });
    if (couplersDraw(r)) { const xc = x0 + fd * dx - 20; body += line(xc, yB1, xc, 190, '#d98a3d') + line(xc, 190, xc, yB2, '#d98a3d') + cbx(xc, 175).replace('#fff', '#fff') + txt(xc + 14, 179, sc === 'mainTransfer' ? 'Transfer coupler' : 'Bus coupler', 'start', '#d98a3d', 12); }
    if (r.feeders > fd) body += txt(W - 90, 250, `+ ${r.feeders - fd} more feeders`, 'middle', '#6b7482', 12);
  }
  return `<svg viewBox="0 0 ${W} ${H}" class="sxsvg" role="img" aria-label="Single-line diagram"><rect width="${W}" height="${H}" fill="#f6f8fb"/>
    ${txt(40, 34, c.tag || 'Switchyard', 'start', ink, 15).replace('font-size="11"', 'font-size="15" font-weight="700"')}${txt(40, 54, `${r.kv} kV · ${r.sc[0].toLowerCase()} · ${c.gis} · ${c.amps} A · ${c.kA} kA · ${r.bays} bays`, 'start', '#6b7482', 12)}${body}</svg>`;
}
const couplersDraw = (r) => r.couplers > 0;
