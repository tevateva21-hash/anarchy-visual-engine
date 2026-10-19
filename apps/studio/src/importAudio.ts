import { LIMITS, SAMPLE_RATE, validateDuration, validateFileSize } from '@anarchy/audio-analysis';
import type { AudioAnalysis, AnalysisResponse } from '@anarchy/contracts';
import { readAnalysis, writeAnalysis } from './cache';

export type ImportResult = { analysis: AudioAnalysis; cached: boolean; cacheWarning?: string };
const abortError = () => new DOMException('Import annulé.', 'AbortError');
function checkAbort(signal: AbortSignal) { if (signal.aborted) throw abortError(); }

/** Validate signatures; WAV channel count is checked before Web Audio allocates PCM. */
export function validateAudioHeader(bytes: ArrayBuffer): void {
  const b = new Uint8Array(bytes), view = new DataView(bytes);
  const text = (start: number, length: number) => String.fromCharCode(...b.subarray(start, start + length));
  if (text(0, 4) === 'RIFF' && text(8, 4) === 'WAVE') {
    for (let offset = 12; offset + 8 <= b.length;) {
      const size = view.getUint32(offset + 4, true);
      if (offset + 8 + size > b.length) throw new Error('Fichier WAV tronqué.');
      if (text(offset, 4) === 'fmt ') {
        if (size < 16) throw new Error('En-tête WAV invalide.');
        const format = view.getUint16(offset + 8, true), channels = view.getUint16(offset + 10, true);
        if (![1, 3].includes(format) || ![1, 2].includes(channels)) {
          throw new Error('WAV PCM/float mono ou stéréo requis.');
        }
        const rate = view.getUint32(offset + 12, true);
        if (rate < 8000 || rate > 192000) throw new Error('Fréquence WAV non prise en charge (8–192 kHz).');
        return;
      }
      offset += 8 + size + (size % 2);
    }
    throw new Error('En-tête WAV manquant.');
  }
  if (text(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return;
  throw new Error('Format non pris en charge : choisissez un MP3 ou WAV valide.');
}
function probeDuration(file: File, signal: AbortSignal): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(), url = URL.createObjectURL(file);
    const cleanup = () => {
      clearTimeout(timer); signal.removeEventListener('abort', onAbort);
      audio.onloadedmetadata = null; audio.onerror = null;
      audio.removeAttribute('src'); audio.load(); URL.revokeObjectURL(url);
    };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const onAbort = () => fail(abortError());
    const timer = setTimeout(() => fail(new Error('Lecture des métadonnées trop lente ou fichier invalide.')), 15000);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => { const duration = audio.duration; cleanup(); resolve(duration); };
    audio.onerror = () => fail(new Error('Ce navigateur ne peut pas décoder ce fichier audio.'));
    signal.addEventListener('abort', onAbort, { once: true });
    if (signal.aborted) { onAbort(); return; }
    audio.src = url;
  });
}
function extract(channels: Float32Array[], hash: string, signal: AbortSignal, progress: (fraction: number) => void): Promise<AudioAnalysis> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./analysis.worker.ts', import.meta.url), { type: 'module' });
    const cleanup = () => { clearTimeout(timer); worker.terminate(); signal.removeEventListener('abort', onAbort); };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const onAbort = () => fail(abortError());
    const timer = setTimeout(() => fail(new Error('Analyse trop lente. Essayez un extrait plus court.')), 120000);
    signal.addEventListener('abort', onAbort, { once: true });
    worker.onerror = () => fail(new Error('Le processus d’analyse a échoué.'));
    worker.onmessage = ({ data }: MessageEvent<AnalysisResponse>) => {
      if (data.type === 'progress') progress(data.fraction);
      if (data.type === 'error') fail(new Error(data.message));
      if (data.type === 'complete') { cleanup(); resolve(data.analysis); }
    };
    if (signal.aborted) { onAbort(); return; }
    worker.postMessage({ channels, sampleRateHz: SAMPLE_RATE, assetSha256: hash }, channels.map(c => c.buffer));
  });
}
// Web Audio decoding is not abortable. Serialize it so cancelling/reimporting cannot
// accumulate concurrent decoder allocations. A cancelled result is discarded.
let decodeGate: Promise<void> = Promise.resolve();
async function decodeChannels(bytes: ArrayBuffer, signal: AbortSignal): Promise<Float32Array[]> {
  const previous = decodeGate;
  let release!: () => void;
  decodeGate = new Promise<void>(resolve => { release = resolve; });
  try {
    await previous;
    checkAbort(signal);
    const context = new OfflineAudioContext(2, 1, SAMPLE_RATE);
    let decoded: AudioBuffer;
    try { decoded = await context.decodeAudioData(bytes); }
    catch { throw new Error('Décodage impossible : fichier endommagé ou codec non pris en charge.'); }
    checkAbort(signal);
    validateDuration(decoded.duration);
    if (decoded.numberOfChannels > 2 || decoded.length * decoded.numberOfChannels * 4 > LIMITS.pcmBytes) {
      throw new Error('Audio trop complexe : mono/stéréo et 64 Mio de PCM maximum.');
    }
    // Transfer copies, never AudioBuffer-owned memory.
    return Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i).slice());

  } finally { release(); }
}
export async function importAudio(file: File, signal: AbortSignal, status: (message: string) => void): Promise<ImportResult> {
  validateFileSize(file.size);
  status('Vérification du fichier…');
  const bytes = await file.arrayBuffer(); checkAbort(signal);
  validateAudioHeader(bytes);
  const digest = await crypto.subtle.digest('SHA-256', bytes); checkAbort(signal);
  const hash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  let cacheWarning: string | undefined;
  try {
    const analysis = await readAnalysis(hash); checkAbort(signal);
    if (analysis) return { analysis, cached: true };
  } catch { checkAbort(signal); cacheWarning = 'Cache indisponible : analyse conservée pour cette session seulement.'; }
  // Metadata gate BEFORE decodeAudioData; exact decoded length is checked again afterwards.
  validateDuration(await probeDuration(file, signal)); checkAbort(signal);
  status('Décodage Web Audio à 24 kHz…');
  const channels = await decodeChannels(bytes, signal);
  const analysis = await extract(channels, hash, signal, fraction => status(`Analyse ${Math.round(fraction * 100)} %`));
  checkAbort(signal);
  try { await writeAnalysis(analysis); }
  catch { cacheWarning = 'Cache indisponible ou plein : analyse conservée pour cette session seulement.'; }
  checkAbort(signal);
  return { analysis, cached: false, cacheWarning };
}
