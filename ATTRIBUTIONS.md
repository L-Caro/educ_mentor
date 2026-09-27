# Attributions

Les données tierces embarquées dans le dépôt, et sous quelle licence.

## Lexique 3.83

`backend/src/modules/alphabet/data/mots.json` est une **œuvre dérivée** de Lexique 3.83,
base de données lexicales du français.

- Source : <http://www.lexique.org>
- Licence : **CC BY-SA 4.0** (<https://creativecommons.org/licenses/by-sa/4.0/>)
- Référence : New, B., Pallier, C., Brysbaert, M., & Ferrand, L. (2004). *Lexique 2 : A
  New French Lexical Database.* Behavior Research Methods, Instruments, & Computers,
  36(3), 516-524.

Ce qui en est tiré : les lemmes (noms, adjectifs, verbes) de quatre à douze lettres,
au-dessus d'un seuil de fréquence bas, moins une liste d'exclusion écrite à la main.
Le filtrage est décrit et reproductible dans `scripts/generate-mots-alphabet.mjs` ; le
fichier source `scripts/data/Lexique383.tsv` n'est pas versionné (25 Mo).

**CC BY-SA oblige au partage à l'identique** : si ce fichier dérivé est redistribué, il
doit l'être sous la même licence, avec la même attribution. Le reste du dépôt n'est pas
concerné : la licence porte sur la donnée dérivée, pas sur le code qui la lit.
