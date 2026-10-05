/**
 * The astronomy modules work in an ecliptic-of-date frame (x,y in the
 * ecliptic plane, +z toward the north ecliptic pole) because that's a
 * natural, well-documented frame for Sun/Moon geometry.
 *
 * The 3D scene, however, is a stylized visualization — not a 1:1 spatial
 * model — with its own arbitrary orientation (Three.js +Y is "up" on
 * screen). This module is the single, explicit place where we convert
 * between the two, so the mapping is easy to find and audit.
 *
 * Convention chosen here: ecliptic +z (north ecliptic pole) -> scene +Y.
 * This is arbitrary (nothing in the original scene ties "up" to any real
 * astronomical direction) but it is applied consistently to both the Sun
 * direction and the Moon's rotation axis, which is what actually matters:
 * the *relative* geometry between sunlight and the Moon's spin axis stays
 * astronomically meaningful even though the scene's absolute orientation
 * in space is a stylistic choice.
 */
export function eclipticToScene(v) {
  return { x: v.x, y: v.z, z: -v.y }
}

// The Moon's rotation axis is assumed aligned with the scene's "up" (+Y),
// i.e. with the ecliptic pole. In reality the Moon's axis is tilted about
// 1.54 degrees from the ecliptic pole (Cassini's laws) — negligible for
// this visualization and not modeled here.
export const MOON_AXIS_SCENE = { x: 0, y: 1, z: 0 }
