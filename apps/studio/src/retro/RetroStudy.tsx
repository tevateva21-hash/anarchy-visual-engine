import { useEffect, useRef, useState } from 'react';
import type { PaletteId } from '@anarchy/contracts';
import { drawIndustrialStudy, STUDY_FPS, STUDY_LAST_FRAME, STUDY_PALETTES, STUDY_SIZE } from './industrialStudy';

export function RetroStudy() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState<PaletteId>('furnace-amber');
  const [frame, setFrame] = useState(48);
  const [playing, setPlaying] = useState(false);
  const [cameraIntensity, setCameraIntensity] = useState(0.5);
  const [accentEnabled, setAccentEnabled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => {
      setReducedMotion(media.matches);
      if (media.matches) setPlaying(false);
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (context) {
      context.imageSmoothingEnabled = false;
      drawIndustrialStudy(context, palette, frame, {
        cameraIntensity: reducedMotion ? 0 : cameraIntensity,
        accentEnabled: !reducedMotion && accentEnabled,
      });
    }
  }, [palette, frame, cameraIntensity, accentEnabled, reducedMotion]);

  useEffect(() => {
    if (!playing || reducedMotion) return;
    // RAF schedules a demo clock only. The drawing always receives an absolute frame.
    const originFrame = frame;
    let start: number | undefined;
    let request = 0;
    const tick = (timestamp: number) => {
      start ??= timestamp;
      const next = Math.min(STUDY_LAST_FRAME, originFrame + Math.floor((timestamp - start) * STUDY_FPS / 1000));
      setFrame(next);
      if (next === STUDY_LAST_FRAME) setPlaying(false);
      else request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
    // Capture the start frame once per playback; scrubbing explicitly pauses first.
  }, [playing, reducedMotion]);

  const currentPalette = STUDY_PALETTES.find(p => p.id === palette)!;
  return <section className="retro-study" aria-labelledby="study-title">
    <div className="study-heading">
      <div><span className="eyebrow">M1 / ÉTUDE VISUELLE 001</span><h2 id="study-title">Industrial City<span className="accent">.</span></h2></div>
      <span className="study-badge">90s / CONSOLE ATMOSPHERE</span>
    </div>
    <div className="study-stage">
      <canvas ref={canvas} width={STUDY_SIZE.width} height={STUDY_SIZE.height} role="img" aria-label="Industrial City : étude rétro PS1, usines et viaduc dans la brume" />
      <div className="stage-caption"><span>SECTEUR 09 — APRÈS LA DERNIÈRE RAME</span><span>320 × 180</span></div>
    </div>
    <div className="study-controls">
      <div>
        <label htmlFor="study-palette">Palette de l’étude</label>
        <select id="study-palette" value={palette} onChange={e => setPalette(e.target.value as PaletteId)}>
          {STUDY_PALETTES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="palette-strip" aria-hidden="true">
          {[currentPalette.shadow, currentPalette.structure, currentPalette.face, currentPalette.haze, currentPalette.rust, currentPalette.light].map(color => <span key={color} style={{ backgroundColor: color }} />)}
        </div>
      </div>
      <div className="study-time">
        <label htmlFor="study-frame">Instant de l’étude <span className="study-timestamp">{(frame / STUDY_FPS).toFixed(2)} s</span></label>
        <input id="study-frame" type="range" min="0" max={STUDY_LAST_FRAME} step="1" value={frame} onChange={e => { setPlaying(false); setFrame(Number(e.target.value)); }} />
        <p>Image {frame} / {STUDY_LAST_FRAME} · temps indépendant du lecteur</p>
        <div className="study-playback">
          <button disabled={reducedMotion} onClick={() => {
            if (!playing && frame === STUDY_LAST_FRAME) setFrame(0);
            setPlaying(value => !value);
          }}>{playing ? 'Pause de la démo' : 'Animer la démo'}</button>
          <span>12 s · arrêt en fin de lecture</span>
        </div>
      </div>
      <div className="study-time">
        <label htmlFor="study-camera">Mouvement caméra <span className="study-timestamp">{Math.round((reducedMotion ? 0 : cameraIntensity) * 100)} %</span></label>
        <input id="study-camera" type="range" min="0" max="1" step="0.05" value={reducedMotion ? 0 : cameraIntensity} disabled={reducedMotion} onChange={e => setCameraIntensity(Number(e.target.value))} />
        <p>0 % : caméra fixe · travelling et flottement graduels</p>
      </div>
      <div className="study-accent">
        <label><input type="checkbox" checked={!reducedMotion && accentEnabled} disabled={reducedMotion} onChange={e => setAccentEnabled(e.target.checked)} /> Accent cinématique à 6 s</label>
        <p>Petite impulsion scénarisée, sans synchronisation musicale.</p>
      </div>
    </div>
    <p className="study-note">Brume sale, lumières fatiguées, matière instable. {reducedMotion ? 'Mouvement réduit actif : lecture animée et caméra désactivées ; exploration manuelle disponible.' : 'Lancez la démo pour voir la vapeur, la pluie et le parallax. Le curseur permet de figer chaque image.'} Étude M1 en 2D, indépendante de la musique.</p>
    <ul className="scene-roadmap" aria-label="Scènes prévues"><li><span className="scene-index">01</span><strong>Industrial City</strong><span>Étude M1</span></li><li><span className="scene-index">02</span><strong>PS1 Nightmare</strong><span>Prévu M2</span></li><li><span className="scene-index">03</span><strong>Rave Dungeon</strong><span>Prévu M2</span></li><li><span className="scene-index">04</span><strong>Digital Void</strong><span>Prévu M2</span></li></ul>
  </section>;
}
