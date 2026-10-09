// Port of the "HT Batch Calculator" sheet (columns AB..BM). Same formulas, same quirks.
// Units: mm, g/cm³, weights g/m (= kg/km), prices Rs/kg, costs Rs/km.

export const VOLTAGES = ['3.3kV', '6.6kV', '11kV', '22kV', '33kV'];

// MATCH(v, lb, 1): index of the largest lower bound <= v, or -1 (#N/A)
const floorIdx = (lb, v) => { let m = -1; for (let i = 0; i < lb.length; i++) if (lb[i] <= v) m = i; return m; };
const excelRound = (x, d) => { const f = 10 ** d; return Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9) / f; };

export function computeHT(cfg, master, T) {
  const { cores: C, shape, size: E, conductor: F, voltage: V, insulation: H, inner: I, armour: J, outer: K } = cfg;
  const waste = 1 + T.wastage, wm = 1 + T.wasteMetal, ws = 1 + T.wasteSemi, sc = T.screens;
  const dens = (m) => master[m].density, price = (m) => master[m].price;
  const r = { cfg, ht: true, warnings: [] };

  r.angle = shape === 'Sector shaped' ? 360 / C : 360;                           // AB
  r.angle2 = shape === 'Sector shaped' ? 360 - r.angle * 3 : 0;                    // AC
  r.condDia = Math.sqrt(E * (360 / r.angle) / Math.PI) * 2;                        // AD
  r.condDens = dens(F);                                                            // AE
  const col = (neutral) => (V === '33kV' ? 'kv33' : V === '22kV' ? 'kv22' : V === '11kV' ? (neutral ? 'kv11e' : 'kv11u') : V === '6.6kV' ? 'kv6_6' : 'kv3_3');
  const thkFor = (area, neutral) => { const i = floorIdx(T.insulV.area, area); return i < 0 ? null : T.insulV[col(neutral)][i]; };
  r.insThk = thkFor(E, false) ?? T.insulV.kv3_3[0];                                // AF (falls back to first 3.3 kV row)
  r.insDia = shape === 'Circular' ? r.condDia + 2 * r.insThk : r.condDia + 4 * r.insThk; // AG
  r.insDens = dens(H);                                                             // AH
  const nIdx = C === 3.5 ? T.neutral.phase.indexOf(E) : -1;
  r.neutArea = C === 3.5 && nIdx >= 0 ? T.neutral.neutral[nIdx] : 0;               // AI
  if (C === 3.5 && nIdx < 0) r.warnings.push(`No neutral size for ${E} sq mm in the IS table, so the neutral core is costed as zero (same as the workbook).`);
  r.neutDia = C === 3.5 ? Math.sqrt(r.neutArea / Math.PI) * 2 : 0;                 // AJ
  r.neutInsThk = C === 3.5 ? (thkFor(r.neutArea, true) ?? 0) : 0;                  // AK
  r.neutCoreDia = r.neutDia + 2 * r.neutInsThk;                                    // AL
  const k = C === 1 ? r.insDia : C === 2 ? 2 * r.insDia : C === 3 ? 2.16 * r.insDia
    : C === 3.5 ? 2.42 * (3 * r.insDia + r.neutCoreDia) / 4 : C === 4 ? 2.42 * r.insDia : 0;
  r.laidUp = excelRound(k, 1);                                                     // AM
  r.innerThk = T.inner.thk[Math.max(0, floorIdx(T.inner.lb, r.laidUp))];           // AN
  r.innerDia = r.laidUp + 2 * r.innerThk;                                          // AO
  r.innerDens = dens(I);                                                           // AP
  const isStrip = J === 'Galvanised steel flat strip' || J === 'Aluminium Flat Strip';
  const alArm = J === 'Aluminium Flat Strip' || J === 'Aluminium Round Wired';
  const aIdx = Math.max(0, floorIdx(T.armour.lb, r.innerDia));
  r.armourThk = J === 'Unarmored' ? 0 : (isStrip ? T.armour.strip : T.armour.round)[aIdx]; // AQ
  r.armourDia = r.innerDia + 2 * r.armourThk;                                      // AR
  r.armourDens = J === 'Unarmored' ? 0 : alArm ? dens('Aluminium') : sc.steelDensity; // AS (steel density is fixed in the source)
  r.outerThk = T.outer.thk[Math.max(0, floorIdx(T.outer.lb, r.armourDia))];        // AT
  r.outerDia = r.armourDia + 2 * r.outerThk;                                       // AU
  r.outerDens = dens(K);                                                           // AV
  r.od = Math.trunc(r.outerDia + 1);                                               // AW

  const sq = (a, b) => Math.PI * (a * a - b * b) / 4;
  r.condScrRaw = sq(r.condDia + 2 * sc.condThk, r.condDia) * sc.density;           // AX
  r.insScrRaw = sq(r.insDia + 2 * sc.insThk, r.insDia) * sc.density;               // AY
  r.metalRaw = (r.outerDia - sc.tapeThk) * Math.PI * (sc.tapeThk * sc.tapes) * dens('Copper'); // AZ (sized on the outer dia, as in the source)
  r.wCond = ((E * r.condDens * (C === 3.5 ? 3 : C)) + (r.neutArea * r.condDens * (C === 3.5 ? 1 : 0))) * waste; // BA
  r.wIns = (C === 3.5 ? (r.angle / 360) * sq(r.insDia, r.condDia) * r.insDens * 3 + (r.angle2 / 360) * sq(r.neutCoreDia, r.neutDia) * r.insDens
    : (r.angle / 360) * sq(r.insDia, r.condDia) * r.insDens * C) * waste;          // BB
  r.wInner = sq(r.innerDia, r.laidUp) * r.innerDens * waste;                        // BC
  r.wOuter = sq(r.od, r.outerDia) * r.outerDens * waste;                            // BD (between rounded-up OD and outer dia, as in the source)
  r.wArmour = sq(r.armourDia, r.innerDia) * r.armourDens * waste;                   // BE
  r.wCondScr = r.condScrRaw * ws; r.wInsScr = r.insScrRaw * ws; r.wMetal = r.metalRaw * wm; // Y, Z, X
  r.copperWeight = (F === 'Copper' ? r.wCond : 0) + r.wMetal;                       // W

  const pvc = price('PVC');
  r.cost = {
    conductor: r.wCond * price(F),
    insulation: H === 'XLPE' ? r.wIns * price('XLPE') : r.wIns * pvc,
    inner: r.wInner * pvc, outer: r.wOuter * pvc,
    armour: J === 'Unarmored' ? 0 : r.wArmour * (alArm ? price('Aluminium') : price('Steel Wire')),
    condScreen: r.wCondScr * price('XLPE'), insScreen: r.wInsScr * price('XLPE'),
    metalScreen: r.wMetal * price('Copper') * sc.cuPremium,
  };
  r.mat = Object.values(r.cost).reduce((a, b) => a + b, 0);                          // BF
  r.specialPct = T.special.reduce((s, o) => s + (cfg.special?.[o.key] ? o.loading : 0), 0); // BG
  r.weight = r.wCond + r.wIns + r.wInner + r.wOuter + r.wArmour + r.wCondScr + r.wInsScr + r.wMetal;

  r.scen = {};
  for (const [id, cs] of [['s1', T.costStructure.s1], ['s2', T.costStructure.s2]]) {
    const p = (key) => cs[key][F === 'Aluminium' ? 'Aluminium' : 'Copper'];
    const load = (p('conversion') + p('transport') + p('drum') + p('overheads')) / p('material');
    const total = r.mat * (1 + load), afterSpecial = total * (1 + r.specialPct);
    // Source quirk: the final mark-up is the OVERHEADS % (row 31), not the Margin % field.
    const selling = afterSpecial * (1 + p('overheads'));
    const part = (key) => r.mat * p(key) / p('material');
    r.scen[id] = { load, total, selling, parts: { material: r.mat, conversion: part('conversion'), transport: part('transport'), drum: part('drum'),
      overheads: part('overheads'), special: total * r.specialPct, margin: afterSpecial * p('overheads') } };
  }
  r.low = Math.min(r.scen.s1.selling, r.scen.s2.selling);
  r.high = Math.max(r.scen.s1.selling, r.scen.s2.selling);
  return r;
}
