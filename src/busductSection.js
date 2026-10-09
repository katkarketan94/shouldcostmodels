import { barLayout } from './busductGeom.js';
const f = (n) => +n.toFixed(2);

export function busductSectionSVG(r) {
  const { width: W, height: H, effThk: t, cfg } = r, L = barLayout(r);
  const cu = cfg.conductor === 'Copper', barFill = cu ? '#d98a3d' : '#aeb8c4', barDark = cu ? '#a9631f' : '#5f6b7a';
  const alEnc = cfg.enclosure === 'Aluminium';
  const encFill = alEnc ? '#aeb6c1' : '#8b95a1';
  const cx = 0, cy = 0, x0 = -W / 2, y0 = -H / 2;
  let g = `<rect x="${f(x0)}" y="${f(y0)}" width="${W}" height="${H}" rx="${f(Math.max(t * 1.5, 2))}" fill="${encFill}"/>`;
  g += `<rect x="${f(x0 + t)}" y="${f(y0 + t)}" width="${f(W - 2 * t)}" height="${f(H - 2 * t)}" fill="#f6f7f9"/>`;
  const by = -L.hb / 2;
  for (const b of L.bars) {
    const wrap = cfg.variant === 'Air Insulated (AIB)' ? null : cfg.variant === 'Fire Rated' ? '#efe6cf' : b.color;
    if (wrap) g += `<rect x="${f(b.x - b.sleeve)}" y="${f(by - b.sleeve)}" width="${f(b.w + 2 * b.sleeve)}" height="${f(L.hb + 2 * b.sleeve)}" rx="${f(b.sleeve)}" fill="${wrap}" stroke="#00000022" stroke-width="${f(W * 0.002)}"/>`;
    g += `<rect x="${f(b.x)}" y="${f(by)}" width="${f(b.w)}" height="${f(L.hb)}" fill="${barFill}" stroke="${barDark}" stroke-width="${f(W * 0.003)}"/>`;
    g += `<circle cx="${f(b.x + b.w / 2)}" cy="${f(by - Math.max(b.sleeve, 2) - W * 0.03)}" r="${f(W * 0.022)}" fill="${b.color}"/><text x="${f(b.x + b.w / 2)}" y="${f(by - Math.max(b.sleeve, 2) - W * 0.03 + W * 0.011)}" text-anchor="middle" class="bs-b">${b.label}</text>`;
  }
  if (cfg.variant === 'Air Insulated (AIB)') { // insulating support blocks
    g += `<rect x="${f(L.bars[0].x - W * 0.02)}" y="${f(by + L.hb * 0.15)}" width="${f(L.bars[4].x + L.bars[4].w - L.bars[0].x + W * 0.04)}" height="${f(W * 0.018)}" fill="#5b3a2a" opacity=".85"/>`;
  }
  const fs = W * 0.05;
  const dimY = H / 2 + H * 0.12, dimX = x0 - W * 0.09;
  const dim = `<g stroke="#64748b" stroke-width="${f(W * 0.004)}" fill="none"><line x1="${f(x0)}" y1="${f(dimY)}" x2="${f(x0 + W)}" y2="${f(dimY)}"/><line x1="${f(x0)}" y1="${f(dimY - H * 0.03)}" x2="${f(x0)}" y2="${f(dimY + H * 0.03)}"/><line x1="${f(x0 + W)}" y1="${f(dimY - H * 0.03)}" x2="${f(x0 + W)}" y2="${f(dimY + H * 0.03)}"/>
    <line x1="${f(dimX)}" y1="${f(y0)}" x2="${f(dimX)}" y2="${f(y0 + H)}"/><line x1="${f(dimX - W * 0.02)}" y1="${f(y0)}" x2="${f(dimX + W * 0.02)}" y2="${f(y0)}"/><line x1="${f(dimX - W * 0.02)}" y1="${f(y0 + H)}" x2="${f(dimX + W * 0.02)}" y2="${f(y0 + H)}"/></g>
    <text x="0" y="${f(dimY + fs * 1.35)}" text-anchor="middle" class="bs-l">${W} mm</text><text x="${f(dimX - W * 0.03)}" y="0" text-anchor="end" dominant-baseline="middle" class="bs-l">${H} mm</text>
    <text x="0" y="${f(y0 - H * 0.1)}" text-anchor="middle" class="bs-l2">${cfg.enclosure} enclosure · ${f(t)} mm sheet · bar ${f(L.bars[0].w)} × ${f(L.hb)} mm</text>`;
  const pad = W * 0.22;
  return `<svg class="sx" viewBox="${f(x0 - pad * 1.3)} ${f(y0 - H * 0.22)} ${f(W + pad * 2.2)} ${f(H * 1.58)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Busduct cross-section">
  <style>.bs-l{font:600 ${f(fs)}px Inter,system-ui,sans-serif;fill:#0f172a}.bs-l2{font:500 ${f(fs * 0.9)}px Inter,system-ui,sans-serif;fill:#64748b}.bs-b{font:700 ${f(W * 0.026)}px Inter,system-ui,sans-serif;fill:#fff}</style>${g}${dim}</svg>`;
}
