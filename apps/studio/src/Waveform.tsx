import { useEffect, useRef } from 'react';
import type { AudioAnalysis } from '@anarchy/contracts';
export function Waveform({ analysis, time }: { analysis: AudioAnalysis; time: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const draw = () => {
      const width = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
      const height = 180, dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr; canvas.height = height * dpr;
      const ctx = canvas.getContext('2d'); if (!ctx) return;
      ctx.scale(dpr, dpr); ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#8b5cf6'; ctx.beginPath();
      const count = analysis.timestamps.length;
      for (let x = 0; x < width; x++) {
        const start = Math.min(count - 1, Math.floor(x * count / width));
        const end = Math.min(count, Math.max(start + 1, Math.floor((x + 1) * count / width)));
        let min = 1, max = -1;
        for (let i = start; i < end; i++) { min = Math.min(min, analysis.waveformMin[i]); max = Math.max(max, analysis.waveformMax[i]); }
        ctx.moveTo(x, height / 2 - max * 80); ctx.lineTo(x, height / 2 - min * 80);
      }
      ctx.stroke(); ctx.strokeStyle = '#34d399'; ctx.beginPath();
      const cursor = Math.min(width - 1, Math.max(0, time / analysis.durationSeconds * width));
      ctx.moveTo(cursor, 0); ctx.lineTo(cursor, height); ctx.stroke();
    };
    draw(); const observer = new ResizeObserver(draw); observer.observe(canvas);
    return () => observer.disconnect();
  }, [analysis, time]);
  return <canvas ref={ref} className="h-[180px] w-full rounded-xl" role="img" aria-label="Waveform du morceau : enveloppe des pics minimum et maximum" />;
}
