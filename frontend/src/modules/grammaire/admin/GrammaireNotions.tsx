import Spinner from 'src/components/common/Spinner';
import {
  useGetGrammaireActiveNotionsQuery,
  useGetGrammaireNotionsQuery,
  useGetGrammaireProgressionParNotionQuery,
  useUpdateGrammaireActiveNotionsMutation,
} from '../grammaire.api';
import type { NotionKey, NotionMeta } from '../grammaire.type';
import '../grammaire.scss';

const CATEGORIE_TITRE: Record<NotionMeta['categorie'], string> = {
  nature: 'La nature des mots — ce que le mot EST',
  fonction: 'La fonction des mots — ce qu’il FAIT dans la phrase',
};

const CATEGORIE_ORDRE: NotionMeta['categorie'][] = ['nature', 'fonction'];

/** Le libellé sans son article : « un déterminant » → « déterminant ». Les pastilles sont
 * lues d'un coup d'œil, l'article n'y apporte rien et allonge chaque bouton. */
function pastille(notion: NotionMeta): string {
  return notion.label.replace(/^(un|une|le|la|l’)\s*/, '');
}

// ─── Notions à retravailler ───────────────────────────────────────────────────

function NotionsARetravailler({ notions }: { notions: NotionMeta[] }) {
  const { data: stats = [] } = useGetGrammaireProgressionParNotionQuery();
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
      <h3 className="GrammaireNotions__sectionTitle">
        Notions à retravailler
      </h3>
      <p className="GameSettings__hint">
        Une notion souvent ratée est une fiche de cours à relire ensemble, pas un
        exercice à refaire.
      </p>
      <table className="GrammaireNotions__table">
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

export default function GrammaireNotions() {
  const { data: notions = [], isLoading: loadingNotions } =
    useGetGrammaireNotionsQuery();
  const { data: active = [], isLoading: loadingActive } =
    useGetGrammaireActiveNotionsQuery();
  const [updateActive, { isLoading: saving }] =
    useUpdateGrammaireActiveNotionsMutation();

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
          Les notions actives déterminent ce qui peut être demandé en partie — et ce
          qui peut apparaître comme mauvaise réponse dans un QCM. Une notion inactive
          n&rsquo;est donc jamais divulguée. Active-les au fil du programme.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        {CATEGORIE_ORDRE.map((categorie) => {
          const duGroupe = notions.filter(
            (notion) => notion.categorie === categorie,
          );
          if (duGroupe.length === 0) return null;
          return (
            <div key={categorie} className="AdminCard GameSettings__card">
              <p className="GameSettings__cardTitle">
                {CATEGORIE_TITRE[categorie]}
              </p>
              <div className="GameSettings__denominations">
                {duGroupe.map((notion) => (
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
          );
        })}
      </div>

      <p className="GameSettings__hint">
        La fonction vient après la nature : on ne peut pas dire ce qu&rsquo;un mot fait
        dans la phrase avant de savoir le nommer.
      </p>

      <NotionsARetravailler notions={notions} />
    </div>
  );
}
