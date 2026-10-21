import { describe, expect, it } from 'vitest';
import { studyCameraOffset } from '../apps/studio/src/retro/studyMotion';

describe('M1 analytic camera', () => {
  it('turns all camera motion off at zero intensity, including the optional accent', () => {
    for (let f = 0; f <= 144; f++) expect(studyCameraOffset(f, 0, 1, true)).toEqual({ x: 0, y: 0 });
  });
  it('has greater foreground displacement and only integer bounded offsets', () => {
    expect(Math.abs(studyCameraOffset(96, 1, 1).x)).toBeGreaterThan(Math.abs(studyCameraOffset(96, 1, 0.2).x));
    for (let f = 0; f <= 144; f++) {
      const { x, y } = studyCameraOffset(f, 1, 1, true);
      expect(Number.isInteger(x) && Number.isInteger(y)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(12); expect(Math.abs(y)).toBeLessThanOrEqual(3);
    }
  });
  it('reproduces an offset after out-of-order seeks without retaining state', () => {
    const first = studyCameraOffset(73, 0.85, 0.7, true);
    studyCameraOffset(144, 1, 1); studyCameraOffset(0, 0, 0);
    expect(studyCameraOffset(73, 0.85, 0.7, true)).toEqual(first);
  });
  it('limits the optional accent to the scripted interval at six seconds', () => {
    expect(studyCameraOffset(73, 1, 1, true)).not.toEqual(studyCameraOffset(73, 1, 1, false));
    for (const f of [0, 48, 71, 84, 144]) expect(studyCameraOffset(f, 1, 1, true)).toEqual(studyCameraOffset(f, 1, 1, false));
  });
  it('rejects unsupported frame, strength or depth values', () => {
    expect(() => studyCameraOffset(NaN, 0.5, 1)).toThrow();
    expect(() => studyCameraOffset(1.2, 0.5, 1)).toThrow();
    expect(() => studyCameraOffset(1, Infinity, 1)).toThrow();
    expect(() => studyCameraOffset(1, 1.1, 1)).toThrow();
    expect(() => studyCameraOffset(1, 0.5, -1)).toThrow();
  });
});
