import React from 'react'
import { MOON_RADIUS_KM, SYNODIC_MONTH_DAYS } from '../../astronomy/constants.js'

function formatKm(km) {
  return Math.round(km).toLocaleString('en-US')
}

export default function TelemetryPanel({ telemetry }) {
  const illumPct = telemetry.illuminatedFraction * 100

  return (
    <div className="lt-panel lt-panel--accent">
      <div className="lt-panel-title">VECTOR TELEMETRY // PRIMARY</div>
      <div className="lt-panel-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
        LUNAR-01
      </div>

      <hr className="lt-divider" />

      <div className="lt-metric-label">MOON RADIUS</div>
      <div className="lt-metric-value">{MOON_RADIUS_KM.toLocaleString('en-US')} KM</div>
      <div className="lt-metric-caption">Mean equatorial radius</div>

      <hr className="lt-divider" />

      <div className="lt-metric-label">MOON DISTANCE</div>
      <div className="lt-metric-value">{formatKm(telemetry.distanceKm)} KM</div>
      <div className="lt-metric-caption">Current geocentric distance</div>

      <hr className="lt-divider" />

      <div className="lt-metric-label">ILLUMINATION</div>
      <div className="lt-metric-value lt-metric-value--gold">{illumPct.toFixed(1)}%</div>
      <div className="lt-metric-caption" style={{ letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', fontSize: 9, textTransform: 'uppercase' }}>
        SOL-INCIDENT
      </div>
      <div className="lt-bar">
        <div className="lt-bar-fill" style={{ width: `${illumPct}%` }} />
      </div>
      <div className="lt-metric-caption">Current illuminated visible fraction</div>

      <hr className="lt-divider" />

      <div className="lt-row">
        <span className="lt-row-label">Synodic cycle</span>
        <span className="lt-row-value">{SYNODIC_MONTH_DAYS.toFixed(5)} D</span>
      </div>
    </div>
  )
}
