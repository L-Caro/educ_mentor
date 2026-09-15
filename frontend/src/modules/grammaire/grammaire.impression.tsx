import store from 'src/store';
import { grammaireApi } from './grammaire.api';
import Phrase from './PhraseImprimee';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import type { MotImprime } from './PhraseImprimee';

/**
 * La grammaire est le module qui gagne le plus au papier.
 *
 * Ses questions de selection, « touche les verbes » a l'ecran, redeviennent ce qu'elles
 * sont a l'origine : « souligne les verbes ». C'est l'exercice scolaire classique, et il
 * se fait mieux au crayon qu'au doigt. La consigne du module est deja redigee, on la
 * reprend telle quelle.
 *
 * Seule la question de nature demande un blanc : elle attend un mot ecrit, pas un trait.
 */
export const grammaireImpression: FournisseurImpression = {
  label: 'Grammaire',
  exercices: [
    {
      cle: 'analyse',
      label: 'Nature des mots, sujet, groupe nominal (souligner ou écrire)',
      enonce: (donnees) => {
        const mots = donnees.mots as MotImprime[];
        const cible = donnees.cible as number | null;
        return (
          <div>
            <p className="Feuille__consigne">{String(donnees.consigne)}</p>
            <Phrase mots={mots} cible={cible} />
            {cible !== null && (
              <span>
                {' '}
                <Blanc largeurMm={30} />
              </span>
            )}
          </div>
        );
      },
      reponse: (donnees) => String(donnees.reponse),
    },
  ],
  options: [
    {
      cle: 'types',
      label: 'Quelles notions',
      type: 'multi',
      // Seulement les notions OUVERTES : imprimer une notion fermee contournerait le
      // reglage d'administration, exactement comme le ferait le peage.
      charger: async () => {
        const [catalogue, actives] = await Promise.all([
          store.dispatch(grammaireApi.endpoints.getGrammaireNotions.initiate(undefined)).unwrap(),
          store.dispatch(grammaireApi.endpoints.getGrammaireActiveNotions.initiate(undefined)).unwrap(),
        ]);
        return catalogue
          .filter((notion) => actives.includes(notion.key))
          .map((notion) => ({ valeur: notion.key, label: notion.label }));
      },
    },
  ],
};
