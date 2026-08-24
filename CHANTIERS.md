# Chantiers — ÉducMentor

> **Document vivant.** C'est le point de reprise : où on en est, ce qui est décidé, ce qui reste ouvert.
> Dernière mise à jour : **2026-08-24**.

## Les documents du dossier

| Fichier | Rôle |
|---|---|
| `CHANTIERS.md` | **ce fichier** — l'état courant, à tenir à jour |
| `AUDIT_FULLSTACK_2026-07-07.md` | archive — audit initial, instantané figé |
| `AUDIT_2026-08-24_ET_ORIENTATION_COURS.md` | archive — audit delta + première réflexion Cours (⚠️ son plan d'implémentation est **caduc**, cf. chantier B) |
| `frontend/CLAUDE.md` | architecture front, à jour et fiable |

Les deux audits sont des **instantanés datés** : on ne les modifie pas, on les lit pour le détail. Le statut courant vit ici.

---

## Où on en est, franchement

**Fait :**
- deux audits complets, exécutés (lint, tsc, mesures corpus) — le diagnostic est solide
- trois actions sur le corpus de leçons : gitignore, miroir des images, parseur

**Pas fait :**
- **aucun fix**. Zéro. Ni les 4 items critiques de juillet, ni les 5 nouveaux d'août.

**La dérive à nommer** — j'ai qualifié le travail sur le corpus d'« actions sans regret » et on s'y est engouffrés, en repoussant C4 de réponse en réponse sans jamais l'exécuter. Le travail fait est bon et réutilisable, mais **la dette n'a pas bougé depuis le 7 juillet**, soit 7 semaines et 5 modules ajoutés par-dessus.

**Règle pour la suite :** pas de nouvelle feature avant C4. Ce n'est pas de la rigueur pour la forme — le chantier B ajoute des entités en base, et `synchronize: true` sans migration ni backup complet, c'est le seul risque irréversible du projet.

---

# Chantier A — Dette technique

Ordre imposé par les dépendances, pas par la gravité. Chaque étape rend la suivante possible.

### A0 · Protéger les données ⚠️ **bloquant**
- [x] `/data/lecons/`, `/data/lecons_media/`, `/data/corpus/` dans `.gitignore` *(fait le 2026-08-24 — 448 fichiers `??` → 0)*
- [ ] **C4** — `synchronize: false` hors dev + première migration TypeORM
- [ ] **C4** — backup complet du `.db` (les scripts actuels ne sauvent que les invitations)

> `data/educmentor.db` contient la progression de Maëve. C'est la seule donnée irremplaçable du projet.
> Tout le reste se régénère.

### A1 · Rendre le lint capable d'échouer
- [ ] **N3** — sortir `--fix` du script : `"lint": "eslint src"` + `"lint:fix": "eslint src --fix"`
- [ ] lancer `lint:fix` une fois, **commit de formatage isolé** (649 corrections prettier, à ne pas mélanger)
- [ ] les 17 vraies erreurs back — dont `main.ts:22` (`bootstrap()` non awaité)
- [ ] **I4** — les 14 erreurs front. Priorité à `react-hooks/static-components` (`GameEngine.tsx:178`) : **vrai bug de perf**, la carte se démonte/remonte à chaque render
- [ ] **I5** — réactiver `no-explicit-any` back, `ecmaVersion: 5` → ES2023, brancher Prettier au lint front

### A2 · Poser la barrière CI
- [ ] **N2** — job `checks` (lint + tsc back et front) en `needs` du job `build` dans `deploy.yml`

> Contrainte posée : **le push doit continuer à déclencher le CI/CD**. Il le fera — il refusera juste de
> déployer du cassé. D'où l'ordre : A1 **avant** A2, sinon le prochain push ne déploie plus.
> Pas de `npm test` dans le gate tant qu'il n'y a pas de test (I1).
- [ ] `docker image prune -af` → le restreindre au projet (il purge actuellement **toutes** les images du VPS)

### A3 · Cohérence et hygiène
- [ ] **N4** — check au boot ou test comparant les ids `MODULES_CONFIG` (back) et `MODULES` (front).
      Écart actuel : `snake` est front-only → **la tuile n'apparaît jamais sur l'accueil**. Décider : l'activer ou l'assumer.
- [ ] **I7** — `git rm --cached backend/tsconfig.build.tsbuildinfo` · supprimer le `Dockerfile` racine obsolète
- [ ] **I8** — README racine (les READMEs back/front sont encore les templates NestJS / Vite)

### A4 · Le reste, au fil de l'eau
- [ ] **I1** — premiers tests sur la logique pure : `common/mastery.ts`, `buildChoices`, `weightedSample`
- [ ] **I3** — `"strict": true` progressif des deux côtés
- [ ] **C1** — `GET /settings` expose `admin_pin_hash` → liste blanche des clés publiques
- [ ] **C2** — fail-fast au boot si `JWT_SECRET` absent ou égal au défaut en production
- [ ] **C3** — upload imagier : nom de fichier généré serveur, garde `if (!file)`, tmpDir depuis la config
- [ ] **I6** — `@nestjs/throttler` sur `verify-pin`

> Calibrer C1/C2/C3/I6 sur le modèle de menace réel (encadré de l'audit de juillet) : app derrière invitation,
> l'attaquant plausible est « quelqu'un à qui Lionel a envoyé un lien », pas un bot. Corriger pour l'hygiène,
> ne pas sur-investir.

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

## B.2 · Correction de direction ⚠️ **lire avant de reprendre**

Le plan en 8 étapes de `AUDIT_2026-08-24_ET_ORIENTATION_COURS.md` (§2.6) est **caduc**. Il construisait
le contenant — thèmes, parcours, carte du savoir — avant d'avoir validé l'atome : la fiche.
Il ne testait l'hypothèse centrale qu'à l'étape 6, après 6 à 8 jours de travail.

**Deux hypothèses non validées, et tout repose dessus :**

1. Une fiche de 60 mots accroche-t-elle Maëve ?
2. Ouvrira-t-elle spontanément une section « Cours » ? — *réponse probable : non.
   Un enfant de 8 ans ouvre un jeu, pas un cours.*

**Direction retenue à la place : la fiche réactive.**
Elle se trompe sur une question → l'écran de correction propose « 📘 pourquoi ? » → la fiche s'affiche.
Pas de thème, pas de parcours, pas de carte, pas de taxonomie. Ça intervient **au moment où la motivation
existe** — elle vient de rater, elle veut savoir — au lieu de lui demander d'aller chercher le cours.

Le contenant (thèmes, parcours, carte) reste une bonne idée **plus tard**, si et seulement si la fiche prend.

## B.3 · Prochain pas

**Étape 0 — sur papier, avant toute ligne de code.**
Écrire **3 fiches à la main** sur des bristols (idée clé, règle, exemple, piège), sur des notions que Maëve
travaille déjà dans la tuile `conjugaison`. Les lui montrer entre deux parties. Observer.

Coût : 30 minutes. C'est la seule chose qui répond à la question à laquelle aucun code ne répondra.

- Si ça accroche → coder la fiche réactive dans l'écran de correction (~1 jour, aucune entité en base).
- Si ça n'accroche pas → on a économisé une semaine, et le corpus reste utile pour alimenter les tuiles
  existantes (banques de mots, de phrases, d'exercices).

**Ne pas faire maintenant :** entités `Theme`/`Notion`, admin de relecture, `ParcoursRunner`,
3ᵉ racine statique, carte du savoir. Tout ça attend la réponse de l'étape 0 — et, en tout état de cause,
attend A0.

## B.4 · Questions encore ouvertes

- Le pilote démarre-t-il sur **conjugaison** ? *(meilleur alignement corpus ↔ tuile : 41 leçons,
  et la tuile expose déjà `tenses` / `verbGroups` ; 139 images, 1,0 Mo)*
- Histoire (31 leçons) et Questionner le monde (38) n'ont **aucune tuile**. Ce sont les seuls domaines où
  les Cours apporteraient une couverture nouvelle — mais ils exigent un module QCM générique.
  À trancher **après** le pilote, pas avant.
- Les 46 leçons de vocabulaire sans texte : les traiter via `imagier` / `memory` plutôt que par des fiches ?

---

## Reprise rapide

```bash
# régénérer le corpus (rien n'est versionné)
node scripts/mirror-lecons-images.mjs && node scripts/parse-lecons.mjs

# état réel du lint (le script npm masque tout avec son --fix)
cd backend  && node ./node_modules/eslint/bin/eslint.js "src/**/*.ts" --no-fix
cd frontend && node ./node_modules/eslint/bin/eslint.js . --ext ts,tsx --max-warnings 0
```

**Le prochain geste, dans l'ordre : A0 (C4), puis B.3 étape 0 sur papier.**
