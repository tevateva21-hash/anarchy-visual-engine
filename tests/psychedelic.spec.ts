import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

test('look pass visibly alters a lit image and reverses exactly; seek and Pendulum Push remain reproducible', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${message.text()} (${message.location().url})`); });
  await page.goto('/'); await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await page.getByLabel('Ambiance', { exact: true }).selectOption('classic');
  const canvas = page.getByRole('img', { name: /Techno Therapy Room : salle/ });
  const capture = async () => { await canvas.evaluate(e => e.scrollIntoView({ block: 'center' })); return canvas.screenshot(); };
  const look = page.getByLabel('Psychédélisme');
  await page.getByLabel('Instant de la pièce').fill('8'); await look.fill('0');
  const original = await capture();
  await look.fill('1'); const altered = await capture(); expect(hash(altered)).not.toBe(hash(original));
  const pixels = execFileSync('ffmpeg', ['-v', 'error', '-i', 'pipe:0', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { input: altered, maxBuffer: 10 * 1024 * 1024 });
  let lit = 0; for (let i = 0; i < pixels.length; i += 3) if (pixels[i] + pixels[i + 1] + pixels[i + 2] > 180) lit++;
  expect(lit).toBeGreaterThan(10000);
  await page.getByLabel('Instant de la pièce').fill('20'); await capture();
  await page.getByLabel('Instant de la pièce').fill('8'); expect(hash(await capture())).toBe(hash(altered));
  await look.fill('0'); expect(hash(await capture())).toBe(hash(original));
  await look.fill('0.75'); await page.getByLabel('Timeline Pendulum Push').fill('8');
  const close = hash(await capture());
  await page.getByLabel('Timeline Pendulum Push').fill('2'); await capture();
  await page.getByLabel('Timeline Pendulum Push').fill('8'); expect(hash(await capture())).toBe(close);
  await testInfo.attach('Rendu initial', { body: original, contentType: 'image/png' });
  await testInfo.attach('Psychédélisme maximum', { body: altered, contentType: 'image/png' });
  expect(errors).toEqual([]);
});

test('reduced motion keeps the grading adjustable but freezes distortion and temporal color variation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/'); await page.locator('.therapy-viewport[data-ready=true]').waitFor();
  await page.getByLabel('Ambiance', { exact: true }).selectOption('classic');
  const canvas = page.getByRole('img', { name: /Techno Therapy Room : salle/ });
  const capture = async () => { await canvas.evaluate(e => e.scrollIntoView({ block: 'center' })); return canvas.screenshot(); };
  const look = page.getByLabel('Psychédélisme'); await expect(look).toBeEnabled();
  await look.fill('1'); const initial = hash(await capture());
  await page.getByLabel('Instant de la pièce').fill('20'); expect(hash(await capture())).toBe(initial);
  await expect(page.getByRole('button', { name: 'Animer la pièce' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Play Pendulum Push', exact: true })).toBeDisabled();
  await look.fill('0'); expect(hash(await capture())).not.toBe(initial);
});
