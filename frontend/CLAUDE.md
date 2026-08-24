# Architecture front — educ_mentor

## Structure `src/`

```
src/
├── assets/styles/        SCSS 7-1 BEM. Tokens dans _abstracts/variables.scss.
│                         Règle co-location : si un module a son propre style, il l'écrit dans son dossier.
├── components/
│   ├── auth/             AccessGate (garde d'accès appareil) + PinModal (code PIN admin)
│   ├── common/           Button, Badge, Spinner, etc. — composants réutilisables sans logique métier
│   ├── game/
│   │   ├── engine/       GameEngine (orchestrateur) + ses briques UI (GameCard, GameFooter, GameChoices…)
│   │   ├── setup/        GamePreSetup — rendu générique des options de configuration avant de jouer
│   │   ├── result/       GameResultView, GameResultPage, GameErrorList
│   │   ├── error/        GameErrorList (liste des erreurs d'une partie)
│   │   ├── LazyGame.tsx  Charge le spec d'un module en import() dynamique, passe-plat vers GameEngine
│   │   └── ModulePreSetup.tsx  Glue entre le manifest (setupOptions) et GamePreSetup
│   └── layout/           PageContainer, Header, AdminLayout…
├── context/              ThemeContext uniquement (persisté dans localStorage)
├── hooks/
│   ├── useGameSession.ts  Toute la logique d'une partie (chargement, timer, réponses, navigation)
│   ├── useQuestionTimer.ts  Timer par question, appelé par useGameSession
│   ├── useAuth.ts         Token admin, login, logout
│   ├── useDevMode.ts      Bascule le mode dev (Redux)
│   ├── useModuleMetaResolver.ts  Résout nom + icône d'un module depuis le catalogue
│   ├── redux.ts           useAppDispatch / useAppSelector typés
│   └── index.ts           Barrel
├── modules/              Un dossier par module de jeu, tout co-localisé :
│   └── <id>/
│       ├── <id>.module.tsx   Descripteur manifest (setupOptions, loadGameSpec, adminRoutes, progression)
│       ├── <id>.game.tsx     Spec de jeu (GameModuleSpec : renderPrompt, qcm/free, recordAnswer…)
│       ├── <id>.api.ts       Endpoints RTK Query du module (injectEndpoints sur baseApi)
│       └── admin/            Composants d'administration du module
├── modules.manifest.tsx  MODULES = [ ...tous les descripteurs ]. Ajouter un module = 1 ligne ici.
├── routes/               router.tsx — génère les routes depuis MODULES (buildChildRoutes, buildAdminRoute)
├── store/
│   ├── api/
│   │   ├── baseApi.ts        Socle RTK Query (baseUrl, token header)
│   │   └── progressionEndpoints.ts  Factory buildProgressionEntry partagée par les modules
│   ├── slice/
│   │   ├── authSlice.ts      Token JWT admin
│   │   ├── gameSetupSlice.ts Choix de session par module (persisté localStorage)
│   │   ├── gameResultSlice.ts Résultat de la dernière partie (correctCount, total, results)
│   │   └── devModeSlice.ts   Mode développeur (persisté localStorage)
│   └── index.ts              configureStore + exports RootState / AppDispatch
└── types/
    ├── game.types.ts     Contrats du moteur : GameModuleSpec, GameResultEntry, SetupOption…
    └── modules.types.ts  Contrat du manifest : ModuleManifest, ProgressionStat
```

---

## Flux de données clés

### Ajouter un module de jeu
1. Créer `modules/<id>/` avec `<id>.module.tsx`, `<id>.game.tsx`, `<id>.api.ts`
2. Ajouter `{ ...xModule }` dans `MODULES` dans `modules.manifest.tsx`
3. Le routeur et l'admin dashboard se mettent à jour automatiquement

### Cycle d'une partie (de bout en bout)
```
ModulePreSetup → dispatch(setModuleSetup) → navigate(/play)
  └─ LazyGame → import(<id>.game.tsx) → GameEngine
       └─ useGameSession : loadSession → questions → submitAnswer × N → advance()
            └─ dispatch(setGameResult) → navigate(/result)
                 └─ GameResultView : useAppSelector(selectGameResult)
```

### Transit de la donnée persistée
| Donnée | Slice | localStorage |
|---|---|---|
| Token admin | `auth` | `auth_token` |
| Choix de session | `gameSetup` | `maeve_game_setup` |
| Résultat de partie | `gameResult` | — (session uniquement) |
| Dev mode | `devMode` | `maeve_dev_mode` |
| Settings / catalogue / progression | cache RTK Query | — |

---

---

## Conventions d'écriture

**Pas de cadratins (—) dans le texte affiché.** Ni dans les libellés, ni dans les messages,
ni dans le contenu des fiches. Utiliser `·`, `:` ou une phrase séparée selon le cas.
Le test `frontend/src/__tests__/fiche-conjugaison.test.ts` le vérifie pour les fiches.
*(Les commentaires de code en contiennent encore : nettoyage à faire, la règle vaut pour la suite.)*

**Apostrophe droite (`'`), jamais typographique (`’`)**, dans tout le texte affiché.
C'est ce que le reste de l'interface utilise ; mélanger les deux se voit à l'écran.

**Attention à l'ordre des mots quand une phrase commence par un mot non capitalisable.**
« Avoir et être servent à… » plutôt que « être et avoir… ».

---

## Modes de réponse dans `GameModuleSpec`

Le moteur supporte trois modes, détectés automatiquement par question :

| Mode | Déclencheur | Validation |
|---|---|---|
| QCM single | `spec.qcm` + `getChoices` non vide + `correctKey` | `clicked === correctKey` — dans le moteur |
| QCM multi | `spec.qcm` + `correctKeys` non vide | `new Set(correctKeys)` vs `selectedKeys` — **dans le moteur** |
| Saisie libre | `spec.free` (ou `getChoices` vide sans carte) | `spec.free.isCorrect(question, given)` — dans le spec |
| Carte single | `spec.map` + `isMapQuestion` + `!isMultiSelect` | `spec.map.isCorrect(question, clicked)` — dans le spec |
| Carte multi | `spec.map` + `isMapQuestion` + `isMultiSelect` | `new Set(correctKeys)` vs `selectedKeys` — **dans le moteur** |

**Règle de conception** : toute validation par comparaison de sets (`correctKeys`) est centralisée dans le moteur — QCM multi et carte multi partagent exactement la même logique. Le spec ne déclare que `correctKeys` (les clés attendues) ; le moteur compare. Cela garantit que tout module utilisant `spec.map.isMultiSelect` obtient le multi-select gratuitement, sans logique à réécrire dans le spec.

`spec.map.isCorrect` ne couvre que le cas single (un clic sur un code connu).

---

## Module hors-moule (ex : Snake)
Les modules sans question/réponse court-circuitent `<LazyGame>` + `<GameEngine>` via `child?.Game` :
```ts
// snake.module.tsx
export const snakeModule: ModuleManifest = {
  id: 'snake',
  child: { Game: SnakeGame },   // ← porte de sortie, le routeur rend directement ce composant
};
```
Pas de `loadGameSpec`, pas de `setupOptions` requis.
