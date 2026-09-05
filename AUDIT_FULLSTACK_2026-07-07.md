# Audit full-stack : EducMentor

> **Date :** 2026-07-07
> **Périmètre :** frontend (React 19 / Vite), backend (NestJS / TypeORM / SQLite), couche data, Docker/déploiement.
> **Méthode :** lecture intégrale du socle (config, Docker, auth, invitations, settings, catalog) + moteur front complet
> (GameEngine, useGameSession, manifest, router, store, types) + 6 services de jeu backend lus en entier
> (tables, imagier, geo, lecture, pendu, memory), le reste échantillonné. Vérifs exécutées : `tsc` backend (✅ vert),
> lint frontend (❌ 13 erreurs + 1 warning au moment de l'audit).
> **Aucun code n'a été modifié : c'est un état des lieux.** Ce fichier sert de checklist à suivre.

---

## Comment lire ce document

Chaque item est une case à cocher, localisée (`fichier:ligne`), avec le problème **et** la direction de correction.
Les priorités vont du plus critique (🔴) au plus léger (⚪).

### ⚠️ Calibration du modèle de menace (à lire avant de paniquer)

Les findings 🔴 sont notés « critiques » selon les standards d'une app exposée à un **attaquant internet générique**.
Mais le vrai contexte d'EducMentor est différent :

- L'app est **derrière un système d'invitation** (`AccessGuard` global) : un internaute lambda ne passe pas la porte.
- Le PIN protège des **réglages parents**, pas des données sensibles ni de l'argent.
- L'attaquant réaliste est « quelqu'un à qui Lionel a partagé un lien d'invitation », pas un bot qui scanne le web.

**Conséquence pratique :** les mécanismes ci-dessous méritent d'être corrigés pour la **justesse et l'hygiène**
(et parce que tu veux un code pro), mais le rayon de souffle réel est faible. Ne sur-investis pas dans du durcissement
contre des attaquants qui n'existent pas dans ton cas. Priorité réelle pour toi : **C4 (perte de données) > C2 > C1/C3 > le reste**,
car la seule chose vraiment irremplaçable ici, c'est la progression de ta fille.

### Légende

- 🔴 **Critique** : sécurité / intégrité des données
- 🟠 **Important** : ce qui sépare « ça marche » de « c'est pro » (tests, CI, strictness, outillage)
- 🟡 **Moyen** : qualité et maintenabilité
- ⚪ **Léger** : détails

---

## 🔴 Critique : sécurité & données

- [ ] **C1 : `GET /api/settings` expose le hash du PIN admin à tout appareil invité.**
  📍 `backend/src/modules/settings/settings.controller.ts:22`
  Le `GET` n'a pas de `JwtAuthGuard` (seul le `PATCH` en a un) et `getAll()` renvoie *tous* les settings, dont `admin_pin_hash`.
  Chaîne : appareil invité → lit le hash → crack hors-ligne d'un PIN 4 chiffres → PIN admin → `change-pin`.
  **Fix :** filtrer les clés sensibles côté service (liste blanche des clés publiques), ou séparer route publique / route admin.

- [ ] **C2 : Secrets par défaut dangereux, sans fail-fast au démarrage.**
  📍 `backend/src/config/configuration.ts:4-5`
  `JWT_SECRET` retombe sur `'dev_secret_change_in_prod'` (chaîne **présente dans le git**) et `DEFAULT_PIN` sur `'1234'`.
  Un déploiement qui oublie ces variables démarre avec un secret JWT public → forge de token admin possible.
  **Fix :** refuser de booter en prod (`NODE_ENV=production`) si `JWT_SECRET` est absent ou égal au défaut.

- [ ] **C3 : Upload d'image non assaini.**
  📍 `backend/src/modules/imagier/imagier-admin.controller.ts:100-143`
  Nom de fichier = `file.originalname` brut (path traversal `../../…`) ; `fileFilter` refuse silencieusement sans que
  le handler gère `file === undefined` (→ crash 500 au lieu d'un 400) ; tmpDir en dur `./data/images/imagier/_tmp`
  (ignore `imagesPath`). Route admin, donc exposition limitée, mais à corriger.
  **Fix :** nom de fichier généré serveur (uuid + extension validée), garde `if (!file) throw new BadRequestException()`,
  tmpDir dérivé de la config.

- [ ] **C4 : `synchronize: true` en prod + aucune migration + backup partiel.** ⭐ *priorité réelle n°1*
  📍 `backend/src/database/database.module.ts:18` · `scripts/backup-invitations.sh`
  `synchronize: true` aligne le schéma sur les entités à chaque boot → une modif d'entité peut **détruire des colonnes
  et leurs données** sans avertissement. Les scripts de backup ne couvrent **que les invitations**, pas la progression.
  **Fix :** `synchronize: false` en prod + migrations TypeORM versionnées + backup complet du fichier SQLite (un `cp` planifié suffit).

---

## 🟠 Important : professionnalisation

- [ ] **I1 : Zéro test.** Aucun `.spec`/`.test` réel. `backend/test/app.e2e-spec.ts` est le boilerplate Nest qui teste
  `GET /` → `"Hello World!"` (route inexistante ici → échoue si lancé). `vitest` installé côté front sans un seul fichier.
  **Fix :** commencer par la logique pure non-triviale : `common/mastery.ts`, `buildChoices` (tables), `weightedSample` (imagier),
  validation lecture. Fort ROI, faible coût.

- [ ] **I2 : Aucune CI.** Pas de `.github/`. Rien ne relance build + lint + type-check + tests au push.
  **Fix :** un workflow GitHub Actions (ou équivalent) qui fait tourner les 4 sur back **et** front. C'est ce qui empêche I4 de re-dériver.

- [ ] **I3 : TypeScript pas en mode strict.**
  📍 `backend/tsconfig.json` (a `strictNullChecks`+`noImplicitAny` mais pas `strict` complet) · `frontend/tsconfig.app.json` (**aucun flag strict**)
  **Fix :** `"strict": true` des deux côtés, activé progressivement (attends-toi à des erreurs à corriger, surtout côté front).

- [ ] **I4, Lint frontend rouge : 13 erreurs + 1 warning** (constaté à l'exécution, ce n'est plus le 0/0 du Lot 7).
  Détail à corriger :
  - [ ] `react-hooks/static-components` / « Cannot create components during render » : `GameEngine.tsx:214`, `geo.game.tsx:49`
   , `map.getComponent` retourne une closure-composant recréée à chaque render (**bug de perf réel** : la carte se démonte/remonte).
  - [ ] `no-unused-expressions` (ternaire `cond ? next.delete(x) : next.add(x)` en instruction) : `GeoSettings.tsx:50`, `FranceSettings.tsx:52` → passer en `if/else`.
  - [ ] `react-hooks/set-state-in-effect` : `GameEngine.tsx:66`.
  - [ ] `react-refresh/only-export-components` : `ThemeContext.tsx`, `lecture.game.tsx`, `numeration.game.tsx`.
  - [ ] `no-unused-vars` : `_textId` dans `lecture.api.ts:67`.
  *(Note : ce sont surtout les modules ajoutés après la refonte, geo, france, lecture, numeration, qui ont réintroduit la dette.)*

- [ ] **I5 : Config qualité incohérente entre les 2 packages.**
  📍 `backend/eslint.config.mjs:30` désactive `@typescript-eslint/no-explicit-any` (un `any` passerait inaperçu) ·
  le **front n'a pas Prettier branché** dans ESLint (seulement en devDep).
  **Fix :** réactiver `no-explicit-any` côté back ; brancher Prettier côté front. C'est très probablement la cause du retour
  de l'**alignement vertical** (banni par tes règles) visible dans `game.types.ts` et `FranceSettings.tsx` : rien ne le reformate.

- [ ] **I6 : Pas de rate-limiting sur `verify-pin`.**
  📍 `backend/src/modules/auth/auth.controller.ts:33`
  **Fix :** `@nestjs/throttler` sur cette route (brute-force en ligne d'un PIN 4 chiffres sinon faisable).

- [ ] **I7 : Fichiers parasites / artefacts versionnés.**
  - [ ] Fichier littéralement nommé `"; echo ---"` à la racine (résidu d'un `>` shell mal échappé) → supprimer.
  - [ ] `backend/tsconfig.build.tsbuildinfo` **suivi par git** (cache de build, ne doit jamais l'être) → `git rm --cached` + gitignore.
  - [ ] `Dockerfile` racine obsolète : attend le build front dans `/app/backend/static` alors que Vite sort dans `dist/`.
    Les vrais Dockerfiles sont dans `backend/` et `frontend/` → supprimer ou réaligner celui de la racine.
  - [ ] `_diag.log` à la racine → supprimer.

- [ ] **I8 : Documentation projet absente.** Pas de README racine ; ceux de `backend/` et `frontend/` sont les **templates par défaut**
  (badges CircleCI NestJS, « React + TypeScript + Vite »).
  **Fix :** un README racine (c'est quoi / lancer en dev / déployer / archi en 5 lignes). `frontend/CLAUDE.md` est une bien meilleure base que les READMEs actuels.

---

## 🟡 Moyen : qualité & maintenabilité

- [ ] **Duplication backend.** `shuffle<T>` copié dans **8 services** ; `parseInt(await settingsService.get('questions_per_session'))` dans **9**.
  **Fix :** `common/shuffle.ts` + helper `settingsService.getInt(key, default)`. Même geste que `mastery.ts`, à répéter.

- [ ] **Double calcul du mode dans `GameEngine.tsx`.** `isMap`/`isMulti`/`isFree` recalculés dans `handleValidate` (l.87-90)
  puis re-dérivés dans le render (l.164-169) → deux sources de vérité à garder synchrones.
  **Fix :** un seul `useMemo` par question.

- [ ] **Entité catalogue nommée `AppModule`.** 📍 `backend/src/modules/catalog/entities/module.entity.ts:4`
  Collision avec la racine NestJS `AppModule` (coexistent via alias d'import, mais piège pour le lecteur).
  **Fix :** renommer `CatalogModuleEntity` / `ModuleEntity`.

- [ ] **Erreur métier renvoyée en HTTP 200.** 📍 `backend/src/modules/settings/settings.controller.ts:31`
  `{ error: '...' }` avec statut 200 pour un cas refusé. **Fix :** `ForbiddenException` (403) / `BadRequestException`.

- [ ] **Sessions de jeu jamais purgées.** Chaque partie insère une ligne (`tables_sessions`, etc.) jamais nettoyée ;
  `recordAnswer` reçoit `_sessionId` et l'ignore (`tables.service.ts:151`). La table gonfle sans usage réel.
  **Fix :** décider : s'en servir (stats), purger, ou arrêter d'écrire.

- [ ] **Modèle de confiance client non explicité.** `recordAnswer` reçoit `is_correct` **calculé par le navigateur** ;
  un client modifié peut se déclarer maître de tout. Acceptable pour une app perso, mais à **documenter** :
  le back fait autorité sur la *génération* des questions, pas sur la *correction*.

- [ ] **Pas de `Logger` ni d'`ExceptionFilter` global côté Nest.** Erreurs en stack par défaut, non structurées.
  **Fix :** filtre d'exceptions + logger léger pour le diagnostic prod.

- [ ] **`@types/*` en `dependencies`** (`backend/package.json` : bcrypt, multer, uuid…). **Fix :** déplacer en `devDependencies`.

---

## ⚪ Léger : détails

- [ ] Marqueur `//?` résiduel en tête de `frontend/src/assets/styles/_abstracts/_variables.scss:1`.
- [ ] `_variables.scss` mélange échelles Lot 6 (`$space-*`, `$font-size-*`) et alias historiques (`$border-radius`, `$radius-*`) → trancher.
- [ ] `ecmaVersion: 5` dans `backend/eslint.config.mjs:23` (incohérent avec la cible ES2023).
- [ ] `dictionary.json` (183 Ko) embarqué dans le bundle front via `lookupWord.ts`, utilisé uniquement par l'admin d'import → lazy-loader.
- [ ] Dossier `frontend/incoming/snake/` : source d'intégration qui n'a peut-être pas sa place dans le repo applicatif.

---

## Ordre de bataille suggéré

1. **Protéger les données** : **C4** (`synchronize: false` + migrations + backup complet). *La progression de ta fille est irremplaçable.*
2. **Colmater la sécurité** : C2 (fail-fast secrets), puis C1 (hash exposé), C3, I6. *Proportionne à ton modèle de menace (cf. encadré).*
3. **Poser le harnais**, `strict: true` (I3) → réparer le lint (I4) → brancher Prettier front (I5) → CI (I2). *Dans cet ordre : chaque étape rend la suivante durable.*
4. **Filet de tests** (I1) sur la logique pure, puis nettoyage 🟡/⚪ au fil de l'eau.

---

## Ce qui est déjà bien (à ne pas casser)

- **Architecture front** : GameEngine générique + specs déclaratives ~40-120 l./module, manifest unique (ajouter un module = 1 dossier + 1 ligne),
  lazy-loading systématique (specs **et** routes admin), porte de sortie `child.Game` propre pour les modules hors-moule (Snake, Memory, Pendu).
- **Backend homogène** : patron entity/dto/service/controller identique partout, DTO `class-validator` + `ValidationPipe({ whitelist, transform })` global.
- **Sécurité pensée dans sa structure** : PIN bcrypt, JWT 8h, cookie invitation `httpOnly`+`sameSite`, invitations à usage unique,
  backend jamais exposé (réseau Docker interne), défaut *fail-secure*, `.env.example` exemplaire.
- **`common/mastery.ts`** : modèle de maîtrise unifié bien conçu, documenté, partagé, le geste anti-duplication à généraliser.
- **Docker/déploiement** soignés (multi-stage + cache de layers, better-sqlite3 natif géré, nginx SPA+proxy commenté).
- **Hygiène de code rare** : zéro `any` sauvage (3 occurrences, toutes documentées/justifiées), zéro TODO fantôme, zéro `console.log` oublié,
  commentaires « pourquoi » conformes aux règles projet.
