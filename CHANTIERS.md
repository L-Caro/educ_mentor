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

## B.4 · Suite possible

Le mode « école » : une bibliothèque navigable par matière et par thème. Il demande les
entités `Theme` / `Notion`, une migration, et un écran d'administration pour la relecture
des fiches **rédigées** (géographie, histoire, sciences), là où aucune règle ne se déduit.
Les fiches dérivées, elles, y sont déjà : il suffira d'appeler `spec.fiche` sur des
questions types.

Non commencé, et pas urgent : la fiche réactive répond déjà au besoin qui a motivé
l'ensemble.

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
