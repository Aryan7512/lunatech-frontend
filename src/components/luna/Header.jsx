import React from 'react'
import { SCALE_LADDER } from '../../data/pipelineSpec.js'

const pad = (n) => String(n).padStart(2, '0')
const utc = (d) => `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

// Bar width on a log scale of pixel size (coarser = longer), anchored at 0.1 m/px.
const LOG_MAX = Math.log10(Math.max(...SCALE_LADDER.map((s) => s.m)) / 0.1)
const barPct = (m) => Math.round((100 * Math.log10(m / 0.1)) / LOG_MAX)
const GAP = Math.round(Math.max(...SCALE_LADDER.map((s) => s.m)) / Math.min(...SCALE_LADDER.map((s) => s.m)))

export default function Header({ date, onToggleMobilePanels, mobilePanelsOpen }) {
  return (
    <>
      <header className="lt-header lt-mc-header">
        <div className="lt-brand">
          <img className="lt-mc-logo" src="public/lunatech_logo.png" alt="LunaTech" />
          <span className="lt-brand-name">LUNATECH</span>
          <span className="lt-brand-sys">SYS // 01</span>
          <div className="lt-brand-meta">
            CHANDRAYAAN-2 · SIH26166
          </div>
        </div>
        <div className="lt-header-right">
          <span className="lt-mc-clock" title="Simulated UTC (drives the Sun direction on the Moon)">
            <span className="lt-mc-clock-k">SIM UTC</span> {utc(date)}
          </span>
          <span className="lt-live">
            <span className="lt-dot" />
            LIVE
          </span>
          <button
            className="lt-iconbtn lt-mc-panels"
            aria-label="Toggle instrumentation panels"
            onClick={onToggleMobilePanels}
            aria-pressed={mobilePanelsOpen}
          >
            <SettingsIcon />
          </button>
        </div>
      </header>

      <div className="lt-mc-ribbon" aria-label="Chandrayaan-2 camera pixel sizes, log scale">
        <span className="lt-mc-ribbon-k">PIXEL SIZE · LOG</span>
        {SCALE_LADDER.map((s) => (
          <span key={s.name} className="lt-mc-cam">
            <b>{s.name}</b>
            <span className="lt-mc-cam-bar"><i style={{ width: `${barPct(s.m)}%` }} /></span>
            <span className="lt-mc-cam-v">{s.gsd}</span>
          </span>
        ))}
        <span className="lt-mc-ribbon-gap">≈{GAP}× GAP</span>
      </div>
    </>
  )
}

function SettingsIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
