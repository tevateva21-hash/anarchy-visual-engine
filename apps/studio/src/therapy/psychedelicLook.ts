/** Bounded absolute-time look parameters. Strength zero recovers the original room. */
export function psychedelicLook(time: number, strength: number, motion: number) {
  if (!Number.isFinite(time) || time < 0 || time > 30 ||
      !Number.isFinite(strength) || strength < 0 || strength > 1 ||
      !Number.isFinite(motion) || motion < 0 || motion > 1) throw new Error('Traitement psychédélique invalide.');
  return {
    strength,
    phase: time * motion,
    warp: 0.002 * strength * motion,
    chroma: 0.0015 * strength,
    glow: 0.18 * strength,
    contrast: 1 + 0.1 * strength,
    drift: Math.sin(time * motion * 0.24) * strength * motion,
    fillIntensity: 1.2 * (1 - 0.3 * strength),
  };
}
