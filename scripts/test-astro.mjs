import * as Astronomy from 'astronomy-engine'
import { getSunDirectionFromMoon } from '../src/astronomy/sunPosition.js'
import { getMoonRotationAngle } from '../src/astronomy/moonRotation.js'
import { getMoonTelemetry } from '../src/astronomy/moonPosition.js'
import { SIDEREAL_MONTH_DAYS } from '../src/astronomy/constants.js'

function test(label, targetLon, startDate) {
  const time = Astronomy.SearchMoonPhase(targetLon, startDate, 40)
  const date = time.date
  const t = getMoonTelemetry(date)
  console.log(
    `${label.padEnd(14)} ${date.toISOString()}  illum=${(t.illuminatedFraction * 100).toFixed(1)}%  phaseName=${t.phaseName}  relLon=${t.phaseAngleDeg.toFixed(1)}`
  )
}

console.log('--- Phase / illumination accuracy check ---')
const start = new Date('2026-01-01T00:00:00Z')
test('New Moon', 0, start)
test('First Quarter', 90, start)
test('Full Moon', 180, start)
test('Last Quarter', 270, start)

console.log('\n--- Sun direction sanity check (unit length, finite) ---')
const dir = getSunDirectionFromMoon(new Date())
const len = Math.hypot(dir.x, dir.y, dir.z)
console.log('direction:', dir, 'length:', len.toFixed(6))

console.log('\n--- Moon rotation determinism check ---')
const d1 = new Date('2026-06-01T00:00:00Z')
const d2 = new Date(d1.getTime() + SIDEREAL_MONTH_DAYS * 86400000) // exactly one sidereal period later
const a1 = getMoonRotationAngle(d1)
const a2 = getMoonRotationAngle(d2)
console.log('angle at t:            ', a1.toFixed(6), 'rad')
console.log('angle at t + 1 sidereal:', a2.toFixed(6), 'rad (should match)')
console.log('same date twice matches:', getMoonRotationAngle(d1) === getMoonRotationAngle(d1))
