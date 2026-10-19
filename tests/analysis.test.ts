import { describe, expect, it } from 'vitest';
import { analyzePCM, createAudioFeatureAccessor, getAudioFeaturesAt, HOP, isAudioAnalysis, LIMITS, SAMPLE_RATE, validateDuration, validateFileSize } from '../packages/audio-analysis/src/index';
const tone = (hz: number, amplitude = 1, seconds = 1) => Float32Array.from({ length: SAMPLE_RATE * seconds }, (_, i) => amplitude * Math.sin(2 * Math.PI * hz * i / SAMPLE_RATE));
const analyze = (...channels: Float32Array[]) => analyzePCM({ channels, sampleRateHz: SAMPLE_RATE, assetSha256: 'test' });
const average = (values: Float32Array) => {
  const interior = values.slice(4, -4);
  return interior.reduce((sum, x) => sum + x, 0) / interior.length;
};
describe('offline audio features', () => {
  it('silence is finite zero across every feature', () => {
    const a = analyze(new Float32Array(SAMPLE_RATE));
    for (const key of ['rms', 'bass', 'mid', 'treble', 'spectralFlux', 'waveformMin', 'waveformMax'] as const) expect([...a[key]].every(v => v === 0)).toBe(true);
    expect(a.timestamps[0]).toBe(0);
    expect(a.timestamps[1]).toBe(HOP / SAMPLE_RATE);
    expect(a.durationSeconds).toBe(1);
  });
  it('RMS has the expected physical amplitude for a sinusoid', () => {
    expect(average(analyze(tone(1000, 0.5)).rms)).toBeCloseTo(0.5 / Math.sqrt(2), 3);
  });
  it.each([[100, 'bass'], [1000, 'mid'], [6000, 'treble']] as const)('places %i Hz energy in %s', (hz, band) => {
    const a = analyze(tone(hz));
    expect(average(a[band])).toBeCloseTo(0.5, 2);
    for (const other of ['bass', 'mid', 'treble'] as const) if (other !== band) expect(average(a[other])).toBeLessThan(0.0001);
  });
  it('power scales quadratically and RMS linearly', () => {
    const full = analyze(tone(1000)), half = analyze(tone(1000, 0.5));
    expect(average(half.mid) / average(full.mid)).toBeCloseTo(0.25, 5);
    expect(average(half.rms) / average(full.rms)).toBeCloseTo(0.5, 5);
  });
  it('does not cancel antiphase stereo channels', () => {
    const left = tone(1000), right = left.map(v => -v);
    const mono = analyze(left), stereo = analyze(left, right);
    expect(stereo.rms).toEqual(mono.rms); expect(stereo.mid).toEqual(mono.mid);
  });
  it('detects an impulse near its actual timestamp and has no invented initial flux', () => {
    const pcm = new Float32Array(SAMPLE_RATE); pcm[SAMPLE_RATE / 2] = 1;
    const a = analyze(pcm), max = Math.max(...a.spectralFlux), peak = a.spectralFlux.indexOf(max);
    expect(max).toBeGreaterThan(0);
    expect(Math.abs(a.timestamps[peak] - 0.5)).toBeLessThan(2048 / SAMPLE_RATE);
    expect(a.spectralFlux[0]).toBe(0);
    expect(Math.max(...a.waveformMax)).toBe(1);
  });
  it('constant sinusoid has negligible interior flux', () => {
    expect(average(analyze(tone(1000)).spectralFlux)).toBeLessThan(0.00001);
  });
  it('is exactly reproducible for identical PCM and leaves its inputs unchanged', () => {
    const pcm = tone(733, 0.7), copy = pcm.slice();
    const first = analyze(pcm), second = analyze(pcm);
    expect(first).toEqual(second); expect(pcm).toEqual(copy);
  });
  it('interpolates linearly, clamps edges and supports single-frame tracks', () => {
    const a = analyze(tone(1000));
    a.rms[0] = 0; a.rms[1] = 1;
    const accessor = createAudioFeatureAccessor(a);
    expect(accessor.getAudioFeaturesAt(HOP / SAMPLE_RATE / 2).rms).toBeCloseTo(0.5);
    expect(getAudioFeaturesAt(a, -100).rms).toBe(0);
    expect(getAudioFeaturesAt(a, 100).rms).toBe(a.rms.at(-1));
    expect(getAudioFeaturesAt(analyze(new Float32Array([1])), 0).rms).toBe(1);
    expect(() => accessor.getAudioFeaturesAt(NaN)).toThrow('non fini');
    expect(() => accessor.getAudioFeaturesAt(Infinity)).toThrow('non fini');
  });
  it('rejects empty, non-finite, mismatched or unsupported PCM', () => {
    expect(() => analyze(new Float32Array())).toThrow('Durée');
    expect(() => analyze(new Float32Array([NaN]))).toThrow('non finie');
    expect(() => analyze(tone(100), new Float32Array([0]))).toThrow('longueur');
    expect(() => analyzePCM({ channels: [tone(100)], sampleRateHz: 48000, assetSha256: 'x' })).toThrow('24 kHz');
  });
  it('accepts the limits exactly and rejects excess or unknown duration', () => {
    expect(() => validateFileSize(LIMITS.bytes)).not.toThrow();
    expect(() => validateFileSize(LIMITS.bytes + 1)).toThrow('volumineux');
    expect(() => validateDuration(LIMITS.seconds)).not.toThrow();
    expect(() => validateDuration(LIMITS.seconds + 0.01)).toThrow('long');
    expect(() => validateDuration(Infinity)).toThrow('invalide');
  });
  it('validates persisted metadata and all feature arrays', () => {
    const a = analyze(tone(100));
    expect(isAudioAnalysis(a, 'test')).toBe(true);
    expect(isAudioAnalysis(a, 'different')).toBe(false);
    expect(isAudioAnalysis({ ...a, analyzerVersion: 'old' }, 'test')).toBe(false);
    expect(isAudioAnalysis({ ...a, mid: new Float32Array([1]) }, 'test')).toBe(false);
    a.rms[0] = NaN; expect(isAudioAnalysis(a, 'test')).toBe(false);
  });
});
