// Shared constants for the astronomy modules.
// Keeping these in one place makes the approximations easy to audit.

// Moon's sidereal rotation period — the time it takes to complete one full
// spin relative to the distant stars. Because the Moon is tidally locked,
// this is (to high precision) identical to its sidereal orbital period.
export const SIDEREAL_MONTH_DAYS = 27.321661

// Mean synodic month (New Moon to New Moon). Shown in the UI as reference info.
export const SYNODIC_MONTH_DAYS = 29.530589

// Mean equatorial radius of the Moon, for telemetry display.
export const MOON_RADIUS_KM = 1737.4

// Reference epoch: J2000.0 (2000-01-01 12:00:00 TT, approximated here with UTC,
// which is within seconds of TT for this application's purposes).
export const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0))

// Astronomical unit, in kilometers, for converting AU-based vectors from
// astronomy-engine into kilometers for display.
export const AU_KM = 149597870.7
