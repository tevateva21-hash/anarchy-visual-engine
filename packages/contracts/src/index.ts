/** Versioned, structured-cloneable data: no React, Canvas or audio nodes. */
export interface AudioFeatures {
  rms: number;
  bass: number;
  mid: number;
  treble: number;
  spectralFlux: number;
}
export interface AudioAnalysis {
  schemaVersion: 1;
  analyzerVersion: string;
  assetSha256: string;
  sampleRateHz: number;
  sampleCount: number;
  channelCount: number;
  durationSeconds: number;
  windowSamples: number;
  hopSamples: number;
  channelAggregation: 'mean-power';
  bandEdgesHz: readonly [20, 250, 2000, 12000];
  timestamps: Float64Array;
  rms: Float32Array;
  bass: Float32Array;
  mid: Float32Array;
  treble: Float32Array;
  spectralFlux: Float32Array;
  waveformMin: Float32Array;
  waveformMax: Float32Array;
}
export interface AnalysisRequest {
  channels: Float32Array[];
  sampleRateHz: number;
  assetSha256: string;
}
export type AnalysisResponse =
  | { type: 'progress'; fraction: number }
  | { type: 'complete'; analysis: AudioAnalysis }
  | { type: 'error'; message: string };

export type {
  SceneId, RenderStyle, PaletteId, RetroRenderSettings, RetroEffects,
  PresetParameterPath, RetroPresetConfig, CompatibilityRule,
  RetroPresetDefinition, RandomizeRequest,
} from './presets';

export type { CameraVector, CameraPresetDefinition, CameraShotState, CameraShotPose } from './camera';
