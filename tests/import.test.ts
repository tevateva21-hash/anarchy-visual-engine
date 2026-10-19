import { describe, expect, it } from 'vitest';
import { validateAudioHeader } from '../apps/studio/src/importAudio';
import { wav } from './wav';
const buffer = (b: Buffer) => Uint8Array.from(b).buffer;
describe('audio format preflight', () => {
  it('accepts PCM WAV and MP3 headers independently of filename/MIME', () => {
    expect(() => validateAudioHeader(buffer(wav(0.01, 100)))).not.toThrow();
    expect(() => validateAudioHeader(buffer(Buffer.from('ID3')))).not.toThrow();
    expect(() => validateAudioHeader(buffer(Buffer.from([0xff, 0xfb, 0, 0])))).not.toThrow();
  });
  it('rejects non audio, truncated WAV and excessive channels before decoding', () => {
    expect(() => validateAudioHeader(new ArrayBuffer(0))).toThrow('Format');
    const truncated = wav(0.01, 100).subarray(0, 20);
    expect(() => validateAudioHeader(buffer(truncated))).toThrow('tronqué');
    const multichannel = wav(0.01, 100); multichannel.writeUInt16LE(8, 22);
    expect(() => validateAudioHeader(buffer(multichannel))).toThrow('mono ou stéréo');
  });
});
