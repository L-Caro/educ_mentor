import Portee, { type Symbole } from './Portee';
import { LARGEUR_FA, LARGEUR_SOL } from './clefs';
import './systeme.scss';

/**
 * Deux portées jointes, lues comme une seule ligne.
 *
 * C'est le système de sa méthode : une clé de sol en haut, une clé de fa en bas, et une
 * suite de notes qui passe de l'une à l'autre sans interruption. On ne lit pas d'abord le
 * haut puis le bas : on lit de GAUCHE À DROITE, en changeant de portée quand la suite y
 * passe. C'est ce qui rend l'exercice difficile, et c'est tout son objet.
 *
 * Les deux portées partagent donc leurs EMPLACEMENTS : la troisième note tombe au même
 * endroit en haut et en bas, qu'elle soit écrite sur l'une ou sur l'autre. D'où la largeur
 * de clé imposée aux deux, alors que leurs dessins n'ont pas la même largeur.
 */

/** La place réservée à la clé, la plus large des deux, plus une respiration. */
const LARGEUR_CLE = Math.max(LARGEUR_SOL, LARGEUR_FA) + 10;

interface Props {
  /** Les notes du haut et du bas, chacune portant son emplacement dans la suite. */
  haut: Symbole[];
  bas: Symbole[];
  emplacements: number;
  espace?: number;
  /** Les groupes liés, par emplacement. Ils vont sur la portée qui porte le groupe. */
  liaisonsHaut?: [number, number][];
  liaisonsBas?: [number, number][];
}

export default function Systeme({
  haut,
  bas,
  emplacements,
  espace = 40,
  liaisonsHaut = [],
  liaisonsBas = [],
}: Props) {
  return (
    <div className="Systeme">
      {/* L'accolade : elle dit que les deux portées se lisent ensemble. Sans elle, ce
          sont deux exercices l'un sous l'autre. */}
      <svg
        className="Systeme__accolade"
        viewBox="0 0 10 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Le trait de système, droit, et l'accolade qui s'y appuie. Dessinée sur toute
            la largeur du cadre : étirée à quelques pixels, une courbe discrète redevient
            une ligne droite et ne dit plus que les deux portées se lisent ensemble. */}
        <line x1="9" y1="1" x2="9" y2="99" />
        <path d="M 9 1 C 1 16 9 38 2 50 C 9 62 1 84 9 99" />
      </svg>

      <div className="Systeme__portees">
        <Portee
          cle="sol"
          symboles={haut}
          emplacements={emplacements}
          espace={espace}
          largeurCle={LARGEUR_CLE}
          liaisons={liaisonsHaut}
        />
        <Portee
          cle="fa"
          symboles={bas}
          emplacements={emplacements}
          espace={espace}
          largeurCle={LARGEUR_CLE}
          liaisons={liaisonsBas}
        />
      </div>
    </div>
  );
}
