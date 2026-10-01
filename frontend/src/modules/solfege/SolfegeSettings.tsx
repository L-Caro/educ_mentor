import Spinner from 'src/components/common/Spinner.tsx';
import {
  useGetSettingsQuery,
  useUpdateSettingMutation,
} from 'src/store/api/sharedApi.ts';
import Portee from 'src/musique/Portee';
import {
  NOTES,
  ORDRE_FIGURES,
  NOM_FIGURE,
  nomSilence,
} from 'src/musique/solfege';
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

const ETENDUES = [
  { valeur: '0', label: 'Dans la portée' },
  { valeur: '1', label: '+ 1 ligne supplémentaire' },
  { valeur: '2', label: '+ 2 lignes supplémentaires' },
];

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

const TEMPOS = [
  { valeur: '60', label: 'Très lent' },
  { valeur: '72', label: 'Lent' },
  { valeur: '90', label: 'Moyen' },
  { valeur: '110', label: 'Rapide' },
];

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
            Jusqu&rsquo;où vont les notes
          </p>
          <p className="GameSettings__hint">
            Les lignes supplémentaires s&rsquo;ajoutent de chaque côté à la
            fois.
          </p>
          {choix('solfege_etendue', lire('solfege_etendue', '0'), ETENDUES)}
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

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Vitesse du métronome</p>
          {choix('solfege_tempo', lire('solfege_tempo', '72'), TEMPOS)}
        </div>
      </div>
    </div>
  );
}
