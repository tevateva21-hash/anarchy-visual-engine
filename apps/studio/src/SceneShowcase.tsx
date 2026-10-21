import { lazy, Suspense, useState } from 'react';
import { RetroStudy } from './retro/RetroStudy';
const TherapyRoom = lazy(() => import('./therapy/TherapyRoom'));

export function SceneShowcase() {
  const [scene, setScene] = useState<'therapy' | 'industrial'>('therapy');
  return <>
    <nav className="scene-switcher" aria-label="Choix de la scène">
      <button aria-pressed={scene === 'therapy'} onClick={() => setScene('therapy')}>Techno Therapy Room</button>
      <button aria-pressed={scene === 'industrial'} onClick={() => setScene('industrial')}>Industrial City</button>
      <span>ÉTUDES VISUELLES / AUDIO PRÉSERVÉ</span>
    </nav>
    {scene === 'therapy' ? <Suspense fallback={<p className="panel">Chargement de la pièce 3D…</p>}><TherapyRoom /></Suspense> : <RetroStudy />}
  </>;
}
