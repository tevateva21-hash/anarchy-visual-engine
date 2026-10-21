import type { PaletteId } from '@anarchy/contracts';
import { studyCameraOffset, type StudyMotion } from './studyMotion';

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
  fog: string;
  rust: string;
}
export const STUDY_PALETTES: readonly StudyPalette[] = [
  { id: 'furnace-amber', name: 'Brume industrielle', sky: '#20282b', haze: '#3f4640', distant: '#3a4240', structure: '#161e23', face: '#303734', shadow: '#0c141d', light: '#a89d69', glow: '#696a4b', reflection: '#474c3d', fog: '#4b534c', rust: '#714b44' },
  { id: 'toxic-oxide', name: 'Olive militaire', sky: '#1e2629', haze: '#3d4437', distant: '#353f37', structure: '#141e21', face: '#2c352e', shadow: '#0b141b', light: '#929773', glow: '#616b4c', reflection: '#414a38', fog: '#4c5547', rust: '#654941' },
  { id: 'cold-concrete', name: 'Cendres froides', sky: '#202931', haze: '#414b4b', distant: '#354247', structure: '#141e28', face: '#2d373d', shadow: '#0b141f', light: '#9eaa9f', glow: '#626e69', reflection: '#424e4c', fog: '#4f5b59', rust: '#69504d' },
];

/** M1 art study, not the M2 scene engine. All image inputs are explicit, no retained frame state. */
export function drawIndustrialStudy(ctx: CanvasRenderingContext2D, paletteId: PaletteId, frame: number, motion: StudyMotion = {}): void {
  if (!Number.isInteger(frame) || frame < 0 || frame > STUDY_LAST_FRAME) throw new Error('Instant de démonstration invalide.');
  const p = STUDY_PALETTES.find(palette => palette.id === paletteId);
  if (!p) throw new Error('Palette de démonstration inconnue.');
  const intensity = motion.cameraIntensity ?? 0.5;
  // Validate even if a future caller passes an invalid option while drawing a static layer.
  studyCameraOffset(frame, intensity, 0, motion.accentEnabled);
  let offsetX = 0, offsetY = 0;
  const layer = (depth: number) => {
    const offset = studyCameraOffset(frame, intensity, depth, motion.accentEnabled);
    offsetX = offset.x; offsetY = offset.y;
  };
  const time = frame / STUDY_FPS;
  ctx.save();
  ctx.resetTransform();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x) + offsetX, Math.round(y) + offsetY, Math.round(w), Math.round(h));
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
  layer(0.12);
  // The old eclipse remains, now dulled by dirty haze rather than a bright arcade moon.
  for (let y = -23; y <= 23; y++) for (let x = -23; x <= 23; x++) {
    if (x * x + y * y <= 529 && (x + 9) ** 2 + (y - 3) ** 2 > 430) {
      rect(237 + x, 48 + y, 1, 1, y % 3 === 0 ? p.glow : p.light);
    }
  }
  layer(0.3);
  // A fixed skyline composition: layered mass, chimneys and service towers.
  const skyline = [[0, 87, 20, 36], [24, 73, 12, 50], [40, 83, 24, 40], [69, 61, 8, 62], [82, 78, 31, 45], [117, 67, 19, 56], [140, 83, 28, 40], [175, 62, 27, 61], [208, 77, 23, 46], [237, 87, 36, 36], [280, 68, 20, 55], [307, 80, 13, 43]];
  for (const [x, y, w, h] of skyline) {
    rect(x, y, w, h, p.distant);
    for (let wy = y + 7; wy < 116; wy += 9) for (let wx = x + 4; wx < x + w - 2; wx += 7) {
      if ((wx * 7 + wy) % 5 === 0) rect(wx, wy, 1, 2, p.glow);
    }
  }
  // Three bands of dithered fog veil distant structures, never the entire image at once.
  const fogBand = (baseY: number, thickness: number, strength: number, speed: number, color = p.haze) => {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let x = -12; x < 332; x++) {
      const crest = Math.round(3 * Math.sin(x / 43 + time * speed) + 2 * Math.cos(x / 71 - time * speed));
      for (let row = 0; row < thickness; row++) {
        const y = baseY + crest + row;
        const density = strength * Math.sin(Math.PI * row / thickness);
        if (bayer[((y & 3) * 4) + (x & 3)] < density) rect(x, y, 1, 1, color);
      }
    }
  };
  fogBand(56, 60, 5, 0.18, p.fog);
  fogBand(96, 28, 3, -0.15);
  // Soft-edged steam plumes from the existing chimney, moving at different rates.
  for (let i = 0; i < 22; i++) {
    const age = (i * 3 + frame / 4) % 60;
    const x = 71 + Math.round(age * 0.45 + 2 * Math.sin(age / 9 + i));
    const y = 60 - Math.round(age * 0.6);
    const width = 3 + Math.floor(age / 7);
    for (let py = 0; py < 4; py++) for (let px = 0; px < width; px++) {
      if ((px + py + i) % 3 !== 0) rect(x + px, y + py, 1, 1, i % 3 ? p.haze : p.distant);
    }
  }
  layer(0.7);
  // Left factory facade and foreground roof.
  rect(0, 98, 113, 60, p.structure); rect(0, 94, 116, 4, p.shadow);
  rect(4, 101, 72, 44, p.face);
  for (let x = 8; x < 76; x += 13) {
    rect(x, 105, 8, 18, p.shadow);
    const flicker = Math.sin(time * 2.1 + x) + 0.2 * Math.sin(time * 5.7 + x);
    rect(x + 1, 107, 5, 9, x % 3 === 0 && flicker > -0.45 ? p.light : p.glow);
    rect(x + 3, 105, 1, 18, p.structure); rect(x, 113, 8, 1, p.structure);
  }
  rect(85, 108, 18, 42, p.shadow); rect(88, 110, 1, 31, p.face);
  for (let y = 126; y < 151; y += 4) line(2, y, 76, y, p.structure);
  rect(18, 58, 8, 39, p.structure); rect(16, 56, 12, 3, p.face);
  rect(94, 67, 5, 30, p.shadow); rect(92, 66, 9, 2, p.face);
  // Fixed facade grime: rain streaks, flaked concrete and occasional muted rust.
  for (let i = 0; i < 125; i++) {
    const x = (i * 37 + 3) % 110, y = 99 + (i * 17 % 54);
    if (!(x < 76 && y < 124) && !(x > 84 && x < 104)) {
      rect(x, y, i % 5 === 0 ? 2 : 1, 1 + i % 4, i % 13 === 0 ? p.rust : i % 3 === 0 ? p.shadow : p.face);
    }
  }
  layer(0.45);
  // Crane and hanging cargo beyond the elevated rail.
  line(187, 42, 187, 111, p.structure); line(190, 42, 190, 111, p.structure);
  line(153, 46, 222, 46, p.structure); line(153, 49, 222, 49, p.structure);
  line(155, 46, 187, 34, p.structure); line(187, 34, 219, 46, p.structure);
  const cargoSway = Math.round(Math.sin(time * 0.65) * 2);
  line(214, 49, 214 + cargoSway, 86, p.structure); rect(210 + cargoSway, 86, 9, 6, p.structure);
  layer(0.6);
  // Elevated rail, piers and inset rivets.
  rect(106, 112, 214, 6, p.face); rect(104, 118, 216, 6, p.shadow);
  for (let x = 123; x < 320; x += 48) {
    rect(x, 124, 8, 33, p.structure); rect(x - 2, 124, 12, 4, p.structure);
    rect(x + 1, 126, 1, 22, p.face); rect(x + 18, 114, 1, 1, p.glow);
  }
  const trainX = 116 + Math.floor(frame / 4);
  rect(trainX, 103, 48, 8, p.structure);
  for (let x = trainX + 3; x < trainX + 44; x += 7) rect(x, 105, 4, 2, p.glow);
  layer(0.85);
  // Road, wet reflections and converging industrial perspective.
  rect(-12, 157, 344, 30, p.shadow);
  for (let i = 0; i < 38; i++) {
    const x = (i * 37 + 9) % 320, y = 159 + i * 7 % 21;
    rect(x, y, 2 + i % 11, 1, i % 4 === 0 ? p.reflection : p.structure);
  }
  line(157, 145, 111, 179, p.face); line(171, 145, 230, 179, p.face);
  rect(161, 154, 2, 3, p.glow); rect(163, 164, 3, 5, p.reflection);
  // Human scale: a solitary silhouette below the overpass.
  rect(179, 144, 3, 3, p.shadow); rect(178, 147, 5, 8, p.shadow);
  line(179, 155, 178, 159, p.shadow); line(182, 155, 183, 159, p.shadow);
  layer(0.2);
  fogBand(127, 29, 1.8, 0.12);
  layer(1);
  // Cable sag and foreground posts frame the view.
  rect(305, 19, 4, 161, p.shadow); rect(295, 29, 23, 3, p.shadow);
  for (let x = 0; x < 307; x++) {
    const y = 22 + Math.round(17 * (1 - ((x - 150) / 155) ** 2));
    rect(x, y, 1, 1, p.shadow);
  }
  rect(291, 52, 10, 2, p.shadow); rect(290, 54, 4, 2, Math.sin(time * 1.8) > -0.6 ? p.light : p.glow);
  rect(309, 76, 2, 2, p.rust);
  layer(0);
  // Sparse rain, always derived from the explicit frame; no randomizer or accumulated state.
  for (let i = 0; i < 65; i++) {
    const x = (i * 53 + 17) % 320, y = (i * 31 + frame * 2) % 180;
    line(x, y, x - 1, y + 3, i % 4 ? p.face : p.haze);
  }
  // Sparse quantized sensor grain / imperfect console material, not a random framebuffer.
  const grainPhase = Math.floor(frame / 3);
  for (let i = 0; i < 185; i++) {
    const x = (i * 73 + grainPhase * 19) % 320, y = 8 + (i * 47 + grainPhase * 7) % 166;
    rect(x, y, 1, 1, i % 4 ? p.structure : p.haze);
  }
  // Edge darkening through a sparse fixed dither instead of a smooth digital vignette.
  for (let y = 8; y < 174; y++) for (let x = 0; x < 320; x++) {
    const edge = Math.min(x, 319 - x, (y - 8) * 2, (173 - y) * 2);
    if (edge < 14 && (x * 3 + y * 5) % 17 < (14 - edge) / 3) rect(x, y, 1, 1, p.shadow);
  }
  // Letterbox bars are in the image, not a CSS filter or time-driven overlay.
  rect(0, 0, 320, 8, p.shadow); rect(0, 174, 320, 6, p.shadow);
  ctx.restore();
}
