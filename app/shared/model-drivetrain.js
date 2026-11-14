/* model-drivetrain.js — pure maths of a final drive + differential (no DOM, no three.js).
   Used by modules/shaftdiff--differential.js and tests/mod-differential.test.mjs.

   Conventions: ω in any consistent unit (rad/s); torque as a fraction of the carrier input torque or in N·m.
   A differential always obeys   ω_carrier = (ω_L + ω_R) / 2   (kinematics: the carrier is the mean of the two axles).
   Torque split depends on the type:  open → equal torque each side (limited by the weaker wheel's grip);
   limited-slip → the strong wheel may carry up to `bias` × the weak wheel's torque (torque bias ratio, TBR);
   locked → no limit, torque goes wherever there is grip. */

/** Final-drive ratio = crown-wheel teeth / pinion teeth (the pinion turns this many times per carrier turn). */
export const finalDriveRatio = (ringTeeth, pinionTeeth) => ringTeeth / pinionTeeth;

/** Carrier speed from the two axle speeds: (ω_L + ω_R) / 2. */
export const carrierSpeed = (wL, wR) => (wL + wR) / 2;

/** Bias value for torqueSplit: an open differential. */
export const BIAS_OPEN = 1;
/** Bias value for torqueSplit: a locked differential (no limit). */
export const BIAS_LOCKED = Infinity;

/** Turn ratio r = (half rear track / wheelbase) · tan(road-wheel angle); the outer axle runs (1 + r), the inner (1 − r). */
export const turnRatio = (halfTrack, wheelbase, roadAngle) => (halfTrack / wheelbase) * Math.tan(roadAngle);

/**
 * Axle speeds for a given carrier speed.
 * mode: 'open' | 'locked' | 'slipLeft' | 'slipRight'
 *   open       ω_L = ω_c (1 + r), ω_R = ω_c (1 − r)           (sum = 2 ω_c)
 *   locked     ω_L = ω_R = ω_c                                (the differential cannot differentiate)
 *   slipLeft   the left wheel has no grip on an OPEN differential: ω_L = 2 ω_c, ω_R = 0
 *   slipRight  mirror image
 * `locked` wins over a slip request (a locked differential drags both wheels at the carrier speed).
 * Returns { wL, wR, slip }.
 */
export function axleSpeeds(mode, wc, r = 0) {
  switch (mode) {
    case 'locked':    return { wL: wc, wR: wc, slip: false };
    case 'slipLeft':  return { wL: 2 * wc, wR: 0, slip: true };
    case 'slipRight': return { wL: 0, wR: 2 * wc, slip: true };
    default:          return { wL: wc * (1 + r), wR: wc * (1 - r), slip: false };
  }
}

/** Speed of the small (spider) gears: they turn with HALF the speed difference of the side gears, times the tooth ratio. */
export const spiderSpeed = (wL, wR, sideTeeth, spiderTeeth) => (wL - wR) * 0.5 * (sideTeeth / spiderTeeth);

/**
 * Torque delivered to each wheel.
 *   torque  carrier input torque (any unit)
 *   gripL / gripR  the most torque each wheel can pass to the ground before it spins (same unit)
 *   bias    BIAS_OPEN (1) · a torque-bias ratio ≥ 1 (limited slip) · BIAS_LOCKED (Infinity)
 * The weaker wheel takes min(its grip, half the input); the stronger one takes the rest, but never more than
 * its own grip, never more than bias × the weak wheel's torque. Returns { L, R } (L + R ≤ torque).
 */
export function torqueSplit(torque, gripL, gripR, bias = BIAS_OPEN) {
  const leftWeak = gripL <= gripR;
  const weakGrip = leftWeak ? gripL : gripR, strongGrip = leftWeak ? gripR : gripL;
  const weak = Math.max(0, Math.min(weakGrip, torque / 2));
  const cap = bias === Infinity ? strongGrip : bias * weak;          /* Infinity × 0 would be NaN */
  const strong = Math.max(0, Math.min(strongGrip, cap, torque - weak));
  return leftWeak ? { L: weak, R: strong } : { L: strong, R: weak };
}

/** Tooth counts of the modelled differential: crown wheel 40 / pinion 10 (final drive 4 : 1), large side gears 14 / small spider gears 10. */
export const DIFF_TEETH = Object.freeze({ crown: 40, pinion: 10, side: 14, spider: 10 });

/** Pitch-cone half angles (rad) of the meshing bevel pairs, axes at 90°: delta_small = atan(N_small / N_large), delta_large = π/2 − delta_small. */
export function pitchCones(teeth = DIFF_TEETH) {
  const pinion = Math.atan2(teeth.pinion, teeth.crown), spider = Math.atan2(teeth.spider, teeth.side);
  return { pinion, crown: Math.PI / 2 - pinion, spider, side: Math.PI / 2 - spider };
}
