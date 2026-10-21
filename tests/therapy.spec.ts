import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { wav } from './wav';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('room renders actual 3D pixels, changes camera and seeks repeatably; animation can pause', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  const canvas = page.getByRole('img', { name: /Techno Therapy Room : salle/ });
  await expect(canvas).toBeVisible();
  // Recenter before every capture: controls can leave the first canvas row clipped offscreen.
  const capture = async () => {
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest' }));
    return canvas.screenshot();
  };
  const first = await capture();
  const pixels = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: first, maxBuffer: 10 * 1024 * 1024 });
  let lit = 0, warm = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 180) lit++;
    if (pixels[i] > pixels[i + 2] * 1.3 && pixels[i] > 50) warm++;
  }
  expect(lit).toBeGreaterThan(10000); expect(warm).toBeGreaterThan(10000);
  await page.getByLabel('Point de vue').selectOption('divan');
  expect(hash(await capture())).not.toBe(hash(first));
  await page.getByLabel('Point de vue').selectOption('conversation');
  expect(hash(await capture())).toBe(hash(first));
  await page.getByLabel('Instant de la pièce').fill('12');
  const second = await capture(); expect(hash(second)).not.toBe(hash(first));
  await page.getByLabel('Instant de la pièce').fill('0');
  expect(hash(await capture())).toBe(hash(first));
  await page.getByRole('button', { name: 'Animer la pièce' }).click();
  await expect.poll(async () => Number(await page.getByLabel('Instant de la pièce').inputValue())).toBeGreaterThan(0.1);
  await page.getByRole('button', { name: 'Pause de la pièce' }).click();
  const pausedTime = await page.getByLabel('Instant de la pièce').inputValue();
  const paused = hash(await capture());
  expect(hash(await capture())).toBe(paused);
  await expect(page.getByLabel('Instant de la pièce')).toHaveValue(pausedTime);
  await canvas.screenshot({ path: testInfo.outputPath('techno-therapy-room.png') });
  expect(errors).toEqual([]);
});

test('mobile reduced motion and switching scenes preserve the imported audio', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await expect(page.getByRole('button', { name: 'Animer la pièce' })).toBeDisabled();
  await expect(page.getByLabel('Étrangeté')).toBeDisabled();
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'therapy.wav', mimeType: 'audio/wav', buffer: wav(3, 1000) });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await page.getByLabel(/Position d’analyse/).fill('1');
  await expect(page.getByTestId('RMS')).toHaveText(/0\.35/);
  const source = await page.locator('audio').getAttribute('src');
  await page.locator('audio').evaluate(async (audio: HTMLAudioElement) => { await audio.play(); });
  await page.getByRole('button', { name: 'Industrial City', exact: true }).click();
  await expect(page.getByRole('img', { name: /Étude pixel-art Industrial City/ })).toBeVisible();
  await page.getByRole('button', { name: 'Techno Therapy Room', exact: true }).click();
  await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await expect(page.locator('audio')).toHaveAttribute('src', source!);
  await expect(page.getByRole('img', { name: /Waveform/ })).toBeVisible();
  expect(await page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing WebGL or context loss has a clear fallback without blocking audio', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: unknown) {
      if (kind === 'webgl2') return null;
      return Reflect.apply(original, this, [kind, options]);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('WebGL 2');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'fallback.wav', mimeType: 'audio/wav', buffer: wav(1, 1000) });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await expect(page.getByRole('img', { name: /Waveform/ })).toBeVisible();
  await page.getByRole('button', { name: 'Industrial City', exact: true }).click();
  await expect(page.getByRole('img', { name: /Étude pixel-art Industrial City/ })).toBeVisible();
});

test('context loss pauses the room and retry reconstructs a working viewport', async ({ page }) => {
  await page.goto('/'); await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await page.getByRole('img', { name: /Techno Therapy Room : salle/ }).evaluate(canvas => {
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await expect(page.getByRole('alert')).toContainText('contexte graphique');
  await expect(page.getByRole('button', { name: 'Animer la pièce' })).toBeDisabled();
  await page.getByRole('button', { name: 'Réessayer la 3D' }).click();
  await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Animer la pièce' })).toBeEnabled();
});
