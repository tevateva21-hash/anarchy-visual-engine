import * as THREE from 'three';
import { roomPose, type RoomView } from './roomMotion';
import type { CameraShotState } from '@anarchy/contracts';
import { evaluateCameraPreset, PENDULUM_PUSH } from './cameraPresets';
import { psychedelicLook } from './psychedelicLook';
import { BLOOD_RED, type RoomLighting } from './roomLighting';

/** A single procedural room, not a generic scene engine. All dimensions are in logical metres. */
export function createTherapyScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#12191c');
  scene.fog = new THREE.FogExp2('#192224', 0.035);
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 35);
  const materials: THREE.Material[] = [];
  const material = (color: string, roughness = 0.9, metalness = 0) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
    materials.push(m); return m;
  };
  const wall = material('#48504a'), wood = material('#302923'), trim = material('#70634b');
  const floor = material('#483e31'), leather = material('#522f32'), cushion = material('#704346');
  const bronze = material('#8b7750', 0.5, 0.55), paper = material('#b9ac8d'), ink = material('#252d2c');
  const glass = material('#283a3c', 0.45, 0.3), dark = material('#1c2424');
  const mesh = (geometry: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, x: number, y: number, z: number) => {
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) =>
    mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
  const cylinder = (parent: THREE.Object3D, x: number, y: number, z: number, top: number, bottom: number, height: number, mat: THREE.Material, sides = 8) =>
    mesh(new THREE.CylinderGeometry(top, bottom, height, sides), mat, parent, x, y, z);

  // Open front, a real perspective room with full-height walls and classical wainscoting.
  box(scene, 0, -0.1, 0, 9, 0.2, 7.5, floor);
  for (let x = -4.25; x < 4.5; x += 0.5) {
    box(scene, x, 0.006, 0, 0.012, 0.008, 7.4, wood);
  }
  box(scene, 0, 2.15, -3.7, 9, 4.3, 0.18, wall);
  box(scene, -4.5, 2.15, 0, 0.18, 4.3, 7.5, wall);
  box(scene, 4.5, 2.15, 0, 0.18, 4.3, 7.5, wall);
  box(scene, 0, 0.7, -3.57, 9, 1.4, 0.12, wood);
  box(scene, -4.37, 0.7, 0, 0.12, 1.4, 7.5, wood);
  box(scene, 4.37, 0.7, 0, 0.12, 1.4, 7.5, wood);
  for (const y of [0.14, 1.35, 4.02]) {
    box(scene, 0, y, -3.44, 8.9, 0.06, 0.07, trim);
    box(scene, -4.29, y, 0, 0.07, 0.06, 7.4, trim);
    box(scene, 4.29, y, 0, 0.07, 0.06, 7.4, trim);
  }
  for (let x = -4; x <= 4; x += 0.85) {
    box(scene, x, 0.71, -3.46, 0.025, 1.1, 0.03, trim);
  }
  for (let z = -3.2; z < 3.7; z += 0.85) {
    box(scene, -4.28, 0.71, z, 0.03, 1.1, 0.025, trim);
    box(scene, 4.28, 0.71, z, 0.03, 1.1, 0.025, trim);
  }

  const chair = (x: number, z: number, yaw: number) => {
    const group = new THREE.Group(); scene.add(group); group.position.set(x, 0, z); group.rotation.y = yaw;
    for (const lx of [-0.53, 0.53]) for (const lz of [-0.45, 0.45]) cylinder(group, lx, 0.22, lz, 0.065, 0.04, 0.44, wood, 5);
    box(group, 0, 0.55, 0, 1.35, 0.32, 1.22, leather);
    const seat = box(group, 0, 0.77, 0.06, 1.12, 0.18, 0.92, cushion);
    const back = box(group, 0, 1.3, -0.49, 1.3, 1.2, 0.27, leather); back.rotation.x = -0.13;
    box(group, 0, 1.37, -0.29, 1.08, 0.78, 0.12, cushion);
    for (const side of [-1, 1]) {
      box(group, side * 0.65, 1.03, 0.05, 0.23, 0.55, 1.17, leather);
      const wing = box(group, side * 0.62, 1.6, -0.36, 0.19, 0.64, 0.47, leather); wing.rotation.z = -side * 0.1;
      for (const yy of [1.12, 1.5]) mesh(new THREE.IcosahedronGeometry(0.023, 0), bronze, group, side * 0.34, yy, -0.205);
    }
    return seat;
  };
  const chairSeat = chair(-1.55, -0.1, 0.22);
  chair(1.4, -1.12, -0.4);
  // Therapist's chaise by the left wall, compact and upholstered rather than cartoon furniture.
  const chaise = new THREE.Group(); scene.add(chaise); chaise.position.set(-3.1, 0, -1.9); chaise.rotation.y = Math.PI / 2;
  box(chaise, 0, 0.45, 0, 1.1, 0.2, 2.3, wood);
  box(chaise, 0, 0.65, 0, 1.08, 0.25, 2.25, leather);
  const head = box(chaise, 0, 0.97, -0.95, 1.1, 0.6, 0.2, leather); head.rotation.x = -0.3;
  for (const x of [-0.4, 0.4]) for (const z of [-0.9, 0.9]) cylinder(chaise, x, 0.2, z, 0.055, 0.04, 0.4, wood);

  // Angular hide-like textile, no animal asset. Its silhouette breaks the room's symmetry.
  const hide = new THREE.Shape();
  const outline = [[-1.8, -1.25], [-1.3, -0.7], [-1.6, 0.25], [-2.05, 0.9], [-1.3, 0.72], [-0.8, 1.45], [0.25, 1.25], [1, 1.55], [1.35, 0.65], [1.9, 0.9], [1.5, 0], [1.8, -1.1], [1.08, -0.8], [0.55, -1.4], [-0.55, -1.2], [-1.2, -1.5]];
  outline.forEach(([x, z], i) => i ? hide.lineTo(x, z) : hide.moveTo(x, z)); hide.closePath();
  const rug = mesh(new THREE.ShapeGeometry(hide), material('#786651'), scene, 0, 0.016, 0.4); rug.rotation.x = -Math.PI / 2;
  const stainMaterial = material('#493d31');
  for (let i = 0; i < 13; i++) {
    const mark = cylinder(scene, Math.sin(i * 2.4) * 0.9, 0.023, 0.4 + Math.cos(i * 1.7) * 0.8, 0.1 + i % 3 * 0.04, 0.1, 0.006, stainMaterial, 5);
    mark.scale.z = 1.7;
  }
  // Low tea table, glass objects and a visibly suspended pendulum.
  cylinder(scene, 0, 0.43, 0.25, 0.68, 0.72, 0.1, wood, 10);
  for (let i = 0; i < 3; i++) cylinder(scene, Math.sin(i * 2.094) * 0.42, 0.22, 0.25 + Math.cos(i * 2.094) * 0.42, 0.035, 0.03, 0.44, bronze);
  cylinder(scene, -0.22, 0.56, 0.25, 0.08, 0.06, 0.16, glass);
  box(scene, 0.16, 0.91, 0.25, 0.025, 0.9, 0.025, bronze);
  box(scene, 0.02, 1.35, 0.25, 0.3, 0.025, 0.025, bronze);
  const pendulum = new THREE.Group(); pendulum.name = 'therapy-pendulum'; pendulum.position.set(-0.12, 1.34, 0.25); scene.add(pendulum);
  cylinder(pendulum, 0, -0.24, 0, 0.007, 0.007, 0.48, bronze, 4);
  const pendulumBob = mesh(new THREE.OctahedronGeometry(0.09, 0), bronze, pendulum, 0, -0.52, 0);
  pendulumBob.name = PENDULUM_PUSH.targetObjectName;
  const bobPosition = new THREE.Vector3();
  const book = box(scene, 0.23, 0.51, 0.53, 0.35, 0.055, 0.24, leather); book.rotation.y = 0.3;

  // Framed abstract inkblot: procedural, original, no downloaded texture or lettering.
  const painting = new THREE.Group(); painting.position.set(-0.45, 2.65, -3.42); scene.add(painting);
  box(painting, 0, 0, 0, 1.7, 1.65, 0.09, bronze); box(painting, 0, 0, 0.06, 1.51, 1.46, 0.025, paper);
  for (const sign of [-1, 1]) {
    const blot = new THREE.Shape();
    const points = [[0, -.48], [.18, -.3], [.48, -.42], [.32, -.06], [.59, .17], [.25, .25], [.38, .51], [.08, .36], [0, .5]];
    points.forEach(([x, y], i) => i ? blot.lineTo(sign * x, y) : blot.moveTo(sign * x, y)); blot.closePath();
    mesh(new THREE.ShapeGeometry(blot), ink, painting, 0, 0, 0.08);
  }
  // Wall clock with explicit-time hand, no real-world clock dependency.
  const clock = cylinder(scene, 2.45, 3.1, -3.45, 0.33, 0.33, 0.09, bronze, 12); clock.rotation.x = Math.PI / 2;
  const clockFace = cylinder(scene, 2.45, 3.1, -3.38, 0.28, 0.28, 0.015, paper, 12); clockFace.rotation.x = Math.PI / 2;
  const clockHand = new THREE.Group(); clockHand.position.set(2.45, 3.1, -3.35); scene.add(clockHand);
  box(clockHand, 0, 0.1, 0, 0.018, 0.22, 0.02, ink);

  // Bookshelf, aligned muted spines; each mesh is built once.
  const shelf = new THREE.Group(); shelf.position.set(3.25, 0, -3.06); scene.add(shelf);
  for (const x of [-0.66, 0.66]) box(shelf, x, 1.25, 0, 0.08, 2.5, 0.55, wood);
  const bookMats = ['#525745', '#674b42', '#6b6658', '#3b4e52'].map(c => material(c));
  for (let row = 0; row < 4; row++) {
    const y = 0.25 + row * 0.56;
    box(shelf, 0, y, 0, 1.4, 0.065, 0.6, wood);
    for (let i = 0; i < 8; i++) {
      const h = 0.32 + (i * 3 + row) % 4 * 0.035;
      const spine = box(shelf, -0.52 + i * 0.145, y + h / 2 + 0.04, 0.02, 0.1, h, 0.35, bookMats[(i + row) % 4]);
      spine.rotation.z = i === 5 ? 0.09 : 0;
    }
  }
  // Two low-poly lamps: dim pools of light, no neon or full-screen flashing.
  const shadeMat = material('#b8a981', 1);
  const lamp = (x: number, z: number) => {
    cylinder(scene, x, 0.055, z, 0.28, 0.33, 0.11, bronze);
    cylinder(scene, x, 1.08, z, 0.028, 0.035, 2.1, bronze);
    const shade = cylinder(scene, x, 2.06, z, 0.27, 0.5, 0.48, shadeMat, 8);
    shade.castShadow = false;
    const light = new THREE.PointLight('#e3b778', 16, 8, 2); light.position.set(x, 1.87, z); scene.add(light);
    return light;
  };
  const warmLamp = lamp(-3.4, 0.7); const rearLamp = lamp(2.4, -2.7);
  const fill = new THREE.HemisphereLight('#a9b9c0', '#292320', 1.2); scene.add(fill);
  const key = new THREE.SpotLight('#d5ba91', 45, 16, Math.PI / 3, 0.8, 1.8);
  key.position.set(-1.8, 4, 2.5); key.target.position.set(0, 0, -0.5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0006; scene.add(key, key.target);
  const cold = new THREE.DirectionalLight('#849caa', 1.2); cold.position.set(4, 4, -2); scene.add(cold);

  const amber = new THREE.Color('#e3b778'), mauve = new THREE.Color('#b39ab4');
  const olive = new THREE.Color('#90a38a'), keyBase = new THREE.Color('#d5ba91');
  const keyTint = new THREE.Color('#b2a0c1'), coldBase = new THREE.Color('#849caa');
  const coldTint = new THREE.Color('#749e9f');
  const update = (time: number, intensity: number, view: RoomView, shot?: CameraShotState, psychedelia = 0, lighting: RoomLighting = 'classic') => {
    if (lighting !== 'classic' && lighting !== 'blood-red') throw new Error('Ambiance inconnue.');
    const red = lighting === 'blood-red';
    const effectivePsychedelia = red ? 0 : psychedelia;
    const pose = roomPose(time, intensity, view, effectivePsychedelia);
    const look = psychedelicLook(time, effectivePsychedelia, intensity);
    camera.position.set(...pose.camera); camera.lookAt(0, 1.4, -0.9);
    chairSeat.scale.y = pose.chairBreath;
    pendulum.rotation.z = pose.pendulumAngle;
    book.position.y = 0.51 + pose.bookLift;
    painting.rotation.z = pose.paintingTilt;
    warmLamp.intensity = pose.lampIntensity;
    clockHand.rotation.z = pose.clockAngle;
    warmLamp.color.lerpColors(amber, mauve, psychedelia * (0.5 + 0.15 * look.drift));
    rearLamp.color.lerpColors(amber, olive, psychedelia * (0.65 - 0.1 * look.drift));
    key.color.lerpColors(keyBase, keyTint, psychedelia * 0.65);
    cold.color.lerpColors(coldBase, coldTint, psychedelia * 0.8);
    fill.intensity = look.fillIntensity;
    // Restore every altered property on each evaluation, including when returning to classic.
    if (scene.background instanceof THREE.Color) scene.background.set(red ? '#12050a' : '#12191c');
    scene.fog!.color.set(red ? '#260910' : '#192224');
    wall.color.set(red ? BLOOD_RED.wall : '#48504a');
    leather.color.set(red ? BLOOD_RED.leather : '#522f32');
    cushion.color.set(red ? BLOOD_RED.cushion : '#704346');
    floor.color.set(red ? BLOOD_RED.floor : '#483e31');
    wood.color.set(red ? BLOOD_RED.wood : '#302923');
    shadeMat.color.set(red ? BLOOD_RED.shade : '#b8a981');
    floor.roughness = red ? 0.7 : 0.9; floor.metalness = red ? 0.08 : 0;
    fill.color.set(red ? BLOOD_RED.fill : '#a9b9c0');
    fill.groundColor.set(red ? BLOOD_RED.ground : '#292320');
    key.intensity = red ? 52 : 45; cold.intensity = red ? 0.8 : 1.2;
    rearLamp.intensity = red ? 25 : 16;
    if (red) {
      warmLamp.color.set(BLOOD_RED.lamp); warmLamp.intensity = pose.lampIntensity * 1.4;
      rearLamp.color.set(BLOOD_RED.rearLamp); key.color.set(BLOOD_RED.key);
      cold.color.set(BLOOD_RED.rim); fill.intensity = 0.8;
    }
    if (shot) {
      if (shot.presetId !== PENDULUM_PUSH.id) throw new Error('Preset caméra inconnu.');
      // The bob animates from scene time, independently of camera duration or position.
      pendulumBob.getWorldPosition(bobPosition);
      const cameraPose = evaluateCameraPreset(PENDULUM_PUSH, shot.timeSeconds, shot.durationSeconds, [bobPosition.x, bobPosition.y, bobPosition.z]);
      camera.position.set(...cameraPose.position);
      camera.lookAt(...cameraPose.target);
    }
  };
  update(0, 0.5, 'conversation');
  const dispose = () => {
    const geometries = new Set<THREE.BufferGeometry>();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) geometries.add(object.geometry);
      if (object instanceof THREE.Light && 'shadow' in object) (object as THREE.SpotLight).shadow?.map?.dispose();
    });
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); scene.clear();
  };
  return { scene, camera, update, dispose };
}
