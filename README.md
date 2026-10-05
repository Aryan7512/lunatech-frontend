# Moon — 3D Explorer

An interactive 3D Moon viewer built with React, Vite, and Three.js. It loads your
`Moon_1_3474.glb` model, adds an orbiting satellite, realistic lighting, a starfield
background, and full mouse/touch controls to rotate and zoom.

## What's included

```
moon-3d-site/
├── public/
│   └── Moon_1_3474.glb        ← your NASA Moon model, served as a static asset
├── src/
│   ├── components/
│   │   └── MoonScene.jsx      ← all the Three.js logic (loading, lighting, orbit, stars)
│   ├── App.jsx                 ← page layout + loading/error UI
│   ├── main.jsx                 ← React entry point
│   └── index.css                ← global styles
├── index.html
├── package.json
└── vite.config.js
```

## 1. Install prerequisites

You need **Node.js 18 or newer** (which includes `npm`). Check what you have:

```bash
node -v
npm -v
```

If you don't have Node installed, download it from https://nodejs.org (LTS version).

## 2. Install dependencies

From inside the `moon-3d-site` folder, run:

```bash
npm install
```

This installs React, Vite, and Three.js (all pinned in `package.json` — no other
setup is required).

## 3. Run it locally

```bash
npm run dev
```

Vite will print a local URL, typically:

```
Local:   http://localhost:5173/
Network: http://192.168.x.x:5173/
```

Open the `Local` link in your browser. The `Network` link lets you open the same
page on your phone if it's on the same Wi-Fi, which is a quick way to test the
mobile/touch controls on a real device.

## 4. Build for production (optional)

```bash
npm run build
```

This outputs a static, deployable site into `dist/`. You can preview that build with:

```bash
npm run preview
```

## Controls

- **Drag** (mouse) or **swipe** (touch) — rotate around the Moon
- **Scroll wheel** or **pinch** — zoom in/out
- Zoom is clamped so you can't clip through the surface or zoom out into empty space

## How the model is handled

- `Moon_1_3474.glb` lives in `public/`, so Vite serves it as-is at `/Moon_1_3474.glb` —
  it is never modified, re-encoded, or replaced.
- On load, `MoonScene.jsx` measures the model's actual bounding box and re-centers
  and re-scales it so it always appears at a consistent, prominent size, regardless
  of the units the original file was authored in. This only changes the model's
  transform (position/scale) in the scene, not the underlying asset.
- The orbiting satellite, orbit ring, camera distance limits, and lighting are all
  computed relative to the Moon's real size, so the scene adapts automatically if
  you ever swap in a different GLB.

## Customizing

A few quick things you'll likely want to tweak, all in `src/components/MoonScene.jsx`:

- **Orbit speed**: `orbitSpeed` (radians/second)
- **Satellite distance**: `orbitRadius = targetRadius * 2.1` — increase the multiplier
  to push it further out
- **Lighting mood**: the `sun`, `fill`, and `ambient` lights near the top of the
  effect — colors and intensities are commented
- **Star density**: `starCount` inside `createStarfield()`
- **Zoom limits**: `controls.minDistance` / `controls.maxDistance`

## Astronomy simulation (Sun lighting, time, phase, rotation)

The Moon's lighting is now driven by a real astronomical simulation instead
of a fixed light. Modules live in `src/astronomy/`:

```
src/astronomy/
├── constants.js        sidereal/synodic periods, J2000 epoch, AU→km
├── AstronomyClock.js    owns simulated date/time + play/pause/speed
├── sunPosition.js       Moon→Sun direction vector
├── moonRotation.js      deterministic sidereal rotation angle
├── moonPosition.js      phase, illumination, distance, RA/Dec, libration
└── coordinateFrame.js   maps the ecliptic frame onto the Three.js scene
```

**Library**: [`astronomy-engine`](https://github.com/cosinekitty/astronomy) —
a dependency-free JS ephemeris library using VSOP87-class analytic series for
the Sun and an ELP2000-82-derived series for the Moon. This is a legitimate,
widely-used astronomy library, not hand-rolled orbital mechanics — but it is
an *analytic* ephemeris (arcminute-class accuracy), not JPL's numerically
integrated DE-440 (that would need a large binary kernel file, impractical
for a browser build).

**Coordinate system**: astronomy-engine's `GeoVector()` returns geocentric
equatorial J2000 (EQJ) vectors for the Sun and Moon. The Sun-direction
calculation subtracts the Moon's geocentric vector from the Sun's — i.e. the
vector actually points from the Moon to the Sun, not from Earth — then
rotates that into the ecliptic-of-date frame. `coordinateFrame.js` is the
single place that maps this onto the Three.js scene (ecliptic north pole →
scene +Y); everything else works in real astronomical vectors right up
until that one conversion.

**Sun lighting**: one `THREE.DirectionalLight` (parallel rays, like a truly
distant star) whose position is recalculated every ~1/15s from the real Sun
direction — never set by hand. The terminator and Moon phase are a natural
result of that light hitting the sphere; nothing paints a crescent or
darkens a texture. A small unlit "Sun orb" marks the light's direction at a
scale chosen for visual clarity (the real Earth–Sun distance would put it
absurdly far outside the scene) — see requirement 7/8 in the original brief.

**Moon rotation**: `getMoonRotationAngle(date)` is a pure function of the
simulated date — not an accumulated per-frame increment — using the Moon's
real sidereal period (27.321661 days). Scrubbing to any date, jumping to
NOW, or toggling Play/Pause always produces the same orientation for that
date. Camera dragging (OrbitControls) never touches this value.

**Moon phase / illumination**: `Astronomy.Illumination()` gives the
Sun-Moon-Earth phase angle → illuminated fraction; `Astronomy.MoonPhase()`
gives the Sun-Moon relative ecliptic longitude, bucketed into the 8
conventional phase names (New, Waxing Crescent, First Quarter, ...). These
describe the Sun/Earth/Moon geometry itself, independent of where your
camera currently is — consistent with what "the Moon's phase" conventionally
means.

**Verified against known phases** — `scripts/test-astro.mjs` uses the
library's own `SearchMoonPhase()` to find real New/First-Quarter/Full/Last-
Quarter moments and checks the illuminated fraction at each:

```
New Moon       illum=0.1%   (expected ~0%)
First Quarter  illum=50.1%  (expected ~50%)
Full Moon      illum=99.9%  (expected ~100%)
Last Quarter   illum=50.1%  (expected ~50%)
```

Run it yourself with `node scripts/test-astro.mjs` (after `npm install`).

**Documented approximations**:
- The Moon's ~1.5° axial tilt and libration wobble aren't modeled in the
  rotation — only the mean uniform sidereal spin. This doesn't affect the
  phase/terminator, which comes from the independent Sun light.
- The rotation's zero-point (which crater faces which way at J2000) is
  arbitrary, since the GLB's texture alignment to real selenographic
  longitude 0° is unknown — only the *rate* is astronomically accurate.
- "Subsolar longitude" is approximated directly from the Sun-Moon relative
  ecliptic longitude (the dominant term); "subsolar latitude" reuses the
  Moon's optical-libration latitude as an order-of-magnitude stand-in.
  Neither is a full selenographic transform — see comments in
  `moonPosition.js`.
- The "earthshine" fill light and ambient light are stylistic (so the night
  side isn't pure crushed black on screen), not physically simulated
  earthshine brightness.
- The Sun's visual marker sits at a scene-appropriate distance, not the real
  ~150,000,000 km — only its *direction* is astronomically driven.

## LUNA TECH instrumentation UI

The interface layer (header, status bars, telemetry panels, simulation
clock, control dock, coordinate gauge, calibration reticle) lives in
`src/components/luna/` and `src/luna-theme.css`, styled per the LUNA TECH
design system (near-black surfaces, champagne/gold accents used sparingly,
Hanken Grotesk for UI text, JetBrains Mono for telemetry). The Moon stays
the unobstructed centerpiece — panels sit in floating side rails on desktop
(≥980px) and collapse into a single toggleable sheet (via the header's
settings icon, or "OPEN SIMULATION →") on narrower screens.

The **Accuracy Bench** panel intentionally does *not* claim JPL DE-440 or
fabricated precision figures — it states what this build actually uses
(astronomy-engine's analytic series), per the "never fabricate precision"
requirement.

## Troubleshooting

- **Blank black screen**: open your browser's dev console (F12) — if you see a 404
  for `/Moon_1_3474.glb`, make sure the file is still in `public/` with that exact
  filename.
- **"Could not load the Moon model" message on screen**: same cause as above, or the
  GLB file may have been corrupted during transfer — re-copy it into `public/`.
- **Port already in use**: run `npm run dev -- --port 5174` to use a different port.
