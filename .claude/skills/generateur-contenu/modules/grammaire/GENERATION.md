# Module Grammaire — génération

Ce skill produit des **appels de constructeurs TypeScript** à insérer dans
`backend/src/modules/grammaire/grammaire.corpus.ts`.

## Pourquoi ce n'est pas du JSON, contrairement à la dictée

Le module Dictée stocke son contenu en base et l'importe par un textarea JSON. La grammaire
non : son corpus est du **code**, et c'est délibéré.

Un item de dictée est une chaîne. Une phrase de grammaire est une structure où **chaque mot
porte une nature et une fonction** — et une annotation fausse n'est pas un contenu médiocre,
c'est du faux français enseigné à un enfant qui apprend. `nc('dort')` compile parfaitement
et affirme que « dort » est un nom. Un textarea d'import aurait été le seul endroit du
module capable d'injecter ça.

Conséquence pratique : **étendre le corpus demande un commit et un déploiement**, comme
pour une figure de géométrie ou une fiche de cours. En échange, `grammaire.corpus.spec.ts`
tient quatorze invariants, et la barrière de déploiement les rejoue.

## Les constructeurs

Ils sont privés au fichier — on écrit dans `grammaire.corpus.ts`, pas ailleurs.

| Mot | Nature |
|---|---|
| `nc('chat')` | nom commun |
| `np('Maëve')` | nom propre |
| `v('dort')` | verbe |
| `d('le')` | déterminant |
| `adj('petit')` | adjectif |
| `pron('Elle')` | pronom personnel sujet |
| `inv('souvent')` | mot invariable (adverbe **ou** préposition) |

Second argument facultatif : la **ponctuation accolée**, affichée mais jamais cliquable.
`v('dort', '.')`, `nc('matin', ',')`, `v('viens', ' ?')` (espace insécable avant `?` en
français — l'écrire dans la chaîne).

| Groupe | Effet |
|---|---|
| `gn(...)` | un groupe nominal — index attribué automatiquement, jamais à la main |
| `sujet(...)` | pose `fonction: 'sujet'` sur tout ce qu'il contient |
| `complement(...)` | pose `fonction: 'complement'` |
| `gnSujet(...)` | raccourci pour `sujet(gn(...))` — le cas courant |

```ts
phrase('chat-dort-tapis', 'moyen', [
  gnSujet(d('Le'), nc('chat')),
  v('dort'),
  complement(inv('sur'), gn(d('le'), nc('tapis', '.'))),
]),
```

Écrire l'annotation par groupes et non mot par mot n'est pas cosmétique : répéter
`{ fonction: 'sujet', gn: 0 }` sur les trois mots d'un groupe, c'est trois occasions de
divergence. Les constructeurs suppriment cette classe d'erreur.

## Les treize règles d'annotation

Les dix premières sont **vérifiées par les tests** : les enfreindre casse la barrière de
déploiement, pas la production. Les trois dernières sont des choix de conception que rien
ne vérifie — les tenir à la main.

1. **Un seul verbe par phrase.** Donc **temps simples uniquement** : présent, imparfait,
   futur. « a dessiné » compte pour deux mots et casse l'invariant.
2. **Un seul groupe sujet par phrase.** Un sujet coordonné reste UN groupe :
   `sujet(gn(np('Maëve')), inv('et'), gn(np('Léa')))`.
3. **Le verbe n'a ni fonction ni groupe nominal.** Il reste nu, hors de tout groupe.
4. **Tout groupe nominal contient un nom** (commun ou propre).
5. **Un groupe nominal ne contient que** déterminant, nom, adjectif. Une préposition n'y
   entre pas : elle est dans le `complement`, à côté du `gn`.
6. **Un groupe nominal est contigu.** Ses mots se suivent, sans rien entre eux.
7. **Le pronom sujet n'entre jamais dans un `gn`** — il prend la place du groupe nominal,
   il ne s'y ajoute pas. Toujours `sujet(pron('Elle'))`.
8. **Majuscule au premier mot, ponctuation finale** (`.` `!` `?`).
9. **Pas d'espace après une élision.** Écrire `d('l’')` puis `nc('oiseau')` : le collage se
   déduit de l'apostrophe, il n'y a pas de drapeau à poser.
10. **Clé unique**, en kebab-case, tirée des mots porteurs : `petit-chat-noir-dort`.
11. **Le complément est CIRCONSTANCIEL uniquement** — où, quand, comment. C'est la
    définition de la fiche du cours, et le CE1 n'apprend pas le complément d'objet. Un
    groupe nominal objet reste un `gn(...)` **sans fonction** : dans « Maëve mange une
    pomme rouge », `une pomme rouge` n'est ni sujet ni complément. La phrase sert alors aux
    questions de nature et de groupe nominal, pas à celles de fonction. C'est normal.
12. **Jamais deux compléments côte à côte.** Le module compte les compléments par suites
    consécutives : deux groupes adjacents seraient lus comme un seul. Toujours du texte
    entre eux (verbe, sujet). Deux compléments séparés sont permis — la phrase est
    simplement écartée des questions de complément, et reste utilisable ailleurs.
13. **Une seule ambiguïté par phrase, et jamais dans le mot interrogé par erreur.** Le
    corpus contient exprès des mots ambigus hors contexte — *ferme*, *porte*, *gare*,
    *cuisine* — parce qu'ils justifient tout le module. Les annoter selon le sens
    RÉELLEMENT employé dans la phrase, jamais selon le sens le plus courant.

## Ce qu'il faut éviter d'écrire

Ces tournures ne sont pas annotables proprement au CE1. Les tests ne les attrapent pas.

| À éviter | Pourquoi |
|---|---|
| `au`, `aux`, `du` préposition (« au ballon », « près du feu ») | contraction préposition + déterminant : un seul mot, deux natures |
| complément du nom (« la porte de la classe ») | pas au programme, et casse la contiguïté du groupe nominal |
| être + attribut (« le chat est gris ») | l'attribut n'est pas enseigné ; `gris` n'est pas un complément |
| passé composé, futur proche | verbe en deux mots, cf. règle 1 |
| verbes pronominaux (« s'envole ») | le pronom réfléchi n'est pas un pronom sujet |
| négation (« ne… pas ») | deux invariables encadrant le verbe, plus déroutant qu'utile |

`du` **partitif** est en revanche un déterminant, et il est accepté : « le boulanger vend
du pain ».

## Les niveaux

| Niveau | Contenu | Repère |
|---|---|---|
| `simple` | déterminant + nom + verbe | 2 à 3 mots porteurs, aucun adjectif |
| `moyen` | + un adjectif, + un complément, + un invariable | 4 à 6 mots |
| `complexe` | groupe nominal étendu, sujet inversé, sujet coordonné, mot ambigu | 6 à 10 mots |

Le niveau est **annoté, pas calculé**. Ne pas le déduire du nombre de mots : une phrase
courte avec *ferme* est plus dure qu'une longue phrase plate.

## Méthode

1. **Regarder ce qui manque avant d'écrire.** Quelle notion est sous-représentée ? Le
   pronom sujet, le mot invariable et le nom propre sont les plus faciles à oublier.
2. **Doser.** Sauf demande précise, un lot de 12 à 20 phrases, réparties sur les trois
   niveaux, en couvrant plusieurs notions.
3. **Sujets familiers.** École, maison, animaux, saisons, jeux. La difficulté est
   grammaticale, pas lexicale : un mot inconnu déplace la question.
4. **Écrire la phrase d'abord, l'annoter ensuite.** Annoter en écrivant produit des phrases
   tordues pour arranger l'annotation.
5. **Relire chaque annotation en se posant la question du test**, pas celle du sens : ce mot
   est-il dans le bon groupe ? le complément est-il bien circonstanciel ?

## Après génération — obligatoire

Insérer les phrases dans la section du bon niveau de `CORPUS`, puis **jouer les tests** :

```bash
cd backend
node ./node_modules/jest/bin/jest.js src/modules/grammaire
npm run lint:fix && npm run typecheck
```

Les quatorze invariants de `grammaire.corpus.spec.ts` rendent la **liste** des phrases
fautives, par leur clé — pas seulement la première. Une annotation qui passe le typage
mais viole une règle est attrapée là, et nulle part ailleurs.

Puis relire à l'œil les phrases ajoutées : les tests vérifient la STRUCTURE, ils ne
peuvent pas voir qu'un nom a été annoté verbe. C'est la seule relecture qui attrape ça.

## Fichiers

- `modules/grammaire/reference/annotation.md` — les cas d'annotation tranchés, avec leur
  raison. À consulter au moindre doute sur un mot.
