import type { TuileFace } from './mahjong.types';
import { construireFaces } from './tuiles';

export interface TuileJeu {
  id: string;
  face: TuileFace;
}

const NOMBRE_DE_FACES = construireFaces().length;
export const PAIRES_PAR_DEFAUT = 12;

function melanger<T>(valeurs: T[]): T[] {
  const melange = [...valeurs];
  for (let index = melange.length - 1; index > 0; index--) {
    const indexTire = Math.floor(Math.random() * (index + 1));
    [melange[index], melange[indexTire]] = [melange[indexTire], melange[index]];
  }
  return melange;
}

/**
 * Tire `nombrePaires` faces distinctes parmi les 34 et les double, melangees : le plateau
 * de depart d'une partie. Le Mahjong reel dispose de 4 exemplaires par face (136 tuiles),
 * mais une partie de paires n'en a besoin que de 2 : le tirage reste simple, et jusqu'a 34
 * paires est deja largement suffisant pour un jeu enfant.
 */
export function tirerPaires(nombrePaires: number): TuileJeu[] {
  if (nombrePaires < 1 || nombrePaires > NOMBRE_DE_FACES) {
    throw new Error(`nombrePaires doit etre compris entre 1 et ${NOMBRE_DE_FACES}`);
  }
  const facesChoisies = melanger(construireFaces()).slice(0, nombrePaires);
  const tuiles = facesChoisies.flatMap((face, index) => [
    { id: `${index}-a`, face },
    { id: `${index}-b`, face },
  ]);
  return melanger(tuiles);
}

/**
 * Lit le nombre de paires choisi en pre-jeu. Une valeur absente, invalide ou hors bornes
 * (reglage corrompu, ancien lien partage) retombe sur la valeur par defaut plutot que de
 * faire planter `tirerPaires`.
 */
export function pairesCountDepuisSetup(valeurBrute: string | undefined): number {
  const nombre = parseInt(valeurBrute ?? '', 10);
  if (Number.isNaN(nombre) || nombre < 1 || nombre > NOMBRE_DE_FACES) return PAIRES_PAR_DEFAUT;
  return nombre;
}

/**
 * Tente d'apparier deux tuiles du plateau. `peuventFormerPaire` isole la seule regle qui
 * change d'un mode a l'autre (Facile : aucune contrainte, Moyen : un chemin a au plus deux
 * coudes, Difficile : tuile libre) ; ce moteur gere la selection et le retrait, commun aux
 * trois modes. Ne modifie rien si le pari echoue.
 */
export function tenterAppariement(
  tuiles: TuileJeu[],
  idA: string,
  idB: string,
  peuventFormerPaire: (tuileA: TuileJeu, tuileB: TuileJeu) => boolean,
): { reussi: boolean; tuiles: TuileJeu[] } {
  if (idA === idB) return { reussi: false, tuiles };
  const tuileA = tuiles.find((tuile) => tuile.id === idA);
  const tuileB = tuiles.find((tuile) => tuile.id === idB);
  if (!tuileA || !tuileB || !peuventFormerPaire(tuileA, tuileB)) {
    return { reussi: false, tuiles };
  }
  return { reussi: true, tuiles: tuiles.filter((tuile) => tuile.id !== idA && tuile.id !== idB) };
}
