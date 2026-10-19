import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createAudioFeatureAccessor } from '@anarchy/audio-analysis';
import type { AudioAnalysis } from '@anarchy/contracts';
import { importAudio } from './importAudio';
import { clearAnalysisCache } from './cache';
import { Waveform } from './Waveform';
import './style.css';

function App() {
  const [analysis, setAnalysis] = useState<AudioAnalysis>();
  const [url, setUrl] = useState<string>();
  const [name, setName] = useState('');
  const [status, setStatus] = useState('Importez un morceau pour commencer.');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [busy, setBusy] = useState(false);
  const [time, setTime] = useState(0);
  const controller = useRef<AbortController | null>(null);
  const player = useRef<HTMLAudioElement>(null);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => controller.current?.abort(), []);
  const load = async (file: File) => {
    controller.current?.abort();
    const current = new AbortController(); controller.current = current;
    player.current?.pause(); setUrl(undefined); setAnalysis(undefined); setTime(0);
    setBusy(true); setError(''); setWarning(''); setName(file.name);
    try {
      const result = await importAudio(file, current.signal, setStatus);
      if (current.signal.aborted) return;
      setAnalysis(result.analysis); setUrl(URL.createObjectURL(file));
      setWarning(result.cacheWarning ?? '');
      setStatus(result.cached ? 'Analyse prête — cache local.' : 'Analyse prête — calculée hors ligne.');
    } catch (cause) {
      if (!current.signal.aborted) { setError(cause instanceof Error ? cause.message : 'Import impossible.'); setStatus('Import interrompu.'); }
    } finally { if (controller.current === current) setBusy(false); }
  };
  const features = analysis ? createAudioFeatureAccessor(analysis).getAudioFeaturesAt(time) : undefined;
  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-12">
    <header><p className="text-sm font-semibold tracking-widest text-violet-400">ANARCHY VISUAL ENGINE</p><h1 className="mt-3 text-4xl font-bold">Le son, sous la surface.</h1><p className="mt-3 text-slate-300">Analyse audio locale · RMS, bandes de fréquences et transitoires.</p></header>
    <section className="panel space-y-4" aria-label="Import audio">
      <label className="block font-semibold" htmlFor="audio-file">Importer un MP3 ou WAV</label>
      <input id="audio-file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav" disabled={busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void load(file); }} />
      <p className="text-sm text-slate-400">50 Mio · 5 minutes maximum · Mono ou stéréo. Aucun fichier n’est envoyé à un serveur.</p>
      <p role="status" aria-live="polite">{status}</p>
      {busy && <button onClick={() => { controller.current?.abort(); setBusy(false); setStatus('Import annulé.'); }}>Annuler</button>}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {warning && <p className="text-amber-300">{warning}</p>}
    </section>
    {analysis && features && <section className="panel space-y-5" aria-label="Résultats de l’analyse">
      <h2 className="break-all text-xl font-semibold">{name}</h2>
      <p className="text-sm text-slate-400">{analysis.durationSeconds.toFixed(2)} s · {analysis.sampleRateHz} Hz · {analysis.channelCount} canal(aux) · {analysis.timestamps.length} fenêtres</p>
      <Waveform analysis={analysis} time={time} />
      <audio ref={player} className="w-full" controls src={url} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onSeeked={e => setTime(e.currentTarget.currentTime)} />
      <label className="block" htmlFor="position">Position d’analyse : {time.toFixed(2)} s</label>
      <input id="position" className="w-full" type="range" min="0" max={analysis.durationSeconds} step="0.01" value={time} onChange={e => { const t = Number(e.target.value); setTime(t); if (player.current) player.current.currentTime = t; }} />
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">{([['RMS', features.rms], ['Basses', features.bass], ['Médiums', features.mid], ['Aigus', features.treble], ['Transitoires', features.spectralFlux]] as const).map(([label, value]) => <div key={label} className="rounded-xl bg-slate-950 p-4"><dt className="text-sm text-slate-400">{label}</dt><dd className="mt-2 font-mono" data-testid={label}>{value.toFixed(5)}</dd><meter aria-label={label} className="mt-3 w-full" min={0} max={1} value={Math.min(1, label === 'RMS' ? value : Math.sqrt(value))} /></div>)}</dl>
      <p className="text-sm text-slate-400">Énergies brutes (amplitude²), flux spectral positif ; interpolation linéaire entre les fenêtres. Les jauges d’énergie utilisent une racine carrée pour la lisibilité.</p>
    </section>}
    <footer className="space-y-3 text-sm text-slate-400"><p>Le cache garde uniquement les analyses, jusqu’à 5 morceaux, expirés après 30 jours sans accès. Réimportez le fichier pour l’écouter après un rechargement.</p><button onClick={async () => { try { await clearAnalysisCache(); setWarning('Cache local vidé.'); } catch { setWarning('Impossible de vider le cache local.'); } }}>Vider le cache local</button></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
