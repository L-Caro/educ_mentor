# Cas d'annotation tranchés

Les décisions déjà prises dans `grammaire.corpus.ts`, avec leur raison. À suivre pour que
le corpus reste cohérent : deux phrases qui annotent le même mot différemment enseignent
qu'il n'y a pas de règle.

## Déterminants

Sont des déterminants, sans hésitation :

| Catégorie | Exemples |
|---|---|
| articles définis | `le` `la` `les` `l’` |
| articles indéfinis | `un` `une` `des` |
| partitifs | `du` `de la` (« vend **du** pain ») |
| possessifs | `mon` `ma` `mes` `son` `sa` `ses` `notre` `leur` |
| démonstratifs | `ce` `cet` `cette` `ces` |

La fiche du cours dit « le petit mot placé devant le nom » : c'est exactement ce test, et il
couvre les cinq catégories sans avoir à les nommer à l'enfant.

**`l’` reste un déterminant** même s'il ne dit plus le genre. C'est le piège explicite de la
fiche, il faut donc des phrases qui le contiennent.

**`du` préposition est à éviter** : « près **du** feu » contracte `de` + `le`. Le partitif de
« vend du pain » est accepté parce qu'il ne contracte rien de perceptible pour un CE1.

## Mots invariables

La fiche range ensemble adverbes et prépositions, sous le seul critère qui compte à cet
âge : **ça ne change jamais d'écriture**. Donc :

- adverbes : `souvent` `toujours` `vite` `dehors` `bientôt` `demain` `hier` `ensemble`
  `lentement` `profondément` `tranquillement` `beaucoup` `là-bas`
- prépositions : `dans` `sur` `sous` `avec` `chez` `sans` `derrière` `devant`
- coordination : `et` `ou` `mais`

Ne pas chercher à distinguer adverbe et préposition dans l'annotation : le module ne
l'interroge pas, et le programme de CE1 ne le demande pas.

## Adjectifs

Le test de la fiche est **le retrait** : on l'enlève, la phrase tient. `un grand chien` →
`un chien`. Attention aux deux positions, souvent oubliées à l'annotation :

- devant : `le **petit** chat`
- derrière : `une maison **bleue**`
- les deux à la fois : `le **petit** chat **noir**`, deux adjectifs, un seul nom, un seul
  groupe nominal

Un adjectif appartient au groupe nominal de son nom. Il ne sort jamais du `gn`.

## Le sujet

Toujours le groupe **entier**, jamais le seul nom. « Qui est-ce qui dort ? » → « le petit
chat », pas « chat ». C'est la réponse à la question, et c'est aussi ce qui commande
l'accord.

Trois formes à couvrir :

```ts
gnSujet(d('Le'), adj('petit'), nc('chat'))                       // groupe nominal
sujet(pron('Elle'))                                              // pronom, hors gn
sujet(gn(np('Maëve')), inv('et'), gn(np('Léa')))                 // coordonné, UN groupe
```

**Le sujet inversé est précieux** : c'est le piège de la fiche (« Sous la table dort le
chat »). Il en faut, mais uniquement au niveau `complexe`.

## Le complément

Circonstanciel **seulement** : où, quand, comment. Trois formes :

```ts
complement(inv('sur'), gn(d('le'), nc('tapis', '.')))    // préposition + groupe nominal
complement(gn(d('Ce'), nc('matin', ',')))                // groupe nominal seul
complement(inv('vite', '.'))                             // adverbe seul
```

La préposition est **dans** le complément mais **hors** du groupe nominal : elle n'est ni
déterminant, ni nom, ni adjectif.

Ce qui n'est PAS un complément ici, malgré l'usage courant :

| Phrase | `une pomme rouge` est… |
|---|---|
| Maëve mange une pomme rouge. | un `gn(...)` **sans fonction** |

Le CE1 n'apprend pas le complément d'objet, et la fiche définit le complément par « où,
quand, comment ». L'annoter complément enseignerait quelque chose que la fiche contredit.
Une phrase peut parfaitement n'avoir aucun complément : elle sert alors aux questions de
nature et de groupe nominal.

## Le complément d'objet (CE2) et l'attribut (CM1)

Ces deux fonctions n'existent pas avant le CE2 et le CM1. Une phrase du socle qui en
porterait une serait servie à un CE1, la phrase étant ouverte et la notion fermée.

**Le complément d'objet** : ce sur quoi porte l'action. Il suit le verbe, sans préposition
pour un COD, avec `à` ou `de` pour un COI.

```ts
gnSujet(np('Léa')), v('mange'), objet(gn(d('une'), nc('pomme', '.')))
```

Avant le CE2, le même groupe reste un `gn(...)` nu, sans fonction. Ce n'est pas un oubli :
la notion n'est pas enseignée, et lui donner une fonction reviendrait à l'enseigner.

**L'attribut du sujet**, ce que le sujet EST. Il suit un verbe d'état : être, sembler,
devenir, paraître, rester, demeurer.

```ts
gnSujet(d('Le'), nc('chat')), v('est'), attribut(adj('noir', '.'))
```

Le test qui sépare les deux, et qu'il faut appliquer à chaque annotation :

| | s'accorde avec le sujet ? | exemple |
|---|---|---|
| attribut | **oui** | les fleurs semblent fané**es** |
| complément d'objet | non | les fleurs sentent bon |

Un attribut ne va **jamais** dans un `gn` : ce n'est pas un groupe nominal, c'est ce qu'on
dit du sujet. Un adjectif attribut n'appartient donc à aucun groupe nominal, contrairement
à l'adjectif épithète (« le chat noir ») qui est dans celui de son nom.

Les verbes d'état sont aussi la seule raison d'écrire « être » suivi d'un adjectif : ce
que le socle CE1 s'interdit explicitement, faute de pouvoir annoter l'attribut.

## Mots ambigus : le cœur du module

Ces mots n'ont pas de nature hors phrase. Ils justifient à eux seuls qu'on ne demande
jamais « quelle est la nature de *ferme* ? ». En mettre, et les annoter selon le sens
employé.

| Mot | Comme nom | Comme verbe |
|---|---|---|
| ferme | la ferme du voisin | le fermier ferme la porte |
| porte | la porte grince | elle porte une robe |
| gare | la gare est loin | papa gare la voiture |
| cuisine | la cuisine est propre | papa cuisine |
| sourire | son sourire est doux | les enfants sourient |
| marche | la marche est cassée | elle marche vite |

Autres ambiguïtés utiles, autrement placées :

- `la` : déterminant (`la table`) ou pronom (`il la voit`). **Éviter le pronom
  complément** : ce n'est pas un pronom sujet, il n'a pas de case dans ce module.
- `est` : verbe. Éviter les phrases où il introduit un attribut (cf. SKILL.md).

## Noms propres

Un nom propre forme un groupe nominal **à lui seul**, sans déterminant :
`gnSujet(np('Maëve'))`. C'est le piège de la fiche du groupe nominal.

Prénoms utilisés dans le corpus : `Maëve`, `Léa`, `Papa`, `Médor`. Réutiliser les mêmes
plutôt que d'en inventer : l'enfant reconnaît ses repères, et la question porte sur la
grammaire, pas sur qui est ce nouveau personnage.

## Apostrophe : `’` et non `'`

Le corpus utilise l'apostrophe typographique `’`. Deux raisons, dans cet ordre :

1. `'` dans une chaîne TypeScript à guillemets simples demande un échappement
   (`'l\''`), illisible dans un corpus qu'on relit à l'œil.
2. C'est l'apostrophe française correcte, et cette chaîne est **affichée** à l'enfant.

C'est une divergence assumée avec `modules/dictee/`, qui impose `'`. Là-bas
l'apostrophe entre dans une clé de comparaison normalisée (`cleanWord`), donc sa forme
compte pour l'égalité. Ici elle n'est que rendue. La détection d'élision de
`grammaire.corpus.ts` accepte les deux, mais rester sur `’` par cohérence interne.

## Ponctuation finale et interne

La ponctuation est portée par le **dernier mot qu'elle suit**, en second argument :

```ts
v('dort', '.')                                    // point final
complement(gn(d('Ce'), nc('matin', ',')))         // virgule après un complément détaché
nc('tapis', '.')                                  // le point est sur le dernier mot, pas ailleurs
v('viens', ' ?')                                  // espace avant le point d'interrogation
```

Elle est affichée, jamais cliquable : un enfant à qui on demande de toucher les noms ne
doit pas pouvoir toucher un point.
