import Spinner from 'src/components/common/Spinner.tsx';
import {
  useGetCompteActiveOperationsQuery,
  useGetCompteCatalogueQuery,
  useUpdateCompteActiveOperationsMutation,
} from './compte.api.ts';
import './compte.scss';

/** Les opérations ouvertes.
 *
 * Le jeu télévisé donne les quatre d'emblée. Ici, non : la multiplication et la division
 * sont présentes mais fermées, et s'ouvrent quand la classe les a vues. Une enfant de CE1
 * qui trouve une touche « ÷ » l'essaie, et le refus qu'elle obtient ne lui apprend rien.
 *
 * Le nombre d'opérations à enchaîner, lui, n'est pas ici : c'est la difficulté choisie
 * avant la partie (facile 2, moyen 3, difficile 4). Elle change d'un jour à l'autre, pas
 * d'une année à l'autre. */
export default function CompteSettings() {
  const { data: catalogue = [], isLoading: loadingCatalogue } =
    useGetCompteCatalogueQuery();
  const { data: actives = [], isLoading: loadingActives } =
    useGetCompteActiveOperationsQuery();
  const [updateActives, { isLoading: saving }] =
    useUpdateCompteActiveOperationsMutation();

  if (loadingCatalogue || loadingActives) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actives.includes(key)
      ? actives.filter((k) => k !== key)
      : [...actives, key];
    if (next.length === 0) return; // toujours au moins une opération jouable
    updateActives(next);
  }

  return (
    <div className="GameSettings">
      <div className="AdminCard GameSettings__card">
        <div className="GameSettings__header">
          <p className="GameSettings__cardTitle">Opérations autorisées</p>
          {saving && <Spinner size="xs" />}
        </div>
        <p className="GameSettings__hint">
          La classe indiquée dit quand ouvrir : rien n&rsquo;empêche d&rsquo;ouvrir plus
          tôt. Avec l&rsquo;addition seule, le jeu reste jouable : on cherche la cible en
          empilant les plaques.
        </p>
        <div className="GameSettings__denominations">
          {catalogue.map((operation) => (
            <button
              key={operation.key}
              type="button"
              className={`GameSettings__denomination${
                actives.includes(operation.key)
                  ? ' GameSettings__denomination--active'
                  : ''
              }`}
              onClick={() => toggle(operation.key)}
              title={operation.exemple}
            >
              {operation.label}
              <span className="GameSettings__niveau">
                {operation.niveau.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="AdminCard GameSettings__card">
        <p className="GameSettings__cardTitle">Ce qui n&rsquo;est pas réglable ici</p>
        <p className="GameSettings__hint">
          Chaque tirage est engendré à l&rsquo;envers, depuis une suite d&rsquo;opérations
          valides : il est donc TOUJOURS soluble, et la solution est connue. Il n&rsquo;y a
          pas de banque de tirages à remplir, ni de risque d&rsquo;en servir un impossible.
        </p>
        <p className="GameSettings__hint">
          Le minuteur et le nombre de questions par séance sont les réglages généraux, dans
          Administration → Réglages.
        </p>
      </div>
    </div>
  );
}
