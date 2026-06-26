import { describe, it, expect } from 'vitest';
import { conveyorTranslate, pendulumAngle, SP, MAX_ANGLE } from './mascotAnim';

describe('conveyorTranslate', () => {
  const PW = 4 * SP; // 4/4 straight: 4 notes per measure

  it('puts the current tick’s note at the mouth on the beat (frac 0)', () => {
    expect(conveyorTranslate(0, 0, PW)).toBe(-0);
    expect(conveyorTranslate(1, 0, PW)).toBe(-SP);
    expect(conveyorTranslate(2, 0, PW)).toBe(-2 * SP);
    expect(conveyorTranslate(3, 0, PW)).toBe(-3 * SP);
  });

  it('loops seamlessly across the measure boundary', () => {
    // end of the last tick == start of the next measure
    expect(conveyorTranslate(3, 1, PW)).toBeCloseTo(conveyorTranslate(0, 0, PW));
  });

  it('re-anchors immediately when the pattern width changes (meter/feel change)', () => {
    const PW8 = 8 * SP; // switched to 8ths mid-play
    // tick 2 still maps to two spacings in, under the NEW width — no drift
    expect(conveyorTranslate(2, 0, PW8)).toBe(-2 * SP);
  });

  it('depends only on the current tick, never on accumulated history', () => {
    // The same in-measure tick always yields the same position, regardless of
    // how playback reached it — this is the property the old accumulator broke.
    expect(conveyorTranslate(2, 0, PW)).toBe(conveyorTranslate(2, 0, PW));
  });
});

describe('pendulumAngle', () => {
  it('rests at the far-left extreme on beat 0', () => {
    expect(pendulumAngle(0, 0, 0, 2)).toBeCloseTo(-MAX_ANGLE);
  });

  it('swings to the far-right extreme on the next beat', () => {
    expect(pendulumAngle(1, 0, 0, 2)).toBeCloseTo(MAX_ANGLE);
  });

  it('hits an extreme every beat regardless of the subdivision count', () => {
    expect(Math.abs(pendulumAngle(2, 0, 0, 4))).toBeCloseTo(MAX_ANGLE);
    expect(Math.abs(pendulumAngle(3, 0, 0, 3))).toBeCloseTo(MAX_ANGLE);
  });

  it('is mid-swing (not at an extreme) on a subdivision', () => {
    expect(Math.abs(pendulumAngle(0, 1, 0, 2))).toBeLessThan(MAX_ANGLE - 1);
  });
});
