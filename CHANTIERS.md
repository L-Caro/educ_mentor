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

## Où on en est

**Fait :**
- deux audits complets, exécutés (lint, tsc, mesures corpus)
- trois actions sur le corpus de leçons : gitignore, miroir des images, parseur
- **chantier A terminé** : dette technique traitée de A0 à A4, sur la branche `chantier-a-robustesse` (12 commits, non poussée)

**Reste :**
- A5 — dépendances vulnérables, préexistantes, délibérément non traitées (voir plus bas)
- chantier B — les fiches, à reprendre **après** l'étape 0 sur papier

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
   DB_PATH=/chemin/vers/data/educmentor.db npm run db:check
   ```
2. **Sauvegarder avant le premier déploiement.** `./scripts/backup-db.sh`, puis planifier le cron.
3. **Renseigner les variables de production.** L'application refuse désormais de démarrer si
   `JWT_SECRET` est absent, égal au défaut ou plus court que 23 caractères, si `DEFAULT_PIN`
   vaut encore 1234, si `ADMIN_PIN_ENABLED=false`, ou si `DB_SYNCHRONIZE=true`.
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
