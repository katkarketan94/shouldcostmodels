// Port of the per-item cost sheets in the cable-tray workbook. Same formulas, same quirks.
// Units: mm, kg, Rs. Each model returns the cost of one piece of `length` mm.

export const KINDS = {
  ladder: { label: 'Ladder tray', family: 'ladder', straight: true },
  perf: { label: 'Perforated tray', family: 'perf', straight: true },
  trough: { label: 'U-trough', family: 'trough', straight: true },
  hbend: { label: 'Horizontal bend 90°', family: 'ladder', fitting: true },
  vup: { label: 'Vertical bend up', family: 'ladder', fitting: true },
  vdown: { label: 'Vertical bend down', family: 'ladder', fitting: true },
  tee: { label: 'Horizontal tee', family: 'ladder', fitting: true },
  cross: { label: 'Horizontal cross', family: 'ladder', fitting: true },
  channel: { label: 'Channel', family: 'channel', section: true },
  arm: { label: 'Cantilever arm', family: 'channel', section: true },
};

const roundHalfUp = (x) => Math.floor(x + 0.5 + 1e-9);

function scrapCredit(P, zincWeightRaw) { // recoverable ash + dross, Rs
  const ash = P.ashPct * zincWeightRaw, dross = P.drossPct * zincWeightRaw;
  return ash * P.ashSalvage * P.zincRate + dross * P.drossSalvage * P.zincRate;
}

function ladderFamily(cfg, T) {
  const { params: P, ladder: A, coupler: C } = T;
  const { kind, width: W, depth: Dp, thk: t } = cfg;
  const L = cfg.length ?? (T.fittingLength[kind] ?? 2500), c = A.collar, rho = P.steelDensity, fr = A.scrapSalvage;
  const fitting = !!KINDS[kind].fitting;
  const runnerW = 2 * (Dp + 2 * c) / 1000 * t / 1000 * L / 1000 * rho;                             // D32
  const holesW = 2 * A.holesPer2500 * 3.14 * (A.holeDia / 2 / 1000) ** 2 * t / 1000 * rho;         // D41 (per 2500 mm, not scaled by length, as in the source)
  const rungsN = fitting ? roundHalfUp(A.rungsPer2500 * L / 2500) : A.rungsPer2500;                // J23 (the straight-tray sheet fixes this at 10 whatever the length)
  const rungW1 = (2 * A.rungHeight + A.rungWidth) / 1000 * W / 1000 * A.rungThk / 1000 * rho;       // J30
  const slotsW = (W / 40 * (A.slotLen / 1000 * A.slotWidth / 1000 * A.rungThk / 1000)) * rho * rungsN; // J43
  const couplerW = 2 * (fitting ? C.fittingNet : C.straightNet);                                    // D102
  const gross = fitting ? C.fittingGross : C.straightGross;
  const rungsW = rungW1 * rungsN;                                                                   // D100
  const steelW = runnerW - holesW + rungsW - slotsW + couplerW + P.hardware;                        // D104
  const rate = P.steelRate;
  const steel = (runnerW * rate - fr * holesW * rate) + (rungsW * rate - fr * slotsW * rate) + (gross - fr * C.holes) * rate * 2 + P.hardware * rate; // D105
  const zincW = P.zincPctOfSteel * steelW;                                                          // D107 (5% of steel weight)
  const zinc = zincW * P.zincRate;                                                                  // D108
  const labour = (steelW + zincW) * P.labourLadder;                                                 // D110
  return { L, steelW, zincW, steel, zinc, labour, rows: [
    ['Runners', [['Runner weight (kg)', runnerW, 'D98'], ['Savings from holes (kg)', holesW, 'D99']]],
    ['Rungs', [['Rungs in this piece', rungsN, 'J23'], ['Weight of 1 rung (kg)', rungW1, 'J30'], ['Rung weight (kg)', rungsW, 'D100'], ['Savings from slots (kg)', slotsW, 'D101']]],
    ['Fixings', [['Coupler plates, 2 nos (kg)', couplerW, 'D102'], ['Hardware, nut-bolt-washer (kg)', P.hardware, 'D103']]],
    ['Totals', [['Total steel weight (kg)', steelW, 'D104'], ['Zinc at 5% of steel weight (kg)', zincW, 'D107']]],
  ] };
}

function perfFamily(cfg, T) {
  const { params: P, coupler: C } = T;
  const A = T[cfg.kind];
  const { width: W, depth: Dp, thk: t } = cfg, L = cfg.length ?? 2500, rho = P.steelDensity, fr = A.scrapSalvage;
  const c = W >= 300 && Dp >= 100 ? 15 : 0;                                                         // O10
  const rows = Math.ceil(L / A.spacing - 1 - 1e-9);                                                  // O16 ROUNDUP
  const nPerf = A.perfPerRow * rows;                                                                // D42
  const trayW = (2 * c + 2 * Dp + (W + 4)) / 1000 * t / 1000 * L / 1000 * rho;                      // D36
  const perfW = nPerf * A.perfLen / 1000 * A.perfWid / 1000 * t / 1000 * rho;                       // D44
  const chW = A.couplerHoles * 3.14 * (A.couplerHoleDia / 2 / 1000) ** 2 * t / 1000 * L / 2500 * rho; // I45
  const hit = T.couplerTable.rows.find((r) => r[0] === W && r[1] === Dp);
  const couplerW = hit ? 2 * (hit[2] * hit[3]) / 1e6 * rho * C.thk / 1000 : 0;                       // D82 (0 when the size is not in the table)
  const saving = perfW + chW;                                                                       // D81
  const steelW = trayW - saving + couplerW + P.hardware;                                            // D84
  const gross = cfg.kind === 'trough' ? C.troughGross : C.straightGross;
  const steel = ((trayW + P.hardware) - saving * fr) * P.steelRate + 2 * (gross - C.holes * 0.3) * P.steelRate; // D85
  const area = 2 * (2 * c + 2 * Dp + (W + 4)) / 1000 * L / 1000
    + (2 * (A.perfLen + A.perfWid) / 1000 * t / 1000) * nPerf - A.perfLen / 1000 * A.perfWid / 1000 * nPerf; // O35
  const zincRaw = area * P.zincMicron * 1e-6 * P.zincDensity;                                       // O37
  const zincW = (1 + P.galvWaste) * zincRaw;                                                        // O39
  const zinc = zincW * P.zincRate - scrapCredit(P, zincRaw);                                        // D88
  const labour = (steelW + zincW) * (P.labourOther + P.margin);                                     // D90
  const warnings = hit ? [] : [`No coupler plate for ${W} × ${Dp} mm in the workbook's table, so its weight is taken as zero (as in the source).`];
  return { L, steelW, zincW, steel, zinc, labour, warnings, rows: [
    ['Tray body', [['Collar (mm)', c, 'O10'], ['Rows of perforations', rows, 'O16'], ['Perforations in length', nPerf, 'D42'], ['Tray weight (kg)', trayW, 'D36'], ['Savings from perforations (kg)', perfW, 'D44'], ['Savings from coupler holes (kg)', chW, 'I45']]],
    ['Fixings', [['Coupler plates, 2 nos (kg)', couplerW, 'D82'], ['Hardware (kg)', P.hardware, 'D83']]],
    ['Galvanising', [['Surface area (m²)', area, 'O35'], ['Zinc weight (kg)', zincW, 'O39'], ['Scrap credit, ash + dross (Rs)', scrapCredit(P, zincRaw), 'O44']]],
    ['Totals', [['Total steel weight (kg)', steelW, 'D84']]],
  ] };
}

function channelFamily(cfg, T) {
  const { params: P } = T, A = T.channel;
  const { width: W, depth: Dp, thk: t } = cfg, L = cfg.length ?? 1000, rho = P.steelDensity, fr = A.scrapSalvage;
  const dev = W + 2 * Dp + 2 * A.lip;                                                               // D28 developed width
  const steelRaw = dev * t * L / 1e9 * rho;                                                         // D36
  const n = Math.floor(L / A.pitch + 1e-9);                                                         // O15 ROUNDDOWN
  const slotsW = n * A.slotLen / 1000 * A.slotWidth / 1000 * t / 1000 * rho;                        // D44
  const area = 2 * dev / 1000 * L / 1000 + 2 * (A.slotLen + A.slotWidth) / 1000 * t / 1000 * n - 2 * A.slotLen / 1000 * A.slotWidth / 1000 * n; // O33
  const zincRaw = area * P.zincMicron * 1e-6 * P.zincDensity;
  const zincW = (1 + P.galvWaste) * zincRaw;
  const steelW = steelRaw - slotsW;                                                                 // D82
  const steel = (steelRaw - slotsW * fr) * P.steelRate;                                             // D83
  const zinc = zincW * P.zincRate - scrapCredit(P, zincRaw);                                        // D86
  const labour = (steelW + zincW) * (P.labourOther + P.margin);                                     // D88
  return { L, steelW, zincW, steel, zinc, labour, rows: [
    ['Section', [['Developed (strip) width (mm)', dev, 'D28'], ['Weight of steel (kg)', steelRaw, 'D36'], ['Slots in length', n, 'O15'], ['Savings from slots (kg)', slotsW, 'D44']]],
    ['Galvanising', [['Surface area (m²)', area, 'O33'], ['Zinc weight (kg)', zincW, 'O39'], ['Scrap credit, ash + dross (Rs)', scrapCredit(P, zincRaw), 'O44']]],
    ['Totals', [['Total steel weight (kg)', steelW, 'D82']]],
  ] };
}

export function computeTray(cfg, T) {
  const k = KINDS[cfg.kind];
  const m = k.family === 'ladder' ? ladderFamily(cfg, T) : k.family === 'channel' ? channelFamily(cfg, T) : perfFamily(cfg, T);
  const piece = m.labour + m.steel + m.zinc;
  const perM = piece / (m.L / 1000);
  return { cfg, kind: cfg.kind, meta: k, length: m.L, piece, perM, perKm: perM * 1000,
    weight: m.steelW + m.zincW, steelW: m.steelW, zincW: m.zincW,
    parts: { steel: m.steel, zinc: m.zinc, labour: m.labour }, rows: m.rows, warnings: m.warnings ?? [] };
}

// Rate quoted in the BoQ for each kind: Rs/km for straight trays, Rs/m for channel, Rs per piece otherwise
export const boqRate = (r) => (r.meta.straight ? r.perKm : r.meta.section && r.kind === 'channel' ? r.perM : r.piece);
