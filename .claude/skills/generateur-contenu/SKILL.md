---
name: generateur-contenu
description: Point d'entrée unique pour générer du contenu pédagogique educ_mentor (lecture, dictée, et modules à venir). Se déclenche dès que Lionel demande de générer un module, du contenu, des exercices, une dictée, un texte de lecture, ou tout contenu importable pour educ_mentor. Commence par identifier le module ciblé (le demander si ambigu), puis charge et suit les instructions dédiées à ce module.
---

# Générateur de contenu — educ_mentor

Point d'entrée unique pour produire du contenu pédagogique au format JSON, importable
dans les écrans Administration d'educ_mentor. Chaque module a ses propres règles de
génération et son propre format de sortie, détaillés dans un fichier dédié sous `modules/`.
Ce fichier ne fait que router vers le bon module — ne pas dupliquer leur contenu ici.

## Étape 0 — Identifier le module

Si la demande de Lionel précise déjà le module sans ambiguïté (ex. "génère-moi une
dictée sur...", "un module de lecture sur les volcans"), passe directement à l'étape 1
pour ce module sans reposer la question.

Sinon, demande-lui (via l'outil de question si disponible, sinon en Markdown) :

**Que veux-tu générer pour educ_mentor ?**
- **Lecture** — module de compréhension de texte (texte + QCM)
- **Dictée** — mots, phrases, paragraphes à dicter
- *(d'autres modules s'ajouteront à cette liste au fil du temps)*

## Étape 1 — Charger les instructions du module

| Module | Instructions à charger (outil Read) |
|---|---|
| Lecture | `modules/lecture/GENERATION.md` |
| Dictée | `modules/dictee/GENERATION.md` |

Charge le fichier correspondant avant de continuer : il contient le questionnaire, les
règles de génération, le format de sortie et les étapes de post-génération propres à ce
module. Suis-le à la lettre — ne pas improviser un format différent.

## Ajouter un nouveau module plus tard

1. Créer `modules/<nom-module>/GENERATION.md` en suivant le même gabarit que les modules
   existants : questionnaire → confirmation → génération → format de sortie → règles de
   qualité → post-génération.
2. Ajouter une ligne dans le tableau de l'étape 1 et dans la liste de l'étape 0.
3. Ne factoriser de la logique commune entre modules que si un vrai doublon apparaît sur
   3 modules ou plus — pas avant, pour éviter l'abstraction prématurée.
