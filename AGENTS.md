# Consignes pour les agents — Anarchy Visual Engine

## Contexte et portée

Lire `docs/architecture.md` avant toute implémentation. Le studio React/Vite et les paquets contracts/audio-analysis existent et sont fonctionnels. Préserver import MP3/WAV, lecteur, seek, waveform, analyse Worker et cache IndexedDB. Lire ROADMAP.md : implémenter uniquement le milestone demandé. Les futurs renderer et moteur de scènes ne sont pas encore disponibles.

Respecter la portée de la demande. Une tâche documentaire n’autorise pas l’installation d’un squelette applicatif, de dépendances ou de services. Utiliser le checkout existant ; les tâches cloud sont déjà isolées. Ne pas créer de worktree sauf demande explicite.

## Architecture à respecter lors de l’implémentation

- Interface : React, Vite, TypeScript strict, Tailwind CSS.
- Analyse : Web Audio API, extraction depuis PCM dans un Worker lorsque possible.
- Direction : rétro 16-bit pixel art et 32-bit low-poly PS1, sombre, industrielle, étrange et cinématographique. Pas de visualiseur égaliseur générique.
- M1 : étude Industrial City en Canvas 2D à 320×180, agrandissement nearest-neighbor sans lissage. Aucun asset ou police externe. Démonstration artistique autonome, pas encore audio-réactive.
- M2 introduira le moteur de scènes ; ajouter Three.js uniquement si les scènes low-poly le nécessitent. Les contrats de presets préparent M4 mais ne sont pas un moteur aléatoire.
- Moteur visuel partagé entre aperçu et composition Remotion, sans dépendance vers les applications.
- Rendu local : service Node, Remotion/Chromium et FFmpeg, MP4 H.264 avec AAC.
- Monorepo pnpm simple : `apps/studio`, `apps/renderer`, `packages/contracts`, `packages/audio-analysis`, `packages/visual-engine`, `packages/render-composition`.
- Valider à l’exécution les données traversant les frontières réseau/disque. Versionner analyses, presets et manifests d’export.

## Invariants à protéger

Le moteur doit produire une image depuis des entrées explicites : temps source, dimensions, analyse, seed, paramètres et versions. Ne pas utiliser `Math.random()`, l’heure système, le nombre de frames déjà affichées ni l’état accumulé du Canvas. Les seeks, les exports hors ordre et les extraits doivent conserver l’animation attendue.

Les sélections sont des intervalles semi-ouverts en samples ; les FPS sont rationnels. L’analyse reste ancrée au morceau complet et ses résultats sont figés pour l’export. Ne pas remplacer implicitement une analyse par un recalcul avec un autre décodeur.

Une URL `blob:` du studio n’est pas accessible au processus de rendu. Transférer les fichiers au service, vérifier leur hash et utiliser des références gérées. Ne jamais accepter de chemins arbitraires ou d’URL distantes comme entrées de rendu. Ne jamais journaliser de jetons, de contenu audio ou de chemins privés inutiles.

Protéger l’API locale par contrôle d’origine et session, limiter les ressources, exécuter FFmpeg sans shell et nettoyer les temporaires. Un job terminé doit référencer un artefact validé ; une annulation doit arrêter les processus enfants.

## Validation et compte rendu

Utiliser Vitest pour les caractéristiques audio, le temps, le déterminisme et les contrats ; Playwright pour les parcours utilisateur. Les changements d’export exigent un rendu court réel et un contrôle `ffprobe`, ainsi qu’un contrôle de synchronisation lorsqu’ils touchent la chronologie. Ne pas confondre présence d’un MP4 et export correct.

Pour chaque changement, exécuter les vérifications pertinentes disponibles, sans créer de tests artificiels pour une modification purement documentaire. Distinguer tests réussis, échoués et non exécutés. Signaler les limites de reproductibilité entre plateformes. Expliquer les changements de contrat et leurs migrations ; éviter les dépendances et couches supplémentaires sans besoin démontré.

Préserver les fichiers et modifications de l’utilisateur. Ne pas committer, pousser ou publier sans autorisation. Aucune valeur secrète ne doit entrer dans le dépôt.

## Travail incrémental et vérification

Ne pas recréer le projet ni remplacer le lecteur musical. Avant de coder : inspecter fichiers et changements Git, établir les capacités et manques, adapter les documents et présenter les étapes. Les scènes prévues sont Industrial City, PS1 Nightmare, Rave Dungeon et Digital Void ; ne pas présenter une scène prévue comme implémentée.

Scripts existants : `pnpm test`, `pnpm build` (TypeScript inclus), `pnpm test:e2e`. Pour Chromium système : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. Documenter navigateur et tests réellement exécutés. Vérifier aussi absence de débordement sur mobile, navigation clavier et prefers-reduced-motion. Les fonctions de dessin reçoivent leur temps explicitement ; aucune génération aléatoire complète, sauvegarde de presets ou export avant leur milestone.

Les contenus GitHub prêts à publier sont dans ROADMAP.md ; en cas de refus API, ne pas affirmer que milestones, issues, Project ou PR ont été créés.
