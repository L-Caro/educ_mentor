import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './compte.impression.scss';

export const compteImpression: FournisseurImpression = {
  label: 'Le compte est bon',
  exercices: [
    {
      cle: 'tirage',
      label: 'Un tirage : la cible et les six plaques',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Atteins <strong className="Compte__cible">{String(d.cible)}</strong>
          </p>
          <span className="Compte__plaques">
            {(d.plaques as number[]).map((plaque, i) => (
              <span key={i} className="Compte__plaque">
                {plaque}
              </span>
            ))}
          </span>
          <ol className="Compte__etapes">
            {/* Autant de lignes que d'etapes dans la solution de reference, pas une de
                plus : une ligne en trop se lit comme une etape manquante, et la feuille
                laisserait croire qu'on n'a pas fini. */}
            {Array.from({ length: Number(d.etapes) }, (_, i) => (
              <li key={i} className="Compte__etape">
                {/* Un seul blanc pour le calcul, et non trois cases pour `a`, le signe
                    et `b`. Trois blancs minuscules separes par rien se lisent comme du
                    bruit, et surtout ils imposent une forme : une etape peut s'ecrire
                    autrement. Le `=` est garde, lui, parce qu'il dit ce qu'on attend. */}
                <Blanc largeurMm={38} /> = <Blanc largeurMm={18} />
              </li>
            ))}
          </ol>
        </div>
      ),
      // Une solution, pas LA solution : il y en a souvent plusieurs, et ne pas le dire
      // ferait passer pour fausse une reponse qui atteint la cible autrement.
      reponse: (d) => (
        <span>une solution : {(d.solution as string[]).join(' ; ')}</span>
      ),
    },
  ],
};
