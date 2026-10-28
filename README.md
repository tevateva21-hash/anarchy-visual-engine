# Anarchy Visual Engine

**Techno Therapy Room** est le nouveau prototype principal : salle de psychologie low-poly 3D en Three.js, sombre et stylisée, avec lecture/pause, poses temporelles, mouvements subtils et deux points de vue. Industrial City reste accessible depuis le sélecteur. Import MP3/WAV, analyse Web Audio/Worker, waveform, lecteur et cache sont conservés. Les scènes sont autonomes ; pas encore de synchronisation musicale ni export vidéo.

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

Voir [le prototype 3D et ses contrôles](docs/techno-therapy-room.md). WebGL 2 est nécessaire pour la pièce. Pour les tests Chromium sans GPU : ajouter `PLAYWRIGHT_SOFTWARE_WEBGL=1` aux variables de la commande e2e.

Travelling **Pendulum Push** : [instructions et limites](docs/pendulum-push.md). Dans Techno Therapy Room, cliquer **Play** dans le bloc Pendulum Push ; durée initiale 8 s, réglable entre 2 et 30 s, avec Pause, Replay, timeline et retour à la caméra précédente. Aucun déclenchement audio.

Traitement d’image : [Psychédélisme réglable](docs/psychedelic-treatment.md). Comparer 0 % (rendu initial), 45 % (discret) et 100 % ; Étrangeté module les mouvements plus rapides de l’horloge et du pendule. Audio et Pendulum Push restent indépendants.

Ambiance actuelle : **Rouge sang**, appliquée aux lumières et matériaux de la pièce. La variante **Classique / psychédélique** reste disponible dans le sélecteur Ambiance. [Détails et préservation de la variante précédente](docs/blood-red-room.md).

État des milestones : [avancement réel daté dans ROADMAP.md](ROADMAP.md#avancement-réel--28-octobre-2026). La version Rouge sang et la variante psychédélique se testent depuis `feature/pendulum-camera`, sans nécessiter de fusion dans main. Voir [les commandes Codespaces](docs/blood-red-room.md#tester-la-branche-github).
