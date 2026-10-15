// Page-definition factory for the capacity- and quantity-scaled equipment models (UPS, lighting, lifts, motors, compressors, tanks, valves, supports).
// A category supplies its calc (returning lines, pm, facts, metrics) and a small spec; the left panel, master data, tabs and batch table are generated here.
import { mkParts, anatomy, costRows, stackRows } from './kit.js';
const fmt = (v, d = 0) => Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
const label = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

// spec: { name, noun, qtyLabel, groups[], types?:{k:{label}}, fields(c, ty)->[{k,label,unit,step,sel,seg,when}], compute(c,T), rates(T,c), denoms:{k:[label,fn]}, batchCols, scene, section, intro, defaults(), extraTabs, notes }
export function makePkg(spec) {
  const PARTS = mkParts(spec.groups), typed = !!spec.types, tk = spec.typeKey || 'type';
  const flat = (o, base = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${base}${k}.`) : typeof v === 'number' ? [[`${base}${k}`, v]] : []));
  const def = {
    key: 'mf', name: spec.noun, ratesTitle: spec.ratesTitle || 'Rates', qtyLabel: spec.qtyLabel,
    ratesNote: spec.ratesNote || 'Not from a workbook: every rate and constant is an engineering assumption. Replace with vendor quotes before relying on the numbers.',
    masterNote: 'Rates, scaling constants and the cost stack. Assumptions, not workbook values; edit freely. Kept in this browser.', resetLabel: 'Reset to defaults',
    calcNote: spec.calcNote || '', sectionHint: spec.sectionHint || '', views: spec.views || [['section', spec.sectionLabel || 'Diagram'], ['3d', '3D model']],
    group: (st) => st, maxRows: () => 30, units: spec.units,
    compute(st) { spec.T_ = st.T; return st.list.map((c) => { const r = spec.compute(c, st.T); if (r.error) return r; return { ...r, parts: PARTS.map(([k, col]) => ({ k, l: k, col, v: r.pm[k] || 0 })) }; }); },
    title: (r) => r.cfg.tag || spec.noun, meta: (r) => r.meta, pillOf: (r) => r.pill || spec.pill || '', metrics: (r) => r.metrics,
    scene: (r, view) => spec.scene(r, view), section: (r, st) => spec.section(r, spec.T_),
    tabs: undefined,
    left(st, r, h) {
      const c = st.list[st.sel], ty = typed ? spec.types[c[tk]] : null, fs = spec.fields(c, ty), n = (st.list || []).length;
      const fld = (f) => f.sel ? `<div class="label">${f.label}</div>${h.sel(f.sel.map((o) => (Array.isArray(o) ? o : [o, o])), c[f.k], f.k)}` : f.seg ? `<div class="label">${f.label}</div>${h.seg(f.seg.map((o) => (Array.isArray(o) ? o : [o, o])), c[f.k], f.k)}` : h.num(f.label, f.k, c[f.k], f.step ?? 'any', f.unit || '');
      const shown = fs.filter((f) => !f.when || f.when(c)), secs = []; shown.forEach((f) => { const s = f.sec || 'Duty'; let g = secs.find((x) => x[0] === s); if (!g) secs.push(g = [s, []]); g[1].push(f); });
      const typeBlock = typed ? `<div class="sec-h"><span class="step">1</span>${spec.typeTitle || 'Type'}</div><div class="fam" style="grid-template-columns:repeat(1,1fr)">${Object.entries(spec.types).map(([k, t]) => `<button data-mset="${tk}" data-mv='"${k}"' class="${c[tk] === k ? 'on' : ''}"><span>${t.label}</span></button>`).join('')}</div><hr class="divider">` : '';
      const pair = (arr) => { const o = []; for (let i = 0; i < arr.length; i += 1) o.push(fld(arr[i])); return o.join(''); };
      return `<div class="label">${spec.noun[0].toUpperCase() + spec.noun.slice(1)} <small>${n} in batch</small></div>${h.sel(st.list.map((x, i) => [i, `${i + 1}. ${x.tag || spec.noun}`]), st.sel, 'sel')}${h.tag(c.tag)}<hr class="divider">${typeBlock}
        ${secs.map(([s, arr], i) => `<div class="sec-h"><span class="step">${i + (typed ? 2 : 1)}</span>${s}</div>${pair(arr)}`).join('<hr class="divider">')}
        ${r && r.error ? `<div class="banner" style="margin-top:14px"><div>${r.error}</div></div>` : ''}${r && r.warn && r.warn.length ? `<div class="banner" style="margin-top:14px"><div>${r.warn.join(' ')}</div></div>` : ''}`;
    },
    rates(st) { return spec.rates(st.T, st.list[st.sel]); },
    isPricePath: (p) => (spec.pricePaths || []).includes(p),
    bottom: [['anatomy', 'Cost anatomy', (r, st, h) => anatomy(r, h, spec.anatomyTitle || `Build-up of one ${spec.noun}`, spec.intro)], ...(spec.extraTabs || []).map(([k, l, fn]) => [k, l, (r, st, h) => fn(r, st, h)])],
    batchTitle: () => `${spec.noun[0].toUpperCase() + spec.noun.slice(1)} batch · one row per ${spec.noun}`, batchCols: spec.batchCols,
    calcRows(r) { const f = (v, d = 1) => fmt(v, d); return [[['#', spec.factsTitle || 'Sizing'], ...r.facts], costRows(r, f)]; },
    master(st) {
      const T = st.T, P = (path, lab, v, un, scale = 1) => [lab, path, v, 'any', scale, un], pcts = new Set(['stack.engineering', 'stack.overheads', 'stack.margin', 'stack.misc']);
      const secs = (spec.masterSections || []).map(([title, keys]) => ({ title, rows: keys.flatMap((k) => flat({ [k]: k.split('.').reduce((o, p) => o[p], T) }).map(([p, v]) => P(p, p.replace(/\./g, ' · '), v, '', pcts.has(p) ? 100 : 1))) }));
      const used = new Set((spec.masterSections || []).flatMap(([, ks]) => ks)); const rest = Object.keys(T).filter((k) => !used.has(k) && k !== 'stack' && flat({ [k]: T[k] }).length);
      if (rest.length) secs.push({ title: 'Other constants', rows: rest.flatMap((k) => flat({ [k]: T[k] }).map(([p, v]) => P(p, p.replace(/\./g, ' · '), v, ''))) });
      secs.push({ title: 'Cost stack', rows: stackRows(T, P) }); return secs;
    },
    reset(st) { const d = spec.defaults(); st.T = d.T; st.list = d.list; st.sel = 0; },
  };
  return def;
}
export { fmt, label };
