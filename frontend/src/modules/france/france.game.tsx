import france from '@svg-maps/france.departments';
import store from 'src/store';
import { franceApi } from './france.api.ts';
import type { FranceQuestion, FranceSessionResponse } from './france.type.ts';
import { franceFiche } from './france.fiche';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import FranceDeptMap from './FranceDeptMap.tsx';
import FranceRegionMap from './FranceRegionMap.tsx';
import FranceCityMap from './FranceCityMap.tsx';
import regionData from './data/france_regions.json';
import citiesData from './data/france_cities.json';
import './france.scss';

const NUMBER_TYPES = new Set(['dept_to_number', 'number_to_dept']);
const deptNameMap = new Map(france.locations.map((l) => [l.id, l.name]));
const regionNameMap = new Map(
  Object.entries(regionData.regions as Record<string, { name: string }>).map(([code, r]) => [code, r.name])
);
const cityIndex = new Map(
  citiesData.cities.map((c) => [`${c.nom}|${c.dept}`, { x: c.svgX, y: c.svgY }])
);

export const franceGameSpec: GameModuleSpec<FranceSessionResponse, FranceQuestion> = {

  loadSession: async (setup) => {
    return store.dispatch(franceApi.endpoints.startFranceSession.initiate({
      difficulty:    setup.difficulty    as string | undefined,
      questionTypes: setup.questionTypes as string[] | undefined,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => {
    const isNumber = NUMBER_TYPES.has(question.type);
    return (
      <div className="FrancePrompt">
        <p className={`FrancePrompt__display${isNumber ? ' FrancePrompt__display--number' : ''}`}>
          {question.display}
        </p>
        <p className="FrancePrompt__label">{question.prompt}</p>
      </div>
    );
  },

  qcm: {
    getChoices: (q) => q.choices.map((c) => ({ key: c, label: c })),
    correctKey:  (q) => q.answer  ?? '',
    correctKeys: (q) => q.answers ?? [],
    layout: 'list',
  },

  map: {
    getComponent: (q) =>
      q.type === 'identify_region' && q.answers === null ? FranceRegionMap : FranceDeptMap,
    isMapQuestion: (q) => q.is_map === true,
    isMultiSelect: (q) => q.type === 'identify_region' && q.answers !== null,
    correctKeys: (q) => q.answers ?? (q.answer ? [q.answer] : []),
    isCorrect: (q, clicked) => clicked === q.answer,
  },

  pointMap: {
    getComponent: () => FranceCityMap,
    getComponentProps: (q) => ({ hideBorders: q.hide_dept_borders === true }),
    isPointMapQuestion: (q) => q.type === 'locate_city',
    targetSvgPoint: (q) => cityIndex.get(`${q.display}|${q.dept_code}`) ?? { x: 300, y: 290 },
    isCorrect: (q, distanceKm) => distanceKm <= (q.threshold_km ?? 20),
    feedbackLabel: (d) => d < 1 ? 'Parfait !' : `À ${Math.round(d)} km`,
  },

  free: {
    parse: (raw) => raw.trim(),
    isCorrect: (q, given) => {
      if (typeof given !== 'string' || !given) return false;
      const normalize = (s: string) =>
        s.trim().toLowerCase()
         .normalize('NFD').replace(/[̀-ͯ]/g, '')
         .replace(/[-']/g, ' ')
         .replace(/\s+/g, ' ');
      return normalize(given) === normalize(q.answer ?? '');
    },
    inputProps: { variant: 'text', placeholder: '…', maxLength: 60 },
  },

  correctionLabel: (question) => {
    if (question.type === 'locate_city') return question.display;
    if (question.is_map) {
      if (question.answers !== null) {
        // Hard mode : liste des depts de la région
        return question.answers.map((c) => deptNameMap.get(c) ?? c).join(', ');
      }
      const code = question.answer ?? '';
      if (question.type === 'identify_region') return regionNameMap.get(code) ?? code;
      return deptNameMap.get(code) ?? code;
    }
    if (question.answers !== null) return question.answers.join(', ');
    return question.answer ?? '';
  },

  fiche: franceFiche,

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(franceApi.endpoints.recordFranceAnswer.initiate({
      sessionId,
      itemKey: question.item_key,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(franceApi.endpoints.completeFranceSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    if (question.type === 'locate_city') {
      const dist = typeof given === 'number' ? given : null;
      const threshold = question.threshold_km ?? 20;
      return {
        label:    question.display,
        given:    dist !== null ? (dist < 1 ? 'Parfait !' : `${Math.round(dist)} km`) : null,
        expected: `< ${threshold} km`,
        correct,
        timeout,
      };
    }
    if (question.is_map) {
      // Hard mode : multi-select depts
      if (Array.isArray(given)) {
        const givenNames = (given as string[]).map((c) => deptNameMap.get(c) ?? c).join(', ');
        const expectedNames = (question.answers ?? []).map((c) => deptNameMap.get(c) ?? c).join(', ');
        return { label: question.display, given: givenNames || null, expected: expectedNames, correct, timeout };
      }
      // Facile/moyen : clic unique (dept ou région)
      const nameOf = (code: string) =>
        question.type === 'identify_region'
          ? (regionNameMap.get(code) ?? code)
          : (deptNameMap.get(code) ?? code);
      const givenCode = typeof given === 'string' ? given : null;
      return {
        label:    question.display,
        given:    givenCode ? nameOf(givenCode) : null,
        expected: nameOf(question.answer ?? ''),
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
