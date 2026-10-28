# Techno Therapy Room — Rouge sang

La direction validée dans l’image de référence est appliquée à la scène Three.js existante : lumières cramoisies, ombres bordeaux presque noires, fauteuils plus rouges et reflets rouges sur le parquet. Les positions, formes, caméras et le mobilier sont conservés. Il s’agit du rendu réel de l’application, pas d’un fond d’écran ou d’un filtre rouge uniforme.

## Contrôles

**Ambiance → Rouge sang** est le mode par défaut. Le travelling Pendulum Push, ses contrôles, les points de vue et Étrangeté restent disponibles. Le lecteur, l’import MP3/WAV, la waveform et l’analyse ne changent pas.

**Ambiance → Classique / psychédélique** retrouve la variante précédente. Le curseur Psychédélisme conserve sa valeur pendant le passage en rouge ; il y est désactivé et la passe contournée pour laisser cette variante de côté. Le retour en classique restaure lumières, couleurs, matériaux et propriétés de réflexion. La version psychédélique avant modification est également conservée dans une archive source vérifiée hors du dépôt.

## Réalisation

- `roomLighting.ts` définit la palette statique et le type d’ambiance.
- `therapyScene.update` accepte une ambiance optionnelle (`classic` par défaut pour les appelants existants), modifie lumières et matériaux, puis applique la caméra habituelle. Fond et brouillard sont accordés au rouge ; toutes les propriétés modifiées sont rétablies lors du retour au classique.
- Le parquet passe à une rugosité de 0,7 et une métallicité légère de 0,08 pour renforcer les reflets ; ses propriétés classiques sont restaurées à 0,9 et 0.
- L’interface démarre en rouge sans activer la passe psychédélique. Ni animation audio automatique, ni nouvelle dépendance, ni changement du FOV ou de la trajectoire.

## Validation

Tests unitaires sur la dominante des lumières, la conservation de la géométrie/caméra et le retour exact des couleurs, matériaux, éclairages, fond et brouillard. Test navigateur sur les pixels rouges réellement rendus, la lisibilité de l’image, la conservation du réglage psychédélique et la répétabilité des bascules et seeks Pendulum Push. Les suites audio, caméra, mobile et WebGL existantes restent exécutées.

Commandes : `pnpm build`, `pnpm test`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_SOFTWARE_WEBGL=1 pnpm test:e2e`.

## Aperçu cloud à partir de l’archive

Une archive source `anarchyvisual-blood-red-preview.zip` accompagne la copie locale (sans dépendances ni métadonnées Git). Pour la tester sans écraser le projet du Codespace : charger le ZIP dans l’explorateur, puis lancer dans le dossier contenant l’archive :

```sh
unzip anarchyvisual-blood-red-preview.zip -d /tmp
cd /tmp/anarchyvisual-blood-red-preview
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0 --port 5175 --strictPort
```

Ouvrir le port 5175 dans le navigateur. Les fichiers du projet initial et son serveur sont conservés. La variante rouge est sélectionnée dès l’ouverture. Les changements doivent être publiés avant de pouvoir être récupérés par git pull ; aucune publication n’est implicite.

Validation locale finale : build et TypeScript réussis, 39 tests Vitest et 17 tests Playwright réussis avec Chromium/SwiftShader. L’avertissement de taille du module Three.js demeure. Capture inspectée : rendu réel de la scène à ambiance Rouge sang, sans modifier son cadrage.

## Tester la branche GitHub

La version à tester est sur `feature/pendulum-camera`, distincte de main. Dans le terminal du Codespace du dépôt, arrêter l’ancien serveur avec Ctrl+C, puis lancer :

```sh
git fetch origin
git switch feature/pendulum-camera
git pull --ff-only
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0 --port 5173 --strictPort
```

Ouvrir le port 5173 via Open in Browser. **Ambiance → Rouge sang** est sélectionnée au démarrage. Le choix **Classique / psychédélique** retrouve la variante précédente. Pour mettre à jour le dépôt Git, utiliser son dossier de travail, pas la copie temporaire extraite de l’archive sous /tmp. Si Git signale des modifications locales, ne pas forcer ni les supprimer ; les préserver avant de changer de branche.
