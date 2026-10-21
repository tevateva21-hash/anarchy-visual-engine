import { test, expect, type Locator } from '@playwright/test';
import { wav } from './wav';

async function imageState(canvas: Locator) {
  return canvas.evaluate(async (element: HTMLCanvasElement) => {
    const image = element.getContext('2d')!.getImageData(0, 0, element.width, element.height);
    const colors = new Set<string>();
    for (let i = 0; i < image.data.length; i += 4) {
      colors.add(`#${[image.data[i], image.data[i + 1], image.data[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')}`);
      if (image.data[i + 3] !== 255) throw new Error('Transparent pixel in complete study');
    }
    const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(image.data).buffer);
    return {
      hash: Array.from(new Uint8Array(digest)).join(','), colors: [...colors],
      width: element.width, height: element.height,
      sampling: getComputedStyle(element).imageRendering,
      smoothing: element.getContext('2d')!.imageSmoothingEnabled,
    };
  });
}

test('Industrial City is opaque low-resolution pixel art, repeatable after scrubbing and palette changes', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByRole('img', { name: /Étude pixel-art Industrial City/ });
  const initial = await imageState(canvas);
  expect(initial.width).toBe(320); expect(initial.height).toBe(180);
  expect(initial.sampling).toBe('pixelated'); expect(initial.smoothing).toBe(false);
  // Integer raster drawing should have only the nine deliberately chosen art colors, no antialias shades.
  expect(initial.colors.length).toBeGreaterThanOrEqual(7); expect(initial.colors.length).toBeLessThanOrEqual(9);
  expect(initial.colors).toContain('#e4a35b'); expect(initial.colors).toContain('#090d10');
  const instant = page.getByLabel('Instant de l’étude');
  await instant.fill('96');
  await expect.poll(async () => (await imageState(canvas)).hash).not.toBe(initial.hash);
  await instant.fill('48');
  await expect.poll(async () => (await imageState(canvas)).hash).toBe(initial.hash);
  await page.getByLabel('Palette de l’étude').selectOption('toxic-oxide');
  await expect.poll(async () => (await imageState(canvas)).colors).toContain('#b9c87a');
  expect((await imageState(canvas)).hash).not.toBe(initial.hash);
  await page.getByLabel('Palette de l’étude').selectOption('cold-concrete');
  await expect.poll(async () => (await imageState(canvas)).colors).toContain('#adc6ce');
  await page.getByLabel('Palette de l’étude').selectOption('furnace-amber');
  await expect.poll(async () => (await imageState(canvas)).hash).toBe(initial.hash);
});

test('art direction stays usable on mobile, with keyboard and reduced motion; audio remains intact', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const canvas = page.getByRole('img', { name: /Étude pixel-art Industrial City/ });
  const initial = await imageState(canvas);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect((await imageState(canvas)).hash).toBe(initial.hash);
  await page.getByLabel('Palette de l’étude').focus();
  await expect(page.getByLabel('Palette de l’étude')).toBeFocused();
  await page.getByLabel('Instant de l’étude').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Instant de l’étude')).toHaveValue('49');
  await page.getByLabel('Importer un MP3 ou WAV').setInputFiles({ name: 'audio-preserved.wav', mimeType: 'audio/wav', buffer: wav(2, 1000) });
  await expect(page.getByRole('status')).toContainText('Analyse prête');
  await expect(page.locator('audio')).toBeVisible();
  await expect(page.locator('audio')).toHaveAttribute('controls', '');
  await page.getByLabel(/Position d’analyse/).fill('1');
  await expect(page.getByTestId('RMS')).toHaveText(/0\.35/);
  const box = await canvas.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(375);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  // Evidence artifact for the current test run, never a localhost preview link.
  await page.screenshot({ path: testInfo.outputPath('retro-mobile.png'), fullPage: true });
});
