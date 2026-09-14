import type { SetupOption } from 'src/types/game.types.ts';
import { FORMES } from './formes';

/**
 * Une seule question avant de jouer : la disposition.
 *
 * Le module a eu trois modes (Facile, Moyen, Difficile) et un choix du nombre de paires.
 * Les deux ont ete retires : le vrai Mahjong Solitaire, c'est le plateau en volume, et
 * les deux autres modes n'etaient qu'un jeu de paires deguise. Le nombre de paires n'a
 * plus de sens non plus - une disposition classique fait 144 tuiles, c'est sa definition.
 *
 * Reste la disposition, qui change la forme du plateau et sa difficulte reelle : la
 * Forteresse et le Pont sont les plus ouverts, la Tortue et le Chat les plus fermes.
 */
export const MAHJONG_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'forme',
    type: 'single',
    label: 'Quelle disposition ?',
    choices: FORMES.map((forme) => ({ value: forme.id, label: forme.name })),
  },
];
