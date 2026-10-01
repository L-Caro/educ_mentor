import Spinner from 'src/components/common/Spinner.tsx';
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from 'src/store/api/sharedApi.ts';
import Portee from 'src/musique/Portee';
import {
  NOTES,
  NOM_FIGURE,
  ORDRE_FIGURES,
  hauteurDe,
  nomDe,
  nomSilence,
} from 'src/musique/solfege';
import { AIGU_DEFAUT, GRAVE_DEFAUT } from 'src/musique/exercices';
import './solfege.scss';

/**
 * Les réglages de classe du solfège.
 *
 * Ce qui est ici ne dépend PAS de la partie : où elle en est dans sa méthode. Les notes
 * qu'elle a vues, les figures au programme, la mesure qu'elle travaille. Son cahier
 * avance vite et de façon inégale, la clé de fa à la leçon trois alors que les croches ne
 * sont toujours pas là : rien ne se déduit d'un niveau, tout se coche.
 *
 * Le pré-jeu ne garde que ce qui lui appartient : ce qu'elle veut travailler aujourd'hui,
 * et dans quelle clé.
 *
 * Tout passe par les réglages globaux, en clé-valeur, comme la méthode de soustraction du
 * module « poser » : pas de table à soi pour six lignes qui changent trois fois par an.
 */

const MESURES = [
  { valeur: '2', label: '2 temps' },
  { valeur: '3', label: '3 temps' },
  { valeur: '4', label: '4 temps' },
];

const LONGUEURS = [
  { valeur: '4', label: 'Très courte' },
  { valeur: '8', label: 'Courte' },
  { valeur: '12', label: 'Moyenne' },
  { valeur: '16', label: 'Longue' },
];

const MOUVEMENTS = [
  {
    valeur: 'facile',
    label: 'Les notes se suivent',
    aide: 'La case d’à côté, en montant ou en descendant',
  },
  { valeur: 'moyen', label: 'Jusqu’à la tierce', aide: 'Deux cases au plus' },
  {
    valeur: 'difficile',
    label: 'Libre',
    aide: 'N’importe où dans l’intervalle',
  },
];

/**
 * Les hauteurs qu'on peut choisir comme bornes, de la plus grave à la plus aiguë.
 *
 * Une seule liste pour les deux clés, et c'est tout l'intérêt : les deux portées se
 * chevauchent, et « deux lignes au-dessus de la clé de fa » désigne déjà des notes qui
 * s'écrivent en clé de sol. Compter en lignes depuis chaque portée séparément laissait
 * ouvrir d'un côté ce qu'on croyait fermé de l'autre.
 *
 * Chaque borne est nommée par la portée où elle TOMBE, celle où elle s'écrit sans ligne
 * supplémentaire : c'est ainsi qu'on la désigne quand on la cherche des yeux.
 */
const RANGS = ['1re', '2e', '3e', '4e', '5e'];

function bornes(): { valeur: number; label: string }[] {
  const liste: { valeur: number; label: string }[] = [];
  for (const cle of ['fa', 'sol'] as const) {
    for (let position = 0; position <= 8; position++) {
      const hauteur = hauteurDe(position, cle);
      if (liste.some((b) => b.valeur === hauteur)) continue;
      const ou =
        position % 2 === 0
          ? `${RANGS[position / 2]} ligne`
          : `${RANGS[(position - 1) / 2]} interligne`;
      liste.push({
        valeur: hauteur,
        label: `${nomDe(hauteur)} (${ou}, clé de ${cle})`,
      });
    }
  }
  return liste.sort((a, b) => a.valeur - b.valeur);
}

const BORNES = bornes();

export default function SolfegeSettings() {
  const { data: reglages = {}, isLoading } = useGetSettingsQuery();
  const [enregistrer, { isLoading: enCours }] = useUpdateSettingMutation();

  if (isLoading) return <Spinner size="sm" />;

  const lire = (cle: string, defaut: string) => reglages[cle] ?? defaut;
  const liste = (cle: string, defaut: string) =>
    lire(cle, defaut).split(',').filter(Boolean);

  const notesOuvertes = liste('solfege_notes', NOTES.join(','));
  const figuresOuvertes = liste('solfege_figures', 'blanche,noire');

  /** Bascule une valeur dans une liste, sans jamais la vider : un réglage à zéro notes
   * ne produirait aucune question, et l'écran se tairait sans rien dire. */
  function basculer(cle: string, actuelles: string[], valeur: string) {
    const suite = actuelles.includes(valeur)
      ? actuelles.filter((v) => v !== valeur)
      : [...actuelles, valeur];
    if (suite.length === 0) return;
    void enregistrer({ key: cle, value: suite.join(',') });
  }

  const choix = (
    cle: string,
    actuel: string,
    options: { valeur: string; label: string }[],
  ) => (
    <div className="GameSettings__radios">
      {options.map(({ valeur, label }) => (
        <label key={valeur} className="GameSettings__radio">
          <input
            type="radio"
            name={cle}
            checked={actuel === valeur}
            onChange={() => void enregistrer({ key: cle, value: valeur })}
          />
          {label}
        </label>
      ))}
    </div>
  );

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Ces réglages suivent sa méthode, pas son humeur : ils se règlent ici
          une fois, et non avant chaque partie. Elle ne choisit que ce
          qu&rsquo;elle travaille et dans quelle clé.
        </p>
        {enCours && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Les notes au programme</p>
          <p className="GameSettings__hint">
            Sa méthode n&rsquo;ouvre pas les sept d&rsquo;un coup : on commence
            sur trois notes voisines, puis on en ajoute. Décocher une note la
            retire de toutes les questions de lecture.
          </p>
          <div className="SolfegeSettings__notes">
            {NOTES.map((note) => (
              <button
                key={note}
                type="button"
                className={`SolfegeSettings__note${
                  notesOuvertes.includes(note)
                    ? ' SolfegeSettings__note--ouverte'
                    : ''
                }`}
                onClick={() => basculer('solfege_notes', notesOuvertes, note)}
              >
                {note}
              </button>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">
            De quelle note à quelle note
          </p>
          <p className="GameSettings__hint">
            Un intervalle, et non un nombre de lignes : les deux portées se
            chevauchent, et chaque note s&rsquo;écrit sur celle où elle tombe
            sans ligne supplémentaire.
          </p>
          <div className="SolfegeSettings__intervalle">
            <label>
              <span>De</span>
              <select
                value={lire('solfege_grave', String(GRAVE_DEFAUT))}
                onChange={(evenement) =>
                  void enregistrer({
                    key: 'solfege_grave',
                    value: evenement.target.value,
                  })
                }
              >
                {BORNES.map(({ valeur, label }) => (
                  <option key={valeur} value={valeur}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>à</span>
              <select
                value={lire('solfege_aigu', String(AIGU_DEFAUT))}
                onChange={(evenement) =>
                  void enregistrer({
                    key: 'solfege_aigu',
                    value: evenement.target.value,
                  })
                }
              >
                {BORNES.map(({ valeur, label }) => (
                  <option key={valeur} value={valeur}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Comment la suite se déplace</p>
          <p className="GameSettings__hint">
            Pour la lecture groupée : l&rsquo;écart entre deux notes voisines.
          </p>
          <div className="GameSettings__radios">
            {MOUVEMENTS.map(({ valeur, label, aide }) => (
              <label key={valeur} className="GameSettings__radio">
                <input
                  type="radio"
                  name="solfege_mouvement"
                  checked={lire('solfege_mouvement', 'moyen') === valeur}
                  onChange={() =>
                    void enregistrer({
                      key: 'solfege_mouvement',
                      value: valeur,
                    })
                  }
                />
                {label}
                <span className="SolfegeSettings__aide">{aide}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Quelles figures</p>
          <p className="GameSettings__hint">
            Chaque figure amène aussi son silence : cocher la noire ouvre le
            soupir.
          </p>
          <div className="SolfegeSettings__figures">
            {ORDRE_FIGURES.map((figure) => (
              <button
                key={figure}
                type="button"
                className={`SolfegeSettings__figure${
                  figuresOuvertes.includes(figure)
                    ? ' SolfegeSettings__figure--ouverte'
                    : ''
                }`}
                onClick={() =>
                  basculer('solfege_figures', figuresOuvertes, figure)
                }
              >
                <Portee
                  cle="rythme"
                  symboles={[{ position: 4, figure }]}
                  espace={34}
                />
                <span>
                  {NOM_FIGURE[figure]} et {nomSilence(figure)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Combien de temps par mesure</p>
          {choix('solfege_mesure', lire('solfege_mesure', '2'), MESURES)}
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">
            Longueur des phrases à frapper
          </p>
          <p className="GameSettings__hint">
            La dictée rythmique reste courte quoi qu&rsquo;il arrive : au-delà
            de huit temps, ce n&rsquo;est plus l&rsquo;oreille qu&rsquo;on
            mesure mais la mémoire.
          </p>
          {choix('solfege_longueur', lire('solfege_longueur', '12'), LONGUEURS)}
        </div>
      </div>
    </div>
  );
}
