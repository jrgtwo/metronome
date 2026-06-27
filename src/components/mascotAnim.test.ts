import { describe, it, expect } from 'vitest';
import {
  conveyorTranslate,
  pendulumAngle,
  beatDurationMs,
  bodySway,
  bodyOffset,
  bodyBob,
  bodyPath,
  SP,
  MAX_ANGLE,
  Y_FOOT,
} from './mascotAnim';

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

describe('beatDurationMs', () => {
  // bpm is quarter-note pulses/min; a pulse is a note of value `denominator`,
  // so a /8 pulse is half a quarter, a /2 pulse is two quarters. This is the
  // even spacing the steady pendulum swings on — independent of subdivision/swing.
  it('is one quarter at /4 (a real-metronome tick)', () => {
    expect(beatDurationMs(120, 4)).toBe(500);
  });

  it('is half as long for an /8 pulse (e.g. 7/8) and twice for /2', () => {
    expect(beatDurationMs(120, 8)).toBe(250);
    expect(beatDurationMs(120, 2)).toBe(1000);
    expect(beatDurationMs(120, 16)).toBe(125);
  });

  it('scales inversely with tempo', () => {
    expect(beatDurationMs(60, 4)).toBe(1000);
  });
});

describe('bodySway', () => {
  it('is at a hip extreme on beat 0 (planted hip on the downbeat)', () => {
    expect(bodySway(0, 0, 0, 2, 2)).toBeCloseTo(-1);
  });

  it('swings to the opposite hip extreme on the next beat', () => {
    expect(bodySway(1, 0, 0, 2, 2)).toBeCloseTo(1);
  });

  it('passes through center halfway between beats (default 1 sway / 2 beats)', () => {
    // beatPhase 0.5 → s = 0
    expect(bodySway(0, 1, 0, 2, 2)).toBeCloseTo(0);
  });

  it('moves in phase with the pendulum at the default rate (2 beats/sway)', () => {
    // s equals the pendulum’s normalized swing — hips follow the weight.
    for (const [mb, si, fr, spb] of [
      [0, 0, 0, 2],
      [1, 0, 0, 2],
      [0, 1, 0, 2],
      [2, 0, 0, 4],
      [1, 2, 0.3, 4],
    ] as const) {
      expect(bodySway(mb, si, fr, spb, 2)).toBeCloseTo(pendulumAngle(mb, si, fr, spb) / MAX_ANGLE);
    }
  });

  it('completes a full sway every beat when beatsPerSway is 1', () => {
    expect(bodySway(0, 0, 0, 2, 1)).toBeCloseTo(-1);
    expect(bodySway(1, 0, 0, 2, 1)).toBeCloseTo(-1); // one whole beat later → back to the same extreme
  });
});

describe('bodyOffset', () => {
  const AMP = 9;
  const Y_MID = 60; // mid-body — where the whole-body sway should bulge most
  const Y_LOW = 80; // just above the base
  const Y_TOPISH = 30; // near the dome — the slight counter-lean

  it('keeps the feet planted (zero offset at the base)', () => {
    expect(bodyOffset(Y_FOOT, 1, AMP)).toBeCloseTo(0);
  });

  it('swings the whole body — bulges at mid-body, not down by the base', () => {
    // The "arms near the feet" look came from a low, narrow bulge; the whole-body
    // sway must move the mid-body more than the area just above the base.
    expect(Math.abs(bodyOffset(Y_MID, 1, AMP))).toBeGreaterThan(Math.abs(bodyOffset(Y_LOW, 1, AMP)));
  });

  it('counter-leans the top against the body (opposite signs) for life', () => {
    expect(Math.sign(bodyOffset(Y_TOPISH, 1, AMP))).toBe(-Math.sign(bodyOffset(Y_MID, 1, AMP)));
    expect(bodyOffset(Y_TOPISH, 1, AMP)).not.toBe(0);
  });

  it('is symmetric left/right (odd in the sway value)', () => {
    expect(bodyOffset(Y_MID, -0.5, AMP)).toBeCloseTo(-bodyOffset(Y_MID, 0.5, AMP));
  });

  it('rests centered when not swaying (s = 0)', () => {
    expect(bodyOffset(Y_MID, 0, AMP)).toBe(0);
  });

  it('scales linearly with amplitude', () => {
    expect(bodyOffset(Y_MID, 1, 2 * AMP)).toBeCloseTo(2 * bodyOffset(Y_MID, 1, AMP));
  });
});

describe('bodyBob', () => {
  it('only ever hops up, never down (≤ 0)', () => {
    expect(bodyBob(0.7, 2.5)).toBeLessThanOrEqual(0);
    expect(bodyBob(-0.7, 2.5)).toBeLessThanOrEqual(0);
  });

  it('does not bob while centered', () => {
    expect(bodyBob(0, 2.5)).toBe(0);
  });

  it('hops highest at the side extremes', () => {
    expect(Math.abs(bodyBob(1, 2.5))).toBeCloseTo(2.5);
    expect(Math.abs(bodyBob(1, 2.5))).toBeGreaterThan(Math.abs(bodyBob(0.4, 2.5)));
  });
});

describe('bodyPath', () => {
  const pairs = (d: string): Array<[number, number]> => {
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const out: Array<[number, number]> = [];
    for (let i = 0; i + 1 < nums.length; i += 2) out.push([nums[i], nums[i + 1]]);
    return out;
  };

  it('is left/right symmetric at rest (mean x = 50, feet at 30 and 70)', () => {
    const p = pairs(bodyPath(0, 9));
    expect(p[0]).toEqual([30, Y_FOOT]); // path starts at the left foot
    expect(p.some(([x, y]) => Math.abs(x - 70) < 0.01 && y === Y_FOOT)).toBe(true);
    const meanX = p.reduce((a, [x]) => a + x, 0) / p.length;
    expect(meanX).toBeCloseTo(50, 1);
  });

  it('keeps the feet planted while swaying', () => {
    const feet = pairs(bodyPath(1, 9)).filter(([, y]) => y === Y_FOOT);
    const xs = feet.map(([x]) => x).sort((a, b) => a - b);
    expect(xs[0]).toBeCloseTo(30);
    expect(xs[xs.length - 1]).toBeCloseTo(70);
  });

  it('bends the body when swaying', () => {
    expect(bodyPath(1, 9)).not.toBe(bodyPath(0, 9));
  });
});
