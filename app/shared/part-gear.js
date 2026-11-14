/* part-gear.js — gear geometry kit: surfaces of revolution, boxes and real bevel / spiral-bevel gears (teeth on the pitch cone).
   Used by the differential and the 4WD / AWD page. Geometry is plain data first ({ p: positions[], i: indices | null }), then
   kit.mkGeo(data) makes a BufferGeometry scaled by `S` (model units → scene units). Release meshes with disposeGear(object). */

/** createGearKit(THREE, S = 0.19) → { PI, TAU, S, revolve, cylinder, box, merge, xform, mkGeo, bevelGear }
    bevelGear(o) builds one gear in its own frame (apex at the origin, axis +Z): o = { N, delta, dIn, dOut, toothH, twist, stations, phase, back, boreR, hubR, hubLen, tip, root, sink, bodyOff, dStart }
    and returns { body, teeth, zEnd } (twist ≠ 0 → spiral teeth). */
export function createGearKit(THREE, S = 0.19) {
  const PI = Math.PI, TAU = PI * 2;
  const at = (axis, u, r, a) => axis === 'x' ? [u, r * Math.cos(a), r * Math.sin(a)]
                              : axis === 'y' ? [r * Math.cos(a), u, r * Math.sin(a)]
                              :                [r * Math.cos(a), r * Math.sin(a), u];
  /* surface of revolution; prof = [[axial, radius], …]; each profile segment keeps its own vertices (crisp edges) */
  function revolve(prof, seg, axis, a0 = 0, aLen = TAU, closed = true) {
    const p = [], idx = [], n = prof.length, last = closed ? n : n - 1;
    for (let s = 0; s < last; s++) {
      const A = prof[s], B = prof[(s + 1) % n];
      if (A[0] === B[0] && A[1] === B[1]) continue;
      const base = p.length / 3;
      for (let i = 0; i <= seg; i++) { const a = a0 + aLen * i / seg; p.push(...at(axis, A[0], A[1], a), ...at(axis, B[0], B[1], a)); }
      for (let i = 0; i < seg; i++) { const v = base + i * 2; idx.push(v, v + 2, v + 1, v + 1, v + 2, v + 3); }
    }
    return { p, i: idx };
  }
  const cylinder = (axis, r, u0, u1, seg = 24) => revolve([[u0, 0], [u0, r], [u1, r], [u1, 0]], seg, axis);
  function box(w, h, d, cx, cy, cz) {
    const x = w / 2, y = h / 2, z = d / 2, V = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) V.push([cx + sx * x, cy + sy * y, cz + sz * z]);
    const Q = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]], p = [];
    for (const q of Q) for (const k of [0, 1, 2, 0, 2, 3]) p.push(...V[q[k]]);
    return { p, i: null };
  }
  function merge(list) {
    const p = [], idx = [];
    for (const g of list) {
      const base = p.length / 3;
      for (const v of g.p) p.push(v);
      if (g.i) for (const k of g.i) idx.push(k + base); else for (let k = 0; k < g.p.length / 3; k++) idx.push(base + k);
    }
    return { p, i: idx };
  }
  function xform(g, f) { const p = g.p.slice(); for (let k = 0; k < p.length; k += 3) { const q = f(p[k], p[k + 1], p[k + 2]); p[k] = q[0]; p[k + 1] = q[1]; p[k + 2] = q[2]; } return { p, i: g.i }; }
  const mkGeo = (g) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(g.p.map(v => v * S)), 3));
    if (g.i) geo.setIndex(g.i);
    geo.computeVertexNormals();
    return geo;
  };
  /* bevel gear in its own frame: apex at the origin, axis +Z; teeth lie on the pitch cone of half-angle `delta`.
     twist = total angular turn of every tooth from the outer end (s = 0) to the inner end (s = 1) → spiral teeth. */
  function bevelGear(o) {
    const { N, delta, dIn, dOut, toothH, twist = 0, stations = 1, phase = 0, back = 0.1, boreR = 0, hubR = 0, hubLen = 0,
            tip = 0.30, root = 0.62, sink = 0.9, bodyOff = 0.55, dStart } = o;
    const sD = Math.sin(delta), cD = Math.cos(delta), pitch = TAU / N;
    const P = (d, th, off) => { const r = d * sD + off * cD, z = d * cD - off * sD; return [r * Math.cos(th), r * Math.sin(th), z]; };
    const tp = [];
    const quad = (a, b, c, d) => { tp.push(...a, ...b, ...c, ...a, ...c, ...d); };
    for (let k = 0; k < N; k++) {
      let prev = null;
      for (let j = 0; j <= stations; j++) {
        const s = j / stations, d = dOut - (dOut - dIn) * s, h = toothH * d / dOut, th = k * pitch + phase + twist * s;
        const wR = root * pitch / 2, wT = tip * pitch / 2;
        const cur = { rL: P(d, th - wR, -sink * h * 0.5), rR: P(d, th + wR, -sink * h * 0.5), tL: P(d, th - wT, h * 0.55), tR: P(d, th + wT, h * 0.55) };
        if (j === 0) quad(cur.rL, cur.rR, cur.tR, cur.tL);
        if (prev) { quad(prev.tL, prev.tR, cur.tR, cur.tL); quad(prev.rL, prev.tL, cur.tL, cur.rL); quad(prev.rR, cur.rR, cur.tR, prev.tR); }
        if (j === stations) quad(cur.rL, cur.tL, cur.tR, cur.rR);
        prev = cur;
      }
    }
    const surf = (d) => { const off = -bodyOff * toothH * d / dOut; const r = d * sD + off * cD, z = d * cD - off * sD; return [z, r]; };
    const d0 = Math.max(dStart != null ? dStart : dIn, boreR > 0 ? boreR / sD + 0.002 : 0);
    const A = surf(d0), B = surf(dOut), zEnd = B[0] + back;
    const prof = [[A[0], boreR], A, B, [zEnd, B[1]], [zEnd, Math.max(hubR, boreR)]];
    if (hubLen > 0) prof.push([zEnd + hubLen, Math.max(hubR, boreR)], [zEnd + hubLen, boreR]); else prof.push([zEnd, boreR]);
    return { body: revolve(prof, 56, 'z'), teeth: { p: tp, i: null }, zEnd: zEnd + hubLen };
  }
  return { PI, TAU, S, revolve, cylinder, box, merge, xform, mkGeo, bevelGear };
}

/** Release the geometry of every mesh under `object` (materials stay with the caller). */
export function disposeGear(object) {
  object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
