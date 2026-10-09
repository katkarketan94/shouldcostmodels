"""Regenerates src/data.js and test/fixtures.json from the Excel workbook (LT sheet only)."""
import json, sys, openpyxl
X = sys.argv[1]
wb = openpyxl.load_workbook(X)            # formulas
wv = openpyxl.load_workbook(X, data_only=True)  # cached values
A, L, LV = wb['Assumptions & Ref'], wb['LT Batch Calculator'], wv['LT Batch Calculator']
col = lambda ws, c, r0, r1: [ws[f'{c}{r}'].value for r in range(r0, r1 + 1)]
row = lambda ws, r, cs: [ws[f'{c}{r}'].value for c in cs]

mats = ['Copper', 'Aluminium', 'XLPE', 'PVC', 'Steel Wire']
master = {m: {'density': L[f'{c}5'].value, 'price': L[f'{c}6'].value} for m, c in zip(mats, 'CDEFG')}
links = {m: L[f'{c}3'].value for m, c in zip(mats, 'CDEFG') if L[f'{c}3'].value}
cs = lambda r: {'Copper': A[f'C{r}'].value, 'Aluminium': A[f'D{r}'].value}
cs2 = lambda r: {'Copper': A[f'E{r}'].value, 'Aluminium': A[f'F{r}'].value}
keys = ['material', 'conversion', 'transport', 'drum', 'overheads', 'margin']
cost = {'s1': {k: cs(16 + i) for i, k in enumerate(keys)}, 's2': {k: cs2(16 + i) for i, k in enumerate(keys)}}
opts = [('frlsInner', 'FRLS PVC inner sheath'), ('frlsOuter', 'FRLS PVC outer sheath'), ('lszhInner', 'LSZH inner sheath'),
        ('lszhOuter', 'LSZH outer sheath'), ('oxygenIndex', 'Oxygen index (outer sheath)'), ('hrpvcInner', 'HRPVC inner sheath'),
        ('hrpvcOuter', 'HRPVC outer sheath'), ('extrInner50', 'Extruded PVC inner sheath, up to 50 sq mm'),
        ('extrInner70', 'Extruded PVC inner sheath, 70 sq mm'), ('stranding', 'Stranding of conductor')]
special = [{'key': k, 'label': l, 'short': L[f'{c}8'].value.replace('\n', ' '), 'loading': A[f'C{40+i}'].value}
           for i, ((k, l), c) in enumerate(zip(opts, 'KLMNOPQRST'))]
data = {
  'master': master, 'links': links, 'costStructure': cost, 'wastage': A['C22'].value, 'special': special,
  'insul': {'area': col(A,'B',70,90), 'oneCoreArmd': col(A,'C',70,90), 'multi': col(A,'D',70,90)},
  'inner': {'lb': col(A,'F',70,74), 'thk': col(A,'G',70,74)},
  'outer': {'lb': col(A,'I',70,81), 'unarmd': col(A,'J',70,81), 'armd': col(A,'K',70,81)},
  'armour': {'lb': col(A,'B',93,98), 'strip': col(A,'C',93,98), 'round': col(A,'D',93,98)},
  'neutral': {'phase': col(A,'F',93,105), 'neutral': col(A,'G',93,105)},
}
open('src/data.js', 'w').write('// Generated from the workbook by test/extract.py — do not edit by hand.\nexport const DEFAULTS = ' + json.dumps(data, indent=1) + ';\n')

# fixtures: LT rows with cached results
fx = []
for r in range(9, 34):
    if L[f'C{r}'].value is None: continue
    fx.append({'label': L[f'B{r}'].value,
      'cfg': dict(zip(['cores','shape','size','conductor','insulation','inner','armour','outer'], row(L, r, 'CDEFGHIJ'))),
      'special': {s['key']: L[f'{c}{r}'].value == 'Y' for s, c in zip(special, 'KLMNOPQRST')},
      'expect': {k: LV[f'{c}{r}'].value for k, c in dict(OD='AU', wCond='AV', wIns='AW', wInner='AX', wOuter='AY', wArmour='AZ', mat='BA', specialPct='BB', total1='BE', total2='BF', sell1='BG', sell2='BH').items()}})
json.dump(fx, open('test/fixtures.json', 'w'), indent=1)
print(len(fx), 'rows')
