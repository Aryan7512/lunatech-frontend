import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getSunDirectionFromMoon } from '../astronomy/sunPosition.js'
import { getMoonRotationAngle } from '../astronomy/moonRotation.js'
import { eclipticToScene } from '../astronomy/coordinateFrame.js'

const MODEL_URL = '/Moon_1_3474.glb'

const MoonScene = forwardRef(function MoonScene({ onLoaded, onError, astroClock, onFps }, ref) {
  const containerRef = useRef(null)
  // A stable object whose properties are filled in inside the effect below.
  // useImperativeHandle must be called at the top level (not inside an
  // effect), so we hand the parent a reference to this same object and
  // mutate its properties once the Three.js scene actually exists.
  const apiRef = useRef({})
  useImperativeHandle(ref, () => apiRef.current, [])

  useEffect(() => {
    const container = containerRef.current
    let width = container.clientWidth
    let height = container.clientHeight
    let defaultCameraPos = new THREE.Vector3(0, 1.2, 6)

    // ---------- core scene setup ----------
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000)
    camera.position.set(0, 1.2, 6)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x03060c, 1)
    container.appendChild(renderer.domElement)
    renderer.domElement.classList.add('scene-canvas')

    // ---------- lighting ----------
    // Sun: the ONLY light source that actually illuminates the Moon. It's a
    // DirectionalLight (parallel rays, like a genuinely distant star) whose
    // POSITION is recomputed every frame from real Sun/Moon ephemeris data
    // (see astronomy/sunPosition.js) — never set by hand. Distance from the
    // Moon doesn't matter for a directional light (only direction does), so
    // we place it at a fixed radius purely so `sunOrb` (the little visual
    // marker below) has somewhere sensible to sit.
    const sun = new THREE.DirectionalLight(0xfff6e8, 2.6)
    sun.position.set(8, 3, 5) // placeholder until the first real update below
    scene.add(sun)
    scene.add(sun.target) // target stays at the default (0,0,0) = Moon center

    // Faint cold "earthshine" fill from the opposite side, so the dark limb
    // reads as dim rather than pure crushed black. This is a stylistic
    // approximation of real earthshine (reflected Earth-light), not a
    // physically simulated one — real earthshine is far dimmer and this is
    // intentionally kept subtle so it never washes out the night side.
    const fill = new THREE.DirectionalLight(0x3a5a8a, 0.1)
    scene.add(fill)

    // Very low ambient so shadowed craters keep a hint of detail instead of
    // crushing to pure black. Deliberately dim — real sunlight direction
    // should be doing almost all of the visual work here.
    const ambient = new THREE.AmbientLight(0x0a0c14, 0.22)
    scene.add(ambient)

    // A small unlit sphere marking the direction sunlight is coming from.
    // Positioned for visual clarity (NOT at the real ~150-million-km
    // distance), but its direction always matches the DirectionalLight's.
    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xfff2cf })
    )
    const sunOrbGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffdf9e, transparent: true, opacity: 0.25 })
    )
    sunOrb.add(sunOrbGlow)
    scene.add(sunOrb)

    // ---------- starfield ----------
    scene.add(createStarfield())

    // ---------- orbit controls ----------
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.rotateSpeed = 0.55
    controls.zoomSpeed = 0.7
    controls.minDistance = 2
    controls.maxDistance = 40
    controls.enablePan = false
    controls.target.set(0, 0, 0)

    // ---------- satellite (orbiting body) ----------
    const satellitePivot = new THREE.Object3D()
    scene.add(satellitePivot)
    const satellite = createSatellite()
    satellitePivot.add(satellite)
    // Tilt the orbital plane slightly so it reads as a 3D orbit rather than a flat ring.
    satellitePivot.rotation.x = THREE.MathUtils.degToRad(18)
    satellitePivot.rotation.z = THREE.MathUtils.degToRad(6)

    let orbitRadius = 3 // recalculated once the Moon's real size is known
    let orbitAngle = 0
    const orbitSpeed = 0.35 // radians per second

    // A thin static ring so the orbit path is visible at a glance.
    let orbitLine = null
    let orbitVisible = true

    // How far out to place the visual Sun marker — NOT the real ~150M km
    // distance (see requirement #8 / #7: visualization scale, not literal
    // scale). Recalculated once the Moon's on-screen size is known below.
    let sunVisualDistance = 6

    // ---------- load the Moon model ----------
    const loader = new GLTFLoader()
    let moonRoot = null

    loader.load(
      MODEL_URL,
      (gltf) => {
        moonRoot = gltf.scene
        moonRoot.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false
            child.receiveShadow = false
            if (child.material) {
              child.material.envMapIntensity = 1
            }
          }
        })

        // Center the model and normalize its scale so it always fills the view
        // consistently, regardless of the source file's original units.
        const box = new THREE.Box3().setFromObject(moonRoot)
        const size = new THREE.Vector3()
        box.getSize(size)
        const center = new THREE.Vector3()
        box.getCenter(center)

        moonRoot.position.sub(center)

        const maxDimension = Math.max(size.x, size.y, size.z) || 1
        const targetRadius = 2 // world units for the Moon's visual radius
        const scaleFactor = (targetRadius * 2) / maxDimension
        moonRoot.scale.setScalar(scaleFactor)

        scene.add(moonRoot)

        // Now that we know the Moon's real on-screen size, place the satellite,
        // camera limits, and orbit ring proportionally to it.
        orbitRadius = targetRadius * 2.1
        satellite.position.set(orbitRadius, 0, 0)
        sunVisualDistance = targetRadius * 6

        orbitLine = createOrbitRing(orbitRadius)
        satellitePivot.add(orbitLine)

        controls.minDistance = targetRadius * 1.6
        controls.maxDistance = targetRadius * 14
        camera.position.set(targetRadius * 0.6, targetRadius * 0.9, targetRadius * 3.2)
        defaultCameraPos = camera.position.clone()
        controls.update()

        onLoaded && onLoaded()
      },
      undefined,
      (err) => {
        console.error('Failed to load Moon model:', err)
        onError && onError(err?.message || 'Unknown error while loading /Moon_1_3474.glb')
      }
    )

    // ---------- animation loop ----------
    const renderClock = new THREE.Clock()
    let frameId

    // Astronomy (Sun direction / Moon rotation) only needs to be recomputed
    // a handful of times per second — the geometry barely changes frame to
    // frame even at high simulated-time speeds — so it's throttled here
    // independently of the render loop's frame rate.
    let astroAccumulator = Infinity // force an immediate first update
    const ASTRO_UPDATE_INTERVAL = 1 / 15 // seconds of real (wall-clock) time
    const sunDirVec = new THREE.Vector3()

    // Simple FPS counter, reported to the parent roughly once per second.
    let fpsFrames = 0
    let fpsAccumulator = 0

    function updateAstronomy() {
      if (!astroClock) return
      const date = astroClock.getDate()

      const dir = eclipticToScene(getSunDirectionFromMoon(date))
      sunDirVec.set(dir.x, dir.y, dir.z).normalize()

      sun.position.copy(sunDirVec).multiplyScalar(20)
      sunOrb.position.copy(sunDirVec).multiplyScalar(sunVisualDistance)

      if (moonRoot) {
        // Deterministic, absolute orientation for the current simulated
        // date — see astronomy/moonRotation.js. This is set directly
        // (never incremented), which is what keeps it independent of frame
        // rate, play/pause toggling, and camera dragging.
        moonRoot.rotation.y = getMoonRotationAngle(date)
      }
    }

    function animate() {
      frameId = requestAnimationFrame(animate)
      const delta = renderClock.getDelta()

      if (astroClock) {
        astroClock.advance(delta)
      }

      astroAccumulator += delta
      if (astroAccumulator >= ASTRO_UPDATE_INTERVAL) {
        astroAccumulator = 0
        updateAstronomy()
      }

      // Decorative satellite: an artificial orbiter, animated in real
      // (wall-clock) time — intentionally NOT tied to the astronomical
      // clock, since it isn't a real celestial body.
      orbitAngle += orbitSpeed * delta
      satellitePivot.rotation.y = orbitAngle
      satellite.rotation.y += delta * 1.2 // slow spin on its own axis
      satellitePivot.visible = orbitVisible

      controls.update()
      renderer.render(scene, camera)

      if (onFps) {
        fpsFrames += 1
        fpsAccumulator += delta
        if (fpsAccumulator >= 1) {
          onFps(Math.round(fpsFrames / fpsAccumulator))
          fpsFrames = 0
          fpsAccumulator = 0
        }
      }
    }
    animate()

    // ---------- imperative controls for the parent (RESET / AUTO ROTATE / ORBIT / ZOOM) ----------
    Object.assign(apiRef.current, {
      resetView() {
        camera.position.copy(defaultCameraPos)
        controls.target.set(0, 0, 0)
        controls.update()
      },
      setAutoRotate(enabled) {
        controls.autoRotate = enabled
        controls.autoRotateSpeed = 0.6
      },
      setOrbitVisible(visible) {
        orbitVisible = visible
      },
      zoomBy(factor) {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
        const newLen = THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)
        offset.setLength(newLen)
        camera.position.copy(controls.target).add(offset)
        controls.update()
      },
    })

    // ---------- responsive resize ----------
    function handleResize() {
      width = container.clientWidth
      height = container.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // ---------- cleanup ----------
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      controls.dispose()

      scene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material?.dispose()
          }
        }
      })

      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
})

export default MoonScene

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A simple low-poly satellite: a body, a dish, and two solar panels. */
function createSatellite() {
  const group = new THREE.Group()

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xcfd4dc,
    metalness: 0.7,
    roughness: 0.35,
  })
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1c3a6b,
    metalness: 0.2,
    roughness: 0.5,
    emissive: 0x0a1730,
    emissiveIntensity: 0.4,
  })
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xe8e6f0,
    metalness: 0.5,
    roughness: 0.4,
  })

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.22), bodyMat)
  group.add(body)

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    accentMat
  )
  dish.rotation.x = Math.PI
  dish.position.set(0, 0, 0.16)
  group.add(dish)

  const panelGeo = new THREE.BoxGeometry(0.42, 0.14, 0.01)
  const panelL = new THREE.Mesh(panelGeo, panelMat)
  panelL.position.set(-0.32, 0, 0)
  group.add(panelL)

  const panelR = new THREE.Mesh(panelGeo, panelMat)
  panelR.position.set(0.32, 0, 0)
  group.add(panelR)

  // Small strut connecting each panel to the body
  const strutGeo = new THREE.BoxGeometry(0.08, 0.02, 0.02)
  const strutMat = accentMat
  const strutL = new THREE.Mesh(strutGeo, strutMat)
  strutL.position.set(-0.11, 0, 0)
  group.add(strutL)
  const strutR = new THREE.Mesh(strutGeo, strutMat)
  strutR.position.set(0.11, 0, 0)
  group.add(strutR)

  group.scale.setScalar(1.4)
  return group
}

/** A faint ring geometry to trace the satellite's orbital path. */
function createOrbitRing(radius) {
  const points = []
  const segments = 128
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius))
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: 0x5b6b8c,
    transparent: true,
    opacity: 0.35,
  })
  return new THREE.LineLoop(geometry, material)
}

/** A large point cloud of distant stars surrounding the whole scene. */
function createStarfield() {
  const starCount = 4500
  const positions = new Float32Array(starCount * 3)
  const sizes = new Float32Array(starCount)
  const radius = 300

  for (let i = 0; i < starCount; i++) {
    // distribute roughly uniformly on a large sphere shell around the scene
    const u = Math.random()
    const v = Math.random()
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radius * (0.6 + Math.random() * 0.4)

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)

    sizes[i] = Math.random() * 1.6 + 0.3
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  })

  const stars = new THREE.Points(geometry, material)
  stars.frustumCulled = false
  return stars
}
