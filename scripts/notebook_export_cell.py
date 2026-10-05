# ============================================================================
# §10 · Export the demo pair for the LunaTech frontend  (run LAST)
# Writes lunatech_export.json + lunatech_A.png + lunatech_B.png.
# On Kaggle they land in /kaggle/working/lunatech_export/ -> copy the three files
# into  frontend/public/data/  and reload the site.
# The pair is exactly the §3/§5 demo pair; every number in the JSON is measured
# against the exact ground-truth homography, nothing is typed in by hand.
# ============================================================================
import json, datetime

EXPORT_DIR = "/kaggle/working/lunatech_export" if os.path.isdir("/kaggle/working") else "lunatech_export"
os.makedirs(EXPORT_DIR, exist_ok=True)

A, B, H_gt = imgA_demo, imgB_demo, H_gt_demo          # same pair as §3-§5
size = A.shape[0]

# --- replay the stages in register()'s order, keeping every stage's survivors ----
ca, cb, conf = match_sift(A, B, CFG)                                # S3 candidates
mask5, H_est = geometric_verify(ca, cb, CFG)                        # S5 RANSAC
i5 = np.flatnonzero(mask5)
a5, b5, c5 = ca[i5], cb[i5], conf[i5]
sm = structural_consistency(a5, b5, detect_blobs(A, CFG), detect_blobs(B, CFG), CFG)   # S4 structural
i4 = i5[sm]
a4, b4, c4 = ca[i4], cb[i4], conf[i4]
cn = (c4 - c4.min()) / (c4.max() - c4.min() + 1e-9) if len(c4) else c4
sel = spatial_optimize(a4, cn, size, CFG)                           # S6 spatial
i6 = i4[sel]
a6, b6 = ca[i6], cb[i6]
b6_ref = subpixel_refine(A, B, a6, b6, H_est, CFG)                  # S7 refine

# --- guard: the replay must equal what register() reports in §5 --------------------
ref = register(A, B, H_gt)
same = (len(ref["pts_a"]) == len(a6)) and np.allclose(ref["pts_a"], a6) and np.allclose(ref["pts_b"], b6_ref)
print("replay matches register():", same)
assert same, "stage replay diverged from register() - do not export"

def r2(x, n=2):
    return np.round(np.asarray(x, dtype=float), n).tolist()

metrics = compute_metrics(a6, b6_ref, H_gt, size, CFG)
pre = compute_metrics(a6, b6, H_gt, size, CFG)
clean = lambda d: {k: (None if isinstance(v, float) and not np.isfinite(v) else v) for k, v in d.items()}

export = {
    "schema": 1,
    "provenance": {
        # real-ohrc = Kaggle OHRC crops; a local run may set SOURCE_OVERRIDE / IMAGERY_LABEL (see scripts/build_sample_export.py)
        "source": "real-ohrc" if not USING_FALLBACK else globals().get("SOURCE_OVERRIDE", "synthetic-fallback"),
        "source_file": globals().get("IMAGERY_LABEL") or os.path.basename(grayscale_files[0]),
        "ground_truth": "synthetic warp: known homography applied to one real crop",
        "seed": 7, "illum_strength": DEMO_ILLUM, "scale_ratio": DEMO_SCALE,
        "generated_utc": datetime.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "opencv": cv2.__version__,
    },
    "image_size": int(size),
    "grid_size": CFG.grid_size,
    "ransac_thresh_px": CFG.ransac_reproj_thresh,
    "max_per_cell": CFG.max_per_cell,
    "H_gt": r2(H_gt, 8),
    # S3 candidates: A/B positions + error vs ground truth (px). Later stages are index lists into these.
    "cand_a": r2(ca), "cand_b": r2(cb), "cand_err": r2(point_errors(ca, cb, H_gt)),
    "idx": {"S5": i5.tolist(), "S4": i4.tolist(), "S6": i6.tolist()},
    # Final certified points (after S7 refinement), same order as idx["S6"]
    "final_b": r2(b6_ref, 3), "final_err": r2(point_errors(a6, b6_ref, H_gt), 3),
    "final_err_pre_refine": r2(point_errors(a6, b6, H_gt), 3),
    "metrics": clean(metrics),
    "metrics_pre_refine": clean(pre),
    "timings_s": {k: round(v, 4) for k, v in ref["timings"].items()},
}
with open(os.path.join(EXPORT_DIR, "lunatech_export.json"), "w") as f:
    json.dump(export, f, allow_nan=False, separators=(",", ":"))
cv2.imwrite(os.path.join(EXPORT_DIR, "lunatech_A.png"), A)
cv2.imwrite(os.path.join(EXPORT_DIR, "lunatech_B.png"), B)

print(f"source: {export['provenance']['source']} | {os.path.basename(grayscale_files[0])}")
print(f"funnel: S3 {len(ca)} -> S5 {len(i5)} -> S4 {len(i4)} -> S6 {len(i6)} (S7 refines, removes none)")
print(f"RMSE {metrics['rmse_px']:.3f} px | sub-pixel {metrics['inlier_ratio_subpixel']:.3f} | coverage {metrics['grid_occupied_frac']:.3f}")
print("wrote:", sorted(os.listdir(EXPORT_DIR)), "->", EXPORT_DIR)
