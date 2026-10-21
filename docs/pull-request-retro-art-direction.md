# M1 — Direction rétro industrielle et étude Industrial City

Le studio audio existant reçoit une direction sombre et cinématographique et une première étude pixel-art Industrial City. L’étude est visible avant import ; le lecteur, l’analyse hors ligne, la waveform, le seek et le cache restent utilisables.

La composition Canvas est dessinée à 320×180, avec neuf couleurs par palette et agrandissement nearest-neighbor. Trois palettes et un instant explicite permettent de consulter des variations sans animation automatique. L’étude reste indépendante du morceau : la réactivité musicale appartient à M3.

Les contrats TypeScript préparent les quatre scènes, les styles 16-bit/PS1, les palettes, caméras discriminées, effets, intensité, seeds, locks et compatibilités. Aucun générateur aléatoire, résolveur de contraintes, chargement de configuration ou renderer vidéo n’est ajouté. Le dessin reste local à l’étude ; l’extraction vers un moteur partagé appartient à M2.

`ROADMAP.md` fournit les six descriptions de milestones, quinze issues avec critères d’acceptation et la structure du Project. Architecture, AGENTS et README reflètent l’état réel et les limites de M1. Les éléments GitHub ne sont pas créés : l’API refuse l’accès.

## Validation

- `pnpm build` : TypeScript strict et build Vite.
- `pnpm test` : 20 tests Vitest réussis.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm test:e2e` : 8 tests réussis, dont les six parcours audio existants.
- Pixel tests : dimensions, neuf couleurs opaques, absence de lissage, changement selon palette/instant, retour exact à une image antérieure.
- Clavier, mouvement réduit, mobile à 375 px avec audio importé ; capture mobile inspectée visuellement.

Les tests ont utilisé le Chromium système. La CI n’a pas été exécutée sur GitHub. La reproductibilité vérifiée est celle d’un même navigateur et d’une même configuration, sans promesse d’équivalence MP4 (export absent). Sur les tailles d’écran non multiples de la résolution logique, les pixels peuvent avoir des largeurs d’affichage différentes ; les couleurs restent non interpolées.

## Branche et dépendance

Branche : `feature/retro-art-direction`. Base locale de revue : `feat/sprint-2-audio-analysis` (commit `6a8bccc`), car M1 prolonge le Sprint 2 existant. Comparaison : `git diff feat/sprint-2-audio-analysis...feature/retro-art-direction`.

Ouverture distante en attente : `origin` ne publie encore aucune branche et l’API GitHub renvoie « Forbidden ». Il faudra publier/intégrer la base Sprint 2, publier cette branche et disposer de l’accès GitHub pour ouvrir la PR. Aucun push ni création distante n’est revendiqué.
