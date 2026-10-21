import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { roomPose } from '../apps/studio/src/therapy/roomMotion';
import { createTherapyScene } from '../apps/studio/src/therapy/therapyScene';

describe('Techno Therapy Room', () => {
  it('holds every animated property at intensity zero and rejects invalid inputs', () => {
    expect(roomPose(0, 0, 'conversation')).toEqual(roomPose(30, 0, 'conversation'));
    expect(() => roomPose(-1, 0.5, 'conversation')).toThrow();
    expect(() => roomPose(NaN, 0.5, 'conversation')).toThrow();
    expect(() => roomPose(31, 0.5, 'conversation')).toThrow();
    expect(() => roomPose(1, 1.1, 'conversation')).toThrow();
  });
  it('returns reproducible bounded poses and distinct camera viewpoints', () => {
    const first = roomPose(12, 0.7, 'conversation');
    roomPose(30, 1, 'divan'); roomPose(0, 0, 'conversation');
    expect(roomPose(12, 0.7, 'conversation')).toEqual(first);
    expect(roomPose(12, 0.7, 'divan').camera).not.toEqual(first.camera);
    for (let t = 0; t <= 30; t += 0.25) {
      const p = roomPose(t, 1, 'conversation');
      expect(p.chairBreath).toBeGreaterThanOrEqual(0.988);
      expect(p.chairBreath).toBeLessThanOrEqual(1.012);
      expect(Math.abs(p.pendulumAngle)).toBeLessThanOrEqual(0.14);
      expect(p.bookLift).toBeGreaterThanOrEqual(0); expect(p.bookLift).toBeLessThanOrEqual(0.05);
      expect(p.lampIntensity).toBeGreaterThan(14); expect(p.lampIntensity).toBeLessThan(18);
    }
  });
  it('builds real faceted geometry, seeks without adding objects and releases GPU resources', () => {
    const room = createTherapyScene();
    const meshes: THREE.Mesh[] = [];
    room.scene.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
    expect(meshes.length).toBeGreaterThan(100);
    for (const mesh of meshes) expect((mesh.material as THREE.MeshStandardMaterial).flatShading).toBe(true);
    const snapshot = () => {
      room.scene.updateMatrixWorld(true);
      return meshes.map(mesh => mesh.matrixWorld.elements.slice());
    };
    room.update(8, 0.6, 'conversation'); const first = snapshot();
    room.update(23, 1, 'divan'); expect(snapshot()).not.toEqual(first);
    room.update(8, 0.6, 'conversation'); expect(snapshot()).toEqual(first);
    const geometry = vi.spyOn(meshes[0].geometry, 'dispose');
    const material = vi.spyOn(meshes[0].material as THREE.Material, 'dispose');
    room.dispose(); expect(geometry).toHaveBeenCalledOnce(); expect(material).toHaveBeenCalledOnce();
    expect(room.scene.children).toHaveLength(0);
  });
});
