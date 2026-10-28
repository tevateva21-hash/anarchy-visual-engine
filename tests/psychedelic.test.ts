import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { psychedelicLook } from '../apps/studio/src/therapy/psychedelicLook';
import { roomPose } from '../apps/studio/src/therapy/roomMotion';
import { createTherapyScene } from '../apps/studio/src/therapy/therapyScene';

describe('psychedelic look and movement', () => {
  it('has an exact neutral mode and preserves the original motion formulas', () => {
    for (const t of [0, 8, 30]) {
      const look = psychedelicLook(t, 0, 1);
      expect(look.warp).toBe(0); expect(look.chroma).toBe(0); expect(look.glow).toBe(0);
      expect(look.contrast).toBe(1); expect(look.fillIntensity).toBe(1.2);
      expect(roomPose(t, 0.6, 'conversation', 0)).toEqual(roomPose(t, 0.6, 'conversation'));
    }
  });
  it('increases pendulum and clock speed without unbounded movement or rapid light flashes', () => {
    const initial = roomPose(0.01, 1, 'conversation');
    const stronger = roomPose(0.01, 1, 'conversation', 1);
    expect(stronger.pendulumAngle).toBeGreaterThan(initial.pendulumAngle * 3);
    expect(Math.abs(stronger.clockAngle / initial.clockAngle)).toBeCloseTo(9);
    for (let t = 0; t <= 30; t += 0.05) {
      const pose = roomPose(t, 1, 'conversation', 1), look = psychedelicLook(t, 1, 1);
      expect(Math.abs(pose.pendulumAngle)).toBeLessThanOrEqual(0.19);
      expect(pose.bookLift).toBeLessThanOrEqual(0.08);
      expect(pose.chairBreath).toBeGreaterThanOrEqual(0.976);
      expect(pose.chairBreath).toBeLessThanOrEqual(1.024);
      expect(look.warp).toBeLessThanOrEqual(0.002);
      expect(look.glow).toBeLessThanOrEqual(0.18);
      expect(look.chroma).toBeLessThanOrEqual(0.0015);
    }
  });
  it('freezes all temporal distortion and objects at zero motion while keeping static color treatment', () => {
    expect(psychedelicLook(0, 1, 0)).toEqual(psychedelicLook(30, 1, 0));
    expect(psychedelicLook(8, 1, 0).warp).toBe(0);
    expect(psychedelicLook(8, 1, 0).contrast).toBeGreaterThan(1);
    expect(roomPose(30, 0, 'conversation', 1)).toEqual(roomPose(0, 0, 'conversation', 1));
  });
  it('is reproducible after out-of-order seeks and restores original lighting at zero strength', () => {
    const room = createTherapyScene();
    const snapshot = () => {
      room.scene.updateMatrixWorld(true);
      const objects: unknown[] = [];
      room.scene.traverse(object => {
        if (object instanceof THREE.Mesh) objects.push(object.matrixWorld.elements.slice());
        if (object instanceof THREE.Light) objects.push([object.color.toArray(), object.intensity]);
      });
      return objects;
    };
    try {
      room.update(8, 0.6, 'conversation'); const original = snapshot();
      room.update(8, 0.6, 'conversation', undefined, 1); const altered = snapshot(); expect(altered).not.toEqual(original);
      room.update(22, 1, 'divan', undefined, 0.3);
      room.update(8, 0.6, 'conversation', undefined, 1); expect(snapshot()).toEqual(altered);
      room.update(8, 0.6, 'conversation', undefined, 0); expect(snapshot()).toEqual(original);
    } finally { room.dispose(); }
  });
  it('rejects malformed look strengths and times', () => {
    expect(() => psychedelicLook(NaN, 1, 1)).toThrow();
    expect(() => psychedelicLook(31, 1, 1)).toThrow();
    expect(() => psychedelicLook(0, -1, 1)).toThrow();
    expect(() => psychedelicLook(0, 1, Infinity)).toThrow();
    expect(() => roomPose(0, 1, 'conversation', 1.1)).toThrow();
  });
});
