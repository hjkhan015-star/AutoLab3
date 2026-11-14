/* part-signal.js — particles that flow along a link between two points (CAN bus traffic, ECU signal lines).
   makeSignalLink builds the particles; flowSignalLinks advances them each frame. Materials and the shared sphere geometry are
   created / owned by the caller side as noted; disposeSignalLinks releases what makeSignalLink created. */

/** Create `count` particles for the link a → b (parent gets the meshes). opts: { count = 4, additive = false }
    additive: translucent, additive-blended, no depth write (ECU style) — otherwise plain colour (OBD2 style).
    Returns { a, b, parts }; callers may add their own fields (tube, dead, …). `geo` is one shared SphereGeometry. */
export function makeSignalLink(THREE, parent, geo, a, b, colour, { count = 4, additive = false } = {}) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const mat = additive
      ? new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })
      : new THREE.MeshBasicMaterial({ color: colour });
    const p = new THREE.Mesh(geo, mat);
    parent.add(p);
    parts.push(p);
  }
  return { a: a.clone(), b: b.clone(), parts };
}

/** Advance every link's particles: each runs a → b once per 1 / hz seconds, staggered. A link with `dead = true` hides its particles.
    opts: { base = 0.5, amp = 0.6, fade = false } — scale = base + amp·sin(πu); fade also drives material opacity 0.35 + 0.65·sin(πu). */
export function flowSignalLinks(links, t, hz, { base = 0.5, amp = 0.6, fade = false } = {}) {
  for (const link of links) {
    const n = link.parts.length;
    for (let i = 0; i < n; i++) {
      const p = link.parts[i];
      if (link.dead) { p.visible = false; continue; }
      if (fade) p.visible = true;
      let u = (t * hz + i / n) % 1;
      if (u < 0) u += 1;
      p.position.lerpVectors(link.a, link.b, u);
      const s = Math.sin(Math.PI * u);
      p.scale.setScalar(base + amp * s);
      if (fade) p.material.opacity = 0.35 + 0.65 * s;
    }
  }
}

/** Release the materials makeSignalLink created (the shared geometry belongs to the caller). */
export function disposeSignalLinks(links) {
  for (const link of links) for (const p of link.parts) { p.parent && p.parent.remove(p); p.material.dispose(); }
}
