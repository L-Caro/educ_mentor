# ÉducMentor — Plan d'action complet

> Document de référence pour le développement. Suivre les phases dans l'ordre.
> Chaque étape est autonome et testable avant de passer à la suivante.

---

## Avancement

| Phase | Statut | Description |
|---|---|---|
| Phase 1 — Scaffolding & Infrastructure | ✅ Terminée | Monorepo, NestJS, React/Vite, SCSS+BEM, Docker |
| Phase 2 — Core backend | ✅ Terminée | Settings, Auth PIN+JWT, CatalogModule |
| Phase 3 — Core frontend | ✅ Terminée | ChildHome, AdminPage, Settings, Header, GearButton |
| Phase 4 — Module Imagier Anglais | ✅ Terminée | Backend + toutes les vues child et admin |
| Phase 4b — Module Tables de multiplication | ✅ Terminée | Backend + toutes les vues child et admin |
| Phase 5 — Déploiement NAS | 🔜 À faire | Docker, Synology Container Manager, Tailscale |
| Phase 6 — Migration contenu | 🔜 À faire | Script images, import dictionary.json |

**Prochaine étape : Phase 5 — Déploiement NAS (Docker → Synology DS220+)**

---

## Décisions techniques actées

| Sujet | Décision |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Backend | NestJS + TypeScript |
| ORM | TypeORM |
| Base de données | SQLite (fichier unique, driver `better-sqlite3`) |
| Style | SCSS (7-1) + BEM — **pas de Bootstrap** |
| State management | Redux Toolkit (authSlice) |
| Dark/Light mode | ThemeContext + classe `html.dark` / `html.light` |
| Containerisation | Docker + docker-compose |
| Déploiement | Synology DS220+ via Container Manager |
| Accès externe | Tailscale (package Synology) |
| Build tablette | NestJS sert le build statique React — aucun build sur tablette |
| PIN admin | Variable `ADMIN_PIN_ENABLED=false` en dev, `true` en prod |

---

## Structure du projet

```
educmentor/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/
│   │   │   └── configuration.ts          # variables d'env typées
│   │   ├── database/
│   │   │   └── database.module.ts        # config TypeORM SQLite
│   │   └── modules/
│   │       ├── auth/                     # PIN + JWT
│   │       │   ├── auth.module.ts
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   └── jwt-auth.guard.ts
│   │       ├── catalog/                  # registre des modules actifs
│   │       │   ├── catalog.module.ts
│   │       │   ├── catalog.controller.ts
│   │       │   ├── catalog.service.ts
│   │       │   └── entities/
│   │       │       └── module.entity.ts
│   │       ├── settings/                 # clés de configuration
│   │       │   ├── settings.module.ts
│   │       │   ├── settings.controller.ts
│   │       │   ├── settings.service.ts
│   │       │   └── entities/
│   │       │       └── setting.entity.ts
│   │       └── imagier/                  # module imagier anglais
│   │           ├── imagier.module.ts
│   │           ├── imagier-game.controller.ts   # endpoints enfant
│   │           ├── imagier-admin.controller.ts  # endpoints admin
│   │           ├── imagier.service.ts           # ImagierQuestion inclut `direction`
│   │           ├── imagier-import.service.ts    # import JSON + images
│   │           └── entities/
│   │               ├── imagier-word.entity.ts
│   │               ├── imagier-progression.entity.ts
│   │               └── imagier-session.entity.ts
│   ├── data/
│   │   ├── educmentor.db                 # SQLite (gitignore)
│   │   └── images/                       # images servies statiquement
│   │       └── imagier/
│   │           ├── animaux/
│   │           ├── nourriture/
│   │           └── ...
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx                      # Provider Redux + ThemeProvider + RouterProvider
│   │   ├── routes/
│   │   │   └── router.tsx                # createBrowserRouter — toutes les routes
│   │   ├── context/
│   │   │   └── ThemeContext.tsx          # dark/light mode (useTheme hook inclus)
│   │   ├── store/
│   │   │   ├── index.ts                  # configureStore + types RootState/AppDispatch
│   │   │   └── slice/
│   │   │       └── authSlice.ts          # token JWT, état authentifié
│   │   ├── hook/
│   │   │   └── useAuth.ts                # useAuth → { token, isAuthenticated, login, logout }
│   │   ├── api/
│   │   │   ├── client.ts                 # axios instance + intercepteur JWT
│   │   │   ├── auth.api.ts
│   │   │   ├── catalog.api.ts
│   │   │   ├── settings.api.ts
│   │   │   └── imagier.api.ts            # startSession, recordAnswer, completeSession, createWord, uploadWordImage…
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── ModuleCard.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header/Header.tsx     # toggle dark/light + GearButton + bouton home
│   │   │   │   ├── PageContainer/PageContainer.tsx
│   │   │   │   └── HomePage/HomePage.tsx  # Header + Outlet pour vues enfant
│   │   │   ├── auth/
│   │   │   │   ├── PinModal.tsx          # clavier numérique tactile
│   │   │   │   ├── PinGate.tsx           # HOC protège une route par PIN
│   │   │   │   └── GearButton.tsx        # bouton discret → ouvre PinModal → /admin
│   │   │   ├── modules/
│   │   │   │   └── imagier/
│   │   │   │       ├── child/
│   │   │   │       │   ├── ImagierHome.tsx     # choix catégorie/mode/difficulté
│   │   │   │       │   ├── ImagierGame.tsx     # jeu QCM — masque image si en_to_fr
│   │   │   │       │   └── ImagierResult.tsx   # score + récap erreurs
│   │   │   │       ├── admin/
│   │   │   │       │   ├── ImagierAdmin.tsx        # layout onglets (Mots / Images / Import / Progression / Paramètres)
│   │   │   │       │   ├── ImagierWordList.tsx     # liste filtrée avec toggle is_active
│   │   │   │       │   ├── ImagierWordForm.tsx     # formulaire créer/éditer un mot
│   │   │   │       │   ├── ImagierImport.tsx       # import JSON en masse
│   │   │   │       │   ├── ImagierImageImport.tsx  # import images drag & drop + pré-remplissage dict
│   │   │   │       │   ├── ImagierProgression.tsx  # stats progression + reset
│   │   │   │       │   └── ImagierSettings.tsx     # nb questions, mode, difficulté par défaut
│   │   │   │       └── constants/
│   │   │   │           ├── categories.ts       # liste des catégories UI
│   │   │   │           ├── lookupWord.ts       # Map O(1) fr→{en,category,subcategory}
│   │   │   │           └── dictionary.json     # dictionnaire thématique 5744 entrées
│   │   │   └── Error/
│   │   │       └── pages/ErrorPage.tsx
│   │   ├── views/
│   │   │   ├── child/
│   │   │   │   └── ChildHome.tsx         # accueil tablette : liste modules actifs
│   │   │   ├── admin/
│   │   │   │   ├── AdminPage.tsx       # Header + sidebar BEM + Outlet
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   └── ModuleCatalog.tsx
│   │   │   └── settings/
│   │   │       └── Settings.tsx          # placeholder (imagier settings → /admin/imagier/settings)
│   │   ├── types/
│   │   │   └── index.ts                  # AppModule, ImagierWord, ImagierQuestion (avec direction), ImagierSessionResponse…
│   │   └── assets/
│   │       ├── images/
│   │       └── styles/                   # SCSS 7-1 + BEM
│   │           ├── main.scss
│   │           ├── _abstracts/           # variables, mixins
│   │           ├── _base/                # reset, typography
│   │           ├── _layout/              # _header.scss, _adminLayout.scss, _childLayout.scss, _pageContainer.scss
│   │           ├── _components/          # _button.scss, _moduleCard.scss, _pinModal.scss
│   │           ├── _pages/               # _admin.scss (AdminCard/AdminBtn/AdminTable/Toggle…), _childHome.scss, _error.scss
│   │           ├── _modules/
│   │           │   └── _imagier/         # _imagierHome, _imagierGame, _imagierResult, _imagierAdmin
│   │           ├── _themes/              # dark.scss, light.scss
│   │           └── _vendors/             # overrides éventuels
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .gitignore
└── PLAN.md
```

---

## Schéma de base de données

### Table `modules`
```sql
id           TEXT PRIMARY KEY  -- slug: 'imagier-anglais'
name         TEXT NOT NULL     -- 'Imagier Anglais'
description  TEXT
icon         TEXT              -- emoji affiché dans l'UI
is_active    INTEGER DEFAULT 0
display_order INTEGER DEFAULT 0
created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Table `settings`
```sql
key   TEXT PRIMARY KEY
value TEXT NOT NULL
```
Valeurs initiales à seeder :
- `admin_pin_hash` → hash bcrypt du PIN par défaut (`1234`)
- `imagier_questions_per_session` → `10`
- `imagier_mastery_threshold` → `5`
- `imagier_default_difficulty` → `level_1`
- `imagier_default_mode` → `fr_to_en`

### Table `imagier_words`
```sql
id             TEXT PRIMARY KEY   -- uuid
slug           TEXT UNIQUE        -- 'chat'
fr             TEXT NOT NULL      -- 'chat'
en             TEXT NOT NULL      -- 'cat'
category       TEXT NOT NULL      -- 'animaux'
subcategory    TEXT               -- 'mammiferes'
image_filename TEXT               -- 'chat.webp' (null si pas d'image)
is_active      INTEGER DEFAULT 0
created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
```

### Table `imagier_progression`
```sql
id             TEXT PRIMARY KEY
word_id        TEXT NOT NULL REFERENCES imagier_words(id)
correct_count  INTEGER DEFAULT 0
incorrect_count INTEGER DEFAULT 0
is_mastered    INTEGER DEFAULT 0
mastered_at    DATETIME
last_seen      DATETIME
-- UNIQUE(word_id)
```

### Table `imagier_sessions`
```sql
id              TEXT PRIMARY KEY
started_at      DATETIME DEFAULT CURRENT_TIMESTAMP
completed_at    DATETIME
total_questions INTEGER
correct_answers INTEGER
mode            TEXT   -- 'fr_to_en' | 'en_to_fr' | 'random'
difficulty      TEXT   -- 'level_1' | 'level_2'
categories      TEXT   -- JSON array ex: '["animaux","nourriture"]'
```

---

## Niveaux de difficulté (imagier)

| Niveau | Image | Format | Indice |
|---|---|---|---|
| `level_1` | Oui | QCM 4 choix | Aucun |
| `level_2` | Oui | QCM 2 choix | Aucun |
| `level_3` (futur) | Non | QCM 4 choix | Aucun |
| `level_4` (futur) | Non | Saisie libre | 1ère lettre |
| `level_5` (futur) | Non | Saisie libre | Aucun |

En mode `en_to_fr` : l'image est **masquée** pendant la question et révélée après la réponse.
En mode `random` : le backend calcule la direction par question et l'expose dans le champ `direction` de `ImagierQuestion`.

---

## Logique PIN / accès admin

```
Vue enfant (/)
  └── Bouton engrenage discret (Header, coin droit)
        └── Modale PIN
              └── PIN correct → redirige vers /admin

/admin     → gestion complète (modules, mots, images, import, progression, paramètres imagier)
/settings  → placeholder pour futurs réglages multi-modules

En dev : ADMIN_PIN_ENABLED=false → /admin accessible sans PIN
En prod : ADMIN_PIN_ENABLED=true → PIN obligatoire
```

---

## Routing frontend

```
/                          HomePage > ChildHome
/module/imagier            HomePage > ImagierHome
/module/imagier/play       HomePage > ImagierGame
/module/imagier/result     HomePage > ImagierResult

/settings                  PinGate > Settings

/admin                     PinGate > AdminPage
/admin/                    (index) AdminDashboard
/admin/modules             ModuleCatalog
/admin/imagier             ImagierAdmin > (index) ImagierWordList
/admin/imagier/images      ImagierAdmin > ImagierImageImport
/admin/imagier/import      ImagierAdmin > ImagierImport
/admin/imagier/progression ImagierAdmin > ImagierProgression
/admin/imagier/settings    ImagierAdmin > ImagierSettings
/admin/imagier/mots/:id    ImagierAdmin > ImagierWordForm
```

---

## API REST (endpoints)

### Auth
```
POST /api/auth/verify-pin       body: { pin }  → { token }
```

### Catalog
```
GET  /api/catalog/modules             → liste tous les modules
PATCH /api/catalog/modules/:id        → { is_active, display_order }
```

### Settings
```
GET  /api/settings                    → { key, value }[]
PATCH /api/settings/:key              → { value }     [AUTH]
```

### Imagier — jeu (vue enfant)
```
POST /api/imagier/session             body: { categories, mode, difficulty, count }
                                      → { session_id, questions: ImagierQuestion[] }
POST /api/imagier/session/:id/answer  body: { word_id, is_correct }
POST /api/imagier/session/:id/complete body: { correct_answers, total_questions }
```

`ImagierQuestion` :
```ts
{
  word_id:    string
  image_url:  string | null
  prompt:     string
  choices:    { id: string; label: string }[]
  correct_id: string
  direction:  'fr_to_en' | 'en_to_fr'  // calculé par question (utile en mode random)
}
```

### Imagier — admin
```
GET    /api/imagier/words             query: { category, is_active, search }  [AUTH]
POST   /api/imagier/words             body: WordDto                            [AUTH]
PATCH  /api/imagier/words/:id         body: Partial<WordDto>                   [AUTH]
DELETE /api/imagier/words/:id                                                  [AUTH]
GET    /api/imagier/categories                                                 [AUTH]
POST   /api/imagier/import            body: { json, overwrite }                [AUTH]
GET    /api/imagier/progression                                                [AUTH]
DELETE /api/imagier/progression       → reset complet                          [AUTH]
POST   /api/imagier/words/:id/image   multipart upload (field: file)           [AUTH]
```

---

## Phase 1 — Scaffolding & Infrastructure ✅

### Étape 1.1 — Initialisation du monorepo

```bash
mkdir educmentor && cd educmentor
git init
```

### Étape 1.2 — Initialiser le backend NestJS

```bash
cd backend
npx @nestjs/cli new . --package-manager npm --skip-git
npm install @nestjs/typeorm typeorm better-sqlite3 @types/better-sqlite3
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @types/bcrypt @types/passport-jwt
npm install @nestjs/config class-validator class-transformer uuid @types/uuid
npm install @nestjs/serve-static
```

### Étape 1.3 — Initialiser le frontend React

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom axios
npm install @reduxjs/toolkit react-redux
npm install -D sass
```

### Étape 1.4 — Fichier `.env.example` (racine)

```env
ADMIN_PIN_ENABLED=false
JWT_SECRET=change_me_in_production
DEFAULT_PIN=1234
BACKEND_PORT=3000
DB_PATH=/app/data/educmentor.db
IMAGES_PATH=/app/data/images
STATIC_PATH=/app/static
```

### Étape 1.5 — Configuration NestJS (`src/config/configuration.ts`)

```typescript
export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '3000', 10),
  adminPinEnabled: process.env.ADMIN_PIN_ENABLED !== 'false',
  jwtSecret: process.env.JWT_SECRET ?? 'dev_secret',
  defaultPin: process.env.DEFAULT_PIN ?? '1234',
  dbPath: process.env.DB_PATH ?? './data/educmentor.db',
  imagesPath: process.env.IMAGES_PATH ?? './data/images',
  staticPath: process.env.STATIC_PATH ?? './static',
});
```

### Étape 1.6 — DatabaseModule

TypeORM avec `type: 'better-sqlite3'`, `synchronize: true`, `autoLoadEntities: true`.

### Étape 1.7 — NestJS sert le build React

`ServeStaticModule` avec `rootPath = staticPath`, `exclude: ['/api/(.*)']`.

`vite.config.ts` : `build.outDir = '../backend/static'`.

### Étape 1.8 — Dockerfile & docker-compose.yml

Multi-stage build : frontend-builder → backend-builder → image finale.
Volume `./data:/app/data` pour SQLite + images persistés sur le NAS.

---

## Phase 2 — Core backend ✅

- SettingsModule (GET/PATCH /api/settings)
- AuthModule (POST /api/auth/verify-pin → JWT, guard JwtAuthGuard)
- CatalogModule (GET/PATCH /api/catalog/modules)

---

## Phase 3 — Core frontend ✅

- SCSS 7-1 + variables CSS (dark/light via ThemeContext)
- Redux store + authSlice
- Composants communs : Button, ModuleCard, PageContainer
- HomePage (Header + Outlet)
- Header : toggle thème + GearButton + bouton home
- GearButton : modale PIN → /admin
- ChildHome : liste des modules actifs (CatalogAPI)
- Settings : page placeholder pour futurs modules
- AdminPage : Header + sidebar BEM + Outlet
- AdminDashboard, ModuleCatalog

---

## Phase 4 — Module Imagier Anglais ✅

### Backend
- Entités : ImagierWord, ImagierProgression, ImagierSession
- ImagierService : startSession (sélection pondérée, distracteurs, `direction` par question), recordAnswer, completeSession
- ImagierImportService : import JSON + résolution images
- Endpoints game (sans auth) + admin (avec auth)
- Upload image par mot : `POST /api/imagier/words/:id/image`

### Frontend — vue enfant
- **ImagierHome** : choix catégories, mode (fr→en / en→fr / aléatoire), difficulté
- **ImagierGame** : QCM, barre de progression, masquage image si `question.direction === 'en_to_fr'` et réponse pas encore donnée
- **ImagierResult** : score dynamique (🏆/⭐/👍/💪), liste des erreurs avec miniatures

### Frontend — admin
- **ImagierAdmin** : layout à onglets (Mots / Images / Import JSON / Progression / Paramètres)
- **ImagierWordList** : liste filtrée (catégorie, statut, recherche), toggle is_active inline, lien édition
- **ImagierWordForm** : créer/éditer un mot, upload image, preview
- **ImagierImageImport** : drag & drop multi-images, pré-remplissage fr (nom fichier) + en + catégorie (via `lookupWord`), sauvegarde séquentielle avec statut par carte
- **ImagierImport** : import JSON en masse (textarea ou drag & drop fichier)
- **ImagierProgression** : tableau progression par mot, reset complet
- **ImagierSettings** : nb questions par session, mode par défaut, difficulté par défaut

### Dictionnaire
- `dictionary.json` : 5744 entrées thématiques fr→en avec catégorie/sous-catégorie
- `lookupWord.ts` : Map O(1) construite au chargement du module, `lookupWord(fr)` + `filenameToFr(filename)`

---

## Phase 5 — Déploiement NAS 🔜

### Étape 5.1 — Build de production

```bash
cd frontend && npm run build       # → backend/static/
cd ../backend && npm run build     # → backend/dist/
```

### Étape 5.2 — Docker build & push

```bash
docker build -t educmentor:latest .
docker save educmentor:latest | gzip > educmentor.tar.gz
# Copier sur le NAS via SCP ou interface Synology
```

### Étape 5.3 — Synology Container Manager

1. Importer l'image `.tar.gz`
2. Créer un dossier partagé `educmentor/data` sur le NAS
3. Mapper le volume : `/volume1/educmentor/data → /app/data`
4. Configurer les variables d'env (`ADMIN_PIN_ENABLED=true`, `JWT_SECRET`, etc.)
5. Exposer le port `3000`

### Étape 5.4 — Tailscale

- Installer le package Tailscale depuis le Centre de paquets Synology
- Activer et connecter au compte Tailscale
- Accès tablette via l'IP Tailscale du NAS : `http://<nas-tailscale-ip>:3000`

---

## Phase 6 — Migration contenu 🔜

### Étape 6.1 — Import du dictionnaire

Utiliser l'endpoint `POST /api/imagier/import` avec `dictionary.json` pour créer tous les mots (désactivés par défaut).

### Étape 6.2 — Import des images

- Placer les images dans `data/images/imagier/<catégorie>/`
- Utiliser l'onglet **Images** de l'admin pour lier images et mots automatiquement (via pré-remplissage nom de fichier)
- Activer les mots souhaités via l'onglet **Mots**
