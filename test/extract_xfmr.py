"""Exports a transformer workbook (formulas from the converted .xlsx, cached values from the original .xls, data-validation lists) to src/xfmr/<name>.json.
usage: extract_xfmr.py <name> <converted.xlsx> <original.xls>"""
import json, sys, openpyxl, xlrd
NAME, X, XLS = sys.argv[1], sys.argv[2], sys.argv[3]
wb = openpyxl.load_workbook(X); xb = xlrd.open_workbook(XLS)
def cached(sh, r, c):
    try: t = sh.cell_type(r - 1, c - 1); v = sh.cell_value(r - 1, c - 1)
    except IndexError: return None
    if t in (0, 6): return None
    if t == 5: return '#' + xlrd.error_text_from_code.get(v, 'ERR')
    if t == 4: return bool(v)
    return v
out = {}; dv = {}
for ws in wb:
    sh = xb.sheet_by_name(ws.title); cells = {}
    for row in ws.iter_rows():
        for c in row:
            val = c.value
            if val is None: continue
            val = getattr(val, 'text', val)
            if isinstance(val, str) and val.startswith('='): cells[c.coordinate] = {'f': val[1:].replace('_xlfn.', ''), 'c': cached(sh, c.row, c.column)}
            else:
                cv = cached(sh, c.row, c.column); cells[c.coordinate] = {'v': cv if cv is not None else val}
    out[ws.title] = cells
    lists = [{'sqref': str(d.sqref), 'list': d.formula1} for d in ws.data_validations.dataValidation if d.type == 'list']
    if lists: dv[ws.title] = lists
out['_dv'] = dv
json.dump(out, open(f'src/xfmr/{NAME}.json', 'w'), separators=(',', ':'))
print(NAME, {k: len(v) for k, v in out.items() if k != '_dv'}, {k: len(v) for k, v in dv.items()})
