/* model-spray.js — injector spray particles (pure; used by the MPFI / CRDi page).
   A particle belongs to one cylinder, lives at t ∈ [0, 1] along the spray (0 = injector tip, 1 = end of the plume) and only moves while its cylinder is firing. */

/** One particle: its cylinder, start phase, angle around the axis, radius share and speed factor (the speed field is `spd`). */
export function makeSprayParticle(index, perCylinder, rnd = Math.random) {
  return { cyl: Math.floor(index / perCylinder), t: rnd(), ang: rnd() * Math.PI * 2, rad: 0.4 + rnd() * 0.6, spd: 0.7 + rnd() * 0.6 };
}

/** Advance one particle: it moves only while its own cylinder is firing; past the end of the plume it restarts at the tip. */
export function stepSpray(p, sim, spraySpeed, firingCyl, firingNow) {
  if (p.cyl === firingCyl && firingNow) p.t += sim * p.spd * spraySpeed;
  if (p.t > 1) p.t = 0;
  return p;
}

/** Where the particle is: straight down from the tip, spreading with t inside a cone of half-angle `sprayAngle`. */
export function sprayPoint(p, tip, sprayLen, sprayAngle) {
  const r = p.t * sprayAngle * (0.4 + p.rad * 0.6);
  return { x: tip.x + Math.cos(p.ang) * r, y: tip.y - p.t * sprayLen, z: Math.sin(p.ang) * r };
}
