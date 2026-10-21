/** Local M1 camera study. No audio mapping or general-purpose scene engine. */
export interface StudyMotion {
  cameraIntensity?: number;
  accentEnabled?: boolean;
}

export function studyCameraOffset(frame: number, intensity: number, depth: number, accentEnabled = false) {
  if (!Number.isInteger(frame) || frame < 0 || !Number.isFinite(intensity) || intensity < 0 || intensity > 1 ||
      !Number.isFinite(depth) || depth < 0 || depth > 1) throw new Error('Mouvement caméra invalide.');
  const t = frame / 12;
  const sinceAccent = t - 6;
  const accent = accentEnabled && sinceAccent >= 0 && sinceAccent < 1
    ? Math.sin(sinceAccent * 18) * Math.exp(-sinceAccent * 5) : 0;
  // Traveling + sway + quantized micro-jitter. Far layers barely move; foreground moves most.
  const x = (8 * Math.sin(t * 0.18) + 1.2 * Math.sin(t * 0.85) + 0.3 * Math.sin(t * 7.1) + accent * 2) * intensity * depth;
  const y = (1.4 * Math.sin(t * 0.7) + 0.25 * Math.sin(t * 5.3) + accent) * intensity * depth;
  return { x: Math.round(x) || 0, y: Math.round(y) || 0 };
}
