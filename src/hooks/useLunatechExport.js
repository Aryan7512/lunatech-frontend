import { useEffect, useState } from 'react'
import { buildStages } from '../data/lunatechStages.js'

const BASE = import.meta.env.BASE_URL
export const EXPORT_JSON = `${BASE}data/lunatech_export.json`

/**
 * Loads the notebook's §10 export (public/data/lunatech_export.json + lunatech_A/B.png).
 * status: 'loading' | 'ready' | 'missing'
 */
export function useLunatechExport() {
  const [state, setState] = useState({ status: 'loading', data: null, model: null, imgA: null, imgB: null })

  useEffect(() => {
    let cancelled = false
    fetch(EXPORT_JSON, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        const v = encodeURIComponent(data.provenance?.generated_utc ?? '')
        setState({
          status: 'ready',
          data,
          model: buildStages(data),
          imgA: `${BASE}data/lunatech_A.png?v=${v}`,
          imgB: `${BASE}data/lunatech_B.png?v=${v}`,
        })
      })
      .catch(() => !cancelled && setState({ status: 'missing', data: null, model: null, imgA: null, imgB: null }))
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
