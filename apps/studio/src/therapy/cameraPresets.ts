import type { CameraPresetDefinition, CameraShotPose, CameraVector } from '@anarchy/contracts';

export const CAMERA_CLEARANCE = 0.16;
export const PENDULUM_PUSH: CameraPresetDefinition = {
  id: 'pendulum-push', version: 1, name: 'Pendulum Push', defaultDurationSeconds: 8,
  durationRangeSeconds: [2, 30], easing: 'smootherstep',
  positionPath: [[0.6, 2.65, 6.4], [0.6, 2.65, 4.7], [-0.12, 1.45, 2.1], [-0.12, 1.04, 0.95]],
  initialTarget: [0, 1.4, -0.9], targetObjectName: 'therapy-pendulum-bob',
};

/** Evaluate from absolute time. Clamped edges, C2 easing; no accumulated deltas or camera history. */
export function evaluateCameraPreset(
  preset: CameraPresetDefinition, timeSeconds: number, durationSeconds: number, objectTarget: CameraVector,
): CameraShotPose {
  const [min, max] = preset.durationRangeSeconds;
  if (!Number.isFinite(timeSeconds) || !Number.isFinite(durationSeconds) || durationSeconds < min || durationSeconds > max ||
      !objectTarget.every(Number.isFinite) || preset.easing !== 'smootherstep' ||
      !preset.positionPath.flat().every(Number.isFinite) || !preset.initialTarget.every(Number.isFinite)) {
    throw new Error('Paramètres de travelling invalides.');
  }
  const u = Math.max(0, Math.min(1, timeSeconds / durationSeconds));
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  const v = 1 - e;
  const [a, b, c, d] = preset.positionPath;
  const coordinate = (axis: 0 | 1 | 2) => v ** 3 * a[axis] + 3 * v * v * e * b[axis] + 3 * v * e * e * c[axis] + e ** 3 * d[axis];
  const target = (axis: 0 | 1 | 2) => preset.initialTarget[axis] * v + objectTarget[axis] * e;
  return { position: [coordinate(0), coordinate(1), coordinate(2)], target: [target(0), target(1), target(2)], progress: u };
}
