import store from 'src/store';
import { lectureApi } from './lecture.api';
import { TrameSeyes } from 'src/impression/trames';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './lecture.impression.scss';

export const lectureImpression: FournisseurImpression = {
  label: 'Lecture',
  exercices: [
    {
      cle: 'texte',
      label: 'Un texte et ses questions',
      // Pleine largeur, mais pas pleine page : un texte coupe en deux colonnes se lit mal
      // a sept ans, et les questions qui suivent doivent rester sous les yeux.
      largeur: 'pleine',
      enonce: (d) => (
        <div className="Lecture">
          <p className="Lecture__titre">{String(d.titre)}</p>
          <p className="Lecture__texte">{String(d.contenu)}</p>
          <ol className="Lecture__questions">
            {(d.questions as string[]).map((question, i) => (
              <li key={i}>
                <p className="Feuille__consigne">{question}</p>
                {/* Une ligne d'ecriture, pas un simple blanc : la reponse est une
                    phrase, et une phrase a besoin d'une reglure pour tenir droit. */}
                <TrameSeyes />
              </li>
            ))}
          </ol>
        </div>
      ),
      reponse: (d) => (
        <span>
          {(d.reponses as string[])
            .map((reponse, i) => `${String(i + 1)}. ${reponse}`)
            .join(' — ')}
        </span>
      ),
    },
  ],
  options: [
    {
      cle: 'texte',
      label: 'Quel texte',
      type: 'unique',
      // Les textes ACTIFS seulement : imprimer un texte ferme contournerait le seul
      // reglage qui decide de ce que l'enfant lit. Le serveur le verifie aussi.
      charger: async () => {
        const textes = await store
          .dispatch(lectureApi.endpoints.getActiveTexts.initiate(undefined))
          .unwrap();
        return textes.map((texte) => ({
          valeur: String(texte.id),
          label: texte.titre,
        }));
      },
      defaut: '',
    },
  ],
};
