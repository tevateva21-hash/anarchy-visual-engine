/** Serializable camera-shot contracts; independent of React and Three.js. */
export type CameraVector = readonly [x: number, y: number, z: number];
export interface CameraPresetDefinition {
  id: string;
  version: number;
  name: string;
  defaultDurationSeconds: number;
  durationRangeSeconds: readonly [min: number, max: number];
  /** Cubic Bezier control points, in scene coordinates. No FOV or zoom animation. */
  positionPath: readonly [CameraVector, CameraVector, CameraVector, CameraVector];
  initialTarget: CameraVector;
  targetObjectName: string;
  easing: 'smootherstep';
}
export interface CameraShotState {
  presetId: string;
  timeSeconds: number;
  durationSeconds: number;
}
export interface CameraShotPose {
  position: CameraVector;
  target: CameraVector;
  progress: number;
}
