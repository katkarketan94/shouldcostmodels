// Busduct family: UI for the busduct cost model (Build Up, FY26 register, Calculations, Master Data).
import { BUSDUCT_DEFAULTS } from './dataBusduct.js';
import { computeBusduct, specLabel, sameSpec, VARIANTS, POLES } from './calcBusduct.js';
import { buildBusduct3D } from './busduct3d.js';
import { busductSectionSVG } from './busductSection.js';

const clone = (o) => JSON.parse(JSON.stringify(o));
const UNITS = { m: ['₹/m', 1], km: ['₹/km', 1000], ft: ['₹/ft', 0.3048] };
const VAR_SHORT = { 'Air Insulated (AIB)': 'Air insulated', 'Sandwich/Compact': 'Sandwich / compact', 'Fire Rated': 'Fire rated' };
const PARTS = [['conductor', 'Conductor', '#c27a2c'], ['insulation', 'Insulation', '#8b5cf6'], ['enclosure', 'Enclosure', '#64748b'], ['hardware', 'Hardware & support', '#0ea5a4'],
  ['labour', 'Labour', '#2563eb'], ['machinery', 'Machinery & conversion', '#06b6d4'], ['utilities', 'Power & utilities', '#f59e0b'], ['overheads', 'Overheads', '#94a3b8'], ['margin', 'Margin', '#0f9d6b']];

const glyph = (v) => {
  const s = 'fill="none" stroke="#5b6573" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const bars = { 'Air Insulated (AIB)': '<rect x="7" y="10" width="3" height="12"/><rect x="12" y="10" width="3" height="12"/><rect x="17" y="10" width="3" height="12"/><rect x="22" y="10" width="3" height="12"/>',
    'Sandwich/Compact': '<rect x="8" y="10" width="3" height="12" fill="#d64545" stroke="none"/><rect x="11" y="10" width="3" height="12" fill="#e8b923" stroke="none"/><rect x="14" y="10" width="3" height="12" fill="#3b6fd4" stroke="none"/><rect x="17" y="10" width="3" height="12" fill="#2a2d33" stroke="none"/><rect x="20" y="10" width="3" height="12" fill="#1f9d55" stroke="none"/>',
    'Fire Rated': '<rect x="8" y="10" width="3" height="12"/><rect x="13" y="10" width="3" height="12"/><rect x="18" y="10" width="3" height="12"/><path d="M16 3c2 3 4 4 4 7a4 4 0 01-8 0c0-2 1-2 2-4" stroke="#e11d48"/>' }[v];
  return `<svg viewBox="0 0 32 32" ${s}><rect x="3" y="6" width="26" height="20" rx="2"/>${bars}</svg>`;
};

export function busductDefault() {
  const T = clone(BUSDUCT_DEFAULTS);
  return { cfg: { amp: 2500, poles: '4P+E', conductor: 'Aluminium', variant: 'Sandwich/Compact', enclosure: 'GI Steel', sc: 65 }, T, scenario: 's1', unit: 'm', qty: 100, view: '3d', btab: 'anatomy', editPrices: false, more: false };
}

export function createBusductUI(ctx) {
  const { $, esc, nf, inr, pct, big, ICON, persist, vhost, sxhost } = ctx;
  const st = () => ctx.state().bd;
  const calc = (cfg = st().cfg) => computeBusduct(cfg, st().T);
  const rate = (v) => v * UNITS[st().unit][1];
  const money = (v) => inr(rate(v), st().unit === 'm' || st().unit === 'ft' ? 2 : 0);
  const seg = (items, cur, attr) => `<div class="seg block">${items.map(([v, l]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-${attr}="${esc(v)}">${l}</button>`).join('')}</div>`;
  const title = (c) => `${nf(c.amp)} A ${c.conductor === 'Copper' ? 'copper' : 'aluminium'} busduct`;
  const benchFor = (c) => { const s = st().T.specs.find((x) => sameSpec(x, c)); const b = s && st().T.bench[s.id]; return s ? { s, b } : null; };
  const scenarioPrice = (r) => r.scen[st().scenario].selling;

  function page() {
    $('#page').innerHTML = `<div class="grid">
      <aside class="card col-l" id="left"></aside>
      <section class="col-c">
        <div class="card" style="overflow:hidden"><div class="hero" id="hero-head"></div>
          <div class="viewer-wrap" id="vw"><div class="float tr" id="vtools"></div><div class="hint" id="vhint"></div></div>
          <div class="metrics" id="metrics"></div></div>
        <div class="card" id="bottom"></div>
      </section>
      <aside class="col-r"><div class="card sc" id="sc"></div><div class="card landed" id="landed"></div></aside></div>`;
    const vw = $('#vw'); vw.prepend(sxhost); vw.prepend(vhost);
    ctx.ensureViewer(); render();
  }
  function render(skipLeft) { const r = calc(); if (!skipLeft) left(); if (r.error) { $('#hero-head').innerHTML = `<div class="warn">${esc(r.error)}</div>`; return; } hero(r); right(r); bottom(r); viewer(r); }

  function left() {
    const c = st().cfg;
    $('#left').innerHTML = `
      <div class="sec-h"><span class="step">1</span>Variant</div>
      <div class="fam" style="grid-template-columns:repeat(3,1fr)">${VARIANTS.map((v) => `<button data-bvar="${esc(v)}" class="${c.variant === v ? 'on' : ''}">${glyph(v)}<span>${VAR_SHORT[v]}</span></button>`).join('')}</div>
      <hr class="divider">
      <div class="sec-h"><span class="step">2</span>Construction</div>
      <div class="label">Conductor</div>${seg([['Copper', 'Copper'], ['Aluminium', 'Aluminium']], c.conductor, 'bcond')}
      <div class="label">Rating <small>amps</small></div>
      <div class="chips">${st().T.tiers.map((x) => `<button class="chip ${c.amp === x.amp ? 'on' : ''}" data-bamp="${x.amp}">${nf(x.amp)}</button>`).join('')}</div>
      <div class="label">Poles</div>${seg(POLES.map((p) => [p, p]), c.poles, 'bpoles')}
      <div class="label">Short-circuit rating <small>kA / 1 s</small></div>${seg(Object.keys(st().T.scMult).map((k) => [+k, k + ' kA']), c.sc, 'bsc')}
      <div class="label">Enclosure</div>${seg([['GI Steel', 'GI steel'], ['Aluminium', 'Aluminium']], c.enclosure, 'benc')}`;
  }

  function hero(r) {
    const c = st().cfg;
    $('#hero-head').innerHTML = `<div class="hero-h"><div><h1>${title(c)} · ${esc(VAR_SHORT[c.variant])}</h1><div class="meta">${c.poles} · ${c.sc} kA / 1 s · ${c.enclosure === 'GI Steel' ? 'GI steel' : 'aluminium'} enclosure ${r.width} × ${r.height} mm, ${nf(r.effThk, 2)} mm sheet</div></div>
      <div class="spacer"></div><div class="seg">${[['section', 'Cross-section'], ['cut', 'Cutaway'], ['3d', '3D model']].map(([v, l]) => `<button data-bview="${v}" class="${st().view === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
    const share = r.cost.conductor / scenarioPrice(r);
    $('#metrics').innerHTML = [['Enclosure', `${r.width} × ${r.height} mm`], ['Weight', `${nf(r.weight, 1)} kg/m`], ['Conductor', `${nf(r.condWeight, 1)} kg/m`], ['Conductor share', pct(share)]]
      .map(([k, v]) => `<div class="metric"><small>${k}</small><b class="num">${v}</b></div>`).join('') + `<div class="metric"><button class="link" data-tab="calc">Details →</button></div>`;
  }

  function viewer(r) {
    const v = st().view, V = ctx.viewer();
    sxhost.classList.toggle('hide', v !== 'section'); vhost.classList.toggle('hide', v === 'section');
    if (v === 'section') sxhost.innerHTML = busductSectionSVG(r); else V.showGroup(buildBusduct3D(r, v === 'cut'), 'iso');
    $('#vtools').innerHTML = v === 'section' ? `<button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`
      : `<button class="iconbtn" data-act="spin" title="Auto-rotate">${ICON.spin}</button><button class="iconbtn" data-act="zin" title="Zoom in">${ICON.zin}</button><button class="iconbtn" data-act="zout" title="Zoom out">${ICON.zout}</button><button class="iconbtn" data-act="home" title="Reset view">${ICON.reset}</button><button class="iconbtn" data-act="full" title="Full screen">${ICON.full}</button>`;
    $('#vhint').textContent = v === 'section' ? 'Drawn from the enclosure tier and computed bar areas' : 'Drag to rotate · scroll to zoom';
    if (v !== 'section') V.resize();
  }

  function partsOf(r) {
    const sc = r.scen[st().scenario];
    return PARTS.map(([k, l, col]) => ({ k, l, col, v: k === 'margin' ? sc.margin : r.parts[k] })).filter((p) => p.v > 0);
  }

  function right(r) {
    const T = st().T, s = st().scenario, sel = r.scen[s], parts = partsOf(r), tot = sel.selling;
    const other = s === 's1' ? 's2' : 's1';
    $('#sc').innerHTML = `
      <div class="cap"><span>Should-cost · margin</span><div class="seg">${[['s1', `High ${pct(T.marginHigh, 0)}`], ['s2', `Low ${pct(T.marginLow, 0)}`]].map(([k, l]) => `<button data-bscen="${k}" class="${s === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="big num">${money(tot)}<small> ${UNITS[st().unit][0].replace('₹', '')}</small></div>
      <div class="qty num">${big(tot * st().qty)} for <input type="number" id="bqty" min="0" step="10" value="${st().qty}" aria-label="Length in metres"> m</div>
      <div class="stack">${parts.map((p) => `<i style="width:${(p.v / tot) * 100}%;background:${p.col}" title="${p.l}"></i>`).join('')}</div>
      <div class="break num">${parts.map((p) => `<div><span><span class="dot" style="background:${p.col}"></span>${p.l}</span><span class="v">${money(p.v)}<em>${pct(p.v / tot)}</em></span></div>`).join('')}</div>
      <div class="range"><div class="cap"><span>Negotiation range</span><span class="pill">${s === 's1' ? 'High' : 'Low'} margin selected</span></div>
        <div class="track"><i style="left:0;right:0"></i><b class="mk" style="left:${s === 's1' ? 100 : 0}%"></b></div>
        <div class="ends num"><span><small>Low · ${pct(T.marginLow, 0)} margin</small>${money(r.low)}</span><span style="text-align:right"><small>High · ${pct(T.marginHigh, 0)} margin</small>${money(r.high)}</span></div>
        <div class="note num" style="padding:8px 0 0">Spread ${money(r.high - r.low)} (${pct((r.high - r.low) / r.low)})</div></div>`;
    const P = T.prices, D = T.density, row = (l, key, step) => `<div class="lp"><b>${l}</b>${st().editPrices ? `<div class="ed"><input type="number" class="cell" data-bp="prices.${key}" value="${P[key]}" step="${step}" aria-label="${l}"> ₹/kg</div>` : `<div class="price num">${inr(P[key])}<small>/kg</small></div>`}</div>`;
    $('#landed').innerHTML = `<div class="hd"><b>Material prices <span style="color:var(--mute);font-weight:500">· Rs/kg</span></b><button class="iconbtn" id="bedit" title="Edit prices">${ICON.pencil}</button></div>
      ${row('Copper conductor', 'Copper', 10)}${row('Aluminium conductor', 'Aluminium', 1)}${row('GI sheet steel', 'GI Steel', 1)}${row('Aluminium sheet', 'Aluminium enclosure', 1)}
      <div class="note">${st().editPrices ? 'Edits re-cost every view instantly.' : `Densities, thickness factors and all percentages are on the Master Data tab.`}</div>`;
  }

  function bottom(r) {
    const tabs = `<div class="btabs"><button class="btab ${st().btab === 'anatomy' ? 'on' : ''}" data-bbtab="anatomy">Cost anatomy</button><button class="btab ${st().btab === 'bench' ? 'on' : ''}" data-bbtab="bench">FY26 benchmark</button></div>`;
    let body;
    const T = st().T, sel = r.scen[st().scenario];
    if (st().btab === 'anatomy') {
      const rows = [['Conductor', r.cfg.conductor, r.condWeight, r.cost.conductor], ['Insulation', `${pct(r.insulationPct, 0)} loading on conductor cost`, null, r.cost.insulation], ['Enclosure', `${r.cfg.enclosure === 'GI Steel' ? 'GI steel' : 'Aluminium'} sheet, ${nf(r.effThk, 2)} mm`, r.encWeight, r.cost.enclosure], ['Hardware & support', `${pct(T.hardwarePct, 0)} of conductor + enclosure`, null, r.cost.hardware]];
      let run = 0; const wf = partsOf(r).map((p) => { const s0 = run; run += p.v; return { ...p, s0 }; });
      body = `<div class="pad"><div class="h3">Material build-up · per metre</div><p class="p">Conductor area = amps ÷ current density for ${esc(VAR_SHORT[r.cfg.variant].toLowerCase())} ${r.cfg.conductor.toLowerCase()} (${r.currentDensity} A/mm²), times phases + neutral + earth.</p>
        <div class="scroll"><table class="t num"><thead><tr><th>Component</th><th>Basis</th><th class="r">Weight kg/m</th><th class="r">Cost ${UNITS[st().unit][0]}</th><th>Share of material</th></tr></thead><tbody>
        ${rows.map(([n, b, w, c]) => `<tr><td>${n}</td><td class="mut">${esc(b)}</td><td class="r">${w != null ? nf(w, 2) : '–'}</td><td class="r">${money(c)}</td><td><div class="bar"><i style="width:${(c / r.mat) * 100}%"></i></div></td></tr>`).join('')}
        <tr class="total"><td colspan="2">Material cost</td><td class="r">${nf(r.weight, 2)}</td><td class="r">${money(r.mat)}</td><td>100%</td></tr></tbody></table></div>
        <div class="h3" style="margin-top:22px">From material to selling price <span class="pill" style="margin-left:6px">${st().scenario === 's1' ? 'High' : 'Low'} margin</span></div><p class="p">Labour is ${pct(r.labourPct, 0)} of material for this variant; overheads ${pct(T.overheadsPct, 0)} of manufacturing cost; margin ${pct(sel.margPct, 0)} of total cost.</p>
        <div class="wf num">${wf.map((s) => `<div class="wf-row"><span><span class="dot" style="background:${s.col}"></span>${s.l}</span><div class="wf-track"><div class="wf-seg" style="left:${(s.s0 / sel.selling) * 100}%;width:${Math.max((s.v / sel.selling) * 100, 0.4)}%;background:${s.col}"></div></div><span style="text-align:right">${s.s0 ? '+ ' : ''}${money(s.v)}</span></div>`).join('')}
        <div class="wf-row" style="border-top:1px solid var(--line);padding-top:8px"><b>Selling price</b><div class="wf-track"><div class="wf-seg" style="left:0;width:100%;background:var(--ink)"></div></div><b style="text-align:right">${money(sel.selling)}</b></div></div></div>`;
    } else {
      const m = benchFor(r.cfg);
      if (m && m.b && m.b.qty > 0) {
        const actual = m.b.value / m.b.qty, v = sel.selling / actual - 1, ok = Math.abs(v) <= 0.05;
        body = `<div class="pad"><div class="h3">FY26 purchases · ${esc(m.s.id)}</div><p class="p">${esc(m.s.desc)} — the same specification as a row in the workbook's register.</p>
          <div class="tiles" style="margin-top:0"><div class="tile" style="border-style:solid"><small>Modelled (${st().scenario === 's1' ? 'high' : 'low'} margin)</small><b style="color:var(--ink)">${money(sel.selling)}</b></div><div class="tile" style="border-style:solid"><small>FY26 actual (value ÷ qty)</small><b style="color:var(--ink)">${money(actual)}</b></div><div class="tile" style="border-style:solid"><small>Variance</small><b style="color:${ok ? 'var(--good)' : '#b45309'}">${v > 0 ? '+' : ''}${(v * 100).toFixed(1)}%</b></div><div class="tile" style="border-style:solid"><small>FY26 bought</small><b style="color:var(--ink)">${nf(m.b.qty, 1)} m</b></div></div>
          <p class="note" style="margin-top:12px"><span class="pill">${ok ? 'Within ±5%' : 'Outside ±5%'}</span>&nbsp; ${esc(m.b.comment || '')}</p></div>`;
      } else {
        body = `<div class="pad"><div class="banner">${ICON.info}<div><b>${m ? 'No FY26 purchase for this specification.' : 'This combination is not in the workbook\'s specification register.'}</b> The FY26 spend file has ${Object.values(T.bench).filter((b) => b.qty > 0).length} specifications with purchases. Open the Register tab to see them side by side.</div></div></div>`;
      }
    }
    $('#bottom').innerHTML = tabs + body;
  }

  /* ---------- Register ---------- */
  function registerPage() {
    const T = st().T, s = st().scenario;
    const rows = T.specs.map((x, i) => { const r = calc(x), b = T.bench[x.id]; const actual = b && b.qty > 0 ? b.value / b.qty : null; return { x, i, r, b, actual, v: actual ? r.scen[s].selling / actual - 1 : null }; });
    const cmp = rows.filter((q) => q.v != null), okN = cmp.filter((q) => Math.abs(q.v) <= 0.05).length;
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Specification register · modelled vs FY26 purchases</div><div class="note" style="padding:0">Prices in ${UNITS[st().unit][0]} at ${s === 's1' ? 'high' : 'low'} margin. Click a row to open it in Build Up.</div></div><div class="spacer"></div>
      <div class="seg">${[['s1', 'High margin'], ['s2', 'Low margin']].map(([k, l]) => `<button data-bscen="${k}" class="${s === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div style="text-align:right"><small class="note" style="padding:0">Within ±5% of FY26</small><div class="num" style="font-weight:700;font-size:18px">${okN} of ${cmp.length}</div></div></div>
      <div class="scroll"><table class="t num"><thead><tr><th>Spec</th><th>Description</th><th class="r">Amp</th><th class="r">kA</th><th class="r">Modelled</th><th class="r">FY26 qty m</th><th class="r">FY26 actual</th><th class="r">Variance</th><th>±5%</th></tr></thead><tbody>
      ${rows.map(({ x, i, r, b, actual, v }, k) => `${k === 0 || rows[k - 1].x.group !== x.group ? `<tr><td colspan="9" style="background:#f6f8fb;font-weight:650;padding-top:12px">${esc(x.group)}</td></tr>` : ''}<tr class="click" data-bload="${i}"><td class="mut">${esc(x.id)}</td><td>${esc(x.desc)}</td><td class="r">${nf(x.amp)}</td><td class="r">${x.sc}</td><td class="r"><b>${r.error ? '–' : money(r.scen[s].selling)}</b></td><td class="r">${b && b.qty > 0 ? nf(b.qty, 1) : '–'}</td><td class="r">${actual ? money(actual) : '–'}</td><td class="r" style="color:${v == null ? 'inherit' : Math.abs(v) <= 0.05 ? 'var(--good)' : '#b45309'}">${v == null ? '–' : (v > 0 ? '+' : '') + (v * 100).toFixed(1) + '%'}</td><td>${v == null ? '' : Math.abs(v) <= 0.05 ? '<span class="pill">Yes</span>' : '<span class="soonpill">No</span>'}</td></tr>`).join('')}
      </tbody></table></div></div></div>`;
  }

  /* ---------- Calculations ---------- */
  const REF = { currentDensity: 15, phaseArea: 16, neutralRatio: 17, earthRatio: 18, totalArea: 19, condDensity: 20, condWeight: 21, width: 22, height: 23, perimeter: 24, baseThk: 25, scMult: 26, matFactor: 27, effThk: 28, encDensity: 29, encWeight: 30, condRate: 32, encRate: 36 };
  function calcPage() {
    const r = calc(), T = st().T;
    if (r.error) { $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card pad"><div class="warn">${esc(r.error)}</div></div></div>`; return; }
    const G = (n) => `<div class="grp">${n}</div>`, R = (k, v, row) => `<div class="k">${k} <span style="color:var(--mute);font-size:11px">${row ? '· Calculation row ' + row : ''}</span></div><div class="v">${v}</div>`;
    const s1 = r.scen.s1, s2 = r.scen.s2, p = r.parts;
    const left = G('Quantities') + R('Current density (A/mm²)', r.currentDensity, 15) + R('Phase cross-section (mm²)', nf(r.phaseArea, 1), 16) + R('Neutral ratio (× phase)', r.neutralRatio, 17) + R('Earth bar ratio (× phase)', r.earthRatio, 18) + R('Total conductor area (mm²)', nf(r.totalArea, 1), 19) + R('Conductor weight (kg/m)', nf(r.condWeight, 3), 21)
      + G('Enclosure') + R('Tier width × height (mm)', `${r.width} × ${r.height}`, '22–23') + R('Perimeter (mm)', r.perimeter, 24) + R('Base thickness (mm)', r.baseThk, 25) + R('Short-circuit multiplier', r.scMult, 26) + R('Material thickness factor', r.matFactor, 27) + R('Effective thickness (mm)', nf(r.effThk, 3), 28) + R('Enclosure weight (kg/m)', nf(r.encWeight, 3), 30);
    const right = G('Material (₹/m)') + R('Conductor', nf(r.cost.conductor, 2), 33) + R(`Insulation (${pct(r.insulationPct, 0)} of conductor)`, nf(r.cost.insulation, 2), 35) + R('Enclosure', nf(r.cost.enclosure, 2), 37) + R(`Hardware & support (${pct(T.hardwarePct, 0)})`, nf(r.cost.hardware, 2), 39) + R('Total material', nf(r.mat, 2), 40)
      + G('Conversion (₹/m)') + R(`Labour (${pct(r.labourPct, 0)} of material)`, nf(p.labour, 2), 43) + R('Machinery & conversion', nf(p.machinery, 2), 46) + R('Power & utilities', nf(p.utilities, 2), 50) + R(`Overheads (${pct(T.overheadsPct, 0)})`, nf(p.overheads, 2), 53) + R('Total cost', nf(r.total, 2), 54)
      + G('Selling price (₹/m)') + R(`Low margin (${pct(T.marginLow, 0)})`, nf(s2.selling, 2), 55) + R(`High margin (${pct(T.marginHigh, 0)})`, nf(s1.selling, 2), 56);
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:1fr"><div class="card"><div class="pad"><div class="h3">Calculation build-up · ${esc(specLabel(r.cfg))}</div><p class="p">Every step of the workbook's Calculation sheet for the current Build Up selection.</p><div class="two"><div class="kv">${left}</div><div class="kv">${right}</div></div></div></div></div>`;
  }

  /* ---------- Master data ---------- */
  const ni = (path, val, step = 'any', scale = 1) => `<input class="cell" type="number" step="${step}" data-bp="${path}" data-scale="${scale}" value="${+(val * scale).toFixed(6)}">`;
  function masterPage() {
    const T = st().T;
    const tbl = (title, rows) => `<div class="card pad"><div class="h3">${title}</div><table class="t num"><tbody>${rows.map(([l, path, v, step, scale, un]) => `<tr><td>${l}</td><td class="r">${ni(path, v, step, scale || 1)} <span class="mut">${un || ''}</span></td></tr>`).join('')}</tbody></table></div>`;
    $('#page').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">
      <div class="card pad wide" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div><div class="h3" style="margin:0">Master data · busduct</div><div class="note" style="padding:0">Every input on the workbook's Input sheet, editable here. Changes apply to all tabs and are kept in this browser.</div></div><div class="spacer"></div><button class="btn" id="breset">Reset to workbook values</button></div>
      ${tbl('Material prices', Object.entries(T.prices).map(([k, v]) => [k, `prices.${k}`, v, 1, 1, '₹/kg']))}
      ${tbl('Densities & design factors', [...Object.entries(T.density).map(([k, v]) => [`Density · ${k}`, `density.${k}`, v, 10, 1, 'kg/m³']), ['Aluminium enclosure thickness factor', 'alThicknessFactor', T.alThicknessFactor, 0.05, 1, '×'], ['Earth bar ratio', 'earthRatio', T.earthRatio, 0.05, 1, '× phase']])}
      ${tbl('Cost build-up', [['Hardware & support', 'hardwarePct', T.hardwarePct, 0.5, 100, '% of conductor + enclosure'], ['Machinery & conversion', 'machineryPct', T.machineryPct, 0.5, 100, '% of material'], ['Power & utilities', 'utilitiesPct', T.utilitiesPct, 0.5, 100, '% of direct cost'], ['Overheads', 'overheadsPct', T.overheadsPct, 0.5, 100, '% of manufacturing'], ['Margin · low scenario', 'marginLow', T.marginLow, 0.5, 100, '% of total cost'], ['Margin · high scenario', 'marginHigh', T.marginHigh, 0.5, 100, '% of total cost']])}
      <div class="card pad"><div class="h3">Current density · A/mm²</div><table class="t num"><thead><tr><th>Conductor · variant</th><th class="r">A/mm²</th></tr></thead><tbody>${Object.entries(T.currentDensity).map(([k, v]) => `<tr><td>${k.replace('|', ' · ')}</td><td class="r">${ni(`currentDensity.${k}`, v, 0.01)}</td></tr>`).join('')}</tbody></table></div>
      <div class="card pad"><div class="h3">Variant · insulation & labour</div><table class="t num"><thead><tr><th>Variant</th><th class="r">Insulation</th><th class="r">Labour</th></tr></thead><tbody>${Object.entries(T.variants).map(([k, v]) => `<tr><td>${k}</td><td class="r">${ni(`variants.${k}.insulation`, v.insulation, 0.5, 100)}%</td><td class="r">${ni(`variants.${k}.labour`, v.labour, 0.5, 100)}%</td></tr>`).join('')}</tbody></table>
        <div class="h3" style="margin-top:18px">Neutral ratio by poles</div><table class="t num"><tbody>${Object.entries(T.neutral).map(([k, v]) => `<tr><td>${k}</td><td class="r">${ni(`neutral.${k}`, v, 0.05)} <span class="mut">× phase</span></td></tr>`).join('')}</tbody></table>
        <div class="h3" style="margin-top:18px">Short-circuit thickness multiplier</div><table class="t num"><tbody>${Object.entries(T.scMult).map(([k, v]) => `<tr><td>${k} kA / 1 s</td><td class="r">${ni(`scMult.${k}`, v, 0.01)}</td></tr>`).join('')}</tbody></table></div>
      <div class="card pad wide"><div class="h3">Enclosure size and base thickness by rating (at 50 kA)</div><table class="t num"><thead><tr><th>Rating A</th><th class="r">Width mm</th><th class="r">Height mm</th><th class="r">Base thickness mm</th></tr></thead><tbody>${T.tiers.map((x, i) => `<tr><td>${nf(x.amp)}</td><td class="r">${ni(`tiers.${i}.width`, x.width, 1)}</td><td class="r">${ni(`tiers.${i}.height`, x.height, 1)}</td><td class="r">${ni(`tiers.${i}.thk`, x.thk, 0.1)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }

  /* ---------- events ---------- */
  const setPath = (path, v) => { const t = path.split('.'); let o = st().T; for (let i = 0; i < t.length - 1; i++) o = o[t[i]]; o[t[t.length - 1]] = v; };
  function onClick(e, t) {
    const d = t.dataset, c = st().cfg;
    if (d.bvar) { c.variant = d.bvar; return 'refresh'; }
    if (d.bcond) { c.conductor = d.bcond; return 'refresh'; }
    if (d.bamp) { c.amp = +d.bamp; return 'refresh'; }
    if (d.bpoles) { c.poles = d.bpoles; return 'refresh'; }
    if (d.bsc) { c.sc = +d.bsc; return 'refresh'; }
    if (d.benc) { c.enclosure = d.benc; return 'refresh'; }
    if (d.bscen) { st().scenario = d.bscen; return 'refresh'; }
    if (d.bview) { st().view = d.bview; persist(); render(true); return 'done'; }
    if (d.bbtab) { st().btab = d.bbtab; render(true); return 'done'; }
    if (d.unit) { st().unit = d.unit; return 'refresh'; }
    if (t.id === 'bedit') { st().editPrices = !st().editPrices; render(true); return 'done'; }
    if (t.id === 'breset') { st().T = clone(BUSDUCT_DEFAULTS); return 'refresh'; }
    if (d.bload !== undefined) { const s = st().T.specs[+d.bload]; st().cfg = { amp: s.amp, poles: s.poles, conductor: s.conductor, variant: s.variant, enclosure: s.enclosure, sc: s.sc }; return 'build'; }
    return null;
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'bqty') { st().qty = Math.max(0, +t.value || 0); persist(); const r = calc(); const q = $('#sc .qty'); if (q && !r.error) q.firstChild.textContent = big(scenarioPrice(r) * st().qty) + ' for '; return true; }
    return false;
  }
  function onChange(e) {
    const t = e.target, p = t.dataset.bp;
    if (p) { const v = parseFloat(t.value); if (Number.isNaN(v)) return 'done'; setPath(p, v / (+t.dataset.scale || 1)); return 'refresh'; }
    return null;
  }
  const pages = { build: page, batch: registerPage, calc: calcPage, master: masterPage };
  return { renderPage: (tab) => pages[tab](), render, onClick, onInput, onChange, tabs: [['build', 'Build Up'], ['batch', 'Register'], ['calc', 'Calculations'], ['master', 'Master Data']],
    units: Object.fromEntries(Object.entries(UNITS).map(([k, [l]]) => [k, l])), getUnit: () => st().unit };
}
