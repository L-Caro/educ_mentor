# Chantiers — ÉducMentor

> **Document vivant.** C'est le point de reprise : où on en est, ce qui est décidé, ce qui reste ouvert.
> Dernière mise à jour : **2026-09-04**.

## Les documents du dossier

| Fichier | Rôle |
|---|---|
| `CHANTIERS.md` | **ce fichier** — l'état courant, à tenir à jour |
| `AUDIT_FULLSTACK_2026-07-07.md` | archive — audit initial, instantané figé |
| `AUDIT_2026-08-24_ET_ORIENTATION_COURS.md` | archive — audit delta + première réflexion Cours (⚠️ son plan d'implémentation est **caduc**, cf. chantier B) |
| `frontend/CLAUDE.md` | architecture front, à jour et fiable |

Les deux audits sont des **instantanés datés** : on ne les modifie pas, on les lit pour le détail. Le statut courant vit ici.

---

## Où on en est

**Fait :**
- deux audits complets, exécutés (lint, tsc, mesures corpus)
- trois actions sur le corpus de leçons : gitignore, miroir des images, parseur
- **chantier A terminé** : dette technique traitée de A0 à A4, sur la branche `chantier-a-robustesse` (12 commits, non poussée)

- **chantier B, étape 1 faite** : la fiche réactive, validée par Maëve, branchée sur les
  six modules qui ont une règle à expliquer. Branche `fiches`, 10 commits, non poussée.

**Reste :**
- A5 — dépendances vulnérables, préexistantes, délibérément non traitées (voir plus bas)
- chantier B, suite : le mode « école » (bibliothèque de fiches), qui demande des entités
  et une migration — contrairement à tout ce qui a été fait jusqu'ici

**Ce qu'il faut retenir de la dérive de départ** — le travail sur le corpus avait été qualifié d'« actions sans regret », et la dette avait été repoussée de réponse en réponse. Elle est maintenant payée ; la règle qui l'a permis reste valable : nommer l'hypothèse non validée avant de coder, et exécuter le bloquant plutôt que le répéter.

**Le chantier B est désormais possible sans risque** : il ajoute des entités en base, le schéma n'évolue que par migration, et la sauvegarde existe.

---

# Chantier A — Dette technique ✅ **terminé** (2026-08-24)

Branche `chantier-a-robustesse`, 11 commits, **non poussée** — le déploiement reste ta décision.

| | |
|---|---|
| A0 | migrations versionnées, `synchronize` désactivé, sauvegarde complète, `db:check` |
| A1 | lint capable d'échouer ; 666 + 15 erreurs corrigées ; `.gitattributes` |
| A2 | barrière lint + typecheck + test + e2e avant tout déploiement |
| A3 | cohérence des registres de modules (bug `snake`), nettoyage, README |
| A4 | `strict: true`, 29 tests, C1 · C2 · C3 · I6 |

Les 8 étapes de la CI ont été simulées localement à chaque étape. Détail dans les messages
de commit — ils portent le pourquoi de chaque correction.

### Avant de fusionner et déployer

1. **Vérifier le schéma de production.** Il a vécu sous `synchronize: true` et a pu dériver.
   La migration de référence utilise `CREATE TABLE IF NOT EXISTS` : sur une base qui a dérivé,
   elle ne corrigerait rien **et ne dirait rien**.
   ```bash
   docker compose exec backend node dist/database/check-schema.js
   ```
2. **Sauvegarder avant le premier déploiement.** `./scripts/backup-db.sh`, puis planifier le cron.
3. **Renseigner les variables de production.** L'application refuse de démarrer si
   `JWT_SECRET` est absent, égal au défaut du dépôt ou plus court que 23 caractères, si
   `DB_SYNCHRONIZE=true`, ou si `ADMIN_PIN_ENABLED=false` — cette variable court-circuite
   `AccessGuard`, donc le portail d'invitation, malgré ce que son nom suggère.
   Le code PIN n'entre pas dans ces contrôles : c'est un contrôle parental, pas une
   frontière de sécurité.
   C'est volontaire : mieux vaut un conteneur qui refuse de démarrer qu'un serveur qui signe
   ses tokens administrateur avec un secret présent dans le dépôt git. **À vérifier avant de
   pousser**, sinon le déploiement échouera au démarrage.
4. Les quatre documents à la racine (`README.md`, `CHANTIERS.md`, les deux audits) et
   `frontend/CLAUDE.md` sont maintenant versionnés.

---

# Chantier A5 — Dépendances vulnérables ⚠️ **nouveau, non traité**

`npm audit` sur le backend : **26 vulnérabilités, dont 11 hautes et 1 critique**. Toutes
préexistantes, aucune introduite par le chantier A. Les plus notables :

| Sévérité | Paquet | Nature |
|---|---|---|
| haute | `multer` (direct) | déni de service par champs profondément imbriqués |
| haute | `path-to-regexp` (via `@nestjs/serve-static`) | déni de service |
| haute | `lodash` (via `@nestjs/config`) | injection de code via `_.template` |
| critique | `@xhmikosr/decompress` | chaîne de build uniquement |

**Volontairement non traité** : corriger cela demande de monter des versions majeures de
`@nestjs/*`, ce qui peut casser l'application — exactement ce qu'on cherchait à éviter.
C'est un chantier à part entière, à mener avec le filet de tests désormais en place.

Portée réelle : toutes ces routes sont derrière `AccessGuard`. L'attaquant plausible reste
« quelqu'un à qui tu as envoyé un lien d'invitation ». À traiter pour l'hygiène, sans urgence.

---

# Chantier B — Cours

## B.1 · Ce qui est acquis

### Le corpus est prêt
`data/lecons/` — 448 leçons Kartable, CE1→CM2. Gitignoré, jamais livré tel quel.

Deux scripts, idempotents, relançables :

```bash
node scripts/mirror-lecons-images.mjs   # 1 824 images → data/lecons_media/ (24,5 Mo)
node scripts/parse-lecons.mjs           # 448 HTML → data/corpus/{corpus.json,index.json}
```

`corpus.json` — arbre de blocs typés, chaque bloc porte un **rôle** qui mappe sur un champ de fiche :
`rule` (1 160) · `example` (1 431) · `tip` (385) · `key` (108) · `warning` (54).

`index.json` — le squelette : 4 niveaux, 6 matières, **355 notions**, dont **68 spiralaires** (le même titre
revient sur 2 à 4 niveaux : « Le verbe » existe en CE1, CE2, CM1 et CM2). C'est la progression du programme,
déjà encodée. Elle justifie une fiche **par niveau**, pas une fiche par notion.

### Ce que le corpus donne — et ne donne pas

| | |
|---|---|
| ✅ la règle | présente dans 77 % des leçons |
| ✅ l'exemple | 1 431 blocs, **illustrations de qualité**, réutilisables telles quelles |
| ❌ l'idée clé | seulement **19 %** des leçons ont un résumé/mémo — à rédiger |
| ❌ 46 leçons | quasi sans texte (vocabulaire Français/Anglais) — tout est dans l'image |
| ❌ 1 leçon | vide à la source (`CM1/Exercice Maths/Identifier la classe de chaque chiffre`) |

### Décisions prises

- **Les images Kartable sont réutilisées telles quelles.** Usage privé, pas de refonte SVG.
  Vérifié visuellement : matériel pédagogique en cursive, terminaisons colorées, de bonne facture.
  → conséquence : l'exemple, poste le plus coûteux d'une fiche, devient gratuit.
- **Un seul point d'attention technique** : 2/3 des images ont un fond transparent avec encre foncée,
  1/3 un fond blanc opaque. Les deux cassent en thème sombre, en sens opposés.
  Fix retenu : une **carte « papier »** en CSS (fond clair explicite dans les deux thèmes), pas de retouche d'image.
- **Le texte livré à l'enfant est réécrit**, jamais copié. Le corpus est une source de travail.
- **La progression par notion** : table `notion_progression` alimentée par la fiche elle-même
  (option A), pas de `notionKey` à câbler dans les 13 modules (option B) — on y viendra si ça tient.

## B.2 · Ce qui a été validé, puis construit

Le plan en 8 étapes de `AUDIT_2026-08-24_ET_ORIENTATION_COURS.md` (§2.6) reste **caduc** :
il construisait le contenant (thèmes, parcours, carte) avant l'atome, et ne testait
l'hypothèse centrale qu'après une semaine de travail.

**Validation.** Trois fiches réelles publiées comme page autonome, montrées à Maëve, sans
une ligne dans l'application. Elle a accroché. C'est ce qui a autorisé la suite.

**Direction retenue : la fiche réactive.** Après une erreur, l'écran de correction propose
« 📘 Pourquoi ? ». Pas de section « Cours » à ouvrir : l'explication arrive au moment où
l'enfant veut savoir. Le mode « école » viendra après, s'il se justifie.

## B.3 · Ce qui existe aujourd'hui (branche `fiches`)

Une extension du contrat, pas une refonte :

```ts
// game.types.ts, à côté de map / pointMap / preamble
fiche?: (question: TQuestion) => Fiche | null;
```

La fonction doit être **pure** : c'est ce qui permettra au mode « école » d'engendrer sa
bibliothèque en appelant ces mêmes fonctions sur des questions types, sans dupliquer le
contenu. La pureté est testée explicitement.

| Module | Contenu de la fiche | Backend touché |
|---|---|---|
| `conjugaison` | tableau complet du verbe, ligne ratée en avant | 3 lignes (les six formes) |
| `tables` | table du plus petit facteur, commutativité | non |
| `calcul` | l'opération posée, double et moitié par l'inverse | non |
| `heure` | lecture en expression, calcul à rebours passé la demie | non |
| `monnaie` | l'opération en euros, posée en colonne au-delà de 3 termes | non |
| `numeration` | tableau de numération, décomposition triée et empilée | non |

Points de conception à ne pas défaire :

- **L'avance automatique est suspendue** sur une erreur dans un module qui sait expliquer.
  1600 ms ne laissent pas le temps de repérer un bouton. Sur une bonne réponse, rien ne
  change : on n'interrompt pas une série.
- **La feuille reste claire dans les deux thèmes.** Les illustrations du corpus ont une
  encre foncée sur fond transparent ; une feuille qui suivrait le thème sombre les rendrait
  invisibles. Le fond de cahier Séyès impose par ailleurs une grille de ligne de base :
  chaque bloc de texte a un interligne multiple du pas de la réglure.
- **`Fiche.regle` accepte plusieurs lignes.** Une décomposition en six rangs, ou une
  addition de six pièces, débordent sur une seule ligne.
- Quatre tests lisent la feuille de style pour verrouiller ces invariants de mise en page :
  ce sont des pannes dont le seul symptôme est visuel, invisibles au typage et au lint.

58 tests côté front.

## B.4 · La bibliothèque de fiches (à valider avant d'écrire quoi que ce soit)

**Ce qui a été tranché** (message du 2026-08-24) : l'utilisateur de la bibliothèque est le
PARENT, pas l'enfant. « Si je vois qu'en rentrant elle a du mal sur poser une soustraction,
on ouvre l'app et les fiches maths, on les lit. » La hiérarchie est donc
matière → grande notion → concept → fiche, les fiches sont **réécrites par nous**, et le
corpus Kartable sert de source, jamais de contenu livré.

### Le corpus est plat

355 notions sans niveau intermédiaire : il n'y a pas de « grande notion » dans la donnée,
il faut la poser à la main. Découpage proposé pour le CE1 (76 notions), à valider.

**Mathématiques · 35 notions → 5 grandes notions**

| Grande notion | Concepts | Tuile existante |
|---|---|---|
| Les nombres jusqu'à 999 | lire et écrire · représenter · décomposer · comparer et ranger | `numeration` |
| Calculer | addition en ligne · addition posée · soustraction en ligne · soustraction posée · multiplication en ligne · tables d'addition · tables de multiplication · compléments à la dizaine et à la centaine · doubles et moitiés · partage d'une quantité | `calcul` `tables` `pose` |
| Grandeurs et mesures | longueurs · masses · contenances · dates et durées · monnaie | `heure` `monnaie` |
| Espace et géométrie | repérage · déplacement · segments et droites · instruments de tracé · carré · rectangle · triangles · cercle · solides · symétrie | aucune |
| Résoudre un problème | résolution de problème · avec de la monnaie · avec des contenances · avec des dates et des durées · avec des longueurs · avec des masses | aucune |

**Français · 33 notions → 7 grandes notions**

| Grande notion | Concepts | Tuile existante |
|---|---|---|
| Les sons | [an] · [é] · [ill] · [in] · [o] · [on] · [ou] · [eu] et [oeu] · [oi] et [oin] | aucune |
| Le vocabulaire | usage du dictionnaire · ordre alphabétique · synonymes et antonymes · mot-étiquette · vocabulaire de la famille | `imagier` `pendu` |
| La phrase | la phrase · ponctuation · phrase exclamative · déclarative, interrogative et impérative | `lecture` |
| La nature des mots | nom · verbe · déterminants · adjectif qualificatif · pronoms personnels sujets · mots invariables | aucune |
| Les accords | genre des noms · nombre des noms · genre et nombre de l'adjectif · accord dans le groupe nominal · accord sujet-verbe | aucune |
| La fonction des mots | groupe nominal · sujet du verbe · compléments | aucune |
| La conjugaison | la conjugaison du verbe | `conjugaison` |

**Questionner le monde · 8 notions → 4 grandes notions**

| Grande notion | Concepts | Tuile existante |
|---|---|---|
| L'eau | changements d'état · état solide et état liquide | aucune |
| Le vivant | interactions entre les êtres vivants | aucune |
| Le temps | représentation des événements dans le temps · évolution des modes de vie de ma famille | aucune |
| Vivre ici et ailleurs | paysages en France · modes de vie en France · modes de vie dans le monde | `geo` `france` |

### État du remplissage

| Matière | Grande notion | Fiches | État |
|---|---|---|---|
| Mathématiques | Les nombres jusqu'à 999 | 4 | écrite |
| Mathématiques | Calculer | 10 | écrite, lue |
| Mathématiques | Grandeurs et mesures | 5 | écrite |
| Mathématiques | Résoudre un problème | 2 | écrite |
| Mathématiques | Espace et géométrie | 10 | écrite |
| Français | La phrase | 3 | écrite |
| Français | La nature des mots | 6 | écrite |
| Français | Les accords | 5 | écrite |
| Français | La fonction des mots | 3 | écrite |
| Français | La conjugaison | 1 | écrite |
| Français | Le vocabulaire | 5 | écrite |
| Français | Les sons | 9 | écrite |
| Questionner le monde | L'eau | 2 | écrite |
| Questionner le monde | Le vivant | 1 | écrite |
| Questionner le monde | Le temps | 2 | écrite |
| Questionner le monde | Vivre ici et ailleurs | 3 | écrite |

**71 fiches sur 71. Le CE1 est couvert.**

Les deux notions que je croyais bloquées ne l'étaient pas :

- **Les sons.** Je les avais dites en attente d'audio, à tort. Le corpus montre que ce sont
  des leçons d'ORTHOGRAPHE, pas d'écoute : « le son /o/ s'écrit o, ô, au ou eau ». L'enfant
  entend déjà le son ; ce qu'elle apprend, ce sont les graphies. Rien à jouer.
- **La géométrie.** Les formes ne sont pas insurmontables, et le SVG apporte plus que la
  reprise des images du corpus : il permet de MARQUER l'angle droit, les côtés égaux, l'axe
  de symétrie. Sur une capture, l'enfant doit deviner ce qu'il faut regarder.

Le total est passé de 76 à 71, et c'est le corpus qui l'a imposé, pas un raccourci :

- **Résoudre un problème, 6 → 2.** Le corpus consacre une leçon par grandeur (monnaie,
  longueurs, masses, contenances, durées), mais ces cinq leçons ne contiennent rien d'autre
  que « on peut résoudre un problème avec X » : tout leur contenu est dans des images
  d'exemples résolus. Les décliner aurait produit cinq fiches creuses. Ce qui reste, et qui
  est le vrai sujet : la méthode, et le choix de l'opération.
- **La phrase, 4 → 3.** Le corpus isole la phrase exclamative des trois autres types. Les
  quatre se comprennent ensemble, par ce qui les distingue ; séparés, ils deviennent quatre
  définitions à retenir au lieu d'une seule opposition à voir.

L'ordre à l'intérieur d'une matière est pédagogique : une notion vient après celles dont
elle a besoin (« Les accords » après « La nature des mots », « La fonction des mots »
après elle aussi).

### Les figures de la bibliothèque

Écrire une fiche, c'est surtout trouver comment la MONTRER : le corpus met 75 % de ses
exemples dans des images, il n'y a rien à reprendre. Cinq figures couvrent les 25 fiches.

| Figure | Ce qu'elle montre | Où |
|---|---|---|
| `Etapes` | un calcul déplié, une ligne par étape | `cours/components/` |
| `Formes` | les figures géométriques, en SVG tracé | `cours/components/` |
| `Phrases` | une phrase avec les mots marqués | `cours/components/` |
| `Paires` | deux colonnes qui se répondent | `cours/components/` |
| `DroiteGraduee` | une droite graduée avec un repère | `cours/components/` |
| `PoseFigure` `TableRappel` `NumerationRangs` | réutilisées des tuiles | `modules/` |

`Phrases` et `Paires` partagent un balisage : `[mot]` surligne, `{s}` met une terminaison
en évidence.

Le catalogue de `Formes` (`catalogue-formes.tsx`) tient les treize tracés : lignes, figures
planes, solides, symétrie, quadrillage. Il n'est pas annoté `Record<string, ReactNode>`, ce
qui garde les clés littérales : un nom de forme mal orthographié est une erreur de typage,
pas un cadre vide à l'écran.

### Ce qu'il faut trancher avant d'écrire la suite

1. **La progression.** Rien n'est suivi ni mémorisé aujourd'hui, et c'est assumé : reste à
   définir ce qui est suivi (fiche lue ? notion révisée ? lien avec la maîtrise des tuiles ?)
   et qui le voit (le parent, l'enfant, les deux ?). Le remplissage continue en attendant ;
   ça ne coûte rien puisque la progression viendra par-dessus.
2. **Les sons (français, 9 fiches).** Elles ont besoin d'AUDIO ou de rien : une fiche sur le
   son [an] qui ne le fait pas entendre n'apprend pas grand-chose. À trancher avant de les
   écrire, pas après.
3. **Espace et géométrie (10 fiches).** Ce sont des figures, pas du texte : carré, triangle,
   cercle, symétrie. Il faudra du SVG, et c'est un autre métier que les quatre figures
   actuelles. La plus grosse notion restante, et la plus chère.

### Ce qui reste vrai des questions précédentes

- Histoire (31 leçons) et Questionner le monde (38) n'ont aucune tuile : ce sont les seuls
  domaines où les Cours apportent une couverture nouvelle.
- 75 % des exemples du corpus sont cuits dans les images ; 19 % des leçons seulement ont un
  résumé. La réécriture n'est donc pas une reformulation, c'est une rédaction.

---

# Chantier C — Le trou du français : `grammaire`

Branche `module-grammaire`, worktree `../educ_mentor-grammaire` (l'arbre principal était
occupé par `module-geometrie`).

## Pourquoi ce module et pas un autre

Le découpage du français en §B.4 compte 7 grandes notions. Trois portaient « aucune »
tuile — **La nature des mots** (6 concepts), **Les accords** (5), **La fonction des mots**
(3) — et « La phrase » était rattachée à `lecture`, qui fait de la compréhension, pas de la
ponctuation. Soit **17 notions sur 33 sans aucun entraînement** : aucun autre trou n'en
approche. Et les fiches de cours étaient déjà écrites, donc la pédagogie était déjà faite.

`grammaire` couvre **La nature des mots + La fonction des mots**. « Les accords »
(singulier↔pluriel) et « La phrase » (majuscule, point, types de phrase) sont des modules
à part : saisie libre pour l'un, production pour l'autre. Cinq types d'interaction dans un
seul module, c'est ce qui empêche de le finir.

## Décisions de conception

- **Le corpus est du CODE, pas de la base.** Même raison que `geometrie.shapes.ts` : une
  phrase annotée mot par mot n'est pas du contenu qu'un parent édite, et une annotation
  fausse enseigne du faux français. Conséquence assumée : pas de table de contenu, pas
  d'import JSON, pas d'onglet « Contenu » — un textarea JSON était le seul endroit du
  module capable d'injecter une annotation fausse. Étendre le corpus demande un déploiement,
  comme pour une figure ou une fiche.
- **L'annotation passe par des constructeurs, pas par des objets littéraux.**
  `gnSujet(d('Le'), nc('chat'))` plutôt que `{ fonction: 'sujet', gn: 0 }` répété sur les
  trois mots du groupe. Les index de groupe nominal sont attribués par l'aplatissement.
- **Ce n'est PAS l'écran de correction de la dictée qui est réutilisé.** Celui-là est de
  l'auto-correction : l'enfant coche ses propres fautes, l'application ne connaît aucune
  vérité. Ici il y a une bonne réponse. Le vrai véhicule était `spec.map` +
  `isMultiSelect`, déjà utilisé par les régions de `france` — timer, score, étoiles,
  progression et fiche fournis par le moteur.
- **Jamais la nature d'un mot hors phrase.** « Quelle est la nature de *ferme* ? » n'a pas
  de réponse. C'est aussi ce que dit la fiche du cours : un enfant de CE1 classe les mots
  par ce qu'ils font dans la phrase. Le corpus contient exprès des ambiguïtés — *ferme*,
  *porte*, *gare*, *cuisine*.
- **La difficulté porte la phrase, pas la forme de la réponse.** `qcmChoiceCount` de
  `common/difficulty.ts` renvoie 0 en `hard` au sens « saisie libre » : faire taper
  « déterminant » évalue l'orthographe, pas la grammaire. Ici `hard` = phrase complexe et
  tous les choix ouverts.
- **La porte d'administration filtre aussi les distracteurs.** Une notion inactive
  n'apparaît pas non plus en mauvaise réponse, sinon le QCM divulgue une notion pas encore
  vue en classe.
- **`nature_mot` exige deux natures actives.** Un QCM à une proposition offre la réponse,
  et classer un mot suppose plus d'une case où le ranger.
- **Trois états de correction, pas deux.** Sur la phrase touchable : juste, oublié, en trop.
  Un mot manqué et un mot ajouté ne se corrigent pas pareil. Chacun porte une marque de
  forme en plus de la couleur (tirets, texte barré).

## Ce qui existe

| | |
|---|---|
| corpus | 62 phrases annotées, 3 niveaux, `grammaire.corpus.ts` |
| notions | 7 natures + 3 fonctions, `grammaire.notions.ts` |
| exercices | `nature_mot` (QCM) · `trouver_mots` · `trouver_fonction` · `groupe_nominal` (sélection) |
| pré-jeu | une option `questionTypes`, plus la difficulté commune |
| admin | un onglet « Notions actives » + tableau « Notions à retravailler » |
| progression | par notion, jamais par phrase — c'est le grain actionnable pour le parent |
| fiche | le texte des fiches de `cours/francais/`, l'exemple étant la phrase ratée |
| tests | 41 backend (dont 14 invariants de corpus), 29 frontend |

Les fiches de jeu reprennent le TEXTE des fiches de cours, volontairement. Ce qui doit
rester commun c'est ce que l'enfant lit : elle ne doit pas rencontrer deux explications
différentes du verbe selon qu'elle joue ou qu'elle révise.

## Ce qui reste

- **`db:check` non joué** : le worktree n'a pas de base. À vérifier avant fusion.
- **Les accords** (singulier↔pluriel) et **La phrase** (majuscule, point, types de phrase)
  restent à faire, chacun comme module distinct.
- Le corpus est du CE1. CE2→CM2 demanderont d'autres phrases et probablement d'autres
  notions (COD/COI, attribut) — les constructeurs tiendront, l'énumération devra grandir.

---

## Reprise rapide

```bash
# régénérer le corpus (rien n'est versionné)
node scripts/mirror-lecons-images.mjs && node scripts/parse-lecons.mjs

# état réel du lint (le script npm masque tout avec son --fix)
cd backend  && node ./node_modules/eslint/bin/eslint.js "src/**/*.ts" --no-fix
cd frontend && node ./node_modules/eslint/bin/eslint.js . --ext ts,tsx --max-warnings 0
```

**Le prochain geste : lire les fiches, puis définir la progression (rien n'est suivi aujourd'hui).**
