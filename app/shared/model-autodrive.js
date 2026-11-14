/* model-autodrive.js — pure-pursuit steering for a car that follows a closed or open path (no DOM, no three.js).
   The car looks `lookahead` metres down the path from its nearest point, and steers along the circle through that point:
   curvature κ = 2·x_local / L²,  road-wheel angle δ = atan(wheelbase · κ)  (bicycle model).
   Conventions: positions in the x–z plane; heading h = 0 faces +z and grows toward +x (position += (sin h, cos h)·v·dt). */

/** A sampled path: pts = [{ x, z }, …] evenly spaced `stepLen` apart; closed paths wrap around. */
export function makePath(pts, stepLen, closed = true) { return { pts, stepLen, closed }; }

/** Index of the path point nearest to (x, z). */
export function nearestIndex(path, x, z) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < path.pts.length; i++) {
    const dx = path.pts[i].x - x, dz = path.pts[i].z - z, d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/** The look-ahead target: `lookahead` metres of path beyond the nearest point (wraps on a closed path, stops at the end of an open one). */
export function lookaheadPoint(path, x, z, lookahead) {
  const n = path.pts.length, steps = Math.max(1, Math.round(lookahead / path.stepLen)), i = nearestIndex(path, x, z) + steps;
  return path.pts[path.closed ? i % n : Math.min(i, n - 1)];
}

/** Road-wheel angle (rad, + = steer toward +x of the car's own frame) that drives the car through the look-ahead point. */
export function pursuitAngle(path, x, z, heading, { lookahead, wheelbase, minLd = 0.75 }) {
  const t = lookaheadPoint(path, x, z, lookahead), dx = t.x - x, dz = t.z - z, c = Math.cos(heading), s = Math.sin(heading);
  const localX = dx * c - dz * s, localZ = dx * s + dz * c;
  const Ld = Math.max(minLd, Math.hypot(localX, localZ));
  return Math.atan(wheelbase * 2 * localX / (Ld * Ld));
}

/** The steering command in −1 … +1 for a wheel whose lock is ±maxRoadAngle (sign flipped: the steering wheel turns clockwise for a right turn,
    the road wheels point the other way in this module's convention — callers that use the angle directly can call pursuitAngle). */
export function pursuitSteerInput(path, x, z, heading, opts) {
  return Math.max(-1, Math.min(1, -pursuitAngle(path, x, z, heading, opts) / opts.maxRoadAngle));
}
