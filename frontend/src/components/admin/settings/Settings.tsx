import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from 'src/components/layout/Header/Header.tsx';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';
import Toggle from 'src/components/common/Toggle.tsx';
import { useDevMode } from 'src/hooks';
import { DURATION_KEY, START_KEY } from 'src/context/SessionTimerContext.tsx';
import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import InvitationsAdmin from 'src/components/admin/settings/InvitationsAdmin.tsx';

const DURATION_STEPS = [0, 1, 10, 15, 20, 30, 45, 60];
const QUESTION_COUNTS = [5, 10, 15, 20];

function formatTimer(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes} min ${remainder}s`;
}

export default function Settings() {
  const { isDevMode, toggle } = useDevMode();
  const [isAccessOpen, setIsAccessOpen] = useState(false);

  const { data: settings } = useGetSettingsQuery();
  const [updateSetting] = useUpdateSettingMutation();

  const [duration, setDuration] = useState(() =>
    parseInt(localStorage.getItem(DURATION_KEY) ?? '0', 10)
  );

  // Dérivés du cache settings : pas de miroir d'état local (cf. « you might not need an effect »)
  const questionCount = parseInt(settings?.questions_per_session ?? '10', 10);
  /** Le péage des jeux : combien de questions avant d'ouvrir un plateau. `0` l'éteint. */
  const peage = parseInt(settings?.jeux_peage_questions ?? '0', 10) || 0;
  /** Une partie sur combien est barrée. `1` = toutes. */
  const peageFrequence = parseInt(settings?.jeux_peage_frequence ?? '1', 10) || 1;
  const savedTimer = parseInt(settings?.question_timer_seconds ?? '0', 10);
  const timerEnabled = savedTimer > 0;
  const timerSeconds = timerEnabled ? savedTimer : 30;
  const masteryThreshold = parseInt(settings?.mastery_threshold ?? '10', 10);
  const accentTolerance = settings?.accent_tolerance === 'true';

  function handleDurationChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = DURATION_STEPS[parseInt(event.target.value, 10)];
    setDuration(value);
    localStorage.setItem(DURATION_KEY, String(value));
    localStorage.removeItem(START_KEY);
  }

  async function handleQuestionCountChange(count: number) {
    await updateSetting({ key: 'questions_per_session', value: String(count) });
  }

  async function handleTimerToggle() {
    await updateSetting({ key: 'question_timer_seconds', value: timerEnabled ? '0' : String(timerSeconds) });
  }

  async function handleTimerSecondsChange(seconds: number) {
    await updateSetting({ key: 'question_timer_seconds', value: String(seconds) });
  }

  async function handleMasteryThresholdChange(value: number) {
    await updateSetting({ key: 'mastery_threshold', value: String(value) });
  }

  const sliderIndex = DURATION_STEPS.indexOf(duration) === -1 ? 0 : DURATION_STEPS.indexOf(duration);
  const durationLabel = duration === 0 ? 'Désactivé' : `${duration} min`;

  return (
    <>
    <Header />
    <PageContainer className="Settings">

      {/* ── Temps de session (écran) ────────────────────────────────────── */}
      <div className="Settings__card">
        <div className="Settings__section">
          <p className="Settings__cardTitle">⏱ Temps de session</p>

          <div className="Settings__label">
            <span>Durée d'écran</span>
            <span className="Settings__labelValue">{durationLabel}</span>
          </div>

          <input
            type="range"
            className="Settings__range"
            min={0}
            max={DURATION_STEPS.length - 1}
            step={1}
            value={sliderIndex}
            onChange={handleDurationChange}
          />

          <div className="Settings__rangeTicks">
            {DURATION_STEPS.map((value) => (
              <span key={value} className="Settings__rangeTick">
                {value === 0 ? 'off' : `${value}`}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Paramètres de jeu (globaux) ─────────────────────────────────── */}
      <div className="Settings__card">
        <div className="Settings__section">
          <p className="Settings__cardTitle">🔢 Questions par session</p>
          <div className="Settings__radios">
            {QUESTION_COUNTS.map((count) => (
              <label key={count} className="Settings__radio">
                <input
                  type="radio"
                  name="questions-count"
                  checked={questionCount === count}
                  onChange={() => handleQuestionCountChange(count)}
                />
                {count} questions
              </label>
            ))}
            <label className="Settings__radio">
              <input
                type="radio"
                name="questions-count"
                checked={questionCount === 0}
                onChange={() => handleQuestionCountChange(0)}
              />
              Illimité
            </label>
          </div>
        </div>

        <div className="Settings__section">
          <p className="Settings__cardTitle">🎟 Péage des jeux</p>
          <p className="Settings__hint">
            Avant d&rsquo;ouvrir un jeu (morpion, Puissance 4, Snake), répondre à
            quelques questions tirées des modules de calcul, tables, conjugaison,
            grammaire et accords : seulement ceux qui sont activés.
          </p>
          <p className="Settings__hint">
            Il faut répondre JUSTE. Une erreur affiche la bonne réponse et repose une
            autre question, sans faire avancer le compte. Rien n&rsquo;enferme pour
            autant : elle peut renoncer au jeu et revenir en arrière. Rien n&rsquo;est
            enregistré dans les séances ni dans la progression.
          </p>
          <div className="Settings__radios">
            <label className="Settings__radio">
              <input
                type="radio"
                name="peage-questions"
                checked={peage === 0}
                onChange={() =>
                  updateSetting({ key: 'jeux_peage_questions', value: '0' })
                }
              />
              Aucun
            </label>
            {[1, 2, 3, 5].map((n) => (
              <label key={n} className="Settings__radio">
                <input
                  type="radio"
                  name="peage-questions"
                  checked={peage === n}
                  onChange={() =>
                    updateSetting({ key: 'jeux_peage_questions', value: String(n) })
                  }
                />
                {n} question{n > 1 ? 's' : ''}
              </label>
            ))}
          </div>

          {peage > 0 && (
            <>
              <p className="Settings__hint">
                À quelle fréquence ? Le péage se pose à la première partie, puis laisse
                passer les suivantes jusqu&rsquo;à la prochaine échéance. Le compte est
                gardé par appareil.
              </p>
              <div className="Settings__radios">
                {[1, 2, 3, 5, 10].map((n) => (
                  <label key={n} className="Settings__radio">
                    <input
                      type="radio"
                      name="peage-frequence"
                      checked={peageFrequence === n}
                      onChange={() =>
                        updateSetting({
                          key: 'jeux_peage_frequence',
                          value: String(n),
                        })
                      }
                    />
                    {n === 1 ? 'Chaque partie' : `1 partie sur ${n}`}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="Settings__section">
          <p className="Settings__cardTitle">⏱ Chronomètre par question</p>
          <div className="Settings__label">
            <span>{timerEnabled ? `${formatTimer(timerSeconds)} par question` : 'Sans chronomètre'}</span>
            <Toggle checked={timerEnabled} onChange={handleTimerToggle} />
          </div>
          {timerEnabled && (
            <>
              <input
                type="range"
                className="Settings__range"
                min={5}
                max={120}
                step={5}
                value={timerSeconds}
                onChange={(event) => handleTimerSecondsChange(parseInt(event.target.value, 10))}
              />
              <div className="Settings__rangeTicks">
                {[5, 30, 60, 90, 120].map((value) => (
                  <span key={value} className="Settings__rangeTick">{value}s</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="Settings__section">
          <p className="Settings__cardTitle">🇫🇷 Tolérance aux accents</p>
          <div className="Settings__label">
            <span>{accentTolerance ? 'Les accents manquants sont acceptés' : 'Les accents sont obligatoires'}</span>
            <Toggle
              checked={accentTolerance}
              onChange={() => updateSetting({ key: 'accent_tolerance', value: accentTolerance ? 'false' : 'true' })}
            />
          </div>
          <p className="Settings__hint">S'applique à tous les modules de français en saisie libre.</p>
        </div>

        <div className="Settings__section">
          <p className="Settings__cardTitle">🎯 Réussites pour maîtriser une notion</p>
          <div className="Settings__label">
            <span>1 erreur annule 1 réussite</span>
            <span className="Settings__labelValue">{masteryThreshold}</span>
          </div>
          <input
            type="range"
            className="Settings__range"
            min={4}
            max={20}
            step={1}
            value={masteryThreshold}
            onChange={(event) => handleMasteryThresholdChange(parseInt(event.target.value, 10))}
          />
        </div>
      </div>

      {/* ── Dev mode ───────────────────────────────────────────────────── */}
      <div className={`Settings__devCard${isDevMode ? ' Settings__devCard--on' : ''}`}>
        <div className="Settings__devCardHeader">
          <span className="Settings__devCardIcon">🧪</span>
          <div>
            <p className="Settings__devCardTitle">Mode développement</p>
            <p className="Settings__devCardDesc">
              Les parties ne sont pas enregistrées dans les statistiques de l'enfant.
            </p>
          </div>
        </div>
        <Toggle checked={isDevMode} onChange={toggle} />
      </div>

      {/* ── Accès appareils ─────────────────────────────────────────────── */}
      <div className="Settings__accessCard">
        <button
          type="button"
          className="Settings__accessHeader"
          onClick={() => setIsAccessOpen(previous => !previous)}
        >
          <div className="Settings__devCardHeader">
            <span className="Settings__devCardIcon">🔒</span>
            <div>
              <p className="Settings__devCardTitle">Appareils autorisés</p>
              <p className="Settings__devCardDesc">
                Gérer les accès par lien d'invitation.
              </p>
            </div>
          </div>
          <span className={`Settings__accessChevron${isAccessOpen ? ' Settings__accessChevron--open' : ''}`}>▾</span>
        </button>
        {isAccessOpen && (
          <div className="Settings__accessBody">
            <InvitationsAdmin />
          </div>
        )}
      </div>

      <Link to="/admin" className="Settings__adminLink">
        🔧 Tableau de bord
      </Link>
    </PageContainer>
    </>
  );
}
