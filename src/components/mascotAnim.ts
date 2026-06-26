/**
 * Pure phase math for the hero metronome animation. Kept separate (and pure) so
 * the anchor invariants are unit-testable. The key property: both functions are
 * derived purely from the engine's CURRENT position — they carry no accumulated
 * history — so the animation stays anchored across tempo / meter / feel changes
 * (the previous accumulator-based version drifted when those changed).
 */
export const SP = 15; // horizontal spacing between notes (user units)
export const X_MOUTH = 67; // a note sits here (entering the metronome) on its tick
export const MAX_ANGLE = 16; // pendulum swing amplitude (degrees)

/**
 * Conveyor x-translation. With notes laid out at `X_MOUTH + i*SP`, this puts the
 * note whose index equals `inMeasureTick` exactly at the mouth when `frac === 0`,
 * and loops seamlessly at the measure boundary. Depends only on the current
 * in-measure tick, so it re-anchors immediately after any change.
 */
export function conveyorTranslate(inMeasureTick: number, frac: number, patternWidth: number): number {
  const phase = (inMeasureTick + frac) * SP;
  const off = ((phase % patternWidth) + patternWidth) % patternWidth;
  return -off;
}

/**
 * Pendulum angle in degrees. `monotonicBeat` counts beats since playback started
 * (so the pendulum alternates sides every beat across bar lines, including odd
 * meters); the in-beat position eases the swing. At every integer beat it sits
 * at an extreme (far left on beat 0).
 */
export function pendulumAngle(
  monotonicBeat: number,
  subIndex: number,
  frac: number,
  subsPerBeat: number,
): number {
  const beatPhase = monotonicBeat + (subIndex + frac) / Math.max(1, subsPerBeat);
  return -MAX_ANGLE * Math.cos(Math.PI * beatPhase);
}
