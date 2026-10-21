import { useEffect, useRef, useState } from 'react';
import type { PaletteId } from '@anarchy/contracts';
import { drawIndustrialStudy, STUDY_FPS, STUDY_LAST_FRAME, STUDY_PALETTES, STUDY_SIZE } from './industrialStudy';

export function RetroStudy() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState<PaletteId>('furnace-amber');
  const [frame, setFrame] = useState(48);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (context) {
      context.imageSmoothingEnabled = false;
      drawIndustrialStudy(context, palette, frame);
    }
  }, [palette, frame]);
  return <section className="retro-study" aria-labelledby="study-title">
    <div className="study-heading"><div><span className="eyebrow">M1 / ÉTUDE VISUELLE 001</span><h2 id="study-title">Industrial City<span className="accent">.</span></h2></div><span className="study-badge">16-BIT / PIXEL ART</span></div>
    <div className="study-stage">
      <canvas ref={canvas} width={STUDY_SIZE.width} height={STUDY_SIZE.height} role="img" aria-label="Étude pixel-art Industrial City : usines, grue et viaduc sous une éclipse" />
      <div className="stage-caption"><span>SECTEUR 09 — APRÈS LA DERNIÈRE RAME</span><span>320 × 180</span></div>
    </div>
    <div className="study-controls">
      <div><label htmlFor="study-palette">Palette de l’étude</label><select id="study-palette" value={palette} onChange={e => setPalette(e.target.value as PaletteId)}>{STUDY_PALETTES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="palette-strip" aria-hidden="true">{(() => { const p = STUDY_PALETTES.find(p => p.id === palette)!; return [p.shadow, p.structure, p.face, p.haze, p.glow, p.light].map(color => <span key={color} style={{ backgroundColor: color }} />); })()}</div></div>
      <div className="study-time"><label htmlFor="study-frame">Instant de l’étude <span className="study-timestamp">{(frame / STUDY_FPS).toFixed(2)} s</span></label><input id="study-frame" type="range" min="0" max={STUDY_LAST_FRAME} step="1" value={frame} onChange={e => setFrame(Number(e.target.value))} /><p>Image {frame} / {STUDY_LAST_FRAME} · temps indépendant du lecteur</p></div>
    </div>
    <p className="study-note">Une ville qui ne dort plus. Une lumière qui persiste. Étude autonome, sans animation automatique ni réactivité musicale à ce stade.</p>
    <ul className="scene-roadmap" aria-label="Scènes prévues"><li><span className="scene-index">01</span><strong>Industrial City</strong><span>Étude M1</span></li><li><span className="scene-index">02</span><strong>PS1 Nightmare</strong><span>Prévu M2</span></li><li><span className="scene-index">03</span><strong>Rave Dungeon</strong><span>Prévu M2</span></li><li><span className="scene-index">04</span><strong>Digital Void</strong><span>Prévu M2</span></li></ul>
  </section>;
}
