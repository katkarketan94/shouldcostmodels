// Port of the "LT Batch Calculator" sheet (columns AA..BH). Same formulas, same quirks.
// Units: lengths mm, densities g/cm³, weights g/m (= kg/km), prices Rs/kg, costs Rs/km.

export const ARMOURS = [
  { id: 'Unarmored', label: 'None', short: 'Unarmoured' },
  { id: 'Galvanised steel round wire', label: 'GS wire', short: 'GS round wire armoured' },
  { id: 'Galvanised steel flat strip', label: 'GS strip', short: 'GS flat strip armoured' },
  { id: 'Aluminium Round Wired', label: 'Al wire', short: 'Al round wire armoured' },
  { id: 'Aluminium Flat Strip', label: 'Al strip', short: 'Al flat strip armoured' },
];

// MATCH(v, lb, 1) then "next bracket up unless v sits exactly on a lower bound", capped at the last row
function bracket(lb, v) {
  let m = -1;
  for (let i = 0; i < lb.length; i++) if (lb[i] <= v) m = i;
  if (m < 0) return 0; // IFERROR fallback -> first row
  return lb[m] === v ? m : Math.min(m + 1, lb.length - 1);
}

const excelRound = (x, d) => { const f = 10 ** d; return Math.sign(x) * Math.round(Math.abs(x) * f + 1e-9) / f; };

export function computeCable(cfg, master, T) {
  const { cores: C, shape, size: E, conductor: F, insulation: G, inner: H, armour: I, outer: J } = cfg;
  const waste = 1 + T.wastage;
  const dens = (m) => master[m].density, price = (m) => master[m].price;
  const warnings = [];
  const r = { cfg };

  r.angle = shape === 'Sector shaped' ? 360 / C : 360;                         // AA
  r.condDia = Math.sqrt(E * (360 / r.angle) / Math.PI) * 2;                     // AB
  r.condDens = dens(F);                                                         // AC
  const iIdx = T.insul.area.indexOf(E);
  if (iIdx < 0) return { error: `Size ${E} sq mm is not in the IS insulation table`, cfg };
  r.insThk = (C === 1 && I === 'Unarmored' ? T.insul.oneCoreArmd : T.insul.multi)[iIdx]; // AD
  r.insDia = shape === 'Circular' ? r.condDia + 2 * r.insThk : r.condDia + 4 * r.insThk; // AE
  r.insDens = dens(G);                                                          // AF
  const nIdx = C === 3.5 ? T.neutral.phase.indexOf(E) : -1;
  r.neutArea = C === 3.5 && nIdx >= 0 ? T.neutral.neutral[nIdx] : 0;            // AG
  if (C === 3.5 && nIdx < 0) warnings.push(`No neutral size for ${E} sq mm in the IS table, so the neutral core is costed as zero (same as the workbook).`);
  r.neutDia = C === 3.5 ? Math.sqrt(r.neutArea / Math.PI) * 2 : 0;              // AH
  const nInsIdx = C === 3.5 ? T.insul.area.indexOf(r.neutArea) : -1;
  r.neutInsThk = nInsIdx >= 0 ? T.insul.multi[nInsIdx] : 0;                     // AI
  r.neutCoreDia = r.neutDia + 2 * r.neutInsThk;                                 // AJ
  const k = C === 1 ? r.insDia : C === 2 ? 2 * r.insDia : C === 3 ? 2.16 * r.insDia
    : C === 3.5 ? 2.42 * (3 * r.insDia + r.neutCoreDia) / 4 : C === 4 ? 2.42 * r.insDia : 0;
  r.laidUp = excelRound(k, 1);                                                  // AK
  r.innerThk = T.inner.thk[bracket(T.inner.lb, r.laidUp)];                      // AL
  r.innerDia = r.laidUp + 2 * r.innerThk;                                       // AM
  r.innerDens = dens(H);                                                        // AN
  const isStrip = I === 'Galvanised steel flat strip' || I === 'Aluminium Flat Strip';
  const aIdx = bracket(T.armour.lb, r.innerDia);
  r.armourThk = I === 'Unarmored' ? 0 : (isStrip ? T.armour.strip : T.armour.round)[aIdx]; // AO
  r.armourDia = r.innerDia + 2 * r.armourThk;                                   // AP
  const alArm = I === 'Aluminium Flat Strip' || I === 'Aluminium Round Wired';
  r.armourDens = I === 'Unarmored' ? 0 : alArm ? dens('Aluminium') : dens('Steel Wire'); // AQ
  r.outerThk = (I === 'Unarmored' ? T.outer.unarmd : T.outer.armd)[bracket(T.outer.lb, r.armourDia)]; // AR
  r.outerDia = r.armourDia + 2 * r.outerThk;                                    // AS
  r.outerDens = dens(J);                                                        // AT
  r.od = Math.trunc(r.outerDia + 1);                                            // AU

  const ann = (a, b, d) => Math.PI * (a * a - b * b) / 4 * d * waste;
  r.wCond = ((E * r.condDens * (C === 3.5 ? 3 : C)) + (r.neutArea * r.condDens * (C === 3.5 ? 1 : 0))) * waste; // AV
  r.wIns = (C === 3.5 ? Math.PI * (r.insDia ** 2 - r.condDia ** 2) / 4 * r.insDens * 3
      + Math.PI * (r.neutCoreDia ** 2 - r.neutDia ** 2) / 4 * r.insDens
    : Math.PI * (r.insDia ** 2 - r.condDia ** 2) / 4 * r.insDens * C) * waste;  // AW
  r.wInner = ann(r.innerDia, r.laidUp, r.innerDens);                            // AX
  r.wOuter = ann(r.outerDia, r.armourDia, r.outerDens);                         // AY
  r.wArmour = ann(r.armourDia, r.innerDia, r.armourDens);                       // AZ

  // Material cost, Rs/km. Quirk kept: sheaths are priced at the PVC rate whatever material is named.
  const pvc = price('PVC');
  r.cost = {
    conductor: r.wCond * price(F),
    insulation: G === 'XLPE' ? r.wIns * price('XLPE') : r.wIns * pvc,
    inner: r.wInner * pvc,
    outer: r.wOuter * pvc,
    armour: I === 'Unarmored' ? 0 : r.wArmour * (alArm ? price('Aluminium') : price('Steel Wire')),
  };
  r.mat = r.cost.conductor + r.cost.insulation + r.cost.inner + r.cost.outer + r.cost.armour; // BA
  r.specialPct = T.special.reduce((s, o) => s + (cfg.special?.[o.key] ? o.loading : 0), 0);   // BB
  r.weight = r.wCond + r.wIns + r.wInner + r.wOuter + r.wArmour;
  r.warnings = warnings;

  r.scen = {};
  for (const [id, cs] of [['s1', T.costStructure.s1], ['s2', T.costStructure.s2]]) {
    const p = (key) => cs[key][F === 'Aluminium' ? 'Aluminium' : 'Copper'];
    const load = (p('conversion') + p('transport') + p('drum') + p('overheads')) / p('material'); // BC / BD
    const total = r.mat * (1 + load);                                                              // BE / BF
    const afterSpecial = total * (1 + r.specialPct);
    const selling = afterSpecial * (1 + p('margin'));                                              // BG / BH
    const part = (key) => r.mat * p(key) / p('material');
    r.scen[id] = {
      load, total, selling,
      parts: {
        material: r.mat, conversion: part('conversion'), transport: part('transport'), drum: part('drum'),
        overheads: part('overheads'), special: total * r.specialPct, margin: afterSpecial * p('margin'),
      },
    };
  }
  r.low = Math.min(r.scen.s1.selling, r.scen.s2.selling);
  r.high = Math.max(r.scen.s1.selling, r.scen.s2.selling);
  return r;
}

export function configLabel(cfg) {
  const cu = cfg.conductor === 'Copper' ? 'Cu' : 'Al';
  const arm = ARMOURS.find((a) => a.id === cfg.armour);
  return `${cfg.cores}C × ${cfg.size} mm² ${cu} ${cfg.insulation}${cfg.armour === 'Unarmored' ? '' : ', ' + arm.label}`;
}
