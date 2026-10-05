import React from 'react'
import { useLunatechExport } from '../../hooks/useLunatechExport.js'
import { demoPairFromExport, ABLATION, STRESS, CAVEATS } from '../../data/registrationResults.js'

const fmt = (v, d = 2) => v.toFixed(d)

function Bars({ title, unit, values, labels, max, lowerBetter }) {
  return (
    <div className="lt-reg-card">
      <div className="lt-reg-card-title">
        {title} <span>{lowerBetter ? 'lower is better' : 'higher is better'}</span>
      </div>
      {values.map((v, i) => (
        <div key={labels[i]} className="lt-reg-bar-row">
          <span className="lt-reg-bar-label">{labels[i]}</span>
          <span className="lt-reg-bar-track">
            <span className={`lt-reg-bar ${i === values.length - 1 ? 'lt-reg-bar--hi' : ''}`} style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="lt-reg-bar-val">{unit === 'n' ? v : v.toFixed(unit === '%' ? 0 : 3)}{unit === '%' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  )
}

function StressHeatmap() {
  const flat = STRESS.rmse.flat()
  const lo = Math.min(...flat)
  const hi = Math.max(...flat)
  return (
    <div className="lt-reg-card">
      <div className="lt-reg-card-title">
        STRESS MATRIX · RMSE (px) <span>3 pairs per cell</span>
      </div>
      <div className="lt-reg-heat" style={{ gridTemplateColumns: `auto repeat(${STRESS.scale.length}, 1fr)` }}>
        <span className="lt-reg-heat-axis" />
        {STRESS.scale.map((s) => (
          <span key={s} className="lt-reg-heat-axis">{s}× SCALE</span>
        ))}
        {STRESS.rmse.map((row, r) => (
          <React.Fragment key={r}>
            <span className="lt-reg-heat-axis">ILLUM {STRESS.illum[r].toFixed(1)}</span>
            {row.map((v, c) => (
              <span
                key={c}
                className="lt-reg-heat-cell"
                style={{ background: `rgba(242, 202, 80, ${0.12 + 0.6 * ((v - lo) / (hi - lo))})` }}
              >
                {v.toFixed(2)}
              </span>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="lt-reg-foot">All cells stay below the 1 px sub-pixel line. Darker gold = higher error.</div>
    </div>
  )
}

export function RegistrationReport({ onClose }) {
  const labels = ABLATION.map((a) => a.label)
  const DEMO_PAIR = demoPairFromExport(useLunatechExport().data)
  React.useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="lt-reg-overlay" role="dialog" aria-modal="true" aria-label="Registration report" onClick={onClose}>
      <div className="lt-reg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lt-reg-head">
          <div>
            <div className="lt-panel-title">LUNATECH · REGISTRATION REPORT</div>
            <div className="lt-reg-sub">SIH26166 · PROTOTYPE v3 · REAL OHRC CROPS</div>
          </div>
          <button className="lt-btn" onClick={onClose} aria-label="Close report">CLOSE ✕</button>
        </div>

        <div className="lt-reg-tiles">
          {DEMO_PAIR ? (
            <>
              <Tile k="RMSE" v={`${fmt(DEMO_PAIR.rmsePx, 3)} px`} s={`median ${fmt(DEMO_PAIR.medianPx, 3)} · p90 ${fmt(DEMO_PAIR.p90Px, 3)}`} />
              <Tile k="SUB-PIXEL INLIERS" v={`${(DEMO_PAIR.subpixelRatio * 100).toFixed(1)}%`} s="error < 1 px" />
              <Tile k="CERTIFIED POINTS" v={DEMO_PAIR.points} s={`grid coverage ${(DEMO_PAIR.gridCoverage * 100).toFixed(0)}%`} />
              <Tile k="RUNTIME" v={`${fmt(DEMO_PAIR.runtimeS)} s`} s={`budget ${DEMO_PAIR.budgetS} s`} />
            </>
          ) : (
            <Tile k="DEMO PAIR" v="—" s="lunatech_export.json not loaded" />
          )}
        </div>
        <div className="lt-reg-foot">Tiles: read live from public/data/lunatech_export.json, the same pair the Match Lab shows. Charts below: mean over 10 pairs from the notebook, which the single-pair export cannot reproduce.</div>

        <div className="lt-reg-grid">
          <Bars title="RMSE (px)" unit="d" values={ABLATION.map((a) => a.rmse)} labels={labels} max={0.35} lowerBetter />
          <Bars title="SUB-PIXEL INLIER RATIO" unit="%" values={ABLATION.map((a) => a.inlier * 100)} labels={labels} max={100} />
          <Bars title="GRID COVERAGE" unit="%" values={ABLATION.map((a) => a.coverage * 100)} labels={labels} max={100} />
          <Bars title="CERTIFIED POINTS" unit="n" values={ABLATION.map((a) => a.points)} labels={labels} max={1200} />
        </div>

        <StressHeatmap />

        <div className="lt-reg-card lt-reg-caveats">
          <div className="lt-reg-card-title">LIMITATIONS <span>read before quoting numbers</span></div>
          <ul>
            {CAVEATS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Tile({ k, v, s }) {
  return (
    <div className="lt-reg-tile">
      <div className="lt-reg-tile-k">{k}</div>
      <div className="lt-reg-tile-v">{v}</div>
      <div className="lt-reg-tile-s">{s}</div>
    </div>
  )
}
