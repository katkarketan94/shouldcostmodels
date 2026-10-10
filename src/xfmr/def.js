// Transformer dashboards (power, distribution, dry-type) for the generic equipment UI. Every number comes from the workbooks via ./model.js.
import { runXfmr, seedConfigs, layout, TYPES, COLS, refTables, ieemaWeights } from './model.js';
import { xfmrScene } from './xfmr3d.js';
import { xfmrSectionSVG } from './xfmrSection.js';

const fmt = (v, d = 0) => (typeof v === 'number' ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : v ?? '–');
export function xfmrDefault() {
  const common = { sel: 0, unit: 'unit', qty: 1, view: 'cut', btab: 'anatomy', editPrices: false };
  return { kind: 'power', power: { ...common, list: seedConfigs('power') }, dist: { ...common, list: seedConfigs('dist') }, dry: { ...common, list: seedConfigs('dry') }, T: { power: { cells: {} }, dist: { cells: {} }, dry: { cells: {} } } };
}
const PARTS = [['A', 'Raw material', '#c27a2c'], ['B', 'Bought-out accessories & tests', '#2563eb'], ['C', 'Design & engineering', '#8b5cf6'], ['D', 'Labour', '#0ea5a4'], ['D2', 'Packing & documentation', '#94a3b8'], ['E', 'Overheads', '#64748b'], ['F', 'Profit margin', '#0f9d6b']];
const CID = [[/^Copper/, 'copper'], [/^Aluminium/, 'aluminium'], [/^CRGO/, 'crgo'], [/^(Mild steel|Steel)/, 'hr_plate'], [/^Pressboard/, 'pressboard'], [/oil/i, 'trafo_oil'], [/^Epoxy/, 'epoxy_resin']];
const cidOf = (label) => (CID.find(([re]) => re.test(label)) || [])[1];
const G = (st) => st[st.kind], rowOf = (L, re) => L.fieldsA.find((f) => re.test(f.label)).row;

export const xfmrDef = {
  key: 'mf', name: 'transformers', ratesTitle: 'Material prices · from the workbook', qtyLabel: 'units',
  ratesNote: 'The workbook’s material master. CRGO and the conductor premium are marked unverified in its Read Me, so confirm them with a core-cutter and a conductor quote.',
  masterNote: 'Section B prices, Section C design constants, the reference tables and the IEEMA weights, all from the workbook and editable. Changes apply to every tab and are kept in this browser.', resetLabel: 'Reset to workbook values',
  calcNote: 'The workbook’s Outputs sheet for this configuration, with the design cascade behind it.',
  sectionHint: 'Active part drawn from the solved design: core, windings, window and limb spacing',
  views: [['section', 'Active part'], ['cut', 'Cutaway'], ['3d', '3D model']],
  group: (st) => st[st.kind],
  maxRows: () => 5, allowBlank: true,
  tagKey: (st) => layout(st.kind).fieldsA[0].row,
  units: { unit: { label: '₹/unit', dec: 0, fn: (v) => v }, kva: { label: '₹/kVA', dec: 0, fn: (v, r) => v / r.ratingKva }, delivery: { label: '₹/unit at delivery', dec: 0, fn: (v, r) => (typeof r.pv === 'number' ? v * r.pv : v) } },
  compute(st) {
    const kind = st.kind, g = st[kind], res = runXfmr(kind, g.list, st.T[kind]);
    return res.map((r) => {
      if (r.error) return r;
      const f = typeof r.factor === 'number' ? r.factor : 1;
      return { ...r, kind, total: r.cal, parts: PARTS.map(([k, l, col]) => ({ k, l, col, v: (r[k] || 0) * f })) };
    });
  },
  title(r, st) { const L = layout(st.kind); const d = r.cfg[L.fieldsA[0].row]; return `${d || TYPES[st.kind].label} · ${fmt(r.ratingKva / 1000, r.ratingKva < 10000 ? 2 : 1)} MVA`; },
  meta(r, st) { const L = layout(st.kind), c = r.cfg; return `${r.phases === 1 ? 'Single phase' : 'Three phase'} · ${r.hvKv}/${r.lvKv} kV · ${c[rowOf(L, /^Tap changer/)] ?? ''} ±${c[rowOf(L, /^Tapping range/)] ?? 0}% · ${c[rowOf(L, /^Cooling/)] ?? ''} · ${c[rowOf(L, /^Conductor/)]}`; },
  pillOf: (r) => (typeof r.factor === 'number' && Math.abs(r.factor - 1) > 1e-9 ? `calibration ×${r.factor.toFixed(2)}` : 'engineering cost'),
  metrics: (r) => [['Weight', `${fmt(r.totalKg / 1000, 1)} t`], ['Size L×W×H (m)', `${r.boxL.toFixed(2)} × ${r.boxW.toFixed(2)} × ${r.boxH.toFixed(2)}`], ['Losses NLL / FLL', `${fmt(r.nllCalc / 1000, 1)} / ${fmt(r.fllCalc / 1000, 1)} kW`], ['Impedance', `${r.impFinal.toFixed(2)} %`]],
  scene: (r, view, st) => xfmrScene(r, st.kind, view === 'cut', layout(st.kind)),
  section: (r, st) => xfmrSectionSVG(r, st.kind, layout(st.kind)),

  left(st, r, h) {
    const k = st.kind, g = st[k], c = g.list[g.sel], L = layout(k), toggle = `<div class="toggle2" style="grid-template-columns:repeat(3,1fr)">${Object.entries(TYPES).map(([v, t]) => `<button data-mset="$kind" data-mv='"${v}"' class="${k === v ? 'on' : ''}" style="font-size:12px;padding:8px 4px">${t.label.replace(' transformer', '')}</button>`).join('')}</div>`;
    const pick = `<div class="label">Configuration <small>${g.list.length} of 5</small></div>${h.sel(g.list.map((x, i) => [i, `${i + 1}. ${x[L.fieldsA[0].row] || 'Configuration'}`]), g.sel, `$${k}.sel`)}`;
    const group = (f) => /^(Description|Quantity)/.test(f.label) ? 0 : /^(Rating|Phases|HV|LV)/.test(f.label) ? 1 : /^(Impedance|No-load|Load loss|Flux)/.test(f.label) ? 2 : /^(Reference|Calibration)/.test(f.label) ? 4 : 3;
    const widget = (f) => {
      const val = c[f.row], path = String(f.row), lab = `${f.label.replace(/\s*\((optional|guaranteed)\)/, '')}`;
      if (f.kind === 'list') return `<div class="label">${lab}</div>${f.list.length <= 3 ? h.seg(f.list.map((x) => [x, x]), val, path) : h.sel(f.list.map((x) => [x, x]), val, path)}`;
      if (f.kind === 'text') return `<div class="label">${lab}</div><input class="cell fw" type="text" data-mf="${path}" value="${(val ?? '').toString().replace(/"/g, '&quot;')}" aria-label="${lab}">`;
      const blank = /^Blank|optional|Blank →/i.test(f.note) || /optional|guaranteed|Impedance|Flux/i.test(f.label);
      return `<div class="label">${lab} <small>${f.unit}${blank ? ' · blank = default' : ''}</small></div><input class="cell fw" type="number" step="any" data-mf="${path}" data-num="1" value="${val ?? ''}" aria-label="${lab}">`;
    };
    const names = ['', 'Rating & voltage', 'Guarantees & design', 'Construction', 'Reference price & calibration'];
    let html = `${toggle}${pick}<hr class="divider">`;
    for (let gi = 0; gi <= 4; gi++) { const fs = L.fieldsA.filter((f) => group(f) === gi); if (!fs.length) continue; html += (gi ? `<hr class="divider"><div class="sec-h"><span class="step">${gi}</span>${names[gi]}</div>` : '') + fs.map(widget).join(''); }
    return html;
  },
  rates(st) {
    const L = layout(st.kind), T = st.T[st.kind].cells;
    return L.pricesB.map((p) => ({ label: p.label.replace(/\s*\(.*$/, ''), path: `${st.kind}.cells.Calculator!D${p.row}`, value: T[`Calculator!D${p.row}`] ?? p.value, unit: p.unit, cid: cidOf(p.label), price: true }));
  },
  isPricePath: (p) => /cells\.Calculator!D(\d+)$/.test(p) && (() => { const m = /!D(\d+)$/.exec(p); const k = p.split('.')[0]; return layout(k).pricesB.some((x) => x.row === +m[1]); })(),

  bottom: [
    ['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h)],
    ['design', 'Design cascade', (r, st, h) => design(r, h)],
    ['ieema', 'IEEMA price variation', (r, st, h) => ieema(r, st, h)],
    ['out', 'Workbook outputs', (r, st, h) => outputs(r, h)],
  ],
  batchTitle: (st) => `${TYPES[st.kind].label} configurations`,
  batchCols: [['MVA', (c, r) => fmt(r.ratingKva / 1000, r.ratingKva < 10000 ? 2 : 1), 1], ['HV/LV kV', (c, r) => `${r.hvKv}/${r.lvKv}`], ['Weight t', (c, r) => fmt(r.totalKg / 1000, 1), 1], ['Engineering ₹', (c, r) => fmt(r.eng), 1], ['Factor', (c, r) => (typeof r.factor === 'number' ? r.factor.toFixed(2) : '–'), 1]],
  calcRows(r, st) {
    const g = {}; for (const o of r.outputs) (g[o.group || 'Result'] ||= []).push(o);
    const cols = [[], []]; Object.entries(g).forEach(([name, items], i) => { const col = cols[i % 2 === 0 ? 0 : 1]; col.push(['#', name]); for (const o of items) col.push([`${o.label}${o.unit ? ` (${o.unit})` : ''}`, typeof o.v === 'number' ? fmt(o.v, Math.abs(o.v) < 100 ? 3 : 0) : (o.v === '' || o.v === null ? '–' : String(o.v))]); });
    return cols;
  },
  master(st) {
    const k = st.kind, L = layout(k), T = st.T[k].cells, out = [];
    const cell = (sheet, addr, v) => T[`${sheet}!${addr}`] ?? v, path = (sheet, addr) => `${k}.cells.${sheet}!${addr}`;
    out.push({ title: 'Section B · material prices', rows: L.pricesB.map((p) => [p.label, path('Calculator', `D${p.row}`), cell('Calculator', `D${p.row}`, p.value), 'any', 1, p.unit, p.note]) });
    out.push({ title: 'Section C · design and commercial constants', wide: true, rows: L.constsC.map((p) => [p.label, path('Calculator', `D${p.row}`), cell('Calculator', `D${p.row}`, p.value), 'any', /^%/.test(p.unit) || /% of/.test(p.unit) ? 100 : 1, p.unit, p.note]) });
    out.push({ title: 'IEEMA indices · base and delivery', rows: L.ieemaIdx.flatMap((x) => [[`${x.el} base · ${x.what}`, path('IEEMA', `D${x.row}`), cell('IEEMA', `D${x.row}`, x.base), 'any', 1, x.unit], [`${x.el} delivery`, path('IEEMA', `E${x.row}`), cell('IEEMA', `E${x.row}`, x.base), 'any', 1, x.unit]]) });
    out.push({ title: 'IEEMA weights (% of price)', rows: ieemaWeights(k).flatMap((w) => w.cells.map((c) => [`${w.label} · ${c.addr[0]}`, path('IEEMA', c.addr), cell('IEEMA', c.addr, c.v), 'any', 1, '%'])) });
    for (const t of refTables(k)) { const hdr = t.header || [], rows = t.rows.flatMap((cells) => { const key = cells[0].v; return cells.filter((x, i) => i > 0 && typeof x.v === 'number').map((x) => [`${key} · ${hdr[cells.indexOf(x)] ?? ''}`, path('Assumptions & Ref', x.addr), cell('Assumptions & Ref', x.addr, x.v), 'any', 1, '']); }); if (rows.length) out.push({ title: t.title, note: t.note, rows }); }
    return out;
  },
  reset(st) { const d = xfmrDefault(); st.T = d.T; for (const k of ['power', 'dist', 'dry']) { st[k].list = d[k].list; st[k].sel = 0; } },
  afterEdit(st) { const g = st[st.kind]; if (g.sel >= g.list.length) g.sel = 0; },
};

function anatomy(r, h) {
  const { nf, pct } = h, f = typeof r.factor === 'number' ? r.factor : 1;
  const sec = (title, tot, rows) => `<tr><td colspan="3" class="grp2"><b>${title}</b> ₹${nf(tot)}</td></tr>${rows.map((x) => `<tr><td>${x.label}</td><td class="r">₹${nf(x.v)}</td><td><div class="bar"><i style="width:${Math.min(100, x.v / tot * 100)}%"></i></div></td></tr>`).join('')}`;
  let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  return `<div class="h3">Engineering cost, then calibration</div><p class="p">Weights come from the solved design and are priced at the Section B rates; accessories and tests are priced by voltage class. ${f !== 1 ? `One factor (<b>×${f.toFixed(3)}</b>) then takes the engineering cost of ₹${nf(r.eng)} to the calibrated price of ₹${nf(r.cal)}: it is a diagnostic of how far the unverified rates and the reference price sit from the physics, not a discount.` : 'No calibration is applied, so the price is the engineering cost.'}</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Engineering ₹</th><th>Share</th></tr></thead><tbody>${sec('A · Raw material', r.A, r.raw)}${sec('B · Bought-out accessories & tests', r.B, r.bo)}
    <tr><td colspan="3" class="grp2"><b>C to F</b></td></tr>${[['C · Design & engineering', r.C], ['D · Labour', r.D], ['D2 · Packing & documentation', r.D2], ['E · Overheads', r.E], ['F · Profit margin', r.F]].map(([l, v]) => `<tr><td>${l}</td><td class="r">₹${nf(v)}</td><td><div class="bar"><i style="width:${v / r.eng * 100}%"></i></div></td></tr>`).join('')}
    <tr class="total"><td>Engineering should-cost</td><td class="r">₹${nf(r.eng)}</td><td></td></tr>${f !== 1 ? `<tr class="total"><td>Calibrated should-cost (× ${f.toFixed(3)})</td><td class="r">₹${nf(r.cal)}</td><td></td></tr>` : ''}</tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
function design(r, h) {
  const { nf } = h, row = (a, b, c) => `<tr><td>${a}</td><td class="r"><b>${b}</b></td><td class="mut">${c ?? ''}</td></tr>`;
  const chk = (g, c) => (typeof g === 'number' ? `${(c / g - 1 > 0 ? '+' : '')}${((c / g - 1) * 100).toFixed(1)}% vs guarantee` : 'no guarantee entered');
  return `<div class="h3">Solved design</div><p class="p">The workbook solves volts per turn until the computed reactance equals the impedance asked for, with the coil height set by a ratio to the core diameter. Status: <b>${r.solver}</b>.</p>
    <div class="scroll"><table class="t num"><tbody>${row('Impedance, target → computed', `${r.impTarget.toFixed(2)} → ${r.impFinal.toFixed(2)} %`)}${row('Volts per turn', `${nf(r.vpt, 1)} V`)}${row('Turns, HV / LV', `${nf(r.hvTurns)} / ${nf(r.lvTurns)}`)}${row('Current density', `${r.J.toFixed(2)} A/mm²`)}${row('Core circle diameter', `${r.coreD.toFixed(3)} m`)}${row('Coil height', `${r.coilH.toFixed(3)} m`)}${row('Winding radial build, LV / HV', `${(r.lvRad * 1000).toFixed(0)} / ${(r.hvRad * 1000).toFixed(0)} mm`)}${row('HV outer diameter', `${r.hvOut.toFixed(3)} m`)}${row('Limb centre distance', `${r.limbC.toFixed(3)} m`)}
    ${row('No-load loss, computed', `${nf(r.nllCalc)} W`, chk(r.nllUsed, r.nllCalc))}${row('Load loss, computed', `${nf(r.fllCalc)} W`, chk(r.fllUsed, r.fllCalc))}${typeof r.suggestedBm === 'number' ? row('Flux density to meet the no-load guarantee', `${r.suggestedBm.toFixed(3)} T`) : ''}
    ${row('Core (CRGO)', `${nf(r.coreKg)} kg`)}${row('Conductor', `${nf(r.condKg)} kg`)}${row('Insulation', `${nf(r.insKg)} kg`)}${r.resinKg ? row('Cast resin', `${nf(r.resinKg)} kg`) : ''}${r.oilKg ? row('Oil', `${nf(r.oilKg)} kg (${nf(r.oilL * 1000)} L)`) : ''}${r.enclKg ? row('Enclosure', `${nf(r.enclKg)} kg`) : ''}${row('Steel', `${nf(r.steelKg)} kg`)}${row('Total weight, excl. accessories', `${nf(r.totalKg / 1000, 1)} t`)}</tbody></table></div>`;
}
function ieema(r, st, h) {
  const { nf } = h, L = layout(st.kind), T = st.T[st.kind].cells;
  const idx = L.ieemaIdx.map((x) => { const e = T[`IEEMA!E${x.row}`] ?? x.base, b = T[`IEEMA!D${x.row}`] ?? x.base; return { ...x, e, b, ratio: b ? e / b : 1 }; });
  return `<div class="h3">Price at delivery</div><p class="p">IEEMA price variation: P = P0 ÷ den × (fixed + Σ weight × delivery index ÷ base index). The delivery indices follow the price-month selector at the top (or edit them on Master Data). This configuration: tender price ₹${nf(r.cal)} → <b>₹${nf(r.delivery)}</b> at delivery (${typeof r.pv === 'number' ? ((r.pv - 1) * 100).toFixed(2) + '% price variation' : 'n/a'}).</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Element</th><th>Index tracked</th><th class="r">Base</th><th class="r">Delivery</th><th class="r">Ratio</th></tr></thead><tbody>${idx.map((x) => `<tr><td>${x.el}</td><td class="mut">${x.what}</td><td class="r">${nf(x.b)}</td><td class="r">${nf(x.e)}</td><td class="r"><b>${x.ratio.toFixed(4)}</b></td></tr>`).join('')}</tbody></table></div>`;
}
function outputs(r, h) {
  const { nf } = h; let g = '';
  return `<div class="h3">Outputs sheet</div><div class="scroll"><table class="t num"><tbody>${r.outputs.map((o) => { const head = o.group !== g ? `<tr><td colspan="3" class="grp2"><b>${o.group}</b></td></tr>` : ''; g = o.group; return `${head}<tr><td>${o.label}</td><td class="mut">${o.unit}</td><td class="r"><b>${typeof o.v === 'number' ? nf(o.v, Math.abs(o.v) < 100 ? 3 : 0) : (o.v ?? '')}</b></td></tr>`; }).join('')}</tbody></table></div>`;
}
