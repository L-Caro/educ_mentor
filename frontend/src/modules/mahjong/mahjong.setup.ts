import type { SetupOption } from 'src/types/game.types.ts';
import { FORMES } from './formes';

// 34 faces distinctes disponibles (voir tuiles.ts) : au plus 34 paires avec un exemplaire
// double par face, pour Facile et Moyen.
//
// Le mode Difficile (plateau en tourelle) n'utilise PAS `pairs_count` : ses dispositions
// classiques ont une taille fixe (144 tuiles), il lit `forme` a la place. Les deux options
// restent affichees ensemble quel que soit le mode choisi : le pre-jeu commun ne sait pas
// masquer une option selon la valeur d'une autre (voir MahjongDifficile.tsx et
// MahjongFacile.tsx/MahjongMoyen.tsx, qui ne lisent chacun que ce qui les concerne).
export const MAHJONG_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'difficulty',
    type: 'single',
    label: 'Difficulté',
    choices: [
      { value: 'facile', label: 'Facile' },
      { value: 'moyen', label: 'Moyen' },
      { value: 'difficile', label: 'Difficile' },
    ],
  },
  {
    key: 'pairs_count',
    type: 'single',
    label: 'Nombre de paires (Facile / Moyen)',
    choices: [
      { value: '4', label: '4 paires' },
      { value: '6', label: '6 paires' },
      { value: '8', label: '8 paires' },
      { value: '10', label: '10 paires' },
      { value: '12', label: '12 paires' },
      { value: '15', label: '15 paires' },
      { value: '18', label: '18 paires' },
      { value: '24', label: '24 paires' },
      { value: '30', label: '30 paires' },
      { value: '34', label: '34 paires' },
    ],
  },
  {
    key: 'forme',
    type: 'single',
    label: 'Disposition (Difficile)',
    choices: FORMES.map((forme) => ({ value: forme.id, label: forme.name })),
  },
];
