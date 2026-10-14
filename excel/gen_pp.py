import sys; sys.path.insert(0, '/tmp/claude-0/xl')
from gen import *

FAM = [('HDPE PE100', 0.95, 108, 0.03, 2.0, 3.6, 3.2, 4.5, 2.2, 0.10), ('PVC-U', 1.40, 82, 0.12, 1.6, 2.8, 3.0, 4.0, 2.0, 0.10), ('PP-R', 0.90, 135, 0.04, 1.9, 3.4, 3.4, 5.0, 2.4, 0.12), ('CPVC', 1.55, 215, 0.18, 1.5, 4.2, 4.0, 6.0, 3.0, 0.14)]
CPVC_OD = [21.34, 26.67, 33.4, 42.16, 48.26, 60.33, 73.03, 88.9, 114.3]; NPS = ['1/2"', '3/4"', '1"', '1 1/4"', '1 1/2"', '2"', '2 1/2"', '3"', '4"']
CPVC_W = {40: [2.77, 2.87, 3.38, 3.56, 3.68, 3.91, 5.16, 5.49, 6.02], 80: [3.73, 3.91, 4.55, 4.85, 5.08, 5.54, 7.01, 7.62, 8.56]}
STD = {'HDPE PE100': ('IS 4984 / ISO 4427', [20, 25, 32, 40, 50, 63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400, 450, 500, 560, 630], 'SDR 33, 26, 21, 17, 13.6, 11, 9, 7.4 (enter the number)'),
       'PVC-U': ('IS 4985', [63, 75, 90, 110, 125, 140, 160, 180, 200, 225, 250, 280, 315, 355, 400], 'Pressure class in MPa: 0.25, 0.4, 0.6, 0.8, 1.0, 1.25'),
       'PP-R': ('DIN 8077 / IS 15801', [20, 25, 32, 40, 50, 63, 75, 90, 110], 'SDR 11 (PN 10), 7.4 (PN 16), 6 (PN 20) (enter the number)'),
       'CPVC': ('ASTM F441 (IPS)', CPVC_OD, 'Schedule 40 or 80 (enter 40 or 80)')}
LINES = [('HDPE 110 SDR 11', 'HDPE PE100', 110, 11, 20000), ('HDPE 315 SDR 17', 'HDPE PE100', 315, 17, 4000), ('PVC-U 110 · 0.6 MPa', 'PVC-U', 110, 0.6, 15000), ('PVC-U 200 · 0.8 MPa', 'PVC-U', 200, 0.8, 6000), ('PP-R 32 SDR 7.4', 'PP-R', 32, 7.4, 8000), ('CPVC 2" SCH 80', 'CPVC', 60.33, 80, 3000)]
NL = 12

def build_pp(lines, path):
    B = Book('Non-metallic pipes')
    rm = B.sheet('Read Me', [26, 100]); title(rm, 'Non-metallic pipes: should-cost model', 'HDPE PE100, PVC-U, PP-R and CPVC pipe, costed from resin to delivered price. Not a vendor price list: every rate is an editable assumption.')
    txt = [('Purpose', 'Estimate the ex-works plus freight price per metre, per kg and per line of extruded plastic pipe. It follows the structure of the metal-pipe cost model: raw material with yield loss and a scrap credit, conversion, testing, margin, payment interest and logistics.'),
           ('How to use', 'Enter up to 12 pipe lines on Inputs (family, outside diameter, rating, length required). Prices, extrusion rates and margins are on Rates; change them to your own. Per-line results and the batch total are on Summary; the row-by-row working is on Calc.'),
           ('Sheets', 'Inputs: pipe lines and the line to break down.  Summary: results per line, batch value and the cost stack of the chosen line.  Calc: the working for each line.  Rates: family constants, resin prices, wall tables, logistics.  Standards: the sizes and ratings the wall rules cover.'),
           ('Wall thickness', 'HDPE and PP-R: wall = OD / SDR.  PVC-U: wall = P x OD / (2 x design stress + P), with a design stress of 10 MPa.  CPVC: ASTM F441 schedule table.  The result is never below the family minimum wall and is rounded up to 0.1 mm.'),
           ('Cost build-up', 'Weight per metre = pi/4 x (OD^2 - ID^2) x density.  Raw material = weight x (1 + yield loss) x resin price x (1 + additives), less a scrap credit for trimmed material recovered as regrind.  Conversion = energy + labour + depreciation + other per kg, with a thick-wall surcharge above 10 mm.  Testing per kg.  Margin on that base, then interest on the payment period, then logistics priced by truck loading (bulk-limited for large diameters).'),
           ('Conventions', 'Yellow fill = input.  Blue font = a typed assumption you may change.  Black = formula.  Green fill = key output.  Rupees, ex-GST.'),
           ('Limits', 'Straight pipe only: no fittings, sockets, fusion or solvent-weld joints, or installation. Resin prices should follow your own purchase prices or the commodity file (typed here, not linked).'),
           ('Companion', 'The same model runs in the Should-Cost dashboards (Pipes, plastic family), with a 3D view and a month selector for resin prices.')]
    for i, (a, b) in enumerate(txt, 4):
        rm.cell(i, 1, a).font = BOLD; c = rm.cell(i, 2, b); c.alignment = Alignment(wrap_text=True, vertical='top'); rm.row_dimensions[i].height = 62
    # ---- Rates
    rt = B.sheet('Rates', [34, 12, 14, 14, 12, 12, 12, 12, 12, 12]); title(rt, 'Rates and constants', 'Blue = assumption. Each value is a named cell (r_...).')
    hdr(rt, 4, ['Family', 'Density g/cm3', 'Resin Rs/kg', 'Additives % of resin', 'Minimum wall mm', 'Energy Rs/kg', 'Labour Rs/kg', 'Depreciation Rs/kg', 'Other Rs/kg', 'Margin'])
    for i, f in enumerate(FAM, 5):
        for j, v in enumerate(f, 1):
            c = rt.cell(i, j, v)
            if j > 1: c.font = BLUE; c.fill = YEL
            if j in (4, 10): c.number_format = '0.0%'
    for nm, col in [('famList', 'A'), ('rho', 'B'), ('resin', 'C'), ('add', 'D'), ('minWall', 'E'), ('energy', 'F'), ('labour', 'G'), ('deprec', 'H'), ('other', 'I'), ('margin', 'J')]: B.name('r_' + nm, rt, f'${col}$5:${col}$8')
    row = [10]
    def P(nm, label, val, unit='', fmt=None):
        r = row[0]; rt.cell(r, 1, label); c = rt.cell(r, 2, val); c.font = BLUE; c.fill = YEL
        if fmt: c.number_format = fmt
        rt.cell(r, 3, unit); B.name('r_' + nm, rt, f'$B${r}'); row[0] += 1
    rt.cell(row[0], 1, 'Process constants').font = BOLD; row[0] += 1
    P('stressPvc', 'PVC-U design stress', 10, 'MPa'); P('yieldLoss', 'Yield loss (start-up and trim scrap)', 0.025, 'of weight', '0.0%'); P('regrind', 'Value recovered from scrap as regrind', 0.8, 'of scrap value', '0%'); P('thickPct', 'Thick-wall conversion surcharge per mm above 10 mm', 0.015, '', '0.0%')
    P('hydro', 'Hydro-test', 0.8, 'Rs/kg'); P('docs', 'Documentation and inspection', 2.0, 'Rs/kg'); P('months', 'Payment period', 3, 'months'); P('intRate', 'Interest rate', 0.09, 'per year', '0.0%')
    rt.cell(row[0], 1, 'Logistics').font = BOLD; row[0] += 1
    P('loading', 'Loading and freight', 1400, 'Rs per tonne of truck capacity'); P('lf1max', 'Outside diameter up to (class 1)', 110, 'mm'); P('lf1', 'Truck loading factor, class 1', 0.6); P('lf2max', 'Outside diameter up to (class 2)', 315, 'mm'); P('lf2', 'Truck loading factor, class 2', 0.4); P('lf3', 'Truck loading factor, larger pipes', 0.25)
    row[0] += 1; r0 = row[0]; rt.cell(r0, 1, 'CPVC wall thickness (ASTM F441), mm').font = BOLD; hdr(rt, r0 + 1, ['Outside diameter mm', 'NPS', 'SCH 40', 'SCH 80'])
    for i, (od, n) in enumerate(zip(CPVC_OD, NPS)):
        r = r0 + 2 + i; rt.cell(r, 1, od).font = BLUE; rt.cell(r, 2, n); rt.cell(r, 3, CPVC_W[40][i]).font = BLUE; rt.cell(r, 4, CPVC_W[80][i]).font = BLUE
        for k in (1, 3, 4): rt.cell(r, k).fill = YEL
    B.name('r_cpvcOD', rt, f'$A${r0+2}:$A${r0+10}'); B.name('r_cpvcWall', rt, f'$C${r0+2}:$D${r0+10}')
    # ---- Standards
    sd = B.sheet('Standards', [20, 26, 100]); title(sd, 'Sizes and ratings covered'); hdr(sd, 4, ['Family', 'Standard', 'Outside diameters (mm) and rating to enter'])
    for i, (f, (s, ods, rt_)) in enumerate(STD.items(), 5):
        sd.cell(i, 1, f); sd.cell(i, 2, s); c = sd.cell(i, 3, ', '.join(str(o) for o in ods) + '.  Rating: ' + rt_); c.alignment = Alignment(wrap_text=True, vertical='top'); sd.row_dimensions[i].height = 48
    # ---- Inputs
    ip = B.sheet('Inputs', [34, 16, 14, 14, 16, 4]); title(ip, 'Pipe lines', 'Enter up to 12 lines. Blank lines are ignored.')
    hdr(ip, 4, ['Description', 'Family', 'Outside diameter mm', 'Rating', 'Length required m'])
    dv = DataValidation(type='list', formula1='"HDPE PE100,PVC-U,PP-R,CPVC"', allow_blank=True); ip.add_data_validation(dv)
    for i in range(NL):
        r = 5 + i; ln = lines[i] if i < len(lines) else (None,) * 5
        for j, v in enumerate(ln, 1):
            c = ip.cell(r, j, v); c.fill = YEL; c.font = BLUE
        dv.add(ip.cell(r, 2))
    ip.cell(5 + NL + 1, 1, 'Rating: SDR number (HDPE, PP-R), pressure class in MPa (PVC-U), or 40 / 80 (CPVC schedule). See Standards.').font = Font(italic=True, color='6B7482')
    ip.cell(5 + NL + 3, 1, 'Line to break down on Summary (1-12)'); c = ip.cell(5 + NL + 3, 2, 1); c.fill = YEL; c.font = BLUE; B.name('i_pick', ip, f'$B${5+NL+3}')
    # ---- Calc
    ca = B.sheet('Calc', [5, 26, 12, 9, 9, 8, 8, 8, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 9, 8, 9, 10, 10, 10, 11, 11, 12]); title(ca, 'Working, line by line', 'Rs per metre unless the heading says otherwise.')
    heads = ['#', 'Description', 'Family', 'OD mm', 'Rating', 'Qty m', 'Wall mm', 'ID mm', 'Density', 'Area mm2', 'kg/m', 'Raw kg/m (incl. yield loss)', 'Compound Rs/kg', 'Raw material Rs/m', 'Scrap credit Rs/m', 'Conv. Rs/kg', 'Conversion Rs/m', 'Testing Rs/m', 'Base Rs/m', 'Margin %', 'Interest %', 'Load factor', 'Transport Rs/m', 'Total Rs/m', 'Rs per kg', 'Margin Rs/m', 'Interest Rs/m', 'Line value Rs']
    hdr(ca, 4, heads); ca.row_dimensions[4].height = 44
    for i in range(NL):
        r = 5 + i; ir = 5 + i; fam = f'C{r}'
        f = {1: f'={i+1}', 2: f'=IF(Inputs!A{ir}="","",Inputs!A{ir})', 3: f'=IF(Inputs!B{ir}="","",Inputs!B{ir})', 4: f'=IF(Inputs!C{ir}="","",Inputs!C{ir})', 5: f'=IF(Inputs!D{ir}="","",Inputs!D{ir})', 6: f'=IF(Inputs!E{ir}="",0,Inputs!E{ir})'}
        for k, v in f.items(): ca.cell(r, k, v)
        g = lambda tbl: f'INDEX({tbl},MATCH({fam},r_famList,0))'
        wall_raw = f'IF({fam}="CPVC",INDEX(r_cpvcWall,MATCH(D{r},r_cpvcOD,0),IF(E{r}=40,1,2)),IF({fam}="PVC-U",E{r}*D{r}/(2*r_stressPvc+E{r}),D{r}/E{r}))'
        E = {7: f'=IF({fam}="","",ROUNDUP(MAX({g("r_minWall")},{wall_raw})*10-0.000000001,0)/10)', 8: f'=IF({fam}="","",D{r}-2*G{r})', 9: f'=IF({fam}="","",{g("r_rho")})', 10: f'=IF({fam}="","",PI()/4*(D{r}^2-H{r}^2))', 11: f'=IF({fam}="","",J{r}*I{r}/1000)',
             12: f'=IF({fam}="","",K{r}*(1+r_yieldLoss))', 13: f'=IF({fam}="","",{g("r_resin")}*(1+{g("r_add")}))', 14: f'=IF({fam}="","",L{r}*M{r})', 15: f'=IF({fam}="","",-(L{r}-K{r})*M{r}*r_regrind)',
             16: f'=IF({fam}="","",({g("r_energy")}+{g("r_labour")}+{g("r_deprec")}+{g("r_other")})*(1+MAX(0,G{r}-10)*r_thickPct))', 17: f'=IF({fam}="","",K{r}*P{r})', 18: f'=IF({fam}="","",K{r}*(r_hydro+r_docs))', 19: f'=IF({fam}="","",N{r}+O{r}+Q{r}+R{r})',
             20: f'=IF({fam}="","",{g("r_margin")})', 21: f'=IF({fam}="","",r_intRate/12*r_months)', 22: f'=IF({fam}="","",IF(D{r}<=r_lf1max,r_lf1,IF(D{r}<=r_lf2max,r_lf2,r_lf3)))', 23: f'=IF({fam}="","",r_loading/(V{r}*1000)*L{r})',
             24: f'=IF({fam}="","",S{r}*(1+T{r})*(1+U{r})+W{r})', 25: f'=IF({fam}="","",X{r}/K{r})', 26: f'=IF({fam}="","",S{r}*T{r})', 27: f'=IF({fam}="","",S{r}*(1+T{r})*U{r})', 28: f'=IF({fam}="",0,X{r}*F{r})'}
        for k, v in E.items():
            c = ca.cell(r, k, v); c.number_format = {20: '0.0%', 21: '0.0%', 22: '0.00', 7: '0.0', 8: '0.0', 9: '0.00', 11: '0.000', 12: '0.000'}.get(k, INR2)
    # ---- Summary
    sm = B.sheet('Summary', [30, 14, 11, 9, 10, 10, 11, 11, 13, 16]); title(sm, 'Non-metallic pipes: summary')
    hdr(sm, 4, ['Description', 'Family', 'OD mm', 'Rating', 'Wall mm', 'kg/m', 'Rs per m', 'Rs per kg', 'Length m', 'Line value Rs'])
    for i in range(NL):
        r = 5 + i; c_ = 5 + i
        for k, (src, fmt) in enumerate([('B', '@'), ('C', '@'), ('D', '0.0'), ('E', '0.0##'), ('G', '0.0'), ('K', '0.000'), ('X', INR2), ('Y', INR2), ('F', INR), ('AB', INR)]):
            c = sm.cell(r, 1 + k, f'=IF(Calc!C{c_}="","",Calc!{src}{c_})'); c.number_format = fmt
    t = 5 + NL
    sm.cell(t, 1, 'BATCH TOTAL').font = BOLD; sm.cell(t, 9, f'=SUM(I5:I{t-1})').number_format = INR; c = sm.cell(t, 10, f'=SUM(J5:J{t-1})'); c.number_format = INR; c.font = BOLD; c.fill = OUT
    sm.cell(t + 1, 1, 'Batch value (Rs crore)'); sm.cell(t + 1, 10, f'=J{t}/10000000').number_format = '0.0000'
    sm.cell(t + 2, 1, 'Weighted average Rs per kg'); sm.cell(t + 2, 10, f'=IFERROR(J{t}/SUMPRODUCT(I5:I{t-1},F5:F{t-1}),0)').number_format = INR2
    b = t + 4; sm.cell(b, 1, 'Cost stack of one line').font = BOLD; sm.cell(b + 1, 1, '=IFERROR(INDEX(Calc!B5:B16,i_pick)&" · "&INDEX(Calc!C5:C16,i_pick)&" "&INDEX(Calc!D5:D16,i_pick)&" mm","Pick a filled line number on Inputs")')
    hdr(sm, b + 2, ['Component', 'Rs per m', 'Share'])
    pick = lambda col: f'INDEX(Calc!{col}5:{col}16,i_pick)'
    comp = [('Raw material, net of scrap credit', f'={pick("N")}+{pick("O")}'), ('Conversion', f'={pick("Q")}'), ('Testing and documentation', f'={pick("R")}'), ('Margin', f'={pick("Z")}'), ('Payment interest', f'={pick("AA")}'), ('Logistics', f'={pick("W")}')]
    for i, (lab, f) in enumerate(comp, b + 3):
        sm.cell(i, 1, lab); sm.cell(i, 2, f).number_format = INR2; sm.cell(i, 3, f'=B{i}/B{b+9}').number_format = '0.0%'
    sm.cell(b + 9, 1, 'Total per metre').font = BOLD; c = sm.cell(b + 9, 2, f'=SUM(B{b+3}:B{b+8})'); c.number_format = INR2; c.font = BOLD; c.fill = OUT; sm.cell(b + 9, 3, f'=B{b+9}/B{b+9}').number_format = '0.0%'
    sm.cell(b + 10, 1, 'Check against Calc'); sm.cell(b + 10, 2, f'=IF(ABS(B{b+9}-{pick("X")})<0.0001,"OK","MISMATCH")')
    sm.cell(b + 11, 1, 'Weight per metre (kg)'); sm.cell(b + 11, 2, f'={pick("K")}').number_format = '0.000'; sm.cell(b + 12, 1, 'Wall thickness (mm)'); sm.cell(b + 12, 2, f'={pick("G")}').number_format = '0.0'
    B.wb._sheets = [B.wb[n] for n in ['Read Me', 'Inputs', 'Summary', 'Calc', 'Rates', 'Standards']]
    B.wb.save(path)
if __name__ == '__main__': build_pp(LINES, sys.argv[1])
