# Anarchy Visual Engine — architecture proposée

Statut : architecture cible, adaptée à la direction rétro M1 à partir du studio existant. Le Sprint 2 implémente désormais le studio et l’analyse audio partagée ; voir [les conventions et limites de cette implémentation](sprint-2-audio-analysis.md). Les autres composants restent à développer.

## Prototype actuel : Techno Therapy Room

La direction principale devient une pièce low-poly 3D sombre, élégante, psychologique et légèrement psychédélique. Le prototype est développé depuis le `main` distant au commit `25de02b` sur `feature/techno-therapy-3d` ; il ne fusionne pas la correction PS1 de la branche séparée.

Three.js est ajouté pour rendre une véritable salle en perspective : fauteuils, boiseries, lampes, tapis angulaire et objets animés. Géométries procédurales locales, matériaux mats facettés, ombres et éclairage tamisé ; aucun téléchargement de modèle ou texture. Le code demeure dans `apps/studio/src/therapy`, sans nouveau moteur générique, générateur aléatoire ou export vidéo. Les poses dérivent du temps explicite ; la pause/consultation d’un instant et le mode mouvement réduit sont pris en charge. Des limites de résolution et de pixel ratio bornent les coûts GPU.

Le studio conserve import, lecteur, waveform, analyse et cache sans modifier leurs contrats. Une sélection de vue donne accès à Techno Therapy Room (par défaut) et à Industrial City (étude historique). Changer de scène ne réinitialise ni fichier ni position audio. La pièce est autonome et ne prétend pas être déjà synchronisée au morceau ou exportable en MP4. Une erreur WebGL affiche un message et permet de réessayer ou de choisir Industrial City ; elle ne bloque pas les fonctions audio.

Le contexte, les géométries, matériaux, shadow maps, observateurs et boucles d’animation sont libérés au démontage. Une perte de contexte est traitée explicitement. Voir [le prototype et ses contrôles](techno-therapy-room.md).

## Presets caméra : Pendulum Push

`feature/pendulum-camera` part du prototype sauvegardé `4df9827`. Les contrats indépendants de Three.js (`CameraPresetDefinition`, `CameraShotState`, `CameraShotPose`) se trouvent dans `packages/contracts/src/camera.ts`. L’évaluateur local interpole un chemin de position Bézier cubique et une cible progressive avec easing smootherstep, depuis le temps absolu et une durée configurée. Le FOV existant de 48° et le zoom 1 sont inchangés. Aucun moteur d’export ou déclenchement audio n’est introduit.

La scène conserve ses objets, le pendule suspendu et ses animations. Elle accepte un état de travelling facultatif : la caméra suit le chemin au lieu de la dérive du point de vue, et oriente progressivement son regard vers la masse du pendule animée. Le prototype original reste le comportement par défaut. Les timelines de la pièce et du travelling sont distinctes et leurs lectures exclusives ; le retour restaure le point de vue et l’instant de la pièce laissés en place. Replay réinitialise explicitement l’horloge de lecture sans intégrer de deltas dans les positions. Le mode mouvement réduit interdit l’autoplay tout en gardant le seek manuel.

Les contrôles de sécurité vérifient la trajectoire contre les volumes mondiaux du mobilier réel avec une marge caméra de 16 cm, aux durées 2, 8 et 30 s et aux extrêmes d’intensité. C’est une validation du chemin prévu, pas un moteur de collision pour du mobilier éditable. Voir [la documentation et les contrôles](pendulum-push.md).

## Direction rétro et état réel après inspection

L’application existante est conservée : `apps/studio` contient l’import, le lecteur natif, le seek, la waveform et les indicateurs. `packages/audio-analysis` réalise le DSP dans un Worker ; IndexedDB garde les analyses. Les fichiers utilisateur restent locaux. Le moteur de scènes, la configuration de presets et le renderer vidéo manquent encore. La sélection actuelle est une position de lecture, pas encore un intervalle d’export.

L’identité cible est sombre, industrielle, étrange et cinématographique, inspirée de la direction Anarchy Paris : silhouettes d’usines, architecture oppressante, profondeur, lumière rare, textures tramées. Aucun égaliseur ou empilement de barres ne sert de scène. Deux langages sont prévus : pixels 16-bit à palette restreinte et géométrie 32-bit low-poly PS1. Ils ne décrivent pas une émulation matérielle exacte.

**M1 uniquement** ajoute une étude Industrial City à 320×180 en Canvas 2D, sans lissage. Le dessin reçoit un instant explicite, ne conserve aucun état entre images et ne dépend pas de l’audio. Le studio permet de choisir la palette de cette étude et son instant ; il conserve le lecteur, les données audio et le cache. Le temps de la démo est volontairement séparé de la position du morceau. Pas de Three.js, Randomize, verrouillage interactif, sauvegarde de preset ou MP4 dans M1.

Le dessin de l’étude reste dans `apps/studio/src/retro`, sans introduire prématurément le moteur générique M2. Lors de M2, il pourra être extrait vers `packages/visual-engine` sans dépendance React : `draw(context, config, sourceTime)`. L’agrandissement CSS utilise nearest-neighbor ; aucun filtre CSS animé ne doit ajouter une image dépendante de l’horloge au rendu. La démo est consultable sans importer un fichier et sans animation automatique.

Les contrats de presets dans `packages/contracts/src/presets.ts` décrivent les quatre scènes cibles, palettes, styles, caméras discriminées selon le style, effets, intensité, seed uint32, chemins verrouillables et règles de compatibilité déclaratives. Ce sont des contrats de conception : la validation runtime, la résolution des contraintes, le PRNG versionné, la sérialisation JSON et les migrations seront réalisés en M4. Aucun JSON utilisateur ne doit être considéré valide du seul fait de ces types TypeScript. Les instantanés complets de configuration et les versions seront des entrées communes de l’aperçu et de l’export M5.

Plan incrémental et critères détaillés : [ROADMAP.md](../ROADMAP.md). M2 prépare les quatre scènes ; M3 branche les caractéristiques déjà disponibles ; M4 ajoute Randomize, locks et persistance ; M5 assure l’export déterministe ; M6 étend le studio sans déstabiliser ces bases.

## Périmètre initial

Importer un MP3 ou WAV, analyser le signal dans le navigateur, prévisualiser des scènes rétro 16-bit pixel art et 32-bit low-poly PS1, choisir un extrait, puis produire localement un MP4 H.264 avec audio AAC. L’interface utilise React, Vite, TypeScript et Tailwind CSS. Three.js reste optionnel, pour un futur preset qui le justifie.

Le MVP fonctionne sur une seule machine : navigateur et service de rendu Node.js local. Une application Vite seule ne peut ni lancer FFmpeg ni donner son fichier local à un autre processus. Le rendu distant et le packaging desktop constituent des évolutions distinctes.

## Monorepo minimal

Utiliser les workspaces pnpm, un lockfile unique, TypeScript strict et une version Node LTS épinglée compatible avec Vite et Remotion. Ne pas ajouter de gestionnaire de builds monorepo avant d’en avoir besoin.

```text
apps/
  studio/              # React/Vite : import, analyse, aperçu, sélection, suivi des jobs
  renderer/            # Node : API locale, stockage temporaire, file de jobs, Remotion/FFmpeg
packages/
  contracts/           # Schémas versionnés, validation aux frontières, types et migrations
  audio-analysis/      # Extraction des caractéristiques à partir de PCM
  visual-engine/       # Temps + caractéristiques + seed + paramètres -> dessin Canvas
  render-composition/  # Composition Remotion et adaptateur Canvas pour Chromium
docs/
```

Dépendances : tous peuvent importer `contracts` ; `studio` importe `audio-analysis` et `visual-engine` ; `render-composition` importe `visual-engine` ; `renderer` orchestre la composition. Le moteur ne dépend ni de React, ni de Remotion, ni de l’API locale. Les paquets partagés ne doivent pas importer les applications.

Le service Node n’analyse pas indépendamment le MP3 avec un autre décodeur : il consomme l’analyse figée par le studio. Cela évite une divergence de caractéristiques entre aperçu et export. Un recalcul automatisé côté serveur pourra être ajouté avec une nouvelle version de pipeline.

## Flux utilisateur et responsabilités

1. Le studio conserve le `File` en mémoire et crée une URL objet pour l’écoute. Il décode avec Web Audio API et analyse le PCM hors du thread d’interface quand possible. `decodeAudioData` reste exécuté dans un contexte compatible ; transférer ensuite des blocs PCM à un Worker.
2. Le studio stocke une analyse immuable, configure le preset et dessine selon la position réelle de lecture audio. `requestAnimationFrame` déclenche le dessin mais ne sert jamais d’horloge musicale.
3. La sélection est un intervalle semi-ouvert `[startSample, endSample)` sur la chronologie du PCM analysé. L’aperçu de l’extrait et l’export utilisent la même origine et la même seed.
4. Lors de l’export, le studio téléverse explicitement le fichier original et l’analyse au service local. Celui-ci calcule le hash du fichier et valide la correspondance, puis crée un job immuable.
5. Remotion dessine les images dans Chromium à partir du moteur partagé ; FFmpeg assemble/encode H.264 et AAC. Le résultat n’est déclaré terminé qu’après validation du fichier et publication atomique de sa référence de téléchargement.

Au départ, une file en mémoire avec concurrence 1 suffit. Persister les manifests et états sur disque ; au redémarrage, marquer les jobs interrompus comme échoués avec possibilité de relance. Ne pas prétendre reprendre un encodage partiel.

## Contrats de données

Les types ci-dessous sont indicatifs ; les futurs schémas d’exécution devront vérifier dimensions, bornes, tailles, valeurs finies et versions. Les unités sont explicites. Les grandes séries numériques sont stockées dans des fichiers binaires avec des références, et non dans des tableaux JSON volumineux.

```ts
type AudioAsset = {
  id: string;
  sha256: string;             // octets du fichier original, calculé aussi au téléversement
  originalName: string;       // affichage uniquement, jamais chemin de stockage
  mediaType: string;          // indicatif ; vérifier aussi le contenu
  byteLength: number;
};

type AudioAnalysis = {
  id: string;
  schemaVersion: number;
  assetSha256: string;
  analyzerVersion: string;
  decoder: { implementation: string; version: string };
  pcm: {
    sampleRateHz: number;
    channelCount: number;
    sampleCount: number;
    durationSeconds: number;
    downmix: "mean";
  };
  grid: {
    windowSamples: number;
    hopSamples: number;
    window: "hann";
    timestamp: "window-center";
    frameCount: number;
  };
  features: {
    rms: string;             // référence float32 LE, frameCount valeurs
    peak: string;
    bands: { low: string; mid: string; high: string };
    spectralFlux: string;
    onsets: string;          // référence à des positions entières en samples
  };
  bandEdgesHz: [number, number, number, number];
  normalization: { method: "percentile"; percentile: number; scales: Record<string, number> };
  tempo?: { bpm: number; confidence: number }; // estimation, pas une vérité musicale
  payloadSha256: string;    // intégrité des séries et métadonnées canoniques
};

type PresetDefinition = {
  id: string;
  version: string;
  engineVersion: string;
  parameterSchemaVersion: number;
  parameterSchema: unknown; // futur schéma runtime, valeurs bornées et défauts explicites
  requiredFeatures: string[];
};

type PresetInstance = {
  presetId: string;
  presetVersion: string;
  seed: number;             // entier uint32
  parameters: Record<string, number | string | boolean>;
};

type ExportJob = {
  id: string;
  schemaVersion: number;
  createdAt: string;
  input: {
    assetId: string;        // fichier géré par le service, jamais chemin arbitraire
    assetSha256: string;
    analysisId: string;
    analysisSha256: string;
    preset: PresetInstance;
    engineVersion: string;
    range: { startSample: number; endSample: number; sampleRateHz: number };
    video: {
      width: number; height: number;
      fps: { numerator: number; denominator: number };
      frameCount: number;
      codec: "h264"; pixelFormat: "yuv420p"; crf: number;
    };
    audio: { codec: "aac"; sampleRateHz: number; bitrateKbps: number };
    toolchain: { remotion: string; chromium: string; ffmpeg: string };
  };
  state: "queued" | "preparing" | "rendering" | "encoding" |
         "completed" | "failed" | "cancelled";
  progress: { phase: string; completedUnits: number; totalUnits: number };
  result?: { artifactId: string; byteLength: number; sha256: string };
  error?: { code: string; message: string; retryable: boolean };
};
```

Séparer le manifeste d’entrée immuable des informations de progression mutables dans le stockage. Un changement de preset ou d’extrait crée un nouveau job. Les transitions sont validées ; une annulation arrête les processus enfants et nettoie les fichiers incomplets. Aucun secret ni chemin hôte n’apparaît dans les contrats publics.

## Analyse et synchronisation

Commencer par RMS, pics et énergie de trois bandes, puis flux spectral et détection d’attaques. Le tempo est optionnel : les morceaux complexes rendent une estimation BPM peu fiable. Documenter les seuils, la fenêtre, le pas, les bandes et la normalisation ; toute modification sémantique change `analyzerVersion`.

La grille reste ancrée au morceau complet. Pour une image `f`, calculer `tSource = startSample / sampleRateHz + f * fps.denominator / fps.numerator`. Interpoler linéairement les caractéristiques continues ; consulter les attaques comme événements discrets. Définir le padding aux bords et le lissage comme fonctions du temps source. La normalisation porte sur le morceau complet pour que découper un extrait ne change pas son apparence.

Choisir `frameCount = ceil(duréeExtrait * fps)` et limiter la sortie à `frameCount / fps`. Compléter l’audio par silence sur le reliquat inférieur à une image ; ne pas dépasser la fin de sélection avec du contenu audio supplémentaire. Les dimensions H.264 sont paires. Le décalage dû au délai de décodage MP3 et au priming AAC doit être mesuré : préparer une piste PCM temporaire avec FFmpeg, découper par samples après rééchantillonnage au taux de l’analyse, puis encoder. Comparer durée et alignement à Web Audio ; si la tolérance échoue, bloquer l’export plutôt que masquer la dérive. Une piste PCM canonique partagée sera le repli si les décodeurs divergent.

## Reproductibilité du moteur

Le moteur expose conceptuellement `renderFrame(context, frameInput)` : il reçoit le temps source, les dimensions, les caractéristiques, les paramètres, la seed et les versions. Il doit pouvoir dessiner n’importe quelle image sans avoir dessiné les précédentes.

- Interdire `Math.random()`, l’heure système et l’accumulation de deltas d’animation. Utiliser un PRNG spécifié, indexé par seed et identifiant stable d’élément.
- Préférer des trajectoires analytiques et des enveloppes calculées depuis les attaques. Pour les traînées, reconstruire une fenêtre de temps fixe ; ne pas dépendre du contenu antérieur du Canvas.
- Pour un futur système à état, définir un pas fixe et des checkpoints déterministes avant d’autoriser le rendu parallèle.
- L’aperçu et Remotion appellent le même code Canvas ; l’adaptateur Remotion attend la disponibilité de l’analyse et des ressources ainsi que la fin du dessin avant la capture.
- Épingler les versions du moteur, du preset et des outils dans chaque job ; conserver l’analyse utilisée. Les exports anciens exigent ces versions ou une migration explicite.

La reproductibilité visée est une animation stable à entrées identiques dans une toolchain figée. Canvas, les polices, l’anticrénelage, les codecs et le GPU peuvent empêcher une identité binaire entre plateformes. Éviter les polices système et les ressources réseau ; tester les images avec tolérance dans un Chromium épinglé. Three.js augmenterait ces variations et le coût opérationnel, d’où son report.

## Passage des fichiers au processus de rendu

Une URL `blob:` appartient au navigateur et n’est pas une entrée portable pour Chromium de rendu ou FFmpeg. Un chemin choisi dans le navigateur ne fournit pas non plus l’accès disque au service.

Prévoir une API locale minimale : dépôt d’asset en flux, dépôt d’analyse, création/lecture/annulation d’un job et téléchargement du résultat. Stocker les fichiers sous des identifiants opaques dans un répertoire de travail hors source. Servir à Remotion des URL HTTP locales internes avec durée de vie limitée. Ne jamais accepter une URL externe ou un chemin système fourni par le client comme entrée du renderer.

Lier le service à loopback par défaut, contrôler les origines autorisées et utiliser un jeton de session local contre les appels de sites tiers. En développement, privilégier un proxy Vite vers l’API pour une origine unique. Dans un environnement cloud, loopback désigne la machine cloud : les fichiers sont alors téléversés vers cette machine, ce qui doit être explicite dans l’interface.

Vérifier taille maximale, signature MP3/WAV, durée et ressources requises ; ne pas faire confiance au MIME ou au nom. Exécuter FFmpeg sans shell avec arguments structurés et limites de temps. Appliquer des quotas disque, supprimer les temporaires après annulation/échec et conserver les entrées tant qu’un job les utilise. Une politique de rétention explicite et un nettoyage au démarrage évitent de conserver indéfiniment des fichiers audio privés.

## Choix et risques

| Choix ou risque | Compromis et mesure initiale |
| --- | --- |
| Remotion + Canvas + FFmpeg | Réutilise le moteur et gère les images ; nécessite Node, Chromium et un encodeur H.264 disponible. Faire un prototype d’export court avant de développer tous les presets ; vérifier les licences Remotion/FFmpeg et codecs avant distribution. |
| Décodage complet Web Audio | Simple mais coûteux en RAM : PCM float32 stéréo ≈ 8 octets par sample temporel, en plus du fichier et des copies. Limiter taille/durée selon un budget mesuré et transférer les buffers au Worker. Le streaming sera une évolution. |
| Analyse côté navigateur | Retour rapide et aucun service d’analyse ; variations possibles entre décodeurs. Conserver résultats et provenance, ne pas recalculer silencieusement lors de l’export. |
| Horloges audio/vidéo et codecs | Risque de décalage à l’import, au découpage et au muxage. Chronologie en samples, FPS rationnels et tests sur impulsions connues. |
| Rendu image par image | Plus lent qu’une capture temps réel, mais indépendant de la charge et compatible avec la sélection d’extrait. Concurrence limitée et progression par phases. |
| API locale et fichiers privés | Surface d’attaque et consommation disque ; origines contrôlées, validation, identifiants opaques, quotas et rétention. |
| Fidélité de l’aperçu | Résolution réduite acceptable si elle ne change pas les trajectoires ; exprimer les coordonnées dans un espace normalisé. Éviter toute adaptation des paramètres au débit d’images. |

## Validation prévue et étapes

Vitest couvrira l’analyse avec silence, sinus et impulsions synthétiques, la sérialisation, les transitions des jobs, le calcul d’intervalle et le PRNG. Vérifier qu’une image rendue seule correspond à la même image après seek ou rendu hors ordre.

Playwright exercera import, lecture, changement de preset, sélection et demande d’export avec un petit fichier de test autorisé. Un test d’intégration réel rendra un extrait puis utilisera `ffprobe` pour contrôler H.264/AAC, dimensions, FPS et durée ; analyser aussi l’alignement des impulsions et des événements visuels. Une réponse HTTP ou un fichier MP4 non vide ne suffit pas.

Ordre conseillé : contrats et chronologie ; analyse et premier preset Canvas ; aperçu avec seek ; transfert local et export court ; validation de synchronisation et nettoyage ; interface complète. Prévoir build et vérification TypeScript en plus des tests. Les validations désormais disponibles pour le Sprint 2 sont décrites dans [sa documentation](sprint-2-audio-analysis.md) ; le rendu vidéo reste hors de son périmètre.
