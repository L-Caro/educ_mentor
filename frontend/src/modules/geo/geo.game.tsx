import store from 'src/store';
import { geoApi } from './geo.api.ts';
import type { GeoQuestion, GeoSessionResponse } from './geo.type.ts';
import type { GameModuleSpec, MapInteractionProps } from 'src/types/game.types.ts';
import WorldMap from './WorldMap.tsx';
import './geo.scss';

export const geoGameSpec: GameModuleSpec<GeoSessionResponse, GeoQuestion> = {

  loadSession: async (setup) => {
    return store.dispatch(geoApi.endpoints.startGeoSession.initiate({
      difficulty:       setup.difficulty    as string | undefined,
      questionTypes:    setup.questionTypes as string[] | undefined,
      continents:       setup.continents    as string[] | undefined,
      capitalDirection: setup.capitalDirection as string | undefined,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => {
    if (question.display_type === 'flag') {
      return (
        <div className="GeoPrompt">
          <p className="GeoPrompt__flag">{question.display}</p>
          <p className="GeoPrompt__label">{question.prompt}</p>
        </div>
      );
    }
    return (
      <div className="GeoPrompt">
        <p className="GeoPrompt__display">{question.display}</p>
        <p className="GeoPrompt__label">{question.prompt}</p>
      </div>
    );
  },

  map: {
    isMapQuestion: (q) => q.type === 'identify_country',
    isMultiSelect: () => false,
    correctKeys:   (q) => [q.answer!],
    isCorrect:     (q, clicked) => clicked === q.answer,
    getComponent: (q) => {
      if (!q.continent && !q.map_filter) return WorldMap;
      const continent = q.continent ?? undefined;
      const visibleKeys = q.map_filter ? new Set(q.map_filter) : undefined;
      return (props: MapInteractionProps) => (
        <WorldMap {...props} continent={continent} visibleKeys={visibleKeys} />
      );
    },
  },

  qcm: {
    getChoices: (q) => q.choices.map((c) => ({ key: c, label: c })),
    correctKey:  (q) => q.answer  ?? '',
    correctKeys: (q) => q.answers ?? [],
    layout: 'list',
  },

  free: {
    parse: (raw) => raw.trim(),
    isCorrect: (q, given) => {
      if (typeof given !== 'string' || !given) return false;
      const normalize = (s: string) =>
        s.trim().toLowerCase()
         .normalize('NFD').replace(/[̀-ͯ]/g, '')
         .replace(/\./g, ''); // tolérance accents + ponctuation (D.C. → DC)
      return normalize(given) === normalize(q.answer ?? '');
    },
    inputProps: { variant: 'text', placeholder: '…', maxLength: 50 },
  },

  correctionLabel: (question) => {
    if (question.type === 'identify_country') return question.display;
    if (question.answers !== null) return question.answers.join(', ');
    return question.answer ?? '';
  },

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(geoApi.endpoints.recordGeoAnswer.initiate({
      sessionId,
      itemKey: question.item_key,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(geoApi.endpoints.completeGeoSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    if (question.type === 'identify_country') {
      return {
        label:    question.prompt,
        given:    typeof given === 'string' ? given : null,
        expected: question.display,
        correct,
        timeout,
      };
    }
    const isMulti = question.answers !== null;
    if (isMulti) {
      const givenArr = Array.isArray(given) ? (given as string[]) : [];
      return {
        label:    question.prompt,
        given:    givenArr.length > 0 ? givenArr.join(', ') : null,
        expected: (question.answers ?? []).join(', '),
        correct,
        timeout,
      };
    }
    return {
      label:    question.prompt,
      given:    typeof given === 'string' ? given : null,
      expected: question.answer ?? '',
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
