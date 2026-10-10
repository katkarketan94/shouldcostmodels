"""Exports the metal piping workbook (formulas from the LibreOffice-converted .xlsx, cached values and constants from the original .xls) to src/piping/workbook.json.
usage: extract_piping.py <converted.xlsx> <original.xls>"""
import json, sys, re, openpyxl, xlrd
X, XLS = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(X); xb = xlrd.open_workbook(XLS)
KEEP = ['Summary'] + [n for n in wb.sheetnames if n.startswith('Cost Model_')] + ['Assumptions', 'Assumption backup', 'Pipe schedule', 'Data validation']
def cached(sh, r, c):
    try:
        t = sh.cell_type(r - 1, c - 1); v = sh.cell_value(r - 1, c - 1)
    except IndexError: return None
    if t in (0, 6): return None
    if t == 5: return '#' + xlrd.error_text_from_code.get(v, 'ERR')
    if t == 4: return bool(v)
    return v
out = {}
for n in KEEP:
    ws = wb[n]; sh = xb.sheet_by_name(n); cells = {}
    for row in ws.iter_rows():
        for c in row:
            val = c.value
            if val is None: continue
            val = getattr(val, 'text', val)
            if isinstance(val, str) and val.startswith('='):
                cells[c.coordinate] = {'f': val[1:].replace('_xlfn.', ''), 'c': cached(sh, c.row, c.column)}
            else:
                cv = cached(sh, c.row, c.column)
                cells[c.coordinate] = {'v': cv if cv is not None else val}
    out[n] = cells
json.dump(out, open('src/piping/workbook.json', 'w'), separators=(',', ':'))
print({k: len(v) for k, v in out.items()})
