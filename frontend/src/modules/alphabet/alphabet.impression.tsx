import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './alphabet.impression.scss';

/**
 * Ranger des mots : l'exercice qui gagne le plus au papier.
 *
 * A l'ecran on touche les mots l'un apres l'autre, et l'ordre se construit par le geste.
 * Sur la feuille on NUMEROTE, ce qui est l'exercice scolaire d'origine : on voit les
 * mots tous ensemble, on compare, on se corrige a la gomme. C'est un autre travail,
 * pas une degradation de celui de l'ecran.
 */
export const alphabetImpression: FournisseurImpression = {
  label: 'Ordre alphabétique',
  exercices: [
    {
      cle: 'ranger',
      label: 'Numéroter des mots dans l’ordre alphabétique',
      enonce: (donnees) => (
        <div>
          {/* Pas la consigne du module : a l'ecran elle dit de ranger, ici on numerote. */}
          <p className="Feuille__consigne">
            Écris 1, 2, 3… devant chaque mot pour les ranger dans l’ordre
            alphabétique.
          </p>
          <ul className="AlphabetImp__liste">
            {(donnees.mots as string[]).map((mot) => (
              <li key={mot} className="AlphabetImp__ligne">
                {/* La case ou l'enfant ecrit le rang. Bordee, jamais peinte : un fond
                    CSS ne sort pas d'une imprimante sans cocher « graphiques
                    d'arriere-plan ». */}
                <span className="AlphabetImp__case" aria-hidden="true" />
                <span>{mot}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
      reponse: (donnees) => (donnees.reponse as string[]).join(', '),
    },
    {
      cle: 'intrus',
      label: 'Entourer le mot mal placé dans une liste',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">
            Ces mots sont presque rangés. Entoure celui qui n’est pas à sa
            place.
          </p>
          <p className="AlphabetImp__suite">
            {(donnees.mots as string[]).join(' · ')}
          </p>
        </div>
      ),
      reponse: (donnees) => (donnees.reponse as string[]).join(' ou '),
    },
    {
      cle: 'intercaler',
      label: 'Écrire un mot au bon endroit dans une liste rangée',
      largeur: 'pleine',
      enonce: (donnees) => {
        const mots = donnees.mots as string[];
        return (
          <div>
            <p className="Feuille__consigne">
              Écris <strong>{String(donnees.aPlacer)}</strong> sur le trait qui
              lui revient.
            </p>
            {/* Un trait AVANT chaque mot, et un dernier apres : ce sont les places
                possibles, et il faut les voir toutes pour en choisir une. */}
            <ul className="AlphabetImp__liste AlphabetImp__liste--trous">
              <li className="AlphabetImp__ligne">
                <Blanc largeurMm={40} />
              </li>
              {mots.map((mot) => (
                <li key={mot}>
                  <span className="AlphabetImp__fixe">{mot}</span>
                  <span className="AlphabetImp__ligne">
                    <Blanc largeurMm={40} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      },
      // Le rang seul ne se relit pas : « 3 » oblige a recompter la liste. On rend donc la
      // liste complete, mot place compris.
      reponse: (donnees) => {
        const mots = [...(donnees.mots as string[])];
        mots.splice(
          Number((donnees.reponse as string[])[0]),
          0,
          String(donnees.aPlacer),
        );
        return mots.join(', ');
      },
    },
  ],
  options: [
    {
      cle: 'communes',
      label: 'Au plus loin, les mots se ressemblent jusqu’à',
      type: 'unique',
      defaut: '1',
      choix: [
        { valeur: '0', label: 'La 1re lettre' },
        { valeur: '1', label: 'La 2e lettre' },
        { valeur: '2', label: 'La 3e lettre' },
        { valeur: '3', label: 'La 4e lettre' },
        { valeur: '4', label: 'La 5e lettre' },
      ],
    },
    {
      cle: 'combien',
      label: 'Combien de mots par exercice',
      type: 'nombre',
      min: 4,
      max: 20,
      defaut: 4,
    },
  ],
};
