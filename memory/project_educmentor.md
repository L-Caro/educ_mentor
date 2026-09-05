---
name: ÉducMentor : contexte projet
description: Application éducative locale pour la fille du dev (CE1). Stack, décisions, modules développés, principes réels.
metadata:
  type: project
---

Application web éducative locale, développée par le père pour sa fille (CE1). Inspiré de GCompris, personnalisé et évolutif.

**Stack actée :**
- Frontend : React 19 + TypeScript + Vite + **SCSS (architecture 7-1 + BEM)**
- Backend : NestJS + TypeScript
- ORM : TypeORM
- BDD : SQLite (better-sqlite3, fichier unique)
- Container : Docker + docker-compose
- Déploiement : Synology DS220+ via Container Manager
- Accès externe : Tailscale
- Build : NestJS sert le build statique React (pas de build sur tablette)

**Principes fondateurs :**
- L'IA génère du contenu, le parent valide, la BDD diffuse
- Aucun contenu non validé sur la tablette
- Mono-utilisateur (une seule fille)

**PIN admin :**
- `ADMIN_PIN_ENABLED=false` en dev (bypass total)
- `ADMIN_PIN_ENABLED=true` en prod
- Même PIN pour /settings (options jeu sur tablette) et /admin (administration complète)
- Bouton engrenage discret sur la vue enfant → modale PIN → /settings → lien vers /admin

**Modules développés (✅ complets, 3 au total) :**

**Module 1 : Imagier Anglais** (`id: 'imagier'`)
- Mots FR↔EN avec images, organisés par catégories
- QCM 4 choix (level_1), 2 choix (level_2), saisie libre (level_3)
- Direction configurable : FR→EN, EN→FR
- Maîtrise : N bonnes réponses = mot maîtrisé (configurable, défaut 5)
- Session configurable (nb questions, catégories, niveau) via Settings (PIN)
- Source de vérité : dictionary.json (5744 entrées) importable via l'admin
- Images existantes dans generateur_carte/image anglais/ à migrer (Phase 6)

**Module 2 : Tables de multiplication** (`id: 'tables'`)
- Backend : `backend/src/modules/tables/`
- Frontend : `frontend/src/components/modules/tables/`
- Vues child : TablesHome, TablesGame, TablesResult
- Vues admin : TablesAdmin, TablesProgression, TablesSettings

**Module 3 : Calcul Mental** (`id: 'calcul-mental'`)
- Backend : `backend/src/modules/calcul/`
- Frontend : `frontend/src/components/modules/calcul/`
- Vues child : CalculHome, CalculGame, CalculResult
- Vues admin : CalculAdmin, CalculProgression, CalculSettings

**Réalité du système de modules (important) :**
Ajouter un nouveau module n'est PAS automatique. Il faut modifier plusieurs fichiers :
1. Créer les fichiers backend (module NestJS, entités, service, contrôleurs)
2. Importer le module dans `backend/src/app.module.ts`
3. Ajouter une entrée dans `backend/src/modules/catalog/modules.config.ts`
4. Créer les composants React (child + admin)
5. Ajouter les routes dans `frontend/src/routes/router.tsx`
6. Le registre `frontend/src/modules.registry.ts` alimente automatiquement la sidebar admin

**Contenu existant réutilisable (generateur_carte/) :**
- dictionary.json : ~500+ mots FR→EN organisés par thème/sous-thème
- Images organisées par catégorie : animaux, nourriture, vêtements, couleurs, émotions, corps humain, verbes, meubles, outils, santé, appareils...

**Lancement dev (hot reload) :**
```bash
docker compose -f docker-compose.dev.yml up
```
- Backend : NestJS watch mode, port 4005
- Frontend : Vite HMR, port 6005 → http://localhost:6005
- Premier démarrage lent (npm install + compilation better-sqlite3 pour Alpine)

**Lancement prod (NAS) :**
```bash
docker compose up --build
```

**Prochaines étapes :**
- Phase 5 : Déploiement NAS (Docker build → Synology Container Manager → Tailscale)
- Phase 6 : Import dictionary.json + images depuis generateur_carte/

**Why :** Application 100% locale, réseau domestique + Tailscale en vacances. Zéro déploiement cloud, zéro abonnement.
**How to apply :** Toujours penser "mono-user, local, évolutif". Pas de multi-tenant, pas de scaling.
