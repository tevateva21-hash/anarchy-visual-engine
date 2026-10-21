# M1 — Assombrir Industrial City et animer la caméra rétro

Industrial City conserve sa composition industrielle mais adopte une atmosphère console 90s plus sale et brumeuse. Les palettes désaturées, façades usées, nappes de brume, vapeur, pluie et lumières irrégulières remplacent le rendu trop propre. Aucun asset du jeu Silent Hill n’est utilisé.

La démo dispose maintenant de lecture/pause, d’un mouvement caméra réglable (travelling, parallax, sway et micro-tremblement) et d’un accent scénarisé optionnel à 6 secondes. Chaque image est calculée depuis un instant explicite ; le curseur permet de retrouver les mêmes pixels. La lecture s’arrête à 12 secondes. Le mode mouvement réduit arrête l’animation et neutralise caméra et accent.

L’import MP3/WAV, le lecteur, la waveform, l’analyse Worker et le cache sont conservés. La démo reste indépendante du morceau ; aucun travail M2, moteur 3D ou mapping audio-visuel n’est introduit.

## Validation

- `pnpm build` : TypeScript strict et build Vite réussis.
- `pnpm test` : 25 tests Vitest réussis.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e` : 9 tests Playwright réussis avec Chromium système.
- Tests : caméra nulle et offsets bornés, parallax, répétabilité après seek, lecture/pause, fin/reprise, accent et changement de préférence de mouvement réduit ; parcours audio, cache et import conservés.

## Vérification manuelle

Depuis la branche de cette PR : `pnpm install --frozen-lockfile`, puis `pnpm dev`. Ouvrir l’adresse Vite, cliquer **Animer la démo**, ajuster **Mouvement caméra** et tester **Accent cinématique à 6 s**. Importer un MP3/WAV et vérifier lecteur, waveform et seek. L’animation est désactivée lorsque le système demande un mouvement réduit.

## Intégration

Base : `main`. Source : `feature/retro-art-direction`. La branche source prolonge le commit M1 déjà présent dans main. Cette PR prépare la revue ; elle ne fusionne pas automatiquement les changements.

La reproductibilité vérifiée concerne un même runtime et des entrées identiques. Le rendu reste un Canvas 2D 320×180 sans lissage, avec des offsets entiers volontairement irréguliers ; aucune équivalence avec un export vidéo n’est revendiquée.
