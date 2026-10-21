# M1 — Retro Art Direction

## Point de départ et périmètre livré

L’inspection a trouvé un studio React/Vite fonctionnel sur la branche Sprint 2, sans changement local non committé. L’import MP3/WAV, le décodage Web Audio, le Worker DSP, le cache IndexedDB, la waveform, le lecteur et le seek existent déjà. Leurs traitements et contrats audio sont préservés ; seules les couleurs de la waveform et son sélecteur de test (désormais nommé, car il y a deux Canvas) sont adaptés.

M1 ajoute une démonstration Industrial City autonome et la direction du studio, dans le checkout existant. Les trois autres scènes sont identifiées comme prévues M2. Aucune interface ne prétend randomiser, sauvegarder un preset, piloter une scène par l’audio ou exporter une vidéo.

## Intentions artistiques

Palette charbon/ambre, typographie dense, surfaces mates, filets et informations de production évoquent un atelier nocturne. L’image privilégie une composition cinématographique : usines en plans successifs, grue, infrastructure ferroviaire, silhouette humaine, lumière rare et route humide. L’éclipse apporte une étrangeté visuelle. Le tramage, les couleurs limitées et les formes rasterisées construisent le langage 16-bit ; il ne s’agit pas d’émuler une console précise.

Trois variantes sont proposées pour cette étude : Ambre industriel, Oxyde toxique et Béton froid. Chaque variante utilise neuf couleurs. Les perspectives et silhouettes restent identiques lors d’un changement de palette ; les sprites ne sont pas remplacés par des formes d’égaliseur. Aucun asset, police ou texture externe n’est nécessaire.

## Implémentation et compromis

- `retro/industrialStudy.ts` dessine une composition à 320×180 avec rectangles et lignes rasterisées sur coordonnées entières. Les couleurs sont opaques, sans gradients interpolés ou antialiasing. Le Canvas est agrandi par CSS `image-rendering: pixelated` ; `imageSmoothingEnabled` est désactivé. Sur les dimensions d’écran non multiples de 320, nearest-neighbor peut répartir les pixels avec des largeurs inégales : compromis responsive, sans mélange des couleurs.
- Chaque image recouvre entièrement la surface logique et dépend seulement de la palette et du numéro d’image. Pas de PRNG ni état accumulé. La fumée, la pluie et le train se déplacent uniquement quand l’utilisateur change l’instant explicite (12 images par seconde, 0–12 s). Pas d’animation automatique ; le mode de mouvement réduit reste utilisable sans effet temporel imposé.
- Le temps de la démo est séparé du morceau. La lecture musicale ne déclenche pas de réactivité et déplacer l’étude ne déplace pas l’audio. M3 connectera la chronologie source à un moteur M2.
- La fonction est une étude locale, sans registre de scènes ni abstraction générique. Son extraction vers `packages/visual-engine` est prévue en M2 ; Three.js n’est pas ajouté pour une image 2D.
- `packages/contracts/src/presets.ts` prépare les scènes, render styles, palettes, caméra discriminée, effets, intensité, seed, locks et règles de compatibilité. Ces types ne valident aucun fichier utilisateur et ne résolvent pas de contraintes. M4 devra ajouter schémas runtime, migrations et PRNG versionné.

## Vérification

Les tests Playwright vérifient les dimensions intrinsèques, nearest-neighbor, absence de couleurs intermédiaires/alpha, changement réel d’image selon l’instant et la palette, retour pixel-identique à une configuration antérieure, clavier, mouvement réduit et absence de débordement à 375 px après import audio. Les parcours audio existants restent exécutés (WAV/MP3, cache, erreurs, limites, annulation et réimport).

La reproductibilité testée concerne la même image dans le même navigateur. M1 ne prouve pas l’équivalence aperçu/export vidéo : le renderer n’existe pas encore. La CI existante reste configurée ; les résultats rapportés dans la PR sont ceux réellement exécutés localement.

Voir [ROADMAP.md](../ROADMAP.md) pour les six milestones, quinze issues et le Project prêts à publier. L’API GitHub refusant l’accès, aucun élément distant n’a été créé.
