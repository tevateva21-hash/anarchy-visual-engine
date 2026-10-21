# Anarchy Visual Engine — roadmap rétro

Statut de publication : **descriptions prêtes à publier**, aucun milestone, issue ou Project créé sur GitHub. L’API `api.github.com` renvoie « Forbidden » lors de la vérification du 21 octobre 2026. Les identifiants ci-dessous sont des références documentaires, pas des numéros GitHub.

## État et plan incrémental

Base conservée : import MP3/WAV, analyse Web Audio/Worker, cache IndexedDB, waveform, lecteur et seek du Sprint 2. Ces capacités ne sont pas à reconstruire. Manquent encore moteur de scènes, mappings audio-visuels, presets persistants et export vidéo.

Pour M1 : adapter architecture et consignes ; poser la direction graphique autour de l’interface existante ; ajouter une étude Industrial City sans dépendance audio ; définir les contrats des futurs presets ; valider rendu, responsive et non-régression audio. Les milestones suivants sont planifiés, sans implémentation dans cette branche.

| Milestone (titre GitHub) | Dépendances | Livraison |
| --- | --- | --- |
| M1 Retro Art Direction | Sprint 2 existant | Étude pixel-art et langage visuel ; implémenté localement |
| M2 Retro Scene Engine | M1 | Quatre scènes et adaptateurs 2D/low-poly |
| M3 Audio Reactive System | M2 + analyse existante | Réactivité musicale scénographique |
| M4 Preset & Random Engine | M2–M3 | Presets, contraintes, locks, seeds et persistance |
| M5 Video Export Engine | M2–M4 | MP4 H.264/AAC reproductible |
| M6 Advanced Generative Studio | M5 | Séquences, automation et production avancée |

Chaque section suivante est une description de milestone et contient les issues à lui associer. Les cases expriment des critères d’acceptation, pas un statut GitHub. Labels suggérés : `retro`, `audio`, `engine`, `presets`, `export`, `studio`, `test`.

## M1 Retro Art Direction

Description : adapter le studio existant à une identité rétro sombre, industrielle, étrange et cinématographique, avec une première étude 16-bit Industrial City. Définir la future famille PS1 sans implémenter son moteur.

### M1-01 — Établir le langage graphique du studio

Labels : `retro`, `studio`. Conserver les flux existants ; documenter composition, palettes, typographie et textures.

- [ ] Palette charbon/ambre et variantes limitées ; contraste lisible, hiérarchie et focus clavier visibles.
- [ ] Aucun égaliseur générique comme scène principale ; références industrielles et profondeur perceptible.
- [ ] Lecteur, import, seek, waveform, indicateurs et cache restent accessibles.
- [ ] Interface sans débordement horizontal à 375 px et adaptée au bureau ; aucune police distante.

### M1-02 — Ajouter une étude Industrial City basse résolution

Labels : `retro`, `test`. Première démonstration artistique, indépendante de l’analyse audio.

- [ ] Canvas intrinsèque 320×180, nearest-neighbor, aucun lissage ; silhouettes industrielles, tramage et lumière rare.
- [ ] Étude visible sans fichier, palettes sélectionnables et instant explicite ; lecture/pause sur demande, aucune lecture automatique au chargement. Correction M1 : brume sale, matières PS1 90s et parallax caméra réglable ; mouvement réduit respecté.
- [ ] Une même palette et un même instant redonnent les mêmes pixels, y compris après seek.
- [ ] Pas de Randomize complet, moteur PS1, sauvegarde ou export vidéo ; portée M1 indiquée dans l’interface.

### M1-03 — Définir les contrats futurs et vérifier la non-régression

Labels : `presets`, `test`.

- [ ] Types versionnés : scènes, palettes, caméras, effets, intensité, seed, locks et contraintes de compatibilité.
- [ ] Caméra/style discriminés ; pas de promesse de validation runtime ou de randomisation implémentée.
- [ ] Vitest, build et parcours Playwright existants passent ; tests visuels sur pixels, palettes et répétabilité.
- [ ] Architecture, AGENTS, documentation et description de PR à jour.

## M2 Retro Scene Engine

Description : extraire un moteur de scènes sans React, avec rendu par image et adaptateurs selon le style.

### M2-01 — Industrial City et Digital Void en pixel art

Labels : `engine`, `retro`.

- [ ] Scènes distinctes, jouables et identifiées ; géométrie et coordonnées normalisées ou résolution logique explicite.
- [ ] Rendu d’une image arbitraire sans historique ; même configuration et temps = même résultat dans une toolchain figée.
- [ ] Tests de seeks hors ordre et ressources exclusivement locales.

### M2-02 — PS1 Nightmare et Rave Dungeon low-poly

Labels : `engine`, `retro`.

- [ ] Quatre scènes cibles disponibles au total ; PS1 Nightmare et Rave Dungeon ont géométrie anguleuse, textures restreintes et éclairage sombre.
- [ ] Choix Canvas/WebGL/Three.js justifié ; pas de dépendance GPU imposée aux scènes 2D.
- [ ] Budgets géométriques et textures mesurés ; effets PS1 paramétrables sans dépendre du framerate.

### M2-03 — Unifier rendu et temps

Labels : `engine`, `test`.

- [ ] API frame/config/temps commune et versions épinglées ; aucune horloge système ni état implicite dans le moteur.
- [ ] Capture attend textures, dessin et ressources ; tests de référence visuelle tolérants et gestion des ressources perdues.

## M3 Audio Reactive System

Description : transformer les caractéristiques existantes en comportements de scènes, sans réduire le morceau à des barres d’égaliseur.

### M3-01 — Définir les mappings musicaux

Labels : `audio`, `engine`.

- [ ] Basses, RMS, médiums, aigus et transitoires pilotent lumières, brouillard, caméra ou événements de scène avec intensité bornée.
- [ ] Lissage et enveloppes calculés depuis la chronologie source, sans accumulation de deltas.
- [ ] Silence, attaques et signaux synthétiques donnent des résultats attendus et documentés.

### M3-02 — Synchroniser aperçu, pause et seek

Labels : `audio`, `test`.

- [ ] La position du lecteur est l’horloge source ; pause/seek et lecture hors ordre conservent la même scène au même temps.
- [ ] Les analyses figées et `getAudioFeaturesAt` sont réutilisés ; aucune analyse divergente introduite.
- [ ] Modes de mouvement réduit et intensité sûre disponibles ; les scènes restent lisibles à faible énergie.

## M4 Preset & Random Engine

Description : passer des contrats M1 à un système validé de presets reproductibles et persistants.

### M4-01 — Presets configurables et compatibilité

Labels : `presets`, `engine`.

- [ ] Palette, caméra, effets et intensité éditables avec schémas runtime versionnés.
- [ ] Règles explicites interdisent les combinaisons incohérentes ; erreurs expliquées, aucun changement silencieux d’un lock.
- [ ] Tests couvrent chaque règle et configurations impossibles ; migrations définies.

### M4-02 — Randomize avec seed et verrous individuels

Labels : `presets`, `test`.

- [ ] PRNG et ordre de tirage versionnés ; même seed + entrées + locks = même configuration complète.
- [ ] Chaque paramètre peut être verrouillé ; ses valeurs sont préservées après Randomize.
- [ ] Contraintes résolues sans boucle infinie ; impossibilité signalée ; tests sur un corpus de seeds.

### M4-03 — Sauvegarder et charger les configurations

Labels : `presets`, `studio`.

- [ ] Export/import JSON et stockage local, validation stricte et migrations ; round-trip sans perte.
- [ ] Aucun secret, chemin hôte ou URL arbitraire ; seed, versions et locks inclus.
- [ ] Configurations corrompues/incompatibles refusées avec message utile.

## M5 Video Export Engine

Description : rendre le même contenu que l’aperçu sous forme MP4 H.264 avec audio AAC.

### M5-01 — Transport local des assets et jobs

Labels : `export`, `engine`.

- [ ] Téléversement explicite du fichier original et de l’analyse au service Node local, hashes vérifiés ; aucune URL blob transmise comme fichier serveur.
- [ ] API avec contrôle d’origine/session, quotas, annulation, progression et nettoyage ; pas de chemin utilisateur ou commande shell arbitraire.
- [ ] États de jobs validés et reprise après redémarrage clairement définie.

### M5-02 — Rendu Remotion/FFmpeg et synchronisation

Labels : `export`, `audio`, `test`.

- [ ] Extrait en samples, FPS rationnels, configuration/analyses figées et versions partagées avec l’aperçu.
- [ ] MP4 H.264/AAC validé par ffprobe : dimensions, durée, FPS et codecs ; FFmpeg lancé sans shell.
- [ ] Images clés comparées à l’aperçu et test d’impulsions audio/visuelles dans une tolérance mesurée et documentée.
- [ ] Priming AAC, délai MP3, divergence de décodeur et licences des outils traités explicitement.

## M6 Advanced Generative Studio

Description : étendre le workflow de production après validation des fondations d’export.

### M6-01 — Séquences et automation

Labels : `studio`, `presets`.

- [ ] Timeline multi-scènes avec transitions et automation évaluées au temps source.
- [ ] Projet versionné sauvegardable ; undo/redo et réouverture sans perte.
- [ ] Une frame hors ordre et son export sont cohérents avec l’aperçu.

### M6-02 — Production et exploration avancées

Labels : `studio`, `export`, `test`.

- [ ] Variations contraintes et exports batch sans modifier les configurations originales.
- [ ] Annulation, budgets mémoire/disque et récupération d’erreurs couverts par tests.
- [ ] Parcours clavier, accessibilité et performances mesurés sur des projets représentatifs.

## Project de suivi prêt à créer

Titre : **Anarchy Visual Engine — Retro Studio**. Description : suivre la transformation incrémentale du studio audio existant en générateur rétro audio-réactif, sans perdre les capacités du Sprint 2.

Champs : `Status` (Backlog, Ready, In progress, In review, Done), `Milestone` (M1–M6), `Priority` (P0, P1, P2), `Area` (Art, Audio, Engine, Presets, Export, Studio), `Depends on` (références documentaires). Vues : tableau par statut, liste par milestone, liste des dépendances bloquantes. Ajouter toutes les issues ci-dessus, sans convertir leur référence documentaire en numéro GitHub inventé.

Ordre de publication : créer les six milestones avec leurs descriptions ; créer les issues de chaque section avec leurs critères et labels ; relier les dépendances ; créer le Project et y ajouter les issues. M1 est prêt pour revue locale ; M2–M6 restent Backlog. Ne passer M1 à Done qu’après revue, intégration et validation du résultat.
