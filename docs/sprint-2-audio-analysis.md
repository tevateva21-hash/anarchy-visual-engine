# Sprint 2 — analyse audio hors ligne

## Implémentation

Seuls `apps/studio`, `packages/contracts` et `packages/audio-analysis` sont nécessaires à ce sprint. Le renderer, les presets et l’export restent à développer. Le package de contrats n’importe ni React ni le moteur visuel ; ses tableaux typés sont transférables/sérialisables par structured clone.

L’import contrôle la taille (50 Mio), la signature MP3/WAV et, pour WAV, le format PCM/float, le taux source (8–192 kHz) et les canaux (1 ou 2). Les noms et MIME ne constituent pas une validation. Un élément audio lit la durée avant le décodage ; une durée non finie ou supérieure à 300 secondes est refusée. `OfflineAudioContext.decodeAudioData` décode/rééchantillonne à **24 kHz**, sans lecture du morceau. La durée, les canaux et le budget de PCM (64 Mio) sont revérifiés après décodage. Le PCM copié est transféré à un Worker, qui renvoie l’analyse et une progression.

Web Audio ne propose pas d’annulation de `decodeAudioData` : les décodages sont sérialisés et les résultats annulés sont jetés. Le Worker peut être terminé immédiatement. Le contrôle de métadonnées n’est pas une garantie absolue contre un fichier hostile ou un bug du décodeur ; on ne peut pas imposer un plafond dur à la mémoire interne du navigateur. Pendant le décodage, fichier, PCM natif et copie transférée peuvent coexister. Pour des fichiers plus longs, il faudra un pipeline de décodage par blocs, plutôt qu’augmenter arbitrairement les limites.

## Définition des caractéristiques, version 1.0.0

- PCM à 24 000 Hz ; FFT radix-2 de 2 048 samples, pas de 512 samples (≈21,33 ms), Hann symétrique.
- Timestamps en secondes : `i * 512 / 24000`, centrés sur la fenêtre, depuis zéro. Les parties de fenêtre hors du morceau sont complétées par zéro. Nombre de fenêtres : `ceil(sampleCount / 512)`.
- RMS : racine de la moyenne des carrés des samples réellement présents dans la fenêtre, sur tous les canaux. Les zéros de padding ne réduisent pas artificiellement le RMS de bord.
- Spectre : puissance unilatérale, divisée par `FFTSize * sum(Hann²)` ; bins hors DC/Nyquist doublés. Puissance moyenne des canaux, pas moyenne des signaux : une stéréo en opposition de phase ne s’annule pas.
- Basses : `[20,250[` Hz ; médiums : `[250,2000[` Hz ; aigus : `[2000,12000]` Hz. Énergies en amplitude², sans normalisation par morceau. Un sinus pleine amplitude loin des bords produit environ 0,5 dans sa bande et un RMS de `1/sqrt(2)`.
- Flux spectral : somme des différences **positives de puissance** par bin avec la fenêtre précédente, tous bins inclus. Premier flux = zéro. Il s’agit d’un indicateur de hausse spectrale, pas de beats ou d’onsets certifiés. Un sustain stable doit donner un flux quasi nul.
- Waveform : minimum et maximum des samples présents, tous canaux confondus, par fenêtre. Le Canvas agrège ces extrema par pixel ; ce n’est pas un tracé de chaque sample. La Hann et le padding atténuent les énergies spectrales aux extrémités ; RMS et bandes ont volontairement des conventions de bord différentes.

Les calculs FFT utilisent des Float64 temporaires ; les séries persistées sont des Float32, les timestamps des Float64. L’ordre des opérations est fixe. Les tests vérifient l’égalité exacte pour un même PCM dans un même runtime. Le décodage MP3, le rééchantillonnage et les fonctions trigonométriques peuvent varier entre navigateurs/versions ; l’analyse sauvegardée sera l’entrée figée de l’export futur. La version d’analyse est à incrémenter si ses calculs ou paramètres changent.

L’architecture initiale proposait un downmix moyen : ce sprint choisit explicitement la moyenne des puissances des canaux pour éviter l’annulation de phase. L’analyse concrète contient les séries en mémoire/IndexedDB ; les références binaires pour les jobs d’export décrites dans l’architecture restent une évolution.

## Accès temporel

```ts
import { createAudioFeatureAccessor } from '@anarchy/audio-analysis';
const { getAudioFeaturesAt } = createAudioFeatureAccessor(analysis);
const features = getAudioFeaturesAt(12.34);
```

Recherche binaire puis interpolation linéaire indépendante pour RMS, basses, médiums, aigus et flux. Temps finis hors plage ramenés à la première/dernière fenêtre ; le dernier intervalle jusqu’à la fin garde la dernière valeur. NaN/Infinity et une analyse vide sont refusés. Il n’existe ni état de lecture ni dépendance à l’ordre des appels. Les valeurs affichées sont brutes ; seules les jauges d’énergie utilisent leur racine carrée.

## Cache et confidentialité

IndexedDB conserve uniquement l’analyse (pas le fichier ni le PCM), sous une clé contenant SHA-256 des octets originaux, version d’analyse et paramètres. Le nom du fichier n’influence pas le cache. Il faut réimporter le fichier pour l’écouter après rechargement.

Au plus cinq analyses sont conservées, avec éviction LRU transactionnelle et expiration après 30 jours sans accès. L’expiration est appliquée lors d’un accès ou d’une écriture, pas par une tâche de fond. Types, tailles, timestamps, versions et valeurs sont validés à la lecture ; les entrées invalides sont supprimées puis recalculées. Le bouton de purge efface le store. Un refus d’IndexedDB ou un quota atteint n’empêche pas l’analyse en mémoire : un avertissement l’indique. Les instances sur des origines différentes ont des caches distincts ; ce cache n’est pas un mécanisme de sauvegarde de projet.

## Validation

Vitest utilise silence, sinus de fréquences/amplitudes connues, stéréo en opposition de phase et impulsion pour contrôler valeurs physiques, localisation des bandes, transitoires, invariance des entrées et reproductibilité exacte. Les tests d’accès vérifient interpolation, bornes et pistes d’une seule fenêtre. Le cache est testé avec IndexedDB simulé, TTL et LRU.

Playwright importe un WAV synthétique et un MP3 généré par FFmpeg, contrôle des valeurs et des pixels de waveform, déplace la position, recharge et réimporte pour vérifier le cache. Il couvre aussi cache indisponible, fichier invalide, dépassements de taille/durée, canaux interdits et annulation/réimport. Aucun enregistrement musical externe n’est nécessaire.
