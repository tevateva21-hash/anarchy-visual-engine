import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFile, truncate } from 'node:fs/promises';
import { wav } from './wav';
const tone = wav(2, 1000);
test('imports WAV, displays meaningful features and waveform, seeks and reuses cache after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toHaveText('Analyse prête — calculée hors ligne.');
  await expect(page.getByRole('img', { name: /Waveform/ })).toBeVisible();
  const slider = page.getByLabel(/Position d’analyse/);
  await slider.fill('1');
  await expect(page.getByTestId('RMS')).toHaveText(/0\.35/);
  expect(Number(await page.getByTestId('Médiums').textContent())).toBeGreaterThan(0.12);
  expect(Number(await page.getByTestId('Basses').textContent())).toBeLessThan(0.001);
  const pixels = await page.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let purple = 0; for (let i = 0; i < data.length; i += 4) if (data[i] > 80 && data[i + 2] > 150) purple++;
    return purple;
  });
  expect(pixels).toBeGreaterThan(100);
  await page.reload();
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'renamed.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toHaveText('Analyse prête — cache local.');
  await page.getByRole('button', { name: 'Vider le cache local' }).click();
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toHaveText('Analyse prête — calculée hors ligne.');
});
test('rejects invalid and over-duration files then recovers', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'invalid.wav', mimeType: 'audio/wav', buffer: Buffer.from('not audio') });
  await expect(page.getByRole('alert')).toContainText('Format non pris en charge');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'long.wav', mimeType: 'audio/wav', buffer: wav(301, 0, 8000) });
  await expect(page.getByRole('alert')).toContainText('maximum 5 minutes');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'valid.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
});
test('decodes a real MP3 through Web Audio', async ({ page }) => {
  const mp3 = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 'mp3', 'pipe:1'], { input: tone });
  await page.goto('/');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'tone.mp3', mimeType: 'audio/mpeg', buffer: mp3 });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await page.getByLabel(/Position d’analyse/).fill('1');
  expect(Number(await page.getByTestId('Médiums').textContent())).toBeGreaterThan(0.1);
});
test('cache failure is non-blocking', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { get() { throw new Error('Unavailable'); } }); });
  await page.goto('/');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'tone.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await expect(page.getByText(/Cache indisponible/)).toBeVisible();
});
test('rejects excessive size and multichannel WAV before decoding', async ({ page }, testInfo) => {
  await page.goto('/');
  // Playwright limits in-memory uploads to 50 MB; use an actual sparse file.
  const huge = testInfo.outputPath('huge.wav');
  await writeFile(huge, ''); await truncate(huge, 50 * 1024 * 1024 + 1);
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles(huge);
  await expect(page.getByRole('alert')).toContainText('maximum 50 Mio');
  const multichannel = wav(0.1, 100); multichannel.writeUInt16LE(8, 22);
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'surround.wav', mimeType: 'audio/wav', buffer: multichannel });
  await expect(page.getByRole('alert')).toContainText('mono ou stéréo');
});
test('cancels a metadata probe and accepts a new import without stale results', async ({ page }) => {
  await page.addInitScript(() => {
    // Hold only the preflight metadata probe, exercising the real abort cleanup.
    const AudioConstructor = window.Audio;
    let hold = true;
    window.Audio = function () {
      const audio = new AudioConstructor();
      if (hold) { hold = false; Object.defineProperty(audio, 'src', { set() {} }); }
      return audio;
    } as unknown as typeof Audio;
  });
  await page.goto('/');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'cancel.wav', mimeType: 'audio/wav', buffer: tone });
  await page.getByRole('button', { name: 'Annuler' }).click();
  await expect(page.getByRole('status')).toHaveText('Import annulé.');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'next.wav', mimeType: 'audio/wav', buffer: tone });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await expect(page.getByRole('heading', { name: 'next.wav' })).toBeVisible();
});
