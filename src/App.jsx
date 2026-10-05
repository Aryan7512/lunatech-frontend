import React, { useRef, useState } from 'react'
import MoonScene from './components/MoonScene.jsx'
import Header from './components/luna/Header.jsx'
import TelemetryPanel from './components/luna/TelemetryPanel.jsx'
import LunarTelemetryPanel from './components/luna/LunarTelemetryPanel.jsx'
import SimulationClock from './components/luna/SimulationClock.jsx'
import AccuracyBench from './components/luna/AccuracyBench.jsx'
import CoordinateGauge from './components/luna/CoordinateGauge.jsx'
import ControlDock from './components/luna/ControlDock.jsx'
import BottomStatusBar from './components/luna/BottomStatusBar.jsx'
import { RegistrationReport } from './components/luna/RegistrationPanel.jsx'
import MatchLab from './components/luna/MatchLab.jsx'
import PipelineOverview from './components/luna/PipelineOverview.jsx'
import HeroMetrics from './components/luna/HeroMetrics.jsx'
import Reticle from './components/luna/Reticle.jsx'
import { AstronomyClock } from './astronomy/AstronomyClock.js'
import { useAstronomyTelemetry } from './hooks/useAstronomyTelemetry.js'
import './luna-theme.css'

export default function App() {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const [fps, setFps] = useState(0)
  const [autoRotate, setAutoRotate] = useState(false)
  const [orbitVisible, setOrbitVisible] = useState(true)
  const [gridVisible, setGridVisible] = useState(true)
  const [mobilePanelsOpen, setMobilePanelsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const [pipeOpen, setPipeOpen] = useState(false)

  // One AstronomyClock instance for the whole app's lifetime — it owns the
  // simulated date/time and is read directly by the render loop every
  // frame, and subscribed to (throttled) by the UI panels below.
  const clockRef = useRef(null)
  if (!clockRef.current) clockRef.current = new AstronomyClock()
  const astroClock = clockRef.current

  const sceneRef = useRef(null)
  const modelLoaded = status === 'ready'

  // Telemetry for the panels that live directly in App (rails use their own
  // subscriptions internally via useAstronomyTelemetry).
  const { telemetry, date } = useAstronomyTelemetry(astroClock)

  function handleToggleAutoRotate() {
    const next = !autoRotate
    setAutoRotate(next)
    sceneRef.current?.setAutoRotate(next)
  }

  function handleToggleOrbit() {
    const next = !orbitVisible
    setOrbitVisible(next)
    sceneRef.current?.setOrbitVisible(next)
  }

  const panels = (
    <>
      <TelemetryPanel telemetry={telemetry} />
      <AccuracyBench />
    </>
  )

  const rightPanels = (
    <>
      <LunarTelemetryPanel telemetry={telemetry} date={date} />
      <SimulationClock clock={astroClock} />
      <CoordinateGauge telemetry={telemetry} />
    </>
  )

  return (
    <div className="app">
      <MoonScene
        ref={sceneRef}
        astroClock={astroClock}
        onFps={setFps}
        onLoaded={() => setStatus('ready')}
        onError={(msg) => {
          setErrorMsg(msg)
          setStatus('error')
        }}
      />

      {status !== 'error' && (
        <div className={`lt-loader ${status === 'ready' ? 'hidden' : ''}`}>
          <div className="lt-loader-ring" />
          <div className="lt-loader-text">ENTERING ORBIT</div>
        </div>
      )}

      {status === 'error' && (
        <div className="lt-error">Could not load the Moon model. {errorMsg}</div>
      )}

      {status === 'ready' && (
        <div className={`lt-root ${mobilePanelsOpen ? 'panels-open' : ''}`}>
          <Reticle visible={gridVisible} />

          <Header
            date={date}
            onToggleMobilePanels={() => setMobilePanelsOpen((v) => !v)}
            mobilePanelsOpen={mobilePanelsOpen}
          />

          <HeroMetrics onOpenLab={() => setLabOpen(true)} />

          <div className="lt-rail-left">{panels}</div>
          <div className="lt-rail-right">{rightPanels}</div>

          {mobilePanelsOpen && (
            <div className="lt-mobile-sheet">
              {panels}
              {rightPanels}
            </div>
          )}

          <ControlDock
            onOpenPipeline={() => setPipeOpen(true)}
            onOpenLab={() => setLabOpen(true)}
            onOpenReport={() => setReportOpen(true)}
            telemetryOpen={mobilePanelsOpen}
            onToggleTelemetry={() => setMobilePanelsOpen((v) => !v)}
            onReset={() => sceneRef.current?.resetView()}
            autoRotate={autoRotate}
            onToggleAutoRotate={handleToggleAutoRotate}
            orbitVisible={orbitVisible}
            onToggleOrbit={handleToggleOrbit}
            gridVisible={gridVisible}
            onToggleGrid={() => setGridVisible((v) => !v)}
            onZoomIn={() => sceneRef.current?.zoomBy(0.85)}
            onZoomOut={() => sceneRef.current?.zoomBy(1.18)}
          />

          {pipeOpen && (
            <PipelineOverview
              onClose={() => setPipeOpen(false)}
              onOpenLab={() => { setPipeOpen(false); setLabOpen(true) }}
              onOpenReport={() => { setPipeOpen(false); setReportOpen(true) }}
            />
          )}
          {labOpen && <MatchLab onClose={() => setLabOpen(false)} />}
          {reportOpen && <RegistrationReport onClose={() => setReportOpen(false)} />}

          <BottomStatusBar modelLoaded={modelLoaded} fps={fps} />
        </div>
      )}
    </div>
  )
}
