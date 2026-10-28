import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { createTherapyScene } from './therapyScene';
import { ROOM_DURATION, type RoomView } from './roomMotion';
import { PENDULUM_PUSH } from './cameraPresets';
import { createPsychedelicPass } from './psychedelicPass';
import type { RoomLighting } from './roomLighting';

export default function TherapyRoom() {
  const host = useRef<HTMLDivElement>(null);
  const renderAt = useRef<(() => void) | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [intensity, setIntensity] = useState(0.6);
  const [psychedelia, setPsychedelia] = useState(0.45);
  const [lighting, setLighting] = useState<RoomLighting>('blood-red');
  const [view, setView] = useState<RoomView>('conversation');
  const [cameraMode, setCameraMode] = useState<'room' | 'pendulum'>('room');
  const [shotTime, setShotTime] = useState(0);
  const [shotDuration, setShotDuration] = useState(PENDULUM_PUSH.defaultDurationSeconds);
  const [playbackRevision, setPlaybackRevision] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const current = useRef({ time, intensity, view, cameraMode, shotTime, shotDuration, psychedelia, lighting });
  current.current = { time, intensity: reducedMotion ? 0 : intensity, view, cameraMode, shotTime, shotDuration, psychedelia, lighting };

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
    const lookPass = createPsychedelicPass(renderer, room.scene, room.camera);
    let contextLost = false;
    const draw = () => {
      if (contextLost) return;
      const value = current.current;
      const shot = value.cameraMode === 'pendulum' ? { presetId: PENDULUM_PUSH.id, timeSeconds: value.shotTime, durationSeconds: value.shotDuration } : undefined;
      room.update(shot ? value.shotTime : value.time, value.intensity, value.view, shot, value.psychedelia, value.lighting);
      lookPass.render(shot ? value.shotTime : value.time, value.lighting === 'blood-red' ? 0 : value.psychedelia, value.intensity);
    };
    renderAt.current = draw;
    const resize = () => {
      const width = Math.max(1, Math.min(target.clientWidth, 1200));
      const height = width * 0.625;
      renderer.setSize(width, height, false);
      room.camera.aspect = width / height; room.camera.updateProjectionMatrix(); lookPass.resize(width, height); draw();
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
      lookPass.dispose(); room.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, [attempt]);

  useEffect(() => { renderAt.current?.(); }, [time, view, intensity, reducedMotion, cameraMode, shotTime, shotDuration, psychedelia, lighting]);
  useEffect(() => {
    if (!playing || reducedMotion || !ready) return;
    const isShot = cameraMode === 'pendulum';
    const origin = isShot ? current.current.shotTime : current.current.time;
    const end = isShot ? shotDuration : ROOM_DURATION;
    let start: number | undefined, request = 0;
    const tick = (timestamp: number) => {
      start ??= timestamp;
      const next = Math.min(end, origin + (timestamp - start) / 1000);
      // Cap updates to 24 fps without integrating deltas into the scene state.
      const displayed = next >= end ? end : origin + Math.floor((next - origin) * 24) / 24;
      if (isShot) setShotTime(displayed); else setTime(displayed);
      if (next >= end) setPlaying(false); else request = requestAnimationFrame(tick);
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [playing, reducedMotion, ready, cameraMode, shotDuration, playbackRevision]);

  const startShot = (replay = false) => {
    if (replay || cameraMode !== 'pendulum' || shotTime >= shotDuration) setShotTime(0);
    setCameraMode('pendulum'); setPlaying(true); setPlaybackRevision(n => n + 1);
  };
  const restoreCamera = () => { setPlaying(false); setCameraMode('room'); };

  return <section className="therapy-room" aria-labelledby="therapy-title">
    <div className="study-heading">
      <div><span className="eyebrow">PROTOTYPE / SESSION 001</span><h2 id="therapy-title">Techno Therapy Room<span className="accent">.</span></h2></div>
      <span className="study-badge">LOW-POLY 3D / AFTER HOURS</span>
    </div>
    <div className="therapy-viewport" ref={host} data-ready={ready ? 'true' : 'false'} />
    {error && <div className="therapy-error" role="alert"><p>{error}</p><button onClick={() => setAttempt(n => n + 1)}>Réessayer la 3D</button></div>}
    <div className="stage-caption"><span>DEUX FAUTEUILS. UNE PRÉSENCE.</span><span>ÉTUDE 3D PROCÉDURALE</span></div>
    <div className="study-controls">
      <div><label htmlFor="room-view">Point de vue</label><select id="room-view" value={view} onChange={e => { setView(e.target.value as RoomView); restoreCamera(); }}><option value="conversation">Face à face</option><option value="divan">Depuis le divan</option></select></div>
      <div className="study-time"><label htmlFor="room-time">Instant de la pièce <span className="study-timestamp">{time.toFixed(2)} s</span></label><input id="room-time" type="range" min="0" max={ROOM_DURATION} step={1 / 24} value={time} onChange={e => { setPlaying(false); setCameraMode('room'); setTime(Number(e.target.value)); }} /><div className="study-playback"><button disabled={!ready || reducedMotion || cameraMode === 'pendulum'} onClick={() => { if (!playing && time >= ROOM_DURATION) setTime(0); setPlaying(p => !p); }}>{playing && cameraMode === 'room' ? 'Pause de la pièce' : 'Animer la pièce'}</button><span>30 s · animation indépendante du morceau</span></div></div>
      <div className="study-time"><label htmlFor="room-intensity">Étrangeté <span className="study-timestamp">{Math.round((reducedMotion ? 0 : intensity) * 100)} %</span></label><input id="room-intensity" type="range" min="0" max="1" step="0.05" value={reducedMotion ? 0 : intensity} disabled={reducedMotion} onChange={e => setIntensity(Number(e.target.value))} /></div>
      <div><label htmlFor="room-lighting">Ambiance</label><select id="room-lighting" value={lighting} onChange={e => setLighting(e.target.value as RoomLighting)}><option value="blood-red">Rouge sang</option><option value="classic">Classique / psychédélique</option></select><p className="room-description">Éclairage cramoisi, ombres bordeaux et reflets rouges. La pièce, les caméras et le lecteur sont conservés.</p></div>
      <div className="study-time"><label htmlFor="room-psychedelia">Psychédélisme <span className="study-timestamp">{Math.round(psychedelia * 100)} %</span></label><input id="room-psychedelia" type="range" min="0" max="1" step="0.05" value={psychedelia} disabled={lighting === 'blood-red'} onChange={e => setPsychedelia(Number(e.target.value))} /><p>{lighting === 'blood-red' ? 'Traitement mis de côté : choisissez Classique / psychédélique pour le retrouver.' : '0 % : rendu initial · halo, dérive chromatique et ombres colorées.'} Étrangeté règle les mouvements ; le mode réduit conserve uniquement le traitement statique.</p></div>
      <p className="room-description">Cuir bordeaux, bois sombre, lumière de fin de séance. Un pendule hésite, un livre se soulève, le mobilier respire à peine. {reducedMotion ? 'Mouvement réduit : pièce immobile, exploration manuelle disponible.' : 'Lancez l’animation ou explorez un instant précis.'}</p>
    </div>
    <fieldset className="camera-shot" aria-describedby="pendulum-help">
      <legend>Pendulum Push</legend>
      <p id="pendulum-help">Travelling physique du plan large au pendule, focale constante. Aucun déclenchement audio. {cameraMode === 'pendulum' ? 'Travelling sélectionné.' : 'Caméra de la pièce sélectionnée.'}</p>
      <div className="study-controls">
        <div className="study-time">
          <label htmlFor="shot-duration">Durée du travelling <span className="study-timestamp">{shotDuration.toFixed(1)} s</span></label>
          <input id="shot-duration" type="range" min="2" max="30" step="0.5" value={shotDuration} onChange={e => {
            const duration = Number(e.target.value); setPlaying(false);
            setShotTime(value => value / shotDuration * duration); setShotDuration(duration);
          }} />
        </div>
        <div className="study-time">
          <label htmlFor="shot-time">Timeline Pendulum Push <span className="study-timestamp">{shotTime.toFixed(2)} / {shotDuration.toFixed(1)} s</span></label>
          <input id="shot-time" type="range" min="0" max={shotDuration} step="0.01" value={shotTime} onChange={e => {
            setPlaying(false); setCameraMode('pendulum'); setShotTime(Number(e.target.value));
          }} />
        </div>
      </div>
      <div className="camera-shot-actions">
        <button aria-label="Play Pendulum Push" disabled={!ready || reducedMotion || (playing && cameraMode === 'pendulum')} onClick={() => startShot()}>Play</button>
        <button aria-label="Pause Pendulum Push" disabled={!playing || cameraMode !== 'pendulum'} onClick={() => setPlaying(false)}>Pause</button>
        <button aria-label="Replay Pendulum Push" disabled={!ready || reducedMotion} onClick={() => startShot(true)}>Replay</button>
        <button disabled={cameraMode === 'room'} onClick={restoreCamera}>Revenir à la caméra initiale</button>
      </div>
      <p className="study-note">Étrangeté anime le pendule indépendamment du travelling. Le retour restaure le point de vue et l’instant de la pièce précédents. {reducedMotion && 'Mouvement réduit : lecture désactivée, timeline manuelle disponible.'}</p>
    </fieldset>
    <p className="study-note">Prototype visuel autonome. Pas encore de synchronisation musicale ou d’export vidéo. Le tapis est une forme textile procédurale évoquant une peau, sans asset animal.</p>
  </section>;
}
