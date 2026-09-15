import store from 'src/store';
import { numerationApi } from './numeration.api';
import MaterielBase10 from './MaterielBase10';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './numeration.impression.scss';

export const numerationImpression: FournisseurImpression = {
  label: 'Numération',
  exercices: [
    {
      cle: 'question',
      label: 'Décomposer, le chiffre des dizaines…',
      enonce: (d) => {
        const rangs = (d.rangsNoms as string[] | undefined) ?? [];
        return (
          <div>
            {/* La consigne vient du SERVEUR, et elle est indispensable. A l'ecran, chaque
                type de question a son interface : des cases nommees par rang, une frise,
                deux nombres et un signe. Sur le papier il ne reste que l'enonce, et
                « 6 802 » suivi d'un trait ne demande rien du tout. */}
            {Boolean(d.consigne) && (
              <p className="Feuille__consigne">{String(d.consigne)}</p>
            )}
            <p>{String(d.enonce)}</p>
            {rangs.length > 0 ? (
              // Une case par rang, chacune sous son NOM : sans eux, l'enfant a trois
              // cases vides et rien qui dise laquelle recoit les dizaines. L'ordre est
              // celui du serveur, qui le melange expres pour qu'on ne recopie pas les
              // chiffres de gauche a droite.
              <span className="Numeration__rangs">
                {rangs.map((nom, index) => (
                  <span key={index} className="Numeration__rang">
                    <Blanc largeurMm={14} />
                    <span className="Numeration__rangNom">{nom}</span>
                  </span>
                ))}
              </span>
            ) : (
              <Blanc largeurMm={40} />
            )}
          </div>
        );
      },
      reponse: (d) => {
        const rangs = (d.rangsNoms as string[] | undefined) ?? [];
        const valeurs = String(d.reponse).split(':');
        if (rangs.length !== valeurs.length) return String(d.reponse);
        // « 8 centaines, 2 unites » plutot que « 8:2 » : le corrige se lit, il ne se
        // decode pas.
        return rangs
          .map((nom, index) => `${valeurs[index]} ${nom}`)
          .join(', ');
      },
    },
    {
      cle: 'cubes',
      label: 'Compter les cubes et les bâtons (matériel de classe)',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Combien y a-t-il ?</p>
          <MaterielBase10
            milliers={Number(d.milliers)}
            centaines={Number(d.centaines)}
            dizaines={Number(d.dizaines)}
            unites={Number(d.unites)}
          />
          <p>
            <Blanc largeurMm={26} />
          </p>
        </div>
      ),
      reponse: (d) => String(d.reponse),
    },
    {
      cle: 'ranger',
      label: 'Ranger cinq nombres dans l’ordre croissant',
      enonce: (d) => {
        const nombres = d.nombres as number[];
        return (
          <div>
            <p className="Feuille__consigne">Range du plus petit au plus grand.</p>
            <p>{nombres.join(' · ')}</p>
            <Blanc largeurMm={60} />
          </div>
        );
      },
      reponse: (d) => (d.reponse as number[]).join(' < '),
    },
    {
      cle: 'encadrer',
      label: 'Encadrer un nombre (entre deux dizaines, deux centaines)',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Encadre entre deux {Number(d.pas) === 100 ? 'centaines' : 'dizaines'}.
          </p>
          <span>
            <Blanc largeurMm={16} /> &lt; {String(d.valeur)} &lt;{' '}
            <Blanc largeurMm={16} />
          </span>
        </div>
      ),
      reponse: (d) => `${String(d.avant)} < ${String(d.valeur)} < ${String(d.apres)}`,
    },
    {
      cle: 'lettres',
      label: 'Écrire en lettres, ou en chiffres',
      enonce: (d) =>
        d.versLesLettres ? (
          <div>
            <p className="Feuille__consigne">Écris en lettres.</p>
            <span>
              {String(d.valeur)} : <Blanc largeurMm={55} />
            </span>
          </div>
        ) : (
          <div>
            <p className="Feuille__consigne">Écris en chiffres.</p>
            <span>
              {String(d.lettres)} : <Blanc largeurMm={22} />
            </span>
          </div>
        ),
      reponse: (d) =>
        d.versLesLettres ? String(d.lettres) : String(d.valeur),
    },
  ],
  options: [
    {
      cle: 'positions',
      label: 'Jusqu’où compter',
      type: 'multi',
      // Les positions OUVERTES seulement : une feuille ne doit pas aller plus loin que ce
      // que l'administration a ouvert.
      charger: async () => {
        const [catalogue, actives] = await Promise.all([
          store.dispatch(numerationApi.endpoints.getNumerationPositions.initiate(undefined)).unwrap(),
          store.dispatch(numerationApi.endpoints.getNumerationActivePositions.initiate(undefined)).unwrap(),
        ]);
        return catalogue
          .filter((position) => actives.includes(position.key))
          .map((position) => ({ valeur: position.key, label: position.label }));
      },
    },
  ],
};
