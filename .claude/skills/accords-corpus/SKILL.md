---
name: accords-corpus
description: Ajoute des noms, adjectifs ou verbes au corpus du module Accords d'educ_mentor — genre, nombre, accord de l'adjectif, du groupe nominal et du sujet avec le verbe, pour un enfant de CE1. Produit du TypeScript à coller dans accords.corpus.ts. Se déclenche quand Lionel demande du vocabulaire pour les accords, veut enrichir le corpus, ajouter une famille de pluriels, ou fournit une liste de mots à intégrer. Pendant du skill grammaire-corpus, côté morphologie.
---

# Générateur de contenu — module Accords

Ce skill produit des **entrées de corpus TypeScript** pour
`backend/src/modules/accords/accords.corpus.ts`. Trois listes : `NOMS`, `ADJECTIFS`,
`VERBES`. Aucun JSON, aucun import : c'est du code, pour les mêmes raisons que
`grammaire-corpus`, en plus fort.

## Le risque propre à ce module

Dans les autres modules, une erreur de contenu donne une question médiocre. Ici la réponse
attendue de l'enfant **est une orthographe**. `nom('cheval', 'cheval', 'chevals', ...)`
compile, passe le lint, et « chevals » devient la bonne réponse — l'enfant qui écrit
« chevaux » a tort contre la machine.

C'est pourquoi `accords.corpus.spec.ts` tient une vingtaine d'invariants, et pourquoi la
règle suivante n'est pas négociable.

## La règle : ne jamais dépasser ce que la fiche explique

Le module n'interroge que la morphologie décrite dans `cours/francais/accords.tsx`. Un
enfant qui rate une question doit pouvoir trouver la réponse dans la fiche. L'inverse est
une question piégée.

**Ce que la fiche du NOMBRE énumère, et donc tout ce qui est permis :**

| Famille | Règle | Exemples acceptés |
|---|---|---|
| régulière | + s | chat/chats, table/tables |
| en -eau, -au, -eu | + x | gâteau/gâteaux, jeu/jeux, eau/eaux |
| en -s, -x, -z | invariable | souris/souris, nez/nez, croix/croix |

**Interdits**, parce que la fiche n'en dit rien :

- -al → -aux : cheval, journal, animal, hôpital
- -ou → -oux : genou, chou, hibou, bijou
- pluriels doubles ou irréguliers : œil/yeux, monsieur/messieurs

**Ce que la fiche de l'ADJECTIF énumère :**

| Règle | Exemples acceptés |
|---|---|
| féminin en + e | petit/petite, vert/verte, content/contente |
| pluriel en + s | petits/petites, verts/vertes |
| déjà terminé par e → féminin invariable | rouge, jaune, calme, sage, propre |

**Interdits** :

- féminin irrégulier : beau/belle, blanc/blanche, long/longue, gentil/gentille, doux/douce
- masculin pluriel invariable (-s, -x) : gris, gros, vieux, heureux
- La fiche mentionne « beau, beaux » pour le pluriel, mais pas « belle ». Un adjectif dont
  UNE des quatre formes sort du périmètre est entièrement exclu.

**Ce que la fiche du SUJET-VERBE énonce :** « Plusieurs : le verbe prend -nt. » Tout verbe
dont la 3ᵉ personne du pluriel finit par `nt` est donc acceptable — y compris les
irréguliers (sont, ont, vont, font), qui respectent la règle.

## Les trois constructeurs

```ts
nom('chat', 'chat', 'chats', 'masculin', 'animal')
nom('histoire', 'histoire', 'histoires', 'feminin', 'abstrait', { elision: true })

adjectif('petit', ['petit', 'petite', 'petits', 'petites'], 'avant', 'taille', TOUT)
adjectif('sucre', ['sucré', 'sucrée', 'sucrés', 'sucrées'], 'apres', 'gout', ['aliment'])

verbe('jouer', 'jouer', 'joue', 'jouent', 'dans le jardin.', true, ANIME)
```

### `nom(key, singulier, pluriel, genre, categorie, options?)`

- `key` : identifiant sans accent ni espace, unique. `gateau`, `ecole`.
- `pluriel` : **écrit en entier**, jamais dérivé. C'est ce qui permet aux irréguliers
  d'exister sans code, et c'est ce que les tests vérifient.
- `categorie` : `personne` `animal` `objet` `aliment` `lieu` `nature` `corps` `abstrait`.
- `elision` : se déduit d'une voyelle initiale. À passer **explicitement** pour un h muet
  (`l’histoire`, `l’hiver`) — rien dans l'orthographe ne distingue le h muet du h aspiré
  (`le hibou`), donc aucune règle ne peut le deviner.

### `adjectif(key, [ms, fs, mp, fp], place, famille, sappliqueA)`

- **Les quatre formes en entier**, dans cet ordre : masculin singulier, féminin singulier,
  masculin pluriel, féminin pluriel.
- `place` : `avant` (petit, grand, joli, jeune) ou `apres` (couleurs et presque tout le
  reste). Se tromper produit « un chat petit ».
- `famille` : `taille` `couleur` `caractere` `etat` `forme` `gout` `age` `vitesse`
  `aspect`. Deux adjectifs de la même famille dans un groupe nominal se contredisent —
  « le chapeau vert rouge ».
- `sappliqueA` : les catégories de noms qu'il peut qualifier. Raccourcis disponibles :
  `TOUT`, `ANIME` (personne + animal), `CHOSES` (objet, aliment, lieu, nature, corps).

### `verbe(key, infinitif, s3, p3, suite, homophone, sujets)`

- `s3` / `p3` : 3ᵉ personne du singulier et du pluriel, au présent.
- `suite` : **la fin de la phrase, portée par le verbe**. Sans elle, le générateur
  produirait « les chats prennent dans le jardin ». Un verbe transitif doit fournir son
  objet ; un intransitif fournit un complément ou rien de plus qu'un point.
- `homophone` : `true` si `s3` et `p3` se **prononcent** pareil (joue/jouent,
  chante/chantent — tous les verbes en -er). C'est le cas difficile, et la difficulté du
  module s'y accroche. Les irréguliers audibles (est/sont, va/vont) sont `false`, donc
  **plus faciles** — à l'envers de l'intuition.
- `sujets` : qui peut faire cette action. `['personne']` pour écrire, lire, dessiner,
  danser ; `ANIME` pour dormir, courir, manger.

## Le piège de l'absurdité sémantique

`categorie`, `sappliqueA`, `famille` et `sujets` ne servent **pas** l'accord — l'accord de
« chapeau » ne dépend pas de ce qu'est un chapeau. Ils existent parce qu'une première
version sans eux produisait :

```
les chapeaux sucrés          adjectif incompatible avec la catégorie
les nez contents             idem
le chapeau vert rapide       deux adjectifs derrière, familles qui s'empilent mal
Les chiens dessinent un soleil.   sujet incapable de l'action
```

Chacune est grammaticalement juste. Et chacune arrête l'enfant sur l'absurdité au lieu de
la faire compter les s. Renseigner ces champs au plus juste est donc du travail utile, pas
de la décoration : un `TOUT` posé par facilité rouvre le problème.

## Méthode

1. **Regarder ce qui manque.** Combien de noms par famille de pluriel ? Les tests exigent
   au moins 15 réguliers, 5 en -x, 3 invariables — mais l'enjeu réel est la variété, pour
   que l'enfant ne revoie pas « gâteau » à chaque partie.
2. **Vocabulaire de CE1.** École, maison, animaux, nourriture, corps, jeux. Un mot inconnu
   déplace la question : elle porte sur l'accord, pas sur le lexique.
3. **Vérifier chaque forme dans un dictionnaire, pas de mémoire.** C'est le point où une
   erreur coûte le plus cher, et c'est aussi le plus facile à survoler.
4. **Renseigner la sémantique en pensant aux paires produites.** Pour un nom neuf, se
   demander quels adjectifs du corpus vont l'atteindre ; pour un adjectif neuf, quels noms.
5. **Doser.** Un lot de 10 à 20 entrées, réparties sur les trois listes.

## Après génération — obligatoire

```bash
cd backend
node ./node_modules/jest/bin/jest.js src/modules/accords
npm run lint:fix && npm run typecheck
```

Les invariants de `accords.corpus.spec.ts` rendent la **liste** des entrées fautives par
leur clé. Ils attrapent : un pluriel hors périmètre, un x sur un nom qui n'est pas en
-eau/-au/-eu, une invariabilité sur un nom qui ne finit pas par -s/-x/-z, une élision
oubliée sur une voyelle initiale, un féminin irrégulier, un verbe dont le pluriel ne finit
pas par -nt, un nom sans aucun adjectif compatible, un verbe sans aucun sujet possible.

Ce qu'ils **n'attrapent pas**, et qu'il faut relire à l'œil : une forme correctement
structurée mais fausse (`table/tables/masculin`), et une paire sémantiquement bancale que
les catégories laissent passer. Vérifier la sortie réelle vaut mieux que la lire :

```bash
# une séance de chaque difficulté, telle que l'enfant la verra
node ./node_modules/ts-node/dist/bin.js -e "
const { generateQuestions } = require('./src/modules/accords/accords.logic');
const { NOTION_KEYS } = require('./src/modules/accords/accords.notions');
const r = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
for (const q of generateQuestions(15, NOTION_KEYS, 'hard', NOTION_KEYS, r))
  console.log(q.depart ? q.depart + ' → ' : '', q.avant + '___' + q.apres, '=>', q.answer);
"
```

## Fichiers

- Le corpus lui-même documente ses choix en tête de fichier : la règle de périmètre y est
  écrite, avec la liste des exclusions et leur raison.
