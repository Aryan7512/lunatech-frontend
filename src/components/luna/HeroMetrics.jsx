import React from 'react'
import { ABLATION } from '../../data/registrationResults.js'
import { useCountUp } from '../../hooks/useCountUp.js'

const base = ABLATION[0]
const full = ABLATION[3]

function Tile({ label, value, format, sub, good, children }) {
  const v = useCountUp(value, 1400)
  return (
    <div className="lt-hero-tile">
      <div className="lt-hero-k">{label}</div>
      <div className={`lt-hero-v ${good ? 'is-good' : ''}`}>{format(v)}</div>
      {children}
      <div className="lt-hero-s">{sub}</div>
    </div>
  )
}

// Headline results from the notebook's 10-pair ablation (src/data/registrationResults.js).
export default function HeroMetrics({ onOpenLab }) {
  const under = (1 / full.rmse).toFixed(1)
  const gain = Math.round((1 - full.rmse / base.rmse) * 100)
  return (
    <div className="lt-hero" aria-label="Headline results">
      <div className="lt-hero-tiles">
        <Tile label="ACCURACY (RMSE)" value={full.rmse} format={(v) => `${v.toFixed(2)} px`} good sub={`${under}× under the 1 px line · ${gain}% better than SIFT+RANSAC`}>
          <div className="lt-hero-gauge" aria-hidden="true">
            <span style={{ width: `${Math.min(100, full.rmse * 100)}%` }} />
            <em>1 px</em>
          </div>
        </Tile>
        <Tile label="SUB-PIXEL INLIERS" value={full.inlier * 100} format={(v) => `${v.toFixed(1)}%`} sub="of points within 1 px" />
      </div>
      <div className="lt-hero-foot">
        <span>{Math.round(full.coverage * 100)}% grid coverage · {full.runtime.toFixed(2)} s per pair · mean of 10 pairs</span>
        <button className="lt-btn" onClick={onOpenLab}>MATCH LAB →</button>
      </div>
    </div>
  )
}
