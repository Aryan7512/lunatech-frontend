import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLunatechExport } from '../../hooks/useLunatechExport.js'
import { useCountUp } from '../../hooks/useCountUp.js'

const GAP = 24
const STEP_MS = 3400
const FLASH_MS = 1300
const LINE_BUDGET = 300

// Brightness = accuracy: one cyan hue, light (0 px) -> dark (>= 1 px). Removed points wear red.
const HI = [150, 238, 250]
const LO = [22, 84, 102]
const RED = '#e2544a'
function errColor(e) {
  const t = Math.min(1, Math.max(0, e))
  const c = HI.map((h, i) => Math.round(h + (LO[i] - h) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

const fmtPx = (v) => (!Number.isFinite(v) ? '—' : v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3))
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0)

function caption(model, k) {
  const s = model.stages[k]
  const { thresh, maxPerCell } = model
  if (k === 0) {
    return `SIFT + Lowe ratio test proposes ${s.n} candidate matches. ${s.gross} (${pct(s.gross, s.n)}%) land more than ${thresh} px from ground truth.`
  }
  if (k === 4) {
    return `Sub-pixel refinement removes nothing — it nudges each point. RMSE ${fmtPx(model.refine.rmsePre)} → ${fmtPx(
      model.refine.rmsePost
    )} px.`
  }
  const r = s.removed
  const verb = { 1: 'RANSAC homography', 2: 'Crater-neighbourhood check', 3: 'Grid quota (≤ ' + maxPerCell + ' per cell)' }[k]
  if (!r.count) return `${verb} removes nothing on this pair.`
  const mid = r.count - r.gross - r.accurate
  const parts = [`${r.gross} gross outliers (> ${thresh} px)`, `${r.accurate} accurate (< 1 px)`]
  if (mid > 0) parts.push(`${mid} in between`)
  let text = `${verb} removes ${r.count}: ${parts.join(', ')}.`
  if (k === 3) {
    const before = Math.round(model.stages[2].occupied * 100)
    const after = Math.round(s.occupied * 100)
    text += ` Accurate points are dropped on purpose to spread matches — cells covered ${
      before === after ? `stay at ${after}%` : `${before}% → ${after}%`
    }.`
  }
  return text
}

function provenanceLabel(p) {
  const truth = 'ground truth from a known warp'
  if (p.source === 'real-ohrc') return `Real OHRC imagery · ${truth}`
  if (p.source === 'public-lunar-image') return `Real lunar imagery · ${p.source_file} · ${truth}`
  return `Synthetic test terrain · ${truth}`
}

function Big({ label, value, format, sub, gold }) {
  const v = useCountUp(value)
  return (
    <div className="lt-lab-big">
      <div className="lt-lab-big-k">{label}</div>
      <div className={`lt-lab-big-v ${gold ? 'is-gold' : ''}`}>{format(v)}</div>
      {sub && <div className="lt-lab-big-s">{sub}</div>}
    </div>
  )
}

export default function MatchLab({ onClose }) {
  const { status, data, model, imgA, imgB } = useLunatechExport()
  const reducedMotion = useMemo(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(!reducedMotion)
  const [flash, setFlash] = useState(true)
  const [hover, setHover] = useState(null)
  const closeRef = useRef(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // brief red flash for whatever the newly-entered stage removed
  useEffect(() => {
    setFlash(true)
    const t = setTimeout(() => setFlash(false), FLASH_MS)
    return () => clearTimeout(t)
  }, [stage])

  useEffect(() => {
    if (!playing) return undefined
    if (stage >= 4) {
      setPlaying(false)
      return undefined
    }
    const t = setTimeout(() => setStage((s) => s + 1), STEP_MS)
    return () => clearTimeout(t)
  }, [playing, stage])

  function replay() {
    setStage(0)
    setHover(null)
    setPlaying(true)
  }
  function pick(k) {
    setPlaying(false)
    setStage(k)
    setHover(null)
  }

  const view = useMemo(() => {
    if (!model) return null
    const alive = model.aliveAt(stage)
    return alive.map((a, i) => {
      const died = model.deathStage[i]
      const justRemoved = stage >= 1 && stage <= 3 && died === stage
      return { alive: a, justRemoved }
    })
  }, [model, stage])

  const S = model?.size ?? 512
  const W = 2 * S + GAP
  const lineStride = model ? Math.max(1, Math.ceil(model.n / LINE_BUDGET)) : 1
  const cur = model?.stages[stage]

  function hoverInfo() {
    if (hover == null || !model || !view) return 'Hover a point to inspect its match.'
    const a = data.cand_a[hover]
    const b = model.posB(stage, hover)
    const e = model.errAt(stage, hover)
    const state = view[hover].alive
      ? stage === 4 || model.deathStage[hover] === -1
        ? 'certified'
        : 'alive'
      : `removed at ${model.stages[model.deathStage[hover]].code}`
    return `#${hover} · A (${a[0].toFixed(1)}, ${a[1].toFixed(1)}) → B (${b[0].toFixed(1)}, ${b[1].toFixed(1)}) · error ${fmtPx(e)} px · ${state}`
  }


  return (
    <div className="lt-reg-overlay" role="dialog" aria-modal="true" aria-labelledby="lab-title" onClick={onClose}>
      <div className="lt-reg-modal lt-lab" onClick={(e) => e.stopPropagation()}>
        <div className="lt-reg-head">
          <div>
            <div className="lt-panel-title" id="lab-title">LUNATECH · MATCH LAB</div>
            <div className="lt-reg-sub">WATCH THE CRATER PIPELINE TURN CANDIDATES INTO CERTIFIED CONTROL POINTS</div>
          </div>
          <button ref={closeRef} className="lt-btn" onClick={onClose} aria-label="Close match lab">CLOSE ✕</button>
        </div>

        {status === 'loading' && <div className="lt-lab-empty">LOADING EXPORT…</div>}
        {status === 'missing' && (
          <div className="lt-lab-empty">
            The match data could not be loaded. Expected <b>lunatech_export.json</b> and the two images in <b>public/data/</b>.
          </div>
        )}

        {status === 'ready' && (
          <>
            <div className="lt-lab-tag">{provenanceLabel(data.provenance)}</div>

            <div className="lt-lab-rail" role="tablist" aria-label="Pipeline stage">
              {model.stages.map((s, k) => (
                <button
                  key={s.key}
                  role="tab"
                  aria-selected={k === stage}
                  className={`lt-lab-step ${k === stage ? 'is-active' : ''} ${k < stage ? 'is-done' : ''}`}
                  onClick={() => pick(k)}
                >
                  <span className="lt-lab-step-code">{s.code}</span>
                  <span className="lt-lab-step-name">{s.name}</span>
                  <span className="lt-lab-step-n">{s.n}</span>
                </button>
              ))}
              <button className="lt-btn lt-lab-play" onClick={playing ? () => setPlaying(false) : replay}>
                {playing ? '⏸ PAUSE' : '↻ REPLAY'}
              </button>
            </div>

            <div className="lt-lab-caption" aria-live="polite">
              <b>{cur.code} · {cur.name}</b> <span className="lt-lab-tech">({cur.tech})</span> — {caption(model, stage)}
            </div>

            <div className="lt-lab-reads">
              <Big label={['CANDIDATES', 'SURVIVING CANDIDATES', 'SURVIVING CANDIDATES', 'CERTIFIED POINTS', 'CERTIFIED POINTS'][stage]} value={cur.n} format={(v) => (Number.isFinite(v) ? Math.round(v) : '—')} />
              <Big label="RMSE (px)" value={cur.rmse} format={fmtPx} gold={cur.rmse < 1} sub={cur.rmse < 1 ? 'under the 1 px line' : 'still above 1 px'} />
              <Big label="SUB-PIXEL INLIERS" value={cur.subpixel * 100} format={(v) => (Number.isFinite(v) ? `${v.toFixed(1)}%` : '—')} sub="error < 1 px" />
              <Big label="GRID COVERAGE" value={cur.occupied * 100} format={(v) => (Number.isFinite(v) ? `${Math.round(v)}%` : '—')} sub={`${model.grid}×${model.grid} cells`} />
            </div>

            <div className="lt-lab-canvas">
              <div className="lt-lab-cap-row">
                <span>IMAGE A · reference</span>
                <span>IMAGE B · warped + illumination proxy</span>
              </div>
              <svg viewBox={`0 0 ${W} ${S}`} role="img" aria-label="Matched points between image A and image B" className="lt-lab-svg">
                <image href={imgA} x="0" y="0" width={S} height={S} />
                <image href={imgB} x={S + GAP} y="0" width={S} height={S} />
                <rect x={S} y="0" width={GAP} height={S} fill="#050505" />

                {data.cand_a.map((a, i) => {
                  if (i % lineStride !== 0 && hover !== i) return null
                  const v = view[i]
                  const show = v.alive || (v.justRemoved && flash)
                  const b = model.posB(stage, i)
                  const col = v.justRemoved && !v.alive ? RED : errColor(model.errAt(stage, i))
                  return (
                    <line
                      key={`l${i}`}
                      className="lt-lab-line"
                      x1={a[0]} y1={a[1]} x2={b[0] + S + GAP} y2={b[1]}
                      stroke={col}
                      style={{ opacity: hover === i ? 1 : show ? 0.42 : 0 }}
                      strokeWidth={hover === i ? 1.6 : 0.8}
                    />
                  )
                })}

                {data.cand_a.map((a, i) => {
                  const v = view[i]
                  const show = v.alive || (v.justRemoved && flash)
                  const b = model.posB(stage, i)
                  const e = model.errAt(stage, i)
                  const col = !v.alive ? RED : errColor(e)
                  const r = (hover === i ? 5 : e < 1 ? 3.2 : 2.4)
                  const common = {
                    fill: col,
                    className: 'lt-lab-pt',
                    style: { opacity: show ? 1 : 0, pointerEvents: v.alive ? 'all' : 'none' },
                    r,
                    onPointerEnter: () => setHover(i),
                    onPointerLeave: () => setHover((h) => (h === i ? null : h)),
                  }
                  return (
                    <g key={`p${i}`}>
                      <circle cx={a[0]} cy={a[1]} {...common} />
                      <circle cx={b[0] + S + GAP} cy={b[1]} {...common} />
                    </g>
                  )
                })}
              </svg>
              <div className="lt-lab-hover">{hoverInfo()}</div>
            </div>

            <div className="lt-lab-legend">
              <span><i style={{ background: errColor(0) }} /> error 0 px</span>
              <span className="lt-lab-ramp" aria-hidden="true" />
              <span><i style={{ background: errColor(1) }} /> ≥ 1 px</span>
              <span><i style={{ background: RED }} /> removed by this stage</span>
              <span className="lt-lab-legend-note">brightness = accuracy against exact ground truth</span>
            </div>

            <details className="lt-lab-more">
              <summary>All stages, measured</summary>
              <div style={{ overflowX: 'auto' }}>
              <table className="lt-lab-table">
                <thead>
                  <tr><th>STAGE</th><th>POINTS</th><th>RMSE (px)</th><th>SUB-PIXEL</th><th>COVERAGE</th></tr>
                </thead>
                <tbody>
                  {model.stages.map((s, k) => (
                    <tr key={s.key} className={k === stage ? 'is-active' : ''} onClick={() => pick(k)}>
                      <td>{s.code} {s.name}</td>
                      <td>{s.n}</td>
                      <td>{fmtPx(s.rmse)}</td>
                      <td>{Number.isFinite(s.subpixel) ? `${(s.subpixel * 100).toFixed(1)}%` : '—'}</td>
                      <td>{Math.round(s.occupied * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
                          </div>
            </details>
          </>
        )}
      </div>
    </div>
  )
}
