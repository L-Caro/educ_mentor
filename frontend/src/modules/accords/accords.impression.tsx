import store from 'src/store';
import { accordsApi } from './accords.api';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';

/**
 * Un accord a completer.
 *
 * L'enonce du module est deja construit pour le jeu : une consigne, un point de depart
 * eventuel, ce qui precede le trou, ce qui le suit, et l'indication entre parentheses.
 * On l'imprime tel quel, avec un blanc a la place du champ de saisie. Le papier dit alors
 * exactement ce que dit l'ecran, ce qui evite qu'elle apprenne deux formulations pour la
 * meme regle.
 */
export const accordsImpression: FournisseurImpression = {
  label: 'Les accords',
  exercices: [
    {
      cle: 'accord',
      label:
        'Accords (genre, nombre, adjectif, groupe nominal, sujet et verbe)',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">{String(donnees.consigne)}</p>
          <span>
            {donnees.depart ? `${String(donnees.depart)} → ` : ''}
            {String(donnees.avant)}
            <Blanc largeurMm={26} />
            {String(donnees.apres)}
            {donnees.indice ? ` (${String(donnees.indice)})` : ''}
          </span>
        </div>
      ),
      reponse: (donnees) => String(donnees.reponse),
    },
    {
      cle: 'pluriel',
      label: 'Mettre un groupe nominal au pluriel (ou au singulier)',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">{String(donnees.consigne)}</p>
          {/* Le blanc sur SA ligne, jamais a la suite du groupe : un groupe nominal de
              trois mots suffit a faire passer le blanc a la ligne, et une feuille ou la
              moitie des reponses est en ligne et l'autre en dessous se lit comme une
              erreur de mise en page. */}
          <p>{String(donnees.depart)} &rarr;</p>
          <p>
            <Blanc largeurMm={44} />
          </p>
        </div>
      ),
      reponse: (donnees) => String(donnees.reponse),
    },
    {
      // Le pendant de l'operation posee fausse : au lieu de produire la bonne forme, on
      // relit une forme donnee pour y trouver la faute. C'est le geste de la relecture,
      // que l'ecran ne demande jamais.
      cle: 'corriger',
      label: 'Trouver et corriger la faute d’accord',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">Corrige la faute d’accord.</p>
          <p>{String(donnees.fautif)} &rarr;</p>
          <p>
            <Blanc largeurMm={44} />
          </p>
        </div>
      ),
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
          store
            .dispatch(
              accordsApi.endpoints.getAccordsNotions.initiate(undefined),
            )
            .unwrap(),
          store
            .dispatch(
              accordsApi.endpoints.getAccordsActiveNotions.initiate(undefined),
            )
            .unwrap(),
        ]);
        return catalogue
          .filter((notion) => actives.includes(notion.key))
          .map((notion) => ({ valeur: notion.key, label: notion.label }));
      },
    },
  ],
};
