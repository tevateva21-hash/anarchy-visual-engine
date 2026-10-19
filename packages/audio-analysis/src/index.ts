import type { AudioAnalysis, AudioFeatures, AnalysisRequest } from '@anarchy/contracts';
export const ANALYZER_VERSION = '1.0.0';
export const SAMPLE_RATE = 24000;
export const WINDOW = 2048;
export const HOP = 512;
export const LIMITS = { bytes: 50 * 1024 * 1024, seconds: 300, pcmBytes: 64 * 1024 * 1024 } as const;
export const FEATURE_KEYS = ['rms', 'bass', 'mid', 'treble', 'spectralFlux'] as const;

export function validateFileSize(bytes: number): void {
  if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error('Le fichier est vide.');
  if (bytes > LIMITS.bytes) throw new Error('Fichier trop volumineux : maximum 50 Mio.');
}
export function validateDuration(seconds: number): void {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Durée audio invalide.');
  if (seconds > LIMITS.seconds) throw new Error('Morceau trop long : maximum 5 minutes.');
}

/** In-place radix-2 FFT; fixed order, no random state or wall clock. */
function fft(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) [real[i], real[j]] = [real[j], real[i]];
  }
  for (let size = 2; size <= n; size *= 2) {
    const angle = -2 * Math.PI / size;
    const c = Math.cos(angle), s = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let wr = 1, wi = 0;
      for (let j = 0; j < size / 2; j++) {
        const a = start + j, b = a + size / 2;
        const tr = wr * real[b] - wi * imag[b], ti = wr * imag[b] + wi * real[b];
        real[b] = real[a] - tr; imag[b] = imag[a] - ti;
        real[a] += tr; imag[a] += ti;
        const next = wr * c - wi * s;
        wi = wr * s + wi * c; wr = next;
      }
    }
  }
}

export function analyzePCM(request: AnalysisRequest, progress?: (fraction: number) => void): AudioAnalysis {
  const { channels, sampleRateHz, assetSha256 } = request;
  if (sampleRateHz !== SAMPLE_RATE) throw new Error('Le PCM doit être décodé à 24 kHz.');
  const length = channels[0]?.length ?? 0;
  if (channels.length < 1 || channels.length > 2 || channels.some(c => c.length !== length)) {
    throw new Error('Audio mono ou stéréo requis, canaux de même longueur.');
  }
  validateDuration(length / sampleRateHz);
  if (length * channels.length * 4 > LIMITS.pcmBytes) throw new Error('PCM trop volumineux.');
  for (const channel of channels) for (const value of channel) {
    if (!Number.isFinite(value)) throw new Error('Le PCM contient une valeur non finie.');
  }
  const count = Math.ceil(length / HOP);
  const result: AudioAnalysis = {
    schemaVersion: 1, analyzerVersion: ANALYZER_VERSION, assetSha256,
    sampleRateHz, sampleCount: length, channelCount: channels.length,
    durationSeconds: length / sampleRateHz, windowSamples: WINDOW, hopSamples: HOP,
    channelAggregation: 'mean-power', bandEdgesHz: [20, 250, 2000, 12000],
    timestamps: new Float64Array(count), rms: new Float32Array(count),
    bass: new Float32Array(count), mid: new Float32Array(count), treble: new Float32Array(count),
    spectralFlux: new Float32Array(count), waveformMin: new Float32Array(count), waveformMax: new Float32Array(count),
  };
  const window = Float64Array.from({ length: WINDOW }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (WINDOW - 1)));
  const windowPower = window.reduce((sum, x) => sum + x * x, 0);
  const real = new Float64Array(WINDOW), imag = new Float64Array(WINDOW);
  const previous = new Float64Array(WINDOW / 2 + 1), power = new Float64Array(previous.length);
  for (let frame = 0; frame < count; frame++) {
    const center = frame * HOP, start = center - WINDOW / 2;
    let sumSquares = 0, samples = 0, min = Infinity, max = -Infinity;
    power.fill(0);
    for (const channel of channels) {
      imag.fill(0);
      for (let i = 0; i < WINDOW; i++) {
        const index = start + i;
        const sample = index >= 0 && index < length ? channel[index] : 0;
        real[i] = sample * window[i];
        if (index >= 0 && index < length) {
          sumSquares += sample * sample; samples++;
          min = Math.min(min, sample); max = Math.max(max, sample);
        }
      }
      fft(real, imag);
      for (let bin = 0; bin < power.length; bin++) {
        const factor = bin === 0 || bin === WINDOW / 2 ? 1 : 2;
        power[bin] += factor * (real[bin] ** 2 + imag[bin] ** 2) / (WINDOW * windowPower * channels.length);
      }
    }
    let bass = 0, mid = 0, treble = 0, flux = 0;
    for (let bin = 0; bin < power.length; bin++) {
      const hz = bin * sampleRateHz / WINDOW;
      if (hz >= 20 && hz < 250) bass += power[bin];
      else if (hz >= 250 && hz < 2000) mid += power[bin];
      else if (hz >= 2000 && hz <= 12000) treble += power[bin];
      // Positive difference of one-sided spectral POWER; first frame has no predecessor.
      if (frame > 0) flux += Math.max(0, power[bin] - previous[bin]);
    }
    previous.set(power);
    result.timestamps[frame] = center / sampleRateHz;
    result.rms[frame] = Math.sqrt(sumSquares / samples);
    result.bass[frame] = bass; result.mid[frame] = mid; result.treble[frame] = treble;
    result.spectralFlux[frame] = flux;
    result.waveformMin[frame] = min; result.waveformMax[frame] = max;
    if (frame % 64 === 0) progress?.(frame / count);
  }
  progress?.(1);
  return result;
}

/** Linear interpolation on source timestamps. Clamp finite times to edge frames; reject NaN/Infinity. */
export function getAudioFeaturesAt(analysis: AudioAnalysis, timeSeconds: number): AudioFeatures {
  if (!Number.isFinite(timeSeconds)) throw new Error('Temps non fini.');
  const n = analysis.timestamps.length;
  if (!n) throw new Error('Analyse vide.');
  let low = 0, high = n - 1;
  const t = Math.max(analysis.timestamps[0], Math.min(timeSeconds, analysis.timestamps[high]));
  while (low + 1 < high) {
    const mid = (low + high) >> 1;
    if (analysis.timestamps[mid] <= t) low = mid; else high = mid;
  }
  const span = analysis.timestamps[high] - analysis.timestamps[low];
  const ratio = span === 0 ? 0 : (t - analysis.timestamps[low]) / span;
  return Object.fromEntries(FEATURE_KEYS.map(key => [key, analysis[key][low] * (1 - ratio) + analysis[key][high] * ratio])) as unknown as AudioFeatures;
}
/** Convenient accessor with exactly getAudioFeaturesAt(timeSeconds) for a fixed track. */
export function createAudioFeatureAccessor(analysis: AudioAnalysis) {
  return { getAudioFeaturesAt: (timeSeconds: number) => getAudioFeaturesAt(analysis, timeSeconds) };
}

/** Cache is untrusted persistent input: validate lengths, metadata, duration bounds and finite values. */
export function isAudioAnalysis(value: unknown, hash: string): value is AudioAnalysis {
  if (!value || typeof value !== 'object') return false;
  const a = value as AudioAnalysis;
  if (a.schemaVersion !== 1 || a.analyzerVersion !== ANALYZER_VERSION || a.assetSha256 !== hash ||
      a.sampleRateHz !== SAMPLE_RATE || !Number.isSafeInteger(a.sampleCount) || a.sampleCount <= 0 ||
      a.sampleCount > SAMPLE_RATE * LIMITS.seconds || a.durationSeconds !== a.sampleCount / SAMPLE_RATE ||
      ![1, 2].includes(a.channelCount) || a.windowSamples !== WINDOW || a.hopSamples !== HOP ||
      a.channelAggregation !== 'mean-power' || JSON.stringify(a.bandEdgesHz) !== '[20,250,2000,12000]') return false;
  const count = Math.ceil(a.sampleCount / HOP);
  if (!(a.timestamps instanceof Float64Array) || a.timestamps.length !== count ||
      a.timestamps.some((t, i) => t !== i * HOP / SAMPLE_RATE)) return false;
  for (const key of [...FEATURE_KEYS, 'waveformMin', 'waveformMax'] as const) {
    if (!(a[key] instanceof Float32Array) || a[key].length !== count ||
        a[key].some(v => !Number.isFinite(v) || (FEATURE_KEYS.includes(key as typeof FEATURE_KEYS[number]) && v < 0))) return false;
  }
  return true;
}
