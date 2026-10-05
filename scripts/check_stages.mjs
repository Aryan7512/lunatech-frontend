// Cross-check: statistics derived in JS from the export must equal the notebook's own metrics.
import fs from 'node:fs'
import { buildStages } from '../src/data/lunatechStages.js'
const file = process.argv[2] || new URL('../public/data/lunatech_export.json', import.meta.url).pathname
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const st = buildStages(data)
const m = data.metrics
const last = st.stages[4]
const rows = [
  ['n', last.n, m.n_matches, 0],
  ['rmse_px', last.rmse, m.rmse_px, 2e-3],
  ['median_err_px', last.median, m.median_err_px, 2e-3],
  ['inlier_ratio_subpixel', last.subpixel, m.inlier_ratio_subpixel, 1e-9],
  ['grid_occupied_frac', last.occupied, m.grid_occupied_frac, 1e-9],
  ['grid_entropy_norm', last.entropy, m.grid_entropy_norm, 1e-6],
  ['rmse pre-refine', st.stages[3].rmse, data.metrics_pre_refine.rmse_px, 2e-3],
]
let bad = 0
for (const [k, js, nb, tol] of rows) {
  const ok = Math.abs(js - nb) <= tol
  if (!ok) bad++
  console.log(ok ? 'OK  ' : 'FAIL', k.padEnd(24), 'js', Number(js).toFixed(4), ' notebook', Number(nb).toFixed(4))
}
console.log('funnel', st.stages.map((s) => `${s.code}:${s.n}`).join(' -> '))
st.stages.forEach((s) => s.removed && console.log(s.code, 'removed', s.removed, 'rmse after', s.rmse.toFixed(3)))
// S6 stats from cand_err must equal final_err_pre_refine
const pre = data.final_err_pre_refine
const s6ids = data.idx.S6
const maxd = Math.max(...s6ids.map((ci, j) => Math.abs(data.cand_err[ci] - pre[j])))
console.log('max |cand_err - final_err_pre_refine| =', maxd.toFixed(4))
if (maxd > 0.01) bad++
process.exit(bad ? 1 : 0)
