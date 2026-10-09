// Defaults for the cable-tray cost models (Cable_Trays_Nabinagar_BoQ_Cost_model_300926.xlsx).
// Values that the workbook pulls from external links are taken from the workbook's cached copies.
export const TRAY_DEFAULTS = {
  params: {
    steelRate: 73, steelDensity: 7850, zincMicron: 86, zincDensity: 7135, zincRate: 425.6, galvWaste: 0,
    ashPct: 0.12, drossPct: 0.08, ashSalvage: 0.26, drossSalvage: 0.52,
    labourLadder: 7.8,       // Rs/kg, ladder family (Labour, fabrication, overhead, profit margin)
    labourOther: 7.8, margin: 2.5, // other families use labour + profit/overhead = 10.3 Rs/kg
    hardware: 0.32, zincPctOfSteel: 0.05,
  },
  coupler: { straightNet: 0.2234895, fittingNet: 0.2070045, straightGross: 0.247275, fittingGross: 0.23079, troughGross: 0.082425, holes: 0.0237855, thk: 2 },
  ladder: { runners: 2, collar: 25, holesPer2500: 20, holeDia: 10, rungsPer2500: 10, rungWidth: 50, rungHeight: 20, rungThk: 2, slotLen: 25, slotWidth: 10, scrapSalvage: 0.5 },
  perf: { perfPerRow: 4, perfLen: 10, perfWid: 20, spacing: 40, couplerHoles: 16, couplerHoleDia: 10, scrapSalvage: 0.3 },
  trough: { perfPerRow: 2, perfLen: 10, perfWid: 20, spacing: 40, couplerHoles: 16, couplerHoleDia: 10, scrapSalvage: 0.3 },
  channel: { lip: 9, slotLen: 28, slotWidth: 13, pitch: 50, scrapSalvage: 0.3 },
  fittingLength: { hbend: 2360, vup: 1900, vdown: 1900, tee: 4200, cross: 5800 }, // mm, as entered in each workbook sheet
  couplerTable: { // (width, depth) -> plate length x height, mm  (workbook: Coupler plate dimensions)
    rows: [[600, 100, 70, 210], [450, 100, 70, 210], [300, 100, 70, 210], [600, 75, 70, 210], [450, 60, 75, 210], [300, 60, 75, 210], [300, 75, 45, 210],
      [450, 75, 45, 210], [150, 100, 70, 210], [150, 50, 70, 210], [150, 75, 45, 210], [100, 50, 25, 210], [50, 50, 25, 210], [50, 20, 25, 210], [50, 25, 25, 210], [75, 25, 25, 210]],
  },
};
