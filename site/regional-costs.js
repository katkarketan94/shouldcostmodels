// Regional labour and utility costs for all should-cost dashboards. Edit this file (or use regional-costs.html) and reload.
// "sample": true marks the numbers as ILLUSTRATIVE; see "note" and "anchors".
window.REGIONAL_COSTS = {
"version": 1,
"currency": "INR",
"updated": "2026-10-17",
"sample": true,
"note": "ILLUSTRATIVE regional cost series. Only the anchor points listed under \"anchors\" come from public pages; every other value is an estimate built from them (state factors, assumed April tariff revisions, assumed half-yearly wage revisions). Replace with real series (state minimum-wage notifications, regulator tariff orders, oil-company retail prices, water authority tariffs) and set \"sample\" to false.",
"regions": {
"MH": {
"name": "Maharashtra",
"zone": "West"
},
"GJ": {
"name": "Gujarat",
"zone": "West"
},
"TN": {
"name": "Tamil Nadu",
"zone": "South"
},
"KA": {
"name": "Karnataka",
"zone": "South"
},
"TG": {
"name": "Telangana",
"zone": "South"
},
"AP": {
"name": "Andhra Pradesh",
"zone": "South"
},
"KL": {
"name": "Kerala",
"zone": "South"
},
"DL": {
"name": "Delhi",
"zone": "North"
},
"HR": {
"name": "Haryana",
"zone": "North"
},
"PB": {
"name": "Punjab",
"zone": "North"
},
"RJ": {
"name": "Rajasthan",
"zone": "North"
},
"UP": {
"name": "Uttar Pradesh",
"zone": "North"
},
"UK": {
"name": "Uttarakhand",
"zone": "North"
},
"MP": {
"name": "Madhya Pradesh",
"zone": "Central"
},
"CG": {
"name": "Chhattisgarh",
"zone": "Central"
},
"OD": {
"name": "Odisha",
"zone": "East"
},
"JH": {
"name": "Jharkhand",
"zone": "East"
},
"WB": {
"name": "West Bengal",
"zone": "East"
},
"BR": {
"name": "Bihar",
"zone": "East"
},
"AS": {
"name": "Assam",
"zone": "North-East"
}
},
"series": {
"labour_skilled": {
"name": "Labour, skilled (minimum wage)",
"unit": "₹/day",
"group": "Labour",
"basis": "Construction schedule, per day including variable dearness allowance"
},
"labour_unskilled": {
"name": "Labour, unskilled (minimum wage)",
"unit": "₹/day",
"group": "Labour",
"basis": "Construction schedule, per day including variable dearness allowance"
},
"electricity_ht": {
"name": "Electricity, HT industrial (effective)",
"unit": "₹/kWh",
"group": "Utilities",
"basis": "Energy plus fixed and demand charges per unit, with duty; indicative"
},
"diesel": {
"name": "Diesel (retail)",
"unit": "₹/litre",
"group": "Utilities",
"basis": "Retail pump price in the state capital or main city"
},
"water": {
"name": "Water, industrial supply",
"unit": "₹/kL",
"group": "Utilities",
"basis": "Industrial area or municipal tariff; indicative"
}
},
"anchors": [
{
"what": "Central-sphere construction minimum wage, Area A, unskilled ₹827 and highly skilled ₹1,094 per day from 1 Apr 2026",
"source": "WageIndicator, central sphere construction table"
},
{
"what": "Diesel, Delhi ₹95.20/litre (late Jun 2026), Greater Mumbai ₹97.83 (Jul 2026), Ahmedabad ₹98.27",
"source": "Business Today fuel-price pages"
},
{
"what": "HT industrial energy-charge ranges for FY26: Gujarat 5.8-6.5, Tamil Nadu 7.25-7.5, Maharashtra 7.0-8.5, Karnataka 6.5-7.5 ₹/kWh (the file adds fixed charges and duty)",
"source": "Manufacturing-cost guide (unverified); check against state regulator tariff orders"
}
],
"months": {
"2024-03": {
"MH": {
"labour_unskilled": 753,
"labour_skilled": 888,
"electricity_ht": 8.48,
"diesel": 90.04,
"water": 40.8
},
"GJ": {
"labour_unskilled": 693,
"labour_skilled": 817,
"electricity_ht": 6.92,
"diesel": 90.45,
"water": 25.4
},
"TN": {
"labour_unskilled": 715,
"labour_skilled": 844,
"electricity_ht": 7.54,
"diesel": 92.0,
"water": 54.4
},
"KA": {
"labour_unskilled": 738,
"labour_skilled": 871,
"electricity_ht": 7.45,
"diesel": 90.25,
"water": 59.0
},
"TG": {
"labour_unskilled": 677,
"labour_skilled": 800,
"electricity_ht": 7.16,
"diesel": 93.75,
"water": 49.9
},
"AP": {
"labour_unskilled": 662,
"labour_skilled": 782,
"electricity_ht": 6.92,
"diesel": 93.75,
"water": 36.3
},
"KL": {
"labour_unskilled": 903,
"labour_skilled": 1066,
"electricity_ht": 6.98,
"diesel": 93.75,
"water": 31.7
},
"DL": {
"labour_unskilled": 843,
"labour_skilled": 995,
"electricity_ht": 7.92,
"diesel": 87.62,
"water": 45.4
},
"HR": {
"labour_unskilled": 790,
"labour_skilled": 933,
"electricity_ht": 7.35,
"diesel": 87.62,
"water": 27.2
},
"PB": {
"labour_unskilled": 640,
"labour_skilled": 755,
"electricity_ht": 6.82,
"diesel": 90.25,
"water": 18.1
},
"RJ": {
"labour_unskilled": 640,
"labour_skilled": 755,
"electricity_ht": 7.4,
"diesel": 91.12,
"water": 31.7
},
"UP": {
"labour_unskilled": 617,
"labour_skilled": 728,
"electricity_ht": 7.45,
"diesel": 87.62,
"water": 20.0
},
"UK": {
"labour_unskilled": 677,
"labour_skilled": 800,
"electricity_ht": 6.5,
"diesel": 87.62,
"water": 25.4
},
"MP": {
"labour_unskilled": 602,
"labour_skilled": 711,
"electricity_ht": 6.79,
"diesel": 92.0,
"water": 22.7
},
"CG": {
"labour_unskilled": 602,
"labour_skilled": 711,
"electricity_ht": 6.34,
"diesel": 87.62,
"water": 16.3
},
"OD": {
"labour_unskilled": 587,
"labour_skilled": 693,
"electricity_ht": 5.96,
"diesel": 87.62,
"water": 14.5
},
"JH": {
"labour_unskilled": 602,
"labour_skilled": 711,
"electricity_ht": 5.77,
"diesel": 87.62,
"water": 16.3
},
"WB": {
"labour_unskilled": 602,
"labour_skilled": 711,
"electricity_ht": 7.73,
"diesel": 90.25,
"water": 22.7
},
"BR": {
"labour_unskilled": 565,
"labour_skilled": 666,
"electricity_ht": 6.73,
"diesel": 91.12,
"water": 13.6
},
"AS": {
"labour_unskilled": 565,
"labour_skilled": 666,
"electricity_ht": 7.16,
"diesel": 90.25,
"water": 18.1
}
},
"2024-04": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-05": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-06": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-07": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-08": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-09": {
"MH": {
"labour_unskilled": 767,
"labour_skilled": 905,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 706,
"labour_skilled": 833,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 729,
"labour_skilled": 860,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 752,
"labour_skilled": 887,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 675,
"labour_skilled": 797,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 920,
"labour_skilled": 1086,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 859,
"labour_skilled": 1014,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 805,
"labour_skilled": 950,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 652,
"labour_skilled": 769,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 629,
"labour_skilled": 742,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 690,
"labour_skilled": 815,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 598,
"labour_skilled": 706,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 614,
"labour_skilled": 724,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 575,
"labour_skilled": 679,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-10": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-11": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2024-12": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2025-01": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2025-02": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2025-03": {
"MH": {
"labour_unskilled": 782,
"labour_skilled": 922,
"electricity_ht": 8.74,
"diesel": 90.04,
"water": 42.9
},
"GJ": {
"labour_unskilled": 719,
"labour_skilled": 849,
"electricity_ht": 7.06,
"diesel": 90.45,
"water": 26.7
},
"TN": {
"labour_unskilled": 743,
"labour_skilled": 876,
"electricity_ht": 7.77,
"diesel": 92.0,
"water": 57.1
},
"KA": {
"labour_unskilled": 766,
"labour_skilled": 904,
"electricity_ht": 7.37,
"diesel": 90.25,
"water": 61.9
},
"TG": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.38,
"diesel": 93.75,
"water": 52.4
},
"AP": {
"labour_unskilled": 688,
"labour_skilled": 812,
"electricity_ht": 7.06,
"diesel": 93.75,
"water": 38.1
},
"KL": {
"labour_unskilled": 938,
"labour_skilled": 1107,
"electricity_ht": 7.18,
"diesel": 93.75,
"water": 33.3
},
"DL": {
"labour_unskilled": 875,
"labour_skilled": 1033,
"electricity_ht": 8.16,
"diesel": 87.62,
"water": 47.6
},
"HR": {
"labour_unskilled": 821,
"labour_skilled": 969,
"electricity_ht": 7.57,
"diesel": 87.62,
"water": 28.6
},
"PB": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 6.96,
"diesel": 90.25,
"water": 19.0
},
"RJ": {
"labour_unskilled": 664,
"labour_skilled": 784,
"electricity_ht": 7.69,
"diesel": 91.12,
"water": 33.3
},
"UP": {
"labour_unskilled": 641,
"labour_skilled": 756,
"electricity_ht": 7.67,
"diesel": 87.62,
"water": 21.0
},
"UK": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 6.7,
"diesel": 87.62,
"water": 26.7
},
"MP": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.99,
"diesel": 92.0,
"water": 23.8
},
"CG": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 6.47,
"diesel": 87.62,
"water": 17.1
},
"OD": {
"labour_unskilled": 610,
"labour_skilled": 719,
"electricity_ht": 6.08,
"diesel": 87.62,
"water": 15.2
},
"JH": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 5.88,
"diesel": 87.62,
"water": 17.1
},
"WB": {
"labour_unskilled": 625,
"labour_skilled": 738,
"electricity_ht": 7.96,
"diesel": 90.25,
"water": 23.8
},
"BR": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 6.86,
"diesel": 91.12,
"water": 14.3
},
"AS": {
"labour_unskilled": 586,
"labour_skilled": 692,
"electricity_ht": 7.38,
"diesel": 90.25,
"water": 19.0
}
},
"2025-04": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-05": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-06": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-07": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-08": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-09": {
"MH": {
"labour_unskilled": 796,
"labour_skilled": 940,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 733,
"labour_skilled": 865,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 757,
"labour_skilled": 893,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 781,
"labour_skilled": 921,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 701,
"labour_skilled": 827,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 956,
"labour_skilled": 1128,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 892,
"labour_skilled": 1053,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 836,
"labour_skilled": 987,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 677,
"labour_skilled": 799,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 653,
"labour_skilled": 771,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 717,
"labour_skilled": 846,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 621,
"labour_skilled": 733,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 637,
"labour_skilled": 752,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 597,
"labour_skilled": 705,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-10": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-11": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2025-12": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2026-01": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2026-02": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2026-03": {
"MH": {
"labour_unskilled": 812,
"labour_skilled": 958,
"electricity_ht": 9.0,
"diesel": 90.04,
"water": 45.0
},
"GJ": {
"labour_unskilled": 747,
"labour_skilled": 881,
"electricity_ht": 7.2,
"diesel": 90.45,
"water": 28.0
},
"TN": {
"labour_unskilled": 771,
"labour_skilled": 910,
"electricity_ht": 8.0,
"diesel": 92.0,
"water": 60.0
},
"KA": {
"labour_unskilled": 795,
"labour_skilled": 939,
"electricity_ht": 7.3,
"diesel": 90.25,
"water": 65.0
},
"TG": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 7.6,
"diesel": 93.75,
"water": 55.0
},
"AP": {
"labour_unskilled": 714,
"labour_skilled": 843,
"electricity_ht": 7.2,
"diesel": 93.75,
"water": 40.0
},
"KL": {
"labour_unskilled": 974,
"labour_skilled": 1149,
"electricity_ht": 7.4,
"diesel": 93.75,
"water": 35.0
},
"DL": {
"labour_unskilled": 909,
"labour_skilled": 1073,
"electricity_ht": 8.4,
"diesel": 87.62,
"water": 50.0
},
"HR": {
"labour_unskilled": 852,
"labour_skilled": 1006,
"electricity_ht": 7.8,
"diesel": 87.62,
"water": 30.0
},
"PB": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 7.1,
"diesel": 90.25,
"water": 20.0
},
"RJ": {
"labour_unskilled": 690,
"labour_skilled": 814,
"electricity_ht": 8.0,
"diesel": 91.12,
"water": 35.0
},
"UP": {
"labour_unskilled": 665,
"labour_skilled": 785,
"electricity_ht": 7.9,
"diesel": 87.62,
"water": 22.0
},
"UK": {
"labour_unskilled": 730,
"labour_skilled": 862,
"electricity_ht": 6.9,
"diesel": 87.62,
"water": 28.0
},
"MP": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 7.2,
"diesel": 92.0,
"water": 25.0
},
"CG": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.6,
"diesel": 87.62,
"water": 18.0
},
"OD": {
"labour_unskilled": 633,
"labour_skilled": 747,
"electricity_ht": 6.2,
"diesel": 87.62,
"water": 16.0
},
"JH": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 6.0,
"diesel": 87.62,
"water": 18.0
},
"WB": {
"labour_unskilled": 649,
"labour_skilled": 766,
"electricity_ht": 8.2,
"diesel": 90.25,
"water": 25.0
},
"BR": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.0,
"diesel": 91.12,
"water": 15.0
},
"AS": {
"labour_unskilled": 609,
"labour_skilled": 718,
"electricity_ht": 7.6,
"diesel": 90.25,
"water": 20.0
}
},
"2026-04": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
},
"2026-05": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
},
"2026-06": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
},
"2026-07": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
},
"2026-08": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
},
"2026-09": {
"MH": {
"labour_unskilled": 827,
"labour_skilled": 976,
"electricity_ht": 9.27,
"diesel": 97.83,
"water": 47.2
},
"GJ": {
"labour_unskilled": 761,
"labour_skilled": 898,
"electricity_ht": 7.34,
"diesel": 98.27,
"water": 29.4
},
"TN": {
"labour_unskilled": 786,
"labour_skilled": 927,
"electricity_ht": 8.24,
"diesel": 99.96,
"water": 63.0
},
"KA": {
"labour_unskilled": 810,
"labour_skilled": 956,
"electricity_ht": 7.23,
"diesel": 98.06,
"water": 68.2
},
"TG": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.83,
"diesel": 101.86,
"water": 57.8
},
"AP": {
"labour_unskilled": 728,
"labour_skilled": 859,
"electricity_ht": 7.34,
"diesel": 101.86,
"water": 42.0
},
"KL": {
"labour_unskilled": 992,
"labour_skilled": 1171,
"electricity_ht": 7.62,
"diesel": 101.86,
"water": 36.8
},
"DL": {
"labour_unskilled": 926,
"labour_skilled": 1093,
"electricity_ht": 8.65,
"diesel": 95.2,
"water": 52.5
},
"HR": {
"labour_unskilled": 868,
"labour_skilled": 1025,
"electricity_ht": 8.03,
"diesel": 95.2,
"water": 31.5
},
"PB": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 7.24,
"diesel": 98.06,
"water": 21.0
},
"RJ": {
"labour_unskilled": 703,
"labour_skilled": 830,
"electricity_ht": 8.32,
"diesel": 99.01,
"water": 36.8
},
"UP": {
"labour_unskilled": 678,
"labour_skilled": 800,
"electricity_ht": 8.14,
"diesel": 95.2,
"water": 23.1
},
"UK": {
"labour_unskilled": 744,
"labour_skilled": 878,
"electricity_ht": 7.11,
"diesel": 95.2,
"water": 29.4
},
"MP": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 7.42,
"diesel": 99.96,
"water": 26.2
},
"CG": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.73,
"diesel": 95.2,
"water": 18.9
},
"OD": {
"labour_unskilled": 645,
"labour_skilled": 761,
"electricity_ht": 6.32,
"diesel": 95.2,
"water": 16.8
},
"JH": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 6.12,
"diesel": 95.2,
"water": 18.9
},
"WB": {
"labour_unskilled": 662,
"labour_skilled": 781,
"electricity_ht": 8.45,
"diesel": 98.06,
"water": 26.2
},
"BR": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.14,
"diesel": 99.01,
"water": 15.8
},
"AS": {
"labour_unskilled": 620,
"labour_skilled": 732,
"electricity_ht": 7.83,
"diesel": 98.06,
"water": 21.0
}
}
}
};
