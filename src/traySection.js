// Cross-section drawings for the tray items (SVG, true proportions with a minimum visible sheet thickness).
const f = (n) => +n.toFixed(2);

export function traySectionSVG(r, T) {
  const { cfg } = r, kind = cfg.kind, W = cfg.width, D = cfg.depth, t = cfg.thk;
  const section = kind === 'channel' || kind === 'arm';
  const c = section ? T.channel.lip : kind === 'trough' ? 0 : kind === 'perf' ? (W >= 300 && D >= 100 ? 15 : 0) : T.ladder.collar;
  const span = Math.max(W + 2 * t, D) * 1.0;
  const pad = span * 0.28;
  const vbw = W + 2 * t + pad * 2, vbh = D + pad * 1.75;
  const sw = Math.max(t, span * 0.012);              // drawn sheet thickness
  const x0 = -W / 2 - t / 2, x1 = W / 2 + t / 2, yb = 0, yt = -D;  // y grows downward in SVG, so the tray stands on yb
  const stroke = '#8e98a5', fill = 'none';
  let g = '';
  const poly = (pts, col = stroke, w = sw) => `<polyline points="${pts.map((p) => p.map(f).join(',')).join(' ')}" fill="${fill}" stroke="${col}" stroke-width="${f(w)}" stroke-linejoin="miter" stroke-linecap="square"/>`;
  const cc = section ? 0 : c;
  if (section) {
    const lip = c;
    // C-channel: back at the bottom, legs up, lips turned in
    g += poly([[x0 + lip, yt], [x0, yt], [x0, yb], [x1, yb], [x1, yt], [x1 - lip, yt]]);
  } else {
    // rails (C opening inwards) and the floor (rung / perforated plate)
    g += poly([[x0 + cc, yt], [x0, yt], [x0, yb], [x0 + cc, yb]]);
    g += poly([[x1 - cc, yt], [x1, yt], [x1, yb], [x1 - cc, yb]]);
    g += poly([[x0, yb - sw / 2], [x1, yb - sw / 2]], '#a9b2bd', sw);
  }
  // dimensions
  const dim = (xa, ya, xb, yb2, label, off = 0, vert = false) => {
    const tick = span * 0.025, tx = vert ? xa : (xa + xb) / 2, ty = vert ? (ya + yb2) / 2 : ya;
    return `<g stroke="#64748b" stroke-width="${f(span * 0.004)}" fill="none"><line x1="${f(xa)}" y1="${f(ya)}" x2="${f(xb)}" y2="${f(yb2)}"/>`
      + (vert ? `<line x1="${f(xa - tick)}" y1="${f(ya)}" x2="${f(xa + tick)}" y2="${f(ya)}"/><line x1="${f(xb - tick)}" y1="${f(yb2)}" x2="${f(xb + tick)}" y2="${f(yb2)}"/>`
        : `<line x1="${f(xa)}" y1="${f(ya - tick)}" x2="${f(xa)}" y2="${f(ya + tick)}"/><line x1="${f(xb)}" y1="${f(yb2 - tick)}" x2="${f(xb)}" y2="${f(yb2 + tick)}"/>`)
      + `</g><text x="${f(tx + (vert ? -span * 0.03 : 0))}" y="${f(ty + (vert ? 0 : span * 0.075))}" text-anchor="${vert ? 'end' : 'middle'}" class="ts-l" ${vert ? `dominant-baseline="middle"` : ''}>${label}</text>`;
  };
  const dy = yb + span * 0.13;
  g += dim(x0, dy, x1, dy, `${section ? 'Back' : 'Width'} ${W} mm`);
  g += dim(x0 - span * 0.1, yt, x0 - span * 0.1, yb, `${D} mm`, 0, true);
  g += `<text x="${f(0)}" y="${f(yt - span * 0.07)}" text-anchor="middle" class="ts-l2">${section ? `lips ${c} mm · ` : cc ? `collar ${cc} mm · ` : ''}sheet ${t} mm</text>`;
  const fs = span * 0.062;
  return `<svg class="sx" viewBox="${f(-vbw / 2 - span * 0.2)} ${f(yt - pad * 0.7)} ${f(vbw + span * 0.4)} ${f(vbh)}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Cross-section">
  <style>.ts-l{font:600 ${f(fs)}px Inter,system-ui,sans-serif;fill:#0f172a}.ts-l2{font:500 ${f(fs * 0.9)}px Inter,system-ui,sans-serif;fill:#64748b}</style>${g}</svg>`;
}
