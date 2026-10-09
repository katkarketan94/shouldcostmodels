# Should-cost dashboards

`cable-dashboard.html` is the LT power cable dashboard. It is one self-contained file, so you can open it in any browser with no server and no internet.

Its maths is a line-for-line port of the `LT Batch Calculator` sheet in `data/Power_Cable_Batch_Cost_Model_LT_HT_v3.xlsx`.

| Command | What it does |
|---|---|
| `npm i && npm run build` | Rebuilds `cable-dashboard.html` from `src/` (three.js is bundled in) |
| `npm test` | Checks `src/calc.js` against the workbook's cached results for every LT row |
| `python3 test/extract.py <xlsx>` | Regenerates `src/data.js` and `test/fixtures.json` after the workbook's tables change |

Edits to prices, cost structure and IS tables are stored in the browser (`localStorage`), and the reset button restores the workbook values.
