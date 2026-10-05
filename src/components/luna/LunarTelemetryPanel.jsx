import React from 'react'
import { getMoonRotationAngle } from '../../astronomy/moonRotation.js'

function formatDeg(deg, hemispherePositive, hemisphereNegative) {
  const hemi = deg >= 0 ? hemispherePositive : hemisphereNegative
  return `${deg >= 0 ? '+' : ''}${deg.toFixed(2)}° ${hemi}`
}

export default function LunarTelemetryPanel({ telemetry, date }) {
  const rotationDeg = (getMoonRotationAngle(date) * 180) / Math.PI

  return (
    <div className="lt-panel">
      <div className="lt-panel-title">LUNAR TELEMETRY</div>
      <div className="lt-panel-subtitle">Current astronomical state vector</div>

      <hr className="lt-divider" />

      <div className="lt-row">
        <span className="lt-row-label">Phase</span>
        <span className="lt-row-value lt-row-value--gold">{telemetry.phaseName}</span>
      </div>
      <hr className="lt-divider" />
      <div className="lt-row">
        <span className="lt-row-label">Illumination</span>
        <span className="lt-row-value lt-row-value--gold">
          {(telemetry.illuminatedFraction * 100).toFixed(1)}%
        </span>
      </div>
      <hr className="lt-divider" />
      <div className="lt-row">
        <span className="lt-row-label">Distance</span>
        <span className="lt-row-value">{Math.round(telemetry.distanceKm).toLocaleString('en-US')} KM</span>
      </div>
      <hr className="lt-divider" />
      <div className="lt-row">
        <span className="lt-row-label">Rotation</span>
        <span className="lt-row-value">{rotationDeg.toFixed(2)}°</span>
      </div>
      <hr className="lt-divider" />
      <div className="lt-row">
        <span className="lt-row-label">Subsolar Lat</span>
        <span className="lt-row-value">{formatDeg(telemetry.subsolarLatDeg, 'N', 'S')}</span>
      </div>
      <hr className="lt-divider" />
      <div className="lt-row">
        <span className="lt-row-label">Subsolar Lon</span>
        <span className="lt-row-value">{formatDeg(telemetry.subsolarLonDeg, 'E', 'W')}</span>
      </div>
    </div>
  )
}
