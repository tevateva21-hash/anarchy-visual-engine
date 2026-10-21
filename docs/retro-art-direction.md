# M1 — Retro Art Direction

## Point de départ et périmètre livré

L’inspection a trouvé un studio React/Vite fonctionnel sur la branche Sprint 2, sans changement local non committé. L’import MP3/WAV, le décodage Web Audio, le Worker DSP, le cache IndexedDB, la waveform, le lecteur et le seek existent déjà. Leurs traitements et contrats audio sont préservés ; seules les couleurs de la waveform et son sélecteur de test (désormais nommé, car il y a deux Canvas) sont adaptés.

M1 ajoute une démonstration Industrial City autonome et la direction du studio, dans le checkout existant. Les trois autres scènes sont identifiées comme prévues M2. Aucune interface ne prétend randomiser, sauvegarder un preset, piloter une scène par l’audio ou exporter une vidéo.

## Intentions artistiques — correction M1, atmosphère PS1

L’étude conserve les usines, la grue, le viaduc, le train, les câbles, la silhouette humaine et l’éclipse. La correction reprend l’ambiance de survival horror 32-bit des années 90 — obscurité, ville déserte, brouillard, matières fatiguées — sans reprendre de personnages, textures, lieux ou assets de Silent Hill. Ce reste une mise en scène 2D, pas une émulation PS1 ou une nouvelle scène 3D.

Trois palettes désormais désaturées : **Brume industrielle**, **Olive militaire** et **Cendres froides**. Elles gardent leurs anciens identifiants techniques pour préserver les contrats. Noirs bleutés, verts militaires, gris sales, jaunes industriels affaiblis et rouille rouge discrète remplacent les teintes plus propres et lumineuses. Onze couleurs par palette, opaques, sans ressource distante.

La matière associe taches fixes de façade, traînées de salissure, dither Bayer localisé, grain parcimonieux et vignette tramée. Plusieurs nappes de brume masquent la ville lointaine sans effacer les silhouettes de premier plan. La vapeur monte, le train avance, la charge de la grue oscille légèrement, la pluie tombe et quelques lampes changent discrètement de luminosité. Les variations sont douces, sans flash plein écran.

## Caméra et animation sur demande

- Cliquer **Animer la démo** pour lire depuis l’instant choisi ; **Pause de la démo** fige l’image. Le curseur arrête la lecture et permet de retrouver exactement une image. La lecture s’arrête à 12 secondes ; un nouveau clic en fin de lecture repart à zéro, sans boucle imposée.
- **Mouvement caméra**, de 0 à 100 %, module travelling lent, flottement et micro-tremblement quantifiés. À 0, la caméra est fixe mais vapeur, pluie, train et lumières restent animés lors de la lecture.
- Le parallax utilise des offsets entiers distincts pour ciel, ville lointaine, usine, infrastructures et premier plan. Pas de transformation CSS animée sur l’image, pas de caméra Three.js ni nouveau moteur générique.
- **Accent cinématique à 6 s**, désactivé par défaut, ajoute une petite impulsion amortie d’une seconde au maximum. C’est un événement de démonstration déterministe, indépendant des temps forts musicaux ; il n’ajoute pas de réactivité M3.
- Avec `prefers-reduced-motion: reduce`, animation, caméra et accent sont désactivés. L’exploration manuelle de l’instant et des palettes reste disponible. Si la préférence change pendant une lecture, celle-ci s’arrête.

## Implémentation et compromis

`industrialStudy.ts` reste la composition locale existante à 320×180, avec des dessins et offsets sur coordonnées entières. Canvas et CSS désactivent le lissage. Les pixels gardent leurs couleurs opaques ; un écran de taille non multiple de 320 répartit leurs largeurs inégalement, sans mélange des couleurs. Cette rugosité est volontaire et ne constitue pas une simulation du hardware PS1.

`studyMotion.ts` calcule les offsets depuis le numéro d’image, la profondeur, l’intensité et l’option d’accent. Toutes les autres variations dérivent du même numéro d’image, sans `Math.random()`, horloge système dans le dessin, ni état accumulé. La position et les textures sont donc répétables après pause/seek. Le scheduler React emploie RAF pour déduire une image absolue à 12 fps ; il ne sert pas d’horloge musicale. La lecture musicale et l’étude restent séparées.

Le dessin demeure dans `apps/studio/src/retro` : aucune extraction M2, aucun Randomize complet, aucune sauvegarde de presets ni export vidéo. Les contrats futurs et le pipeline audio ne changent pas.

## Vérification

Les tests Playwright vérifient les dimensions intrinsèques, nearest-neighbor, palette opaque limitée, sans couleurs intermédiaires de lissage, changement réel d’image selon l’instant et la palette, retour pixel-identique à une configuration antérieure, clavier, mouvement réduit et absence de débordement à 375 px après import audio. Ils vérifient aussi lecture/pause, fin/reprise, caméra fixe, impulsion optionnelle et arrêt de la lecture lors d’un changement vers le mouvement réduit. Vitest couvre offsets bornés, profondeur, caméra nulle et répétabilité après appels hors ordre. Les parcours audio existants restent exécutés (WAV/MP3, cache, erreurs, limites, annulation et réimport).

La reproductibilité testée concerne la même image dans le même navigateur. M1 ne prouve pas l’équivalence aperçu/export vidéo : le renderer n’existe pas encore. La CI existante reste configurée ; les résultats rapportés dans la PR sont ceux réellement exécutés localement.

Voir [ROADMAP.md](../ROADMAP.md) pour les six milestones, quinze issues et le Project prêts à publier. L’API GitHub refusant l’accès, aucun élément distant n’a été créé.
