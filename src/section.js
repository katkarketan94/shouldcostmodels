// 2D cross-section drawn from the computed dimensions (mm), as inline SVG.
import { COLORS, coreColors, corePositions, isAlArmour, isStripArmour } from './visual.js';

const f = (n) => +n.toFixed(2);

function strands(cx, cy, R, fill, stroke) {
  // hexagonal strand pattern clipped to a circle of radius R
  const rings = R > 14 ? 4 : R > 7 ? 3 : R > 3.2 ? 2 : R > 1.4 ? 1 : 0;
  const sr = R / (2 * rings + 1);
  let s = '';
  const pts = [[0, 0]];
  for (let q = 1; q <= rings; q++) for (let i = 0; i < 6 * q; i++) {
    const a = (i / (6 * q)) * Math.PI * 2, rad = q * 2 * sr;
    pts.push([rad * Math.cos(a), rad * Math.sin(a)]);
  }
  for (const [x, y] of pts) s += `<circle cx="${f(cx + x)}" cy="${f(cy + y)}" r="${f(sr * 0.94)}" fill="${fill}" stroke="${stroke}" stroke-width="${f(sr * 0.1)}"/>`;
  return s;
}

function sectorPath(cx, cy, R, a0, a1) {
  const p = (a) => `${f(cx + R * Math.cos(a))} ${f(cy + R * Math.sin(a))}`;
  return `M${f(cx)} ${f(cy)} L${p(a0)} A${f(R)} ${f(R)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)} Z`;
}

export function crossSectionSVG(r, { labels = true } = {}) {
  const { cfg } = r;
  const R = r.outerDia / 2;
  const pad = labels ? R * 0.3 : R * 0.08;
  const vb = R + pad;
  const cond = COLORS[cfg.conductor];
  const condDark = cfg.conductor === 'Copper' ? '#a9631f' : '#8e97a3';
  let g = '';
  // outer sheath
  g += `<circle r="${f(R)}" fill="${COLORS.outer}"/>`;
  g += `<circle r="${f(R)}" fill="url(#shine)"/>`;
  // armour
  if (cfg.armour !== 'Unarmored') {
    const ra = r.armourDia / 2, ri = r.innerDia / 2;
    const metal = isAlArmour(cfg.armour) ? COLORS.alum : COLORS.steel;
    g += `<circle r="${f(ra)}" fill="${metal}"/>`;
    if (isStripArmour(cfg.armour)) {
      const n = Math.max(12, Math.round((Math.PI * (ri + ra)) / (r.armourThk * 7)));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 360;
        g += `<line x1="${f(ri)}" x2="${f(ra)}" y1="0" y2="0" transform="rotate(${f(a)})" stroke="#6b7480" stroke-width="${f(R * 0.006)}"/>`;
      }
    } else {
      const n = Math.max(10, Math.floor((Math.PI * (ri + r.armourThk)) / r.armourThk));
      const rc = ri + r.armourThk / 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        g += `<circle cx="${f(rc * Math.cos(a))}" cy="${f(rc * Math.sin(a))}" r="${f(r.armourThk / 2 * 0.97)}" fill="#c4ccd5" stroke="#6b7480" stroke-width="${f(r.armourThk * 0.07)}"/>`;
      }
    }
  }
  // inner sheath
  g += `<circle r="${f(r.innerDia / 2)}" fill="${COLORS.inner}"/>`;
  // filler region inside laid-up circle
  g += `<circle r="${f(r.laidUp / 2)}" fill="#d9ceb1" stroke="#bfb393" stroke-width="${f(R * 0.004)}"/>`;
  // cores
  const pos = corePositions(r);
  const cc = coreColors(cfg.cores);
  const sector = cfg.shape === 'Sector shaped' && cfg.cores >= 3;
  pos.forEach((p, idx) => {
    const colr = p.neutral ? COLORS.neutral : cc[idx % cc.length];
    if (sector) {
      const n = pos.length, span = (2 * Math.PI) / n, gap = 0.05;
      const mid = Math.atan2(p.y, p.x), a0 = mid - span / 2 + gap, a1 = mid + span / 2 - gap;
      const Rin = r.laidUp / 2 - r.insThk * 0.35;
      g += `<path d="${sectorPath(0, 0, Rin, a0, a1)}" fill="${colr}" stroke="#00000033" stroke-width="${f(R * 0.004)}"/>`;
      const k = (Rin - r.insThk * 1.4) / Rin;
      g += `<path d="${sectorPath(0, 0, Rin * k, a0 + 0.1, a1 - 0.1)}" fill="${cond}" stroke="${condDark}" stroke-width="${f(R * 0.005)}"/>`;
    } else {
      g += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.d / 2)}" fill="${colr}" stroke="#00000033" stroke-width="${f(R * 0.004)}"/>`;
      g += `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.c / 2)}" fill="${cond}" stroke="${condDark}" stroke-width="${f(R * 0.005)}"/>`;
      g += strands(p.x, p.y, p.c / 2, '#ffffff22', condDark);
    }
  });

  let ann = '';
  if (labels) {
    const items = [
      ['Outer sheath', r.outerDia / 2 - r.outerThk / 2, r.outerThk, cfg.outer],
      cfg.armour !== 'Unarmored' ? ['Armour', r.armourDia / 2 - r.armourThk / 2, r.armourThk, cfg.armour.replace('Galvanised steel', 'GS').replace('Aluminium', 'Al')] : null,
      ['Inner sheath', r.innerDia / 2 - r.innerThk / 2, r.innerThk, cfg.inner],
      ['Insulation', null, r.insThk, cfg.insulation],
      ['Conductor', null, null, `${cfg.size} mm² ${cfg.conductor}`],
    ].filter(Boolean);
    const ys = [-0.62, -0.31, 0, 0.31, 0.62].slice(0, items.length);
    const side = R * 1.6;
    items.forEach((it, i) => {
      const y = ys[i] * R * 1.5;
      let tx, ty;
      if (it[0] === 'Insulation' || it[0] === 'Conductor') {
        const p = pos[0];
        const rr = it[0] === 'Conductor' ? p.c / 2 * 0.4 : (p.c / 2 + p.d / 2) / 2;
        tx = p.x + rr; ty = p.y;
        if (sector) { tx = (r.laidUp / 2) * 0.62 * Math.cos(Math.atan2(p.y, p.x)); ty = (r.laidUp / 2) * 0.62 * Math.sin(Math.atan2(p.y, p.x)); }
      } else {
        const a = (-35 - i * 8) * Math.PI / 180; tx = it[1] * Math.cos(a); ty = it[1] * Math.sin(a);
      }
      const lx = side, ly = y;
      ann += `<polyline points="${f(tx)},${f(ty)} ${f(R * 1.25)},${f(ly)} ${f(lx - R * 0.04)},${f(ly)}" fill="none" stroke="#94a3b8" stroke-width="${f(R * 0.006)}"/>`;
      ann += `<circle cx="${f(tx)}" cy="${f(ty)}" r="${f(R * 0.012)}" fill="#475569"/>`;
      ann += `<text x="${f(lx)}" y="${f(ly - R * 0.01)}" class="sx-l1">${it[0]}</text>`;
      ann += `<text x="${f(lx)}" y="${f(ly + R * 0.09)}" class="sx-l2">${it[3]}${it[2] ? ` · ${it[2]} mm` : ''}</text>`;
    });
    // overall diameter dimension line
    const dy = R + R * 0.17;
    ann += `<line x1="${f(-R)}" x2="${f(R)}" y1="${f(dy)}" y2="${f(dy)}" stroke="#64748b" stroke-width="${f(R * 0.008)}"/>`
      + `<line x1="${f(-R)}" x2="${f(-R)}" y1="${f(dy - R * 0.04)}" y2="${f(dy + R * 0.04)}" stroke="#64748b" stroke-width="${f(R * 0.008)}"/>`
      + `<line x1="${f(R)}" x2="${f(R)}" y1="${f(dy - R * 0.04)}" y2="${f(dy + R * 0.04)}" stroke="#64748b" stroke-width="${f(R * 0.008)}"/>`
      + `<text x="0" y="${f(dy + R * 0.2)}" text-anchor="middle" class="sx-l1">Ø ${f(r.outerDia)} mm (rated ${r.od} mm)</text>`;
  }
  const x0 = labels ? -R * 1.12 : -vb, w = labels ? R * 3.95 : vb * 2;
  const y0 = labels ? -R * 1.1 : -vb, h = labels ? R * 2.7 : vb * 2;
  return `<svg class="sx" viewBox="${f(x0)} ${f(y0)} ${f(w)} ${f(h)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cable cross-section">
  <defs><radialGradient id="shine" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  <style>.sx-l1{font:600 ${f(R * 0.085)}px Inter,system-ui,sans-serif;fill:#0f172a}.sx-l2{font:500 ${f(R * 0.07)}px Inter,system-ui,sans-serif;fill:#64748b}</style></defs>
  <g class="sx-g">${g}</g>${ann}</svg>`;
}
