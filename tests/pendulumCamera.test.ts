import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { evaluateCameraPreset, PENDULUM_PUSH, CAMERA_CLEARANCE } from '../apps/studio/src/therapy/cameraPresets';
import { createTherapyScene } from '../apps/studio/src/therapy/therapyScene';
import type { CameraShotState } from '../packages/contracts/src/index';
const target = [-0.12, 0.82, 0.25] as const;
const evaluate = (time: number, duration = 8) => evaluateCameraPreset(PENDULUM_PUSH, time, duration, target);
const shot = (time: number, duration = 8): CameraShotState => ({ presetId: PENDULUM_PUSH.id, timeSeconds: time, durationSeconds: duration });

describe('Pendulum Push trajectory', () => {
  it.each([2, 8, 30])('uses stable endpoints at duration %i and clamps finite out-of-range time', duration => {
    expect(evaluate(0, duration).position).toEqual([0.6, 2.65, 6.4]);
    expect(evaluate(duration, duration).position).toEqual([-0.12, 1.04, 0.95]);
    expect(evaluate(0, duration).target).toEqual(PENDULUM_PUSH.initialTarget);
    expect(evaluate(duration, duration).target).toEqual(target);
    expect(evaluate(-1, duration)).toEqual(evaluate(0, duration));
    expect(evaluate(duration + 1, duration)).toEqual(evaluate(duration, duration));
  });
  it('seeks and repeats independently of call order and duration at the same normalized time', () => {
    const middle = evaluate(4);
    evaluate(8); evaluate(0); evaluate(2);
    expect(evaluate(4)).toEqual(middle);
    expect(evaluate(8, 16)).toEqual(middle);
    expect(evaluate(2).position[2]).toBeGreaterThan(middle.position[2]);
    expect(evaluate(6).position[2]).toBeLessThan(middle.position[2]);
  });
  it('eases both ends rather than starting or stopping with an abrupt constant velocity', () => {
    const distance = (a: number, b: number) => new THREE.Vector3(...evaluate(a).position).distanceTo(new THREE.Vector3(...evaluate(b).position));
    expect(distance(0, 0.1)).toBeLessThan(distance(3.9, 4) * 0.01);
    expect(distance(7.9, 8)).toBeLessThan(distance(3.9, 4) * 0.01);
  });
  it('rejects invalid times or unsupported durations', () => {
    expect(() => evaluate(NaN)).toThrow(); expect(() => evaluate(Infinity)).toThrow();
    expect(() => evaluate(1, 0)).toThrow(); expect(() => evaluate(1, 31)).toThrow();
  });
});

describe('Pendulum Push in the actual therapy room', () => {
  it('uses a real suspended pendulum, moves the camera physically and preserves FOV and zoom', () => {
    const room = createTherapyScene();
    try {
      expect(room.scene.getObjectByName('therapy-pendulum')).toBeDefined();
      const bob = room.scene.getObjectByName('therapy-pendulum-bob')!;
      expect(bob).toBeInstanceOf(THREE.Mesh);
      room.update(0, 0.6, 'conversation'); const initial = room.camera.position.clone();
      const quaternion = room.camera.quaternion.clone();
      room.update(0, 0.6, 'divan', shot(0));
      expect(room.camera.position.toArray()).toEqual(initial.toArray());
      expect(room.camera.quaternion.angleTo(quaternion)).toBeLessThan(1e-7);
      for (let t = 0; t <= 8; t += 0.25) {
        room.update(t, 0.6, 'divan', shot(t));
        expect(room.camera.fov).toBe(48); expect(room.camera.zoom).toBe(1);
      }
      expect(room.camera.position.distanceTo(initial)).toBeGreaterThan(5);
      const bobPosition = bob.getWorldPosition(new THREE.Vector3());
      const direction = room.camera.getWorldDirection(new THREE.Vector3());
      const towardBob = bobPosition.clone().sub(room.camera.position).normalize();
      expect(direction.dot(towardBob)).toBeCloseTo(1, 10);
      // The bob is visible at arrival: no chair or table blocks the target ray.
      const ray = new THREE.Raycaster(room.camera.position, towardBob);
      expect(ray.intersectObjects(room.scene.children, true)[0].object.name).toBe(bob.name);
      expect(room.camera.position.distanceTo(bobPosition)).toBeLessThan(0.9);
    } finally { room.dispose(); }
  });
  it('reproduces position and orientation after seek, with object animation independent from the camera', () => {
    const room = createTherapyScene();
    try {
      room.update(4, 0.6, 'conversation', shot(4));
      const position = room.camera.position.toArray(), quaternion = room.camera.quaternion.toArray();
      const pendulum = room.scene.getObjectByName('therapy-pendulum')!;
      const angle = pendulum.rotation.z;
      room.update(4, 0.6, 'divan'); expect(pendulum.rotation.z).toBe(angle);
      room.update(8, 0.6, 'conversation', shot(8));
      expect(pendulum.rotation.z).not.toBe(angle);
      room.update(4, 0.6, 'conversation', shot(4));
      expect(room.camera.position.toArray()).toEqual(position); expect(room.camera.quaternion.toArray()).toEqual(quaternion);
    } finally { room.dispose(); }
  });
  it('keeps a swept camera clearance from the actual furniture, walls and animated meshes', () => {
    const room = createTherapyScene();
    try {
      const meshes: THREE.Mesh[] = [];
      room.scene.traverse(object => { if (object instanceof THREE.Mesh) meshes.push(object); });
      const bounds = new THREE.Box3();
      // Cover all supported durations at both extremes of object movement intensity.
      for (const duration of [2, 8, 30]) for (const intensity of [0, 1]) {
        let previous: THREE.Vector3 | undefined;
        for (let i = 0; i <= 128; i++) {
          const t = i / 128 * duration;
          room.update(t, intensity, 'conversation', shot(t, duration)); room.scene.updateMatrixWorld(true);
          const position = room.camera.position.clone();
          // Inflate by half a sample step as well as physical clearance, covering the segment between samples.
          const sweptMargin = CAMERA_CLEARANCE + (previous ? previous.distanceTo(position) / 2 : 0);
          const center = previous ? position.clone().add(previous).multiplyScalar(0.5) : position;
          for (const mesh of meshes) {
            bounds.setFromObject(mesh).expandByScalar(sweptMargin);
            expect(bounds.containsPoint(center), `Collision near ${t}s, object ${mesh.name || mesh.id}`).toBe(false);
          }
          previous = position;
        }
      }
    } finally { room.dispose(); }
  });
});
