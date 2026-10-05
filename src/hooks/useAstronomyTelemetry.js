import { useEffect, useState } from 'react'
import { getMoonTelemetry } from '../astronomy/moonPosition.js'

/**
 * Subscribes to an AstronomyClock and re-derives display telemetry
 * (phase, illumination, distance, RA/Dec, libration...) whenever the clock
 * notifies a change. The clock throttles those notifications itself, so
 * this hook re-renders only a few times per second even while playing.
 */
export function useAstronomyTelemetry(clock) {
  const [state, setState] = useState(() => ({
    date: clock.getDate(),
    playing: clock.playing,
    speed: clock.speed,
    telemetry: getMoonTelemetry(clock.getDate()),
  }))

  useEffect(() => {
    const unsubscribe = clock.subscribe((date, { playing, speed }) => {
      setState({ date, playing, speed, telemetry: getMoonTelemetry(date) })
    })
    return unsubscribe
  }, [clock])

  return state
}
