// Generated from the busduct workbook by test/extract_busduct.py — do not edit by hand.
export const BUSDUCT_DEFAULTS = {
 "prices": {
  "Copper": 1400,
  "Aluminium": 349,
  "GI Steel": 68,
  "Aluminium enclosure": 360
 },
 "density": {
  "Copper": 8960,
  "Aluminium": 2700,
  "GI Steel": 7850,
  "Aluminium enclosure": 2700
 },
 "alThicknessFactor": 1.4,
 "earthRatio": 0.5,
 "hardwarePct": 0.08,
 "machineryPct": 0,
 "utilitiesPct": 0,
 "overheadsPct": 0.05,
 "marginLow": 0.05,
 "marginHigh": 0.08,
 "currentDensity": {
  "Copper|Air Insulated (AIB)": 1.5,
  "Copper|Sandwich/Compact": 1.45,
  "Copper|Fire Rated": 1.05,
  "Aluminium|Air Insulated (AIB)": 0.95,
  "Aluminium|Sandwich/Compact": 0.78,
  "Aluminium|Fire Rated": 0.68
 },
 "variants": {
  "Air Insulated (AIB)": {
   "insulation": 0,
   "labour": 0.15
  },
  "Sandwich/Compact": {
   "insulation": 0.12,
   "labour": 0.1
  },
  "Fire Rated": {
   "insulation": 0.35,
   "labour": 0.25
  }
 },
 "neutral": {
  "3P+N+E": 0.5,
  "4P+E": 1
 },
 "tiers": [
  {
   "amp": 800,
   "width": 200,
   "height": 150,
   "thk": 1.6
  },
  {
   "amp": 1000,
   "width": 220,
   "height": 160,
   "thk": 1.6
  },
  {
   "amp": 1250,
   "width": 250,
   "height": 170,
   "thk": 1.6
  },
  {
   "amp": 1600,
   "width": 280,
   "height": 190,
   "thk": 2
  },
  {
   "amp": 2000,
   "width": 320,
   "height": 210,
   "thk": 2
  },
  {
   "amp": 2500,
   "width": 360,
   "height": 230,
   "thk": 2
  },
  {
   "amp": 3200,
   "width": 400,
   "height": 260,
   "thk": 2.5
  },
  {
   "amp": 4000,
   "width": 450,
   "height": 290,
   "thk": 2.5
  },
  {
   "amp": 5000,
   "width": 500,
   "height": 320,
   "thk": 3
  },
  {
   "amp": 6300,
   "width": 560,
   "height": 360,
   "thk": 3
  }
 ],
 "scMult": {
  "50": 1,
  "65": 1.15,
  "80": 1.3
 },
 "specs": [
  {
   "id": "SW-AL-0800",
   "desc": "Sandwich-Al-800A 4P 65kA",
   "amp": 800,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-1000",
   "desc": "Sandwich-Al-1000A 4P 65kA",
   "amp": 1000,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-1250",
   "desc": "Sandwich-Al-1250A 4P 65kA",
   "amp": 1250,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-1600",
   "desc": "Sandwich-Al-1600A 4P 65kA",
   "amp": 1600,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-2000",
   "desc": "Sandwich-Al-2000A 4P 65kA",
   "amp": 2000,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-2500",
   "desc": "Sandwich-Al-2500A 4P 65kA",
   "amp": 2500,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-3200",
   "desc": "Sandwich-Al-3200A 4P 65kA",
   "amp": 3200,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-4000",
   "desc": "Sandwich-Al-4000A 4P 65kA",
   "amp": 4000,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "SW-AL-5000",
   "desc": "Sandwich-Al-5000A 4P 65kA",
   "amp": 5000,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Aluminium"
  },
  {
   "id": "AIB-AL-0800",
   "desc": "AIB-Al-800A 3P+N+E 50kA",
   "amp": 800,
   "poles": "3P+N+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB-AL-1250",
   "desc": "AIB-Al-1250A 3P+N+E 50kA",
   "amp": 1250,
   "poles": "3P+N+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB-AL-2000",
   "desc": "AIB-Al-2000A 3P+N+E 50kA",
   "amp": 2000,
   "poles": "3P+N+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB4-AL-0800",
   "desc": "AIB-Al-800A 4P 50kA",
   "amp": 800,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB4-AL-1600",
   "desc": "AIB-Al-1600A 4P 65kA",
   "amp": 1600,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB4-AL-2000",
   "desc": "AIB-Al-2000A 4P 65kA",
   "amp": 2000,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "AIB - Aluminium"
  },
  {
   "id": "AIB4-AL-6300",
   "desc": "AIB-Al-6300A 4P 80kA",
   "amp": 6300,
   "poles": "4P+E",
   "conductor": "Aluminium",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 80,
   "group": "AIB - Aluminium"
  },
  {
   "id": "SW-CU-0800",
   "desc": "Sandwich-Cu-800A 3P+N+E 50kA",
   "amp": 800,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-1000",
   "desc": "Sandwich-Cu-1000A 3P+N+E 50kA",
   "amp": 1000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-1250",
   "desc": "Sandwich-Cu-1250A 3P+N+E 50kA",
   "amp": 1250,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-1600",
   "desc": "Sandwich-Cu-1600A 3P+N+E 50kA",
   "amp": 1600,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-2000",
   "desc": "Sandwich-Cu-2000A 3P+N+E 50kA",
   "amp": 2000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-2500",
   "desc": "Sandwich-Cu-2500A 3P+N+E 50kA",
   "amp": 2500,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-3200",
   "desc": "Sandwich-Cu-3200A 3P+N+E 50kA",
   "amp": 3200,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-4000",
   "desc": "Sandwich-Cu-4000A 3P+N+E 50kA",
   "amp": 4000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Sandwich - Copper"
  },
  {
   "id": "SW-CU-4000-65",
   "desc": "Sandwich-Cu-4000A 3P+N+E 65kA",
   "amp": 4000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Sandwich/Compact",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Sandwich - Copper"
  },
  {
   "id": "AIB-CU-0800",
   "desc": "AIB-Cu-800A 3P+N+E 50kA",
   "amp": 800,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-1000",
   "desc": "AIB-Cu-1000A 3P+N+E 50kA",
   "amp": 1000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-1250",
   "desc": "AIB-Cu-1250A 3P+N+E 50kA",
   "amp": 1250,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-1600",
   "desc": "AIB-Cu-1600A 3P+N+E 50kA",
   "amp": 1600,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-2000",
   "desc": "AIB-Cu-2000A 3P+N+E 50kA",
   "amp": 2000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-2500",
   "desc": "AIB-Cu-2500A 3P+N+E 50kA",
   "amp": 2500,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-3200",
   "desc": "AIB-Cu-3200A 3P+N+E 50kA",
   "amp": 3200,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "AIB-CU-4000",
   "desc": "AIB-Cu-4000A 3P+N+E 50kA",
   "amp": 4000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Air Insulated (AIB)",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "AIB - Copper"
  },
  {
   "id": "FR-CU-0800",
   "desc": "FireRated-Cu-800A 3P+N+E 50kA",
   "amp": 800,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Fire Rated",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Fire Rated - Copper"
  },
  {
   "id": "FR-CU-1600",
   "desc": "FireRated-Cu-1600A 3P+N+E 50kA",
   "amp": 1600,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Fire Rated",
   "enclosure": "GI Steel",
   "sc": 50,
   "group": "Fire Rated - Copper"
  },
  {
   "id": "FR-CU-2500",
   "desc": "FireRated-Cu-2500A 3P+N+E 65kA",
   "amp": 2500,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Fire Rated",
   "enclosure": "GI Steel",
   "sc": 65,
   "group": "Fire Rated - Copper"
  },
  {
   "id": "FR-CU-4000",
   "desc": "FireRated-Cu-4000A 3P+N+E 80kA",
   "amp": 4000,
   "poles": "3P+N+E",
   "conductor": "Copper",
   "variant": "Fire Rated",
   "enclosure": "GI Steel",
   "sc": 80,
   "group": "Fire Rated - Copper"
  }
 ],
 "bench": {
  "SW-AL-0800": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-AL-1000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-AL-1250": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-AL-1600": {
   "qty": 230.6,
   "value": 3259130,
   "comment": "Within tolerance. Compared at the PO text specification (1600A, 4P, 65kA, IP55 indoor, sandwich). The PO does not state the conductor material; Aluminium is assumed (a copper model would be roughly 5x the FY26 price)."
  },
  "SW-AL-2000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-AL-2500": {
   "qty": 603,
   "value": 13536959,
   "comment": "Within tolerance. Includes 264 m (net) booked under short text \"BUS,TRKNG,CANOPY,LV,800A\" whose long text reads 2500A 4P 65kA straight length at the identical 2500A rate; mapped to 2500A. Conductor assumed Aluminium (not stated in PO)."
  },
  "SW-AL-3200": {
   "qty": 1647.1,
   "value": 48636574,
   "comment": "Within tolerance. Includes 876 m (net) booked under short text \"...1000A 4P,40KA\" whose long text reads 3200A 4P 65kA at the identical 3200A rate; mapped to 3200A. Three identical 216 m postings on 16-03-2026 should be checked for duplicate GRNs. Conductor assumed Aluminium (not stated in PO). See Note 3 for the Scenario 2 sensitivity."
  },
  "SW-AL-4000": {
   "qty": 131.7,
   "value": 4758471,
   "comment": "Within tolerance. Conductor assumed Aluminium (not stated in PO)."
  },
  "SW-AL-5000": {
   "qty": 8.8,
   "value": 330297,
   "comment": "OUTSIDE \u00b15% \u2014 modelled price is HIGHER than FY26. Potential reasons (none used to adjust the model): vendor price for the top rating is almost flat vs 4000A (+3.9% for +25% current), suggesting a capped / schedule rate; possible different conductor design at 5000A; model enclosure tier for 5000A is an extrapolation. Only 8.8 m bought. See Section B / C."
  },
  "AIB-AL-0800": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-AL-1250": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-AL-2000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB4-AL-0800": {
   "qty": 257.987,
   "value": 6073272,
   "comment": "OUTSIDE \u00b15% \u2014 modelled price is far LOWER than FY26. Potential reasons (none used to adjust the model): PO describes \"Straight Runs with rainhood covers & their fixing accessories\", a heavier / outdoor-style product than the model's generic AIB spec; vendor-specific pricing (this vendor's 2000A is dearer than another vendor's 4000A in the same FY26 data); large fixed cost per metre. 35 kA rating compared at the 50 kA tier. See Section B / C."
  },
  "AIB4-AL-1600": {
   "qty": 193.344,
   "value": 5645645,
   "comment": "OUTSIDE \u00b15% \u2014 modelled price is far LOWER than FY26. Potential reasons (none used to adjust the model): rainhood covers & fixing accessories inside the metre rate; vendor-specific pricing; booked on a different material code (2300296277) from the other ratings, and its per-amp price is below the 2000A line, indicating a negotiated rate. See Section B / C."
  },
  "AIB4-AL-2000": {
   "qty": 896.873,
   "value": 33921531,
   "comment": "OUTSIDE \u00b15% \u2014 modelled price is far LOWER than FY26. Potential reasons (none used to adjust the model): rainhood covers & fixing accessories inside the metre rate; vendor / design pricing not captured by a generic cost build-up. See Section B / C."
  },
  "AIB4-AL-6300": {
   "qty": 194.682,
   "value": 17067771,
   "comment": "OUTSIDE \u00b15% \u2014 modelled price is LOWER than FY26. Potential reasons (none used to adjust the model): rainhood covers & fixing accessories inside the metre rate; heavier design at 6300A / 80kA than the model scales; 6300A enclosure tier is an extrapolation; vendor-specific pricing. See Section B / C."
  },
  "SW-CU-0800": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-1000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-1250": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-1600": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-2000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-2500": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-3200": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-4000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "SW-CU-4000-65": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-0800": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-1000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-1250": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-1600": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-2000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-2500": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-3200": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "AIB-CU-4000": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "FR-CU-0800": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "FR-CU-1600": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "FR-CU-2500": {
   "qty": 0,
   "value": 0,
   "comment": null
  },
  "FR-CU-4000": {
   "qty": 0,
   "value": 0,
   "comment": null
  }
 }
};
