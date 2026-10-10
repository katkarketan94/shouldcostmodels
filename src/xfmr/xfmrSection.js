// Elevation of the active part from the workbook's solved design: core limbs and yokes, LV and HV windings, window and limb spacing.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 2) => Number(v).toFixed(d);
export function xfmrSectionSVG(r, kind) {
  const one = r.phases === 1, nLimb = one ? 2 : 3, d = r.coreD, lc = r.limbC, wh = r.windowH, yoke = d * 0.8, totW = (nLimb - 1) * lc + d + d * 0.3, totH = wh + 2 * yoke;
  const k = Math.min(640 / totW, 250 / totH), X0 = 120, Y0 = 92, cx = (i) => X0 + (d * 0.15 + d / 2 + i * lc) * k, sx = (m) => m * k;
  const core = '#5c6470', coil = (hv) => (kind === 'dry' ? (hv ? '#d9a35c' : '#3b4754') : (hv ? '#d29a52' : '#b86b3a'));
  const parts = [`<rect x="${X0}" y="${Y0}" width="${sx(totW)}" height="${sx(yoke)}" fill="${core}"/><rect x="${X0}" y="${Y0 + sx(yoke + wh)}" width="${sx(totW)}" height="${sx(yoke)}" fill="${core}"/>`];
  const hvOut = r.hvOut / 2, hvIn = r.hvIn / 2, lvIn = r.lvIn / 2, lvOut = lvIn + r.lvRad, y0 = Y0 + sx(yoke + (wh - r.coilH) / 2), hh = sx(r.coilH);
  for (let i = 0; i < nLimb; i++) {
    const c = cx(i);
    parts.push(`<rect x="${c - sx(d / 2)}" y="${Y0 + sx(yoke)}" width="${sx(d)}" height="${sx(wh)}" fill="${core}"/>`);
    for (const s of [-1, 1]) {
      parts.push(`<rect x="${c + s * sx(lvIn) - (s > 0 ? 0 : sx(r.lvRad))}" y="${y0}" width="${sx(r.lvRad)}" height="${hh}" fill="${coil(false)}" stroke="#2a3340" stroke-width=".8"/>`);
      parts.push(`<rect x="${c + s * sx(hvIn) - (s > 0 ? 0 : sx(r.hvRad))}" y="${y0}" width="${sx(r.hvRad)}" height="${hh}" fill="${coil(true)}" stroke="#2a3340" stroke-width=".8"/>`);
    }
  }
  const dim = (x1, y1, x2, y2, t, v) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e2530"/><text x="${v ? x1 - 8 : (x1 + x2) / 2}" y="${v ? (y1 + y2) / 2 : y1 - 7}" ${v ? `transform="rotate(-90 ${x1 - 8} ${(y1 + y2) / 2})"` : ''} text-anchor="middle" font-size="12.5" font-weight="600" fill="#1e2530">${t}</text>`;
  return `<svg viewBox="0 0 880 420" class="sxsvg" role="img" aria-label="Active part"><rect width="880" height="420" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">Active part · ${n(r.ratingKva / 1000, r.ratingKva < 10000 ? 2 : 1)} MVA ${esc(r.hvKv)}/${esc(r.lvKv)} kV</text><text x="40" y="54" font-size="12" fill="#6b7482">Elevation of the solved design · ${one ? 'two wound limbs' : 'three limbs'} · LV winding inside, HV outside</text>
    ${parts.join('')}
    ${dim(X0 - 26, Y0 + sx(yoke), X0 - 26, Y0 + sx(yoke + wh), `window ${n(wh)} m`, true)}${dim(cx(0), Y0 + sx(totH) + 26, cx(1), Y0 + sx(totH) + 26, `limb centres ${n(lc)} m`, false)}
    <g font-size="12" fill="#3a4350"><text x="${X0}" y="${Y0 + sx(totH) + 62}">Core Ø ${n(d, 3)} m · coil height ${n(r.coilH, 3)} m · HV outer Ø ${n(r.hvOut, 3)} m · ${n(r.vpt, 1)} V/turn · J ${n(r.J)} A/mm² · ${r.hvTurns}/${r.lvTurns} turns</text>
    <rect x="${X0 + 4}" y="${Y0 + sx(totH) + 76}" width="11" height="11" fill="${core}"/><text x="${X0 + 20}" y="${Y0 + sx(totH) + 86}">core steel</text><rect x="${X0 + 100}" y="${Y0 + sx(totH) + 76}" width="11" height="11" fill="${coil(false)}"/><text x="${X0 + 116}" y="${Y0 + sx(totH) + 86}">LV winding</text><rect x="${X0 + 200}" y="${Y0 + sx(totH) + 76}" width="11" height="11" fill="${coil(true)}"/><text x="${X0 + 216}" y="${Y0 + sx(totH) + 86}">HV winding</text></g></svg>`;
}
