"""Regenerates src/dataBusduct.js and test/fixtures_busduct.json from the busduct workbook.
The workbook is .xls: convert first with  soffice --headless --convert-to xlsx --outdir <dir> data/Busduct_Batch_Cost_Model_v7.xls"""
import json, sys, openpyxl
X = sys.argv[1]
wb = openpyxl.load_workbook(X); wv = openpyxl.load_workbook(X, data_only=True)
I, Iv, O, Ov = wb['Input'], wv['Input'], wb['Output'], wv['Output']
g = lambda c: I[c].value
d = {
 'prices': {'Copper': g('D7'), 'Aluminium': g('D8'), 'GI Steel': g('D9'), 'Aluminium enclosure': g('D10')},
 'density': {'Copper': g('D14'), 'Aluminium': g('D15'), 'GI Steel': g('D16'), 'Aluminium enclosure': g('D17')},
 'alThicknessFactor': g('D18'), 'earthRatio': g('D19'),
 'hardwarePct': g('D23'), 'machineryPct': g('D24'), 'utilitiesPct': g('D25'), 'overheadsPct': g('D26'),
 'marginLow': g('D27'), 'marginHigh': g('D28'),
 'currentDensity': {f"{I[f'C{r}'].value}|{I[f'D{r}'].value}": I[f'E{r}'].value for r in range(34, 40)},
 'variants': {I[f'B{r}'].value: {'insulation': I[f'C{r}'].value, 'labour': I[f'D{r}'].value} for r in range(43, 46)},
 'neutral': {I[f'B{r}'].value: I[f'C{r}'].value for r in (49, 50)},
 'tiers': [{'amp': I[f'B{r}'].value, 'width': I[f'C{r}'].value, 'height': I[f'D{r}'].value, 'thk': I[f'E{r}'].value} for r in range(54, 64)],
 'scMult': {str(I[f'B{r}'].value): I[f'C{r}'].value for r in (67, 68, 69)},
}
specs = []
bench = {}
for r in range(8, 49):
    sid = O[f'B{r}'].value
    if not sid or O[f'C{r}'].value is None: continue
    bench[sid] = {'qty': Ov[f'O{r}'].value or 0, 'value': Ov[f'P{r}'].value or 0, 'comment': O[f'T{r}'].value}
for r in range(73, 110):
    specs.append({'id': I[f'C{r}'].value, 'desc': I[f'B{r}'].value, 'amp': I[f'D{r}'].value, 'poles': I[f'E{r}'].value, 'conductor': I[f'F{r}'].value,
                  'variant': I[f'G{r}'].value, 'enclosure': I[f'H{r}'].value, 'sc': I[f'I{r}'].value, 'group': I[f'J{r}'].value})
d['specs'] = specs; d['bench'] = bench
open('src/dataBusduct.js', 'w').write('// Generated from the busduct workbook by test/extract_busduct.py — do not edit by hand.\nexport const BUSDUCT_DEFAULTS = ' + json.dumps(d, indent=1) + ';\n')
fx = []
for r in range(8, 49):
    sid = Ov[f'B{r}'].value
    if not sid or Ov[f'F{r}'].value is None: continue
    s = next(x for x in specs if x['id'] == sid)
    fx.append({'spec': s, 'expect': {'mat': Ov[f'F{r}'].value, 'labour': Ov[f'G{r}'].value, 'machinery': Ov[f'H{r}'].value, 'utilities': Ov[f'I{r}'].value,
               'overheads': Ov[f'J{r}'].value, 'total': Ov[f'K{r}'].value, 'low': Ov[f'L{r}'].value, 'high': Ov[f'M{r}'].value,
               'actual': Ov[f'Q{r}'].value, 'variance': Ov[f'R{r}'].value}})
json.dump(fx, open('test/fixtures_busduct.json', 'w'), indent=1)
print(len(specs), 'specs;', len(fx), 'fixtures;', len(bench), 'benchmarks')
