import Spinner from 'src/components/common/Spinner';
import {
  useGetGrammaireActiveClassesQuery,
  useGetGrammaireActiveNotionsQuery,
  useGetGrammaireClassesQuery,
  useUpdateGrammaireActiveClassesMutation,
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

// ─── Classes de phrases ───────────────────────────────────────────────────────

/** Les classes dont les phrases sont servies. Le corpus va jusqu'au CM2 : « Chaque matin,
 * le boulanger prépare de bons pains dans son fournil » n'est pas pour un CE1, quelle que
 * soit la question posée. Le compte de phrases évite d'ouvrir une classe encore vide. */
function ClassesActives() {
  const { data: classes = [], isLoading: loadingClasses } =
    useGetGrammaireClassesQuery();
  const { data: actives = [], isLoading: loadingActives } =
    useGetGrammaireActiveClassesQuery();
  const [updateActives, { isLoading: saving }] =
    useUpdateGrammaireActiveClassesMutation();

  if (loadingClasses || loadingActives) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actives.includes(key)
      ? actives.filter((k) => k !== key)
      : [...actives, key];
    if (next.length === 0) return; // toujours au moins une classe jouable
    updateActives(next);
  }

  return (
    <div className="AdminCard GameSettings__card">
      <div className="GameSettings__header">
        <p className="GameSettings__cardTitle">Classes de phrases</p>
        {saving && <Spinner size="xs" />}
      </div>
      <p className="GameSettings__hint">
        Les phrases portent la classe où elles deviennent abordables. Ouvre-les au fil
        du programme. Le nombre indique combien le corpus en contient — une classe
        vide donnerait un exercice muet.
      </p>
      <div className="GameSettings__denominations">
        {classes.map((classe) => (
          <button
            key={classe.key}
            type="button"
            className={`GameSettings__denomination${
              actives.includes(classe.key)
                ? ' GameSettings__denomination--active'
                : ''
            }`}
            onClick={() => toggle(classe.key)}
            disabled={classe.phrases === 0}
          >
            {classe.label}
            <span className="GrammaireNotions__compte">{classe.phrases}</span>
          </button>
        ))}
      </div>
    </div>
  );
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

      <ClassesActives />

      <NotionsARetravailler notions={notions} />
    </div>
  );
}
