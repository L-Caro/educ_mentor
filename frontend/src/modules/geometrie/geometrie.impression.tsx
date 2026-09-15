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
      label: 'Compter côtés, sommets, faces et arêtes',
      enonce: (d) => {
        const attributs =
          (d.attributs as { nom: string; reponse: number }[] | undefined) ?? [];
        return (
          <div>
            {/* TOUS les denombrements, pas celui que le tirage a choisi. A l'ecran on
                pose une question a la fois parce qu'il faut quatre propositions a
                toucher ; ici la figure est deja dessinee, et n'en tirer qu'un nombre
                gache le dessin. Compter faces, sommets et aretes ensemble montre aussi
                qu'ils ne sont pas egaux, ce qu'une question isolee ne peut pas faire. */}
            <p className="Feuille__consigne">
              {attributs.length > 1 ? 'Compte.' : String(d.consigne)}
            </p>
            <FigureImprimee forme={String(d.figure)} />
            {attributs.length > 0 ? (
              <span className="Geometrie__attributs">
                {attributs.map((attribut) => (
                  <span key={attribut.nom} className="Geometrie__attribut">
                    <Blanc largeurMm={12} />
                    <span className="Geometrie__attributNom">{attribut.nom}</span>
                  </span>
                ))}
              </span>
            ) : (
              <p>
                <Blanc largeurMm={20} />
              </p>
            )}
          </div>
        );
      },
      reponse: (d) => {
        const attributs =
          (d.attributs as { nom: string; reponse: number }[] | undefined) ?? [];
        if (attributs.length === 0) return String(d.reponse);
        return attributs
          .map((attribut) => `${String(attribut.reponse)} ${attribut.nom}`)
          .join(', ');
      },
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
