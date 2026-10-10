// Fire & life safety dashboards: water systems, detection & alarm, gas suppression, for the generic equipment UI.
import { waterDefault, computeWater, alarmDefault, computeAlarm, gasDefault, computeGas, HAZARD, AGENTS, pipeRate, diRate, NB, DI_K9, BOQ_TOTALS, WATER_DEFAULTS, ALARM_DEFAULTS, GAS_DEFAULTS } from './calc.js';
import { waterScene, alarmScene, gasScene, planSVG, plateDims } from './scenes.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const fmt = (v, d = 0) => (typeof v === 'number' ? Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }) : v ?? '–');
const PAL = ['#c27a2c', '#2563eb', '#0ea5a4', '#8b5cf6', '#e8b923', '#06b6d4', '#94a3b8', '#f59e0b', '#64748b', '#0f9d6b'];
const partsOf = (groups) => Object.entries(groups).filter(([, v]) => v > 0).map(([l, v], i) => ({ k: l, l, col: PAL[i % PAL.length], v }));
const KINDS = { water: 'Water systems', alarm: 'Detection & alarm', gas: 'Gas suppression' };

export function fireDefault() {
  const common = { sel: 0, unit: 'primary', qty: 1, view: '3d', btab: 'anatomy', editPrices: false };
  const w = waterDefault(), a = alarmDefault(), g = gasDefault();
  return { kind: 'water', water: { ...common, list: w.list }, alarm: { ...common, list: a.list }, gas: { ...common, list: g.list }, T: { water: w.T, alarm: a.T, gas: g.T } };
}
const flat = (obj, base, pred = () => true) => Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, `${base}.${k}`, pred) : typeof v === 'number' && pred(k) ? [[`${base}.${k}`, k, v]] : []));
const row = (path, label, v, un = '', scale = 1) => [label, path, v, 'any', scale, un];

/* ---------- shared tables ---------- */
function anatomy(r, h, noteTitle) {
  const { nf } = h; let run = 0; const wf = r.parts.map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
  const groups = [...new Set(r.lines.map((l) => l.group))];
  return `<div class="h3">${noteTitle}</div><p class="p">Every line is a quantity from the design rules times a unit rate. Rates marked <b>BOQ</b> are the supply-and-install rates of the sample data-centre BOQ; pipework is built bottom-up; pumps and gas systems are own assumptions.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>Item</th><th class="r">Qty</th><th>Unit</th><th class="r">Rate ₹</th><th class="r">Amount ₹</th><th>Basis</th></tr></thead><tbody>
    ${groups.map((g) => { const ls = r.lines.filter((l) => l.group === g), tot = ls.reduce((s, l) => s + l.amount, 0); return `<tr><td colspan="6" class="grp2"><b>${g}</b> ₹${nf(tot)} <span class="mut">${(tot / r.total * 100).toFixed(1)}%</span></td></tr>${ls.map((l) => `<tr><td>${l.label}</td><td class="r">${nf(l.qty, l.qty % 1 ? 1 : 0)}</td><td class="mut">${l.unit}</td><td class="r">${nf(l.rate, l.rate < 100 ? 1 : 0)}</td><td class="r">${nf(l.amount)}</td><td class="mut">${l.note || ''}</td></tr>`).join('')}`; }).join('')}</tbody></table></div>
    <div class="wf num" style="margin-top:18px">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / r.total) * 100}%;width:${Math.max((s.v / r.total) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}₹${nf(s.v)}</span></div>`).join('')}</div>`;
}
const benchTable = (modelRows, h) => { const { nf } = h; return `<div class="h3">Against the sample data-centre BOQ</div><p class="p">The sample BOQ prices a five-hall data centre. Quantities × rates give the totals in the last column. The first preset (“Data centre, sample BOQ basis”) is sized from that BOQ’s quantities; the model is not fitted to its totals.</p>
  <div class="scroll"><table class="t num"><thead><tr><th>Subsystem</th><th class="r">This model</th><th class="r">Sample BOQ</th><th class="r">Difference</th></tr></thead><tbody>${modelRows.map(([n, m, b]) => `<tr><td>${n}</td><td class="r">${m == null ? '–' : '₹' + nf(m, 2) + ' Cr'}</td><td class="r">₹${nf(b, 2)} Cr</td><td class="r">${m == null ? '–' : ((m / b - 1) * 100 > 0 ? '+' : '') + ((m / b - 1) * 100).toFixed(0) + '%'}</td></tr>`).join('')}</tbody></table></div>`; };

/* ---------- water ---------- */
const water = {
  key: 'water', units: { primary: { label: '₹/m² protected', dec: 0, fn: (v, r) => v / r.cfg.area }, head: { label: '₹/sprinkler head', dec: 0, fn: (v, r) => v / r.heads }, total: { label: '₹/system', dec: 0, fn: (v) => v } },
  compute: (st) => st.water.list.map((c) => { const r = computeWater(c, st.T.water); return r.error ? r : { ...r, parts: partsOf(r.groups) }; }),
  title: (r) => `${r.cfg.tag} · ${fmt(r.cfg.area)} m²`, meta: (r) => `${HAZARD[r.cfg.hazard].label} · ${r.cfg.floors} floors, ${r.cfg.height} m · ${r.heads.toLocaleString('en-IN')} heads · ${r.cfg.dc === 'Yes' ? 'data-centre layout (voids protected)' : 'standard layout'}`,
  metrics: (r) => [['Sprinkler heads', fmt(r.heads)], ['Pipework', `${fmt(r.branchLen)} m`], ['Design flow', `${fmt(r.sprQ)} + ${fmt(r.hydQ)} lpm`], ['Fire water', `${fmt(r.tankM3)} m³`]],
  scene: (r) => waterScene(r), section: (r) => { const { L, W } = plateDims(r.cfg.area, r.cfg.floors); return planSVG(r.cfg.tag, `Sprinkler layout · ${r.zones} zones · ${r.cfg.floors} floors`, L, W, Math.round(r.heads / r.cfg.floors), '#d1342b', [['Heads', fmt(r.heads)], ['Zones', `${r.zones} of ${fmt(r.cfg.zoneArea)} m²`], ['Risers', r.risers], ['Hydrants', `${r.internal} internal, ${r.external} external`], ['Pumps', `${r.kwSpr.toFixed(0)} / ${r.kwHyd.toFixed(0)} kW`]]); },
  left(st, r, h) {
    const c = st.water.list[st.water.sel], H = Object.entries(HAZARD);
    return `<div class="sec-h"><span class="step">1</span>Building</div>${h.slider('Protected floor area', 'area', c.area, 500, 100000, 500, 'm²')}${h.slider('Floors', 'floors', c.floors, 1, 30, 1, '')}${h.slider('Building height', 'height', c.height, 4, 120, 1, 'm')}
      <div class="label">Hazard class</div>${h.sel(H.map(([k, v]) => [k, v.label]), c.hazard, 'hazard')}
      <div class="label">Layout</div>${h.seg([['No', 'Standard'], ['Yes', 'Data centre (voids)']], c.dc, 'dc')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Zoning &amp; hydrants</div>${h.num('Area per zone', 'zoneArea', c.zoneArea, 100, 'm²')}${h.num('Pre-action packages', 'preAction', c.preAction, 1, 'nos')}${h.slider('Yard main length', 'yardMain', c.yardMain, 0, 5000, 50, 'm')}
      <div class="label">Yard main size</div>${h.seg([[100, 'DN 100'], [150, 'DN 150'], [200, 'DN 200']], c.yardDN, 'yardDN')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Scope</div><div class="two2"><div><div class="label">Fire pumps</div>${h.seg([['Yes', 'Yes'], ['No', 'No']], c.includePumps, 'includePumps')}</div><div><div class="label">RCC tank</div>${h.seg([['No', 'No'], ['Yes', 'Yes']], c.includeTank, 'includeTank')}</div></div>`;
  },
  rates(st) { const T = st.T.water; return [{ label: 'Steel pipe (ERW, heavy)', path: 'water.pipe.steelRate', value: T.pipe.steelRate, unit: '₹/kg', cid: 'erw_pipe', price: true }, { label: 'DI K9 pipe', path: 'water.pipe.diRate', value: T.pipe.diRate, unit: '₹/kg' }, { label: 'Sprinkler head, upright', path: 'water.rates.Sprinkler head, upright K80', value: T.rates['Sprinkler head, upright K80'], unit: '₹' }, { label: 'OS&Y gate valve 150', path: 'water.rates.OS&Y gate valve 150', value: T.rates['OS&Y gate valve 150'], unit: '₹' }, { label: 'Pre-action package', path: 'water.rates.Pre-action package (double interlock, N2)', value: T.rates['Pre-action package (double interlock, N2)'], unit: '₹' }, { label: 'Labour, 25 mm pipe', path: 'water.pipe.labourPerM.25', value: T.pipe.labourPerM[25], unit: '₹/m' }]; },
  isPricePath: (p) => /pipe\.steelRate/.test(p),
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, 'Bill of quantities built from the design rules')], ['pipes', 'Pipework check', (r, st, h) => pipesTab(r, st, h)], ['hyd', 'Hydraulics & pumps', (r, st, h) => hydTab(r, h)], ['bench', 'BOQ benchmark', (r, st, h) => benchTable([['Hydrant + sprinkler (water systems)', (r.total - (r.groups['Fire pumps'] || 0) - (r.groups['Fire water storage'] || 0)) / 1e7, BOQ_TOTALS['Hydrant system'] + BOQ_TOTALS['Sprinkler system']]], h)]],
  batchCols: [['Area m²', (c) => fmt(c.area), 1], ['Hazard', (c) => c.hazard], ['Heads', (c, r) => fmt(r.heads), 1], ['Pipe m', (c, r) => fmt(r.branchLen), 1], ['₹/m²', (c, r) => fmt(r.perM2), 1]],
  calcRows: (r) => [[['#', 'Demand'], ['Sprinkler density × area', `${r.hz.density} mm/min × ${r.hz.area} m²`], ['Inside hose allowance', `${r.hz.hose} lpm`], ['Sprinkler flow', `${fmt(r.sprQ)} lpm`], ['Hydrant flow', `${fmt(r.hydQ)} lpm`], ['Sprinkler pump head', `${fmt(r.hSpr)} m`], ['Hydrant pump head', `${fmt(r.hHyd)} m`], ['Sprinkler / hydrant pump power', `${r.kwSpr.toFixed(0)} / ${r.kwHyd.toFixed(0)} kW`], ['Fire water', `${fmt(r.tankM3)} m³`]], [['#', 'Quantities'], ['Heads', fmt(r.heads)], ['Branch & main pipe', `${fmt(r.branchLen)} m`], ['Zones / risers', `${r.zones} / ${r.risers}`], ['Internal / external hydrants', `${r.internal} / ${r.external}`], ['#', 'Cost'], ['Hardware', `₹${fmt(r.hardware)}`], ['Total', `₹${fmt(r.total)}`], ['Per m²', `₹${fmt(r.perM2)}`], ['Per head', `₹${fmt(r.perHead)}`]]],
  master: (st) => { const T = st.T.water; return [{ title: 'Unit rates (BOQ supply & install)', wide: true, rows: Object.entries(T.rates).map(([k, v]) => row(`water.rates.${k}`, k, v, '₹')) }, { title: 'Pipework, bottom-up', rows: [row('water.pipe.steelRate', 'Steel pipe rate', T.pipe.steelRate, '₹/kg'), row('water.pipe.diRate', 'DI pipe rate', T.pipe.diRate, '₹/kg'), row('water.pipe.supportRate', 'Hanger steel rate', T.pipe.supportRate, '₹/kg'), row('water.pipe.paintPerM2', 'Paint', T.pipe.paintPerM2, '₹/m²'), row('water.pipe.overheads', 'Contractor overheads', T.pipe.overheads, '%', 100), row('water.pipe.profit', 'Profit', T.pipe.profit, '%', 100), row('water.pipe.testingPct', 'Testing', T.pipe.testingPct, '%', 100)] },
    { title: 'Fittings % of pipe cost', rows: Object.entries(T.pipe.fittingsPct).map(([k, v]) => row(`water.pipe.fittingsPct.${k}`, `${k} mm`, v, '%', 100)) }, { title: 'Support steel, kg per m', rows: Object.entries(T.pipe.supportKgM).map(([k, v]) => row(`water.pipe.supportKgM.${k}`, `${k} mm`, v, 'kg/m')) }, { title: 'Labour, ₹ per m', rows: Object.entries(T.pipe.labourPerM).map(([k, v]) => row(`water.pipe.labourPerM.${k}`, `${k} mm`, v, '₹/m')) },
    { title: 'Layout rules', rows: [row('water.layout.branchPerHead', 'Pipe per sprinkler head', T.layout.branchPerHead, 'm'), row('water.layout.floorHeight', 'Floor height', T.layout.floorHeight, 'm'), row('water.layout.voidFactor', 'Void protection multiplier', T.layout.voidFactor, '×'), ...Object.entries(T.layout.sizeMix).map(([k, v]) => row(`water.layout.sizeMix.${k}`, `Share of pipe, ${k} mm`, v, '%', 100))] },
    { title: 'Hydrant rules', rows: flat(T.hydrant, 'water.hydrant').map(([p, k, v]) => row(p, k, v, '')) }, { title: 'Pumps', rows: flat(T.pumps, 'water.pumps').filter(([, k]) => !/^dieselCover$/.test(k)).map(([p, k, v]) => row(p, k, v, '')) }, { title: 'Allowances (share of hardware)', rows: [row('water.lump.design', 'Design and approvals', T.lump.design, '%', 100), row('water.lump.seismic', 'Seismic supports', T.lump.seismic, '%', 100), row('water.lump.testing', 'Testing and commissioning', T.lump.testing, '%', 100)] }]; },
  reset: (st) => { const d = waterDefault(); st.T.water = d.T; st.water.list = d.list; st.water.sel = 0; },
};
function pipesTab(r, st, h) {
  const { nf } = h, P = st.T.water.pipe, rows = NB.filter((n) => [25, 32, 40, 50, 65, 80, 100, 150].includes(n)).map((n) => pipeRate(n, P)), di = [80, 100, 150].map((n) => diRate(n, P));
  return `<div class="h3">Bottom-up pipe rates against the BOQ</div><p class="p">Weight of IS 1239 heavy-grade pipe × steel rate, plus fittings, hanger steel, paint and labour per metre, then testing, overheads and profit. The BOQ column is the contractor’s supply-and-install schedule rate, so a should-cost a few per cent below it is expected.</p>
    <div class="scroll"><table class="t num"><thead><tr><th>NB mm</th><th class="r">kg/m</th><th class="r">Pipe</th><th class="r">Fittings</th><th class="r">Supports</th><th class="r">Paint</th><th class="r">Labour</th><th class="r">Should-cost ₹/m</th><th class="r">BOQ ₹/m</th><th class="r">Gap</th></tr></thead><tbody>${rows.map((x) => `<tr><td>${x.nb}</td><td class="r">${x.kgM.toFixed(1)}</td><td class="r">${nf(x.pipe)}</td><td class="r">${nf(x.fit)}</td><td class="r">${nf(x.sup)}</td><td class="r">${nf(x.paint)}</td><td class="r">${nf(x.lab)}</td><td class="r"><b>${nf(x.rate)}</b></td><td class="r">${nf(x.boq)}</td><td class="r">${x.boq ? ((x.rate / x.boq - 1) * 100).toFixed(0) + '%' : ''}</td></tr>`).join('')}</tbody></table></div>
    <div class="h3" style="margin-top:20px">Ductile iron K9, buried</div><div class="scroll"><table class="t num"><thead><tr><th>DN mm</th><th class="r">kg/m</th><th class="r">Pipe</th><th class="r">Joints</th><th class="r">Coating</th><th class="r">Laying</th><th class="r">Should-cost ₹/m</th><th class="r">BOQ ₹/m</th></tr></thead><tbody>${di.map((x) => `<tr><td>${x.dn}</td><td class="r">${x.kgM.toFixed(1)}</td><td class="r">${nf(x.pipe)}</td><td class="r">${nf(x.joints)}</td><td class="r">${nf(x.coating)}</td><td class="r">${nf(x.laying)}</td><td class="r"><b>${nf(x.rate)}</b></td><td class="r">${nf(x.boq)}</td></tr>`).join('')}</tbody></table></div>`;
}
function hydTab(r, h) {
  const { nf } = h, row2 = (a, b, c) => `<tr><td>${a}</td><td class="r"><b>${b}</b></td><td class="mut">${c || ''}</td></tr>`;
  return `<div class="h3">Demand, pumps and storage</div><p class="p">Sprinkler demand = design density × design area + inside hose allowance (NFPA 13 / IS 15105 style). Hydrant demand is a fixed ${nf(r.hydQ)} lpm. Pump head adds the static height, the residual pressure at the remotest point and a friction allowance. Pumps and storage are own assumptions: replace them with the pump vendor’s selection.</p>
    <div class="scroll"><table class="t num"><tbody>${row2('Design density × area', `${r.hz.density} mm/min × ${r.hz.area} m²`, r.hz.label)}${row2('Sprinkler flow', `${nf(r.sprQ)} lpm`, 'incl. hose allowance ' + r.hz.hose + ' lpm')}${row2('Hydrant flow', `${nf(r.hydQ)} lpm`)}${row2('Sprinkler pump', `${nf(r.hSpr)} m · ${r.kwSpr.toFixed(0)} kW`)}${row2('Hydrant pump', `${nf(r.hHyd)} m · ${r.kwHyd.toFixed(0)} kW`)}${row2('Storage', `${nf(r.tankM3)} m³`, `${r.hz.minutes} min sprinkler + 60 min hydrant`)}</tbody></table></div>`;
}

/* ---------- alarm ---------- */
const alarm = {
  key: 'alarm', units: { primary: { label: '₹/m² protected', dec: 0, fn: (v, r) => v / r.cfg.area }, device: { label: '₹/device', dec: 0, fn: (v, r) => v / r.devices }, total: { label: '₹/system', dec: 0, fn: (v) => v } },
  compute: (st) => st.alarm.list.map((c) => { const r = computeAlarm(c, st.T.alarm); return r.error ? r : { ...r, parts: partsOf(r.groups) }; }),
  title: (r) => `${r.cfg.tag} · ${fmt(r.cfg.area)} m²`, meta: (r) => `${fmt(r.detectors)} detectors · ${r.loops} loops · ${r.panels} panel${r.panels > 1 ? 's' : ''}${r.assd ? ` · ${r.assd} air-sampling detectors` : ''}`,
  metrics: (r) => [['Devices', fmt(r.devices)], ['Detectors', fmt(r.detectors)], ['Loops / panels', `${r.loops} / ${r.panels}`], ['Cable', `${fmt(r.cable)} m`]],
  scene: (r) => alarmScene(r), section: (r) => { const { L, W } = plateDims(r.cfg.area, r.cfg.floors); return planSVG(r.cfg.tag, 'Detector layout (ceiling), call points and sounders', L, W, Math.round(r.smoke / r.cfg.floors / (1 + (r.cfg.voidLayers || 0))), '#2563eb', [['Detectors', fmt(r.detectors)], ['Call points', fmt(r.mcp)], ['Hooters', fmt(r.hooter)], ['Speakers', fmt(r.speakers)], ['Loops', r.loops]]); },
  left(st, r, h) {
    const c = st.alarm.list[st.alarm.sel];
    return `<div class="sec-h"><span class="step">1</span>Building</div>${h.slider('Protected floor area', 'area', c.area, 500, 100000, 500, 'm²')}${h.slider('Floors', 'floors', c.floors, 1, 30, 1, '')}
      <div class="label">Layout</div>${h.seg([['No', 'Standard'], ['Yes', 'Data centre (dense)']], c.dc, 'dc')}${h.slider('Void layers detected', 'voidLayers', c.voidLayers, 0, 2, 1, 'false floor / ceiling')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Air-sampling (ASSD)</div>${h.num('Hall area on air sampling', 'dcArea', c.dcArea, 100, 'm²')}
      <hr class="divider"><div class="sec-h"><span class="step">3</span>Panels</div><div class="label">Loops per panel</div>${h.seg([[2, '2-loop'], [4, '4-loop']], c.loopsPanel, 'loopsPanel')}`;
  },
  rates(st) { const R = st.T.alarm.rates; return ['Multi-sensor detector', 'Manual call point', 'Hooter cum strobe', 'FACP 4-loop', 'Fire survival cable, 1-5 mm² armoured', 'ASSD detector, 4-pipe 2000 m²'].map((k) => ({ label: k.replace(', 1.5 mm² armoured', ' 1.5 mm²'), path: `alarm.rates.${k}`, value: R[k], unit: '₹' })); },
  isPricePath: () => false,
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, 'Device schedule from the coverage rules')], ['count', 'Device counts', (r, st, h) => countTab(r, st, h)], ['bench', 'BOQ benchmark', (r, st, h) => benchTable([['Fire detection & alarm (panels, devices, cables)', (r.total - (r.groups['Air sampling smoke detection'] || 0) - (r.groups['Design & commissioning'] || 0)) / 1e7, BOQ_TOTALS['Fire detection & alarm']], ['Air sampling smoke detection', (r.groups['Air sampling smoke detection'] || 0) / 1e7, BOQ_TOTALS['Air sampling smoke detection']], ['Testing & commissioning', (r.groups['Design & commissioning'] || 0) / 1e7, BOQ_TOTALS['Testing & commissioning (FAPA, ASSD)']]], h)]],
  batchCols: [['Area m²', (c) => fmt(c.area), 1], ['Detectors', (c, r) => fmt(r.detectors), 1], ['Devices', (c, r) => fmt(r.devices), 1], ['Loops', (c, r) => r.loops, 1], ['₹/m²', (c, r) => fmt(r.perM2), 1]],
  calcRows: (r) => [[['#', 'Counts'], ['Smoke detectors', fmt(r.smoke)], ['Call points', fmt(r.mcp)], ['Hooters', fmt(r.hooter)], ['Speakers', fmt(r.speakers)], ['Addressable devices', fmt(r.devices)], ['Loops', r.loops], ['Panels', r.panels], ['Cable', `${fmt(r.cable)} m`], ['Air-sampling points', fmt(r.assdPoints)]], [['#', 'Cost'], ['Total', `₹${fmt(r.total)}`], ['Per m²', `₹${fmt(r.perM2)}`], ['Per device', `₹${fmt(r.perDevice)}`]]],
  master: (st) => { const T = st.T.alarm; return [{ title: 'Unit rates (BOQ supply & install)', wide: true, rows: Object.entries(T.rates).map(([k, v]) => row(`alarm.rates.${k}`, k, v, '₹')) }, { title: 'Coverage rules', rows: [...Object.entries(T.coverage).map(([k, v]) => row(`alarm.coverage.${k}`, k, v, k === 'monitor' || k === 'control' || k === 'isolator' ? 'per detector' : 'm² per device')), row('alarm.loopDevices', 'Devices per loop', T.loopDevices, ''), row('alarm.cablePerM2', 'Cable per m²', T.cablePerM2, 'm'), row('alarm.dcCableFactor', 'Data-centre cable factor', T.dcCableFactor, '×'), row('alarm.pointsPerDetector', 'Sampling points per detector', T.pointsPerDetector, ''), row('alarm.capillaryArea', 'Area per sampling point', T.capillaryArea, 'm²'), row('alarm.assdPipePerPoint', 'Sampling pipe per point', T.assdPipePerPoint, 'm')] }, { title: 'Allowances', rows: [row('alarm.design', 'Design and programming', T.design, '%', 100), row('alarm.commissioning', 'Testing and commissioning', T.commissioning, '%', 100)] }]; },
  reset: (st) => { const d = alarmDefault(); st.T.alarm = d.T; st.alarm.list = d.list; st.alarm.sel = 0; },
};
function countTab(r, st, h) {
  const { nf } = h;
  return `<div class="h3">How the devices are counted</div><p class="p">Smoke detectors at one per ${st.T.alarm.coverage.smoke} m² of ceiling, repeated for each protected void layer; call points, hooters and speakers by area, denser in data centres; modules per detector; loops at ${st.T.alarm.loopDevices} devices each. Air sampling points at one per ${st.T.alarm.capillaryArea} m² of hall on every layer.</p>
    <div class="scroll"><table class="t num"><tbody>${[['Smoke detectors', r.smoke], ['Call points', r.mcp], ['Hooter cum strobe', r.hooter], ['Speakers', r.speakers], ['Addressable devices in total', r.devices], ['Loops', r.loops], ['Panels', r.panels], ['Air-sampling detectors', r.assd], ['Air-sampling points', r.assdPoints]].map(([a, b]) => `<tr><td>${a}</td><td class="r"><b>${nf(b)}</b></td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- gas ---------- */
const gas = {
  key: 'gas', units: { primary: { label: '₹/m³ protected', dec: 0, fn: (v, r) => v / r.V }, total: { label: '₹/system', dec: 0, fn: (v) => v }, kg: { label: '₹/kg agent', dec: 0, fn: (v, r) => (r.ag.kind === 'inert' ? NaN : v / r.mass) } },
  compute: (st) => st.gas.list.map((c) => { const r = computeGas(c, st.T.gas); return r.error ? r : { ...r, parts: partsOf(r.groups) }; }),
  title: (r) => `${r.cfg.tag} · ${fmt(r.V)} m³`, meta: (r) => `${r.ag.label} · ${r.conc.toFixed(1)}% design concentration · ${r.cyl} × ${r.cylSize} L cylinders · ${r.nozzles} nozzles`,
  metrics: (r) => [['Agent', r.ag.kind === 'inert' ? `${fmt(r.mass)} m³ free gas` : `${fmt(r.mass)} kg`], ['Cylinders', `${r.cyl} × ${r.cylSize} L`], ['Nozzles', r.nozzles], ['₹ per m³', fmt(r.perM3)]],
  scene: (r, v) => gasScene(r, v === 'cut'), section: (r) => { const area = r.floor / r.cfg.rooms, L = Math.sqrt(area * 1.5), W = area / L; return planSVG(r.cfg.tag, `Total-flooding room plan · ${r.ag.label}`, L, W, r.nozzles, '#e8a42b', [['Agent', r.ag.kind === 'inert' ? `${fmt(r.mass)} m³` : `${fmt(r.mass)} kg`], ['Concentration', `${r.conc.toFixed(1)}%`], ['Cylinders', `${r.cyl} × ${r.cylSize} L`], ['Nozzles', r.nozzles], ['Rooms', r.cfg.rooms]]); },
  left(st, r, h) {
    const c = st.gas.list[st.gas.sel];
    return `<div class="sec-h"><span class="step">1</span>Room</div>${h.slider('Protected volume, per room', 'volume', c.volume, 30, 6000, 10, 'm³')}${h.slider('Ceiling height', 'height', c.height, 2.5, 8, 0.1, 'm', (v) => v.toFixed(1))}${h.slider('Identical rooms', 'rooms', c.rooms, 1, 10, 1, '')}
      <hr class="divider"><div class="sec-h"><span class="step">2</span>Agent</div><div class="label">Extinguishing agent</div>${h.sel(Object.keys(AGENTS).map((k) => [k, k]), c.agent, 'agent')}`;
  },
  rates(st) { const T = st.T.gas; return [{ label: 'Cylinder, 106 L', path: 'gas.cylinders.rate.106', value: T.cylinders.rate[106], unit: '₹' }, { label: 'Discharge nozzle', path: 'gas.nozzle.rate', value: T.nozzle.rate, unit: '₹' }]; },
  isPricePath: () => false,
  bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, 'Bill of quantities for the gas system')], ['agent', 'Agent calculation', (r, st, h) => agentTab(r, h)]],
  batchCols: [['Volume m³', (c) => fmt(c.volume), 1], ['Agent', (c, r) => r.ag.label], ['Agent kg', (c, r) => (r.ag.kind === 'inert' ? '–' : fmt(r.mass)), 1], ['Cylinders', (c, r) => `${r.cyl} × ${r.cylSize} L`, 1], ['₹/m³', (c, r) => fmt(r.perM3), 1]],
  calcRows: (r) => [[['#', 'Design'], ['Volume', `${fmt(r.V)} m³ (${r.cfg.rooms} room${r.cfg.rooms > 1 ? 's' : ''})`], ['Floor area', `${fmt(r.floor)} m²`], ['Design concentration', `${r.conc.toFixed(1)}%`], ['Specific vapour volume', `${r.sv.toFixed(4)} m³/kg`], ['Agent', r.ag.kind === 'inert' ? `${fmt(r.mass)} m³` : `${fmt(r.mass)} kg`], ['Cylinders', `${r.cyl} × ${r.cylSize} L`], ['Nozzles', r.nozzles]], [['#', 'Cost'], ['Direct', `₹${fmt(r.direct)}`], ['Total', `₹${fmt(r.total)}`], ['Per m³', `₹${fmt(r.perM3)}`]]],
  master: (st) => { const T = st.T.gas; return [{ title: 'Cylinders (rate by size, ₹)', rows: Object.entries(T.cylinders.rate).map(([k, v]) => row(`gas.cylinders.rate.${k}`, `${k} L`, v, '₹')) }, { title: 'Agent prices and design values', rows: [row('gas.tempC', 'Design room temperature', T.tempC, '°C'), row('gas.designMargin', 'Design concentration factor', T.designMargin, '×'), row('gas.altitudeFactor', 'Altitude correction', T.altitudeFactor, '×'), row('gas.inertCylRate', 'IG-541 cylinder', T.inertCylRate, '₹')] }, { title: 'Distribution and detection', rows: [...flat(T.nozzle, 'gas.nozzle').map(([p, k, v]) => row(p, `nozzle ${k}`, v, '')), ...flat(T.pipe, 'gas.pipe').map(([p, k, v]) => row(p, `pipe ${k}`, v, '')), ...flat(T.detection, 'gas.detection').map(([p, k, v]) => row(p, `detection ${k}`, v, ''))] }, { title: 'Allowances', rows: [row('gas.install', 'Installation', T.install, '%', 100), row('gas.design', 'Design', T.design, '%', 100), row('gas.commissioning', 'Door-fan test and commissioning', T.commissioning, '%', 100), row('gas.overheads', 'Overheads', T.overheads, '%', 100), row('gas.margin', 'Margin', T.margin, '%', 100)] }]; },
  reset: (st) => { const d = gasDefault(); st.T.gas = d.T; st.gas.list = d.list; st.gas.sel = 0; },
};
function agentTab(r, h) {
  const { nf } = h, ag = r.ag;
  return `<div class="h3">Agent quantity</div><p class="p">${ag.kind === 'clean' ? `Mass = volume ÷ specific vapour volume × C ÷ (100 − C), with C = ${r.conc.toFixed(1)}% and S = ${r.sv.toFixed(4)} m³/kg at the design temperature (NFPA 2001 form).` : ag.kind === 'inert' ? `Free gas = volume × ln(1 ÷ (1 − C)) with C = ${r.conc.toFixed(0)}% (IG-541 at 40%).` : 'Surface-fire flooding factor of 0.8 kg of CO₂ per m³ of room volume (NFPA 12).'} Every number here is an assumption: use the vendor’s hydraulic calculation for the final quantity.</p>
    <div class="scroll"><table class="t num"><tbody>${[['Volume', `${nf(r.V)} m³`], ['Design concentration', `${r.conc.toFixed(1)} %`], ['Agent', ag.kind === 'inert' ? `${nf(r.mass)} m³ free gas` : `${nf(r.mass)} kg`], ['Cylinders', `${r.cyl} × ${r.cylSize} L`], ['Nozzles', r.nozzles]].map(([a, b]) => `<tr><td>${a}</td><td class="r"><b>${b}</b></td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- composite ---------- */
const SUB = { water, alarm, gas };
let cur = 'water';
const K = () => SUB[cur];
export const fireDef = {
  key: 'mf', name: 'fire & life safety', ratesTitle: 'Key rates', qtyLabel: 'systems',
  get ratesNote() { return cur === 'water' ? 'Heads, valves and hydrant sets are the sample BOQ’s supply-and-install rates. Pipework is bottom-up. Pumps are own assumptions.' : cur === 'alarm' ? 'Device and cable rates are the sample BOQ’s supply-and-install rates; counts come from the coverage rules.' : 'Own model: agent, cylinder and nozzle rates are assumptions to be replaced with vendor quotes.'; },
  masterNote: 'Every rate and rule for the selected system, editable. Changes apply to all tabs and are kept in this browser.', resetLabel: 'Reset to defaults', calcNote: 'Quantities and costs for the selected system.',
  get sectionHint() { return 'Plan view with a representative grid'; },
  get views() { return cur === 'gas' ? [['section', 'Plan'], ['cut', 'Cutaway'], ['3d', '3D model']] : [['section', 'Plan'], ['3d', '3D model']]; },
  group: (st) => { cur = st.kind; return st[st.kind]; }, maxRows: () => 12,
  get units() { return K().units; },
  compute: (st) => { cur = st.kind; return K().compute(st); },
  title: (r, st) => K().title(r, st), meta: (r, st) => K().meta(r, st), pillOf: () => KINDS[cur], metrics: (r) => K().metrics(r),
  scene: (r, v, st) => K().scene(r, v, st), section: (r, st) => K().section(r, st),
  left(st, r, h) {
    cur = st.kind; const g = st[st.kind], toggle = `<div class="toggle2" style="grid-template-columns:repeat(3,1fr)">${Object.entries(KINDS).map(([v, l]) => `<button data-mset="$kind" data-mv='"${v}"' class="${st.kind === v ? 'on' : ''}" style="font-size:11.5px;padding:8px 2px">${l}</button>`).join('')}</div>`;
    return `${toggle}<div class="label">System <small>${g.list.length} in batch</small></div>${h.sel(g.list.map((x, i) => [i, `${i + 1}. ${x.tag}`]), g.sel, `$${st.kind}.sel`)}${h.tag(g.list[g.sel].tag)}<hr class="divider">${K().left(st, r, h)}`;
  },
  rates: (st) => K().rates(st), isPricePath: (p) => K().isPricePath(p),
  get bottom() { return K().bottom; }, batchTitle: () => `${KINDS[cur]} · batch`, get batchCols() { return K().batchCols; },
  calcRows: (r, st) => K().calcRows(r, st), master: (st) => K().master(st), reset: (st) => { for (const k of Object.keys(SUB)) SUB[k].reset(st); },
  afterEdit: (st) => { const g = st[st.kind]; if (g.sel >= g.list.length) g.sel = 0; },
};
