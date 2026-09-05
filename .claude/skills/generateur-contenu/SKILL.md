---
name: generateur-contenu
description: Point d'entrée unique pour générer du contenu pédagogique educ_mentor (lecture, dictée, grammaire, accords, et modules à venir). Se déclenche dès que Lionel demande de générer un module, du contenu, des exercices, une dictée, un texte de lecture, des phrases de grammaire, du vocabulaire pour les accords, ou veut enrichir le corpus d'un module. Commence par identifier le module ciblé (le demander si ambigu), puis charge et suit les instructions dédiées à ce module.
---

# Générateur de contenu : educ_mentor

Point d'entrée unique pour produire du contenu pédagogique educ_mentor. Chaque module a
ses propres règles de génération et son propre format de sortie, détaillés dans un fichier
dédié sous `modules/`. Ce fichier ne fait que router vers le bon module : ne pas dupliquer
leur contenu ici.

**Le format de sortie n'est pas le même partout, et ce n'est pas un accident.** Deux
modules produisent du JSON à importer depuis l'administration ; deux autres produisent du
TypeScript à committer :

| Sortie | Modules | Pourquoi |
|---|---|---|
| JSON importable | lecture, dictée | le contenu est du texte : un item de dictée est une chaîne, une question de lecture un intitulé et des choix |
| TypeScript à committer | grammaire, accords | le contenu est une STRUCTURE : chaque mot porte une nature, ou ses quatre formes accordées. Une erreur n'y donne pas un contenu médiocre, elle enseigne du faux français, et pour les accords la réponse attendue de l'enfant EST une orthographe. Un textarea d'import aurait été le seul endroit capable d'injecter ça. Même raisonnement que `geometrie.shapes.ts` |

Conséquence pratique à annoncer à Lionel : enrichir grammaire ou accords demande un commit
et un déploiement, là où lecture et dictée s'importent depuis l'application.

## Étape 0 : Identifier le module

Si la demande de Lionel précise déjà le module sans ambiguïté (ex. "génère-moi une
dictée sur...", "un module de lecture sur les volcans"), passe directement à l'étape 1
pour ce module sans reposer la question.

Sinon, demande-lui (via l'outil de question si disponible, sinon en Markdown) :

**Que veux-tu générer pour educ_mentor ?**
- **Lecture** : un texte et ses questions de compréhension *(JSON à importer)*
- **Dictée** : mots, phrases, paragraphes à dicter *(JSON à importer)*
- **Grammaire**, des phrases annotées mot par mot : nature et fonction *(TypeScript à committer)*
- **Accords** : des noms, adjectifs et verbes avec toutes leurs formes *(TypeScript à committer)*
- *(d'autres modules s'ajouteront à cette liste au fil du temps)*

## Étape 1 : Charger les instructions du module

| Module | Instructions à charger (outil Read) |
|---|---|
| Lecture | `modules/lecture/GENERATION.md` |
| Dictée | `modules/dictee/GENERATION.md` |
| Grammaire | `modules/grammaire/GENERATION.md` |
| Accords | `modules/accords/GENERATION.md` |

Charge le fichier correspondant avant de continuer : il contient le questionnaire, les
règles de génération, le format de sortie et les étapes de post-génération propres à ce
module. Suis-le à la lettre : ne pas improviser un format différent.

## Ajouter un nouveau module plus tard

1. Créer `modules/<nom-module>/GENERATION.md` en suivant le gabarit des modules existants.
   Deux gabarits selon la sortie : `lecture` et `dictee` pour du JSON importable
   (questionnaire → génération → format → post-génération), `grammaire` et `accords` pour
   du TypeScript (constructeurs → règles → périmètre → commande de vérification).
2. Ajouter une ligne dans le tableau de l'étape 1, dans la liste de l'étape 0, dans le
   tableau des formats de sortie ci-dessus, et dans la `description` du frontmatter, sans
   ce dernier point, le skill ne se déclenche pas sur une demande visant ce module.
3. Ne factoriser de la logique commune entre modules que si un vrai doublon apparaît sur
   3 modules ou plus : pas avant, pour éviter l'abstraction prématurée.
4. Pour un module dont le corpus est du code, ajouter aussi la commande qui joue ses
   invariants : c'est le seul filet contre une entrée fausse, et il doit être dans les
   instructions, pas dans la mémoire de celui qui génère.
