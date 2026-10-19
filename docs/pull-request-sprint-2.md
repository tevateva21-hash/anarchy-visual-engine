# Sprint 2 : analyse audio hors ligne et exploration du morceau

L’import MP3/WAV produit maintenant une analyse horodatée, consultable indépendamment du moteur visuel. Le studio affiche la waveform, permet l’écoute et le seek, et montre RMS, énergie des trois bandes et flux spectral à la position choisie.

- Socle pnpm/React/Vite/TypeScript/Tailwind, contrats partagés et extracteur FFT déterministe exécuté dans un Worker.
- Décodage Web Audio à 24 kHz, moyenne des puissances par canal, interpolation linéaire avec bornage aux extrémités.
- Cache IndexedDB versionné par hash du contenu, cinq entrées LRU, expiration après 30 jours sans accès, purge et repli en mémoire si indisponible.
- Contrôles 50 Mio / 5 minutes / mono-stéréo avant décodage, vérifications après décodage, annulation et progression.
- Documentation des unités, conventions de bord, coûts mémoire et limites de reproductibilité ; workflow CI.

Validation locale : `pnpm build`, 20 tests Vitest et 6 tests Playwright réussis. Les tests navigateur ont utilisé Chromium système 154.0.8037.57 via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`, ainsi que FFmpeg pour générer le MP3. Le téléchargement du Chromium Playwright est interdit par la politique réseau de cet environnement ; la CI prévoit son installation mais n’a pas été exécutée ici.

Les signaux synthétiques vérifient RMS théorique, isolation des bandes, proportionnalité des énergies, impulsions, stéréo en opposition de phase, reproductibilité et interpolation. Les parcours navigateur vérifient import WAV/MP3, valeurs et waveform, seek, cache après reload, limites, erreur, annulation et réimport.

Limites : décodage complet en mémoire ; les métadonnées ne garantissent pas un plafond mémoire dur face à un fichier malformé. Le déterminisme exact couvre un même PCM dans un même runtime ; les décodeurs peuvent varier entre navigateurs. Pas de preset visuel ni d’export vidéo dans ce sprint.
