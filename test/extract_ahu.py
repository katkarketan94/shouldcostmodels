"""Exports the AHU/FCU cost workbook (cells, formulas and cached values) to src/ahu/workbook.json."""
import json, sys, openpyxl, datetime
X = sys.argv[1]
wb = openpyxl.load_workbook(X); wv = openpyxl.load_workbook(X, data_only=True)
out = {}
for ws in wb:
    if ws.title.startswith('>>'): continue
    cells = {}
    v = wv[ws.title]
    for row in ws.iter_rows():
        for c in row:
            val = c.value
            if val is None: continue
            cached = v[c.coordinate].value
            if isinstance(cached, (datetime.datetime, datetime.date)): cached = str(cached)
            if isinstance(val, str) and val.startswith('='):
                cells[c.coordinate] = {'f': val[1:].replace('_xlfn.', ''), 'c': cached}
            else:
                cells[c.coordinate] = {'v': val}
    out[ws.title] = cells
json.dump(out, open('src/ahu/workbook.json', 'w'), separators=(',', ':'))
print({k: len(v) for k, v in out.items()})
