import React from 'react'

const ITEMS = [
  { n: '01', label: 'MOON MODEL', key: 'model' },
  { n: '02', label: 'EPHEMERIS', key: 'ephemeris' },
  { n: '03', label: 'SUN POSITION', key: 'sun' },
  { n: '04', label: 'ROTATION', key: 'rotation' },
  { n: '05', label: 'LUNAR PHASE', key: 'phase' },
]

export default function SystemStatus({ modelLoaded }) {
  const statusFor = (key) => {
    if (key === 'model') return modelLoaded ? 'LOADED ✓' : 'LOADING…'
    if (key === 'ephemeris') return modelLoaded ? 'ACTIVE ✓' : 'STANDBY'
    if (key === 'sun') return modelLoaded ? 'CALC ✓' : 'STANDBY'
    if (key === 'rotation') return modelLoaded ? 'ACTIVE ✓' : 'STANDBY'
    if (key === 'phase') return modelLoaded ? 'SYNCED ✓' : 'STANDBY'
    return 'STANDBY'
  }

  return (
    <div className="lt-panel">
      <div className="lt-panel-title">SYSTEM STATUS</div>
      <hr className="lt-divider" />
      {ITEMS.map((item) => {
        const ok = modelLoaded
        return (
          <div key={item.key} className="lt-row" style={{ padding: '4px 0' }}>
            <span className="lt-row-label">
              {item.n} {item.label}
            </span>
            <span className={`lt-row-value ${ok ? 'lt-row-value--gold' : ''}`}>{statusFor(item.key)}</span>
          </div>
        )
      })}
    </div>
  )
}
