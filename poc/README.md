# POC — extraction des flashcards kids-flashcards.com

Récupère l'intégralité du catalogue anglais de [kids-flashcards.com](https://kids-flashcards.com/en/flashcards-in-english)
(18 thèmes, 59 sets, ~1300 cartes) pour alimenter le module `imagier` d'ÉducMentor.
Usage familial / éducatif uniquement (conforme aux conditions du site).

## Lancer

```bash
npm install
npm run scrape
```

Node 24+ (exécute le TypeScript nativement). Durée : ~2 min à froid, ~50 s ensuite
(les images déjà téléchargées ne le sont pas deux fois).

Puis, pour produire le format d'import educ_mentor :

```bash
npm run to-imagier
```

Scripts annexes : `npm run catalog` (liste thèmes/sets), `npm run set` (dump d'un set),
`npm run samples` (échantillon d'images brutes + variantes de rognage).

## Sorties (`out/`)

| | |
|---|---|
| `flashcards.json` | structure du site (`themes[].sets[].cards[]`) + liste à plat dédupliquée (`words[]`) |
| `report.md` | écarts, traductions à relire, collisions de slug — **à lire avant intégration** |
| `images/<mot-en>.webp` | image de la carte, rognée de 18 % en bas pour retirer le mot incrusté, largeur ≤ 640 px |
| `dictionnaire_thematique.json` | `npm run to-imagier` — prêt pour l'admin « Import JSON » d'educ_mentor |
| `imagier-images/<catégorie>/<mot-fr>.webp` | idem, images renommées en FR et rangées par catégorie (à copier dans `data/images/imagier/`) |
| `imagier-collisions.md` | slugs FR en double : ceux qui perdent un sens (à trancher) vs les doublons inter-sets |

## Mapping vers la taxonomie educ_mentor (`npm run to-imagier`)

- `category-map.json` : thème kids-flashcards → catégorie FR, set → sous-catégorie FR. **Éditable.**
- `word-overrides.json` : traductions dépendantes de la catégorie (`cook` → « cuisinier » dans
  `personnes`, « cuisiner » dans `verbes`).
- Le script échoue si un thème/set du catalogue n'est pas mappé.

Chaque carte : `{ imgid, en, fr, frSource, imageUrl, imageFile }`.
`frSource` vaut `dictionary` (repris de `frontend/.../dictionary.json`), `override`
(proposé ici, dans `translations.overrides.json`) ou `missing`.

## Traductions

1. `dictionary.json` d'ÉducMentor est consulté en premier (aligne les slugs sur l'existant).
2. `translations.overrides.json` complète le reste (édité à la main, relire via `report.md`).
3. Un mot sans traduction ressort dans `report.md` → à compléter puis relancer.

## Limites connues

- Le nombre de cartes annoncé par le site est parfois faux (voir `report.md`, 1 set concerné).
- `slug = normalize(fr)` est unique côté ÉducMentor : deux mots EN traduits pareil
  (`pool`/`swimming pool`, homonymes `avocat`, `kaki`…) → un seul survivra à l'import.
- Rognage à 18 % validé sur échantillon ; un sujet très bas pourrait être coupé de quelques pixels.
- Le module `imagier` importe les images en scannant `data/images/imagier/<catégorie>/` :
  le rangement des `out/images/` dans cette arborescence fait partie de l'étape d'intégration (prod), hors POC.
