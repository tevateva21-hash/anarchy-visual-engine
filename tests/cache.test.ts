import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzePCM, SAMPLE_RATE } from '../packages/audio-analysis/src/index';
import { clearAnalysisCache, readAnalysis, writeAnalysis } from '../apps/studio/src/cache';
const entry = (hash: string) => analyzePCM({ channels: [new Float32Array(128)], sampleRateHz: SAMPLE_RATE, assetSha256: hash });
beforeEach(async () => { vi.restoreAllMocks(); await clearAnalysisCache(); });
describe('IndexedDB cache', () => {
  it('round-trips typed arrays under the source hash', async () => {
    const a = entry('abc'); await writeAnalysis(a);
    expect(await readAnalysis('abc')).toEqual(a);
    expect(await readAnalysis('other')).toBeUndefined();
  });
  it('keeps at most five entries, evicting the least recently used', async () => {
    let now = 1000; vi.spyOn(Date, 'now').mockImplementation(() => now++);
    for (let i = 0; i < 5; i++) await writeAnalysis(entry(String(i)));
    await readAnalysis('0'); await writeAnalysis(entry('5'));
    expect(await readAnalysis('1')).toBeUndefined();
    expect(await readAnalysis('0')).toBeDefined(); expect(await readAnalysis('5')).toBeDefined();
  });
  it('expires analyses after 30 days', async () => {
    const time = vi.spyOn(Date, 'now').mockReturnValue(0); await writeAnalysis(entry('a'));
    time.mockReturnValue(31 * 86400000); expect(await readAnalysis('a')).toBeUndefined();
  });
  it('drops corrupt data and supports explicit clear', async () => {
    const a = entry('bad'); a.rms[0] = NaN; await writeAnalysis(a);
    expect(await readAnalysis('bad')).toBeUndefined();
    await writeAnalysis(entry('good')); await clearAnalysisCache(); expect(await readAnalysis('good')).toBeUndefined();
  });
});
