// Port of the busduct workbook's Calculation sheet (one column per spec). Same formulas.
// Units: mm, kg/m, Rs/m.
export const VARIANTS = ['Air Insulated (AIB)', 'Sandwich/Compact', 'Fire Rated'];
export const POLES = ['3P+N+E', '4P+E'];

export function computeBusduct(cfg, T) {
  const { amp, poles, conductor, variant, enclosure, sc } = cfg;
  const warnings = [];
  const cd = T.currentDensity[`${conductor}|${variant}`];
  const tier = T.tiers.find((x) => x.amp === amp);
  const scm = T.scMult[String(sc)];
  if (cd == null || !tier || scm == null || T.neutral[poles] == null || !T.variants[variant]) return { error: 'This combination is not covered by the workbook tables', cfg };
  const r = { cfg };
  r.currentDensity = cd;                                                   // row 15
  r.phaseArea = amp / cd;                                                  // 16
  r.neutralRatio = T.neutral[poles];                                       // 17
  r.earthRatio = T.earthRatio;                                             // 18
  r.totalArea = r.phaseArea * (3 + r.neutralRatio + r.earthRatio);         // 19
  r.condDensity = T.density[conductor];                                    // 20
  r.condWeight = r.totalArea * r.condDensity / 1e6;                        // 21 kg/m
  r.width = tier.width; r.height = tier.height;                            // 22, 23
  r.perimeter = 2 * (r.width + r.height);                                  // 24
  r.baseThk = tier.thk; r.scMult = scm;                                    // 25, 26
  r.matFactor = enclosure === 'Aluminium' ? T.alThicknessFactor : 1;       // 27
  r.effThk = r.baseThk * r.scMult * r.matFactor;                           // 28
  r.encDensity = enclosure === 'GI Steel' ? T.density['GI Steel'] : T.density['Aluminium enclosure']; // 29
  r.encWeight = r.perimeter * r.effThk * r.encDensity / 1e6;               // 30 kg/m
  r.condRate = T.prices[conductor];                                        // 32
  const encRate = enclosure === 'GI Steel' ? T.prices['GI Steel'] : T.prices['Aluminium enclosure']; r.encRate = encRate; // 36
  const vp = T.variants[variant];
  const cost = {};
  cost.conductor = r.condWeight * r.condRate;                              // 33
  cost.insulation = cost.conductor * vp.insulation;                        // 35
  cost.enclosure = r.encWeight * encRate;                                  // 37
  cost.hardware = (cost.conductor + cost.enclosure) * T.hardwarePct;       // 39
  r.cost = cost;
  r.mat = cost.conductor + cost.insulation + cost.enclosure + cost.hardware; // 40
  const labour = r.mat * vp.labour;                                        // 43
  const machinery = r.mat * T.machineryPct;                                // 46
  const direct = r.mat + labour + machinery;                               // 48
  const utilities = direct * T.utilitiesPct;                               // 50
  const manuf = direct + utilities;                                        // 51
  const overheads = manuf * T.overheadsPct;                                // 53
  r.total = manuf + overheads;                                             // 54
  r.parts = { conductor: cost.conductor, insulation: cost.insulation, enclosure: cost.enclosure, hardware: cost.hardware, labour, machinery, utilities, overheads };
  r.labourPct = vp.labour; r.insulationPct = vp.insulation;
  r.low = r.total * (1 + T.marginLow);                                     // 55
  r.high = r.total * (1 + T.marginHigh);                                   // 56
  r.scen = { s1: { selling: r.high, margin: r.total * T.marginHigh, margPct: T.marginHigh }, s2: { selling: r.low, margin: r.total * T.marginLow, margPct: T.marginLow } };
  r.weight = r.condWeight + r.encWeight;
  r.warnings = warnings;
  return r;
}

export const specLabel = (c) => `${c.amp} A ${c.poles} ${c.conductor === 'Copper' ? 'Cu' : 'Al'} ${c.variant === 'Fire Rated' ? 'fire rated' : c.variant === 'Sandwich/Compact' ? 'sandwich' : 'AIB'} ${c.sc} kA`;
export const sameSpec = (a, b) => a.amp === b.amp && a.poles === b.poles && a.conductor === b.conductor && a.variant === b.variant && a.enclosure === b.enclosure && a.sc === b.sc;
