// A small spreadsheet engine: evaluates the workbook's own formulas (IF, SUM, IFERROR, XLOOKUP, MAX, ROUND,
// ROUNDUP, SUMPRODUCT) so the dashboard runs the cost model exactly as written, with inputs overridden.

export class XlError extends Error { constructor(code) { super(code); this.code = code; } }

const colNum = (s) => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const colName = (n) => { let s = ''; while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); } return s; };
const splitAddr = (a) => { const m = /^([A-Z]+)(\d+)$/.exec(a); return [colNum(m[1]), +m[2]]; };

/* ---------- tokenizer ---------- */
function tokenize(src) {
  const t = []; let i = 0;
  const peek = (re) => { re.lastIndex = i; const m = re.exec(src); return m && m.index === i ? m : null; };
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ') { i++; continue; }
    let m;
    if (ch === '"') { let s = ''; i++; for (;;) { if (src[i] === '"') { if (src[i + 1] === '"') { s += '"'; i += 2; continue; } i++; break; } s += src[i++]; } t.push({ k: 'str', v: s }); continue; }
    if ((m = peek(/(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_ ]*?))!(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/y))) { t.push({ k: 'ref', sheet: m[1] || m[2], a: m[3].replace(/\$/g, ''), b: m[4] && m[4].replace(/\$/g, '') }); i += m[0].length; continue; }
    if ((m = peek(/\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?(?![A-Za-z0-9_(])/y))) { const [a, b] = m[0].replace(/\$/g, '').split(':'); t.push({ k: 'ref', sheet: null, a, b }); i += m[0].length; continue; }
    if ((m = peek(/\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+/y))) { t.push({ k: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue; }
    if ((m = peek(/[A-Za-z_][A-Za-z0-9_.]*(?=\()/y))) { t.push({ k: 'fn', v: m[0].toUpperCase() }); i += m[0].length; continue; }
    if ((m = peek(/TRUE|FALSE/iy))) { t.push({ k: 'bool', v: m[0].toUpperCase() === 'TRUE' }); i += m[0].length; continue; }
    if ((m = peek(/<>|<=|>=|[-+*/^&=<>(),%]/y))) { t.push({ k: 'op', v: m[0] }); i += m[0].length; continue; }
    throw new Error(`Cannot parse "${src}" at ${i}`);
  }
  return t;
}

/* ---------- parser (precedence: comparison < & < + - < * / < ^ < unary < %) ---------- */
function parse(src) {
  const toks = tokenize(src); let p = 0;
  const op = (v) => toks[p] && toks[p].k === 'op' && toks[p].v === v;
  const eat = () => toks[p++];
  const cmp = () => { let l = cat(); while (toks[p] && toks[p].k === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(toks[p].v)) { const o = eat().v; l = { t: 'bin', o, l, r: cat() }; } return l; };
  const cat = () => { let l = add(); while (op('&')) { eat(); l = { t: 'bin', o: '&', l, r: add() }; } return l; };
  const add = () => { let l = mul(); while (op('+') || op('-')) { const o = eat().v; l = { t: 'bin', o, l, r: mul() }; } return l; };
  const mul = () => { let l = pow(); while (op('*') || op('/')) { const o = eat().v; l = { t: 'bin', o, l, r: pow() }; } return l; };
  const pow = () => { let l = unary(); while (op('^')) { eat(); l = { t: 'bin', o: '^', l, r: unary() }; } return l; };
  const unary = () => { if (op('-')) { eat(); return { t: 'neg', e: unary() }; } if (op('+')) { eat(); return unary(); } return post(); };
  const post = () => { let e = prim(); while (op('%')) { eat(); e = { t: 'pct', e }; } return e; };
  const prim = () => {
    const tk = eat();
    if (!tk) throw new Error('Unexpected end');
    if (tk.k === 'num') return { t: 'num', v: tk.v };
    if (tk.k === 'str') return { t: 'str', v: tk.v };
    if (tk.k === 'bool') return { t: 'bool', v: tk.v };
    if (tk.k === 'ref') return { t: 'ref', sheet: tk.sheet, a: tk.a, b: tk.b };
    if (tk.k === 'fn') { eat(); const args = []; if (!op(')')) { for (;;) { args.push(cmp()); if (op(',')) { eat(); continue; } break; } } eat(); return { t: 'fn', n: tk.v, args }; }
    if (tk.k === 'op' && tk.v === '(') { const e = cmp(); eat(); return e; }
    throw new Error('Unexpected token ' + JSON.stringify(tk));
  };
  const e = cmp();
  if (p < toks.length) throw new Error('Trailing tokens in ' + src);
  return e;
}

/* ---------- value helpers ---------- */
const isBlank = (v) => v === null || v === undefined;
function num(v) {
  if (isBlank(v)) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'string') { const s = v.trim(); if (s !== '' && !Number.isNaN(Number(s))) return Number(s); }
  throw new XlError('#VALUE!');
}
const str = (v) => (isBlank(v) ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v));
const truthy = (v) => (typeof v === 'string' ? (() => { throw new XlError('#VALUE!'); })() : !!num(v));
const roundHalfAway = (x, d) => { const f = 10 ** d, y = Math.abs(x) * f; return Math.sign(x) * Math.round(y + 1e-9 * Math.max(1, y)) / f; };
function compare(a, b) { // returns -1/0/1, Excel ordering: numbers < text < booleans, blanks adopt the other type
  if (isBlank(a)) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (isBlank(b)) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  const rank = (v) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2);
  if (rank(a) !== rank(b)) return rank(a) < rank(b) ? -1 : 1;
  if (typeof a === 'string') { const x = a.toLowerCase(), y = b.toLowerCase(); return x < y ? -1 : x > y ? 1 : 0; }
  return a < b ? -1 : a > b ? 1 : 0;
}

export class Workbook {
  constructor(data) {
    this.sheets = data; this.over = {}; this.memo = new Map(); this.ast = new Map(); this.stack = new Set();
  }
  key(sheet, addr) { return `${sheet}!${addr}`; }
  setOverride(sheet, addr, v) { this.over[this.key(sheet, addr)] = v; this.memo.clear(); }
  clearOverride(sheet, addr) { delete this.over[this.key(sheet, addr)]; this.memo.clear(); }
  clearOverrides() { this.over = {}; this.memo.clear(); }
  raw(sheet, addr) { return this.sheets[sheet]?.[addr]; }
  /** value of one cell (throws XlError for error results) */
  cell(sheet, addr) {
    const k = this.key(sheet, addr);
    if (k in this.over) return this.over[k];
    if (this.memo.has(k)) { const m = this.memo.get(k); if (m instanceof XlError) throw m; return m; }
    const c = this.raw(sheet, addr);
    if (!c) return null;
    if (c.f === undefined) return c.v === undefined ? null : c.v;
    if (this.stack.has(k)) throw new XlError('#REF!');
    this.stack.add(k);
    try {
      let ast = this.ast.get(k); if (!ast) { ast = parse(c.f); this.ast.set(k, ast); }
      const v = this.ev(ast, sheet); this.memo.set(k, v); return v;
    } catch (e) { if (e instanceof XlError) { this.memo.set(k, e); } throw e; } finally { this.stack.delete(k); }
  }
  /** safe read: returns the value, or null when the cell evaluates to an error */
  get(sheet, addr) { try { return this.cell(sheet, addr); } catch (e) { if (e instanceof XlError) return null; throw e; } }
  rangeCells(rg) { const out = []; for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) out.push(this.cell(rg.sheet, colName(c) + r)); return out; }
  ev(n, sheet) {
    switch (n.t) {
      case 'num': case 'str': case 'bool': return n.v;
      case 'ref': {
        const sh = n.sheet || sheet;
        if (!n.b) return this.cell(sh, n.a);
        const [c1, r1] = splitAddr(n.a), [c2, r2] = splitAddr(n.b);
        return { range: true, sheet: sh, r1: Math.min(r1, r2), r2: Math.max(r1, r2), c1: Math.min(c1, c2), c2: Math.max(c1, c2) };
      }
      case 'neg': return -num(this.sc(n.e, sheet));
      case 'pct': return num(this.sc(n.e, sheet)) / 100;
      case 'bin': {
        const a = this.sc(n.l, sheet), b = this.sc(n.r, sheet);
        switch (n.o) {
          case '+': return num(a) + num(b);
          case '-': return num(a) - num(b);
          case '*': return num(a) * num(b);
          case '/': { const d = num(b); if (d === 0) throw new XlError('#DIV/0!'); return num(a) / d; }
          case '^': return num(a) ** num(b);
          case '&': return str(a) + str(b);
          case '=': return compare(a, b) === 0;
          case '<>': return compare(a, b) !== 0;
          case '<': return compare(a, b) < 0;
          case '>': return compare(a, b) > 0;
          case '<=': return compare(a, b) <= 0;
          case '>=': return compare(a, b) >= 0;
          default: throw new Error('op ' + n.o);
        }
      }
      case 'fn': return this.fn(n, sheet);
      default: throw new Error('node ' + n.t);
    }
  }
  sc(n, sheet) { const v = this.ev(n, sheet); if (v && v.range) throw new XlError('#VALUE!'); return v; }
  nums(args, sheet) { // numbers a SUM/MAX-style function sees
    const out = [];
    for (const a of args) {
      const v = this.ev(a, sheet);
      if (a.t === 'ref' && !(v && v.range)) { if (typeof v === 'number') out.push(v); continue; } // a cell reference behaves like a one-cell range: text is ignored
      if (v && v.range) { for (const x of this.rangeCells(v)) if (typeof x === 'number') out.push(x); else if (typeof x === 'boolean') { /* ignored in ranges */ } }
      else out.push(num(v));
    }
    return out;
  }
  fn(n, sheet) {
    const A = n.args;
    switch (n.n) {
      case 'IF': { const c = truthy(this.sc(A[0], sheet)); return c ? this.sc(A[1], sheet) : (A[2] ? this.sc(A[2], sheet) : false); }
      case 'IFERROR': { try { return this.sc(A[0], sheet); } catch (e) { if (e instanceof XlError) return this.sc(A[1], sheet); throw e; } }
      case 'SUM': return this.nums(A, sheet).reduce((x, y) => x + y, 0);
      case 'MAX': { const v = this.nums(A, sheet); return v.length ? Math.max(...v) : 0; }
      case 'ROUND': return roundHalfAway(num(this.sc(A[0], sheet)), num(this.sc(A[1], sheet)));
      case 'ROUNDUP': { const x = num(this.sc(A[0], sheet)), d = num(this.sc(A[1], sheet)), f = 10 ** d; return Math.sign(x) * Math.ceil(Math.abs(x) * f - 1e-9) / f; }
      case 'SUMPRODUCT': {
        const arrs = A.map((a) => { const v = this.ev(a, sheet); return v && v.range ? this.rangeCells(v).map((x) => (typeof x === 'number' ? x : 0)) : [num(v)]; });
        let s = 0; for (let i = 0; i < arrs[0].length; i++) s += arrs.reduce((p, a) => p * (a[i] ?? 0), 1); return s;
      }
      case 'XLOOKUP': {
        const key = this.sc(A[0], sheet), look = this.ev(A[1], sheet), ret = this.ev(A[2], sheet);
        const L = this.rangeCells(look), R = this.rangeCells(ret);
        for (let i = 0; i < L.length; i++) if (!isBlank(L[i]) && compare(key, L[i]) === 0) return R[i] ?? null;
        throw new XlError('#N/A');
      }
      default: throw new Error('Unsupported function ' + n.n);
    }
  }
}
