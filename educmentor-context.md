# ÉducMentor — Contexte Projet

> Document de référence à utiliser comme contexte dans l'IDE au démarrage du développement.

---

## 1. Vision du projet

Application web éducative locale et personnalisée, développée par le père pour sa fille.
Équivalent simplifié et personnalisé de GCompris, avec une architecture modulaire et évolutive.

**Principes fondateurs :**
- L'application grandit avec l'enfant (ajout/suppression de modules sans refonte)
- Tout le contenu pédagogique est validé par le parent avant d'apparaître sur la tablette
- L'IA est un assistant de création de contenu, pas une source directe pour l'enfant
- Le père est seul développeur et seul administrateur

---

## 2. Profil de l'utilisatrice

- Fille, rentrée en CE1 au moment du démarrage du projet
- Utilise déjà GCompris comme référence comparative

---

## 3. Stack technique

### Décisions retenues

| Couche | Choix | Justification |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite | |
| Backend | NestJS + TypeScript | |
| ORM | TypeORM | Intégration native NestJS |
| Base de données | SQLite (better-sqlite3) | Mono-user local, zéro infra |
| Style | SCSS 7-1 + BEM | |
| Container | Docker + docker-compose | `docker-compose.dev.yml` (hot reload) / `docker-compose.yml` (prod NAS) |
| Accès externe | Tailscale | |


### Lancement

**Dev (hot reload) :**
```bash
docker compose -f docker-compose.dev.yml up
```
- Backend NestJS : port 4005 (watch mode)
- Frontend Vite : port 6005, proxy `/api` → backend

**Production / tablette :**
```bash
docker compose up --build
```
NestJS sert le build statique React — un seul conteneur, un seul port. Pas de build côté tablette.

---

## 4. Architecture générale

```
[Tablette / Navigateur]
        |
        | HTTP (réseau local / Tailscale)
        v
[NestJS — port 4005]
  ├── Sert le frontend React (build statique en prod)
  ├── API REST /api/*
  │     ├── CatalogController  → modules actifs/inactifs
  │     ├── ImagierController  → mots, sessions, progression
  │     ├── TablesController   → sessions, progression
  │     └── CalculController   → sessions, progression
  └── TypeORM
        |
        v
[SQLite — /app/data/educmentor.db]
  ├── modules        (catalogue des modules)
  ├── imagier_words  (mots FR↔EN + images)
  ├── *_progression  (maîtrise par notion, par module)
  └── *_sessions     (historique des sessions de jeu)
```

### Deux vues frontend

**Vue enfant (tablette)**
- Interface tactile, grande typographie, boutons larges
- Affiche uniquement les modules actifs
- Aucun accès à l'administration
- Pas de contenu non validé

**Vue admin / dev (PC)**
- Gestion des modules (activer, désactiver, ordonner)
- Visualisation de la progression
- Interface de génération et validation du contenu IA
- Accès protégé (PIN ou routing conditionnel — à définir)

### Système de modules

La table `modules` contrôle ce qui s'affiche sur la tablette (activation on/off via l'admin).
Mais ajouter un **nouveau** module demande plusieurs étapes — voir section 10 ci-dessous.

Chaque module connaît l'état de progression de l'enfant (notions maîtrisées / en cours / non abordées) et adapte ses exercices en conséquence.

---

## 5. Modules envisagés

### Priorité haute (pertinents maintenant)

| Module | Description | Complexité dev | Notes |
|---|---|---|---|
| Tables de multiplication | Exercices adaptés aux tables maîtrisées | Faible | Doit connaître l'état : 2/5/9/10 acquises, proposer 3/4 ensuite |
| Lecture de l'heure | Analogique ↔ numérique, puis durées | Faible | Suite naturelle : "il est 14h20, le film dure 1h30, finit à ?" |
| Imagier anglais | Mots illustrés avec état appris/en cours | Faible | |`
| Monnaie | Calcul de rendu de monnaie | Faible | Introduit les décimaux sans les nommer |
| Jeux (Snake) | Déjà développé, à intégrer | Faible | Peut devenir une récompense débloquée après X exercices |
| Pronom personnel | | Faible | |
| ... | |  | |


### Priorité moyenne (dans les mois suivants)

| Module | Description | Complexité dev | Notes |
|---|---|---|---|
| Suites logiques | Formes, couleurs, chiffres — trouver le suivant | Faible | Logique pure, pas de prérequis |
| Syllabation / sons | Identifier la bonne syllabe | Faible | Utile CE1 |
| Pixel art guidé | Colorier par numéro sur grille Canvas | Faible | Créatif, reposant entre deux exercices |
| Problèmes mathématiques | Énoncés textuels générés par IA | Moyen | Voir section IA ci-dessous |
| Carte interactive | Placer villes / fleuves sur carte France | Moyen | Leaflet.js ou React Simple Maps |

### Complexité réelle sous-estimée

| Module | Pourquoi c'est plus dur qu'il n'y paraît |
|---|---|
| Génération de problèmes | Les templates simples (`"Tu as X pommes..."`) sont faciles. La variété, la cohérence et le calibrage par niveau sont un vrai travail éditorial. D'où l'IA. |
| Dictée audio | Web Speech API existe mais est capricieuse sur tablette. Comparaison de chaînes avec tolérance aux fautes = non trivial. |

---

## 6. Workflow contenu IA

### Principe fondateur
**L'IA génère, le parent valide, la BDD diffuse.**
Aucun contenu généré par IA n'arrive directement sur la tablette.

### Flux

```
[Vue admin]
    |
    | 1. Parent configure le prompt (niveau, notions, type d'exercice)
    v
[Appel API Claude / autre LLM]
    |
    | 2. Retourne N énoncés / exercices / mots
    v
[Interface de relecture admin]
    |
    | 3. Parent relit, modifie, approuve ou rejette chaque item
    v
[SQLite — table content, status = "validated"]
    |
    | 4. Seulement le contenu validé est exposé à la vue enfant
    v
[Tablette]
```

### Exemple d'usage
Prompt configuré : `"Génère 5 problèmes mathématiques pour une fille de CE1, maîtrise tables 2/5/9/10, notions de monnaie, niveau légèrement au-dessus du programme."`
→ Claude retourne 5 énoncés
→ Le parent en valide 3, modifie 1, rejette 1
→ Les 4 approuvés sont insérés en BDD avec `status = 'validated'`

### Modèle de données suggéré (table content)

```sql
content (
  id          integer PRIMARY KEY AUTOINCREMENT,
  module_slug varchar,        -- ex: 'math-problems'
  type        varchar,        -- ex: 'problem', 'word', 'exercise'
  body        jsonb,          -- contenu structuré selon le module
  status      varchar,        -- 'draft' | 'validated' | 'rejected'
  source      varchar,        -- 'ai-generated' | 'manual'
  created_at  timestamp,
  validated_at timestamp
)
```

---

## 7. Modèle de progression

La progression est centrale — c'est ce qui différencie l'app d'une simple feuille d'exercices.

```sql
progression (
  id          integer PRIMARY KEY AUTOINCREMENT,
  module_slug varchar,
  notion_key  varchar,        -- ex: 'table_3', 'hour_duration', 'word_apple'
  status      varchar,        -- 'not_started' | 'in_progress' | 'mastered'
  score       int,            -- pourcentage ou points
  attempts    int,
  last_seen   timestamp,
  mastered_at timestamp
)
```

**Règle de maîtrise** : à définir par module (ex : 3 succès consécutifs = maîtrisé pour les tables).

---

## 8. Questions ouvertes

1. ~~**Séparation des vues**~~ → ✅ Routing conditionnel, `/admin` et `/settings` protégés par PIN.
2. ~~**"Sans build" sur tablette**~~ → ✅ NestJS sert le build statique en prod.
3. **Quel LLM pour la génération de contenu ?** Claude API est une option naturelle. Budget mensuel à anticiper.
4. **Règles de maîtrise** : actuellement configurable par module (défaut 5 succès pour l'Imagier). À affiner selon retours terrain.
5. **Import corpus imagier** : dictionary.json (~500 mots) + images depuis `generateur_carte/` — prévu Phase 6.

---

## 10. Comment ajouter un module

### Backend (NestJS)

**1. Créer le dossier du module** dans `backend/src/modules/<nom>/` avec :
- `<nom>.module.ts` — enregistre les entités, le service et les contrôleurs
- `<nom>.service.ts` — logique métier (génération de sessions, maîtrise)
- `<nom>-game.controller.ts` — routes de jeu (GET /session, POST /answer, /complete)
- `<nom>-admin.controller.ts` — routes admin protégées (@UseGuards(JwtAuthGuard))
- `entities/` — entités TypeORM (progression, session)
- `dto/<nom>.dto.ts` — validation des corps de requête

Se baser sur un module existant comme modèle : `backend/src/modules/tables/` est le plus simple.

**2. Importer le module dans `backend/src/app.module.ts`** :
```typescript
import { GrammaireModule } from './modules/grammaire/grammaire.module';
// puis dans imports: [..., GrammaireModule]
```

**3. Ajouter l'entrée catalogue dans `backend/src/modules/catalog/modules.config.ts`** :
```typescript
{ id: 'grammaire', name: 'Grammaire', icon: '📝', is_active: false, display_order: 4 }
```

### Frontend (React)

**4. Créer le dossier du module** dans `frontend/src/components/modules/<nom>/` avec :
- `child/` — vues de jeu (Home, Game, Result)
- `admin/` — vues admin (Admin, Settings, Progression)
- `<nom>.api.ts` dans `frontend/src/api/` — fonctions axios pour ce module

**5. Ajouter l'entrée dans `frontend/src/modules.registry.ts`** :
```typescript
{ id: 'grammaire', label: 'Grammaire', icon: '📝', adminPath: '/admin/grammaire' }
```
→ La sidebar admin se met à jour automatiquement.

**6. Ajouter les routes dans `frontend/src/routes/router.tsx`** — routes child et routes admin.

### Résumé des fichiers à toucher (minimum)

| Fichier | Action |
|---|---|
| `backend/src/modules/<nom>/` | Créer (module, service, contrôleurs, entités, dto) |
| `backend/src/app.module.ts` | Importer le module NestJS |
| `backend/src/modules/catalog/modules.config.ts` | Ajouter l'entrée catalogue |
| `frontend/src/components/modules/<nom>/` | Créer (child + admin) |
| `frontend/src/api/<nom>.api.ts` | Créer |
| `frontend/src/modules.registry.ts` | Ajouter l'entrée (sidebar auto) |
| `frontend/src/routes/router.tsx` | Ajouter les routes |

---

## 9. Ce que ce projet n'est pas

- Une application multi-utilisateurs (un seul profil enfant)
- Une application déployée en ligne (100% local, réseau domestique)
- Un clone de GCompris (moins de modules, mais plus personnalisés et évolutifs)
- Un outil où l'IA parle directement à l'enfant (le parent reste le filtre)
