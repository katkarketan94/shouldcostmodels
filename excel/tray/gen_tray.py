# Builds Cable_Tray_Structural_Check.xlsx: a formula-driven version of the dashboard's cable tray / channel / cantilever-arm structural check.
# Usage: python3 gen_tray.py presets.json out.xlsx   (presets.json comes from presets.mjs and carries the dashboard's own results for verification)
import sys, json, re
sys.path.insert(0, '/home/user/shouldcostmodels/excel')
from gen import Book, hdr, title, YEL, HEAD, GREY, OUT, BLUE, BOLD, WHITE, thin
from openpyxl.styles import Font, PatternFill, Alignment, Border
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule, FormulaRule
from openpyxl.chart import LineChart, Reference, Series
from openpyxl.utils import get_column_letter as L

data = json.load(open(sys.argv[1])); out = sys.argv[2]
S = data['struct']; TT = data['T']; ROWS = data['rows']
B = Book('Cable tray structural check')
R0, N = 6, 20                                      # first data row and number of configuration rows
RED = PatternFill('solid', fgColor='F8D7DA'); GRN = PatternFill('solid', fgColor='D7F0DF')

# ---------------------------------------------------------------- Read Me
rm = B.sheet('Read Me', [26, 104]); title(rm, 'Cable tray structural check', 'Strength, shear and deflection of ladder, perforated and trough trays, trapeze channels and cantilever arms. Standalone, formula-driven.')
rows = [('Purpose', 'Check whether a cable tray, a trapeze channel or a cantilever arm carries a given cable load over a given support spacing, and find the safe working load (SWL) and the longest span that still carries the load.'),
 ('How to use', 'Enter one tray per row on Inputs (yellow cells): type, width, depth, steel thickness, the cable load in kg/m, the support span in m, the support condition and the concentrated load. Calc does the work row by row. Summary shows one row in detail (change the row number in its yellow cell), the verdict for every row, and a chart of SWL against span.'),
 ('Method', '1) Section: thin-wall rectangular parts give area, neutral axis, second moment I and section moduli (perforation holes reduce the base plate of perforated and trough trays). 2) Straight tray or channel as a beam: bending M = kw·w·L² + kp·P·L, shear V = kv·(w·L + P), deflection d = dw·w·L⁴/EI + dp·P·L³/EI, with coefficients for a simple or a continuous span; the moment capacity is allowable stress × the smaller section modulus × a splice efficiency for the coupler joint. 3) Ladder rungs are checked separately as simply supported beams across the width. 4) Cantilever arm: the cable and tray load of one support spacing acts at mid-length of the arm plus an installer load at the tip, checked for bending, shear and tip deflection (limit = arm length / 100). 5) SWL is the cable load at which the first of bending, shear or deflection governs, after deducting the tray self-weight.'),
 ('Verdict', 'PASS when every utilisation (applied ÷ capacity) is at most 100%. The governing check is the one with the smallest SWL.'),
 ('Self-weight', 'Type the tray weight in kg/m if you know it (for example from the cost model or a catalogue). Leave it blank to use the estimate computed from the section area and, for ladders, the rungs.'),
 ('Conventions', 'Yellow fill = input.  Blue font = a typed assumption (Parameters).  Black = formula.  Green fill = key output.  Units: mm, N and MPa inside the calculation; kg, kg/m and m on the sheets that you read.'),
 ('Origin', 'This workbook mirrors the structural check in the Should-Cost dashboards (cable-trays.html, tab Structural check) and reproduces its results; the dashboard model is an own calculation, not taken from a vendor or code workbook. The sample rows on Inputs are the cases used to verify the workbook against the dashboard.'),
 ('Limits', 'Elastic design with a single factor of safety on yield; no web-crippling, lateral-torsional or local-buckling design (slenderness flags only); no seismic or wind load; fittings (bends, tees, crosses) are not checked here: check the straight tray they connect to and keep their support spacing to about half the straight-run span. This is a screening check, not a certified design: confirm against the manufacturer\'s load-span table or NEMA VE 1 / IEC 61537 type test data before relying on it.')]
for i, (a, b) in enumerate(rows, 4):
    rm.cell(i, 1, a).font = BOLD; c = rm.cell(i, 2, b); c.alignment = Alignment(wrap_text=True, vertical='top'); rm.row_dimensions[i].height = 96 if len(b) > 400 else 56

# ---------------------------------------------------------------- Parameters
pa = B.sheet('Parameters', [44, 16, 14, 58]); title(pa, 'Parameters', 'Blue on yellow = assumption you can change. Each value is a named cell (p_...).')
prow = [4]
def sec(t):
    prow[0] += 1; c = pa.cell(prow[0], 1, t); c.font = BOLD
    for k in range(1, 5): pa.cell(prow[0], k).fill = GREY
    prow[0] += 1
def P(nm, label, val, unit='', note=''):
    r = prow[0]; pa.cell(r, 1, label); c = pa.cell(r, 2, val); c.font = BLUE; c.fill = YEL; pa.cell(r, 3, unit); pa.cell(r, 4, note).font = Font(color='6B7482', size=9)
    B.name('p_' + nm, pa, f'$B${r}'); prow[0] += 1
sec('Material and limits')
P('fy', 'Yield strength', S['fy'], 'MPa', 'Mild steel sheet'); P('E', 'Elastic modulus', S['E'], 'MPa'); P('fs', 'Factor of safety on bending', S['fs'], '', 'Allowable stress = fy / factor')
P('splice', 'Splice efficiency on moment capacity', S['splice'], '', 'Coupler joint; applies to straight trays and channels, not to arms'); P('shear', 'Shear allowable, share of fy', S['shearAllow'], '', 'Applied to the web area')
P('g', 'Gravity', S['g'], 'm/s²'); P('webS', 'Web depth / thickness limit', S['webSlender'], '', 'Flag only'); P('flS', 'Flange return / thickness limit', S['flangeSlender'], '', 'Flag only'); P('plS', 'Base plate width / thickness limit', S['plateSlender'], '', 'Flag only')
P('cant', 'Cantilever tip deflection limit (arm length / x)', S['cantilever']['limit'], '')
sec('Ladder tray')
P('collar', 'Side-rail return (collar) width', TT['ladder']['collar'], 'mm'); P('rungW', 'Rung width', TT['ladder']['rungWidth'], 'mm'); P('rungH', 'Rung height', TT['ladder']['rungHeight'], 'mm'); P('rungT', 'Rung thickness', TT['ladder']['rungThk'], 'mm'); P('rungN', 'Rungs per 2.5 m length', TT['ladder']['rungsPer2500'], 'nos')
sec('Perforated tray (perforations in the base)')
P('perfN', 'Holes per row', TT['perf']['perfPerRow'], 'nos'); P('perfL', 'Hole length', TT['perf']['perfLen'], 'mm'); P('perfW', 'Hole width', TT['perf']['perfWid'], 'mm'); P('perfSp', 'Row spacing', TT['perf']['spacing'], 'mm')
sec('Trough tray')
P('trN', 'Holes per row', TT['trough']['perfPerRow'], 'nos'); P('trL', 'Hole length', TT['trough']['perfLen'], 'mm'); P('trW', 'Hole width', TT['trough']['perfWid'], 'mm'); P('trSp', 'Row spacing', TT['trough']['spacing'], 'mm')
sec('Channel and cantilever arm')
P('lip', 'Return lip width', TT['channel']['lip'], 'mm')
sec('Beam coefficients (M = kw·w·L² + kp·P·L; V = kv·(w·L + P); d = dw·w·L⁴/EI + dp·P·L³/EI)')
r = prow[0]; hdr(pa, r, ['Support condition', 'kw', 'kp', 'dw', 'dp', 'kv'])
for k in (5, 6): pa.column_dimensions[L(k)].width = 14
for i, nm in enumerate(['simple', 'continuous'], 1):
    pa.cell(r + i, 1, nm);
    for j, key in enumerate(['kw', 'kp', 'dw', 'dp', 'kv'], 2):
        c = pa.cell(r + i, j, S[nm][key]); c.font = BLUE; c.fill = YEL; c.number_format = '0.000000'
B.name('sup_names', pa, f'$A${r+1}:$A${r+2}')
for j, key in enumerate(['kw', 'kp', 'dw', 'dp', 'kv'], 2): B.name('sup_' + key, pa, f'${L(j)}${r+1}:${L(j)}${r+2}')
prow[0] = r + 4
sec('Ladder rung section (derived)')
r = prow[0]
def D(nm, label, formula, unit='', fmt='#,##0.00'):
    rr = prow[0]; pa.cell(rr, 1, label); c = pa.cell(rr, 2, formula); c.number_format = fmt; pa.cell(rr, 3, unit); B.name('p_' + nm, pa, f'$B${rr}'); prow[0] += 1
D('rA1', 'Rung base area', '=p_rungW*p_rungT', 'mm²'); D('rA2', 'Rung side area (two legs)', '=2*p_rungT*p_rungH', 'mm²')
D('rA', 'Rung section area', '=p_rA1+p_rA2', 'mm²'); D('rYb', 'Neutral axis from base', '=(p_rA1*p_rungT/2+p_rA2*p_rungH/2)/p_rA', 'mm')
D('rI', 'Second moment of the rung', '=(p_rungW*p_rungT^3/12+p_rA1*(p_rungT/2-p_rYb)^2)+(2*p_rungT*p_rungH^3/12+p_rA2*(p_rungH/2-p_rYb)^2)', 'mm⁴', '#,##0')
D('rungZ', 'Rung section modulus (smaller)', '=MIN(p_rI/p_rYb,p_rI/(p_rungH-p_rYb))', 'mm³', '#,##0.0')

# ---------------------------------------------------------------- Inputs
ip = B.sheet('Inputs', [38, 12, 11, 11, 11, 12, 13, 12, 12, 13, 11, 12, 12, 14]); title(ip, 'Inputs: one tray per row', 'Yellow cells are inputs. Kinds: ladder, perf (perforated), trough, channel, arm (cantilever arm). Clear a row\'s Kind to leave it out.')
hdr(ip, R0 - 2, ['Tag', 'Kind', 'Width', 'Depth', 'Thickness', 'Arm length', 'Self-weight (blank = estimate)', 'Cable load', 'Support span / arm spacing', 'Support', 'Point load', 'Deflection limit', 'Channel span', 'Supported tray weight'])
units = ['', '', 'mm', 'mm', 'mm', 'mm (arm)', 'kg/m', 'kg/m', 'm', 'simple / continuous', 'kg', 'L / x', 'mm (channel)', 'kg/m (arm, channel)']
for i, u in enumerate(units, 1):
    c = ip.cell(R0 - 1, i, u); c.font = Font(italic=True, color='6B7482', size=9); c.alignment = Alignment(horizontal='center')
IC = dict(tag='A', kind='B', W='C', Dp='D', t='E', La='F', selfIn='G', load='H', span='I', sup='J', pt='K', defl='L', chSpan='M', trayKg='N')
for n in range(N):
    r = R0 + n; o = ROWS[n] if n < len(ROWS) else None
    vals = [o['tag'], o['cfg']['kind'], o['cfg']['width'], o['cfg']['depth'], o['cfg']['thk'], o['cfg'].get('length') if o['cfg']['kind'] == 'arm' else None, o['self'], o['chk']['load'], o['chk']['span'], o['chk']['support'], o['chk']['point'], o['chk']['defl'], o['chk']['channelSpan'] if o['cfg']['kind'] == 'channel' else None, o['chk']['trayKgPerM'] if o['cfg']['kind'] in ('arm', 'channel') else None] if o else [None] * 14
    for j, v in enumerate(vals, 1):
        c = ip.cell(r, j, v); c.fill = YEL; c.font = BLUE; c.border = Border(left=thin, right=thin, top=thin, bottom=thin)
        if j in (7, 8, 9, 11, 14): c.number_format = '0.00'
dv = DataValidation(type='list', formula1='"ladder,perf,trough,channel,arm"', allow_blank=True); ip.add_data_validation(dv); dv.add(f'B{R0}:B{R0+N-1}')
dv2 = DataValidation(type='list', formula1='"simple,continuous"', allow_blank=True); ip.add_data_validation(dv2); dv2.add(f'J{R0}:J{R0+N-1}')
dv3 = DataValidation(type='list', formula1='"100,150,200,300"', allow_blank=True); ip.add_data_validation(dv3); dv3.add(f'L{R0}:L{R0+N-1}')
ip.freeze_panes = 'C6'
notes = ['Arm: enter the arm length in "Arm length", the arm spacing along the run in "Support span / arm spacing", and the weight of tray supported per metre in the last column.',
         'Channel: the channel span is the trapeze length between its two hangers; the cable and tray load of one support spacing acts on it as a uniform load.',
         'Straight tray (ladder, perf, trough): "Support span" is the distance between supports; support condition simple or continuous over several spans.']
for i, t in enumerate(notes): ip.cell(R0 + N + 1 + i, 1, t).font = Font(italic=True, color='6B7482', size=9)

# ---------------------------------------------------------------- Calc
cs = B.sheet('Calc', [38, 9] + [12] * 80); title(cs, 'Calculation: one row per tray', 'Same row numbers as Inputs. Section (1), beam check (2), arm check (3), result (4).')
cols = []     # (key, header, unit, formula with tokens: <inputname> -> Inputs cell, [key] -> Calc cell in the same row)
def C(key, head, unit, f, fmt='#,##0.0'): cols.append((key, head, unit, f, fmt))
def AC(key, head, unit, f, fmt='#,##0.0'):
    C(key, head, unit, '=IF(<kind>="arm",' + f[1:] + ',"")', fmt)
isb = 'OR(<kind>="ladder",<kind>="perf",<kind>="trough",<kind>="channel")'
C('kind', 'Kind', '', '=<kind>', '@')
C('pr', 'Perforation ratio', '', '=IF(OR(<kind>="perf",<kind>="trough"),MIN(0.5,IF(<kind>="perf",p_perfN*p_perfL*p_perfW/(p_perfSp*<W>),p_trN*p_trL*p_trW/(p_trSp*<W>))),0)', '0.000')
C('col', 'Return width', 'mm', '=IF(<kind>="ladder",p_collar,IF(<kind>="perf",IF(AND(<W>>=300,<Dp>>=100),15,0),IF(<kind>="trough",0,p_lip)))', '0.0')
C('a1', 'Part 1 area', 'mm²', '=IF(<kind>="ladder",2*<t>*<Dp>,IF(OR(<kind>="perf",<kind>="trough"),(<W>+4)*<t>*(1-[pr]),<W>*<t>))')
C('y1', 'Part 1 centroid', 'mm', '=IF(<kind>="ladder",<Dp>/2,<t>/2)')
C('i1', 'Part 1 own I', 'mm⁴', '=IF(<kind>="ladder",2*<t>*<Dp>^3/12,IF(OR(<kind>="perf",<kind>="trough"),0,<W>*<t>^3/12))', '#,##0')
C('a2', 'Part 2 area', 'mm²', '=IF(<kind>="ladder",2*[col]*<t>,2*<t>*<Dp>)')
C('y2', 'Part 2 centroid', 'mm', '=IF(<kind>="ladder",<t>/2,<Dp>/2)')
C('i2', 'Part 2 own I', 'mm⁴', '=IF(<kind>="ladder",2*[col]*<t>^3/12,2*<t>*<Dp>^3/12)', '#,##0')
C('a3', 'Part 3 area', 'mm²', '=2*[col]*<t>'); C('y3', 'Part 3 centroid', 'mm', '=<Dp>-<t>/2'); C('i3', 'Part 3 own I', 'mm⁴', '=2*[col]*<t>^3/12', '#,##0')
C('A', 'Section area', 'mm²', '=[a1]+[a2]+[a3]'); C('yb', 'Neutral axis from base', 'mm', '=([a1]*[y1]+[a2]*[y2]+[a3]*[y3])/[A]', '0.00')
C('I', 'Second moment I', 'mm⁴', '=([i1]+[a1]*([y1]-[yb])^2)+([i2]+[a2]*([y2]-[yb])^2)+([i3]+[a3]*([y3]-[yb])^2)', '#,##0')
C('Zb', 'Z, base', 'mm³', '=[I]/[yb]', '#,##0'); C('Zt', 'Z, top', 'mm³', '=[I]/(<Dp>-[yb])', '#,##0'); C('web', 'Web area', 'mm²', '=2*<Dp>*<t>')
C('est', 'Self-weight estimate', 'kg/m', '=[A]*0.00785+IF(<kind>="ladder",p_rungN/2.5*(p_rungW*p_rungT+2*p_rungT*p_rungH)*<W>*0.00000785,0)', '0.00')
C('self', 'Self-weight used', 'kg/m', '=IF(<selfIn>="",[est],<selfIn>)', '0.00')
C('webr', 'Web depth / t', '', '=<Dp>/<t>', '0'); C('flr', 'Return / t', '', '=IF([col]>0,[col]/<t>,0)', '0')
C('plr', 'Base width / t', '', '=IF(OR(<kind>="perf",<kind>="trough"),(<W>+4)/<t>,IF(OR(<kind>="channel",<kind>="arm"),<W>/<t>,0))', '0')
C('warn', 'Slenderness flags', '', '=IF([webr]>p_webS,"web; ","")&IF([flr]>p_flS,"flange; ","")&IF([plr]>p_plS,"base plate; ","")', '@')
# support coefficients
for k in ('kw', 'kp', 'dw', 'dp', 'kv'):
    C(k, k, '', f'=IFERROR(INDEX(sup_{k},MATCH(<sup>,sup_names,0)),INDEX(sup_{k},1))', '0.000000')
C('sigma', 'Allowable stress', 'MPa', '=p_fy/p_fs', '0.0'); C('P', 'Point load', 'N', '=<pt>*p_g', '#,##0.0'); C('EI', 'EI', 'N·mm²', '=p_E*[I]', '0.000E+00')
C('Vall', 'Shear capacity', 'N', '=p_shear*p_fy*[web]', '#,##0')
# beam
C('Lb', 'Beam span L', 'mm', '=IF(<kind>="channel",<chSpan>,<span>*1000)', '#,##0')
C('cw', 'Cable line load', 'kg/m', '=IF(<kind>="channel",(<load>+<trayKg>)*<span>/([Lb]/1000),<load>)', '0.00')
C('Mallb', 'Moment capacity (beam)', 'N·mm', '=[sigma]*MIN([Zb],[Zt])*p_splice', '#,##0'); C('dLimb', 'Deflection limit', 'mm', '=[Lb]/<defl>', '0.00')
C('wS', 'Self load', 'N/mm', '=[self]*p_g/1000', '0.0000'); C('wC', 'Cable load', 'N/mm', '=[cw]*p_g/1000', '0.0000')
C('Mb', 'Applied moment', 'N·mm', '=[kw]*([wS]+[wC])*[Lb]^2+[kp]*[P]*[Lb]', '#,##0'); C('Vb', 'Applied shear', 'N', '=[kv]*(([wS]+[wC])*[Lb]+[P])', '#,##0')
C('db', 'Deflection', 'mm', '=[dw]*([wS]+[wC])*[Lb]^4/[EI]+[dp]*[P]*[Lb]^3/[EI]', '0.00')
C('cStr', 'SWL, bending', 'kg/m', '=MAX(0,([Mallb]-[kp]*[P]*[Lb])/([kw]*[Lb]^2)-[wS])*1000/p_g'); C('cShr', 'SWL, shear', 'kg/m', '=MAX(0,([Vall]-[kv]*[P])/([kv]*[Lb])-[wS])*1000/p_g')
C('cDef', 'SWL, deflection', 'kg/m', '=MAX(0,([dLimb]-[dp]*[P]*[Lb]^3/[EI])/([dw]*[Lb]^4/[EI])-[wS])*1000/p_g')
C('swlb', 'SWL (beam)', 'kg/m', '=MIN([cStr],[cShr],[cDef])'); C('govb', 'Governing (beam)', '', '=IF([swlb]=[cStr],"bending",IF([swlb]=[cDef],"deflection","shear"))', '@')
C('ur', 'Rung utilisation', '', '=IF(<kind>="ladder",((<load>*2500/p_rungN/1000*p_g)*<W>/8+([P]/3)*<W>/4)/(p_fy/p_fs*p_rungZ),"")', '0.000')
# arm
AC('Malla', 'Moment capacity (arm)', 'N·mm', '=[sigma]*MIN([Zb],[Zt])', '#,##0'); AC('dLima', 'Tip deflection limit', 'mm', '=<La>/p_cant', '0.00')
AC('Fn', 'Cable load on one arm', 'N', '=<load>*<span>*p_g', '#,##0'); AC('Ftot', 'Cable + tray on one arm', 'N', '=[Fn]+<trayKg>*<span>*p_g', '#,##0'); AC('Pc', 'Tip load', 'N', '=[P]/3', '#,##0.0')
AC('Ma', 'Applied moment', 'N·mm', '=[Ftot]*<La>/2+[Pc]*<La>', '#,##0'); AC('Va', 'Applied shear', 'N', '=[Ftot]+[Pc]', '#,##0'); AC('da', 'Tip deflection', 'mm', '=[Ftot]*<La>^3/(8*[EI])+[Pc]*<La>^3/(3*[EI])', '0.00')
AC('aK', 'Arm capacity, bending', 'kg', '=([Malla]-[Pc]*<La>)/(<La>/2)/p_g-<trayKg>*<span>'); AC('aS', 'Arm capacity, shear', 'kg', '=([Vall]-[Pc])/p_g-<trayKg>*<span>')
AC('aD', 'Arm capacity, deflection', 'kg', '=([dLima]-[Pc]*<La>^3/(3*[EI]))/(<La>^3/(8*[EI]))/p_g-<trayKg>*<span>')
AC('swlA', 'SWL per arm', 'kg', '=MAX(0,MIN([aK],[aS],[aD]))'); AC('swla', 'SWL (arm)', 'kg/m', '=[swlA]/<span>')
AC('gova', 'Governing (arm)', '', '=IF([swlA]=MAX(0,[aK]),"bending",IF([swlA]=MAX(0,[aD]),"deflection","shear"))', '@')
# result
C('Mall', 'Moment capacity', 'N·mm', '=IF(<kind>="arm",[Malla],[Mallb])', '#,##0'); C('M', 'Applied moment', 'N·mm', '=IF(<kind>="arm",[Ma],[Mb])', '#,##0'); C('V', 'Applied shear', 'N', '=IF(<kind>="arm",[Va],[Vb])', '#,##0')
C('dd', 'Deflection', 'mm', '=IF(<kind>="arm",[da],[db])', '0.00'); C('dl', 'Deflection limit', 'mm', '=IF(<kind>="arm",[dLima],[dLimb])', '0.00')
C('ub', 'Bending utilisation', '', '=[M]/[Mall]', '0.000'); C('us', 'Shear utilisation', '', '=[V]/[Vall]', '0.000'); C('ud', 'Deflection utilisation', '', '=[dd]/[dl]', '0.000')
C('umax', 'Governing utilisation', '', '=MAX([ub],[us],[ud],IF(<kind>="ladder",[ur],0))', '0.000')
C('swl', 'SAFE WORKING LOAD', 'kg/m', '=IF(<kind>="arm",[swla],[swlb])', '#,##0.0'); C('gov', 'Governing check', '', '=IF(<kind>="arm",[gova],[govb])', '@')
C('verdict', 'VERDICT', '', '=IF([umax]<=1,"PASS","FAIL")', '@'); C('margin', 'Load margin', '%', '=IF(<load>>0,[swl]/<load>-1,"")', '0%')
colmap = {k: L(i + 2) for i, (k, *_ ) in enumerate(cols)}            # column B onwards
hdr(cs, R0 - 2, ['Tag'] + [c[1] for c in cols])
for i, (k, h, u, f, fmt) in enumerate(cols):
    c = cs.cell(R0 - 1, i + 2, u); c.font = Font(italic=True, color='6B7482', size=9); c.alignment = Alignment(horizontal='center')
for n in range(N):
    r = R0 + n; cs.cell(r, 1, f'=IF(Inputs!A{r}="","",Inputs!A{r})')
    for i, (k, h, u, f, fmt) in enumerate(cols):
        expr = re.sub(r'<(\w+)>', lambda m: f'Inputs!${IC[m.group(1)]}{r}', f)
        expr = re.sub(r'\[(\w+)\]', lambda m: f'{colmap[m.group(1)]}{r}', expr)
        c = cs.cell(r, i + 2, f'=IF(Inputs!$B{r}="","",{expr[1:]})'); c.number_format = fmt
        if k in ('swl', 'verdict', 'gov', 'umax'): c.fill = OUT; c.font = BOLD
cs.freeze_panes = 'B6'
for rng, col in ((f'{colmap["verdict"]}{R0}:{colmap["verdict"]}{R0+N-1}', None),):
    cs.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"PASS"'], fill=GRN)); cs.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"FAIL"'], fill=RED))
CR = lambda k: f'Calc!${colmap[k]}${R0}:${colmap[k]}${R0+N-1}'

# ---------------------------------------------------------------- Summary
su = B.sheet('Summary', [40, 20, 18, 16, 16, 16, 16]); title(su, 'Summary', 'Pick a row to see it in detail. The table below lists every row.')
su['A3'] = 'Row to show (1-20)'; su['A3'].font = BOLD; c = su['B3']; c.value = 1; c.fill = YEL; c.font = BLUE; c.border = Border(left=thin, right=thin, top=thin, bottom=thin)
dvr = DataValidation(type='whole', operator='between', formula1='1', formula2=str(N)); su.add_data_validation(dvr); dvr.add('B3')
def pick(key): return f'=INDEX({CR(key)},$B$3)'
def SR(r, label, key, fmt='#,##0.0', out=False, unit=''):
    su.cell(r, 1, label); c = su.cell(r, 2, pick(key)); c.number_format = fmt; su.cell(r, 3, unit).font = Font(color='6B7482')
    if out: c.fill = OUT; c.font = BOLD
su['A5'] = 'Tray'; su['A5'].font = BOLD
su['A6'] = 'Tag'; su['B6'] = f'=INDEX(Inputs!$A${R0}:$A${R0+N-1},$B$3)'; su['A7'] = 'Kind'; su['B7'] = f'=INDEX(Inputs!$B${R0}:$B${R0+N-1},$B$3)'
su['A8'] = 'Width x depth x thickness (mm)'; su['B8'] = f'=INDEX(Inputs!$C${R0}:$C${R0+N-1},$B$3)&" x "&INDEX(Inputs!$D${R0}:$D${R0+N-1},$B$3)&" x "&INDEX(Inputs!$E${R0}:$E${R0+N-1},$B$3)'
SR(9, 'Cable load', 'kind', '@'); su['B9'] = f'=INDEX(Inputs!$H${R0}:$H${R0+N-1},$B$3)'; su['B9'].number_format = '0.0'; su['C9'] = 'kg/m'
su['A10'] = 'Support span / arm spacing'; su['B10'] = f'=INDEX(Inputs!$I${R0}:$I${R0+N-1},$B$3)'; su['C10'] = 'm'
su['A12'] = 'Result'; su['A12'].font = BOLD
SR(13, 'VERDICT', 'verdict', '@', True); SR(14, 'Safe working load', 'swl', '#,##0.0', True, 'kg/m'); SR(15, 'Governing check', 'gov', '@', True)
SR(16, 'Governing utilisation', 'umax', '0%', True); SR(17, 'Load margin (SWL / load - 1)', 'margin', '0%')
su['A18'] = 'Safe working load per arm'; su['B18'] = f'=IF(B7="arm",INDEX({CR("swlA")},$B$3),"n/a")'; su['B18'].number_format = '#,##0.0'; su['C18'] = 'kg'
su['A20'] = 'Utilisation (applied / capacity)'; su['A20'].font = BOLD
SR(21, 'Bending', 'ub', '0%'); SR(22, 'Shear in the webs', 'us', '0%'); SR(23, 'Deflection', 'ud', '0%'); su['A24'] = 'Rung bending (ladder)'; su['B24'] = f'=IF(B7="ladder",INDEX({CR("ur")},$B$3),"n/a")'; su['B24'].number_format = '0%'
su['A26'] = 'Section'; su['A26'].font = BOLD
SR(27, 'Section area', 'A', '#,##0', unit='mm²'); SR(28, 'Neutral axis from base', 'yb', '0.0', unit='mm'); SR(29, 'Second moment I', 'I', '#,##0', unit='mm⁴'); SR(30, 'Section modulus, base', 'Zb', '#,##0', unit='mm³'); SR(31, 'Section modulus, top', 'Zt', '#,##0', unit='mm³')
SR(32, 'Self-weight used', 'self', '0.00', unit='kg/m'); SR(33, 'Slenderness flags', 'warn', '@')
su['A35'] = 'Longest span that carries the load'; su['A35'].font = BOLD; su['B35'] = "='Span curve'!B7"; su['B35'].fill = OUT; su['B35'].font = BOLD; su['B35'].number_format = '0.00'; su['C35'] = "m"; su['D35'] = "='Span curve'!B8"
su['A36'] = 'Resolution 0.1 m with linear interpolation between grid points. Channels have no span curve (the channel span is fixed).'; su['A36'].font = Font(italic=True, color='6B7482', size=9)
hdr(su, 38, ['Row / tag', 'Kind', 'SWL kg/m', 'Load kg/m', 'Utilisation', 'Governing', 'Verdict'])
for n in range(N):
    r = 39 + n; ir = R0 + n
    su.cell(r, 1, f'=IF(Inputs!B{ir}="","",{n+1}&"  "&Inputs!A{ir})'); su.cell(r, 2, f'=IF(Inputs!B{ir}="","",Inputs!B{ir})')
    su.cell(r, 3, f'=IF(Inputs!B{ir}="","",Calc!{colmap["swl"]}{ir})').number_format = '#,##0.0'; su.cell(r, 4, f'=IF(Inputs!B{ir}="","",Inputs!H{ir})').number_format = '0.0'
    su.cell(r, 5, f'=IF(Inputs!B{ir}="","",Calc!{colmap["umax"]}{ir})').number_format = '0%'; su.cell(r, 6, f'=IF(Inputs!B{ir}="","",Calc!{colmap["gov"]}{ir})'); su.cell(r, 7, f'=IF(Inputs!B{ir}="","",Calc!{colmap["verdict"]}{ir})')
for rng in ('B13', f'G39:G{38+N}'):
    su.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"PASS"'], fill=GRN)); su.conditional_formatting.add(rng, CellIsRule(operator='equal', formula=['"FAIL"'], fill=RED))

# ---------------------------------------------------------------- Span curve
sc = B.sheet('Span curve', [34, 14, 14, 14, 14]); title(sc, 'Safe working load against span (row selected on Summary)', 'Straight trays and arms. For an arm the "span" is the arm spacing along the run.')
def G(r, label, key, fmt='#,##0.000000'):
    sc.cell(r, 1, label).font = Font(color='6B7482'); c = sc.cell(r, 3, f'=INDEX({CR(key)},Summary!$B$3)'); c.number_format = fmt
sc['A3'] = 'Kind'; sc['B3'] = f'=INDEX(Inputs!$B${R0}:$B${R0+N-1},Summary!$B$3)'; sc['A4'] = 'Cable load (kg/m)'; sc['B4'] = f'=INDEX(Inputs!$H${R0}:$H${R0+N-1},Summary!$B$3)'
sc['A6'] = 'Result'; sc['A6'].font = BOLD
# hidden-ish helper block in column H.. (values pulled from the selected row)
H = {}
helpers = [('kind', f'=INDEX(Inputs!$B${R0}:$B${R0+N-1},Summary!$B$3)', '@'), ('load', f'=INDEX(Inputs!$H${R0}:$H${R0+N-1},Summary!$B$3)', '0.00'), ('pt', f'=INDEX(Inputs!$K${R0}:$K${R0+N-1},Summary!$B$3)', '0.0'), ('defl', f'=INDEX(Inputs!$L${R0}:$L${R0+N-1},Summary!$B$3)', '0'),
    ('trayKg', f'=INDEX(Inputs!$N${R0}:$N${R0+N-1},Summary!$B$3)', '0.00'), ('La', f'=INDEX(Inputs!$F${R0}:$F${R0+N-1},Summary!$B$3)', '0')] + [(k, f'=INDEX({CR(k)},Summary!$B$3)', '0.000000') for k in ('kw', 'kp', 'dw', 'dp', 'kv', 'sigma', 'P', 'EI', 'Vall', 'Mallb', 'Malla', 'self', 'wS')]
sc.cell(10, 7, 'Selected row (helper values)').font = BOLD
for i, (k, f, fmt) in enumerate(helpers):
    sc.cell(11 + i, 7, k).font = Font(color='6B7482'); c = sc.cell(11 + i, 8, f); c.number_format = fmt; H[k] = f'$H${11 + i}'
sc.column_dimensions['G'].width = 14; sc.column_dimensions['H'].width = 16
T0 = 12; NS = 116
hdr(sc, T0 - 1, ['Span (m)', 'SWL (kg/m)', 'Load (kg/m)', 'Carries load?'])
for i in range(NS):
    r = T0 + i; sp = f'$A{r}'
    sc.cell(r, 1, round(0.5 + 0.1 * i, 1)).number_format = '0.0'
    L_ = f'({sp}*1000)'
    beam = (f'MIN(MAX(0,({H["Mallb"]}-{H["kp"]}*{H["P"]}*{L_})/({H["kw"]}*{L_}^2)-{H["wS"]})*1000/p_g,'
            f'MAX(0,({H["Vall"]}-{H["kv"]}*{H["P"]})/({H["kv"]}*{L_})-{H["wS"]})*1000/p_g,'
            f'MAX(0,({L_}/{H["defl"]}-{H["dp"]}*{H["P"]}*{L_}^3/{H["EI"]})/({H["dw"]}*{L_}^4/{H["EI"]})-{H["wS"]})*1000/p_g)')
    La = H['La']; pc = f'({H["P"]}/3)'; ts = f'{H["trayKg"]}*{sp}'
    arm = (f'MAX(0,MIN(({H["Malla"]}-{pc}*{La})/({La}/2)/p_g-{ts},({H["Vall"]}-{pc})/p_g-{ts},'
           f'(({La}/p_cant)-{pc}*{La}^3/(3*{H["EI"]}))/({La}^3/(8*{H["EI"]}))/p_g-{ts}))/{sp}')
    c = sc.cell(r, 2, f'=IF({H["kind"]}="arm",{arm},IF({H["kind"]}="channel","",{beam}))'); c.number_format = '#,##0.0'
    sc.cell(r, 3, f'={H["load"]}').number_format = '0.0'
    sc.cell(r, 4, f'=IF(B{r}="","",IF(B{r}>=C{r},"yes","no"))')
rngB = f'$B${T0}:$B${T0+NS-1}'
sc['A7'] = 'Longest span carrying the load (m)'; sc['A7'].font = BOLD
sc['B7'] = (f'=IF({H["kind"]}="channel","n/a",IF(COUNTIF({rngB},">="&{H["load"]})=0,"none",IF(COUNTIF({rngB},">="&{H["load"]})>={NS},12,'
            f'INDEX($A${T0}:$A${T0+NS-1},COUNTIF({rngB},">="&{H["load"]}))+(INDEX({rngB},COUNTIF({rngB},">="&{H["load"]}))-{H["load"]})/(INDEX({rngB},COUNTIF({rngB},">="&{H["load"]}))-INDEX({rngB},COUNTIF({rngB},">="&{H["load"]})+1))*0.1)))')
sc['B7'].number_format = '0.00'; sc['B7'].fill = OUT; sc['B7'].font = BOLD
sc['A8'] = 'Note'; sc['B8'] = f'=IF(B7="none","Capacity is below the load even at 0.5 m",IF(B7=12,"Carries the load at the 12 m limit of the table",""))'
ch = LineChart(); ch.title = 'Safe working load against span'; ch.y_axis.title = 'kg/m'; ch.x_axis.title = 'span, m'; ch.height = 9; ch.width = 18
ch.add_data(Reference(sc, min_col=2, min_row=T0 - 1, max_row=T0 + 60), titles_from_data=True); ch.add_data(Reference(sc, min_col=3, min_row=T0 - 1, max_row=T0 + 60), titles_from_data=True)
ch.set_categories(Reference(sc, min_col=1, min_row=T0, max_row=T0 + 60)); sc.add_chart(ch, 'J11')
sc.freeze_panes = f'A{T0}'

# order, protection-free, save
B.wb._sheets = [B.wb['Read Me'], B.wb['Inputs'], B.wb['Summary'], B.wb['Calc'], B.wb['Span curve'], B.wb['Parameters']]
B.wb.save(out); print('saved', out)
