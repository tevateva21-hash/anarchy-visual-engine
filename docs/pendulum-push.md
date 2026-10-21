# Pendulum Push — travelling vers le pendule

## Base préservée

Branche `feature/pendulum-camera`, créée depuis le commit `4df9827` de `feature/techno-therapy-3d`, vérifié sur GitHub avant toute modification. Le prototype, les fauteuils, le tapis, l’éclairage et le pendule existants sont conservés ; aucune fusion dans main n’est réalisée.

## Mouvement

La caméra Three.js se déplace physiquement dans la salle, avec **FOV constant de 48° et zoom 1**. Il n’y a ni agrandissement CSS ni zoom 2D. Le chemin est une Bézier cubique, évaluée sur une progression smootherstep (vitesse et accélération nulles aux extrémités).

| Point | Position dans la scène (mètres logiques) |
| --- | --- |
| Départ large | `(0.60, 2.65, 6.40)` |
| Contrôle 1 | `(0.60, 2.65, 4.70)` |
| Contrôle 2 | `(-0.12, 1.45, 2.10)` |
| Arrivée gros plan | `(-0.12, 1.04, 0.95)` |

Le regard passe progressivement de la cible large `(0, 1.4, -0.9)` au centre de la masse du pendule, dont la position mondiale suit son oscillation existante. Le gros plan garde le pendule visible au centre, avec un peu de contexte de la table et des fauteuils. Le fil et la masse 3D existaient déjà ; ils sont désormais nommés `therapy-pendulum` et `therapy-pendulum-bob` pour une cible stable.

Le pendule est animé par `roomPose(temps, étrangeté, vue)`, indépendamment de l’évaluateur caméra. À temps et intensité identiques, il a la même pose avec ou sans travelling. À Étrangeté zéro, les objets restent fixes mais le travelling fonctionne. À la fin de lecture, l’image se fige pour inspection ; aucun mouvement résiduel ne contourne la timeline.

## Contrôles

1. Lancer `pnpm install --frozen-lockfile`, puis `pnpm dev` depuis la branche `feature/pendulum-camera` et ouvrir l’adresse Vite.
2. Dans **Techno Therapy Room**, descendre au bloc **Pendulum Push** et cliquer **Play**. Départ depuis le plan large du preset, quelle que soit la vue précédente ; le fichier audio ne démarre pas.
3. **Pause** fige l’image ; **Play** reprend. **Replay** repart immédiatement à zéro, même pendant une lecture. En fin de lecture, Play recommence au départ.
4. **Timeline Pendulum Push** permet le seek, y compris en mouvement réduit ; toute manipulation arrête la lecture. **Durée du travelling** règle 2 à 30 s par pas de 0,5 s, initialement 8 s. Changer la durée conserve la progression relative et met en pause.
5. **Revenir à la caméra initiale** désactive le travelling et restaure le point de vue et l’instant de la pièce précédents. Choisir **Face à face** ou **Depuis le divan**, ou manipuler **Instant de la pièce**, retourne aussi au mode de caméra existant.

La lecture de la pièce et celle du travelling sont exclusives. Les paramètres Étrangeté et le lecteur audio restent indépendants. Le mode mouvement réduit bloque Play/Replay et l’animation des objets, mais autorise une inspection manuelle des cadrages. Une perte de contexte WebGL arrête les lectures et conserve les valeurs de la timeline.

## Interfaces réutilisables

- `packages/contracts/src/camera.ts` : points, trajectoire, durée, easing, identifiant/version, cible nommée et état de lecture ; aucune dépendance React/Three.js.
- `apps/studio/src/therapy/cameraPresets.ts` : définition Pendulum Push v1 et évaluateur pur `evaluateCameraPreset`. Les temps finis hors intervalle sont ramenés aux extrémités ; valeurs non finies et durées hors limites sont refusées.
- `therapyScene.update(..., shot?)` : état caméra optionnel ; aucune modification du FOV. Sans état, les deux points de vue existants restent inchangés.

Ce socle accepte d’autres chemins du même type, sans développer un éditeur de presets, un générateur aléatoire, un export ou une réactivité musicale.

## Collisions et validation

Le chemin passe dans l’allée centrale et descend au-dessus du plateau de table. Les tests utilisent les volumes mondiaux de toutes les meshes de la scène, gonflés d’une marge de 16 cm et d’une marge inter-échantillons. Ils parcourent 129 positions pour chaque combinaison de durée (2/8/30 s) et d’intensité (0/1), vérifient le dégagement de la caméra et la visibilité du pendule à l’arrivée par raycast. Si des meubles, leurs animations ou le chemin changent, ces tests doivent être rejoués. Cette vérification échantillonnée n’est pas un solveur de collision universel pour une future scène éditable.

Tests Vitest : positions initiale/finale, clamping, easing, durée, seek, répétabilité, orientation vers la cible, FOV/zoom constants, pendule existant/animé et collision sur la géométrie réelle. Tests Playwright : images de début/fin et seek répété, restauration de la caméra, durée configurable, Play/Pause/Replay, arrêt en fin de lecture, mode mouvement réduit, import/lecteur/waveform préservés et aucun démarrage audio au lancement du travelling.

Commandes : `pnpm build`, `pnpm test`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_SOFTWARE_WEBGL=1 pnpm test:e2e`. Les comparaisons de pixels visent le même runtime ; aucun export MP4 ni résultat inter-GPU identique n’est revendiqué. L’avertissement Vite de taille du chunk Three.js reste documenté dans le prototype.
