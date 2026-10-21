# Compares the recalculated workbook (LibreOffice) with the dashboard results stored in presets.json, for every sample row and for the span solver.
import sys, json, openpyxl
from openpyxl.utils import get_column_letter as L
wb = openpyxl.load_workbook(sys.argv[1], data_only=True); d = json.load(open(sys.argv[2]))
ws = wb['Calc']; head = {ws.cell(4, c).value: c for c in range(2, 120) if ws.cell(4, c).value}
def col(name): return head[name]
bad = 0
def chk(label, got, exp, tol=1e-6):
    global bad
    ok = (got == exp) if isinstance(exp, (str, bool)) else abs(got - exp) <= max(tol, abs(exp) * 1e-6)
    if not ok: bad += 1; print('MISMATCH', label, got, exp)
for i, o in enumerate(d['rows']):
    r = 6 + i; e = o['expect']; kind = o['cfg']['kind']
    chk(f'{o["tag"]} A', ws.cell(r, col('Section area')).value, e['A']); chk(f'{o["tag"]} I', ws.cell(r, col('Second moment I')).value, e['I'], 1e-3)
    chk(f'{o["tag"]} SWL', ws.cell(r, col('SAFE WORKING LOAD')).value, e['swl'], 1e-4); chk(f'{o["tag"]} gov', ws.cell(r, col('Governing check')).value, e['gov'])
    chk(f'{o["tag"]} verdict', ws.cell(r, col('VERDICT')).value, 'PASS' if e['pass'] else 'FAIL')
    chk(f'{o["tag"]} bending', ws.cell(r, col('Bending utilisation')).value, e['util']['bending'], 1e-6); chk(f'{o["tag"]} defl', ws.cell(r, col('Deflection utilisation')).value, e['util']['deflection'], 1e-6)
    if 'rung' in e['util']: chk(f'{o["tag"]} rung', ws.cell(r, col('Rung utilisation')).value, e['util']['rung'], 1e-6)
    print(o['tag'].ljust(42), 'SWL', round(ws.cell(r, col('SAFE WORKING LOAD')).value, 2), 'expect', round(e['swl'], 2), ws.cell(r, col('VERDICT')).value)
# span solver for every row: set the Summary selector via recalculation is not possible here, so only row 1 (selector default) is read
sp = wb['Span curve']; summ = wb['Summary']
e = d['rows'][0]['expect']; got = sp['B7'].value
print('max span row 1:', got, 'dashboard', e['maxSpan'])
if abs(got - e['maxSpan']) > 0.03: bad += 1; print('MISMATCH span')
print('errors in Calc:', sum(1 for row in ws.iter_rows(min_row=6, max_row=25) for c in row if isinstance(c.value, str) and c.value.startswith('#')))
print('OK' if not bad else f'{bad} mismatches')
