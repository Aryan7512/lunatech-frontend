/**
 * AstronomyClock owns ONE thing: the current simulated date/time, plus
 * play/pause and speed state. It is deliberately plain JS (not a React
 * hook) so the Three.js render loop can read `getDate()` every frame
 * without going through React state/re-renders.
 *
 *   SIMULATED DATE/TIME  ---->  astronomy/*.js calculations  ---->  3D scene
 *        ^
 *        | advance() called once per rendered frame with the real
 *        | wall-clock delta; only moves the date forward when playing
 *
 * UI components (date/time pickers, play/pause, speed, telemetry readouts)
 * subscribe() to be notified when the date changes, throttled internally so
 * dragging through Play doesn't cause 60 React re-renders per second.
 *
 * Crucially, user camera drag (OrbitControls) never touches this class —
 * the astronomical date is the only thing that drives Sun direction and
 * Moon rotation, keeping "look around" fully separate from "when is it".
 */
export class AstronomyClock {
  constructor(initialDate = new Date()) {
    this.date = new Date(initialDate)
    this.playing = false
    this.speed = 1
    this._listeners = new Set()
    this._notifyAccumulator = 0
  }

  getDate() {
    return this.date
  }

  setDate(date) {
    this.date = new Date(date)
    this._notify()
  }

  setNow() {
    this.setDate(new Date())
  }

  play() {
    this.playing = true
    this._notify()
  }

  pause() {
    this.playing = false
    this._notify()
  }

  togglePlay() {
    this.playing = !this.playing
    this._notify()
  }

  setSpeed(multiplier) {
    this.speed = multiplier
    this._notify()
  }

  /**
   * Called once per rendered frame from the Three.js loop.
   * @param {number} realDeltaSeconds - wall-clock seconds elapsed since last frame
   */
  advance(realDeltaSeconds) {
    if (!this.playing) return
    this.date = new Date(this.date.getTime() + realDeltaSeconds * 1000 * this.speed)

    // Throttle UI notifications to ~4/sec regardless of frame rate or speed,
    // so fast-forwarding through months doesn't flood React with updates.
    this._notifyAccumulator += realDeltaSeconds
    if (this._notifyAccumulator >= 0.25) {
      this._notifyAccumulator = 0
      this._notify()
    }
  }

  subscribe(fn) {
    this._listeners.add(fn)
    return () => this._listeners.delete(fn)
  }

  _notify() {
    for (const fn of this._listeners) {
      fn(this.date, { playing: this.playing, speed: this.speed })
    }
  }
}
