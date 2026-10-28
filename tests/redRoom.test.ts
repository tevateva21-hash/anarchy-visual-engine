import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createTherapyScene } from '../apps/studio/src/therapy/therapyScene';

describe('blood-red art direction', () => {
  it('uses red lights and reflective floor properties without changing geometry or camera', () => {
    const room = createTherapyScene();
    try {
      room.update(8, 0.6, 'conversation');
      const count = room.scene.children.length, position = room.camera.position.toArray();
      room.update(8, 0.6, 'conversation', undefined, 1, 'blood-red');
      expect(room.scene.children.length).toBe(count);
      expect(room.camera.position.toArray()).toEqual(position);
      expect(room.camera.fov).toBe(48); expect(room.camera.zoom).toBe(1);
      const lamps: THREE.PointLight[] = [];
      room.scene.traverse(object => { if (object instanceof THREE.PointLight) lamps.push(object); });
      expect(lamps).toHaveLength(2);
      for (const lamp of lamps) expect(lamp.color.r).toBeGreaterThan(Math.max(lamp.color.g, lamp.color.b) * 4);
    } finally { room.dispose(); }
  });
  it('restores all colors, materials, lights, background and fog after switching to classic', () => {
    const room = createTherapyScene();
    const snapshot = () => {
      const values: unknown[] = [(room.scene.background as THREE.Color).toArray(), room.scene.fog!.color.toArray()];
      room.scene.updateMatrixWorld(true);
      room.scene.traverse(object => {
        if (object instanceof THREE.Light) values.push([object.color.toArray(), object.intensity]);
        if (object instanceof THREE.HemisphereLight) values.push(object.groundColor.toArray());
        if (object instanceof THREE.Mesh) {
          const m = object.material as THREE.MeshStandardMaterial;
          values.push([object.matrixWorld.elements.slice(), m.color.toArray(), m.roughness, m.metalness]);
        }
      });
      return values;
    };
    try {
      room.update(8, 0.6, 'conversation', undefined, 0.8, 'classic'); const classic = snapshot();
      room.update(8, 0.6, 'conversation', undefined, 0.8, 'blood-red'); const red = snapshot();
      expect(red).not.toEqual(classic);
      room.update(8, 0.6, 'conversation', undefined, 0.8, 'classic'); expect(snapshot()).toEqual(classic);
      room.update(8, 0.6, 'conversation', undefined, 0, 'blood-red'); expect(snapshot()).toEqual(red);
      room.update(20, 1, 'divan', undefined, 0, 'blood-red');
      room.update(8, 0.6, 'conversation', undefined, 0, 'blood-red'); expect(snapshot()).toEqual(red);
    } finally { room.dispose(); }
  });
});
