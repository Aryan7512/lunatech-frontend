import { SIDEREAL_MONTH_DAYS, J2000 } from './constants.js'

/**
 * Computes the Moon's rotation angle (radians, about its rotation axis) for
 * a given date, based purely on elapsed time since J2000 and the Moon's real
 * sidereal rotation period (27.321661 days).
 *
 * This is intentionally a pure function of `date` — NOT an accumulated
 * per-frame increment — so that the Moon's astronomical orientation is fully
 * deterministic for a given simulated date/time (requirement: scrubbing the
 * clock or jumping to "NOW" must always produce the same orientation, and
 * dragging the camera must never feed back into this value).
 *
 * APPROXIMATIONS:
 *  - The Moon's real rotation also includes libration (a small periodic
 *    wobble caused by the Moon's non-circular orbit) and a ~6.7 degree axial
 *    tilt relative to its orbital plane. Neither is modeled here — this
 *    function models only the mean, uniform sidereal spin. Since the
 *    illuminated terminator in this scene is produced by an independent
 *    directional light (see sunPosition.js) rather than by this rotation,
 *    the Moon's phase rendering is unaffected by this simplification.
 *  - The rotation's zero-point (which crater faces which direction at
 *    JD 2451545.0) is arbitrary, since the source GLB's texture alignment
 *    to real selenographic longitude 0 is unknown. Only the *rate* is
 *    astronomically accurate.
 *
 * @param {Date} date
 * @returns {number} rotation angle in radians, in [0, 2*PI)
 */
export function getMoonRotationAngle(date) {
  const days = (date.getTime() - J2000.getTime()) / 86400000
  const cycles = days / SIDEREAL_MONTH_DAYS
  const fraction = cycles - Math.floor(cycles)
  return fraction * Math.PI * 2
}
