import store from 'src/store';
import { numerationApi } from './numeration.api';
import MaterielBase10 from './MaterielBase10';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './numeration.impression.scss';

interface EcritureProposee {
  texte: string;
  juste: boolean;
}

interface CollectionProposee {
  centaines: number;
  dizaines: number;
  unites: number;
  juste: boolean;
}

/** Les paliers des chiffres romains, avec l'alphabet qu'ils supposent connu. */
const PALIERS_ROMAINS = [
  { valeur: 39, label: 'Jusqu’à 39 (I, V, X)' },
  { valeur: 100, label: 'Jusqu’à 100 (I, V, X, L, C)' },
  { valeur: 1000, label: 'Jusqu’à 1 000 (I, V, X, L, C, D, M)' },
];

/** Les collections se designent par une lettre, pour que le corrige puisse dire
 * lesquelles barrer. */
const LETTRES_DES_COLLECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

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
        return rangs.map((nom, index) => `${valeurs[index]} ${nom}`).join(', ');
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
      cle: 'ecritures',
      label: 'Barrer les écritures qui ne correspondent pas aux briques',
      largeur: 'pleine',
      enonce: (d) => {
        const ecritures = d.ecritures as EcritureProposee[];
        return (
          <div>
            <p className="Feuille__consigne">
              Barre toutes les écritures qui ne correspondent pas à la
              collection de carrés représentée.
            </p>
            <MaterielBase10
              milliers={Number(d.milliers)}
              centaines={Number(d.centaines)}
              dizaines={Number(d.dizaines)}
              unites={Number(d.unites)}
            />
            {/* Chaque ecriture dans sa case : c'est ce qu'on barre, et une case laisse la
                place du trait. Des ecritures alignees en ligne se barrent les unes sur
                les autres. */}
            <span className="Numeration__ecritures">
              {ecritures.map((ecriture) => (
                <span key={ecriture.texte} className="Numeration__ecriture">
                  {ecriture.texte}
                </span>
              ))}
            </span>
          </div>
        );
      },
      reponse: (d) =>
        `À barrer : ${(d.ecritures as EcritureProposee[])
          .filter((ecriture) => !ecriture.juste)
          .map((ecriture) => ecriture.texte)
          .join(' ; ')}`,
    },
    {
      cle: 'collections',
      label:
        'Barrer les collections de briques qui ne correspondent pas à l’écriture',
      largeur: 'pleine',
      enonce: (d) => {
        const collections = d.collections as CollectionProposee[];
        return (
          <div>
            <p className="Feuille__consigne">
              Barre toutes les collections de carrés qui ne correspondent pas à
              l’écriture.
            </p>
            <p className="Numeration__ecriture Numeration__ecriture--cible">
              {String(d.ecriture)}
            </p>
            <div className="Numeration__collections">
              {collections.map((collection, index) => (
                <span key={index} className="Numeration__collection">
                  <span className="Numeration__collectionLettre">
                    {LETTRES_DES_COLLECTIONS[index]}
                  </span>
                  <MaterielBase10
                    milliers={0}
                    centaines={collection.centaines}
                    dizaines={collection.dizaines}
                    unites={collection.unites}
                  />
                </span>
              ))}
            </div>
          </div>
        );
      },
      reponse: (d) =>
        `À barrer : ${(d.collections as CollectionProposee[])
          .map((collection, index) => ({ collection, index }))
          .filter(({ collection }) => !collection.juste)
          .map(({ index }) => LETTRES_DES_COLLECTIONS[index])
          .join(', ')}`,
    },
    {
      cle: 'romains_lecture',
      label: 'Lire un nombre en chiffres romains',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Écris en chiffres.</p>
          <span>
            {String(d.romain)} : <Blanc largeurMm={22} />
          </span>
        </div>
      ),
      reponse: (d) => String(d.valeur),
    },
    {
      cle: 'romains_ecriture',
      label: 'Écrire un nombre en chiffres romains',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Écris en chiffres romains.</p>
          <span>
            {String(d.valeur)} : <Blanc largeurMm={40} />
          </span>
        </div>
      ),
      // « IV ou IIII » : celui qui ecrit IIII, comme sur un cadran, n'a pas fait de faute.
      reponse: (d) => (d.reponses as string[]).join(' ou '),
    },
    {
      cle: 'romains_ranger',
      label: 'Ranger cinq nombres en chiffres romains',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Range du plus petit au plus grand.
          </p>
          <p>{(d.romains as string[]).join(' · ')}</p>
          <Blanc largeurMm={60} />
        </div>
      ),
      reponse: (d) => (d.reponse as string[]).join(' < '),
    },
    {
      cle: 'romains_barrer',
      label: 'Barrer les écritures romaines qui ne correspondent pas au nombre',
      largeur: 'pleine',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Barre toutes les écritures en chiffres romains qui ne correspondent
            pas à ce nombre.
          </p>
          <p className="Numeration__ecriture Numeration__ecriture--cible">
            {String(d.valeur)}
          </p>
          <span className="Numeration__ecritures">
            {(d.ecritures as EcritureProposee[]).map((ecriture) => (
              <span key={ecriture.texte} className="Numeration__ecriture">
                {ecriture.texte}
              </span>
            ))}
          </span>
        </div>
      ),
      reponse: (d) =>
        `À barrer : ${(d.ecritures as EcritureProposee[])
          .filter((ecriture) => !ecriture.juste)
          .map((ecriture) => ecriture.texte)
          .join(' ; ')}`,
    },
    {
      cle: 'ranger',
      label: 'Ranger cinq nombres dans l’ordre croissant',
      enonce: (d) => {
        const nombres = d.nombres as number[];
        return (
          <div>
            <p className="Feuille__consigne">
              Range du plus petit au plus grand.
            </p>
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
            Encadre entre deux{' '}
            {Number(d.pas) === 100 ? 'centaines' : 'dizaines'}.
          </p>
          <span>
            <Blanc largeurMm={16} /> &lt; {String(d.valeur)} &lt;{' '}
            <Blanc largeurMm={16} />
          </span>
        </div>
      ),
      reponse: (d) =>
        `${String(d.avant)} < ${String(d.valeur)} < ${String(d.apres)}`,
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
      reponse: (d) => (d.versLesLettres ? String(d.lettres) : String(d.valeur)),
    },
  ],
  options: [
    {
      cle: 'palier',
      label: 'Chiffres romains : jusqu’où',
      type: 'unique',
      pour: [
        'romains_lecture',
        'romains_ecriture',
        'romains_ranger',
        'romains_barrer',
      ],
      // Ce que l'administration a ouvert, et rien de plus : un palier plus haut
      // contournerait le reglage, et ferait apparaitre des signes que la classe n'a pas
      // vus. Rien de coche = le plus haut ouvert.
      charger: async () => {
        const { palier: ouvert } = await store
          .dispatch(
            numerationApi.endpoints.getNumerationPalierRomain.initiate(
              undefined,
            ),
          )
          .unwrap();
        return PALIERS_ROMAINS.filter(({ valeur }) => valeur <= ouvert).map(
          ({ valeur, label }) => ({ valeur: String(valeur), label }),
        );
      },
    },
    {
      cle: 'positions',
      label: 'Jusqu’où compter',
      type: 'multi',
      // Les positions OUVERTES seulement : une feuille ne doit pas aller plus loin que ce
      // que l'administration a ouvert.
      charger: async () => {
        const [catalogue, actives] = await Promise.all([
          store
            .dispatch(
              numerationApi.endpoints.getNumerationPositions.initiate(
                undefined,
              ),
            )
            .unwrap(),
          store
            .dispatch(
              numerationApi.endpoints.getNumerationActivePositions.initiate(
                undefined,
              ),
            )
            .unwrap(),
        ]);
        return catalogue
          .filter((position) => actives.includes(position.key))
          .map((position) => ({ valeur: position.key, label: position.label }));
      },
    },
  ],
};
