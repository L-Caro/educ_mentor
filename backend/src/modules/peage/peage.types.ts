/** Une question de péage, RÉDUITE à ce qui peut être posé avant une partie.
 *
 * Chaque module a sa propre forme de question : un cadran à lire, des pièces à compter,
 * une carte à cliquer, une grille d'opération posée. Aucune ne se ressemble, et c'est
 * heureux : c'est ce qui fait qu'ils enseignent des choses différentes.
 *
 * Le péage ne peut donc pas les accueillir toutes. Il n'accueille que celles qui tiennent
 * en une consigne, un énoncé et quelques boutons : ce qui écarte la géographie (une
 * carte), la monnaie et l'heure (un dessin), la dictée (de l'audio et un adulte), la
 * lecture (un texte entier) et le calcul posé (une grille). Restent cinq modules, et ce
 * n'est pas une limite technique : demander de placer Lyon sur une carte pour avoir le
 * droit de jouer au morpion serait absurde.
 *
 * Toujours un QCM, jamais de saisie libre : un péage doit se franchir d'une touche. Elle
 * est venue pour jouer, pas pour taper au clavier.
 */
export interface PeageQuestion {
  module_id: string;
  /** Le nom du module, pour que l'enfant sache d'où sort la question. */
  module_nom: string;
  consigne: string;
  enonce: string;
  choix: string[];
  reponse: string;
}

/** Les cinq modules qui savent poser une question de péage, et leur nom affiché. */
// Les identifiants sont ceux du CATALOGUE (`modules.config.ts`), pas ceux des dossiers :
// c'est sur eux que porte l'activation. `calcul-mental` en est l'exemple : le dossier
// s'appelle `calcul`, et écrire `calcul` ici rendait ce module invisible au péage sans
// que rien n'échoue. Un test de bout en bout l'a attrapé.
export const MODULES_DE_PEAGE: { id: string; nom: string }[] = [
  { id: 'tables', nom: 'Tables de multiplication' },
  { id: 'calcul-mental', nom: 'Calcul mental' },
  { id: 'conjugaison', nom: 'Conjugaison' },
  { id: 'grammaire', nom: 'Grammaire' },
  { id: 'accords', nom: 'Les accords' },
];

/** Le réglage général : combien de questions avant de jouer. `0` éteint le péage. */
export const CLE_NOMBRE_QUESTIONS = 'jeux_peage_questions';

/** Au-delà, ce n'est plus un péage, c'est une séance de travail déguisée en jeu. */
export const MAXIMUM_QUESTIONS = 5;
