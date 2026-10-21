import type { PaletteId } from '@anarchy/contracts';

export const STUDY_SIZE = { width: 320, height: 180 } as const;
export const STUDY_FPS = 12;
export const STUDY_LAST_FRAME = 144;
export interface StudyPalette {
  id: PaletteId;
  name: string;
  sky: string;
  haze: string;
  distant: string;
  structure: string;
  face: string;
  shadow: string;
  light: string;
  glow: string;
  reflection: string;
}
export const STUDY_PALETTES: readonly StudyPalette[] = [
  { id: 'furnace-amber', name: 'Ambre industriel', sky: '#17191c', haze: '#3e342c', distant: '#302e2b', structure: '#121619', face: '#25272a', shadow: '#090d10', light: '#e4a35b', glow: '#95613b', reflection: '#66462e' },
  { id: 'toxic-oxide', name: 'Oxyde toxique', sky: '#141b19', haze: '#343f2a', distant: '#2a352d', structure: '#101915', face: '#222f27', shadow: '#080f0c', light: '#b9c87a', glow: '#748649', reflection: '#4a603c' },
  { id: 'cold-concrete', name: 'Béton froid', sky: '#161b25', haze: '#303e50', distant: '#2a3442', structure: '#101923', face: '#222e3b', shadow: '#080e17', light: '#adc6ce', glow: '#658394', reflection: '#3b5365' },
];

/** M1 art study, not the M2 scene engine. All image inputs are explicit, no retained frame state. */
export function drawIndustrialStudy(ctx: CanvasRenderingContext2D, paletteId: PaletteId, frame: number): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > STUDY_LAST_FRAME) throw new Error('Instant de démonstration invalide.');
  const p = STUDY_PALETTES.find(palette => palette.id === paletteId);
  if (!p) throw new Error('Palette de démonstration inconnue.');
  ctx.save();
  ctx.resetTransform();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  // Integer raster lines avoid subpixel antialiasing at the logical resolution.
  const line = (x0: number, y0: number, x1: number, y1: number, color: string) => {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    while (true) {
      rect(x0, y0, 1, 1, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * error;
      if (e2 >= dy) { error += dy; x0 += sx; }
      if (e2 <= dx) { error += dx; y0 += sy; }
    }
  };
  rect(0, 0, 320, 180, p.sky);
  rect(0, 60, 320, 65, p.haze);
  for (let y = 42; y < 70; y += 2) for (let x = y % 4; x < 320; x += 4) {
    if ((x + y * 3) % 11 < (y - 40) / 4) rect(x, y, 1, 1, p.haze);
  }
  // Cropped industrial sun, rasterized and partially eclipsed.
  for (let y = -23; y <= 23; y++) for (let x = -23; x <= 23; x++) {
    if (x * x + y * y <= 529 && (x + 9) ** 2 + (y - 3) ** 2 > 430) {
      rect(237 + x, 48 + y, 1, 1, y % 3 === 0 ? p.glow : p.light);
    }
  }
  // A fixed skyline composition: layered mass, chimneys and service towers.
  const skyline = [[0, 87, 20, 36], [24, 73, 12, 50], [40, 83, 24, 40], [69, 61, 8, 62], [82, 78, 31, 45], [117, 67, 19, 56], [140, 83, 28, 40], [175, 62, 27, 61], [208, 77, 23, 46], [237, 87, 36, 36], [280, 68, 20, 55], [307, 80, 13, 43]];
  for (const [x, y, w, h] of skyline) {
    rect(x, y, w, h, p.distant);
    for (let wy = y + 7; wy < 116; wy += 9) for (let wx = x + 4; wx < x + w - 2; wx += 7) {
      if ((wx * 7 + wy) % 5 === 0) rect(wx, wy, 1, 2, p.glow);
    }
  }
  // Staggered drifting smoke; analytic positions make backwards scrubbing repeatable.
  for (let i = 0; i < 28; i++) {
    const x = 70 + ((i * 9 + Math.floor(frame / 3)) % 60);
    const y = 55 - (i * 7 % 24);
    rect(x, y, 6 + i % 7, 2, i % 3 ? p.distant : p.haze);
  }
  // Left factory facade and foreground roof.
  rect(0, 98, 113, 60, p.structure); rect(0, 94, 116, 4, p.shadow);
  rect(4, 101, 72, 44, p.face);
  for (let x = 8; x < 76; x += 13) {
    rect(x, 105, 8, 18, p.shadow);
    rect(x + 1, 107, 5, 9, x % 3 === 0 ? p.light : p.glow);
    rect(x + 3, 105, 1, 18, p.structure); rect(x, 113, 8, 1, p.structure);
  }
  rect(85, 108, 18, 42, p.shadow); rect(88, 110, 1, 31, p.face);
  for (let y = 126; y < 151; y += 4) line(2, y, 76, y, p.structure);
  rect(18, 58, 8, 39, p.structure); rect(16, 56, 12, 3, p.face);
  rect(94, 67, 5, 30, p.shadow); rect(92, 66, 9, 2, p.face);
  // Crane and hanging cargo beyond the elevated rail.
  line(187, 42, 187, 111, p.structure); line(190, 42, 190, 111, p.structure);
  line(153, 46, 222, 46, p.structure); line(153, 49, 222, 49, p.structure);
  line(155, 46, 187, 34, p.structure); line(187, 34, 219, 46, p.structure);
  line(214, 49, 214, 86, p.structure); rect(210, 86, 9, 6, p.structure);
  // Elevated rail, piers and inset rivets.
  rect(106, 112, 214, 6, p.face); rect(104, 118, 216, 6, p.shadow);
  for (let x = 123; x < 320; x += 48) {
    rect(x, 124, 8, 33, p.structure); rect(x - 2, 124, 12, 4, p.structure);
    rect(x + 1, 126, 1, 22, p.face); rect(x + 18, 114, 1, 1, p.glow);
  }
  const trainX = 116 + Math.floor(frame / 4);
  rect(trainX, 103, 48, 8, p.structure);
  for (let x = trainX + 3; x < trainX + 44; x += 7) rect(x, 105, 4, 2, p.glow);
  // Road, wet reflections and converging industrial perspective.
  rect(0, 157, 320, 23, p.shadow);
  for (let i = 0; i < 38; i++) {
    const x = (i * 37 + 9) % 320, y = 159 + i * 7 % 21;
    rect(x, y, 2 + i % 11, 1, i % 4 === 0 ? p.reflection : p.structure);
  }
  line(157, 145, 111, 179, p.face); line(171, 145, 230, 179, p.face);
  rect(161, 154, 2, 3, p.glow); rect(163, 164, 3, 5, p.reflection);
  // Human scale: a solitary silhouette below the overpass.
  rect(179, 144, 3, 3, p.shadow); rect(178, 147, 5, 8, p.shadow);
  line(179, 155, 178, 159, p.shadow); line(182, 155, 183, 159, p.shadow);
  // Cable sag and foreground posts frame the view.
  rect(305, 19, 4, 161, p.shadow); rect(295, 29, 23, 3, p.shadow);
  for (let x = 0; x < 307; x++) {
    const y = 22 + Math.round(17 * (1 - ((x - 150) / 155) ** 2));
    rect(x, y, 1, 1, p.shadow);
  }
  rect(291, 52, 10, 2, p.shadow); rect(290, 54, 4, 2, p.light);
  // Sparse rain, always derived from the explicit frame; no randomizer or accumulated state.
  for (let i = 0; i < 40; i++) {
    const x = (i * 53 + 17) % 320, y = (i * 31 + frame * 2) % 180;
    line(x, y, x - 1, y + 3, i % 3 ? p.face : p.glow);
  }
  // Letterbox bars are in the image, not a CSS filter or time-driven overlay.
  rect(0, 0, 320, 8, p.shadow); rect(0, 174, 320, 6, p.shadow);
  ctx.restore();
}
