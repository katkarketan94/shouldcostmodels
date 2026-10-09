"""Regenerates test/fixtures_tray.json (per-sheet inputs + cached results) and the BoQ list in src/dataTray.boq.json."""
import json, sys, openpyxl
X = sys.argv[1]
wb = openpyxl.load_workbook(X); wv = openpyxl.load_workbook(X, data_only=True)
def kind_of(n):
    for k, p in [('ladder','Ladder '),('perf','Perforated'),('trough','U Trough'),('hbend','H Bend'),('vup','Vertical bend up'),('vdown','Vertical bend down'),('tee','Horizontal Tee'),('cross','Horizontal Cross'),('channel','Channel'),('arm','Cantilever')]:
        if n.startswith(p): return k
fx = []
for n in wb.sheetnames[3:]:
    v = wv[n]; k = kind_of(n); g = lambda c: v[c].value
    if k in ('ladder','hbend','vup','vdown','tee','cross'):
        cfg = dict(kind=k, width=g('O8'), depth=g('O9'), thk=g('O10'), length=g('O12'))
        exp = dict(piece=g('D112'), perM=g('D113'), steelW=g('D104'), zincW=g('D107'), steel=g('D105'), zinc=g('D108'), labour=g('D110'))
    elif k in ('perf','trough'):
        cfg = dict(kind=k, width=g('O7'), depth=g('O8'), thk=g('O9'), length=g('O11'))
        exp = dict(piece=g('D92'), perM=g('D93'), steelW=g('D84'), zincW=g('D87'), steel=g('D85'), zinc=g('D88'), labour=g('D90'))
    elif k == 'channel':
        cfg = dict(kind=k, width=g('O7'), depth=g('O8'), thk=g('O9'), length=g('O11'))
        exp = dict(piece=g('D90'), perM=g('D91'), steelW=g('D82'), zincW=g('D85'), steel=g('D83'), zinc=g('D86'), labour=g('D88'))
    else:
        cfg = dict(kind=k, width=g('O7'), depth=g('O8'), thk=g('O9'), length=g('O11'))
        exp = dict(piece=g('D90'), perM=g('D91'), steelW=g('D82'), zincW=g('D85'), steel=g('D83'), zinc=g('D86'), labour=g('D88'))
    fx.append(dict(sheet=n, cfg=cfg, expect=exp))
json.dump(fx, open('test/fixtures_tray.json','w'), indent=1)
# BoQ
S, Sv = wb['Cable Tray & Accessories'], wv['Cable Tray & Accessories']
boq = []; cat = ''
for r in range(6, 59):
    a, b, c, d, e = [S.cell(r, i).value for i in range(1, 6)]
    if c is None and d is None:
        if b: cat = b
        continue
    ref = None
    if isinstance(e, str) and e.startswith('='):
        ref = e.split("'")[1]; mult = 1000 if e.endswith('*1000') else 1
    boq.append(dict(no=a, desc=b, uom=c, qty=d, cat=cat, sheet=ref, rateExpected=Sv.cell(r, 5).value, total=Sv.cell(r, 6).value))
json.dump(boq, open('test/boq_tray.json','w'), indent=1)
print(len(fx), 'tray sheets;', len(boq), 'BoQ lines; total', Sv['F59'].value)
