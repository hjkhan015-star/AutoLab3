/* ════════════════════════════════════════════════════
   monitor-core.js — pure logic for the Monitor (no DOM, unit-tested in tests/monitor.test.mjs).
   monitor.js builds the DOM from these helpers; modules never import this file directly.
   ════════════════════════════════════════════════════ */

export const TONES = ['ok', 'warn', 'crit', 'hi'];   /* 'hi' = accent highlight */
const TEXT_HZ = 9;                 /* text refresh target: 8–10 Hz */
const TRACE_HZ = 30;               /* trace redraw target */
export const DEFAULT_TRACE_LEN = 240;     /* samples kept per series (≈ 8 s at 30 Hz) */

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ── value → bar / gauge ─────────────────────────────── */
/* bar: percent 0..100 (the guided modules already pass percent). */
export function barPercent(pct) {
  const n = Number(pct);
  return Number.isFinite(n) ? clamp(n, 0, 100) : 0;
}
/* gauge: value in [min,max] → 0..1 fraction → needle angle in degrees across an arc (default −120..+120). */
export function gaugeFraction(v, min = 0, max = 100) {
  const n = Number(v);
  if (!Number.isFinite(n) || !(max > min)) return 0;
  return clamp((n - min) / (max - min), 0, 1);
}
export function gaugeAngle(v, min = 0, max = 100, arc = 240) {
  return -arc / 2 + gaugeFraction(v, min, max) * arc;
}

/* ── formatting ──────────────────────────────────────── */
export function formatNumber(v, digits = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '–';
  return n.toFixed(clamp(Math.round(digits), 0, 6));
}
/* merge two value payloads (string | number | object) so setBig + setBar in one tick do not drop each other */
export function mergeValue(a, b) {
  const o = (v) => (v && typeof v === 'object' ? v : (v === undefined || v === null ? {} : { text: v }));
  return Object.assign({}, o(a), o(b));
}
/* normalise a row payload: 'text' | ['text', tone] → { text, tone } (unknown tones fall back to '') */
/** Segmented-spec geometry: band start / end and marker position as 0..1 fractions of the bar, plus whether the value is inside the band. */
export function specBar(spec, value) {
  const f = (v) => clamp((v - spec.min) / (spec.max - spec.min), 0, 1);
  const lo = Math.min(spec.lo, spec.hi), hi = Math.max(spec.lo, spec.hi);
  return { lo: f(lo), hi: f(hi), pos: f(value), inBand: value >= lo - 1e-9 && value <= hi + 1e-9 };
}
export function normalizeRowValue(v) {
  if (Array.isArray(v) && Number.isFinite(v[2])) return { text: v[0] == null ? '' : String(v[0]), tone: TONES.includes(v[1]) ? v[1] : '', num: v[2] };
  if (Array.isArray(v)) return { text: v[0] == null ? '' : String(v[0]), tone: TONES.includes(v[1]) ? v[1] : '' };
  return { text: v == null ? '' : String(v), tone: '' };
}
/* normalise a status payload: [text, on, tone?] | { text, on, tone? } → { text, on, tone }.
   tone: '' | 'warn' | 'crit' (a fault sentence is shown in the warn / crit colour instead of the green lamp) */
const STATUS_TONES = ['', 'warn', 'crit'];
export function normalizeStatus(s) {
  const tone = (t) => (STATUS_TONES.includes(t) ? t : '');
  if (Array.isArray(s)) return { text: s[0] == null ? '' : String(s[0]), on: !!s[1], tone: tone(s[2]) };
  if (s && typeof s === 'object') return { text: s.text == null ? '' : String(s.text), on: !!s.on, tone: tone(s.tone) };
  return { text: s == null ? '' : String(s), on: false, tone: '' };
}

/* ── rolling buffer (fixed capacity ring, oldest → newest) ── */
export function createRolling(capacity = DEFAULT_TRACE_LEN) {
  const cap = Math.max(2, Math.floor(capacity) || DEFAULT_TRACE_LEN);
  const buf = new Float32Array(cap);
  let head = 0, n = 0;
  return {
    capacity: cap,
    push(v) { buf[head] = Number.isFinite(v) ? v : (n ? buf[(head - 1 + cap) % cap] : 0); head = (head + 1) % cap; if (n < cap) n++; },
    get length() { return n; },
    at(i) { return n ? buf[(head - n + i + cap * 2) % cap] : 0; },     /* i = 0 oldest … length−1 newest */
    toArray() { const a = new Array(n); for (let i = 0; i < n; i++) a[i] = buf[(head - n + i + cap * 2) % cap]; return a; },
    clear() { head = 0; n = 0; },
    min() { let m = Infinity; for (let i = 0; i < n; i++) m = Math.min(m, buf[(head - n + i + cap * 2) % cap]); return n ? m : 0; },
    max() { let m = -Infinity; for (let i = 0; i < n; i++) m = Math.max(m, buf[(head - n + i + cap * 2) % cap]); return n ? m : 0; },
  };
}

/* ── rate limiter: `due(now)` is true at most `hz` times a second. Time is passed in (tests use fake clocks). ── */
export function createRateLimiter(hz = TEXT_HZ) {
  const gap = 1000 / Math.max(0.1, hz);
  let next = -Infinity;
  return {
    gap,
    due(nowMs) { if (nowMs >= next) { next = nowMs + gap; return true; } return false; },
    reset() { next = -Infinity; },
  };
}

/* ── channel config validation ──────────────────────────
   cfg = { value?:{label,unit,max,bar}, rows?:[[id,label]|{id,label}], traces?:[{id,label,series:[{id,color,label}], min,max}],
           gauge?:{id,label,min,max,unit}, status?:true|{text}, footer?:html, label?:string }
   Returns { ok, errors, config } where config is normalised; never throws. Duplicate ids (across rows/traces/gauge) are errors. */
export function validateMonitorConfig(cfg) {
  const errors = [];
  const out = { label: '', value: null, rows: [], traces: [], gauge: null, status: null, footer: '' };
  if (!cfg || typeof cfg !== 'object') return { ok: false, errors: ['config must be an object'], config: out };
  const seen = new Set();
  const claim = (id, where) => {
    if (typeof id !== 'string' || !id) { errors.push(`${where}: id must be a non-empty string`); return false; }
    if (!/^[A-Za-z0-9_-]+$/.test(id)) { errors.push(`${where}: id "${id}" may only contain letters, digits, _ and -`); return false; }
    if (seen.has(id)) { errors.push(`${where}: duplicate id "${id}"`); return false; }
    seen.add(id); return true;
  };
  out.label = cfg.label == null ? '' : String(cfg.label);
  if (cfg.value) {
    const v = cfg.value;
    if (typeof v !== 'object') errors.push('value: must be an object');
    else out.value = { label: v.label == null ? '' : String(v.label), unit: v.unit == null ? '' : String(v.unit), max: Number.isFinite(v.max) ? v.max : 100, bar: v.bar !== false };
  }
  (cfg.rows || []).forEach((r, i) => {
    const id = Array.isArray(r) ? r[0] : r && r.id, label = Array.isArray(r) ? r[1] : r && r.label;
    if (!claim(id, `rows[${i}]`)) return;
    const row = { id, label: label == null ? id : String(label) };
    const sp = Array.isArray(r) ? r[2] && r[2].spec : r && r.spec;      /* segmented-spec bar: value vs the green band */
    if (sp) {
      if (![sp.min, sp.max, sp.lo, sp.hi].every(Number.isFinite) || !(sp.max > sp.min)) errors.push(`rows[${i}]: spec needs finite min < max, lo, hi`);
      else row.spec = { min: sp.min, max: sp.max, lo: sp.lo, hi: sp.hi };
    }
    out.rows.push(row);
  });
  (cfg.traces || []).forEach((t, i) => {
    if (!t || !claim(t.id, `traces[${i}]`)) { if (!t) errors.push(`traces[${i}]: must be an object`); return; }
    const series = (t.series || []).map((s, j) => (typeof s === 'string' ? { id: s, label: s } : s));
    if (!series.length) { errors.push(`traces[${i}]: needs at least one series`); return; }
    if (series.length > 6) errors.push(`traces[${i}]: at most 6 series`);
    const sIds = new Set();
    series.forEach((s, j) => {
      if (!s || typeof s.id !== 'string' || !s.id) errors.push(`traces[${i}].series[${j}]: id required`);
      else if (sIds.has(s.id)) errors.push(`traces[${i}].series[${j}]: duplicate series id "${s.id}"`);
      else sIds.add(s.id);
    });
    out.traces.push({ id: t.id, label: t.label == null ? '' : String(t.label), series: series.slice(0, 6), min: Number.isFinite(t.min) ? t.min : null, max: Number.isFinite(t.max) ? t.max : null, length: Number.isFinite(t.length) ? Math.max(8, t.length | 0) : DEFAULT_TRACE_LEN });
  });
  if (cfg.gauge) {
    const g = cfg.gauge;
    if (claim(g.id, 'gauge')) {
      const min = Number.isFinite(g.min) ? g.min : 0, max = Number.isFinite(g.max) ? g.max : 100;
      if (!(max > min)) errors.push('gauge: max must be greater than min');
      else out.gauge = { id: g.id, label: g.label == null ? '' : String(g.label), unit: g.unit == null ? '' : String(g.unit), min, max };
    }
  }
  if (cfg.status) out.status = { text: typeof cfg.status === 'object' && cfg.status.text != null ? String(cfg.status.text) : '' };
  if (cfg.footer != null) out.footer = String(cfg.footer);
  return { ok: errors.length === 0, errors, config: out };
}

/* ── trace scaling: y range for a set of buffers (fixed when min/max given, else padded auto-range) ── */
export function traceRange(buffers, min = null, max = null) {
  let lo = min, hi = max;
  if (lo == null || hi == null) {
    let a = Infinity, b = -Infinity;
    for (const buf of buffers) { if (!buf.length) continue; a = Math.min(a, buf.min()); b = Math.max(b, buf.max()); }
    if (!Number.isFinite(a)) { a = 0; b = 1; }
    if (b - a < 1e-9) { a -= 0.5; b += 0.5; }
    const pad = (b - a) * 0.08;
    if (lo == null) lo = a - pad;
    if (hi == null) hi = b + pad;
  }
  return { lo, hi };
}


/* ═══════════ merged from monitor.js (DOM layer) ═══════════ */
/* ════════════════════════════════════════════════════
   monitor.js — ONE readout surface per module: every number appears exactly once.
   Channels: value (big number + unit + bar) · rows (label/value, ok|warn|crit) · gauge · trace (rolling canvas,
   N series) · status (lamp + text, the ONLY aria-live region) · footer (legend HTML).
   Phone: a one-line strip (primary value + status) over the stage; tap → the card slides down (max --monitor-max).
   Desktop: a card with the collapse orb (kit.js adds the orb). Text refresh ≈ 9 Hz; traces redraw ≈ 30 Hz.
   No DOM-mutation watching and no layout measuring on text writes: the card is sized by CSS; only a ResizeObserver
   on the trace holders resizes canvases.
   Modules use ui.monitor.set / ui.monitor.update (kit.js); they never import this file.
   ════════════════════════════════════════════════════ */

const SERIES_COLORS = ['--accent', '--warn', '--ok', '--accent-2', '--crit', '--text-dim'];
const SVGNS = 'http://www.w3.org/2000/svg';

export function createMonitor({ mount, doc = document, moduleId = 'module' } = {}) {
  const win = doc.defaultView || window;
  const reduced = !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const el = (tag, cls, text) => { const n = doc.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };

  /* ── static shell (built once; set() fills it) ── */
  const root = el('div', 'ui-monitor ui-card'); root.id = 'ui-monitor'; root.dataset.open = 'false';
  const head = el('div', 'mon-head');
  const label = el('div', 'mon-label');
  const valueWrap = el('div', 'mon-value'); const valueText = el('span', 'mon-value-text'); const valueUnit = el('span', 'mon-value-unit');
  valueWrap.append(valueText, valueUnit);
  const status = el('div', 'mon-status'); const lamp = el('i'); const statusText = el('span', 'mon-status-text');
  statusText.setAttribute('role', 'status'); statusText.setAttribute('aria-live', 'polite');    /* the ONLY live region */
  status.append(lamp, statusText);
  head.append(label, valueWrap, status);
  const toggle = el('button', 'mon-toggle'); toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-controls', 'mon-card'); toggle.setAttribute('aria-label', 'Show readout details');
  const card = el('div', 'mon-card'); card.id = 'mon-card';
  const barWrap = el('div', 'mon-bar'); const barFill = el('div', 'mon-bar-fill'); barWrap.appendChild(barFill);
  const rowsEl = el('div', 'mon-rows');
  const gaugeHost = el('div', 'mon-gauge');
  const tracesEl = el('div', 'mon-traces');
  const footer = el('div', 'mon-footer');
  const statusFull = el('div', 'mon-status-full'); statusFull.setAttribute('aria-hidden', 'true');   /* phone: the strip truncates a long fault sentence, the card shows it in full (not a second live region) */
  card.append(statusFull, barWrap, rowsEl, gaugeHost, tracesEl, footer);
  root.append(head, toggle, card);
  (mount || doc.body).appendChild(root);

  /* ── state ── */
  let cfg = null;
  const rowNodes = {};                 /* id → { row, val }                       (cached nodes) */
  const traceNodes = {};               /* id → { wrap, canvas, ctx, bufs[], w, h, dirty, cfg } */
  let gaugeNodes = null;
  const last = { label: null, value: null, unit: null, bar: null, barColor: null, color: null, rows: {}, rowLabels: {}, footer: null, status: null, gauge: null, tone: null };
  let pending = null;                  /* latest text-channel values waiting for the next ≤ 9 Hz flush */
  const limiter = createRateLimiter(TEXT_HZ);
  const traceLimiter = createRateLimiter(reduced ? TEXT_HZ : TRACE_HZ);
  let raf = 0, timer = 0, colors = null, colorsAt = -1e9, ro = null, open = false, destroyed = false;
  const stats = { textWrites: 0, flushes: 0, draws: 0 };    /* read by tests / debugging */

  const now = () => (win.performance ? win.performance.now() : Date.now());

  function setOpen(on) {
    open = !!on;
    root.dataset.open = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Hide readout details' : 'Show readout details');
    if (open) schedule();
  }
  toggle.addEventListener('click', () => setOpen(!open));
  win.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });

  /* ── set(): (re)build the channels from a config ── */
  function set(config) {
    const v = validateMonitorConfig(config);
    if (!v.ok) { try { console.warn('[monitor] invalid config:', v.errors.join('; ')); } catch (_) {} }
    cfg = v.config;
    label.textContent = cfg.label;
    label.style.display = cfg.label ? '' : 'none';
    valueWrap.style.display = cfg.value ? '' : 'none';
    barWrap.style.display = cfg.value && cfg.value.bar ? '' : 'none';
    valueUnit.textContent = cfg.value ? cfg.value.unit : '';
    status.style.display = cfg.status ? '' : 'none';
    statusText.textContent = cfg.status ? cfg.status.text : '';
    footer.innerHTML = cfg.footer || ''; footer.style.display = cfg.footer ? '' : 'none';

    rowsEl.textContent = ''; for (const k in rowNodes) delete rowNodes[k];
    cfg.rows.forEach((r) => {
      const row = el('div', 'mon-row'); row.dataset.row = r.id; const k = el('span', 'mon-row-k', r.label); const val = el('b', 'mon-row-v');
      row.append(k, val); rowsEl.appendChild(row); rowNodes[r.id] = { row, val, key: k };
      if (r.spec) {
        const sb = specBar(r.spec, r.spec.min); row.classList.add('has-spec');
        const bar = el('span', 'mon-spec'); bar.style.setProperty('--lo', sb.lo); bar.style.setProperty('--hi', sb.hi);
        bar.append(el('i', 'mon-spec-band'), el('i', 'mon-spec-m')); row.appendChild(bar);
        rowNodes[r.id].bar = bar; rowNodes[r.id].spec = r.spec;
      }
    });
    rowsEl.style.display = cfg.rows.length ? '' : 'none';

    gaugeHost.textContent = ''; gaugeNodes = null;
    if (cfg.gauge) gaugeNodes = buildGauge(cfg.gauge);
    gaugeHost.style.display = cfg.gauge ? '' : 'none';

    if (ro) ro.disconnect();
    tracesEl.textContent = ''; for (const k in traceNodes) delete traceNodes[k];
    cfg.traces.forEach((t) => {
      const wrap = el('div', 'mon-trace'); const cap = el('div', 'mon-trace-cap', t.label); const canvas = el('canvas', 'mon-trace-cv');
      canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', t.label || 'Live trace');
      wrap.append(cap, canvas); if (!t.label) cap.style.display = 'none';
      if (t.series.some((x) => x.label)) {                                  /* colour key: one dot + name per labelled series */
        const key = el('div', 'mon-trace-key');
        t.series.forEach((x, si) => { if (!x.label) return; const item = el('span', 'mon-key-i'); const dot = el('i'); dot.style.background = x.color || ('var(' + SERIES_COLORS[si % SERIES_COLORS.length] + ')'); item.append(dot, doc.createTextNode(x.label)); key.appendChild(item); });
        wrap.insertBefore(key, canvas);
      }
      tracesEl.appendChild(wrap);
      traceNodes[t.id] = { wrap, canvas, ctx: canvas.getContext ? canvas.getContext('2d') : null, bufs: t.series.map(() => createRolling(t.length)), w: 0, h: 0, dirty: true, cfg: t };
    });
    tracesEl.style.display = cfg.traces.length ? '' : 'none';
    if (cfg.traces.length && win.ResizeObserver) {
      ro = new win.ResizeObserver(() => { for (const id in traceNodes) sizeCanvas(traceNodes[id]); schedule(); });
      for (const id in traceNodes) ro.observe(traceNodes[id].wrap);
    }
    for (const k in last) last[k] = (k === 'rows' || k === 'rowLabels') ? {} : null;
    root.classList.toggle('has-card', !!(cfg.rows.length || cfg.traces.length || cfg.gauge || (cfg.value && cfg.value.bar) || cfg.footer));
    return v;
  }

  function buildGauge(g) {
    const svg = doc.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', '-60 -52 120 70'); svg.setAttribute('class', 'mon-gauge-svg');
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', g.label || 'Gauge');
    const arc = (cls, a0, a1) => {
      const p = doc.createElementNS(SVGNS, 'path'); const pt = (a) => [50 * Math.sin(a * Math.PI / 180), -50 * Math.cos(a * Math.PI / 180)];
      const [x0, y0] = pt(a0), [x1, y1] = pt(a1); p.setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)} A50 50 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`); p.setAttribute('class', cls); return p;
    };
    svg.appendChild(arc('mon-gauge-track', -120, 120));
    const needle = doc.createElementNS(SVGNS, 'line'); needle.setAttribute('x1', '0'); needle.setAttribute('y1', '0'); needle.setAttribute('x2', '0'); needle.setAttribute('y2', '-42'); needle.setAttribute('class', 'mon-gauge-needle');
    const hub = doc.createElementNS(SVGNS, 'circle'); hub.setAttribute('r', '3'); hub.setAttribute('class', 'mon-gauge-hub');
    svg.append(needle, hub);
    const cap = el('div', 'mon-gauge-cap'); const gv = el('b', 'mon-gauge-v');
    cap.append(el('span', null, g.label), gv);
    gaugeHost.append(svg, cap);
    return { needle, gv, cfg: g };
  }

  function sizeCanvas(t) {
    const r = t.wrap.getBoundingClientRect ? t.wrap.getBoundingClientRect() : { width: 0 };
    const dpr = Math.min(2, win.devicePixelRatio || 1);
    const w = Math.max(40, Math.round(r.width)), h = Math.max(24, parseInt(getComputedStyle(t.canvas).height, 10) || 56);
    if (w === t.w && h === t.h) return;
    t.w = w; t.h = h; t.canvas.width = Math.round(w * dpr); t.canvas.height = Math.round(h * dpr);
    if (t.ctx) t.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    t.dirty = true;
  }

  /* ── update(): store now, write text at ≤ 9 Hz, draw traces at ≤ 30 Hz ── */
  function update(p) {
    if (!cfg || !p || destroyed) return;
    if (p.traces) {                                     /* samples are pushed immediately (cheap); drawing is rate-limited */
      for (const id in p.traces) {
        const t = traceNodes[id]; if (!t) continue;
        const vals = p.traces[id];
        if (vals === null) { t.bufs.forEach((b) => b.clear()); t.dirty = true; continue; }      /* null = clear this trace (module Reset) */
        const n = Math.min(t.bufs.length, Array.isArray(vals) ? vals.length : 1);
        for (let i = 0; i < n; i++) t.bufs[i].push(Array.isArray(vals) ? vals[i] : vals);
        t.dirty = true;
      }
    }
    if (p.value !== undefined || p.rows || p.rowLabels || p.footer !== undefined || p.gauge !== undefined || p.status !== undefined || p.label !== undefined) {
      pending = pending || {};
      if (p.label !== undefined) pending.label = p.label;
      if (p.value !== undefined) pending.value = mergeValue(pending.value, p.value);
      if (p.gauge !== undefined) pending.gauge = p.gauge;
      if (p.status !== undefined) pending.status = p.status;
      if (p.rows) pending.rows = Object.assign(pending.rows || {}, p.rows);
      if (p.footer !== undefined) pending.footer = p.footer;                                  /* a legend that follows the mode (cooling) */
      if (p.rowLabels) pending.rowLabels = Object.assign(pending.rowLabels || {}, p.rowLabels);   /* a row's name may change with the module's mode (cooling) */
    }
    if (pending && limiter.due(now())) flushText();
    else if (pending && !timer) timer = win.setTimeout(() => { timer = 0; if (pending) { limiter.reset(); limiter.due(now()); flushText(); } }, limiter.gap);
    schedule();
  }

  function flushText() {
    const p = pending; pending = null; if (!p) return;
    stats.flushes++;
    if (p.label !== undefined) {                       /* the head label may change at runtime (exhaustsystem's four modes) */
      const t = p.label == null ? '' : String(p.label);
      if (t !== last.label) { label.textContent = t; label.style.display = t ? '' : 'none'; last.label = t; stats.textWrites++; }
    }
    if (p.value !== undefined && cfg.value) {
      const o = mergeValue(null, p.value);
      if (o.text !== undefined) {
        const text = o.text == null ? '' : (typeof o.text === 'number' ? formatNumber(o.text, o.digits || 0) : String(o.text));
        if (text !== last.value) { valueText.textContent = text; last.value = text; stats.textWrites++; }
      }
      if (o.unit != null && o.unit !== last.unit) { valueUnit.textContent = o.unit; last.unit = o.unit; stats.textWrites++; }
      const pct = o.bar != null ? barPercent(o.bar) : (typeof o.text === 'number' && cfg.value.max ? barPercent(o.text / cfg.value.max * 100) : null);
      if (pct != null && pct !== last.bar) { barFill.style.width = pct + '%'; last.bar = pct; }
      if (o.barColor !== undefined && o.barColor !== last.barColor) { barFill.style.background = o.barColor || ''; last.barColor = o.barColor; }
      if (o.color !== undefined && o.color !== last.color) { if (o.color) valueWrap.style.setProperty('--mon-val', o.color); else valueWrap.style.removeProperty('--mon-val'); last.color = o.color;   /* the colour reaches the screen through controls.css, which keeps it readable in both themes */ }
      if (o.tone !== undefined && o.tone !== last.tone) { valueWrap.dataset.tone = o.tone || ''; last.tone = o.tone; }
    }
    if (p.footer !== undefined) {
      const f = p.footer == null ? '' : String(p.footer);
      if (last.footer !== f) { footer.innerHTML = f; footer.style.display = f ? '' : 'none'; root.classList.toggle('has-card', !!f || root.classList.contains('has-card')); last.footer = f; stats.textWrites++; }
    }
    if (p.rowLabels) for (const id in p.rowLabels) {
      const n = rowNodes[id]; if (!n) continue;
      const t = p.rowLabels[id] == null ? '' : String(p.rowLabels[id]);
      if (last.rowLabels[id] !== t) { n.key.textContent = t; last.rowLabels[id] = t; stats.textWrites++; }
    }
    if (p.rows) for (const id in p.rows) {
      const n = rowNodes[id]; if (!n) continue;
      const { text, tone, num } = normalizeRowValue(p.rows[id]); const key = tone + '|' + text + '|' + num;
      if (last.rows[id] !== key) {
        n.val.textContent = text; n.val.dataset.tone = tone; last.rows[id] = key; stats.textWrites++;
        if (n.bar && num != null) { n.bar.style.setProperty('--pos', specBar(n.spec, num).pos); n.bar.dataset.tone = tone; }
      }
    }
    if (p.gauge !== undefined && gaugeNodes) {
      const g = gaugeNodes.cfg; const gv = Array.isArray(p.gauge) ? p.gauge[0] : p.gauge;
      const txt = Array.isArray(p.gauge) && p.gauge[1] != null ? String(p.gauge[1]) : formatNumber(gv, 0) + (g.unit ? ' ' + g.unit : '');
      const ang = gaugeAngle(gv, g.min, g.max);
      if (ang !== last.gauge) { gaugeNodes.needle.setAttribute('transform', `rotate(${ang.toFixed(1)})`); last.gauge = ang; }
      if (gaugeNodes.gv.textContent !== txt) { gaugeNodes.gv.textContent = txt; stats.textWrites++; }
    }
    if (p.status !== undefined && cfg.status) {
      const s = normalizeStatus(p.status); const key = s.text + '|' + s.on + '|' + s.tone;
      if (last.status !== key) { statusText.textContent = s.text; status.classList.toggle('on', s.on); if (s.tone) status.dataset.tone = s.tone; else delete status.dataset.tone; statusFull.textContent = s.tone ? s.text : ''; statusFull.dataset.tone = s.tone; last.status = key; stats.textWrites++; }
    }
  }

  /* ── trace drawing: one internal rAF that only runs while there is something visible to draw ── */
  function schedule() {
    if (raf || destroyed || !Object.keys(traceNodes).length) return;
    if (doc.hidden) return;
    raf = win.requestAnimationFrame(tick);
  }
  function tick(ts) {
    raf = 0;
    if (destroyed) return;
    const visible = open || !win.matchMedia || !win.matchMedia('(max-width: 720px), (max-height: 540px)').matches;
    let again = false;
    if (visible && traceLimiter.due(ts)) {
      for (const id in traceNodes) { const t = traceNodes[id]; if (t.dirty) { draw(t); t.dirty = false; } }
    }
    for (const id in traceNodes) if (traceNodes[id].dirty) again = true;
    if (again && visible) schedule();
  }
  function resolveColors() {
    const t = now(); if (colors && t - colorsAt < 500) return colors;
    const cs = getComputedStyle(root); const get = (n, fb) => (cs.getPropertyValue(n) || '').trim() || fb;
    colors = { grid: get('--border', 'rgba(128,128,128,.25)'), text: get('--text-mute', '#888'), series: SERIES_COLORS.map((n) => get(n, '#4af')), get };
    colorsAt = t; return colors;
  }
  /* a series colour may be a token reference ('var(--accent)'): canvas cannot parse var(), so resolve it here */
  function cssColor(v, c) {
    const m = /^var\((--[\w-]+)\s*(?:,[^)]*)?\)$/.exec(v || '');
    return m ? (c.get(m[1], '') || '') : (v || '');
  }
  function draw(t) {
    if (!t.ctx) return;
    if (!t.w) sizeCanvas(t);
    const c = resolveColors(), ctx = t.ctx, W = t.w, H = t.h; stats.draws++;
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = c.grid; ctx.beginPath();
    for (let i = 1; i < 4; i++) { const y = Math.round(H * i / 4) + 0.5; ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    const { lo, hi } = traceRange(t.bufs, t.cfg.min, t.cfg.max); const span = hi - lo || 1;
    t.bufs.forEach((b, si) => {
      if (b.length < 2) return;
      const s = t.cfg.series[si]; ctx.strokeStyle = cssColor(s && s.color, c) || c.series[si % c.series.length]; ctx.lineWidth = 1.6; ctx.beginPath();
      const cap = b.capacity;
      for (let i = 0; i < b.length; i++) {
        const x = W - (b.length - 1 - i) * (W / (cap - 1)), y = H - 2 - ((b.at(i) - lo) / span) * (H - 4);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    });
  }

  function destroy() { destroyed = true; if (raf) win.cancelAnimationFrame(raf); if (timer) win.clearTimeout(timer); if (ro) ro.disconnect(); root.remove(); }

  return {
    root, set, update, flush() { limiter.reset(); flushText(); },
    open: setOpen, get isOpen() { return open; }, get config() { return cfg; }, stats, destroy,
    /* test hooks */ _rowNodes: rowNodes, _traceNodes: traceNodes, _last: last,
  };
}
