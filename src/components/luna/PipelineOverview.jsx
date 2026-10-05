import React, { useEffect, useMemo, useRef, useState } from 'react'
import '../../pipeline.css'
import { SCALE_LADDER, STEPS, CRITERIA, ALSO_MEASURED, NEXT_UP } from '../../data/pipelineSpec.js'
import { useLunatechExport } from '../../hooks/useLunatechExport.js'
import { useCountUp } from '../../hooks/useCountUp.js'

const STATUS_LABEL = { built: 'Implemented', prototype: 'Prototype', roadmap: 'Roadmap', measured: 'Measured', partial: 'Partial', pending: 'Pending' }

// The CRATER acronym, each letter wired to the stage that earns it.
const LETTERS = [
  { ch: 'C', id: 'C', word: 'Candidates' },
  { ch: 'R', id: 'R1', word: 'Robust structure' },
  { ch: 'A', id: 'A', word: 'Adaptive geometry' },
  { ch: 'T', id: 'T', word: 'Targeted spread' },
  { ch: 'E', id: 'E', word: 'Enhanced sub-pixel' },
  { ch: 'R', id: 'R2', word: 'Registered output' },
]

// Which pipeline stage's survivor count each step shows (index into the Lab model's stages).
const COUNT_STAGE = { ingest: null, pair: null, C: 0, A: 1, R1: 2, T: 3, E: 4, R2: 4 }
const LOG_MAX = Math.log10(Math.max(...SCALE_LADDER.map((s) => s.m)) / 0.1)
const barPct = (m) => Math.round((100 * Math.log10(m / 0.1)) / LOG_MAX)
const GAP = Math.round(Math.max(...SCALE_LADDER.map((s) => s.m)) / Math.min(...SCALE_LADDER.map((s) => s.m)))

function Ribbon({ counts, sel }) {
  const n = STEPS.length
  const W = 800
  const H = 110
  const mid = H / 2
  const max = Math.max(...counts.filter(Boolean), 1)
  const half = counts.map((c) => 7 + 40 * ((c ?? max) / max))
  const xs = counts.map((_, i) => ((i + 0.5) / n) * W)
  const edge = (sign) => {
    let d = `M 0 ${mid + sign * half[0]} L ${xs[0]} ${mid + sign * half[0]}`
    for (let i = 0; i < n - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2
      d += ` C ${cx} ${mid + sign * half[i]}, ${cx} ${mid + sign * half[i + 1]}, ${xs[i + 1]} ${mid + sign * half[i + 1]}`
    }
    return d + ` L ${W} ${mid + sign * half[n - 1]}`
  }
  // closed shape: top edge left->right, then bottom edge right->left
  const rev = []
  rev.push(`L ${W} ${mid + half[n - 1]}`)
  for (let i = n - 1; i > 0; i--) {
    const cx = (xs[i] + xs[i - 1]) / 2
    rev.push(`L ${xs[i]} ${mid + half[i]} C ${cx} ${mid + half[i]}, ${cx} ${mid + half[i - 1]}, ${xs[i - 1]} ${mid + half[i - 1]}`)
  }
  rev.push(`L 0 ${mid + half[0]} Z`)
  const shape = `${edge(-1)} ${rev.join(' ')}`
  const litW = ((sel + 0.5) / n) * W
  return (
    <svg className="lt-pl-ribbon" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="pl-fill" x1="0" x2="1">
          <stop offset="0" stopColor="#4fd8eb" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ff9a3c" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="pl-lit" x1="0" x2="1">
          <stop offset="0" stopColor="#4fd8eb" stopOpacity="0.55" />
          <stop offset="1" stopColor="#4fd8eb" stopOpacity="0.3" />
        </linearGradient>
        <clipPath id="pl-clip"><rect x="0" y="0" width={litW} height={H} className="lt-pl-clip" /></clipPath>
      </defs>
      <path d={shape} fill="url(#pl-fill)" stroke="rgba(79,216,235,0.35)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={shape} fill="url(#pl-lit)" clipPath="url(#pl-clip)" />
    </svg>
  )
}

function BigNumber({ text }) {
  // animate the leading number of strings like "0.224", "99.8%" or "0.18–0.39"
  const m = /^(\d+(?:\.\d+)?)(.*)$/.exec(text)
  const target = m ? parseFloat(m[1]) : NaN
  const dec = m && m[1].includes('.') ? m[1].split('.')[1].length : 0
  const v = useCountUp(target, 1300)
  if (!m) return <>{text}</>
  return <>{Number.isFinite(v) ? v.toFixed(dec) : m[1]}{m[2]}</>
}

export default function PipelineOverview({ onClose, onOpenLab, onOpenReport }) {
  const [sel, setSel] = useState(2)
  const [chapter, setChapter] = useState(0)
  const scrollRef = useRef(null)
  const closeRef = useRef(null)
  const refs = [useRef(null), useRef(null), useRef(null)]
  const { model } = useLunatechExport()
  const step = STEPS[sel]

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setSel((s) => Math.min(STEPS.length - 1, s + 1))
      if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = scrollRef.current
    const onScroll = () => {
      const top = el.getBoundingClientRect().top + 140
      let cur = 0
      refs.forEach((r, i) => r.current && r.current.getBoundingClientRect().top <= top && (cur = i))
      setChapter(cur)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(
    () => STEPS.map((s) => (model && COUNT_STAGE[s.id] != null ? model.stages[COUNT_STAGE[s.id]].n : null)),
    [model]
  )
  const activeLetter = LETTERS.findIndex((l) => l.id === step.id)

  function go(i) {
    refs[i].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="lt-pl" role="dialog" aria-modal="true" aria-labelledby="pl-title">
      <div className="lt-pl-scroll" ref={scrollRef}>
        <header className="lt-pl-top">
          <span className="lt-pl-brand" id="pl-title">LUNATECH <em>/ The pipeline</em></span>
          <nav className="lt-pl-nav" aria-label="Sections">
            {['Problem', 'Pipeline', 'Deliverables'].map((t, i) => (
              <button key={t} className={chapter === i ? 'is-on' : ''} onClick={() => go(i)}>
                <span>0{i + 1}</span> {t}
              </button>
            ))}
          </nav>
          <button ref={closeRef} className="lt-pl-close" onClick={onClose} aria-label="Close pipeline overview">Close <kbd>Esc</kbd></button>
        </header>

        {/* ---------------- 01 PROBLEM ---------------- */}
        <section className="lt-pl-sec lt-pl-hero" ref={refs[0]}>
          <p className="lt-pl-eyebrow">Chandrayaan-2 · SIH26166 · ISRO</p>
          <h1 className="lt-pl-h1">
            Two photographs of the same Moon.
            <span> One exact alignment.</span>
          </h1>
          <p className="lt-pl-lede">
            Different cameras, different days, different sunlight — and no shared reference points. LunaTech finds matching
            points between the two images and only keeps the ones it can prove.
          </p>

          <div className="lt-pl-challenges">
            <div className="lt-pl-ch">
              <span className="lt-pl-ch-k">Sunlight</span>
              <b>Shadows flip</b>
              <p>The same crater looks like two different shapes when the Sun moves.</p>
            </div>
            <div className="lt-pl-ch">
              <span className="lt-pl-ch-k">Scale</span>
              <b>≈{GAP}× gap</b>
              <p>Pixel size, OHRC to IIRS.</p>
              <div className="lt-pl-ladder">
                {SCALE_LADDER.map((s) => (
                  <div key={s.name} className="lt-pl-ladder-row">
                    <span>{s.name}</span>
                    <i><u style={{ width: `${barPct(s.m)}%` }} /></i>
                    <em>{s.gsd}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="lt-pl-ch">
              <span className="lt-pl-ch-k">Terrain</span>
              <b>Not flat</b>
              <p>Rims and floors shift differently when the viewing angle changes.</p>
            </div>
          </div>
        </section>

        {/* ---------------- 02 PIPELINE ---------------- */}
        <section className="lt-pl-sec" ref={refs[1]}>
          <h2 className="lt-pl-h2"><span>02</span> How a match is made</h2>
          <p className="lt-pl-sub">
            Candidates are proposed, then cut down by three independent checks. Pick a stage.
            {model ? ` Ribbon width is the number of points still alive on the Match Lab pair (${model.stages[0].n} → ${model.stages[4].n}).` : ''}
          </p>

          <div className="lt-pl-word" role="tablist" aria-label="CRATER stages">
            {LETTERS.map((l, i) => (
              <button
                key={l.id}
                role="tab"
                aria-selected={i === activeLetter}
                className={i === activeLetter ? 'is-on' : ''}
                onClick={() => setSel(STEPS.findIndex((s) => s.id === l.id))}
              >
                <b>{l.ch}</b>
                <span>{l.word}</span>
              </button>
            ))}
          </div>

          <div className="lt-pl-flow-wrap">
            <div className="lt-pl-flow">
              <Ribbon counts={counts.map((c, i) => c ?? (model ? model.stages[0].n : null))} sel={sel} />
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={i === sel}
                  className={`lt-pl-node ${i === sel ? 'is-on' : ''} ${i < sel ? 'is-done' : ''}`}
                  onClick={() => setSel(i)}
                >
                  <span className="lt-pl-slot"><i /></span>
                  <span className="lt-pl-node-name">{s.name}</span>
                  <span className="lt-pl-node-n">{counts[i] != null ? counts[i] : s.tag === 'DATA' || s.tag === 'TRUTH' ? 'input' : '—'}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="lt-pl-note">
            Runs C → A → R → T → E → R. Geometry runs before the structural check so that check sees a clean set of inliers.
          </p>

          <article className="lt-pl-card" key={step.id}>
            <div className="lt-pl-card-l">
              <div className="lt-pl-tag" aria-hidden="true">{step.tag}</div>
              <span className={`lt-pl-pill is-${step.status}`}>{STATUS_LABEL[step.status]}</span>
            </div>
            <div className="lt-pl-card-r">
              <h3>{step.name}</h3>
              <p className="lt-pl-what">{step.what}</p>
              <div className="lt-pl-two">
                <div><h4>How</h4><p>{step.how}</p></div>
                <div><h4>Why it matters</h4><p>{step.why}</p></div>
              </div>
              <div className="lt-pl-params">{step.params.map((p) => <span key={p}>{p}</span>)}</div>
              <p className="lt-pl-evidence"><b>Measured</b>{step.evidence()}</p>
              {step.caveat && <p className="lt-pl-limit"><b>Honest limit</b>{step.caveat}</p>}
            </div>
          </article>
        </section>

        {/* ---------------- 03 DELIVERABLES ---------------- */}
        <section className="lt-pl-sec" ref={refs[2]}>
          <h2 className="lt-pl-h2"><span>03</span> What it delivers</h2>
          <p className="lt-pl-sub">The four criteria the problem statement scores, as measured on the prototype.</p>

          <div className="lt-pl-scores">
            {CRITERIA.map((d) => (
              <article key={d.goal} className={`lt-pl-score is-${d.status}`}>
                <div className="lt-pl-score-top">
                  <span>★ {d.goal}</span>
                  <span className={`lt-pl-pill is-${d.status}`}>{STATUS_LABEL[d.status]}</span>
                </div>
                <div className={`lt-pl-big ${d.big.length > 6 ? 'lt-pl-big--long' : ''}`}><BigNumber text={d.big} /></div>
                <div className="lt-pl-big-sub">{d.sub}</div>
                <p className="lt-pl-how">{d.how}</p>
                <p className="lt-pl-limit lt-pl-limit--sm">{d.note}</p>
              </article>
            ))}
          </div>

          {ALSO_MEASURED.map((d) => (
            <div key={d.goal} className="lt-pl-also">
              <b>{d.goal}</b>
              <span><BigNumber text={d.big} /> {d.sub}</span>
            </div>
          ))}

          <h3 className="lt-pl-next-h">Not built yet</h3>
          <ul className="lt-pl-next">
            {NEXT_UP.map((d) => (
              <li key={d.goal}>
                <div><b>{d.ps ? '★ ' : ''}{d.goal}</b><span className={`lt-pl-pill is-${d.status}`}>{STATUS_LABEL[d.status]}</span></div>
                <p>{d.how}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="lt-pl-foot">
          <p>Numbers are the mean of 10 real-crop pairs with synthetic-warp ground truth (prototype v3).</p>
          <div>
            <button className="lt-pl-cta" onClick={onOpenLab}>Watch it run <span>→</span></button>
            <button className="lt-pl-cta lt-pl-cta--ghost" onClick={onOpenReport}>Full report</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
