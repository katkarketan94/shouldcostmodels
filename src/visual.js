// Shared look-and-feel for the cable drawings (SVG cross-section and three.js model).
export const COLORS = {
  Copper: '#d98a3d', Aluminium: '#c9d0d9',
  core: ['#d64545', '#e8b923', '#3b6fd4', '#2a2d33'], // red, yellow, blue, black (IS colour code)
  neutral: '#2a2d33',
  inner: '#e9dfc6', outer: '#26282d',
  steel: '#9aa3ad', alum: '#d5dbe3',
};

// Colours of the phase cores for N cores (3.5 core = 3 phases + smaller neutral)
export function coreColors(cores) {
  if (cores === 1) return ['#d64545'];
  if (cores === 2) return ['#d64545', '#2a2d33'];
  if (cores === 3) return COLORS.core.slice(0, 3);
  return COLORS.core.slice(0, 4);
}

export const isAlArmour = (a) => a === 'Aluminium Flat Strip' || a === 'Aluminium Round Wired';
export const isStripArmour = (a) => a === 'Galvanised steel flat strip' || a === 'Aluminium Flat Strip';

// Positions of the (insulated) cores inside the laid-up circle, centre-based, mm.
// Returns [{x, y, d(insulated dia), c(conductor dia), phase:boolean}]
export function corePositions(r) {
  const { cores: C } = r.cfg;
  if (C === 1) return [{ x: 0, y: 0, d: r.insDia, c: r.condDia, i: 0 }];
  const n = C === 3.5 ? 4 : C;
  const d = r.insDia;
  const out = [];
  const R = C === 2 ? d / 2 : C === 3 ? d / (2 * Math.sin(Math.PI / 3)) : (r.laidUp - d) / 2;
  const start = -Math.PI / 2;
  for (let i = 0; i < n; i++) {
    const a = start + (i * 2 * Math.PI) / n + (n === 3 ? Math.PI / 6 : n === 2 ? Math.PI / 2 : Math.PI / 4);
    const neutral = C === 3.5 && i === 3;
    out.push({ x: R * Math.cos(a), y: R * Math.sin(a), d: neutral ? r.neutCoreDia : d, c: neutral ? r.neutDia : r.condDia, i, neutral });
  }
  return out;
}
