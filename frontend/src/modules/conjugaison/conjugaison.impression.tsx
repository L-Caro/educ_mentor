import store from 'src/store';
import { conjugaisonApi } from './conjugaison.api';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';

interface LigneConjugaison {
  pronom: string;
  reponse: string;
}

/**
 * La conjugaison sur le papier.
 *
 * De une a six formes, au choix. Lionel a trouve le tableau complet trop gros pour une
 * feuille melangee, et il a raison : six lignes occupent un quart de colonne. A une seule
 * forme, l'exercice tient sur une ligne et se mele aux calculs sans peser.
 *
 * Quand on en demande moins de six, ce ne sont pas les premieres du tableau qui sortent
 * mais les plus INSTRUCTIVES (je, nous, ils) : `je`, `tu` et `il` se ressemblent trop pour
 * apprendre quoi que ce soit. Le choix se fait cote serveur, l'ordre d'affichage reste
 * celui du tableau.
 */
export const conjugaisonImpression: FournisseurImpression = {
  label: 'Conjugaison',
  exercices: [
    {
      cle: 'forme',
      label: 'Conjuguer un verbe (1 à 6 formes, au choix)',
      enonce: (donnees) => {
        const lignes = donnees.lignes as LigneConjugaison[];
        return (
          <div>
            <p className="Feuille__consigne">
              Conjugue « {String(donnees.infinitif)} » au {String(donnees.temps)}.
            </p>
            <table className="Conjugaison">
              <tbody>
                {lignes.map((ligne) => (
                  <tr key={ligne.pronom}>
                    <td className="Conjugaison__pronom">{ligne.pronom}</td>
                    <td>
                      <Blanc largeurMm={30} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },
      reponse: (donnees) => {
        const lignes = donnees.lignes as LigneConjugaison[];
        return `${String(donnees.infinitif)} (${String(donnees.temps)}) : ${lignes
          .map((l) => `${l.pronom} ${l.reponse}`)
          .join(', ')}`;
      },
    },
  ],
  options: [
    {
      cle: 'formes',
      label: 'Combien de formes',
      type: 'nombre',
      min: 1,
      max: 6,
      defaut: 1,
    },
    {
      cle: 'verbes',
      label: 'Quels verbes',
      type: 'multi',
      charger: async () => {
        const verbes = await store
          .dispatch(conjugaisonApi.endpoints.getConjugaisonVerbs.initiate(undefined))
          .unwrap();
        return verbes.map((v) => ({ valeur: v.infinitif, label: v.infinitif }));
      },
    },
    {
      cle: 'tenses',
      label: 'Quels temps',
      type: 'multi',
      charger: async () => {
        const temps = await store
          .dispatch(conjugaisonApi.endpoints.getConjugaisonTemps.initiate(undefined))
          .unwrap();
        return temps.map((t) => ({ valeur: t.key, label: t.label }));
      },
    },
  ],
};
