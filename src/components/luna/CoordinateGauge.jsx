import React from 'react'

function raToHMS(hours) {
  const h = Math.floor(hours)
  const mFull = (hours - h) * 60
  const m = Math.floor(mFull)
  const s = Math.round((mFull - m) * 60)
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function decToDMS(deg) {
  const sign = deg < 0 ? '-' : '+'
  const abs = Math.abs(deg)
  const d = Math.floor(abs)
  const mFull = (abs - d) * 60
  const m = Math.floor(mFull)
  const s = Math.round((mFull - m) * 60)
  return `${sign}${d}° ${String(m).padStart(2, '0')}' ${String(s).padStart(2, '0')}"`
}

export default function CoordinateGauge({ telemetry }) {
  return (
    <div className="lt-panel">
      <div className="lt-panel-title">COORDINATE GAUGE</div>
      <hr className="lt-divider" />
      <div className="lt-row" style={{ padding: '4px 0' }}>
        <span className="lt-row-label">RA</span>
        <span className="lt-row-value">{raToHMS(telemetry.raHours)}</span>
      </div>
      <div className="lt-row" style={{ padding: '4px 0' }}>
        <span className="lt-row-label">DEC</span>
        <span className="lt-row-value">{decToDMS(telemetry.decDeg)}</span>
      </div>
      <div className="lt-row" style={{ padding: '4px 0' }}>
        <span className="lt-row-label">SUB-EARTH</span>
        <span className="lt-row-value">
          {telemetry.subEarthLonDeg >= 0 ? '+' : ''}
          {telemetry.subEarthLonDeg.toFixed(2)}° / {telemetry.subEarthLatDeg >= 0 ? '+' : ''}
          {telemetry.subEarthLatDeg.toFixed(2)}°
        </span>
      </div>
    </div>
  )
}
