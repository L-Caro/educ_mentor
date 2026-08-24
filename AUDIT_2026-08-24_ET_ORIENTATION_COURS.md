# Audit delta + orientation « Cours » — ÉducMentor

> **Date :** 2026-08-24 · **Audit précédent :** `AUDIT_FULLSTACK_2026-07-07.md` (7 semaines)
> **Méthode :** lecture du socle back (app.module, config, database, catalog, settings, auth, invitation),
> du moteur front complet (GameEngine, useGameSession, manifest, router, types, HomeLayout), de 3 services
> de jeu en entier, des 13 manifests de module. Vérifs **exécutées** : `tsc` back ✅, `tsc -b` front ✅,
> `eslint` front ❌ 14 err + 1 warn, `eslint` back ❌ 666 problèmes. Inventaire du corpus `data/lecons`
> (448 fichiers) + prototype de parsing validé.
> **Aucun code modifié.**

---

# Partie 1 — Audit delta

## 1.1 Ce qui a bougé depuis le 7 juillet

| Item | Statut | Commentaire |
|---|---|---|
| C1 — hash PIN exposé par `GET /settings` | ❌ **ouvert** | `settings.controller.ts:22` inchangé, `getAll()` renvoie toujours `admin_pin_hash` sans guard |
| C2 — secrets par défaut, pas de fail-fast | ❌ **ouvert** | `configuration.ts` inchangé, `main.ts` ne vérifie rien au boot |
| C3 — upload image non assaini | ❌ **ouvert** | `imagier-admin.controller.ts:104-140` : `filename: file.originalname` brut, tmpDir en dur, pas de garde `!file` |
| C4 — `synchronize: true` + zéro migration | ❌ **ouvert** | `database.module.ts:18` inchangé. **Devient bloquant** (cf. partie 2) |
| I1 — zéro test | ❌ **ouvert** | `find` sur `*.spec.*` / `*.test.*` : **0 fichier**, back et front |
| I2 — aucune CI | ⚠️ **régressé** | Voir N2 : il y a maintenant un pipeline, mais il **déploie sans rien vérifier** |
| I3 — TS pas strict | ❌ **ouvert** | Ni `backend/tsconfig.json` ni `frontend/tsconfig.app.json` n'ont `"strict": true` |
| I4 — lint front rouge | ❌ **ouvert, +1** | 14 erreurs + 1 warning. Liste **identique** à juillet, plus `formatNumber.ts:1` (espace insécable) |
| I5 — config qualité incohérente | ❌ **ouvert, aggravé** | Voir N3 |
| I6 — pas de rate-limit `verify-pin` | ❌ ouvert | |
| I7 — fichiers parasites | 🟡 **partiel** | `; echo ---` supprimé ✅ · `_diag.log` supprimé ✅ · `backend/tsconfig.build.tsbuildinfo` **toujours suivi par git** ❌ · `Dockerfile` racine obsolète toujours là ❌ |
| I8 — documentation | 🟡 **partiel** | Toujours pas de README racine ; les READMEs back/front sont **encore les templates NestJS / Vite**. En revanche `frontend/CLAUDE.md` a été écrit — et il est excellent |

**Verdict franc :** en 7 semaines, 5 modules ont été ajoutés ou corrigés et **aucun item de l'audit n'a été traité**,
à part deux fichiers parasites. La dette identifiée n'a pas été payée, elle a été construite dessus.
Ce n'est pas un jugement moral — c'est un fait à regarder avant d'ouvrir un chantier « Cours » qui est
**plus gros que n'importe quel module existant**.

## 1.2 Nouveaux findings

### 🔴 N1 — 448 fichiers HTML tiers (46 Mo) prêts à être commités par accident
`data/lecons/` n'est **pas** dans `.gitignore` et n'est pas suivi. `git status -uall data/` → **448 fichiers `??`**.
Un `git add .` distrait grave dans l'historique, définitivement, 46 Mo de HTML scrapé Kartable avec
webfonts inlinées (chaque fichier fait ~135 Ko dont ~133 Ko de `@font-face` base64).
**Fix immédiat :** `echo "/data/lecons/" >> .gitignore` **avant** de toucher à quoi que ce soit d'autre.

### 🔴 N2 — Le pipeline CI déploie en prod sans aucune barrière
`.github/workflows/deploy.yml` : sur chaque push `main` → build Docker → `docker compose pull && up -d` sur le VPS.
Aucun `lint`, aucun `tsc`, aucun test. Sachant que le lint front est rouge depuis au moins 7 semaines,
**le pipeline actuel ne fait qu'accélérer la mise en prod de code cassé**. Un CI sans gate est pire que pas de CI :
il donne le sentiment d'un filet qui n'existe pas.
Second point : `sudo docker image prune -af` supprime **toutes** les images inutilisées du VPS, pas seulement
celles d'ÉducMentor. Si tu héberges autre chose derrière ce Traefik, tu le purges à chaque déploiement.
**Fix :** un job `checks` (lint + tsc + test) en `needs` du job `build`.

### 🟠 N3 — Le script `lint` du backend ne peut structurellement pas échouer
`backend/package.json` : `"lint": "eslint ... --fix"`. Le `--fix` est **dans le script**.
Résultat : `npm run lint` réécrit les fichiers et sort vert. Sans `--fix`, l'état réel est :

```
649  prettier/prettier                          (formatage, auto-fixable)
  8  @typescript-eslint/no-unused-vars
  3  @typescript-eslint/no-unnecessary-type-assertion
  2  @typescript-eslint/no-unsafe-return
  1  @typescript-eslint/no-floating-promises     main.ts:22 — bootstrap() non awaité
  1  @typescript-eslint/no-unused-expressions    france.service.ts:202
  1  @typescript-eslint/no-unsafe-assignment     imagier-import.service.ts:49
  1  @typescript-eslint/no-unsafe-member-access  imagier-import.service.ts:50
──── 666 problèmes
```

Les 649 prettier sont du bruit auto-fixable, mais tant qu'ils sont là, ils **noient** les 17 vrais.
`no-explicit-any` est toujours `off` (I5) et `ecmaVersion: 5` toujours présent alors que la cible est ES2023.
**Fix :** `"lint": "eslint src"` + `"lint:fix": "eslint src --fix"`, lancer `lint:fix` une fois, commiter, puis brancher au CI.

### 🟠 N4 — Deux registres de modules qui divergent déjà silencieusement
`modules.manifest.tsx` se documente comme « la source unique des modules ». Ce n'est pas vrai :
`HomeLayout` construit la grille depuis **`useGetModulesQuery`**, c'est-à-dire depuis `MODULES_CONFIG`
côté backend. Le manifest front ne fournit que la `category`.

Conséquence mesurée : `snake` est dans le manifest front, **absent de `MODULES_CONFIG`**.
La tuile Snake ne peut donc **jamais** apparaître sur l'accueil — seulement via l'URL directe
`/module/snake`. Sa route admin, elle, existe. Personne ne s'en est aperçu.

Ce n'est pas un détail cosmétique : ajouter un module demande aujourd'hui **deux enregistrements
dans deux dépôts différents**, sans rien pour vérifier qu'ils correspondent. C'est exactement le
genre de couture qui casse quand on ajoutera les « Cours ».
**Fix :** un test (ou un check au boot) qui compare les deux ensembles d'ids et hurle en cas d'écart.

### 🟡 N5 — Aucune notion de « niveau scolaire » ni d'apprenant dans le modèle
`grep -i "niveau|CE1|CM2|grade|level"` sur tout `src/` : 5 fichiers, tous du vocabulaire local
(« niveau de difficulté »). Il n'y a **aucune entité apprenant, aucun niveau, aucune notion partagée**.
13 modules = 13 tables `*_progression`, avec 13 formes de clé différentes :
`verb_tense` (conjugaison), `text_id` (lecture), **une seule ligne globale** (numération)…
Aujourd'hui, la question « Maëve maîtrise-t-elle l'accord sujet-verbe ? » est **structurellement
sans réponse**. C'est le point central de la partie 2.

## 1.3 Ce qui reste bon (et sur quoi la partie 2 s'appuie)

- Le moteur front est réellement générique : `GameModuleSpec` couvre QCM single/multi, saisie libre,
  carte single/multi, carte à point, avec la validation par set centralisée dans le moteur. Un module
  de jeu neuf coûte ~100 lignes.
- `preamble` existe déjà dans le spec (`game.types.ts:100`) et est utilisé par `lecture` : **il y a déjà
  un crochet pour afficher du contenu avant les questions**. C'est la porte d'entrée d'une fiche de leçon.
- `gameSetupSlice` + `/module/:id/play` permettent de **pré-configurer une partie et d'y sauter
  directement**. C'est le mécanisme de deep-link dont la partie 2 a besoin, il existe déjà.
- `common/mastery.ts` est le bon geste, à généraliser.
- Le corpus `data/lecons` est **beaucoup plus propre que prévu** (cf. 2.2).

---

# Partie 2 — Orientation « Cours »

## 2.1 Trois choses à trancher avant d'écrire une ligne

### a) Le droit d'auteur, sans détour
448 leçons Kartable, texte + 1 824 images **hotlinkées** sur `media-image.kartable.fr`.
L'app est déployée publiquement (`educmentor.lionelcaro.fr`), derrière invitation certes, mais publiquement.

- Republier le texte verbatim, même derrière invitation : non.
- Hotlinker leurs images depuis ton app : non, et en plus ça cassera le jour où ils changent leurs URLs
  ou bloquent le referer.

**La bonne nouvelle : ta propre intuition résout le problème.** Tu as écrit « les afficher tel quel n'aurait
aucun intérêt ». Exact — et c'est aussi la seule voie propre. Le corpus est ta **source de travail privée**,
pas ton contenu livré. Ce que tu livres, c'est une réécriture à toi. Reste le sujet des images : à recréer
ou à sourcer libre (Wikimedia Commons, openclipart), pas à copier.

### b) Ce qui a le plus de valeur dans ce corpus, ce n'est pas le texte
C'est le **squelette**. 448 titres × niveau × matière, c'est une **carte du programme CE1→CM2** que ton app
n'a pas et ne peut pas inventer seule. Aujourd'hui tes 13 tuiles sont 13 silos sans référentiel commun :
rien ne dit que `conjugaison` couvre « le présent des verbes du 1er groupe », qui est une notion CE2.

Extrais la taxonomie d'abord. Le texte ensuite, notion par notion, seulement pour celles que tu exploites.

### c) Le vrai risque, c'est d'ajouter un 14ᵉ silo
Un module « Cours » qui affiche des leçons, avec sa propre progression, à côté des tuiles, sans lien avec
elles : c'est le scénario d'échec. Une enfant de 8 ans ne clique pas spontanément sur « Leçons ».
Les Cours n'ont de valeur que s'ils sont **le liant** entre les tuiles, pas une tuile de plus.

## 2.2 Ce que contient réellement `data/lecons` (mesuré)

```
448 leçons HTML   CE1 (77) · CE2 (118) · CM1 (89) · CM2 (164)
Matières : Français 170 · Maths 119 (+18 « Exercice Maths ») · Anglais 46 · Questionner le monde 38 · Histoire 31 · Géographie 26
Poids : 46 Mo, dont ~97 % de webfonts base64 inutiles
Contenu utile après suppression de <style>/<script> : min 2 Ko, médian 7,5 Ko, max 79 Ko
Images : 1 824, toutes hotlinkées sur media-image.kartable.fr
```

**Et surtout : le HTML est sémantiquement structuré.** Chaque bloc porte une classe explicite :

```
2371 bt_text      1579 bt_img       1239 bt_exemple    1071 bt_fundamental
 862 bt_title      837 bt_section    608 bt_name        552 bt_definition
 288 bt_advice     172 bt_astuce     151 bt_remarque    126 bt_propriete
 122 bt_ortho_rule 110 bt_conj_rule   76 bt_gram_rule    51 bt_exceptions
  49 bt_piege       44 bt_memo        34 bt_resume       23 bt_conseils
```

J'ai prototypé l'extraction : sections numérotées (`bt_section1/2/3`), titre, texte, exemples, images,
définitions, astuces, pièges — **tout sort proprement, sans heuristique fragile**. Un parseur déterministe
de ~150 lignes suffit. C'est le point le plus encourageant du dossier.

Sur `La proportionnalité` (CM2) : 16 blocs, 3 sections, chacune titre + texte + exemple illustré. Parfait.

## 2.3 Le modèle proposé : la **Notion**

Une entité de premier ordre, côté backend, indépendante des modules :

```ts
Notion {
  id        'fr.conjugaison.present-1er-groupe'   // slug stable, hiérarchique
  theme_id  'fr.conjugaison'                       // regroupement thématique
  level     'CE2'                                  // niveau d'introduction
  subject   'francais'
  title     'Le présent des verbes du 1er groupe'

  // La fiche — écrite par TOI, dérivée du corpus, jamais copiée
  card {
    idee:    string   // 1 phrase, l'idée clé
    regle:   string   // 1-2 phrases
    exemple: string   // 1 exemple concret
    piege?:  string   // l'erreur classique
    media?:  string   // image locale, /media/notions/...
  }
  status  'draft' | 'validated'   // rien n'est montré à l'enfant tant que ce n'est pas validé

  // Le lien vers les tuiles — c'est là que tout se joue
  practice: [
    { moduleId: 'conjugaison', setup: { tenses: ['présent'], verbGroups: ['1'] } }
  ]
}

Theme { id, subject, level, title, notion_ids[] (ordonnés) }
```

**`practice[]` est la clé de voûte.** Le bouton « Je m'entraîne » d'une fiche fait :
`dispatch(setModuleSetup({ moduleId, setup }))` puis `navigate('/module/conjugaison/play')`.
Ce mécanisme **existe déjà** (`gameSetupSlice`, `ModulePreSetup`, `router.tsx:buildChildRoutes`).
Zéro nouveau moteur de jeu. Une notion est une *entrée pré-configurée* dans les tuiles que tu as déjà écrites.

Et le lien inverse : sur l'écran de résultat, une erreur peut proposer « 📘 Revoir la leçon ».
C'est ce qui fait que les tuiles cessent d'être des silos.

## 2.4 L'expérience enfant : fiche → parcours → carte

**La fiche (l'atome).** Un écran, jamais de scroll, ~60 mots maximum : une idée, une règle, un exemple,
un piège, une image. Format recto/verso : recto = la question (« Comment on écrit le présent de *chanter* ? »),
verso = la réponse. C'est une carte, pas une page.

**Le parcours (l'unité de jeu).** Une chaîne de 4 à 6 étapes alternant fiche et mini-quiz :

```
fiche 1 → 3 questions (module conjugaison, préconfiguré) → fiche 2 → 3 questions → … → badge de thème
```

C'est ça, « le cours ». Le mini-quiz réutilise `GameEngine` tel quel — il sait déjà faire une session
de N questions avec timer et correction. Le seul composant neuf, c'est la fiche.

**La carte du savoir (la motivation).** Les thèmes en carte/arbre, chaque notion un nœud coloré selon
la maîtrise : gris (jamais vue) → jaune (en cours) → vert (maîtrisée). Un enfant ne lit pas une leçon,
mais il remplit une carte. **À faire en dernier** : une carte à 8 nœuds sur 448 fait pauvre, une carte
bien remplie est le moteur de l'engagement. Ne la construis pas avant d'avoir du contenu.

## 2.5 Ce que le modèle actuel ne sait pas faire (et qu'il faudra régler)

Pour colorer un nœud « maîtrisé », il faut savoir agréger les progressions **par notion**.
Aujourd'hui c'est impossible : chaque module a sa clé propre, et `numeration` n'a qu'**une seule ligne
globale** de progression. Deux options :

- **A (léger, recommandé pour commencer)** — une table `notion_progression` alimentée par le parcours
  lui-même : le mini-quiz du parcours enregistre son résultat sur la notion, en plus du module.
  Le module reste maître de sa propre progression, la notion a la sienne. Duplication assumée,
  découplage total, aucun module à réécrire.
- **B (propre, plus tard)** — les modules déclarent une `notionKey` par question, et
  `notion_progression` est dérivée. Correct, mais demande de toucher aux 13 modules. À ne pas faire
  au démarrage.

**Prends A.** Tu changeras pour B quand tu sauras si la feature tient la route.

## 2.6 Par où commencer — et surtout, par où ne pas commencer

**Ne fais pas 448 fiches.** À 5 minutes de relecture par fiche, c'est 37 heures de travail éditorial
avant la première utilisation. Le projet mourra là.

**Pilote : le thème « Conjugaison ».** C'est le seul où l'alignement corpus ↔ tuile est parfait :
le corpus a **41 leçons** (présent / imparfait / futur / passé composé / passé simple / plus-que-parfait × groupes,
CE2→CM2), et la tuile `conjugaison` expose déjà exactement ces axes en `setupOptions`
(`tenses`, `verbGroups`). Les `practice[]` s'écrivent sans effort.

Cible du pilote : **1 thème, 8 notions, un parcours jouable de bout en bout.**
Si Maëve ne tient pas 10 minutes dessus, l'idée est à revoir — et tu l'auras appris pour 8 fiches, pas 448.

### Séquence

| # | Étape | Coût | Livrable |
|---|---|---|---|
| 0 | `/data/lecons/` dans `.gitignore` · `synchronize: false` + 1ʳᵉ migration + backup complet du `.db` | ½ j | **bloquant, cf. C4/N1** |
| 1 | Script `scripts/parse-lecons.mjs` : 448 HTML → `corpus.json` structuré + miroir local des images | 1 j | corpus offline, requêtable, HTML jamais livré |
| 2 | Taxonomie : 448 titres → ~40 thèmes × notions, avec `level`/`subject`. Semi-manuel | 1 j | `themes.json` — **la carte du programme que l'app n'a pas** |
| 3 | Backend : entités `Theme` / `Notion` / `NotionProgression` + CRUD admin | 1-2 j | |
| 4 | Admin : file de relecture « brouillon → validée » d'une fiche, avec le bloc source du corpus en regard | 1 j | l'outil qui rend le travail éditorial supportable |
| 5 | Front : composant `NotionCard` + `ParcoursRunner` (fiche ↔ `GameEngine` préconfiguré) | 2 j | |
| 6 | **Pilote conjugaison** : 8 fiches rédigées et validées à la main | 1 j | la seule étape qui dit si l'idée est bonne |
| 7 | *Seulement si le pilote convainc* : module QCM générique alimenté par des questions attachées aux notions | 2 j | débloque Histoire (31 leçons) et Sciences (38) qui n'ont **aucune tuile** |
| 8 | Carte du savoir | 2 j | quand il y a assez de nœuds |

Étapes 1-2 sont utiles **même si tu abandonnes les Cours** : le corpus structuré et la taxonomie sont
réutilisables pour alimenter les tuiles existantes (banques de mots, phrases, exercices).

### Le point aveugle à garder en tête
Histoire (31 leçons) et « Questionner le monde » (38 leçons) sont les seuls domaines où les Cours
apporteraient une couverture **nouvelle** — aucune tuile ne les touche. Mais ce sont aussi ceux qui
demandent le module QCM générique (étape 7). Autrement dit : la partie la plus utile de la feature
est aussi la plus lointaine. C'est normal, mais ne l'oublie pas en cours de route.

---

## Ordre de bataille global

1. **`.gitignore` sur `data/lecons/`** — 10 secondes, évite une bêtise irréversible.
2. **C4** — `synchronize: false`, migrations, backup complet. Tu es sur le point d'ajouter 3 entités :
   c'est maintenant ou jamais. La progression de ta fille est la seule donnée irremplaçable du projet.
3. **N2 + N3** — un job `checks` dans le CI, `--fix` hors du script `lint`, un `lint:fix` commité une fois.
   Sans ça, l'étape 3 du plan Cours va empiler de la dette au même rythme.
4. **I4** — les 14 erreurs front, dont `react-hooks/static-components` qui est un **vrai bug de perf**
   (la carte se démonte/remonte à chaque render).
5. **Puis** le plan Cours, étapes 1 → 6.
6. C1 / C2 / C3 / I6 au fil de l'eau, calibrés sur ton modèle de menace réel (cf. encadré de l'audit de juillet).
