# Module Dictée : génération

Produit le JSON que l'écran **Administration → Dictée → Importer** attend : mots, phrases
et paragraphes à dicter à un enfant de CE1 (7 ans). Le module ne génère rien à
l'exécution : tout le contenu est écrit ici, relu par Lionel, puis importé.

## Ce que le module fait du contenu

Un **item** = une unité que l'adulte dicte d'une traite, l'enfant l'écrit sur papier.
Le niveau choisi au pré-jeu détermine le format de l'item servi :

| Niveau | Format de `contenu` | Longueur visée |
|---|---|---|
| `debutant` | un mot isolé | 1 mot |
| `normal` | une phrase | 6 à 10 mots |
| `difficile` | un paragraphe | 4 à 5 phrases liées |

À la fin d'une dictée, l'enfant (ou l'adulte) clique sur les mots ratés. Ces mots sont
comptés et agrégés sur l'année : c'est la seule donnée de suivi. Le `contenu` est donc
découpé mot à mot côté module : pas besoin de le pré-segmenter ici.

## Schéma de sortie

```json
{
  "items": [
    {
      "niveau": "debutant",
      "contenu": "cheval",
      "notions": ["lettres muettes finales", "son [ʃ] : ch"]
    },
    {
      "niveau": "normal",
      "contenu": "Le petit chat gris dort près du feu.",
      "notions": ["accord dans le groupe nominal", "accents : é è ê"]
    },
    {
      "niveau": "difficile",
      "contenu": "Ce matin, la neige recouvre le jardin. Les enfants sortent vite. Ils lancent des boules blanches. Le chien court derrière eux. Tout le monde rit.",
      "notions": ["homophones : a / à", "accord sujet-verbe", "pluriel en -s"]
    }
  ]
}
```

Règles de forme, non négociables (le module et l'import les supposent) :

- Racine `{ "items": [...] }`. Un tableau nu `[...]` est aussi accepté par l'import, mais
  garder la forme enveloppée.
- `niveau` ∈ `debutant` | `normal` | `difficile`. Rien d'autre.
- `contenu` :
  - `debutant` : un seul mot, minuscules, **avec les accents et traits d'union réels**
    (`éléphant`, `arc-en-ciel`). Pas de ponctuation.
  - `normal` / `difficile` : ponctuation et majuscules réelles, apostrophe droite `'`
    (jamais `’`), pas de cadratin `—` (règle du projet).
- `notions` : 1 à 3 entrées, **copiées mot pour mot** depuis `reference/notions.md`.
  Ne jamais inventer un libellé : le filtre du pré-jeu se construit sur ces chaînes, une
  variante orthographique crée une fausse catégorie.

## Méthode de génération

1. **Cibler**. Par défaut : CE1, ~7 ans, milieu d'année. Si Lionel donne une liste de mots
   (mots de la semaine, mots outils), partir de cette liste ; sinon piocher dans le
   vocabulaire courant de fin de CP / CE1.
2. **Un item, une intention orthographique**. Chaque item doit exercer une difficulté
   identifiable, reflétée dans `notions`. Un mot ou une phrase sans piège n'apprend rien.
3. **Rester lisible et concret**. Sujets familiers (école, maison, animaux, saisons,
   jeux). Phrases courtes, vocabulaire connu : la difficulté est orthographique, pas
   lexicale ni syntaxique.
4. **Doser**. Sauf demande précise, produire par lot : ~20 `debutant`, ~12 `normal`,
   ~5 `difficile`, en couvrant des notions variées (ne pas faire 20 items sur les accents).
5. **Difficile = un vrai texte**. Les 4-5 phrases s'enchaînent (même scène, mêmes
   personnages), elles ne sont pas juxtaposées au hasard.
6. **Vérifier chaque `contenu`** : orthographe, accord, ponctuation. C'est du contenu qu'un
   enfant qui apprend à écrire va recopier : une faute ici s'apprend à l'envers.

## Après génération

- Écrire le JSON dans un fichier (`dictee-<thème ou date>.json`) et le proposer à Lionel.
- Lui rappeler : **relire le contenu**, puis Administration → Dictée → Importer, cocher
  « Remplacer » seulement pour repartir de zéro, « Activer » pour rendre les items jouables.

## Fichiers

- `reference/notions.md` : le vocabulaire de notions autorisé. Source unique.
- `reference/sample.json` : un échantillon complet des trois niveaux, pour référence de forme.
