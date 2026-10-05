# LunaTech — Context Document for Video Generation

*This document is written as a single, self-contained explainer. It's structured to be narrated in order — each section builds on the last — so a generated video can follow it top to bottom as a script.*

---

## What LunaTech is, in one paragraph

LunaTech takes two independent photographs of the same patch of the Moon's surface — captured by Chandrayaan-2's three optical cameras (OHRC, TMC-2, and IIRS) — and figures out, pixel by pixel, exactly how they line up. It does this even when the two photos were taken months apart, under completely different sunlight, at wildly different zoom levels. The output isn't just a prettier picture; it's a set of precisely matched, verified reference points that scientists can trust enough to build accurate maps, 3D terrain models, and mission-planning tools on top of. This is being built for Smart India Hackathon problem statement SIH26166, issued by ISRO, under the title "Multi-modal, Sun angle and scale invariant image correspondence using Chandrayaan-2 optical images."

---

## Part 1: What is the data, really?

Before explaining the problem, it helps to understand what's actually being worked with.

Each Chandrayaan-2 image is, underneath everything, just a giant grid of numbers — one number per pixel, representing how bright that spot on the Moon was. That's all a photo fundamentally is. The file also carries a "label" — a block of text describing when the photo was taken, where the spacecraft was, which way the sun was pointing. That's metadata, not the picture.

Chandrayaan-2 doesn't have one camera — it has three, and they trade off differently:

- **OHRC (Orbiter High Resolution Camera)**: extreme zoom. Each pixel covers about 25 centimeters of ground. Incredibly sharp, but each photo only covers a small patch — like a telephoto lens.
- **TMC-2 (Terrain Mapping Camera)**: medium zoom. Each pixel covers about 5 meters. Less detail, but covers far more ground per photo.
- **IIRS (Imaging Infrared Spectrometer)**: wide and coarse — each pixel covers about 80 meters — but it captures something beyond brightness: a kind of "chemical fingerprint" that reveals what minerals are present on the surface.

No single camera can give sharp detail, wide coverage, and mineral data all at once — it's a physical trade-off, the same reason a phone camera can't be a telephoto and a wide-angle lens simultaneously.

---

## Part 2: Why can't you just line the photos up directly?

This is the part people find most surprising. These aren't a matched pair like a pair of human eyes, photographing the same scene at the same instant. Each camera flies over the Moon on its own separate schedule. An OHRC photo of a crater and a TMC-2 photo of that same crater might have been taken months apart, from a different point in orbit, with the sun sitting in a completely different position in the sky. All you know going in is roughly which region of the Moon each photo covers — not which exact pixel in one photo corresponds to which exact pixel in the other.

There's a familiar analogy: this is exactly the problem your phone solves when it stitches two overlapping photos into a panorama. It has two separate images and no built-in knowledge of where they overlap — it has to figure that out purely from the picture content. LunaTech is solving a much harder version of that same problem.

Two things make the lunar version brutally harder than a phone panorama:

**Illumination changes everything.** A crater's shadow completely flips shape and side depending on where the sun is. The exact same physical crater can look like two unrelated shapes in two different photos. Simple appearance-matching techniques — the kind used for panorama stitching — break down here, because they rely heavily on shadow and gradient patterns that the sun angle destroys.

**Terrain isn't flat.** The Moon has real relief — crater rims, ridges, valley floors at different heights. When the camera's viewing angle changes, a point on a tall rim shifts across the image differently than a point on a flat crater floor right next to it. A single simple geometric transformation cannot correctly describe that — you need something that accounts for the actual 3D shape of the ground.

**Scale gaps are extreme.** Between OHRC's 25 cm pixels and IIRS's 80-meter pixels, there's roughly a 300-times difference in resolution. A single IIRS pixel covers an area that would take hundreds of OHRC pixels to represent. That changes what "matching a pixel" even means across those two instruments.

---

## Part 3: The LunaTech approach — the CRATER model

LunaTech's pipeline is organized around six stages, spelling out **C-R-A-T-E-R** — a name chosen because the pipeline's core defensible idea is literally about using craters as stable landmarks.

**C — Candidate Generation.** First, narrow down to the small overlapping region between the two photos (no point comparing pixels that don't even show the same ground), then run an appearance-matching model over that region to propose candidate matching points. This step uses a modern learned matching model rather than older rule-based techniques, because those older techniques rely too heavily on exactly the shadow patterns that sun-angle change destroys.

**R — Robust Structural Verification.** This is LunaTech's core original idea. A crater's *appearance* changes dramatically with the sun. But a crater's *position relative to its neighboring craters* does not change at all. So LunaTech detects crater-like shapes independently in both photos, builds a small map of "which craters sit near which," and for every candidate match, checks whether the local layout of nearby craters is consistent between the two images — allowing for rotation and scale. A match that looks convincing on brightness alone but makes no geometric sense in its neighborhood gets thrown out. This gives the pipeline a second, independent way to catch wrong matches that appearance alone would miss.

**A — Adaptive Geometric Modeling.** Because the Moon's terrain isn't flat, LunaTech doesn't force one single transformation over the whole image. Instead it fits the geometric relationship in small local patches, then blends those into one smooth, terrain-tolerant transformation — a technique built specifically to handle the fact that a crater rim and a crater floor right next to each other can shift differently between two viewpoints.

**T — Targeted Spatial Optimization.** Left alone, a matching algorithm will pile up its best matches wherever the terrain happens to be visually interesting — one crater rim might get eighty matches while the rest of the frame gets none. That produces a technically impressive-looking result that is actually untrustworthy, because most of the image has no verified alignment at all. LunaTech explicitly solves this by dividing the image into a grid and requiring matches to be spread across it — deliberately going and finding weaker evidence in the "boring" parts of the image rather than only relying on the interesting parts.

**E — Enhanced Sub-pixel Refinement.** Even after all the verification, matches are only accurate to the nearest whole pixel. A final, local refinement step pushes each match down to a small fraction of a pixel of precision — the step that actually earns the "sub-pixel accuracy" the problem statement asks for.

**R — Registered Output & Reporting.** Finally, every accepted match gets tagged with a confidence tier — high-confidence, geometrically-reliable-but-less-certain, or flagged for human review — rather than pretending every part of the Moon is equally easy to match. The results are exported in a format compatible with existing planetary-mapping software already used by scientists, so this isn't a dead-end demo output.

---

## Part 4: What makes this trustworthy, not just impressive-looking

Two design choices matter more than any single accuracy number:

**Confidence tiers instead of one blanket claim.** Matching OHRC to OHRC is far easier than matching OHRC to IIRS, given that ~300x scale gap. Rather than quietly failing or inflating claims on the hard cases, LunaTech tags every result honestly by how much evidence backs it up. That honesty is itself a feature — a scientist using the output knows exactly how much to trust each point.

**A repeatable stress test, not a single demo number.** LunaTech doesn't just report "it works." It systematically tests itself across a grid of conditions — different amounts of lighting difference, different scale ratios — and reports exactly where accuracy holds up and where it degrades. That turns "trust us" into "here is precisely the operating envelope, measured."

---

## Part 5: What was actually measured

Working from a real prototype tested on genuine Chandrayaan-2 OHRC surface imagery (not simulated data), with exact geometric ground truth generated by warping real image crops with a known transformation:

- The full pipeline achieved roughly **0.26 pixels of average error**, matching the sub-pixel accuracy the problem statement asks for.
- The certified matches landed with a roughly **99% sub-pixel success rate**.
- A controlled comparison against a basic "classical matching only" baseline showed the full pipeline holding accuracy steady while the baseline's error grew far larger and less consistent under the same conditions.
- The crater-detector component was validated directly against real, independently-labeled crater annotations, rather than assumed to work.

These numbers came from an early prototype, not a finished production system — and that's stated plainly rather than dressed up, because a research team that names its own current limits is more credible, not less.

---

## Part 6: Why this matters beyond the hackathon

Right now, lining up images like these is largely a manual, labor-intensive process for planetary scientists — someone has to sit down and pick matching points by hand, image pair by image pair. LunaTech automates that specific bottleneck:

- **For ISRO's own mapping pipeline**: faster, more consistent generation of the reference points used to build accurate lunar terrain maps and elevation models.
- **For scientists studying specific features**: the ability to overlay high-resolution imagery and mineral data on the exact same spot with confidence, instead of eyeballing an approximate overlap.
- **For future missions**: more reliable terrain data supports safer landing-site selection.
- **For the wider research community**: the stress-testing framework itself is reusable — other researchers working on the same lunar-matching problem can use it to measure their own methods on equal footing, rather than everyone reporting one cherry-picked success case.

---

## Reference facts for narration accuracy

- Problem Statement ID: **SIH26166**
- Full PS title: *Multi-modal, Sun angle and scale invariant image correspondence using Chandrayaan-2 optical images (OHRC, TMC and IIRS)*
- Issuing organisation: **Indian Space Research Organisation (ISRO)**
- Theme: **Space Technology** · Category: **Software**
- Project / product name: **LunaTech**
- Mission context: Chandrayaan-2, India's second lunar mission, launched 22 July 2019, orbiter still active in a 100 km lunar orbit
- Instrument resolutions: OHRC ≈ 0.25 m/pixel · TMC-2 ≈ 5 m/pixel · IIRS ≈ 80 m/pixel
- Evaluation criteria named in the problem statement: sub-pixel RMSE, inlier count/ratio, uniform spatial distribution of matches
