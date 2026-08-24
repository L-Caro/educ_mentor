import type { Fiche } from 'src/types/fiche.types';
import CarteIdentite from 'src/components/common/Fiche/CarteIdentite';
import type { GeoQuestion } from './geo.type';

/** Ce que la fiche apprend à faire, selon ce que la question demandait. */
const IDEE: Record<string, string> = {
  pays: "En géographie, on n'applique pas de règle, on connaît. Retiens la carte du pays, elle répond aussi aux questions suivantes.",
  continent: "Un continent se retient par ce qu'il contient : ses pays, les océans qui le bordent.",
};

export function geoFiche(question: GeoQuestion): Fiche | null {
  const carte = question.carte;
  if (!carte) return null;

  return {
    titre: carte.titre,
    idee: IDEE[carte.kind],
    exemple: (
      <CarteIdentite titre={carte.titre} embleme={carte.drapeau} lignes={carte.lignes} />
    ),
  };
}
