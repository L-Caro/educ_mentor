import store from 'src/store';
import { calculApi } from './calcul.api';
import { File, Operation, Trous, VraiFaux } from './CalculImprime';
import './calcul.impression.scss';
import type { FournisseurImpression } from 'src/impression/impression.types';

export const calculImpression: FournisseurImpression = {
  label: 'Calcul mental',
  exercices: [
    {
      cle: 'operation',
      label: 'Opération simple (24 + 17 = …)',
      // L'enonce du module est deja une phrase prete : « 24 + 17 », « 37 pour aller a
      // 100 ». On l'imprime tel quel plutot que de le reconstruire, pour que le papier
      // dise exactement ce que dit l'ecran.
      enonce: (d) => <Operation d={d} />,
      // Meme retrait que dans l'enonce : « Moitie de 20 = ? = 10 » se lit deux fois avant
      // qu'on voie qu'il n'y a qu'une question.
      // Le corrige remet la reponse LA OU la question la demandait : « 8 + 21 = 29 » se
      // relit, « 8 + ? = 29 = 21 » se dechiffre.
      reponse: (d) => {
        const enonce = String(d.operation).replace(/ - /g, ' \u2212 ');
        if (/\s*=\s*\?\s*$/.test(enonce)) {
          return `${enonce.replace(/\s*=\s*\?\s*$/, '')} = ${String(d.reponse)}`;
        }
        return enonce.includes('?')
          ? enonce.replace('?', String(d.reponse))
          : `${enonce} = ${String(d.reponse)}`;
      },
    },
    {
      cle: 'vrai_faux',
      label: 'Vrai ou faux : 7 × 8 = 54',
      enonce: (d) => <VraiFaux d={d} />,
      reponse: (d) => (d.vrai ? 'vrai' : `faux, c'était ${String(d.reponse)}`),
    },
    {
      cle: 'trous',
      label: 'Opération à trou : 24 + … = 41',
      enonce: (d) => <Trous d={d} />,
      reponse: (d) => String(d.reponse),
    },
    {
      cle: 'file',
      label: 'File de calculs : 12 → +5 → ×2 → …',
      enonce: (d) => <File d={d} />,
      reponse: (d) => String(d.reponse),
    },
  ],
  options: [
    {
      cle: 'types',
      label: 'Quelles opérations',
      type: 'multi',
      // Les types OUVERTS, pas le catalogue complet : imprimer une operation fermee
      // contournerait le seul reglage qui decide de ce que l'enfant voit.
      charger: async () => {
        const types = await store
          .dispatch(calculApi.endpoints.getCalculTypes.initiate(undefined))
          .unwrap();
        return types.map((type) => ({ valeur: type.key, label: type.label }));
      },
    },
  ],
};
