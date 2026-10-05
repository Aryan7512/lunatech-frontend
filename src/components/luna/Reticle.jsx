import React from 'react'

export default function Reticle({ visible }) {
  if (!visible) return null
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <g stroke="#8ecfe0" strokeWidth="0.08" fill="none" opacity="0.22">
        <circle cx="50" cy="50" r="30" />
        <circle cx="50" cy="50" r="38" strokeDasharray="0.6 1.4" />
        <circle cx="50" cy="50" r="20" strokeDasharray="0.3 1" opacity="0.6" />
        <line x1="50" y1="6" x2="50" y2="14" />
        <line x1="50" y1="86" x2="50" y2="94" />
        <line x1="6" y1="50" x2="14" y2="50" />
        <line x1="86" y1="50" x2="94" y2="50" />
      </g>
      <g stroke="#ff9a3c" strokeWidth="0.06" opacity="0.3">
        <line x1="50" y1="48" x2="50" y2="52" />
        <line x1="48" y1="50" x2="52" y2="50" />
      </g>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const r1 = 41
        const r2 = i % 6 === 0 ? 43.5 : 42.2
        const x1 = 50 + Math.cos(angle) * r1
        const y1 = 50 + Math.sin(angle) * r1
        const x2 = 50 + Math.cos(angle) * r2
        const y2 = 50 + Math.sin(angle) * r2
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#99907c"
            strokeWidth="0.1"
            opacity="0.25"
          />
        )
      })}
    </svg>
  )
}
