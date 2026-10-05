import React from 'react'

export default function BottomStatusBar({ modelLoaded, fps }) {
  return (
    <div className="lt-bottom-statusbar">
      <div className="lt-bottom-statusbar-item">
        <span className="lt-dot" />
        MOON MODEL · {modelLoaded ? 'LOADED' : 'LOADING'}
      </div>
      <div className="lt-bottom-statusbar-item">
        <span className={`lt-dot ${modelLoaded ? '' : 'lt-dot--muted'}`} />
        EPHEMERIS · {modelLoaded ? 'ACTIVE' : 'STANDBY'}
      </div>
      <div className="lt-bottom-statusbar-item">{fps || '--'} FPS</div>
    </div>
  )
}
