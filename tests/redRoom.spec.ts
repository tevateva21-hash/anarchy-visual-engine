import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('blood red is the default lit scene; classic/psychedelic version is retained and switching is reversible', async ({ page }, testInfo) => {
  await page.goto('/'); await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  const ambiance = page.getByLabel('Ambiance', { exact: true }), psyche = page.getByLabel('Psychédélisme');
  await expect(ambiance).toHaveValue('blood-red'); await expect(psyche).toBeDisabled();
  await page.getByLabel('Instant de la pièce').fill('8');
  const canvas = page.getByRole('img', { name: /Techno Therapy Room : salle/ });
  const capture = async () => { await canvas.evaluate(e => e.scrollIntoView({ block: 'center' })); return canvas.screenshot(); };
  const red = await capture();
  const pixels = execFileSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: red, maxBuffer: 10 * 1024 * 1024 });
  let redPixels = 0, lit = 0;
  for (let i = 0; i < pixels.length; i += 3) {
    if (pixels[i] > 60 && pixels[i] > pixels[i + 1] * 2 && pixels[i] > pixels[i + 2] * 1.5) redPixels++;
    if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 180) lit++;
  }
  expect(redPixels).toBeGreaterThan(pixels.length / 3 * 0.25); expect(lit).toBeGreaterThan(10000);
  await ambiance.selectOption('classic'); await expect(psyche).toBeEnabled();
  await psyche.fill('0.8'); const classic = hash(await capture()); expect(classic).not.toBe(hash(red));
  await ambiance.selectOption('blood-red'); expect(hash(await capture())).toBe(hash(red));
  await ambiance.selectOption('classic'); await expect(psyche).toHaveValue('0.8'); expect(hash(await capture())).toBe(classic);
  await ambiance.selectOption('blood-red');
  await page.getByLabel('Timeline Pendulum Push').fill('8'); const close = hash(await capture());
  await page.getByLabel('Timeline Pendulum Push').fill('2'); await capture();
  await page.getByLabel('Timeline Pendulum Push').fill('8'); expect(hash(await capture())).toBe(close);
  await testInfo.attach('Rouge sang : rendu Three.js', { body: red, contentType: 'image/png' });
});
