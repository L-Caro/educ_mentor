import Posee from './PoseeImprimee';
import { SIGNE } from './pose.signes';
import type { FournisseurImpression } from 'src/impression/impression.types';

export const poseImpression: FournisseurImpression = {
  label: 'Calcul posé',
  exercices: [
    {
      cle: 'operation',
      label: 'Opérations posées (addition, soustraction, multiplication)',
      enonce: (donnees) => <Posee donnees={donnees} />,
      reponse: (donnees) => {
        const operandes = donnees.operandes as number[];
        return `${operandes.join(` ${SIGNE[donnees.operation as string]} `)} = ${String(donnees.reponse)}`;
      },
    },
    {
      cle: 'erreur',
      label: 'Trouver l\u2019erreur dans une opération déjà posée',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">Cette opération est fausse. Corrige-la.</p>
          <Posee donnees={donnees} resultat={donnees.faux as number} />
        </div>
      ),
      reponse: (donnees) =>
        `${String(donnees.faux)} au lieu de ${String(donnees.reponse)}`,
    },
  ],
};
