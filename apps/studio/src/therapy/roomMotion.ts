export type RoomView = 'conversation' | 'divan';
export const ROOM_DURATION = 30;

/** Absolute-time poses for this prototype; no dependency on audio, RAF deltas or randomness. */
export function roomPose(timeSeconds: number, intensity: number, view: RoomView, psychedelia = 0) {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0 || timeSeconds > ROOM_DURATION ||
      !Number.isFinite(intensity) || intensity < 0 || intensity > 1 || !['conversation', 'divan'].includes(view)) {
    throw new Error('Paramètres de la pièce invalides.');
  }
  if (!Number.isFinite(psychedelia) || psychedelia < 0 || psychedelia > 1) throw new Error('Psychédélisme invalide.');
  const drive = psychedelia * intensity;
  const t = timeSeconds;
  const camera = view === 'conversation' ? [0.6, 2.65, 6.4] : [3.8, 2.05, 4.3];
  return {
    camera: [camera[0] + Math.sin(t * 0.18) * 0.24 * intensity, camera[1] + Math.sin(t * 0.31) * 0.035 * intensity, camera[2]] as const,
    chairBreath: 1 + Math.sin(t * 0.7) * (0.012 + 0.012 * drive) * intensity,
    pendulumAngle: Math.sin(t * (0.85 + 1.8 * drive)) * (0.14 + 0.05 * drive) * intensity,
    bookLift: (1 + Math.sin(t * 0.5)) * (0.025 + 0.015 * drive) * intensity,
    paintingTilt: Math.sin(t * 0.28) * (0.008 + 0.012 * drive) * intensity,
    lampIntensity: 16 + (Math.sin(t * 0.6) + Math.sin(t * 1.13) * 0.2) * 1.5 * intensity,
    clockAngle: -t * Math.PI / 30 * intensity * (1 + 8 * drive),
  };
}
