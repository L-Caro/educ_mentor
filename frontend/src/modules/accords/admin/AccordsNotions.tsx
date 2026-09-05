import Spinner from 'src/components/common/Spinner';
import {
  useGetAccordsActiveFamillesQuery,
  useGetAccordsActiveNotionsQuery,
  useGetAccordsFamillesQuery,
  useUpdateAccordsActiveFamillesMutation,
  useGetAccordsNotionsQuery,
  useGetAccordsProgressionParNotionQuery,
  useUpdateAccordsActiveNotionsMutation,
} from '../accords.api';
import type { NotionKey, NotionMeta } from '../accords.type';
import '../accords.scss';

/** Le libellé sans son article : « Le genre des noms » → « genre des noms ». Les pastilles
 * sont lues d'un coup d'œil, l'article n'y apporte rien et allonge chaque bouton. */
function pastille(notion: NotionMeta): string {
  return notion.label.replace(/^(Le|La|L’|Les)\s*/, '');
}

// ─── Familles morphologiques ──────────────────────────────────────────────────

const PORTE_TITRE = {
  nom: 'Pluriel des noms',
  adjectif: "Féminin et pluriel de l'adjectif",
} as const;

/** Les familles de mots ouvertes. Le corpus contient toutes celles du CE1 au CM2 — les
 * pluriels en -aux, les féminins irréguliers, les adjectifs invariables. On les ouvre
 * quand la classe les a vues, comme les figures de la géométrie.
 *
 * Un mot fermé n'apparaît nulle part : ni en question, ni en distracteur. */
function FamillesActives() {
  const { data: familles = [], isLoading: loadingFamilles } =
    useGetAccordsFamillesQuery();
  const { data: actives = [], isLoading: loadingActives } =
    useGetAccordsActiveFamillesQuery();
  const [updateActives, { isLoading: saving }] =
    useUpdateAccordsActiveFamillesMutation();

  if (loadingFamilles || loadingActives) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actives.includes(key)
      ? actives.filter((k) => k !== key)
      : [...actives, key];
    if (next.length === 0) return; // toujours au moins une famille jouable
    updateActives(next);
  }

  return (
    <>
      <p className="GameSettings__hint">
        Les familles de mots vont du CE1 au CM2. La classe indiquée dit quand les
        ouvrir — rien n&rsquo;empêche d&rsquo;ouvrir plus tôt. Un adjectif comme
        <em> gros</em> appartient à deux familles : il n&rsquo;apparaît que si les
        deux sont ouvertes, sinon il enseignerait au passage celle qui est fermée.
        {saving && <Spinner size="xs" />}
      </p>

      <div className="GameSettings__grid">
        {(['nom', 'adjectif'] as const).map((porte) => {
          const duGroupe = familles.filter((f) => f.porte === porte);
          if (duGroupe.length === 0) return null;
          return (
            <div key={porte} className="AdminCard GameSettings__card">
              <p className="GameSettings__cardTitle">{PORTE_TITRE[porte]}</p>
              <div className="GameSettings__denominations">
                {duGroupe.map((famille) => (
                  <button
                    key={famille.key}
                    type="button"
                    className={`GameSettings__denomination${
                      actives.includes(famille.key)
                        ? ' GameSettings__denomination--active'
                        : ''
                    }`}
                    onClick={() => toggle(famille.key)}
                    title={famille.exemple}
                  >
                    {famille.label}
                    <span className="AccordsNotions__niveau">
                      {famille.niveau.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Notions à retravailler ───────────────────────────────────────────────────

function NotionsARetravailler({ notions }: { notions: NotionMeta[] }) {
  const { data: stats = [] } = useGetAccordsProgressionParNotionQuery();
  const vues = stats.filter(
    (stat) => stat.correct_count + stat.incorrect_count > 0,
  );
  if (vues.length === 0) return null;

  const libelle = new Map(notions.map((notion) => [notion.key, notion.label]));

  // Le plus raté en premier : c'est la seule chose que le parent cherche dans ce tableau.
  const triees = [...vues].sort((a, b) => {
    const tauxA = a.incorrect_count / (a.correct_count + a.incorrect_count);
    const tauxB = b.incorrect_count / (b.correct_count + b.incorrect_count);
    return tauxB - tauxA;
  });

  return (
    <div className="AdminCard">
      <h3 className="AccordsNotions__sectionTitle">Accords à retravailler</h3>
      <p className="GameSettings__hint">
        Un accord souvent raté est une fiche de cours à relire ensemble, pas un
        exercice à refaire.
      </p>
      <table className="AccordsNotions__table">
        <thead>
          <tr>
            <th>Notion</th>
            <th>Réussis</th>
            <th>Ratés</th>
            <th>Acquis</th>
          </tr>
        </thead>
        <tbody>
          {triees.map((stat) => (
            <tr key={stat.skill_key}>
              <td>{libelle.get(stat.skill_key) ?? stat.skill_key}</td>
              <td>{stat.correct_count}</td>
              <td>{stat.incorrect_count}</td>
              <td>{stat.is_mastered ? '✅' : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccordsNotions() {
  const { data: notions = [], isLoading: loadingNotions } =
    useGetAccordsNotionsQuery();
  const { data: active = [], isLoading: loadingActive } =
    useGetAccordsActiveNotionsQuery();
  const [updateActive, { isLoading: saving }] =
    useUpdateAccordsActiveNotionsMutation();

  if (loadingNotions || loadingActive) return <Spinner size="sm" />;

  function toggle(key: NotionKey) {
    const next = active.includes(key)
      ? active.filter((activeKey) => activeKey !== key)
      : [...active, key];
    if (next.length === 0) return; // toujours au moins une notion active
    updateActive(next);
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Les exercices actifs déterminent ce qui peut être demandé en partie. Active-les
          au fil du programme — un accord qui n&rsquo;a pas été vu en classe ne donne pas
          une question difficile, il donne une question incompréhensible.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">
            Les cinq accords, dans l&rsquo;ordre du programme
          </p>
          <div className="GameSettings__denominations">
            {notions.map((notion) => (
              <button
                key={notion.key}
                type="button"
                className={`GameSettings__denomination${
                  active.includes(notion.key)
                    ? ' GameSettings__denomination--active'
                    : ''
                }`}
                onClick={() => toggle(notion.key)}
              >
                {pastille(notion)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="GameSettings__hint">
        L&rsquo;ordre compte : le genre et le nombre disent de quoi un nom est marqué,
        et les trois accords suivants ne sont que la façon dont les autres mots
        recopient ces marques.
      </p>

      <FamillesActives />

      <NotionsARetravailler notions={notions} />
    </div>
  );
}
