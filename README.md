# ÉducMentor

Application d'entraînement scolaire pour un usage familial : une collection de petits jeux
(« tuiles ») par matière — tables de multiplication, conjugaison, monnaie, lecture de l'heure,
géographie, compréhension de texte… — avec suivi de progression et espace d'administration.

Déployée sur `educmentor.lionelcaro.fr`, derrière un système d'invitation par appareil.

## Démarrer en local

Tout passe par Docker : la base SQLite et les images sont montées depuis `./data/`.

```bash
cp .env.example .env      # puis renseigner JWT_SECRET, DEFAULT_PIN, ADMIN_BOOTSTRAP_TOKEN
docker compose -f docker-compose.dev.yml up
```

| | |
|---|---|
| Frontend | http://localhost:6005 |
| API | http://localhost:4005/api |

Sans Docker, dans deux terminaux : `cd backend && npm install && npm run start:dev`,
`cd frontend && npm install && npm run dev`.

## Contrôles avant de pousser

Ce sont exactement les étapes que la CI rejoue ; un échec bloque le déploiement.

```bash
cd backend  && npm run lint && npm run typecheck && npm test
cd frontend && npm run lint && npm run typecheck && npm test
```

`npm run lint` ne corrige rien. Pour appliquer les corrections automatiques : `npm run lint:fix`.

## Architecture

```
backend/     NestJS · TypeORM · SQLite      un dossier par module fonctionnel
frontend/    React 19 · Vite · Redux Toolkit · RTK Query · SCSS (7-1, BEM)
data/        base, images, corpus de travail   monté en volume, jamais versionné
scripts/     outils ponctuels (sauvegarde, préparation de corpus)
```

- `frontend/CLAUDE.md` — architecture front en détail : moteur de jeu, manifeste, flux de données.
- `CHANTIERS.md` — état des travaux en cours et décisions prises.

### Ajouter un module de jeu

1. `frontend/src/modules/<id>/` avec `<id>.module.tsx`, `<id>.game.tsx`, `<id>.api.ts`
2. une ligne dans `MODULES`, dans `frontend/src/modules.manifest.tsx`
3. une entrée dans `MODULES_CONFIG`, dans `backend/src/modules/catalog/modules.config.ts`

L'étape 3 est facile à oublier : la grille d'accueil est construite depuis le catalogue
**backend**, pas depuis le manifeste frontend. Un module qui n'y figure pas reste invisible.
Le test `frontend/src/__tests__/modules-registry.test.ts` vérifie que les trois registres
sont d'accord.

## Base de données

Le schéma n'évolue **que** par migration versionnée — `synchronize` est désactivé par défaut,
parce qu'il pouvait supprimer une colonne et ses données sur une simple modification d'entité.

```bash
cd backend
npm run db:check                                          # schéma réel vs entités
npm run migration:generate -- src/database/migrations/MonChangement
npm run migration:show
```

Les migrations sont appliquées automatiquement au démarrage de l'application.
En local sur une base jetable, `DB_SYNCHRONIZE=true` restaure l'ancien comportement.

### Sauvegarde

`data/educmentor.db` contient la progression — la seule donnée irremplaçable du projet.

```bash
./scripts/backup-db.sh              # → data/backups/educmentor-<horodatage>.db.gz
KEEP=30 ./scripts/backup-db.sh      # rétention (défaut : 14)
```

À planifier sur le serveur :

```cron
0 3 * * * cd /chemin/vers/educ_mentor && ./scripts/backup-db.sh >> /var/log/educmentor-backup.log 2>&1
```

## Déploiement

Un push sur `main` déclenche `.github/workflows/deploy.yml` : contrôles qualité, puis
construction des images vers GHCR, puis `docker compose pull && up -d` sur le VPS.
Le déploiement n'a lieu que si lint, typage et tests passent des deux côtés.

**Avant le premier déploiement suivant le passage aux migrations**, vérifier que le schéma de
production correspond aux entités — il a vécu sous `synchronize: true` et a pu dériver :

```bash
DB_PATH=/chemin/vers/data/educmentor.db npm run db:check
```
