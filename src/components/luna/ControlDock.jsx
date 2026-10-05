import React, { useEffect, useRef, useState } from 'react'

export default function ControlDock({
  onOpenPipeline,
  onOpenLab,
  onOpenReport,
  telemetryOpen,
  onToggleTelemetry,
  onReset,
  autoRotate,
  onToggleAutoRotate,
  orbitVisible,
  onToggleOrbit,
  gridVisible,
  onToggleGrid,
  onZoomIn,
  onZoomOut,
}) {
  const [viewOpen, setViewOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!viewOpen) return undefined
    const close = (e) => ref.current && !ref.current.contains(e.target) && setViewOpen(false)
    const esc = (e) => e.key === 'Escape' && setViewOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [viewOpen])

  return (
    <div className="lt-dock" ref={ref}>
      <button className="lt-btn lt-btn--lg" onClick={onOpenPipeline}>How it works</button>
      <button className="lt-btn lt-btn--lg" onClick={onOpenLab}>Match lab</button>
      <button className="lt-btn lt-btn--lg" onClick={onOpenReport}>Report</button>
      <div className="lt-dock-divider" />
      <button className={`lt-btn lt-btn--lg ${telemetryOpen ? 'active' : ''}`} aria-pressed={telemetryOpen} onClick={onToggleTelemetry}>
        Telemetry
      </button>
      <button className={`lt-btn lt-btn--lg ${viewOpen ? 'active' : ''}`} aria-expanded={viewOpen} onClick={() => setViewOpen((v) => !v)}>
        View ▴
      </button>

      {viewOpen && (
        <div className="lt-viewmenu" role="menu">
          <button className={`lt-btn ${autoRotate ? 'active' : ''}`} onClick={onToggleAutoRotate}>Auto rotate</button>
          <button className={`lt-btn ${orbitVisible ? 'active' : ''}`} onClick={onToggleOrbit}>Orbiter</button>
          <button className={`lt-btn ${gridVisible ? 'active' : ''}`} onClick={onToggleGrid}>Reticle</button>
          <div className="lt-viewmenu-row">
            <button className="lt-btn" onClick={onZoomOut} aria-label="Zoom out">−</button>
            <button className="lt-btn" onClick={onReset}>Reset view</button>
            <button className="lt-btn" onClick={onZoomIn} aria-label="Zoom in">+</button>
          </div>
        </div>
      )}
    </div>
  )
}
