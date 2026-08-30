# Intégration du contenu imagier dans educ_mentor

Procédure pour remplacer le contenu du module anglais (imagier) par le catalogue
kids-flashcards. Faite une fois sur la base de dev ; à rejouer sur la prod.

## Pré-requis : produire les artefacts

```bash
cd poc
npm install
npm run scrape        # → out/flashcards.json + out/images/  (~2 min à froid)
npm run to-imagier    # → out/dictionnaire_thematique.json + out/imagier-images/
```

Relire avant d'importer :
- `out/report.md` — traductions inventées, écarts
- `out/imagier-collisions.md` — 28 concepts distincts perdus (2e sens ignoré à l'import)

## 1. Figer le contenu memory (AVANT tout wipe)

```bash
cd poc
npm run build-memory-seed   # lit la base actuelle : 76 animaux + images IA
```

Produit (versionnés) : `backend/src/modules/memory/memory-card.seed.json` +
`backend/src/modules/memory/seed-images/*.webp`. Au premier démarrage sur une table
`memory_cards` vide, `MemoryCardSeedService` insère les cartes et copie les images
vers `<IMAGES_PATH>/memory/`.

## 2. Mettre les images imagier en place

Le dossier `data/images/imagier/` est monté en volume (jamais versionné). Remplacer
son contenu par les images renommées :

```bash
rm -rf data/images/imagier
cp -r poc/out/imagier-images data/images/imagier
```

En prod : même opération sur le volume monté.

## 3. Importer

Admin → **Imagier → Paramètres → Import d'un dictionnaire** :
1. cocher **« Remplacer tout le contenu existant »**
2. cocher **« Activer les mots importés »**
3. choisir `poc/out/dictionnaire_thematique.json`

L'endpoint (`POST /api/imagier/import`, `{ json, replace: true, activate: true }`) vide
`imagier_words` + `imagier_progression` (dans une transaction, seulement après validation
du JSON), puis insère ~1236 mots actifs. Chaque image est rattachée par
`normalize(fr) === normalize(nom de fichier)`.

Résultat attendu : `{ inserted: 1236, skipped: 0, replaced: true, errors: [] }`.

## 4. Vérifier

- Pré-jeu imagier : 18 thèmes, menu « Précise » qui liste les sous-catégories du thème choisi.
- Une partie filtrée (ex. Animaux → Insectes) ne tire que des insectes.
- Pré-jeu memory : plus de sélecteur de thème ; les cartes sont les 76 animaux IA.

## 5. Corrections fines

Tout est éditable dans l'admin imagier (liste des mots) : traduction, catégorie,
sous-catégorie, image, activation. Les 28 collisions de `imagier-collisions.md` se
récupèrent en créant un nouveau mot avec une traduction FR distincte.
