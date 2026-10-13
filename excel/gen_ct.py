import sys; sys.path.insert(0, '/tmp/claude-0/xl')
from gen import *

TYPES = [('Counterflow, induced draught, FRP', 'Film PVC', 1.05, 0.62, 14, 150, 'FRP', 700, 0), ('Crossflow, induced draught, FRP', 'Splash / low-clog film', 0.8, 0.58, 12, 110, 'FRP', 600, 0), ('Counterflow, induced draught, RCC', 'Film PVC', 1.05, 0.62, 14, 150, 'RCC', 3500, 0),
         ('Counterflow, induced draught, HDG steel', 'Film PVC', 1.05, 0.62, 14, 150, 'HDG steel', 1200, 0), ('Natural draught, hyperbolic (RCC)', 'Film PVC', 1.0, 0.6, 10, 0, 'RCC', 60000, 1)]
BANDS = {'Counterflow, induced draught, FRP': (4200, 7000), 'Crossflow, induced draught, FRP': (4500, 7500), 'Counterflow, induced draught, RCC': (1500, 2800), 'Counterflow, induced draught, HDG steel': (2400, 4200), 'Natural draught, hyperbolic (RCC)': (1200, 2500)}
PRESETS = [dict(tag='CT-01 1,000 TR chiller plant (FRP)', kw=3517, range=5, approach=4, wb=28, type=TYPES[0][0], vfd='No'), dict(tag='CT-02 3,000 TR plant (FRP, VFD)', kw=10551, range=5, approach=4, wb=28, type=TYPES[0][0], vfd='Yes'),
           dict(tag='CT-03 Process, steel (HDG)', kw=6000, range=8, approach=5, wb=27, type=TYPES[3][0], vfd='No'), dict(tag='CT-04 Power plant, RCC', kw=60000, range=10, approach=7, wb=28, type=TYPES[2][0], vfd='No'), dict(tag='CT-05 Small crossflow (FRP)', kw=800, range=5, approach=4.5, wb=28, type=TYPES[1][0], vfd='No')]

def build_ct(cfg, path):
    B = Book('Cooling tower')
    rm = B.sheet('Read Me', [26, 100]); title(rm, 'Cooling tower: should-cost model', 'Thermal sizing (Merkel number) and bottom-up costing of a mechanical or natural-draught cooling tower. Not a vendor price list: every rate is an editable assumption.')
    lines = [('Purpose', 'Estimate the ex-works price of a cooling tower from heat load, range, approach and design wet-bulb. The thermal duty sets the water flow; the Merkel number demanded by range, approach and wet-bulb sets the fill depth; the liquid-to-air ratio is chosen to give the cheapest fill-plus-fan combination; quantities then follow and are priced.'),
        ('How to use', 'Edit the yellow cells on Inputs (duty and tower type) and, if you have quotes, on Rates. Everything else is a live formula. Results are on Summary. The L/G scan is on Thermal; the priced build-up is on Costing.'),
        ('Sheets', 'Inputs: duty and type.  Summary: key results, cost stack, per-TR and per-m3/h figures, benchmark check.  Thermal: psychrometrics, Merkel integral and the L/G scan.  Costing: geometry, quantities, rates and amounts.  Rates: tower-type table, fill rates and every price and constant (named cells r_...).  Presets: five sample towers.'),
        ('Method', 'Merkel number by the four-point Chebyshev integral of 1/(h_sat - h_air) at 10, 40, 60 and 90% of the range. Fill characteristic KaV/L = c x (L/G)^-n per metre of fill, so depth = Merkel / (c x (L/G)^-n), clamped between the minimum and 2.2 x the maximum depth on Rates. The L/G scan runs from the minimum to the maximum on Rates in steps of 0.05.'),
        ('Conventions', 'Yellow fill = input.  Blue font = a typed assumption you may change.  Black = formula.  Green fill = key output.  Amounts in Indian rupees, ex-GST, ex-works.'),
        ('Reasonableness', 'At the default rates: FRP counterflow about Rs 4,700-5,200 per TR, HDG steel about Rs 3,000, RCC power-plant towers about Rs 1,900, small crossflow about Rs 6,500. The fill characteristic constants (c, n) are generic, not a vendor’s fill data: replace them with the manufacturer’s curves before relying on the fill depth.'),
        ('Limits', 'An approach below 2.8 K is not practical for a mechanical-draught tower and is flagged. Hot-water basin, pumps, piping, civil basin and electrical supply are excluded. Make-up water is shown, not costed.'),
        ('Companion', 'The same model runs in the Should-Cost dashboards (cooling-towers.html), with a section view, a 3D model and a month selector for steel prices.')]
    for i, (a, b) in enumerate(lines, 4):
        rm.cell(i, 1, a).font = BOLD; c = rm.cell(i, 2, b); c.alignment = Alignment(wrap_text=True, vertical='top'); rm.row_dimensions[i].height = 64
    # ---------------- Rates
    rt = B.sheet('Rates', [44, 22, 14, 12, 12, 12, 14, 12, 12]); title(rt, 'Rates and constants', 'Blue = assumption. Each value is a named cell (r_...).')
    row = [4]
    def sec(t):
        row[0] += 1; c = rt.cell(row[0], 1, t); c.font = BOLD
        for k in range(1, 10): rt.cell(row[0], k).fill = GREY
        row[0] += 1
    def P(nm, label, val, unit='', fmt=None):
        r = row[0]; rt.cell(r, 1, label); c = rt.cell(r, 2, val); c.font = BLUE; c.fill = YEL
        if fmt: c.number_format = fmt
        rt.cell(r, 3, unit); B.name('r_' + nm, rt, f'$B${r}'); row[0] += 1
    sec('Tower types')
    r0 = row[0]; hdr(rt, r0, ['Type', 'Fill', 'c (KaV/L per m)', 'n', 'Loading m3/h per m2', 'Fan dP Pa', 'Casing', 'Max cell m3/h', 'Natural (1)'])
    for i, t in enumerate(TYPES, r0 + 1):
        for j, v in enumerate(t, 1):
            c = rt.cell(i, j, v); c.font = BLUE; c.fill = YEL
    e = r0 + len(TYPES)
    for nm, col in [('tList', 'A'), ('tFill', 'B'), ('tC', 'C'), ('tN', 'D'), ('tLoad', 'E'), ('tDp', 'F'), ('tCasing', 'G'), ('tCell', 'H'), ('tNat', 'I')]: B.name('r_' + nm, rt, f'${col}${r0+1}:${col}${e}')
    row[0] = e + 1
    sec('Fill rates, installed')
    r0 = row[0]
    for i, (n, v) in enumerate([('Film PVC', 31000), ('Splash / low-clog film', 17000)]):
        rt.cell(r0 + i, 1, n); c = rt.cell(r0 + i, 2, v); c.font = BLUE; c.fill = YEL; c.number_format = INR; rt.cell(r0 + i, 3, 'Rs/m3')
    B.name('r_fillList', rt, f'$A${r0}:$A${r0+1}'); B.name('r_fillRate', rt, f'$B${r0}:$B${r0+1}'); row[0] = r0 + 2
    sec('Psychrometrics and L/G scan')
    P('pressure', 'Barometric pressure', 101.325, 'kPa'); P('lgMin', 'L/G scan minimum', 0.9); P('lgMax', 'L/G scan maximum', 2.1); P('lgStep', 'L/G step', 0.05); P('cpw', 'Specific heat of water', 4.186, 'kJ/kg K'); P('heatF', 'Heat to flow: kW per (m3/h x K)', 1.163); P('rhoAir', 'Air density at fan', 1.15, 'kg/m3'); P('meMax', 'Maximum Merkel number considered', 25)
    P('depthMin', 'Minimum fill depth', 0.9, 'm'); P('depthMax', 'Maximum fill depth', 1.8, 'm'); P('depthMult', 'Clamp multiple of maximum depth', 2.2, 'x'); P('fanProxy', 'Fan cost proxy in the L/G choice', 60000, 'Rs per shaft kW')
    sec('Fill, drift and distribution')
    P('eliminator', 'Drift eliminators', 2300, 'Rs/m2 plan'); P('distribution', 'Water distribution headers and nozzles', 4200, 'Rs/m2 plan'); P('louvre', 'Air-inlet louvres', 1900, 'Rs/m2 face'); P('faceAdd', 'Louvre height beyond fill depth', 0.6, 'm')
    sec('Casing, structure and basin')
    P('frpPerM2', 'FRP casing, panels, framing', 5200, 'Rs/m2'); P('basinFrp', 'Cold-water basin, FRP', 3600, 'Rs/m2 plan'); P('hdgRate', 'Hot-dip galvanised steel', 108, 'Rs/kg'); P('hdgKg', 'Steel per m2 plan at 8 m height', 85, 'kg/m2'); P('hdgRefH', 'Reference height for steel', 8, 'm'); P('basinSteel', 'Steel basin and sheeting', 70, 'kg/m2 plan'); P('basinSteelF', 'Basin steel price factor', 0.9, 'x')
    P('rccPerM3', 'RCC', 9800, 'Rs/m3'); P('rccM3', 'RCC per m2 plan', 0.55, 'm3/m2'); P('natRcc', 'Natural-draught shell factor', 3.2, 'x')
    P('hBase', 'Height: distribution, plenum and basin', 2.1, 'm'); P('hFan', 'Height: fan stack (mechanical)', 0.8, 'm'); P('hRcc', 'Height: extra for RCC', 1.0, 'm')
    sec('Fans and drives')
    P('fanEff', 'Fan efficiency', 0.62); P('velocity', 'Fan face velocity', 7.2, 'm/s'); P('fanBase', 'Fan cost: base', 42000, 'Rs'); P('fanExp', 'Fan cost: diameter exponent', 1.8); P('motorMargin', 'Motor margin on shaft kW', 1.15, 'x'); P('gearbox', 'Gearbox and drive shaft', 5200, 'Rs/kW'); P('motor', 'Fan motors, IE3', 4300, 'Rs/kW'); P('vfd', 'VFDs', 7500, 'Rs/kW')
    sec('Accessories and cost stack')
    P('accessories', 'Ladders, handrails, level and make-up controls', 90000, 'Rs/cell'); P('vib', 'Vibration switch', 28000, 'Rs/cell'); P('labour', 'Erection and assembly labour', 0.16, 'of material', '0.0%'); P('transport', 'Transport to site', 0.025, 'of material', '0.0%'); P('overheads', 'Overheads', 0.08, 'of direct', '0.0%'); P('margin', 'Margin', 0.08, 'of direct + overheads', '0.0%'); P('makeup', 'Make-up water factor', 0.00153, 'm3/h per (m3/h x K)')
    sec('Benchmark bands, Rs per TR')
    r0 = row[0]; hdr(rt, r0, ['Type', 'Low', 'High'])
    for i, t in enumerate(TYPES, r0 + 1):
        rt.cell(i, 1, t[0]); lo, hi = BANDS[t[0]]
        for j, v in ((2, lo), (3, hi)): c = rt.cell(i, j, v); c.font = BLUE; c.fill = YEL; c.number_format = INR
    B.name('r_bLo', rt, f'$B${r0+1}:$B${r0+5}'); B.name('r_bHi', rt, f'$C${r0+1}:$C${r0+5}')
    # ---------------- Inputs
    ip = B.sheet('Inputs', [40, 20, 20, 44]); title(ip, 'Cooling tower: duty and type')
    def I(r, label, val, unit='', nm=None, dv=None):
        ip.cell(r, 1, label); c = ip.cell(r, 2, val); c.fill = YEL; c.font = BLUE; ip.cell(r, 3, unit)
        if nm: B.name('i_' + nm, ip, f'$B${r}')
        if dv: d = DataValidation(type='list', formula1=dv, allow_blank=False); ip.add_data_validation(d); d.add(c)
    I(4, 'Tag / tower name', cfg['tag']); I(5, 'Heat rejected', cfg['kw'], 'kW', 'kw'); ip['D5'] = '=B5/3.517'; ip['D5'].number_format = '#,##0" TR"'
    I(6, 'Range (hot water - cold water)', cfg['range'], 'K', 'range'); I(7, 'Approach (cold water - wet-bulb)', cfg['approach'], 'K', 'approach'); I(8, 'Design wet-bulb', cfg['wb'], '°C', 'wb')
    I(9, 'Tower type', cfg['type'], '', 'type', f"=Rates!$A${TYPES and 7}:$A${7+len(TYPES)-1}"); I(10, 'Fan drive', cfg['vfd'], '', 'vfd', '"No,Yes"')
    ip['D9'] = 'pick from list'; ip['D10'] = 'No = direct on line, Yes = VFD'
    # ---------------- Thermal
    th = B.sheet('Thermal', [38, 12, 12, 12, 12, 12, 12, 12, 12, 12, 14, 12]); title(th, 'Thermal sizing', 'Duty, psychrometrics, Merkel integral and the L/G scan.')
    th['A3'] = 'Status'; th['B3'] = '=IF(i_approach<2.8,"Approach below 2.8 K: not practical for a mechanical-draught tower",IF(COUNT(K25:K49)=0,"No feasible L/G ratio for this duty","OK"))'; th['B3'].font = BOLD; B.name('t_status', th, '$B$3')
    def T_(r, label, f, nm=None, fmt='0.000'):
        th.cell(r, 1, label); c = th.cell(r, 2, f); c.number_format = fmt
        if nm: B.name('t_' + nm, th, f'$B${r}')
    T_(5, 'Cold water out', '=i_wb+i_approach', 'tOut', '0.00'); T_(6, 'Hot water in', '=t_tOut+i_range', 'tIn', '0.00'); T_(7, 'Water flow m3/h', '=i_kw/(r_heatF*i_range)', 'flow', '#,##0.0'); T_(8, 'Tower type row', '=MATCH(i_type,r_tList,0)', 'row', '0')
    T_(9, 'Fill characteristic c', '=INDEX(r_tC,t_row)', 'c'); T_(10, 'Fill exponent n', '=INDEX(r_tN,t_row)', 'n'); T_(11, 'Plan loading m3/h per m2', '=INDEX(r_tLoad,t_row)', 'load', '0.0'); T_(12, 'Natural draught?', '=INDEX(r_tNat,t_row)', 'nat', '0')
    T_(13, 'Plan area m2', '=t_flow/t_load', 'plan', '#,##0.0'); T_(14, 'Air enthalpy at wet-bulb (kJ/kg)', '=1.006*i_wb+0.622*(0.61078*EXP(17.27*i_wb/(i_wb+237.3)))/(r_pressure-0.61078*EXP(17.27*i_wb/(i_wb+237.3)))*(2501+1.86*i_wb)', 'hIn', '0.000')
    th.cell(16, 1, 'Chebyshev points').font = BOLD; hdr(th, 17, ['Point (fraction of range)', 'x', 'Water temp', 'Saturated enthalpy'])
    for k, x in enumerate([0.1, 0.4, 0.6, 0.9]):
        r = 18 + k; th.cell(r, 1, f'Point {k+1}'); th.cell(r, 2, x).font = BLUE; th.cell(r, 3, f'=t_tOut+B{r}*i_range').number_format = '0.00'
        th.cell(r, 4, f'=1.006*C{r}+0.622*(0.61078*EXP(17.27*C{r}/(C{r}+237.3)))/(r_pressure-0.61078*EXP(17.27*C{r}/(C{r}+237.3)))*(2501+1.86*C{r})').number_format = '0.000'
    th.cell(23, 1, 'L/G scan').font = BOLD
    hdr(th, 24, ['Step', 'L/G', 'Valid?', 'Sum 1/(hs - h)', 'Merkel demand', 'KaV/L per m', 'Fill depth m', 'Air kg/s', 'Air m3/s', 'Fan shaft kW', 'Cost proxy Rs', 'Fill m3'])
    # note: K column holds cost proxy; rows 22..46
    for k in range(25):
        r = 25 + k
        th.cell(r, 1, k); th.cell(r, 2, f'=r_lgMin+r_lgStep*A{r}').number_format = '0.00'
        th.cell(r, 3, f'=IF(B{r}<=r_lgMax+0.000000001,1,0)')
        th.cell(r, 4, '=' + '+'.join(f'IF($D${18+j}-(t_hIn+$B${18+j}*i_range*r_cpw*B{r})>0,1/($D${18+j}-(t_hIn+$B${18+j}*i_range*r_cpw*B{r})),1000000000)' for j in range(4)))
        th.cell(r, 5, f'=i_range*r_cpw/4*D{r}').number_format = '0.000'
        th.cell(r, 6, f'=t_c*B{r}^(-t_n)').number_format = '0.000'
        th.cell(r, 7, f'=E{r}/F{r}').number_format = '0.000'
        th.cell(r, 8, f'=t_flow*1000/3600/B{r}').number_format = INR2
        th.cell(r, 9, f'=H{r}/r_rhoAir').number_format = INR2
        th.cell(r, 10, f'=IF(t_nat=1,0,I{r}*INDEX(r_tDp,t_row)/(r_fanEff*1000))').number_format = INR2
        th.cell(r, 12, f'=t_plan*G{r}').number_format = INR2
        th.cell(r, 11, f'=IF(AND(C{r}=1,E{r}<=r_meMax),L{r}*INDEX(r_fillRate,MATCH(INDEX(r_tFill,t_row),r_fillList,0))+J{r}*r_fanProxy,"")').number_format = INR
    th.cell(51, 1, 'Selected L/G').font = BOLD
    def S_(r, label, f, nm, fmt='0.000'):
        th.cell(r, 1, label); c = th.cell(r, 2, f); c.number_format = fmt; B.name('t_' + nm, th, f'$B${r}')
    S_(52, 'Best step (first minimum cost)', '=MATCH(MIN(K25:K49),K25:K49,0)', 'best', '0'); S_(53, 'L/G', '=INDEX(B25:B49,t_best)', 'lg', '0.00'); S_(54, 'Merkel demand', '=INDEX(E25:E49,t_best)', 'me', '0.000'); S_(55, 'Fill depth before clamping m', '=INDEX(G25:G49,t_best)', 'depthRaw', '0.000')
    S_(56, 'Fill depth used m', '=MIN(MAX(t_depthRaw,r_depthMin),r_depthMax*r_depthMult)', 'depth', '0.000'); S_(57, 'Air m3/s', '=INDEX(I25:I49,t_best)', 'airM3s', '#,##0.0'); S_(58, 'Fan shaft kW (total)', '=INDEX(J25:J49,t_best)', 'fanKw', '#,##0.0'); S_(59, 'Fill volume m3', '=t_plan*t_depth', 'fillM3', '#,##0.0')
    th.freeze_panes = 'A25'
    # ---------------- Costing
    co = B.sheet('Costing', [48, 14, 12, 14, 16, 36]); title(co, 'Geometry and priced build-up', 'Quantities from the thermal sizing; rates from Rates.')
    def G_(r, label, f, nm, fmt='0.00'):
        co.cell(r, 1, label); c = co.cell(r, 2, f); c.number_format = fmt; B.name('g_' + nm, co, f'$B${r}')
    G_(4, 'Number of cells', '=MAX(1,ROUNDUP(t_flow/INDEX(r_tCell,t_row),0))', 'cells', '0'); G_(5, 'Plan area per cell m2', '=t_plan/g_cells', 'planCell'); G_(6, 'Cell side m', '=SQRT(g_planCell)', 'side'); G_(7, 'Height m', '=t_depth+r_hBase+IF(t_nat=1,0,r_hFan)+IF(INDEX(r_tCasing,t_row)="RCC",r_hRcc,0)', 'height')
    G_(8, 'Motor per cell kW', '=IF(t_nat=1,0,ROUNDUP(t_fanKw*r_motorMargin/g_cells*2,0)/2)', 'motorKw', '0.0'); G_(9, 'Fan diameter m', '=IF(t_nat=1,0,SQRT(4*(t_airM3s/g_cells)/(PI()*r_velocity)))', 'fanDia'); G_(10, 'Perimeter m (all cells)', '=4*g_side*g_cells', 'perim', '#,##0.0'); G_(11, 'Louvre face m2', '=g_perim*(t_depth+r_faceAdd)', 'face', '#,##0.0')
    G_(12, 'Casing', '=INDEX(r_tCasing,t_row)', 'casing', '@'); G_(13, 'Fill', '=INDEX(r_tFill,t_row)', 'fill', '@')
    hdr(co, 15, ['Item', 'Qty', 'Unit', 'Rate Rs', 'Amount Rs', 'Group'])
    items = [('Fill, installed', 't_fillM3', 'm3', 'INDEX(r_fillRate,MATCH(g_fill,r_fillList,0))', 'Fill & drift'), ('Drift eliminators', 't_plan', 'm2', 'r_eliminator', 'Fill & drift'), ('Water distribution headers and nozzles', 't_plan', 'm2', 'r_distribution', 'Fill & drift'),
             ('FRP casing, panels and framing', 'IF(g_casing="FRP",g_perim*g_height+t_plan,0)', 'm2', 'r_frpPerM2', 'Casing, structure & basin'), ('Cold-water basin, FRP', 'IF(g_casing="FRP",t_plan,0)', 'm2', 'r_basinFrp', 'Casing, structure & basin'),
             ('Hot-dip galvanised structure and casing', 'IF(g_casing="HDG steel",t_plan*r_hdgKg*(g_height/r_hdgRefH),0)', 'kg', 'r_hdgRate', 'Casing, structure & basin'), ('Steel basin and sheeting', 'IF(g_casing="HDG steel",t_plan*r_basinSteel,0)', 'kg', 'r_hdgRate*r_basinSteelF', 'Casing, structure & basin'),
             ('RCC shell, columns, fan deck and basin', 'IF(g_casing="RCC",t_plan*r_rccM3*IF(t_nat=1,r_natRcc,1),0)', 'm3', 'r_rccPerM3', 'Casing, structure & basin'), ('Air-inlet louvres', 'g_face', 'm2', 'r_louvre', 'Casing, structure & basin'),
             ('Axial fans (each)', 'IF(t_nat=1,0,g_cells)', 'nos', 'r_fanBase*g_fanDia^r_fanExp', 'Fans & drives'), ('Gearbox and drive shaft', 'g_motorKw*g_cells', 'kW', 'r_gearbox', 'Fans & drives'), ('Fan motors, IE3', 'g_motorKw*g_cells', 'kW', 'r_motor', 'Fans & drives'), ('VFDs', 'IF(i_vfd="Yes",g_motorKw*g_cells,0)', 'kW', 'r_vfd', 'Fans & drives'),
             ('Ladders, handrails, level and make-up controls', 'g_cells', 'cells', 'r_accessories', 'Accessories'), ('Vibration switches', 'g_cells', 'nos', 'r_vib', 'Accessories')]
    for i, (lab, q, u, rate, g) in enumerate(items, 16):
        co.cell(i, 1, lab); co.cell(i, 2, '=' + q).number_format = INR2; co.cell(i, 3, u); co.cell(i, 4, '=' + rate).number_format = INR; co.cell(i, 5, f'=B{i}*D{i}').number_format = INR; co.cell(i, 6, g).font = Font(color='6B7482', size=9)
    e = 15 + len(items); m = e + 1
    co.cell(m, 1, 'Material subtotal').font = BOLD; co.cell(m, 5, f'=SUM(E16:E{e})').number_format = INR
    co.cell(m + 1, 1, 'Erection and assembly labour'); co.cell(m + 1, 2, 1); co.cell(m + 1, 3, 'lot'); co.cell(m + 1, 4, f'=E{m}*r_labour').number_format = INR; co.cell(m + 1, 5, f'=B{m+1}*D{m+1}').number_format = INR; co.cell(m + 1, 6, 'Assembly & supply').font = Font(color='6B7482', size=9)
    co.cell(m + 2, 1, 'Transport to site'); co.cell(m + 2, 2, 1); co.cell(m + 2, 3, 'lot'); co.cell(m + 2, 4, f'=E{m}*r_transport').number_format = INR; co.cell(m + 2, 5, f'=B{m+2}*D{m+2}').number_format = INR; co.cell(m + 2, 6, 'Assembly & supply').font = Font(color='6B7482', size=9)
    co.cell(m + 3, 1, 'Direct cost').font = BOLD; co.cell(m + 3, 5, f'=E{m}+E{m+1}+E{m+2}').number_format = INR; D = m + 3
    co.cell(m + 4, 1, 'Overheads'); co.cell(m + 4, 5, f'=E{D}*r_overheads').number_format = INR; co.cell(m + 5, 1, 'Margin'); co.cell(m + 5, 5, f'=(E{D}+E{m+4})*r_margin').number_format = INR
    co.cell(m + 6, 1, 'SHOULD-COST, ex-works (Rs)').font = BOLD; c = co.cell(m + 6, 5, f'=E{D}+E{m+4}+E{m+5}'); c.number_format = INR; c.font = BOLD; c.fill = OUT; TOT = m + 6
    B.name('o_total', co, f'$E${TOT}'); co.freeze_panes = 'A16'
    # ---------------- Summary
    sm = B.sheet('Summary', [44, 20, 14, 46]); title(sm, 'Cooling tower: should-cost summary'); sm['A3'] = '=Inputs!B4'; sm['A3'].font = BOLD; sm['C3'] = '=t_status'; sm['C3'].font = Font(bold=True, color='C0392B')
    hdr(sm, 5, ['Cost group', 'Rs', 'Share', 'Note'])
    grp = lambda g: f'SUMIF(Costing!F16:F{e+3},"{g}",Costing!E16:E{e+3})'
    rows = [('Fill & drift', '=' + grp('Fill & drift'), 'Fill pack, eliminators, distribution'), ('Casing, structure & basin', '=' + grp('Casing, structure & basin'), 'Casing or shell, basin, louvres'), ('Fans & drives', '=' + grp('Fans & drives'), 'Fans, gearboxes, motors, VFDs'), ('Accessories', '=' + grp('Accessories'), 'Ladders, controls, vibration switches'),
            ('Assembly & supply', '=' + grp('Assembly & supply'), 'Erection and assembly labour, transport'), ('Overheads', f'=Costing!E{m+4}', ''), ('Margin', f'=Costing!E{m+5}', '')]
    for i, (lab, f, note) in enumerate(rows, 6):
        sm.cell(i, 1, lab); sm.cell(i, 2, f).number_format = INR; sm.cell(i, 4, note).font = Font(color='6B7482', size=9); sm.cell(i, 3, f'=B{i}/B$13').number_format = '0.0%'
    sm.cell(13, 1, 'SHOULD-COST, ex-works (Rs)').font = BOLD; c = sm.cell(13, 2, '=SUM(B6:B12)'); c.number_format = INR; c.font = BOLD; c.fill = OUT; sm.cell(13, 3, '=B13/B$13').number_format = '0.0%'
    sm.cell(14, 1, 'Check against Costing sheet'); sm.cell(14, 2, f'=IF(ABS(B13-Costing!E{TOT})<1,"OK","MISMATCH")')
    out = [('Should-cost (Rs crore)', '=B13/10000000', '0.000'), ('Rs per TR', '=B13/(i_kw/3.517)', INR), ('Rs per m3/h of water', '=B13/t_flow', INR), ('Heat rejected (TR)', '=i_kw/3.517', INR), ('Water flow (m3/h)', '=t_flow', INR), ('Hot / cold water (°C)', '=TEXT(t_tIn,"0.0")&" / "&TEXT(t_tOut,"0.0")', '@'),
           ('L/G ratio chosen', '=t_lg', '0.00'), ('Merkel number demanded', '=t_me', '0.000'), ('Fill depth (m)', '=t_depth', '0.00'), ('Plan area (m2)', '=t_plan', INR), ('Cells x cell side (m)', '=g_cells&" x "&TEXT(g_side,"0.0")&" m"', '@'), ('Height (m)', '=g_height', '0.0'), ('Fan shaft power, total (kW)', '=t_fanKw', INR), ('Motor per cell (kW)', '=g_motorKw', '0.0'), ('Fan diameter (m)', '=g_fanDia', '0.0'), ('Make-up water (m3/h)', '=t_flow*r_makeup*i_range', '0.0')]
    sm.cell(16, 1, 'Key results').font = BOLD
    for i, (lab, f, fmt) in enumerate(out, 17):
        sm.cell(i, 1, lab); c = sm.cell(i, 2, f); c.number_format = fmt
    bb = 17 + len(out) + 1
    sm.cell(bb, 1, 'Benchmark').font = BOLD; sm.cell(bb + 1, 1, 'Band for this type, Rs per TR'); sm.cell(bb + 1, 2, '=TEXT(INDEX(r_bLo,t_row),"#,##0")&" - "&TEXT(INDEX(r_bHi,t_row),"#,##0")')
    sm.cell(bb + 2, 1, 'This tower against the band'); sm.cell(bb + 2, 2, '=IF(B18<INDEX(r_bLo,t_row),"below",IF(B18>INDEX(r_bHi,t_row),"above","inside"))')
    sm.cell(bb + 3, 1, 'Approach check'); sm.cell(bb + 3, 2, '=IF(i_approach<3.5,"Approach under 3.5 K: fill depth and cost climb steeply","OK")')
    ps = B.sheet('Presets', [48, 12, 10, 10, 10, 40, 8]); title(ps, 'Sample towers (copy the values into Inputs)'); hdr(ps, 4, ['Tower', 'kW', 'Range K', 'Approach K', 'Wet-bulb', 'Type', 'VFD'])
    for i, p in enumerate(PRESETS, 5):
        for j, k in enumerate(['tag', 'kw', 'range', 'approach', 'wb', 'type', 'vfd'], 1): ps.cell(i, j, p[k])
    B.wb._sheets = [B.wb[n] for n in ['Read Me', 'Inputs', 'Summary', 'Thermal', 'Costing', 'Rates', 'Presets']]
    B.wb.save(path)
if __name__ == '__main__':
    out = sys.argv[1]
    for i, p in enumerate(PRESETS): build_ct(p, f'{out}/CT_{i}.xlsx')
