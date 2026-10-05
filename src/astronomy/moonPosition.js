import * as Astronomy from 'astronomy-engine'
import { AU_KM } from './constants.js'

const PHASE_NAMES = [
  { max: 11.25, name: 'New Moon' },
  { max: 78.75, name: 'Waxing Crescent' },
  { max: 101.25, name: 'First Quarter' },
  { max: 168.75, name: 'Waxing Gibbous' },
  { max: 191.25, name: 'Full Moon' },
  { max: 258.75, name: 'Waning Gibbous' },
  { max: 281.25, name: 'Last Quarter' },
  { max: 348.75, name: 'Waning Crescent' },
  { max: 360.01, name: 'New Moon' },
]

function phaseNameFromRelativeLongitude(deg) {
  const a = ((deg % 360) + 360) % 360
  for (const bucket of PHASE_NAMES) {
    if (a < bucket.max) return bucket.name
  }
  return 'New Moon'
}

/**
 * Computes a bundle of real astronomical telemetry for the Moon at a given
 * date/time. This is intentionally independent of the Three.js scene and the
 * camera — it describes the physical Earth/Moon/Sun configuration, not what
 * the user currently happens to be looking at.
 *
 * Sources (all via astronomy-engine, a VSOP87/ELP2000-class ephemeris library):
 *  - Astronomy.GeoVector(Moon):  geocentric position -> distance, RA/Dec
 *  - Astronomy.Illumination(Moon): Sun-Moon-Earth phase angle -> illuminated fraction
 *  - Astronomy.MoonPhase(): geocentric ecliptic longitude difference (Sun, Moon)
 *    -> conventional phase name (New/First Quarter/Full/Last Quarter/etc.)
 *  - Astronomy.Libration(): real optical libration (sub-Earth point wobble)
 *
 * @param {Date} date
 */
export function getMoonTelemetry(date) {
  const time = Astronomy.MakeTime(date)

  const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, time, true)
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, time)
  const relativeLongitudeDeg = Astronomy.MoonPhase(time)
  const libration = Astronomy.Libration(time)
  const equatorial = Astronomy.EquatorFromVector(moonVec)

  // --- Subsolar point (APPROXIMATION — see note below) ---
  // A rigorous subsolar selenographic longitude/latitude requires rotating
  // the Sun's direction into the Moon's body-fixed principal-axis frame
  // (a full lunar orientation model). That's out of scope here. Instead:
  //  - Subsolar LONGITUDE is approximated directly from the Sun-Moon
  //    relative ecliptic longitude (0 deg at New Moon, ±180 deg at Full
  //    Moon) — this is the dominant, first-order term and is a standard
  //    simplification.
  //  - Subsolar LATITUDE is approximated using the Moon's optical libration
  //    in latitude as a stand-in of the correct order of magnitude
  //    (a degree or two). It is illustrative telemetry, not a precise
  //    selenographic computation.
  const subsolarLon = relativeLongitudeDeg > 180 ? relativeLongitudeDeg - 360 : relativeLongitudeDeg
  const subsolarLat = -libration.mlat

  return {
    distanceKm: moonVec.Length() * AU_KM,
    illuminatedFraction: illum.phase_fraction,
    phaseAngleDeg: relativeLongitudeDeg,
    phaseName: phaseNameFromRelativeLongitude(relativeLongitudeDeg),
    raHours: equatorial.ra,
    decDeg: equatorial.dec,
    // Real optical libration of the sub-Earth point (degrees, from astronomy-engine).
    subEarthLonDeg: libration.elon,
    subEarthLatDeg: libration.elat,
    // Approximate — see comment above.
    subsolarLonDeg: subsolarLon,
    subsolarLatDeg: subsolarLat,
  }
}
