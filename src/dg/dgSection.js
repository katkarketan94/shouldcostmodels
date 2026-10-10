// Plan view of the set: radiator, engine, alternator and panel inside the enclosure, with the computed dimensions.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 2) => Number(v).toFixed(d);
export function dgSectionSVG(r) {
  const c = r.cfg, enc = c.enclosure !== 'None', L = enc ? r.encl.L : r.skid.L + 0.5, W = enc ? r.encl.W : r.skid.W + 0.2, k = Math.min(700 / L, 230 / W), x0 = 90, y0 = 112, wpx = L * k, hpx = W * k;
  const sl = r.skid.L, sw = r.skid.W, sx = x0 + (L - sl) / 2 * k, sy = y0 + (W - sw) / 2 * k;
  const rect = (x, y, w, h, fill, label, tcol = '#1e2530') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="#5b6573" stroke-width="1.4"/><text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" font-size="12" font-weight="600" fill="${tcol}">${label}</text>`;
  const eL = sl * 0.34 * k, eW = sw * 0.62 * k, aL = sl * 0.26 * k, ex = sx + sl * 0.5 * k - sl * 0.18 * k - eL / 2, ey = sy + (sw * k - eW) / 2, ax = ex + eL + 0.1 * k;
  const dim = (xa, ya, xb, yb, label, vert) => `<line x1="${xa}" y1="${ya}" x2="${xb}" y2="${yb}" stroke="#1e2530"/><text x="${vert ? xa - 8 : (xa + xb) / 2}" y="${vert ? (ya + yb) / 2 : ya - 7}" ${vert ? `transform="rotate(-90 ${xa - 8} ${(ya + yb) / 2})"` : ''} text-anchor="middle" font-size="12.5" font-weight="600" fill="#1e2530">${label}</text>`;
  return `<svg viewBox="0 0 880 400" class="sxsvg" role="img" aria-label="DG set plan"><rect width="880" height="400" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'DG set')}</text><text x="40" y="54" font-size="12" fill="#6b7482">Plan view · ${n(r.std, 0)} kVA set, ${enc ? esc(c.enclosure.toLowerCase()) + ' enclosure' : 'open set on skid'}</text>
    ${enc ? `<rect x="${x0}" y="${y0}" width="${wpx}" height="${hpx}" fill="#e6edf6" stroke="#4b6a8c" stroke-width="4"/>` : ''}
    <rect x="${sx}" y="${sy}" width="${sl * k}" height="${sw * k}" fill="#fff" stroke="#3f4753" stroke-width="2" stroke-dasharray="${enc ? '5 3' : '0'}"/>
    ${rect(sx + 4, sy + 6, 0.1 * k + 14, sw * k - 12, '#cfd6e0', 'Radiator')}${rect(ex, ey, eL, eW, '#f0c9c4', `Engine ${n(r.engineKw, 0)} kW`)}${rect(ax, sy + (sw * k - 0.45 * sw * k) / 2, aL, 0.45 * sw * k, '#cfdcf3', `Alternator`)}
    ${rect(sx + sl * k - 0.5 * k, sy + 4, 0.45 * k, 0.7 * k, '#e5e9ef', 'Panel')}
    <rect x="${sx + sl * 0.15 * k}" y="${sy + sw * k * 0.07}" width="${sl * 0.6 * k}" height="${sw * k * 0.86}" fill="none" stroke="#9aa4b0" stroke-dasharray="3 3"/><text x="${sx + sl * 0.15 * k + 6}" y="${sy + sw * k - 8}" font-size="11" fill="#6b7482">fuel tank below, ${n(r.tankL, 0)} L</text>
    ${dim(x0, y0 + hpx + 28, x0 + wpx, y0 + hpx + 28, `${enc ? 'Enclosure' : 'Set'} length ${n(L)} m`, false)}${dim(x0 - 24, y0, x0 - 24, y0 + hpx, `${n(W)} m`, true)}
    <text x="${x0}" y="${y0 + hpx + 62}" font-size="12" fill="#6b7482">${enc ? `Height ${n(r.encl.H)} m · surface ${n(r.encl.area, 1)} m² · ` : ''}skid ${n(sl)} × ${n(sw)} m · full-load current ${n(r.amps, 0)} A · ${n(r.fuelLph, 1)} L/h at full load</text></svg>`;
}
