// Refrigerant circuit schematic with the model's duties.
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const n = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
export function chillerSectionSVG(r) {
  const water = r.cond.kind === 'shell', c = r.cfg;
  const box = (x, y, w, h, fill, title, l1, l2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="#5b6573" stroke-width="1.8"/><text x="${x + w / 2}" y="${y + 30}" text-anchor="middle" font-size="14" font-weight="700" fill="#1e2530">${title}</text><text x="${x + w / 2}" y="${y + 52}" text-anchor="middle" font-size="12" fill="#3a4350">${l1}</text><text x="${x + w / 2}" y="${y + 70}" text-anchor="middle" font-size="12" fill="#6b7482">${l2}</text>`;
  const arrow = (x1, y1, x2, y2, col) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3"/><polygon points="${x2},${y2} ${x2 - (x2 > x1 ? 10 : x2 < x1 ? -10 : 0) + (y2 !== y1 ? 5 : 0)},${y2 - (y2 > y1 ? 10 : y2 < y1 ? -10 : 0) - (x2 !== x1 ? 5 : 0)} ${x2 - (x2 > x1 ? 10 : x2 < x1 ? -10 : 0) - (y2 !== y1 ? 5 : 0)},${y2 - (y2 > y1 ? 10 : y2 < y1 ? -10 : 0) + (x2 !== x1 ? 5 : 0)}" fill="${col}"/>`;
  return `<svg viewBox="0 0 880 440" class="sxsvg" role="img" aria-label="Refrigerant cycle"><rect width="880" height="440" fill="#f6f8fb"/>
    <text x="40" y="34" font-size="15" font-weight="700" fill="#1e2530">${esc(c.tag || 'Chiller')}</text><text x="40" y="54" font-size="12" fill="#6b7482">${esc(r.ty.name)} · vapour-compression circuit</text>
    ${box(300, 80, 280, 96, '#fde6e3', water ? 'Condenser' : 'Air-cooled condenser', water ? `${n(r.qC)} kW · ${n(r.cond.area, 0)} m² · Ø${n(r.cond.D, 2)} m` : `${n(r.qC)} kW · ${n(r.cond.face, 1)} m² face`, water ? `water ${c.cwIn} → ${c.cwIn + c.cwRange} °C` : `${n(r.cond.air, 1)} m³/s air · ${r.cond.fans} fans`)}
    ${box(300, 290, 280, 96, '#e1effb', 'Evaporator', `${n(r.qE)} kW · ${n(r.ev.area, 0)} m² · Ø${n(r.ev.D, 2)} m`, `chilled water ${c.chwIn} → ${c.chwOut} °C`)}
    ${box(40, 185, 190, 96, '#e7ebf3', 'Compressor', `${n(r.shaft)} kW shaft`, `${r.ty.cls.toLowerCase()}${c.vfd === 'Yes' ? ' · VFD' : ''}`)}
    ${box(650, 185, 190, 96, '#eef1f5', 'Expansion', 'electronic valve', `COP ${Number(r.cop).toFixed(1)} · ${r.kwTr.toFixed(2)} kW/TR`)}
    ${arrow(135, 185, 135, 128, '#d64545')}${arrow(135, 128, 300, 128, '#d64545')}${arrow(580, 128, 745, 128, '#e08a2e')}${arrow(745, 128, 745, 185, '#e08a2e')}${arrow(745, 281, 745, 338, '#2f6fd6')}${arrow(745, 338, 580, 338, '#2f6fd6')}${arrow(300, 338, 135, 338, '#2f6fd6')}${arrow(135, 338, 135, 281, '#2f6fd6')}
    <text x="215" y="120" font-size="11" fill="#d64545" font-weight="600">hot gas</text><text x="640" y="120" font-size="11" fill="#e08a2e" font-weight="600">liquid</text><text x="640" y="330" font-size="11" fill="#2f6fd6" font-weight="600">cold mix</text><text x="170" y="330" font-size="11" fill="#2f6fd6" font-weight="600">vapour</text>
    <text x="40" y="420" font-size="12" fill="#6b7482">Evaporator saturation ${n(r.tEvap, 1)} °C · LMTD ${n(r.lmtdE, 2)} K · condensing ${n(r.tCond, 1)} °C${water ? ` · LMTD ${n(r.lmtdC, 2)} K` : ''}</text></svg>`;
}
