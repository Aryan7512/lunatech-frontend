// Pure functions: turn the notebook's §10 export into per-stage point sets and
// statistics. Nothing here is typed in — every number is derived from the export,
// so what the Lab shows is what the pipeline produced.

export const STAGES = [
  { key: 'S3', code: 'S3', name: 'CANDIDATES', tech: 'SIFT + ratio test' },
  { key: 'S5', code: 'S5', name: 'GEOMETRIC', tech: 'RANSAC homography' },
  { key: 'S4', code: 'S4', name: 'STRUCTURAL', tech: 'crater-neighbourhood check' },
  { key: 'S6', code: 'S6', name: 'SPATIAL', tech: 'grid-quota selection' },
  { key: 'S7', code: 'S7', name: 'REFINE', tech: 'sub-pixel phase correlation' },
]

const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN)

function median(a) {
  if (!a.length) return NaN
  const s = [...a].sort((x, y) => x - y)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Coverage of the grid_size x grid_size grid over image A: occupied fraction + normalised entropy. */
export function coverage(points, size, grid) {
  const cells = grid * grid
  const counts = new Array(cells).fill(0)
  for (const [x, y] of points) {
    const c = Math.min(grid - 1, Math.max(0, Math.floor(x / (size / grid))))
    const r = Math.min(grid - 1, Math.max(0, Math.floor(y / (size / grid))))
    counts[r * grid + c] += 1
  }
  const total = counts.reduce((s, v) => s + v, 0)
  const occupied = counts.filter((v) => v > 0).length / cells
  let h = 0
  if (total) for (const v of counts) if (v > 0) h -= (v / total) * Math.log(v / total)
  return { occupied, entropy: total ? h / Math.log(cells) : 0, counts }
}

function stats(ptsA, errs, size, grid, thresh) {
  const cov = coverage(ptsA, size, grid)
  return {
    n: errs.length,
    rmse: Math.sqrt(mean(errs.map((e) => e * e))),
    median: median(errs),
    subpixel: errs.length ? errs.filter((e) => e < 1).length / errs.length : NaN,
    gross: errs.filter((e) => e > thresh).length,
    occupied: cov.occupied,
    entropy: cov.entropy,
  }
}

/**
 * @returns {{
 *   n:number, size:number, stages:Array, deathStage:Int8Array, finalPos:Int32Array,
 *   aliveAt:(k:number)=>boolean[], errAt:(k:number,i:number)=>number, posB:(k:number,i:number)=>number[],
 * }}
 */
export function buildStages(data) {
  const n = data.cand_a.length
  const size = data.image_size
  const grid = data.grid_size
  const thresh = data.ransac_thresh_px
  const sets = [null, new Set(data.idx.S5), new Set(data.idx.S4), new Set(data.idx.S6)]

  // deathStage[i]: index of the first stage that removed candidate i (1=S5, 2=S4, 3=S6), or -1 if it survives.
  const deathStage = new Int8Array(n).fill(-1)
  for (let i = 0; i < n; i++) {
    for (let k = 1; k <= 3; k++) {
      if (!sets[k].has(i)) {
        deathStage[i] = k
        break
      }
    }
  }
  // finalPos[i]: position of candidate i in the S6/S7 arrays (final_b, final_err), or -1.
  const finalPos = new Int32Array(n).fill(-1)
  data.idx.S6.forEach((ci, j) => {
    finalPos[ci] = j
  })

  // "alive at stage k": survived every removal up to and including k (S7 = S6 survivors).
  const aliveAt = (k) => {
    const lastRemoval = Math.min(k, 3)
    const out = new Array(n)
    for (let i = 0; i < n; i++) out[i] = deathStage[i] === -1 || deathStage[i] > lastRemoval
    return out
  }
  const errAt = (k, i) => (k === 4 && finalPos[i] >= 0 ? data.final_err[finalPos[i]] : data.cand_err[i])
  const posB = (k, i) => (k === 4 && finalPos[i] >= 0 ? data.final_b[finalPos[i]] : data.cand_b[i])

  const stages = STAGES.map((meta, k) => {
    const alive = aliveAt(k)
    const idx = []
    for (let i = 0; i < n; i++) if (alive[i]) idx.push(i)
    const s = stats(
      idx.map((i) => data.cand_a[i]),
      idx.map((i) => errAt(k, i)),
      size,
      grid,
      thresh
    )
    // What this stage removed (S5/S4/S6 only): how many, and how good the removed points actually were.
    let removed = null
    if (k >= 1 && k <= 3) {
      const gone = []
      for (let i = 0; i < n; i++) if (deathStage[i] === k) gone.push(i)
      const errs = gone.map((i) => data.cand_err[i])
      removed = {
        count: gone.length,
        gross: errs.filter((e) => e > thresh).length,
        accurate: errs.filter((e) => e < 1).length,
      }
    }
    return { ...meta, ...s, removed }
  })

  const s6 = stages[3]
  const s7 = stages[4]
  return {
    n,
    size,
    grid,
    thresh,
    maxPerCell: data.max_per_cell,
    stages,
    deathStage,
    finalPos,
    aliveAt,
    errAt,
    posB,
    refine: { rmsePre: s6.rmse, rmsePost: s7.rmse },
  }
}
