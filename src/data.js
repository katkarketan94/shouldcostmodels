// Generated from the workbook by test/extract.py — do not edit by hand.
export const DEFAULTS = {
 "master": {
  "Copper": {
   "density": 8.94,
   "price": 1430
  },
  "Aluminium": {
   "density": 2.63,
   "price": 349
  },
  "XLPE": {
   "density": 0.93,
   "price": 135
  },
  "PVC": {
   "density": 1.35,
   "price": 100
  },
  "Steel Wire": {
   "density": 7.76,
   "price": 68
  }
 },
 "links": {
  "Copper": "https://liveindex.org/mcx-copper/",
  "Aluminium": "https://economictimes.indiatimes.com/commoditysummary/symbol-ALUMINIUM.cms",
  "XLPE": "https://www.plastemart.com/polymer-pricelist/hdpe-reliance-deem-export/2/41",
  "PVC": "https://plastemart.com/polymer-pricelist/pvc-reliance/7/9",
  "Steel Wire": "https://steel.gov.in/monthly-summery"
 },
 "costStructure": {
  "s1": {
   "material": {
    "Copper": 0.85,
    "Aluminium": 0.8
   },
   "conversion": {
    "Copper": 0.09,
    "Aluminium": 0.13
   },
   "transport": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "drum": {
    "Copper": 0.01,
    "Aluminium": 0.02
   },
   "overheads": {
    "Copper": 0.04,
    "Aluminium": 0.04
   },
   "margin": {
    "Copper": 0.04,
    "Aluminium": 0.04
   }
  },
  "s2": {
   "material": {
    "Copper": 0.9,
    "Aluminium": 0.85
   },
   "conversion": {
    "Copper": 0.05,
    "Aluminium": 0.1
   },
   "transport": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "drum": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "overheads": {
    "Copper": 0.03,
    "Aluminium": 0.03
   },
   "margin": {
    "Copper": 0.04,
    "Aluminium": 0.04
   }
  }
 },
 "wastage": 0.01,
 "special": [
  {
   "key": "frlsInner",
   "label": "FRLS PVC inner sheath",
   "short": "FRLS inner",
   "loading": 0.025
  },
  {
   "key": "frlsOuter",
   "label": "FRLS PVC outer sheath",
   "short": "FRLS outer",
   "loading": 0.025
  },
  {
   "key": "lszhInner",
   "label": "LSZH inner sheath",
   "short": "LSZH inner",
   "loading": 0.1
  },
  {
   "key": "lszhOuter",
   "label": "LSZH outer sheath",
   "short": "LSZH outer",
   "loading": 0.1
  },
  {
   "key": "oxygenIndex",
   "label": "Oxygen index (outer sheath)",
   "short": "Oxygen Index",
   "loading": 0.025
  },
  {
   "key": "hrpvcInner",
   "label": "HRPVC inner sheath",
   "short": "HRPVC inner",
   "loading": 0.02
  },
  {
   "key": "hrpvcOuter",
   "label": "HRPVC outer sheath",
   "short": "HRPVC outer",
   "loading": 0.02
  },
  {
   "key": "extrInner50",
   "label": "Extruded PVC inner sheath, up to 50 sq mm",
   "short": "Extr PVC inner \u226450",
   "loading": 0.03
  },
  {
   "key": "extrInner70",
   "label": "Extruded PVC inner sheath, 70 sq mm",
   "short": "Extr PVC inner 70",
   "loading": 0.025
  },
  {
   "key": "stranding",
   "label": "Stranding of conductor",
   "short": "Stranding of cond.",
   "loading": 0.015
  }
 ],
 "insul": {
  "area": [
   1.5,
   2.5,
   4,
   6,
   10,
   16,
   25,
   35,
   50,
   70,
   95,
   120,
   150,
   185,
   240,
   300,
   400,
   500,
   630,
   800,
   1000
  ],
  "oneCoreArmd": [
   1,
   1,
   1,
   1,
   1,
   1,
   1.2,
   1.2,
   1.3,
   1.4,
   1.4,
   1.5,
   1.7,
   1.9,
   2,
   2.1,
   2.4,
   2.6,
   2.8,
   3.1,
   3.3
  ],
  "multi": [
   0.7,
   0.7,
   0.7,
   0.7,
   0.7,
   0.7,
   0.9,
   0.9,
   1,
   1.1,
   1.1,
   1.2,
   1.4,
   1.6,
   1.7,
   1.8,
   2,
   2.2,
   2.4,
   2.6,
   2.8
  ]
 },
 "inner": {
  "lb": [
   0,
   25,
   35,
   45,
   55
  ],
  "thk": [
   0.3,
   0.4,
   0.5,
   0.6,
   0.7
  ]
 },
 "outer": {
  "lb": [
   0,
   15,
   25,
   35,
   40,
   45,
   50,
   55,
   60,
   65,
   70,
   75
  ],
  "unarmd": [
   1.8,
   2,
   2.2,
   2.4,
   2.6,
   2.8,
   3,
   3.2,
   3.4,
   3.6,
   3.8,
   4
  ],
  "armd": [
   1.24,
   1.4,
   1.56,
   1.72,
   1.88,
   2.04,
   2.2,
   2.36,
   2.52,
   2.68,
   2.84,
   3
  ]
 },
 "armour": {
  "lb": [
   0,
   13,
   25,
   40,
   55,
   70
  ],
  "strip": [
   0.8,
   0.8,
   0.8,
   1.4,
   1.4,
   1.4
  ],
  "round": [
   1.4,
   1.6,
   2,
   2.5,
   3.15,
   4
  ]
 },
 "neutral": {
  "phase": [
   25,
   35,
   50,
   70,
   95,
   120,
   150,
   185,
   240,
   300,
   400,
   500,
   630
  ],
  "neutral": [
   16,
   16,
   25,
   35,
   50,
   70,
   70,
   95,
   120,
   150,
   185,
   240,
   300
  ]
 }
};

// HT calculator defaults (same workbook)
export const DEFAULTS_HT = {
 "master": {
  "Copper": {
   "density": 8.94,
   "price": 1345
  },
  "Aluminium": {
   "density": 2.63,
   "price": 348
  },
  "XLPE": {
   "density": 0.93,
   "price": 118
  },
  "PVC": {
   "density": 1.35,
   "price": 101
  },
  "Steel Wire": {
   "density": 7.76,
   "price": 68
  }
 },
 "links": {
  "Copper": "https://liveindex.org/mcx-copper/",
  "Aluminium": "https://economictimes.indiatimes.com/commoditysummary/symbol-ALUMINIUM.cms",
  "XLPE": "https://www.plastemart.com/polymer-pricelist/hdpe-reliance-deem-export/2/41",
  "PVC": "https://plastemart.com/polymer-pricelist/pvc-reliance/7/9",
  "Steel Wire": "https://steel.gov.in/monthly-summery"
 },
 "costStructure": {
  "s1": {
   "material": {
    "Copper": 0.85,
    "Aluminium": 0.8
   },
   "conversion": {
    "Copper": 0.09,
    "Aluminium": 0.13
   },
   "transport": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "drum": {
    "Copper": 0.02,
    "Aluminium": 0.02
   },
   "overheads": {
    "Copper": 0.04,
    "Aluminium": 0.04
   },
   "margin": {
    "Copper": 0.04,
    "Aluminium": 0.04
   }
  },
  "s2": {
   "material": {
    "Copper": 0.9,
    "Aluminium": 0.85
   },
   "conversion": {
    "Copper": 0.05,
    "Aluminium": 0.1
   },
   "transport": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "drum": {
    "Copper": 0.01,
    "Aluminium": 0.01
   },
   "overheads": {
    "Copper": 0.03,
    "Aluminium": 0.03
   },
   "margin": {
    "Copper": 0.04,
    "Aluminium": 0.04
   }
  }
 },
 "wastage": 0.01,
 "wasteMetal": 0.02,
 "wasteSemi": 0.025,
 "special": [
  {
   "key": "frlsInner",
   "label": "FRLS PVC inner sheath",
   "short": "FRLS inner",
   "loading": 0.025
  },
  {
   "key": "frlsOuter",
   "label": "FRLS PVC outer sheath",
   "short": "FRLS outer",
   "loading": 0.025
  },
  {
   "key": "lszhInner",
   "label": "LSZH inner sheath",
   "short": "LSZH inner",
   "loading": 0.1
  },
  {
   "key": "lszhOuter",
   "label": "LSZH outer sheath",
   "short": "LSZH outer",
   "loading": 0.1
  },
  {
   "key": "oxygenIndex",
   "label": "Oxygen index (outer sheath)",
   "short": "Oxygen Index",
   "loading": 0.025
  },
  {
   "key": "extrInner",
   "label": "Extruded PVC inner sheath",
   "short": "Extr PVC inner",
   "loading": 0.03
  },
  {
   "key": "pressInner",
   "label": "Pressure extruded PVC inner sheath",
   "short": "Press extr PVC inner",
   "loading": 0.05
  }
 ],
 "screens": {
  "density": 0.936,
  "condThk": 0.3,
  "insThk": 0.3,
  "tapeThk": 0.06,
  "tapes": 2,
  "cuPremium": 1.15,
  "steelDensity": 7.86
 },
 "insulV": {
  "area": [
   25,
   35,
   50,
   70,
   95,
   120,
   150,
   185,
   300,
   400,
   500,
   630,
   800,
   1000
  ],
  "kv3_3": [
   2.5,
   2.5,
   2.5,
   2.5,
   2.5,
   2.5,
   2.5,
   2.5,
   2.5,
   2.6,
   2.8,
   3,
   3.3,
   3.5
  ],
  "kv6_6": [
   2.8,
   2.8,
   2.8,
   2.8,
   2.8,
   2.8,
   2.8,
   2.8,
   2.8,
   3.3,
   3.5,
   3.5,
   3.5,
   3.6
  ],
  "kv11e": [
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6,
   3.6
  ],
  "kv11u": [
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5,
   5.5
  ],
  "kv22": [
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6,
   6
  ],
  "kv33": [
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8,
   8.8
  ]
 },
 "inner": {
  "lb": [
   0,
   25,
   35,
   45,
   55
  ],
  "thk": [
   0.3,
   0.4,
   0.5,
   0.6,
   0.7
  ]
 },
 "armour": {
  "lb": [
   0,
   13,
   25,
   40,
   55,
   70
  ],
  "strip": [
   0.8,
   0.8,
   0.8,
   1.4,
   1.4,
   1.4
  ],
  "round": [
   1.4,
   1.6,
   2,
   2.5,
   3.15,
   4
  ]
 },
 "outer": {
  "lb": [
   0,
   15,
   25,
   35,
   40,
   45,
   50,
   55,
   60,
   70,
   75
  ],
  "thk": [
   1.24,
   1.4,
   1.56,
   1.72,
   1.88,
   2.04,
   2.2,
   2.36,
   2.52,
   2.84,
   3
  ]
 },
 "neutral": {
  "phase": [
   25,
   35,
   50,
   70,
   95,
   120,
   150,
   185,
   240,
   300,
   400,
   500,
   630
  ],
  "neutral": [
   16,
   16,
   25,
   35,
   50,
   70,
   70,
   95,
   120,
   150,
   185,
   240,
   300
  ]
 }
};
