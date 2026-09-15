import type { ExerciceImprimable, ItemImprime } from './impression.types';
import './impression.scss';

interface Props {
  items: ItemImprime[];
  /** Le catalogue des exercices, pour retrouver le rendu de chaque item. */
  exercices: Map<string, ExerciceImprimable>;
  titre: string;
  avecCorrige: boolean;
  /** Numeroter, ou poser un simple chevron.
   *
   * Un numero devant chaque exercice ressemble a une note. A sept ans, « 7. » pose au
   * meme endroit qu'un resultat se lit comme un score, et la feuille prend l'air d'un
   * controle. Le chevron ne dit rien d'autre que « ca commence ici ». */
  avecNumeros: boolean;
  /** Retirer UN exercice, sans refaire la feuille. Absent, les boutons ne sont pas
   * rendus : c'est ce qui permet de reutiliser ce composant pour un apercu fige. */
  onRejouer?: (index: number) => void;
  /** L'exercice en cours de retirage, pour que le bouton dise qu'il travaille. */
  rejoue?: number | null;
}

/**
 * La feuille, telle qu'elle sortira de l'imprimante.
 *
 * Les exercices peuvent etre NUMEROTES, et ce n'est pas decoratif : c'est ce qui permet
 * au corrige de la page suivante d'etre une simple liste lisible en diagonale, plutot
 * qu'une feuille entiere a comparer ligne a ligne.
 *
 * Mais un numero devant chaque exercice ressemble aussi a une note, et a sept ans la
 * feuille prend l'air d'un controle. On peut donc les remplacer par un chevron, qui ne
 * dit rien d'autre que « ca commence ici ». Le corrige suit alors : il passe sur UNE
 * colonne, et se lit dans le meme ordre que la feuille, ligne apres ligne. En quatre
 * colonnes sans numeros, on ne saurait plus quelle reponse va avec quel exercice.
 *
 * Le corrige part sur sa propre page. L'enfant peut donc la detacher et se corriger seule
 * apres coup, sans l'avoir eue sous les yeux pendant qu'elle travaillait.
 *
 * ── Retirer un exercice a la fois ────────────────────────────────────────────────────
 *
 * Chaque exercice porte un bouton de retirage. Sur une feuille de quinze exercices, un
 * seul ne convient pas : le refaire entierement changeait les quatorze autres, dont ceux
 * qu'on venait de garder. Le bouton ne s'imprime pas, et il ne s'affiche qu'au survol :
 * l'apercu doit montrer la feuille, pas une barre d'outils.
 */
export default function FeuilleImprimable({
  items,
  exercices,
  titre,
  avecCorrige,
  avecNumeros,
  onRejouer,
  rejoue = null,
}: Props) {
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
            <span
              className={`Feuille__numero${avecNumeros ? '' : ' Feuille__numero--chevron'}`}
              aria-hidden={!avecNumeros}
            >
              {avecNumeros ? `${String(numero)}.` : '\u203a'}
            </span>
            <div>{exercice?.enonce(item.donnees)}</div>
            {onRejouer && (
              <button
                type="button"
                className="Feuille__rejouer"
                title="Un autre exercice du même type"
                aria-label={`Remplacer l'exercice ${String(numero)}`}
                disabled={rejoue !== null}
                onClick={() => onRejouer(numero - 1)}
              >
                {rejoue === numero - 1 ? '\u2026' : '\u21bb'}
              </button>
            )}
          </div>
        ))}
      </div>

      {avecCorrige && (
        <div className="Feuille__corrige">
          <div className="Feuille__entete">
            <p className="Feuille__titre">Corrigé</p>
            <span>{titre}</span>
          </div>
          <ol
            className={`Feuille__corrigeListe${
              avecNumeros ? '' : ' Feuille__corrigeListe--suivie'
            }`}
          >
            {rendu.map(({ item, numero, exercice }) => (
              <li key={numero}>
                <strong>{avecNumeros ? `${String(numero)}.` : '\u203a'}</strong>{' '}
                {exercice?.reponse(item.donnees)}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
