// Content for the "How it works" overlay. Descriptions and parameters mirror finals-sih2026.ipynb
// (Config + stage functions); result numbers are derived from registrationResults.js, never typed here.
import { ABLATION, STRESS, RUNTIME_BUDGET_S } from './registrationResults.js'

const [base, struct, spatial, full] = ABLATION
const f2 = (v) => v.toFixed(2)
const f3 = (v) => v.toFixed(3)

export const SCALE_LADDER = [
  { name: 'OHRC', m: 0.25, gsd: '0.25 m/px', note: 'sharpest, smallest footprint' },
  { name: 'TMC-2', m: 5, gsd: '5 m/px', note: 'mid resolution, wider swath' },
  { name: 'IIRS', m: 80, gsd: '80 m/px', note: 'coarse, adds mineral spectra' },
]

// status: 'built' | 'prototype' | 'roadmap'
export const STEPS = [
  {
    id: 'ingest', tag: 'DATA', name: 'INGEST', status: 'built',
    what: 'Loads real OHRC surface crops (PNG + XML crater annotations) and separates usable grayscale imagery from binary masks.',
    how: 'Trims an 8 px border, takes a 512×512 tile, and treats any image with fewer than 20 distinct gray levels as a segmentation mask that a matcher cannot use.',
    why: 'Nothing downstream is trusted until the data has been inspected — masks would silently poison every metric.',
    params: ['tile 512 px', 'border 8 px', 'mask if < 20 gray levels'],
    evidence: () => 'Kaggle OHRC crop set: 19 PNG files, all 19 classified as usable grayscale.',
  },
  {
    id: 'pair', tag: 'TRUTH', name: 'PAIR GENERATION', status: 'prototype',
    what: 'Builds test pairs whose true correspondence is known exactly.',
    how: 'Warps one real crop with a randomly sampled, recorded homography (rotation, scale, shift, slight perspective), then perturbs brightness, gamma, contrast and noise on each side independently.',
    why: 'Accuracy needs ground truth. With a known transform, every RMSE and inlier number is measured, not estimated.',
    params: ['rotation ≤ 6°', 'scale 1×–2×', 'shift ≤ 3%', 'photometric proxy 0–1'],
    caveat: 'Both images come from ONE crop and illumination is a tone proxy — real repeat-pass Sun-angle shadows are not modelled yet.',
    evidence: () => 'Ground truth is exact by construction; the limitation is realism, not accuracy of the truth.',
  },
  {
    id: 'C', tag: 'C', name: 'CANDIDATE GENERATION', status: 'prototype',
    what: 'Proposes possible matching points between the two images.',
    how: 'SIFT (4000 features) with a Lowe ratio test at 0.75. The function signature is fixed so a learned matcher (LoFTR / LightGlue) is a drop-in replacement.',
    why: 'Every later stage needs a pool of candidates to verify. Recall matters here; precision is fixed downstream.',
    params: ['SIFT 4000 features', 'Lowe ratio 0.75'],
    caveat: 'Classical SIFT relies on the shading that Sun angle changes. The learned matcher planned in the design is not integrated yet.',
    evidence: () => `Baseline (SIFT + RANSAC only): ${f3(base.rmse)} px RMSE, ${base.points} points per pair.`,
  },
  {
    id: 'A', tag: 'A', name: 'ADAPTIVE GEOMETRY', status: 'prototype',
    what: 'Rejects candidates that cannot belong to one consistent geometric relationship.',
    how: 'RANSAC fits a homography and keeps candidates within 3 px of it. It runs before the structural check so that check sees a clean inlier set.',
    why: 'Wrong matches that look alike but disagree geometrically are the bulk of the noise.',
    params: ['RANSAC threshold 3 px'],
    caveat: 'One global homography. Terrain is not flat, so the design calls for local patch models blended smoothly — planned, not built.',
    evidence: () => 'In the Match Lab, watch S5 remove the gross outliers first.',
  },
  {
    id: 'R1', tag: 'R', name: 'STRUCTURAL VERIFICATION', status: 'prototype',
    what: 'Checks that each match preserves the layout of nearby craters, not just its look.',
    how: 'A Laplacian-of-Gaussian detector finds crater-like blobs in both images. For every match the distances to its 4 nearest blobs are compared between images (tolerance 35%).',
    why: 'A crater’s appearance changes with the Sun; its position relative to neighbouring craters does not. This is the illumination-robust idea.',
    params: ['LoG σ 3–12', 'k = 4 neighbours', 'tolerance 0.35'],
    caveat: 'The signature uses raw distances, so it is not yet scale/rotation-invariant, and its detector recall against the XML annotations is still to be reported.',
    evidence: () => `10-pair mean: ${base.points} → ${struct.points} points; RMSE ${f3(base.rmse)} → ${f3(struct.rmse)} px — a small effect so far.`,
  },
  {
    id: 'T', tag: 'T', name: 'TARGETED SPATIAL OPTIMISATION', status: 'built',
    what: 'Forces certified points to spread across the frame instead of clustering on textured patches.',
    how: 'Divides image A into a 6×6 grid and keeps at most 6 matches per cell, highest confidence first.',
    why: 'The problem statement scores uniform distribution. A cluster of 80 points on one rim proves nothing about the rest of the image.',
    params: ['6×6 grid', '≤ 6 per cell'],
    caveat: 'It trades count for spread, and in the 10-pair mean it did not raise cell coverage. It does raise accuracy by keeping the strongest matches.',
    evidence: () => `${struct.points} → ${spatial.points} points; RMSE ${f3(struct.rmse)} → ${f3(spatial.rmse)} px; coverage ${Math.round(struct.coverage * 100)}% → ${Math.round(spatial.coverage * 100)}%.`,
  },
  {
    id: 'E', tag: 'E', name: 'ENHANCED SUB-PIXEL REFINEMENT', status: 'built',
    what: 'Lifts integer-pixel matches to sub-pixel precision.',
    how: 'Warps B into A’s frame with the RANSAC model, runs local phase correlation in a 15 px window, and applies a shift only if it is under 2.5 px and raises the normalised cross-correlation.',
    why: 'This is the step that earns the sub-pixel claim. Naive phase correlation made accuracy worse under rotation, so refinement must prove it helps before it is applied.',
    params: ['window 15 px', 'max shift 2.5 px', 'NCC-gated'],
    evidence: (demo) => `RMSE ${f3(spatial.rmse)} → ${f3(full.rmse)} px (10-pair mean)${demo ? `; demo pair ${f3(demo.rmsePx)} px` : ''}.`,
  },
  {
    id: 'R2', tag: 'R', name: 'REGISTERED OUTPUT & REPORT', status: 'prototype',
    what: 'Turns the certified points into measurements a reviewer can audit.',
    how: 'Reports RMSE, sub-pixel inlier ratio, grid coverage and entropy per pair, the stage-by-stage funnel, a per-stage ablation and an illumination × scale stress matrix.',
    why: 'One accuracy number is not a benchmark. The stress matrix maps where accuracy holds and where it degrades.',
    params: ['ablation over 10 pairs', 'stress 6 × 3 grid'],
    caveat: 'Confidence tiers and export to planetary-mapping formats (PDS4 / ISIS control networks) are planned, not built. This site reads a JSON export.',
    evidence: () => `Stress matrix RMSE stays within ${f2(Math.min(...STRESS.rmse.flat()))}–${f2(Math.max(...STRESS.rmse.flat()))} px across all 18 conditions.`,
  },
]

// status: 'measured' | 'partial' | 'pending' | 'roadmap'
export const DELIVERABLES = [
  {
    goal: 'Sub-pixel RMSE', ps: true, big: `${f3(full.rmse)}`, sub: `px RMSE · mean of 10 pairs · baseline ${f3(base.rmse)}`, status: 'measured',
    how: 'Geometric verification (A) rejects wrong matches; gated phase correlation (E) refines the rest.',
    result: `${f3(full.rmse)} px mean (baseline ${f3(base.rmse)})`,
    note: 'Against exact ground truth on synthetic warps.',
  },
  {
    goal: 'Inlier count / ratio', ps: true, big: `${(full.inlier * 100).toFixed(1)}%`, sub: `of points within 1 px · ${full.points} certified per pair`, status: 'measured',
    how: 'RANSAC and the crater-neighbourhood check remove outliers; spatial selection keeps the strongest.',
    result: `${(full.inlier * 100).toFixed(1)}% within 1 px; ${full.points} certified points per pair`,
    note: `Count is deliberately reduced from ${base.points} to favour spread and accuracy.`,
  },
  {
    goal: 'Uniform spatial distribution', ps: true, big: `${Math.round(full.coverage * 100)}%`, sub: `of 6×6 grid cells occupied · baseline ${Math.round(base.coverage * 100)}%`, status: 'partial',
    how: 'Grid quota (T): at most 6 points per cell of a 6×6 grid.',
    result: `${Math.round(full.coverage * 100)}% of cells occupied on average (baseline ${Math.round(base.coverage * 100)}%)`,
    note: 'No mean gain over baseline yet — needs work.',
  },
  {
    goal: 'Illumination and scale robustness', ps: true, big: `${f2(Math.min(...STRESS.rmse.flat()))}–${f2(Math.max(...STRESS.rmse.flat()))}`, sub: `px RMSE across 18 stress conditions`, status: 'partial',
    how: 'Stress matrix over illumination proxy 0–1 and scale 1×–2×, several pairs per cell.',
    result: `${f2(Math.min(...STRESS.rmse.flat()))}–${f2(Math.max(...STRESS.rmse.flat()))} px RMSE across all 18 conditions`,
    note: 'Photometric proxy only; shadow-direction change is not tested.',
  },
  {
    goal: 'Runtime within budget', ps: false, big: `${f2(full.runtime)}`, sub: `s per pair · budget ${RUNTIME_BUDGET_S} s`, status: 'measured',
    how: 'Classical, CPU-only stages.',
    result: `${f2(full.runtime)} s per pair (budget ${RUNTIME_BUDGET_S} s)`,
    note: 'Notebook run; production hardware not benchmarked.',
  },
  {
    goal: 'Verified structural detector', ps: false, status: 'pending',
    how: 'Compare the crater detector against the dataset’s XML annotations.',
    result: 'Recall not yet reported',
    note: 'The annotation parser returned no records on the first file — fix, then report.',
  },
  {
    goal: 'Real repeat-pass Sun-angle pairs', ps: true, status: 'roadmap',
    how: 'Validate on genuine repeat passes (PRADAN) with a learned matcher and local geometry.',
    result: '—',
    note: 'The core condition in the problem statement; not yet exercised.',
  },
  {
    goal: 'Cross-instrument (OHRC · TMC-2 · IIRS)', ps: true, status: 'roadmap',
    how: 'Scale pyramid and modality-robust matching across the ≈320× resolution gap.',
    result: '—',
    note: 'Prototype covers OHRC-like imagery only.',
  },
  {
    goal: 'Confidence tiers + mapping-software export', ps: false, status: 'roadmap',
    how: 'Tag each point by evidence strength; export PDS4 / ISIS-compatible control points.',
    result: '—',
    note: 'Not built. Today the site reads a JSON export.',
  },
]

// Card layout for the overlay: the four problem-statement criteria we can measure, the extra measured item,
// and everything not yet built (kept visible on purpose).
export const CRITERIA = DELIVERABLES.filter((d) => d.ps && d.status !== 'roadmap')
export const ALSO_MEASURED = DELIVERABLES.filter((d) => !d.ps && d.status === 'measured')
export const NEXT_UP = DELIVERABLES.filter((d) => d.status === 'roadmap' || d.status === 'pending')
