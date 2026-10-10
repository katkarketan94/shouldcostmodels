// Layout drawing of an AHU / FCU: the sections in flow order with their computed lengths, plus the casing size.
const COL = { mix: '#cfd6e0', pre: '#b9e2c0', fine: '#b7d3f2', hepa: '#f1f5fb', cool: '#cfe6f7', heat: '#f4c7bf', fan: '#dbe3f5', hum: '#d7ecf8', coil: '#cfe6f7' };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
export function ahuSectionSVG(r) {
  const secs = r.sections, L = r.L, W = 880, left = 70, scale = (W - left * 2) / L, top = 112, hpx = Math.max(110, Math.min(190, (r.H / L) * (W - left * 2) * 1.0)), n = (v, d = 2) => Number(v).toFixed(d);
  let x = left; const parts = [];
  secs.forEach((s) => {
    const w = s.len * scale, cx = x + w / 2, id = s.id;
    let art = '';
    if (id === 'cool' || id === 'heat' || id === 'coil') { const d = Math.min(w * 0.7, 40); art = `<rect x="${cx - d / 2}" y="${top + 14}" width="${d}" height="${hpx - 28}" fill="${id === 'heat' ? '#e58a7c' : '#6aa9d8'}" opacity=".5"/>${Array.from({ length: 12 }, (_, i) => `<line x1="${cx - d / 2}" x2="${cx + d / 2}" y1="${top + 20 + i * (hpx - 40) / 11}" y2="${top + 20 + i * (hpx - 40) / 11}" stroke="#c27a2c" stroke-width="2"/>`).join('')}`; }
    else if (id === 'fan') { const rr = Math.min(hpx * 0.34, w * 0.42); art = `<circle cx="${cx - w * 0.08}" cy="${top + hpx / 2}" r="${rr}" fill="#fff" stroke="#2f6fd6" stroke-width="2.5"/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${cx - w * 0.08}" y1="${top + hpx / 2}" x2="${cx - w * 0.08 + Math.cos(a) * rr * 0.9}" y2="${top + hpx / 2 + Math.sin(a) * rr * 0.9}" stroke="#2f6fd6" stroke-width="3" stroke-linecap="round"/>`; }).join('')}<rect x="${cx + w * 0.22}" y="${top + hpx / 2 - 14}" width="${Math.min(30, w * 0.28)}" height="28" rx="5" fill="#1f6f5c"/>`; }
    else if (id === 'pre' || id === 'fine' || id === 'hepa') art = Array.from({ length: id === 'hepa' ? 7 : 5 }, (_, i) => `<line x1="${cx - w * 0.3 + (i * w * 0.6) / (id === 'hepa' ? 6 : 4)}" x2="${cx + (id === 'fine' ? w * 0.22 : 0) - w * 0.3 + (i * w * 0.6) / (id === 'hepa' ? 6 : 4)}" y1="${top + 16}" y2="${top + hpx - 16}" stroke="${id === 'pre' ? '#4f9d63' : id === 'fine' ? '#3b78b8' : '#7b8794'}" stroke-width="2"/>`).join('');
    else if (id === 'mix') art = Array.from({ length: 6 }, (_, i) => `<line x1="${x + w * 0.2}" y1="${top + 14 + i * (hpx - 28) / 5 + 6}" x2="${x + w * 0.8}" y2="${top + 14 + i * (hpx - 28) / 5 - 6}" stroke="#7b8794" stroke-width="3"/>`).join('');
    else if (id === 'hum') art = Array.from({ length: 5 }, (_, i) => `<circle cx="${cx}" cy="${top + 20 + i * (hpx - 40) / 4}" r="6" fill="#7ab6e2" opacity=".7"/>`).join('');
    parts.push(`<rect x="${x}" y="${top}" width="${w}" height="${hpx}" fill="${COL[id] || '#e5e9ef'}" stroke="#5b6573" stroke-width="1.5"/>${art}
      <text x="${cx}" y="${top + hpx + 22}" text-anchor="middle" font-size="12" fill="#1e2530" font-weight="600">${esc(s.label.split(' · ')[0])}</text><text x="${cx}" y="${top + hpx + 38}" text-anchor="middle" font-size="11" fill="#6b7482">${n(s.len)} m</text>`);
    x += w;
  });
  const tot = x - left;
  return `<svg viewBox="0 0 ${W} 320" class="sxsvg" role="img" aria-label="AHU layout">
    <rect width="${W}" height="320" fill="#f6f8fb"/>
    <text x="${left}" y="30" font-size="15" font-weight="700" fill="#1e2530">${esc(r.cfg.tag || '')}</text><text x="${left}" y="50" font-size="12" fill="#6b7482">${r.kind === 'ahu' ? 'Air handling unit' : 'Fan coil unit'} · side elevation, air flows left to right</text>
    <line x1="${left - 20}" y1="${top + hpx / 2}" x2="${left - 4}" y2="${top + hpx / 2}" stroke="#2f6fd6" stroke-width="3"/><polygon points="${left - 4},${top + hpx / 2 - 6} ${left + 6},${top + hpx / 2} ${left - 4},${top + hpx / 2 + 6}" fill="#2f6fd6"/>
    ${parts.join('')}
    <line x1="${left}" y1="${top - 16}" x2="${left + tot}" y2="${top - 16}" stroke="#1e2530"/><line x1="${left}" y1="${top - 22}" x2="${left}" y2="${top - 10}" stroke="#1e2530"/><line x1="${left + tot}" y1="${top - 22}" x2="${left + tot}" y2="${top - 10}" stroke="#1e2530"/>
    <text x="${left + tot / 2}" y="${top - 24}" text-anchor="middle" font-size="12.5" font-weight="600" fill="#1e2530">Length ${n(L)} m</text>
    <text x="${left + tot + 12}" y="${top + hpx / 2 - 4}" font-size="12" fill="#1e2530" font-weight="600">H ${n(r.H)} m</text><text x="${left + tot + 12}" y="${top + hpx / 2 + 12}" font-size="12" fill="#6b7482">W ${n(r.W)} m</text>
    <text x="${left}" y="${top + hpx + 66}" font-size="12" fill="#6b7482">Face area ${n(r.face)} m² · ${Number(r.cfg.cfm).toLocaleString('en-IN')} CFM · casing weight ${Math.round(r.sheetKg + r.insKg + (r.frameKg || 0)).toLocaleString('en-IN')} kg</text>
  </svg>`;
}
