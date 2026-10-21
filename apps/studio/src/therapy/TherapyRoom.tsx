import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createTherapyScene } from './therapyScene';
import { ROOM_DURATION, type RoomView } from './roomMotion';

export default function TherapyRoom() {
  const host = useRef<HTMLDivElement>(null);
  const renderAt = useRef<(() => void) | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [intensity, setIntensity] = useState(0.6);
  const [view, setView] = useState<RoomView>('conversation');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const current = useRef({ time, intensity, view });
  current.current = { time, intensity: reducedMotion ? 0 : intensity, view };

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => { setReducedMotion(media.matches); if (media.matches) setPlaying(false); };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const target = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch {
      setError('Le rendu 3D nécessite WebGL 2. Activez l’accélération graphique du navigateur, ou choisissez Industrial City.');
      return;
    }
    setError(''); setReady(false);
    const room = createTherapyScene();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', 'Techno Therapy Room : salle de psychologie low-poly 3D');
    target.appendChild(renderer.domElement);
    let contextLost = false;
    const draw = () => {
      if (contextLost) return;
      const value = current.current;
      room.update(value.time, value.intensity, value.view);
      renderer.render(room.scene, room.camera);
    };
    renderAt.current = draw;
    const resize = () => {
      const width = Math.max(1, Math.min(target.clientWidth, 1200));
      const height = width * 0.625;
      renderer.setSize(width, height, false);
      room.camera.aspect = width / height; room.camera.updateProjectionMatrix(); draw();
    };
    const lost = (event: Event) => {
      event.preventDefault(); contextLost = true; setPlaying(false); setReady(false);
      setError('Le contexte graphique a été perdu. Réessayez ; le lecteur audio reste disponible.');
    };
    renderer.domElement.addEventListener('webglcontextlost', lost);
    const observer = new ResizeObserver(resize); observer.observe(target);
    resize(); setReady(true);
    return () => {
      renderAt.current = null; observer.disconnect();
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      room.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);

  useEffect(() => { renderAt.current?.(); }, [time, view, intensity, reducedMotion]);
  useEffect(() => {
    if (!playing || reducedMotion || !ready) return;
    const origin = current.current.time;
    let start: number | undefined, request = 0;
    const tick = (timestamp: number) => {
      start ??= timestamp;
      const next = Math.min(ROOM_DURATION, origin + (timestamp - start) / 1000);
      // Cap updates to 24 fps without integrating deltas into the scene state.
      setTime(Math.round(next * 24) / 24);
      if (next >= ROOM_DURATION) setPlaying(false); else request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, reducedMotion, ready]);

  return <section className="therapy-room" aria-labelledby="therapy-title">
    <div className="study-heading">
      <div><span className="eyebrow">PROTOTYPE / SESSION 001</span><h2 id="therapy-title">Techno Therapy Room<span className="accent">.</span></h2></div>
      <span className="study-badge">LOW-POLY 3D / AFTER HOURS</span>
    </div>
    <div className="therapy-viewport" ref={host} data-ready={ready ? 'true' : 'false'} />
    {error && <div className="therapy-error" role="alert"><p>{error}</p><button onClick={() => setAttempt(n => n + 1)}>Réessayer la 3D</button></div>}
    <div className="stage-caption"><span>DEUX FAUTEUILS. UNE PRÉSENCE.</span><span>ÉTUDE 3D PROCÉDURALE</span></div>
    <div className="study-controls">
      <div><label htmlFor="room-view">Point de vue</label><select id="room-view" value={view} onChange={e => setView(e.target.value as RoomView)}><option value="conversation">Face à face</option><option value="divan">Depuis le divan</option></select></div>
      <div className="study-time"><label htmlFor="room-time">Instant de la pièce <span className="study-timestamp">{time.toFixed(2)} s</span></label><input id="room-time" type="range" min="0" max={ROOM_DURATION} step={1 / 24} value={time} onChange={e => { setPlaying(false); setTime(Number(e.target.value)); }} /><div className="study-playback"><button disabled={!ready || reducedMotion} onClick={() => { if (!playing && time >= ROOM_DURATION) setTime(0); setPlaying(p => !p); }}>{playing ? 'Pause de la pièce' : 'Animer la pièce'}</button><span>30 s · animation indépendante du morceau</span></div></div>
      <div className="study-time"><label htmlFor="room-intensity">Étrangeté <span className="study-timestamp">{Math.round((reducedMotion ? 0 : intensity) * 100)} %</span></label><input id="room-intensity" type="range" min="0" max="1" step="0.05" value={reducedMotion ? 0 : intensity} disabled={reducedMotion} onChange={e => setIntensity(Number(e.target.value))} /></div>
      <p className="room-description">Cuir bordeaux, bois sombre, lumière de fin de séance. Un pendule hésite, un livre se soulève, le mobilier respire à peine. {reducedMotion ? 'Mouvement réduit : pièce immobile, exploration manuelle disponible.' : 'Lancez l’animation ou explorez un instant précis.'}</p>
    </div>
    <p className="study-note">Prototype visuel autonome. Pas encore de synchronisation musicale ou d’export vidéo. Le tapis est une forme textile procédurale évoquant une peau, sans asset animal.</p>
  </section>;
}
