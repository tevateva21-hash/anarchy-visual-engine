# Anarchy Visual Engine

Sprint 2 : import MP3/WAV et analyse audio hors ligne, waveform et indicateurs. React/Vite/TypeScript/Tailwind ; analyse indépendante dans un Worker. Pas encore de preset visuel ni d’export vidéo.

## Développement

Node **24.19.0**, pnpm **11.25.0** (`npm install --global pnpm@11.25.0` si nécessaire).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir l’adresse annoncée par Vite dans un navigateur prenant en charge Web Audio, Workers, IndexedDB et Web Crypto. Un contexte sécurisé (HTTPS ou localhost) est nécessaire. Le fichier audio reste dans le navigateur.

```sh
pnpm test                 # Vitest : DSP, contrats, limites, cache et en-têtes
pnpm build                # TypeScript strict + build Vite
pnpm exec playwright install chromium
pnpm test:e2e             # Chromium + FFmpeg installé dans le PATH pour générer le MP3 de test
```

Pour utiliser un Chromium déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e`. Cette option n’offre pas la même reproductibilité qu’un navigateur Playwright épinglé dans le lockfile.

Dans un sandbox qui ne permet pas d’écrire sous le répertoire utilisateur, définir `XDG_DATA_HOME=/tmp/anarchy-pnpm-data` et `XDG_CACHE_HOME=/tmp/anarchy-cache` avant les commandes pnpm. Le store pnpm est local au dépôt et ignoré par Git.

Voir [l’analyse audio](docs/sprint-2-audio-analysis.md), [l’architecture cible](docs/architecture.md) et [les consignes](AGENTS.md).
