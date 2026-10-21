/** Future preset design contracts. Runtime validation/constraints/serialization arrive in M4. */
export type SceneId = 'industrial-city' | 'ps1-nightmare' | 'rave-dungeon' | 'digital-void';
export type RenderStyle = 'pixel-16' | 'lowpoly-32';
export type PaletteId = 'furnace-amber' | 'toxic-oxide' | 'cold-concrete';
export type RetroRenderSettings =
  | {
      style: 'pixel-16';
      logicalSize: { width: number; height: number };
      sampling: 'nearest';
      camera: { kind: 'orthographic'; x: number; y: number; zoom: number };
    }
  | {
      style: 'lowpoly-32';
      logicalSize: { width: number; height: number };
      sampling: 'nearest';
      camera: { kind: 'perspective'; yawDegrees: number; pitchDegrees: number; distance: number; fovDegrees: number };
    };
export interface RetroEffects {
  dither: number;
  fog: number;
  grain: number;
  vertexSnap: boolean;
  affineTextures: boolean;
}
export type PresetParameterPath =
  | 'sceneId' | 'paletteId' | 'intensity' | 'seed' | 'render.style'
  | 'render.logicalSize.width' | 'render.logicalSize.height'
  | 'render.camera.x' | 'render.camera.y' | 'render.camera.zoom'
  | 'render.camera.yawDegrees' | 'render.camera.pitchDegrees' | 'render.camera.distance' | 'render.camera.fovDegrees'
  | `effects.${keyof RetroEffects}`;
export interface RetroPresetConfig {
  schemaVersion: 1;
  presetId: string;
  presetVersion: string;
  engineVersion: string;
  sceneId: SceneId;
  paletteId: PaletteId;
  /** Future runtime validator must enforce uint32. Seed alone is not a complete snapshot. */
  seed: number;
  /** Future validator: finite, [0, 1]; same bounds for numeric effects. */
  intensity: number;
  render: RetroRenderSettings;
  effects: RetroEffects;
  locks: Partial<Record<PresetParameterPath, boolean>>;
}
export type CompatibilityRule =
  | { id: string; kind: 'scene-style'; sceneId: SceneId; allowedStyles: readonly RenderStyle[]; reason: string }
  | { id: string; kind: 'effect-style'; effect: 'vertexSnap' | 'affineTextures'; allowedStyles: readonly RenderStyle[]; reason: string };
export interface RetroPresetDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  defaults: RetroPresetConfig;
  compatibility: readonly CompatibilityRule[];
}
/** Future randomizer input only; no PRNG or lock resolution is implemented in M1. */
export interface RandomizeRequest {
  randomizerVersion: string;
  seed: number;
  current: RetroPresetConfig;
}
