import { useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animates a displayed number toward `target` (from wherever it currently is). NaN passes through. */
export function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(reduced() ? target : 0)
  const shown = useRef(reduced() ? target : 0)

  useEffect(() => {
    if (!Number.isFinite(target) || reduced()) {
      shown.current = target
      setValue(target)
      return undefined
    }
    const from = Number.isFinite(shown.current) ? shown.current : 0
    const t0 = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      shown.current = from + (target - from) * eased
      setValue(shown.current)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}
