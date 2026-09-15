import type { ExerciceImprimable, ItemImprime } from './impression.types';
import './impression.scss';

interface Props {
  items: ItemImprime[];
  /** Le catalogue des exercices, pour retrouver le rendu de chaque item. */
  exercices: Map<string, ExerciceImprimable>;
  titre: string;
  avecCorrige: boolean;
}

/**
 * La feuille, telle qu'elle sortira de l'imprimante.
 *
 * Les exercices sont NUMEROTES, et ce n'est pas decoratif : c'est ce qui permet au
 * corrige de la page suivante d'etre une simple liste, lisible en diagonale, plutot qu'une
 * feuille entiere a comparer ligne a ligne.
 *
 * Le corrige part sur sa propre page. L'enfant peut donc la detacher et se corriger seule
 * apres coup, sans l'avoir eue sous les yeux pendant qu'elle travaillait.
 */
export default function FeuilleImprimable({ items, exercices, titre, avecCorrige }: Props) {
  const rendu = items.map((item, index) => ({
    item,
    numero: index + 1,
    exercice: exercices.get(`${item.module}/${item.exercice}`),
  }));

  return (
    <div className="Feuille">
      <div className="Feuille__entete">
        <p className="Feuille__titre">{titre}</p>
        <span>Nom : ______________ Date : ____ / ____</span>
      </div>

      <div className="Feuille__grille">
        {rendu.map(({ item, numero, exercice }) => (
          <div
            key={numero}
            className={`Feuille__item${exercice?.largeur === 'pleine' ? ' Feuille__item--pleine' : ''}`}
          >
            <span className="Feuille__numero">{numero}.</span>
            <div>{exercice?.enonce(item.donnees)}</div>
          </div>
        ))}
      </div>

      {avecCorrige && (
        <div className="Feuille__corrige">
          <div className="Feuille__entete">
            <p className="Feuille__titre">Corrigé</p>
            <span>{titre}</span>
          </div>
          <ol className="Feuille__corrigeListe">
            {rendu.map(({ item, numero, exercice }) => (
              <li key={numero}>
                <strong>{numero}.</strong> {exercice?.reponse(item.donnees)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
