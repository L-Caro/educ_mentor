# Module Lecture — génération

Génère le contenu du module de compréhension de lecture d'educ_mentor : un texte et des
questions à choix multiples, au format JSON importable dans l'admin. Le module ne génère
rien à l'exécution : tout le contenu est écrit ici, relu par Lionel, puis importé.

## Étape 1 — Questionnaire interactif

Avant toute génération, pose ces questions à Lionel (une seule salve, pas une par une).
Utilise l'outil de question fermé si disponible. Sinon, pose-les en Markdown avec des
options numérotées.

### Questions obligatoires

| # | Paramètre | Options / format attendu |
|---|-----------|--------------------------|
| 1 | **Niveau scolaire** | CP · CE1 · CE2 · CM1 · CM2 |
| 2 | **Sujet / thème** | Texte libre (ex. : "les volcans", "Icare", "les fourmis") |
| 3 | **Nombre de mots du texte** | ~200 · ~400 · ~600 · ~800 · personnalisé |
| 4 | **Nombre de questions** | 5 · 6 · 8 · 10 · personnalisé |
| 5 | **Ton du texte** | Neutre/informatif · Narratif/conte · Légèrement dramatique · Poétique |

### Questions optionnelles (proposer avec valeur par défaut)

| # | Paramètre | Défaut |
|---|-----------|--------|
| 6 | **Nombre de distracteurs par question** | 5 |
| 7 | **Langue du module** | Français |
| 8 | **Contraintes particulières** | Aucune (ex. : "éviter les mots difficiles", "inclure des chiffres") |

## Étape 2 — Confirmation avant génération

Après le questionnaire, affiche un récapitulatif compact :

```
📋 Récapitulatif
─────────────────────────────
Niveau     : CE1 (7 ans)
Sujet      : Icare
Mots       : ~400
Questions  : 8
Ton        : Neutre/informatif
Distracteurs : 5 par question
Langue     : Français
─────────────────────────────
✅ Je lance la génération ?
```

Attends confirmation avant de passer à l'étape 3.

## Étape 3 — Contraintes de génération à respecter

Utilise les paramètres collectés pour produire le JSON. Règles à appliquer :

- Texte adapté au niveau [NIVEAU] ([ÂGE] ans) : simple mais pas infantilisant
- Ton : [TON]
- Longueur du `contenu` : [NB_MOTS] mots (±10 %)
- Nombre de questions : [NB_QUESTIONS]
- Nombre de distracteurs par question : [NB_DISTRACTEURS]
- [CONTRAINTES_OPTIONNELLES si renseignées]
- Le `titre` fait 5 mots maximum
- Chaque question porte sur un fait différent du texte
- Les distracteurs sont du même type grammatical que la bonne réponse
- L'`excerpt` est une phrase **complète** copiée **mot pour mot** depuis le `contenu`
- Les réponses et distracteurs font 1 à 5 mots maximum

### Table de correspondance niveau → âge

| Niveau | Âge |
|--------|-----|
| CP     | 6 ans |
| CE1    | 7 ans |
| CE2    | 8 ans |
| CM1    | 9 ans |
| CM2    | 10 ans |

## Étape 4 — Génération directe dans le chat

À partir des paramètres collectés, génère toi-même le JSON directement dans ta réponse.
Pas d'appel API, pas de code à exécuter — tu es le modèle, tu produis le contenu.

Respecte scrupuleusement la structure suivante, en substituant les valeurs collectées :

```json
{
  "titre": "...",
  "contenu": "...",
  "questions": [
    {
      "question": "...",
      "answer": "...",
      "distractors": ["...", "...", "..."],
      "excerpt": "..."
    }
  ]
}
```

Le contenu doit avoir une structure aérée mais pas trop, comme si c'était un texte de
livre classique.

**Ne génère que le bloc JSON**, dans un bloc que l'on peut copier, sans texte avant ni après.

## Étape 5 — Post-génération

Après affichage du JSON, propose systématiquement :

```
✅ Module généré.

Que veux-tu faire ?
  [A] Générer un autre module (même paramètres, sujet différent)
  [B] Modifier les paramètres et regénérer
  [C] Exporter en fichier .json
  [D] Rien, c'est parfait
```

## Règles de qualité à vérifier avant de livrer

- [ ] Le `titre` fait 5 mots maximum
- [ ] Le `contenu` respecte approximativement le nombre de mots demandé (±10 %)
- [ ] Chaque `excerpt` est une phrase **complète** et **identique** à une phrase du `contenu`
- [ ] Les `distractors` sont du même type grammatical que `answer`
- [ ] Aucune question n'est ambiguë ou hors-texte
- [ ] Le nombre de questions correspond exactement à ce qui a été demandé

Si l'une de ces règles n'est pas respectée dans le JSON retourné, signale-le à Lionel et
propose de régénérer.
