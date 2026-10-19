import { analyzePCM } from '@anarchy/audio-analysis';
import type { AnalysisRequest, AnalysisResponse } from '@anarchy/contracts';
const send = (message: AnalysisResponse) => self.postMessage(message);
self.onmessage = ({ data }: MessageEvent<AnalysisRequest>) => {
  try {
    const analysis = analyzePCM(data, fraction => send({ type: 'progress', fraction }));
    send({ type: 'complete', analysis });
  } catch (error) {
    send({ type: 'error', message: error instanceof Error ? error.message : 'Analyse impossible.' });
  }
};
