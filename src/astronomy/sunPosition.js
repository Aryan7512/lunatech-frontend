import * as Astronomy from 'astronomy-engine'

/**
 * Computes the direction from the Moon's center toward the Sun, at a given
 * date/time, using real ephemerides (astronomy-engine's VSOP87-derived Sun
 * position and ELP2000-derived Moon position).
 *
 * Both bodies are first evaluated as GEOCENTRIC vectors (relative to Earth's
 * center) in the J2000 mean equatorial frame (EQJ), which is what
 * astronomy-engine's GeoVector() returns. Subtracting the Moon's geocentric
 * vector from the Sun's geocentric vector gives the vector FROM THE MOON
 * TO THE SUN — this is what actually determines which hemisphere of the
 * Moon is lit, not the Sun's direction as seen from Earth. (In practice the
 * two are almost identical, since the Sun is ~390x farther from the Moon
 * than the Moon is from Earth, but computing it this way is the physically
 * correct approach rather than an assumption.)
 *
 * The result is then rotated into the ecliptic-of-date frame (a plane-based
 * frame where +z points toward the north ecliptic pole) purely so that the
 * direction has a simple, consistent meaning when handed to the 3D scene —
 * see astronomy/coordinateFrame.js for how this maps onto the Three.js scene.
 *
 * @param {Date} date
 * @returns {{x:number, y:number, z:number}} normalized direction vector, ecliptic-of-date frame
 */
export function getSunDirectionFromMoon(date) {
  const time = Astronomy.MakeTime(date)

  const sunGeo = Astronomy.GeoVector(Astronomy.Body.Sun, time, true)
  const moonGeo = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)

  const dx = sunGeo.x - moonGeo.x
  const dy = sunGeo.y - moonGeo.y
  const dz = sunGeo.z - moonGeo.z

  const diff = new Astronomy.Vector(dx, dy, dz, time)
  const ecliptic = Astronomy.Ecliptic(diff)

  const { x, y, z } = ecliptic.vec
  const len = Math.hypot(x, y, z) || 1

  return { x: x / len, y: y / len, z: z / len }
}
