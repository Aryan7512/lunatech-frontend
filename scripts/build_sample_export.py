"""Run the notebook's own pipeline cells locally (synthetic stand-in data, since the
Kaggle OHRC set is not on this machine) and run its §10 export cell.
Usage: python scripts/build_sample_export.py <scratch_dir> <out_dir> [textured | image <path> <label>]
"image" runs the pipeline on a real public-domain lunar image instead (e.g. NASA LRO / LROC NAC).
"textured" swaps the notebook's flat stand-in images (a few circles on grey) for noise-texture + craters,
so SIFT finds ~1000+ candidates like real imagery would. Either way the export is badged as a stand-in.
"""
import json, os, sys
os.environ["MPLBACKEND"] = "Agg"
scratch, out = sys.argv[1], sys.argv[2]
nb = json.load(open(os.path.join(os.path.dirname(__file__), "..", "finals-sih2026.ipynb")))
src = lambda i: "".join(nb["cells"][i]["source"])
g = {"__name__": "__main__"}
# imports, config, dataset (fallback), image classify, pair-gen + demo pair, stages + register
def run(i):
    code = src(i).replace("/tmp/ohrc_fallback", os.path.join(scratch, "ohrc_fallback"))
    exec(compile(code, f"nb-cell-{i}", "exec"), g)

for i in (2, 6, 8):
    run(i)
if "image" in sys.argv[3:]:
    import cv2
    k = sys.argv.index("image")
    im = cv2.imread(sys.argv[k + 1], cv2.IMREAD_UNCHANGED)
    im = im[..., :3].mean(axis=2) if im.ndim == 3 else im
    cv2.imwrite(os.path.join(g["DATA_DIR"], "ohrc_patch_000.png"), im.astype("uint8"))
    g["SOURCE_OVERRIDE"] = "public-lunar-image"
    g["IMAGERY_LABEL"] = sys.argv[k + 2]
if "textured" in sys.argv[3:]:
    import glob
    import cv2
    import numpy as np
    rs = np.random.default_rng(3)
    for pth in glob.glob(os.path.join(g["DATA_DIR"], "ohrc_patch_[0-9]*.png")):
        n = rs.normal(0, 1, (700, 700)).astype(np.float32)
        tex = sum(cv2.GaussianBlur(n, (0, 0), sg) * w for sg, w in ((1.5, 1.0), (4, 2.5), (12, 5.0)))
        tex = (tex - tex.min()) / (tex.max() - tex.min()) * 200 + 25
        for _ in range(40):
            cx, cy, r = rs.integers(20, 680), rs.integers(20, 680), int(rs.integers(6, 40))
            cv2.circle(tex, (int(cx), int(cy)), r, 60, -1)
            cv2.circle(tex, (int(cx), int(cy)), r, 210, 2)
        cv2.imwrite(pth, tex.astype(np.uint8))
for i in (9, 11, 14, 16):  # 11 = annotations + detect_blobs (needed by stage 4)
    run(i)
export_src = "".join(nb["cells"][-1]["source"])
assert "§10" in export_src
os.makedirs(out, exist_ok=True)
os.chdir(out)
exec(compile(export_src.replace('"lunatech_export"', '"."'), "nb-export", "exec"), g)
