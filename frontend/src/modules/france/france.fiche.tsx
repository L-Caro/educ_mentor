import type { Fiche } from 'src/types/fiche.types';
import CarteIdentite from 'src/components/common/Fiche/CarteIdentite';
import type { FranceQuestion } from './france.type';

const IDEE: Record<string, string> = {
  departement: "Un département se retient d'un bloc : son numéro, sa préfecture, sa région, ses voisins. La même fiche répond à toutes les questions qui portent sur lui.",
  region: "Une région se retient par son chef-lieu et les départements qu'elle regroupe.",
};

export function franceFiche(question: FranceQuestion): Fiche | null {
  const carte = question.carte;
  if (!carte) return null;

  return {
    titre: carte.titre,
    idee: IDEE[carte.kind],
    exemple: <CarteIdentite titre={carte.titre} embleme={carte.numero} lignes={carte.lignes} />,
  };
}
