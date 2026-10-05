import React from 'react'
import { useAstronomyTelemetry } from '../../hooks/useAstronomyTelemetry.js'

// [multiplier, label]. At 1x-1000x the Sun/terminator barely moves on screen
// (the Moon spins ~13 deg/day), so the upper presets are hours/days per second.
const SPEEDS = [
  [1, '1×'],
  [1000, '1000×'],
  [3600, '1H/s'],
  [86400, '1D/s'],
  [432000, '5D/s'],
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function toDateInputValue(date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function toTimeInputValue(date) {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
}

function formatReadout(date) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  return `${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} · ${pad(
    date.getUTCHours()
  )}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
}

export default function SimulationClock({ clock }) {
  const { date, playing, speed } = useAstronomyTelemetry(clock)

  function applyDatePart(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const next = new Date(date)
    next.setUTCFullYear(y, m - 1, d)
    clock.setDate(next)
  }

  function applyTimePart(timeStr) {
    const parts = timeStr.split(':').map(Number)
    const [h, mi, s] = [parts[0] || 0, parts[1] || 0, parts[2] || 0]
    const next = new Date(date)
    next.setUTCHours(h, mi, s, 0)
    clock.setDate(next)
  }

  function step(hours) {
    clock.setDate(new Date(date.getTime() + hours * 3600 * 1000))
  }

  return (
    <div className="lt-panel">
      <div className="lt-panel-title">SIMULATION TIME // CLOCK</div>
      <div className="lt-panel-subtitle" style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
        SUN-ANGLE DRIVER · UTC
      </div>

      <hr className="lt-divider" />

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
        {formatReadout(date)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <div>
          <div className="lt-metric-label" style={{ marginBottom: 4 }}>Date</div>
          <input
            type="date"
            className="lt-input"
            value={toDateInputValue(date)}
            onChange={(e) => e.target.value && applyDatePart(e.target.value)}
          />
        </div>
        <div>
          <div className="lt-metric-label" style={{ marginBottom: 4 }}>Time (UTC)</div>
          <input
            type="time"
            step="1"
            className="lt-input"
            value={toTimeInputValue(date)}
            onChange={(e) => e.target.value && applyTimePart(e.target.value)}
          />
        </div>
      </div>

      <hr className="lt-divider" />

      <div className="lt-btn-row">
        <button className="lt-btn" onClick={() => step(-1)} aria-label="Step back one hour">−1H</button>
        <button className="lt-btn" onClick={() => clock.togglePlay()} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? '⏸' : '▶'}
        </button>
        <button className="lt-btn" onClick={() => step(1)} aria-label="Step forward one hour">+1H</button>
      </div>

      <div className="lt-metric-label" style={{ margin: '10px 0 4px' }}>Speed</div>
      <div className="lt-btn-row lt-btn-row--wrap">
        {SPEEDS.map(([s, label]) => (
          <button
            key={s}
            className={`lt-btn ${speed === s ? 'active' : ''}`}
            onClick={() => clock.setSpeed(s)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="lt-reg-note" style={{ marginTop: 8 }}>
        Sets the Sun direction on the Moon — the illumination change LunaTech's image pairs must survive.
      </div>

      <button
        className="lt-btn"
        style={{ width: '100%', marginTop: 10 }}
        onClick={() => clock.setNow()}
      >
        NOW
      </button>
    </div>
  )
}
