const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function ductSectionSVG(r) {
  const c = r.cfg, W = 880, Hh = 400, cx = W / 2, cy = 210, big = c.shape === 'Round' ? c.dia : Math.max(c.w, c.h), k = Math.min(300 / big, 0.6);
  const w = (c.shape === 'Round' ? c.dia : c.w) * k, h = (c.shape === 'Round' ? c.dia : c.h) * k;
  const t = Math.max(3, r.thk * k * 6), ins = c.ins === 'None' ? 0 : Math.max(6, c.insThk * k * 1.4), fl = c.joint === 'Slip + drive cleat' ? 0 : 7;
  const sheetCol = { 'GI sheet': '#aab3be', 'Pre-coated GI': '#e3e7ec', Aluminium: '#c9d0d9', 'SS 304': '#d6dce5' }[c.mat];
  const insCol = c.ins === 'Glass wool + foil' ? '#f0d98a' : '#3a3f47';
  const shape = (ex, fill, stroke, sw = 1.5) => {
    if (c.shape === 'Round') return `<circle cx="${cx}" cy="${cy}" r="${w / 2 + ex}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    if (c.shape === 'Flat oval') { const rr = Math.min(w, h) / 2 + ex; return `<rect x="${cx - w / 2 - ex}" y="${cy - h / 2 - ex}" width="${w + 2 * ex}" height="${h + 2 * ex}" rx="${rr}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`; }
    return `<rect x="${cx - w / 2 - ex}" y="${cy - h / 2 - ex}" width="${w + 2 * ex}" height="${h + 2 * ex}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };
  const dimLine = (x1, y1, x2, y2, label, vert) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1e2530"/><line x1="${x1 + (vert ? -5 : 0)}" y1="${y1 + (vert ? 0 : -5)}" x2="${x1 + (vert ? 5 : 0)}" y2="${y1 + (vert ? 0 : 5)}" stroke="#1e2530"/><line x1="${x2 + (vert ? -5 : 0)}" y1="${y2 + (vert ? 0 : -5)}" x2="${x2 + (vert ? 5 : 0)}" y2="${y2 + (vert ? 0 : 5)}" stroke="#1e2530"/><text x="${vert ? x1 - 10 : (x1 + x2) / 2}" y="${vert ? (y1 + y2) / 2 : y1 - 8}" ${vert ? `transform="rotate(-90 ${x1 - 10} ${(y1 + y2) / 2})"` : ''} text-anchor="middle" font-size="13" font-weight="600" fill="#1e2530">${label}</text>`;
  const oe = ins + fl + 14;
  return `<svg viewBox="0 0 ${W} ${Hh}" class="sxsvg" role="img" aria-label="Duct cross-section"><rect width="${W}" height="${Hh}" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Duct')}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(c.shape)} duct · section through the run (drawn to scale; sheet and insulation thickness exaggerated)</text>
    ${ins ? shape(ins + t, insCol, '#5b6573') : ''}${shape(t, sheetCol, '#4b5563', 2)}${shape(-t * 0.0, '#eef3f9', '#4b5563', 1.2)}
    ${c.dampers ? `${Array.from({ length: 5 }, (_, i) => `<line x1="${cx - w / 2 + 8}" y1="${cy - h / 2 + 12 + i * (h - 24) / 4 + 6}" x2="${cx + w / 2 - 8}" y2="${cy - h / 2 + 12 + i * (h - 24) / 4 - 6}" stroke="#9aa4b0" stroke-width="3" opacity=".7"/>`).join('')}` : ''}
    ${dimLine(cx - w / 2, cy + h / 2 + oe + 24, cx + w / 2, cy + h / 2 + oe + 24, c.shape === 'Round' ? `Ø ${c.dia} mm` : `${c.w} mm`, false)}
    ${c.shape === 'Round' ? '' : dimLine(cx - w / 2 - oe - 26, cy - h / 2, cx - w / 2 - oe - 26, cy + h / 2, `${c.h} mm`, true)}
    <g font-size="12" fill="#3a4350"><text x="${W - 190}" y="110" font-weight="700">Sheet</text><text x="${W - 190}" y="128">${esc(c.mat)} · ${r.thk.toFixed(2)} mm</text>
    <text x="${W - 190}" y="156" font-weight="700">Joint</text><text x="${W - 190}" y="174">${esc(c.joint)} @ ${r.cfg.run > 0 ? 1.2 : 1.2} m</text>
    <text x="${W - 190}" y="202" font-weight="700">Insulation</text><text x="${W - 190}" y="220">${c.ins === 'None' ? 'none' : `${esc(c.ins)} · ${c.insThk} mm`}</text>
    <text x="${W - 190}" y="248" font-weight="700">Weight</text><text x="${W - 190}" y="266">${(r.weight / c.run).toFixed(1)} kg per metre</text></g></svg>`;
}
