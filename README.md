# Should-cost dashboards

`cable-dashboard.html` is the LT power, HT power and cable-tray dashboard. It is one self-contained file, so you can open it in any browser with no server and no internet.

Its maths is a line-for-line port of the `LT Batch Calculator` sheet in `data/Power_Cable_Batch_Cost_Model_LT_HT_v3.xlsx`.

| Command | What it does |
|---|---|
| `npm i && npm run build` | Rebuilds `cable-dashboard.html` from `src/` (three.js is bundled in) |
| `npm test` | Checks the LT and HT calculators against the workbook cached results |
| `python3 test/extract.py <xlsx>` | Regenerates `src/data.js` and `test/fixtures.json` after the workbook's tables change |

Edits to prices, cost structure and IS tables are stored in the browser (`localStorage`), and the reset button restores the workbook values.

The cable-tray model is ported from `data/Cable_Trays_Nabinagar_BoQ_Cost_model_300926.xlsx`. Regenerate its test fixtures with `python3 test/extract_tray.py <xlsx>`.

The busduct model is ported from `data/Busduct_Batch_Cost_Model_v7.xls`. It is an .xls, so convert it first (`soffice --headless --convert-to xlsx --outdir <dir> data/Busduct_Batch_Cost_Model_v7.xls`) and run `python3 test/extract_busduct.py <dir>/Busduct_Batch_Cost_Model_v7.xlsx` to regenerate `src/dataBusduct.js` and its test fixtures.

## Structural steel & PEB dashboard

`structural-dashboard.html` is a second, separate file: parametric structures (factory shed, pipe rack, façade framing, large-diameter pipe, custom takeoff) feed a steel takeoff, which feeds `data/Structural_Steel_Cost_Model_vTKM.xlsx`.

The workbook is not re-implemented. `src/structural/engine.js` evaluates the workbook's own formulas (`src/structural/workbook.json`, regenerated with `python3 test/extract_structural.py <xlsx>`), so edits to the model flow through. `npm test` checks that the engine reproduces all 966 formula results, that the input mapping reproduces the workbook base case, and a set of property checks. Member sizing for each structure is in `src/structural/takeoff.js`.
