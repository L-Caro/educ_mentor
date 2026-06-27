import store from 'src/store';
import { conjugaisonApi } from './conjugaison.api.ts';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { ConjugaisonQuestion, ConjugaisonSessionResponse } from './conjugaison.type.ts';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import './conjugaison.scss';

// ─── État de session ──────────────────────────────────────────────────────────

let _direction:      'forward' | 'reverse' | 'random' = 'forward';
let _pronounDisplay: 'personal' | 'grammatical' | 'random' = 'personal';
let _accentTolerance = false;

// ─── Pronoms ──────────────────────────────────────────────────────────────────

const GRAMMATICAL_LABELS: Record<string, string> = {
  je:    '1ère personne du singulier',
  tu:    '2ème personne du singulier',
  il:    '3ème personne du singulier (il)',
  elle:  '3ème personne du singulier (elle)',
  on:    '3ème personne du singulier (on)',
  nous:  '1ère personne du pluriel',
  vous:  '2ème personne du pluriel',
  ils:   '3ème personne du pluriel (ils)',
  elles: '3ème personne du pluriel (elles)',
};

/** Affiche le pronom selon le mode. `seed` sert à rendre le mode aléatoire déterministe par question. */
function displayPronoun(pronoun: string, seed = ''): string {
  let mode = _pronounDisplay;
  if (mode === 'random') {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
    mode = Math.abs(h) % 2 === 0 ? 'grammatical' : 'personal';
  }
  if (mode === 'grammatical') return GRAMMATICAL_LABELS[pronoun] ?? pronoun;
  return pronoun.charAt(0).toUpperCase() + pronoun.slice(1);
}

// ─── Élision ─────────────────────────────────────────────────────────────────

/** Applique l'élision je → j' devant voyelle ou h muet. */
function applyElision(pronoun: string, form: string): string {
  if (pronoun === 'je' && /^[aeiouyéèêëàâîïôùûhœæAEIOUYÉÈÊËÀÂÎÏÔÙÛH]/u.test(form)) {
    return `j'${form}`;
  }
  return `${pronoun} ${form}`;
}

// ─── Normalisation (saisie libre) ─────────────────────────────────────────────

function normalize(s: string): string {
  const lower = s.trim().toLowerCase();
  if (!_accentTolerance) return lower;
  return lower.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ─── Spec ─────────────────────────────────────────────────────────────────────

export const conjugaisonGameSpec: GameModuleSpec<ConjugaisonSessionResponse, ConjugaisonQuestion> = {

  loadSession: async (setup) => {
    _direction      = (setup.questionDirection as string || 'forward') as typeof _direction;
    _pronounDisplay = (setup.pronounDisplay    as string || 'personal') as typeof _pronounDisplay;

    const settings = await store.dispatch(sharedApi.endpoints.getSettings.initiate()).unwrap();
    _accentTolerance = settings.accent_tolerance === 'true';

    return store.dispatch(conjugaisonApi.endpoints.startConjugaisonSession.initiate({
      difficulty:        setup.difficulty as string | undefined,
      tenses:            setup.tenses    as string[] | undefined,
      verbGroups:        setup.verbGroups as string[] | undefined,
      questionDirection: _direction,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => {
    const seed = question.infinitif + question.tense;
    if (question.direction === 'reverse') {
      return (
        <div className="ConjugaisonPrompt">
          <p className="ConjugaisonPrompt__conjugated">
            {applyElision(question.pronoun, question.conjugated)}
          </p>
          <p className="ConjugaisonPrompt__tense">{question.tense}</p>
        </div>
      );
    }
    return (
      <div className="ConjugaisonPrompt">
        <p className="ConjugaisonPrompt__verb">{question.infinitif}</p>
        <p className="ConjugaisonPrompt__pronoun">{displayPronoun(question.pronoun, seed)}</p>
        <p className="ConjugaisonPrompt__tense">{question.tense}</p>
      </div>
    );
  },

  qcm: {
    getChoices: (question) =>
      question.choices.map((choice) => ({ key: choice, label: choice })),
    correctKey: (question) =>
      question.direction === 'reverse' ? question.infinitif : question.conjugated,
    layout: 'list',
  },

  free: {
    parse: (raw) => {
      // Accepte "j'aime" et "aime" pour le mode forward (je + voyelle)
      return raw.trim().toLowerCase().replace(/^j['']/, '');
    },
    isCorrect: (question, given) => {
      if (typeof given !== 'string' || !given) return false;
      const target = question.direction === 'forward' ? question.conjugated : question.infinitif;
      return normalize(given) === normalize(target);
    },
    get inputProps() {
      return {
        placeholder: _direction === 'reverse' ? 'infinitif' : '…',
        maxLength: 25,
      };
    },
  },

  correctionLabel: (question) =>
    question.direction === 'forward'
      ? applyElision(question.pronoun, question.conjugated)
      : question.infinitif,

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(conjugaisonApi.endpoints.recordConjugaisonAnswer.initiate({
      sessionId,
      verbTense: `${question.infinitif}_${question.tense}`,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(conjugaisonApi.endpoints.completeConjugaisonSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    const givenStr = typeof given === 'string' && given ? given : null;
    const seed = question.infinitif + question.tense;

    if (question.direction === 'forward') {
      return {
        label:    `${question.infinitif} — ${displayPronoun(question.pronoun, seed)} (${question.tense})`,
        given:    givenStr ? applyElision(question.pronoun, givenStr) : null,
        expected: applyElision(question.pronoun, question.conjugated),
        correct,
        timeout,
      };
    }
    return {
      label:    `${applyElision(question.pronoun, question.conjugated)} (${question.tense})`,
      given:    givenStr ?? null,
      expected: question.infinitif,
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};