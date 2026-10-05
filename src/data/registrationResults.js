// ABLATION and STRESS are 10-pair / 18-condition aggregates copied from the outputs of
// finals-sih2026.ipynb (LunaTech prototype v3, real OHRC crops, synthetic-warp ground truth).
// The single-pair export cannot reproduce them, so they stay copied, not re-computed here.
// Caveats live in CAVEATS so the UI never shows results without them.

// Demo-pair numbers come from the live export (public/data/lunatech_export.json), never typed here.
export const RUNTIME_BUDGET_S = 5.0

export function demoPairFromExport(data) {
  const m = data?.metrics
  if (!m) return null
  return {
    points: m.n_matches,
    rmsePx: m.rmse_px,
    medianPx: m.median_err_px,
    p90Px: m.p90_err_px,
    subpixelRatio: m.inlier_ratio_subpixel,
    gridCoverage: m.grid_occupied_frac,
    entropy: m.grid_entropy_norm,
    runtimeS: Object.values(data.timings_s ?? {}).reduce((a, b) => a + b, 0),
    budgetS: RUNTIME_BUDGET_S,
  }
}

export const ABLATION = [
  { key: 'base', label: 'BASELINE', sub: 'SIFT + RANSAC', points: 1147, rmse: 0.316, inlier: 0.987, coverage: 0.856, runtime: 0.294 },
  { key: 'struct', label: '+ STRUCTURAL', sub: 'crater check', points: 945, rmse: 0.315, inlier: 0.987, coverage: 0.847, runtime: 1.502 },
  { key: 'spatial', label: '+ SPATIAL', sub: 'grid quota', points: 176, rmse: 0.237, inlier: 0.996, coverage: 0.847, runtime: 1.511 },
  { key: 'full', label: 'FULL', sub: '+ sub-pixel', points: 176, rmse: 0.224, inlier: 0.998, coverage: 0.847, runtime: 1.553 },
]

export const STRESS = {
  illum: [0.0, 0.2, 0.4, 0.6, 0.8, 1.0],
  scale: [1.0, 1.5, 2.0],
  rmse: [
    [0.179, 0.238, 0.2],
    [0.21, 0.226, 0.388],
    [0.199, 0.245, 0.285],
    [0.198, 0.253, 0.317],
    [0.208, 0.25, 0.322],
    [0.222, 0.311, 0.338],
  ],
}

export const CAVEATS = [
  'Test pairs are warps of ONE real crop with a known homography — not true repeat-pass or cross-camera pairs.',
  'Illumination is a brightness/gamma/noise proxy; shadow direction from Sun angle is NOT modelled.',
  'Stage 3 is classical SIFT; a learned matcher is not yet integrated.',
  'Spatial stage cuts points 945 → 176 and does not raise mean grid coverage (0.85) in this run.',
  'Crater-detector recall vs XML annotations: not yet reported (annotation parse returned no records).',
]
