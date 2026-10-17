# Builds site/regional-costs.js: labour, electricity, diesel and water by state and month.
# ILLUSTRATIVE: a handful of anchor points come from public pages (see "anchors"); everything else is an estimate to be replaced with real series.
import json, datetime
months = []; y, m = 2024, 3
while (y, m) <= (2026, 9):
    months.append(f'{y}-{m:02d}'); m += 1
    if m > 12: y, m = y + 1, 1
R = {  # code: name, zone, labour factor vs central Area A, electricity HT industrial effective Rs/kWh (FY26), April revision, water Rs/kL (FY26), diesel factor vs Delhi
 'MH': ('Maharashtra', 'West', 1.00, 9.0, 0.03, 45, 1.0276), 'GJ': ('Gujarat', 'West', 0.92, 7.2, 0.02, 28, 1.0323), 'TN': ('Tamil Nadu', 'South', 0.95, 8.0, 0.03, 60, 1.05),
 'KA': ('Karnataka', 'South', 0.98, 7.3, -0.01, 65, 1.03), 'TG': ('Telangana', 'South', 0.90, 7.6, 0.03, 55, 1.07), 'AP': ('Andhra Pradesh', 'South', 0.88, 7.2, 0.02, 40, 1.07),
 'KL': ('Kerala', 'South', 1.20, 7.4, 0.03, 35, 1.07), 'DL': ('Delhi', 'North', 1.12, 8.4, 0.03, 50, 1.00), 'HR': ('Haryana', 'North', 1.05, 7.8, 0.03, 30, 1.00),
 'PB': ('Punjab', 'North', 0.85, 7.1, 0.02, 20, 1.03), 'RJ': ('Rajasthan', 'North', 0.85, 8.0, 0.04, 35, 1.04), 'UP': ('Uttar Pradesh', 'North', 0.82, 7.9, 0.03, 22, 1.00),
 'UK': ('Uttarakhand', 'North', 0.90, 6.9, 0.03, 28, 1.00), 'MP': ('Madhya Pradesh', 'Central', 0.80, 7.2, 0.03, 25, 1.05), 'CG': ('Chhattisgarh', 'Central', 0.80, 6.6, 0.02, 18, 1.00),
 'OD': ('Odisha', 'East', 0.78, 6.2, 0.02, 16, 1.00), 'JH': ('Jharkhand', 'East', 0.80, 6.0, 0.02, 18, 1.00), 'WB': ('West Bengal', 'East', 0.80, 8.2, 0.03, 25, 1.03),
 'BR': ('Bihar', 'East', 0.75, 7.0, 0.02, 15, 1.04), 'AS': ('Assam', 'North-East', 0.75, 7.6, 0.03, 20, 1.03)}
CENTRAL_A = {'labour_unskilled': 827.0, 'labour_skilled': 976.0}   # Area A, from 1 Apr 2026; skilled is interpolated between the published semi-skilled and highly skilled rates
HALF_YEAR = 1.019   # assumed revision (Apr and Oct, linked to the consumer price index) per half-year
def revisions_after(mo):   # number of Apr/Oct boundaries between month mo and Apr 2026 (negative = before)
    yy, mm = map(int, mo.split('-')); idx = yy * 12 + mm - 1; ref = 2026 * 12 + 3
    def bounds(a, b): return sum(1 for t in range(a + 1, b + 1) if t % 12 in (3, 9))
    return bounds(idx, ref) if idx < ref else 0
def fy(mo):
    yy, mm = map(int, mo.split('-')); return yy if mm >= 4 else yy - 1   # financial year starting year
out = {}
for mo in months:
    out[mo] = {}
    for c, (name, zone, lf, el, g, wa, df) in R.items():
        n = revisions_after(mo); f = HALF_YEAR ** (-n)
        e = el * (1 + g) ** (fy(mo) - 2025); w = wa * 1.05 ** (fy(mo) - 2025)
        dl = 87.62 if mo < '2026-04' else 95.20
        out[mo][c] = {'labour_unskilled': round(CENTRAL_A['labour_unskilled'] * lf * f), 'labour_skilled': round(CENTRAL_A['labour_skilled'] * lf * f), 'electricity_ht': round(e, 2), 'diesel': round(dl * df, 2), 'water': round(w, 1)}
data = {'version': 1, 'currency': 'INR', 'updated': datetime.date.today().isoformat(), 'sample': True,
 'note': 'ILLUSTRATIVE regional cost series. Only the anchor points listed under "anchors" come from public pages; every other value is an estimate built from them (state factors, assumed April tariff revisions, assumed half-yearly wage revisions). Replace with real series (state minimum-wage notifications, regulator tariff orders, oil-company retail prices, water authority tariffs) and set "sample" to false.',
 'regions': {c: {'name': v[0], 'zone': v[1]} for c, v in R.items()},
 'series': {'labour_skilled': {'name': 'Labour, skilled (minimum wage)', 'unit': '₹/day', 'group': 'Labour', 'basis': 'Construction schedule, per day including variable dearness allowance'},
            'labour_unskilled': {'name': 'Labour, unskilled (minimum wage)', 'unit': '₹/day', 'group': 'Labour', 'basis': 'Construction schedule, per day including variable dearness allowance'},
            'electricity_ht': {'name': 'Electricity, HT industrial (effective)', 'unit': '₹/kWh', 'group': 'Utilities', 'basis': 'Energy plus fixed and demand charges per unit, with duty; indicative'},
            'diesel': {'name': 'Diesel (retail)', 'unit': '₹/litre', 'group': 'Utilities', 'basis': 'Retail pump price in the state capital or main city'},
            'water': {'name': 'Water, industrial supply', 'unit': '₹/kL', 'group': 'Utilities', 'basis': 'Industrial area or municipal tariff; indicative'}},
 'anchors': [
  {'what': 'Central-sphere construction minimum wage, Area A, unskilled ₹827 and highly skilled ₹1,094 per day from 1 Apr 2026', 'source': 'WageIndicator, central sphere construction table'},
  {'what': 'Diesel, Delhi ₹95.20/litre (late Jun 2026), Greater Mumbai ₹97.83 (Jul 2026), Ahmedabad ₹98.27', 'source': 'Business Today fuel-price pages'},
  {'what': 'HT industrial energy-charge ranges for FY26: Gujarat 5.8-6.5, Tamil Nadu 7.25-7.5, Maharashtra 7.0-8.5, Karnataka 6.5-7.5 ₹/kWh (the file adds fixed charges and duty)', 'source': 'Manufacturing-cost guide (unverified); check against state regulator tariff orders'}],
 'months': out}
js = '// Regional labour and utility costs for all should-cost dashboards. Edit this file (or use regional-costs.html) and reload.\n// "sample": true marks the numbers as ILLUSTRATIVE; see "note" and "anchors".\nwindow.REGIONAL_COSTS = ' + json.dumps(data, ensure_ascii=False, indent=0) + ';\n'
open('site/regional-costs.js', 'w').write(js); print(len(js) // 1024, 'KB', len(months), 'months', len(R), 'regions')
print(out['2026-09']['MH'], out['2024-03']['MH'])
