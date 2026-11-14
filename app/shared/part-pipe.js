/* part-pipe.js — shared 3D builders for pipes, cables and simple cylinders (mpfi, turbocharger, ignition, starting, exhaust system).
   Pure builders: every function takes THREE first, takes materials from the caller and returns objects the caller adds to its own scene.
   Geometry made here is released by disposePipe(object); materials are the caller's. */

/** A CurvePath of straight segments through the waypoints (particle streams follow the same polyline as the pipe). */
export function makeOrthoCurve(THREE, waypoints) {
  const path = new THREE.CurvePath();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    if (a.distanceTo(b) < 1e-4) continue;
    path.add(new THREE.LineCurve3(a.clone(), b.clone()));
  }
  return path;
}

/** A visible pipe: one cylinder per segment plus a sphere at every inner joint.  opts: { radial = 12, renderOrder = 2 } */
export function makeStraightPipe(THREE, waypoints, radius, mat, { radial = 12, renderOrder = 2 } = {}) {
  const group = new THREE.Group();
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1];
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 1e-4) continue;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, radial, 1, false), mat);
    mesh.position.copy(a).addScaledVector(dir, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    mesh.renderOrder = renderOrder;
    group.add(mesh);
  }
  for (let i = 1; i < waypoints.length - 1; i++) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, radial, 8), mat);
    sphere.position.copy(waypoints[i]);
    sphere.renderOrder = renderOrder;
    group.add(sphere);
  }
  return group;
}

/** A small decorative collar ring around a pipe joint, facing along dir (the caller adds it to its scene). */
export function makeCollar(THREE, point, dir, radius, mat) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.013, 0.018, 8, 18), mat);
  ring.position.copy(point);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize());
  ring.castShadow = true;
  return ring;
}

/** Waypoint polyline with every corner rounded by a quadratic fillet — points for a smooth CatmullRom tube. */
export function buildManhattanPoints(THREE, waypoints, fillet = 0.045) {
  const pts = [];
  for (let i = 0; i < waypoints.length; i++) {
    const curr = waypoints[i];
    if (i === 0 || i === waypoints.length - 1) { pts.push(curr.clone()); continue; }
    const prev = waypoints[i - 1], next = waypoints[i + 1];
    const toPrev = new THREE.Vector3().subVectors(prev, curr);
    const toNext = new THREE.Vector3().subVectors(next, curr);
    const dPrev = toPrev.length(), dNext = toNext.length();
    if (dPrev < 1e-5 || dNext < 1e-5) { pts.push(curr.clone()); continue; }
    toPrev.divideScalar(dPrev);
    toNext.divideScalar(dNext);
    if (toPrev.dot(toNext) > 0.9995) { pts.push(curr.clone()); continue; }
    const r = Math.min(fillet, dPrev * 0.4, dNext * 0.4);
    const p1 = curr.clone().addScaledVector(toPrev, r);
    const p2 = curr.clone().addScaledVector(toNext, r);
    for (let s = 0; s <= 5; s++) {
      const t = s / 5, mt = 1 - t;
      pts.push(new THREE.Vector3().copy(p1).multiplyScalar(mt * mt).addScaledVector(curr, 2 * mt * t).addScaledVector(p2, t * t));
    }
  }
  return pts;
}

/** A smooth cable along the waypoints. Returns { mesh, curve }.  opts: { fillet = 0.045, radial = 10 } */
export function makeManhattanWire(THREE, waypoints, radius, mat, { fillet = 0.045, radial = 10 } = {}) {
  const pts = buildManhattanPoints(THREE, waypoints, fillet);
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, pts.length * 2), radius, radial, false), mat);
  mesh.castShadow = true;
  return { mesh, curve };
}

/** A cylinder lying along x (orient 'x'), z ('z') or y (anything else) — a shaft, a drum, a pipe stub. */
export function makeCylinder(THREE, r, len, mat, orient = 'x') {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24), mat);
  if (orient === 'x') m.rotation.z = Math.PI / 2;
  else if (orient === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

/** Release the geometry of everything built here (materials stay with the caller). */
export function disposePipe(object) {
  object.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
}
