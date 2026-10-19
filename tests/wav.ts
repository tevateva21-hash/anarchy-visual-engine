/** Small deterministic PCM16 fixture generator, no copyrighted recordings. */
export function wav(seconds: number, frequency: number, sampleRate = 24000): Buffer {
  const samples = Math.round(seconds * sampleRate), bytes = samples * 2;
  const b = Buffer.alloc(44 + bytes);
  b.write('RIFF', 0); b.writeUInt32LE(36 + bytes, 4); b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sampleRate, 24); b.writeUInt32LE(sampleRate * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(bytes, 40);
  for (let i = 0; i < samples; i++) b.writeInt16LE(Math.round(16383 * Math.sin(2 * Math.PI * frequency * i / sampleRate)), 44 + 2 * i);
  return b;
}
