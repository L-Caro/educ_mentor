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
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">{String(d.enonce)}</p>
          <Blanc largeurMm={40} />
        </div>
      ),
      reponse: (d) => String(d.reponse),
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
