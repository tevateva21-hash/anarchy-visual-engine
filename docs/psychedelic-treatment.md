# Techno Therapy — traitement psychédélique

## Portée

Cette évolution conserve `feature/pendulum-camera`, la salle, les assets procéduraux, les deux points de vue, les contrôles temporels, Pendulum Push et tout le studio audio. Elle ajoute un réglage **Psychédélisme** distinct d’**Étrangeté**. Aucun mapping audio automatique, nouvelle scène ou nouvelle dépendance n’est introduit.

Le mode actuel **Rouge sang** laisse ce traitement de côté. Choisir **Ambiance → Classique / psychédélique** pour retrouver les contrôles et réglages décrits ci-dessous.

## Direction visuelle et contrôles

**Psychédélisme** va de 0 à 100 %, initialement 45 %. Zéro restaure le pipeline et les mouvements initiaux. À 30–60 %, le traitement reste discret ; à 75–100 %, les ombres sont plus profondes, le halo et la séparation chromatique plus perceptibles et les matières prennent une coloration mauve/pétrole désaturée. La scène garde son cuir bordeaux, ses boiseries et ses lumières basses. Pas de cycle arc-en-ciel, glitch violent, feedback de traînée ou flash plein écran.

Le traitement comprend :

- halo spatial léger sur les zones lumineuses (pas de bloom géant) ;
- séparation rouge/bleu radiale discrète, croissante vers les bords ;
- distorsion lente de très faible amplitude, inférieure à 0,2 % des UV avant pondération radiale ;
- contraste renforcé, teintes froides dans les ombres, vignetage modéré ;
- lampes entre ambre/mauve et ambre/olive, appoint pétrole, variations lentes de couleur et réduction de la lumière ambiante.

**Étrangeté** conserve son rôle de contrôle des objets et de la dérive temporelle. Le produit Étrangeté × Psychédélisme accélère le pendule (jusqu’à environ 3,1× sa fréquence initiale) et l’horloge (jusqu’à 9×), tout en bornant l’amplitude du pendule à 0,19 rad, le soulèvement du livre à 8 cm, le coussin à ±2,4 % et l’inclinaison du cadre à 0,02 rad. Le chemin et le FOV de Pendulum Push ne changent pas ; sa cible suit toujours la masse du pendule.

Avec Étrangeté zéro, les objets et les distorsions animées sont fixes ; la colorimétrie et le halo statiques restent réglables. Le mode système de mouvement réduit impose ce comportement, bloque les lectures animées, mais conserve le curseur Psychédélisme et l’exploration manuelle des cadrages.

## Implémentation

- `psychedelicLook.ts` calcule les paramètres bornés depuis le temps absolu, l’intensité du traitement et celle du mouvement.
- `psychedelicPass.ts` utilise les addons Three.js existants : RenderPass → ShaderPass spatial → OutputPass. ACES et conversion sRGB sont appliqués en sortie, une fois. Le halo est une approximation à huit voisins, pas une chaîne de bloom multi-résolutions.
- Deux render targets sont redimensionnées avec le viewport et le pixel ratio plafonné existants. Half-float si le GPU le permet, sinon tampon 8-bit (halo HDR plus limité). À zéro, le rendu passe directement dans le renderer initial, sans post-processing.
- Les ressources des passes, render targets et matériaux sont libérées au démontage et recréées lors d’une reprise après perte de contexte. La passe ne possède aucune boucle d’animation autonome.
- `roomMotion.ts` conserve les équations originales quand le paramètre optionnel est nul. `therapyScene.ts` applique les variations de poses, couleurs et lumière, avec une remise à zéro explicite pour éviter une accumulation au fil des réglages.

Tout le mouvement, les couleurs et les uniforms proviennent de la timeline active (pièce ou travelling). Pas de `Date.now`, hasard, historique d’image ou accumulation de phase ; `EffectComposer.render(0)` reçoit un delta explicite et ne consulte pas son horloge interne. Pause, seek et Replay restent reproductibles dans la même toolchain. Aucun résultat identique entre GPUs ou export MP4 n’est promis.

## Comment tester

Depuis la copie contenant ces changements :

```sh
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0
```

Dans un Codespace, ouvrir le port 5173 via l’onglet Ports / Open in Browser ; sur une machine locale, ouvrir l’adresse Vite. Choisir Techno Therapy Room, comparer Psychédélisme 0/45/100 %, puis lancer **Animer la pièce**. Ajuster Étrangeté pour observer les différences de vitesse. Explorer Pendulum Push avec Play, Pause, Replay et sa timeline. Importer un MP3/WAV et tester le lecteur et la waveform, qui restent indépendants des effets.

Une copie GitHub antérieure ne contient pas automatiquement ces changements locaux : ils doivent être transférés ou publiés avant qu’un Codespace existant puisse les récupérer.

## Validation prévue

Vitest couvre neutralité, bornes, vitesses, mouvement nul, répétabilité et retour exact aux lumières/poses originales. Le test de dégagement de Pendulum Push est étendu aux extrêmes 0/100 % du psychédélisme, avec les durées 2/8/30 s et les extrêmes d’Étrangeté.

Playwright vérifie que le rendu traité contient effectivement une image éclairée, qu’il diffère du neutre, que le retour à zéro et les seeks reproduisent les pixels, et que le mouvement réduit ne garde pas de variations temporelles résiduelles. Les suites audio, scènes, viewport mobile et perte/reprise WebGL restent exécutées.

Commandes : `pnpm build`, `pnpm test`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium PLAYWRIGHT_SOFTWARE_WEBGL=1 pnpm test:e2e`. Le coût GPU augmente avec la passe plein écran ; régler Psychédélisme à zéro permet de retrouver le rendu direct. L’avertissement Vite sur le chunk Three.js demeure ; il n’est pas masqué.

## Résultats de cette session

Build Vite et TypeScript réussis (avertissement de taille du chunk Three.js conservé), 37 tests Vitest et 16 tests Playwright réussis avec Chromium système / SwiftShader. Les captures 0/45/100 % ont été inspectées visuellement. La CI GitHub n’a pas été exécutée.

## Essai dans un Codespace sans modifier la copie existante

L’archive source `anarchyvisual-psychedelic-preview.zip` contient la copie modifiée, sans node_modules ni métadonnées Git. Télécharger cette archive depuis le chat, puis la charger dans l’explorateur de fichiers du Codespace (clic droit → Upload). Depuis le dossier qui contient le ZIP, lancer :

```sh
unzip anarchyvisual-psychedelic-preview.zip -d /tmp
cd /tmp/anarchyvisual-psychedelic-preview
pnpm install --frozen-lockfile
pnpm dev --host 0.0.0.0 --port 5174 --strictPort
```

Ouvrir le port 5174 avec Open in Browser. Ce port distinct laisse le serveur précédent intact. Choisir Techno Therapy Room, ajuster Psychédélisme puis cliquer Animer la pièce ou Play dans Pendulum Push. Les effets restent fixes tant que la lecture est en pause. La copie de travail GitHub n’est ni écrasée ni modifiée par cette extraction dans /tmp. Une nouvelle extraction au même endroit peut demander confirmation pour les fichiers déjà présents ; ne pas écraser des modifications personnelles dans cette copie de test.

## Fichiers ajoutés ou modifiés

- `AGENTS.md`
- `README.md`
- `apps/studio/src/therapy/TherapyRoom.tsx`
- `apps/studio/src/therapy/psychedelicLook.ts`
- `apps/studio/src/therapy/psychedelicPass.ts`
- `apps/studio/src/therapy/roomMotion.ts`
- `apps/studio/src/therapy/therapyScene.ts`
- `docs/architecture.md`
- `docs/psychedelic-treatment.md`
- `tests/pendulumCamera.test.ts`
- `tests/psychedelic.spec.ts`
- `tests/psychedelic.test.ts`
