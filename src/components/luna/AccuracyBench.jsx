import React from 'react'

// NOTE: values here describe what this build actually does — see the
// accompanying write-up for the full list of approximations. Nothing here
// is invented for visual effect (e.g. this is NOT JPL DE-440; that's a
// different, much heavier ephemeris this project doesn't use).
const ROWS = [
  ['EPHEMERIS', 'astronomy-engine (VSOP87 / ELP2000-82)'],
  ['STANDARD', 'UTC (system clock)'],
  ['REF FRAME', 'EQJ (J2000) / ecliptic-of-date'],
  ['PRECISION', 'Arcminute-class (analytic series)'],
  ['ALBEDO', 'N/A — unlit surface texture'],
]

export default function AccuracyBench() {
  return (
    <div className="lt-panel">
      <div className="lt-panel-title">ACCURACY BENCH</div>
      <hr className="lt-divider" />
      {ROWS.map(([label, value]) => (
        <div key={label} className="lt-row" style={{ padding: '4px 0' }}>
          <span className="lt-row-label">{label}</span>
          <span className="lt-row-value" style={{ textAlign: 'right', maxWidth: 130 }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
