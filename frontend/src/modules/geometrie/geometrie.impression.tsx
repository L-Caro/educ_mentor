import FigureImprimee from './FigureImprimee';
import { TrameCarreaux } from 'src/impression/trames';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './geometrie.impression.scss';

const NOMS: Record<string, string> = {
  carre: 'un carré',
  rectangle: 'un rectangle',
  triangleRectangle: 'un triangle rectangle',
};

export const geometrieImpression: FournisseurImpression = {
  label: 'Géométrie',
  exercices: [
    {
      cle: 'nommer',
      label: 'Nommer une figure ou un solide',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Quel est le nom de cette figure ?</p>
          <FigureImprimee forme={String(d.figure)} />
          <p>
            <Blanc largeurMm={34} />
          </p>
        </div>
      ),
      reponse: (d) => String(d.reponse),
    },
    {
      cle: 'cotes_sommets',
      label: 'Compter les côtés et les sommets',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">{String(d.consigne)}</p>
          <FigureImprimee forme={String(d.figure)} />
          <p>
            <Blanc largeurMm={20} />
          </p>
        </div>
      ),
      reponse: (d) => String(d.reponse),
    },
    {
      cle: 'angle_droit',
      label: 'Repérer un angle droit',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">{String(d.consigne)}</p>
          <FigureImprimee forme={String(d.figure)} />
          <p>
            <Blanc largeurMm={20} />
          </p>
        </div>
      ),
      reponse: (d) => String(d.reponse),
    },
    {
      cle: 'proprietes',
      label: 'Comparer deux figures',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">{String(d.consigne)}</p>
          <span className="Geometrie__paire">
            <FigureImprimee forme={String(d.figure)} />
            {d.figureB ? <FigureImprimee forme={String(d.figureB)} /> : null}
          </span>
          <p>
            <Blanc largeurMm={34} />
          </p>
        </div>
      ),
      reponse: (d) => String(d.reponse),
    },
    {
      // N'existe que sur le papier, et c'est le seul exercice de geometrie qui demande
      // une regle : reconnaitre un carre et savoir en tracer un sont deux choses, et la
      // seconde ne se mesure pas a la souris.
      cle: 'tracer',
      label: 'Tracer sur des carreaux (règle)',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Trace {NOMS[String(d.figure)] ?? 'la figure'} de {String(d.largeur)}{' '}
            carreaux
            {d.figure === 'carre' ? ' de côté' : ` sur ${String(d.hauteur)}`}.
          </p>
          <TrameCarreaux
            colonnes={Number(d.colonnes)}
            lignes={Number(d.lignes)}
          />
        </div>
      ),
      // Rien a redonner : le trace se verifie a la regle, sur la feuille meme. Le corrige
      // rappelle la mesure, qui est la seule chose qu'on puisse relire.
      reponse: (d) =>
        d.figure === 'carre'
          ? `${String(d.largeur)} carreaux de côté`
          : `${String(d.largeur)} sur ${String(d.hauteur)} carreaux`,
    },
  ],
};
