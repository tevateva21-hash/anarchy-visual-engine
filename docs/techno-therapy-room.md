# Techno Therapy Room — premier prototype 3D

## Base et portée

Branche `feature/techno-therapy-3d`, créée depuis le main distant `25de02b`. Le prototype conserve les fonctions du studio et donne la priorité au low-poly 3D, sans reconstruire l’application. Industrial City reste disponible via le sélecteur de scène ; sa correction PS1 se trouve toujours dans la branche séparée et n’est pas incorporée ici.

La pièce est une salle de psychologie classique, élégante et inquiétante : deux fauteuils en cuir bordeaux, un divan, des boiseries, une bibliothèque, deux lampes, une image abstraite originale, une horloge, une table et un tapis angulaire évoquant une peau. Les formes sont procédurales et facettées, les couleurs sourdes et les matériaux mats. Aucun modèle, texture, police ou asset animal externe n’est téléchargé.

Un léger déplacement du coussin, une oscillation du pendule, un livre qui se soulève, une image qui penche, une lumière qui varie doucement et une dérive lente de caméra donnent à l’ensemble une présence étrange. Pas de néon, flash, effet égaliseur ou simulation photoréaliste.

## Utilisation

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir l’adresse annoncée par Vite. **Techno Therapy Room** est la vue principale. **Animer la pièce** lance une étude de 30 secondes ; **Pause de la pièce** et **Instant de la pièce** permettent de figer et consulter une pose. **Étrangeté** contrôle l’amplitude des mouvements. À zéro, les poses et la caméra sont fixes. **Point de vue** propose Face à face et Depuis le divan. Une nouvelle lecture en fin de séquence repart à zéro, sans boucle imposée.

Le mode système de mouvement réduit désactive la lecture animée et fixe l’intensité à zéro. Les points de vue manuels restent utilisables. L’audio reste indépendant : importer un MP3/WAV, le lire et déplacer son curseur fonctionne sur les deux vues. Le changement de scène ne remplace pas l’élément audio ni sa source.

WebGL 2 est requis pour la 3D. S’il est absent ou perdu, un message explique la situation ; **Réessayer la 3D** recrée les ressources. Industrial City et le studio audio restent accessibles. Activer l’accélération graphique dans les paramètres du navigateur si nécessaire.

## Structure et limites

- `SceneShowcase.tsx` sélectionne la pièce 3D ou l’étude existante. Le module 3D est chargé à la demande via React lazy.
- `therapy/TherapyRoom.tsx` gère viewport, contrôles, lecture, préférence système, erreurs et cycle de vie GPU.
- `therapy/therapyScene.ts` construit la géométrie Three.js une fois et applique les poses. Aucun moteur générique ou registre de presets n’est ajouté.
- `therapy/roomMotion.ts` calcule une pose depuis un temps, une intensité et un point de vue explicites. Aucun hasard ni intégration de deltas dans les objets ; le RAF ne sert qu’à choisir le temps de démonstration.

Viewport borné à 1 200 pixels CSS, pixel ratio limité à 1,5, une shadow map 1 024×1 024 et des lumières d’appoint sans ombres supplémentaires. L’interface vise une cadence maximale de 24 poses/seconde. Les géométries, matériaux, shadow maps, contextes, listeners, observers et RAF sont libérés au changement de scène/démontage. Le test de répétabilité concerne la même toolchain ; les GPUs peuvent produire des pixels différents.

Le prototype n’est pas encore audio-réactif, sauvegardable en preset ou exportable en MP4. Three.js augmente le poids du studio : le chunk 3D est chargé séparément, et Vite peut signaler sa taille légèrement supérieure à 500 ko minifiés. Ce warning n’est pas un échec de build ; aucune limite n’a été relevée pour le masquer.

## Validation à exécuter

```sh
pnpm build
pnpm test
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_SOFTWARE_WEBGL=1 pnpm test:e2e
```

Le mode logiciel active SwiftShader uniquement dans le navigateur de test ; l’application utilise normalement le GPU de l’utilisateur. Tests : poses bornées/reproductibles et géométrie/disposal (Vitest), pixels effectivement rendus, viewpoints, seek, pause, audio préservé entre scènes, mobile, mouvement réduit, WebGL absent et perte/recréation du contexte (Playwright). FFmpeg reste requis pour les fixtures MP3 et l’inspection des pixels des captures.

La CI configure aussi `PLAYWRIGHT_SOFTWARE_WEBGL=1` ; ce workflow a été préparé, pas exécuté sur GitHub dans cette session.

## Fichiers ajoutés ou modifiés dans cette branche

- `.github/workflows/checks.yml`
- `AGENTS.md`
- `README.md`
- `ROADMAP.md`
- `apps/studio/package.json`
- `apps/studio/src/SceneShowcase.tsx`
- `apps/studio/src/main.tsx`
- `apps/studio/src/style.css`
- `apps/studio/src/therapy/TherapyRoom.tsx`
- `apps/studio/src/therapy/roomMotion.ts`
- `apps/studio/src/therapy/therapyScene.ts`
- `docs/architecture.md`
- `docs/techno-therapy-room.md`
- `package.json`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `tests/retro.spec.ts`
- `tests/therapy.spec.ts`
- `tests/therapy.test.ts`
