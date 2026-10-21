# Anarchy Visual Engine

Studio existant : import MP3/WAV et analyse audio hors ligne, waveform, lecteur et indicateurs. M1 ajoute une direction rétro industrielle et une étude Industrial City en pixel art, avec trois palettes désaturées, brume, matières sales, lecture/pause et mouvement caméra réglable (correction M1, atmosphère PS1 90s). React/Vite/TypeScript/Tailwind ; analyse indépendante dans un Worker. La démo n’est pas encore audio-réactive ; pas de Randomize complet, de sauvegarde de presets ou d’export vidéo.

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

Direction rétro : [M1 et choix artistiques](docs/retro-art-direction.md). Plan de livraison, issues et Project prêts à publier : [ROADMAP.md](ROADMAP.md).

Pour voir la correction M1 : lancer `pnpm dev`, ouvrir l’adresse Vite locale puis cliquer **Animer la démo** dans Industrial City. Le curseur **Mouvement caméra** règle le parallax ; **Accent cinématique à 6 s** ajoute une impulsion scénarisée. Le mode mouvement réduit désactive la lecture animée et la caméra.
