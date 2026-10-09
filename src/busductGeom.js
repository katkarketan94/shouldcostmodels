// Shared geometry for the busduct drawings: bar layout inside the enclosure (mm).
export const PHASE_COLORS = ['#d64545', '#e8b923', '#3b6fd4', '#2a2d33', '#1f9d55']; // R, Y, B, N, E
export const BAR_LABELS = ['R', 'Y', 'B', 'N', 'E'];

export function barLayout(r) {
  const { width: W, height: H, effThk: t, phaseArea, neutralRatio, earthRatio, cfg } = r;
  const innerW = W - 2 * t, innerH = H - 2 * t;
  const sleeve = cfg.variant === 'Fire Rated' ? 4 : cfg.variant === 'Sandwich/Compact' ? 1.6 : 0;
  const ratios = [1, 1, 1, neutralRatio, earthRatio];
  const sumR = ratios.reduce((a, b) => a + b, 0);
  let hb = 0.62 * innerH;
  const gapOf = () => (cfg.variant === 'Air Insulated (AIB)' ? Math.max(8, 0.045 * innerW) : 2 * sleeve + 1);
  const total = (h) => (sumR * phaseArea / h) + ratios.length * 2 * sleeve + 4 * gapOf();
  if (total(hb) > 0.88 * innerW) hb = Math.min(0.86 * innerH, hb * total(hb) / (0.88 * innerW));
  const thks = ratios.map((q) => q * phaseArea / hb);
  let used = total(hb); const scale = used > 0.92 * innerW ? (0.92 * innerW) / used : 1; // keep the picture inside the box
  let x = -used * scale / 2;
  const bars = thks.map((tb, i) => {
    const w = tb * scale, s = sleeve * scale;
    const b = { i, x: x + s, w, h: hb, sleeve: s, label: BAR_LABELS[i], color: PHASE_COLORS[i] };
    x += w + 2 * s + gapOf() * scale; return b;
  });
  return { bars, hb, innerW, innerH, gap: gapOf(), sleeve };
}
