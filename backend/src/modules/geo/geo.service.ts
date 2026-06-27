import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { GeoProgression } from './entities/geo-progression.entity';
import { GeoSession } from './entities/geo-session.entity';
import { SettingsService } from '../settings/settings.service';
import { normalizeDifficulty, qcmChoiceCount, type Difficulty } from '../../common/difficulty';
import { masteryScore, isMastered } from '../../common/mastery';
import {
  ALL_QUESTION_TYPES,
  type GeoQuestionType,
  type StartGeoSessionDto,
  type RecordGeoAnswerDto,
} from './dto/geo.dto';

interface Pays {
  code: string;
  nom: string;
  drapeau: string;
  capitale: string;
  continent: string;
  oceans: string[];   // vrais océans uniquement (Atlantique, Pacifique, Indien, Arctique, Antarctique)
  mers: string[];     // mers et détroits (Méditerranée, Mer du Nord…) — réservé aux futurs types de questions
  voisins: string[];
  langues: string[];
}

export interface GeoQuestion {
  type: GeoQuestionType;
  item_key: string;
  prompt: string;
  display: string;
  display_type: 'flag' | 'text';
  choices: string[];
  answer: string | null;
  answers: string[] | null;
}

export interface GeoSessionResult {
  session_id: string;
  questions: GeoQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

const TRUE_OCEANS = ['Atlantique', 'Pacifique', 'Indien', 'Arctique', 'Antarctique'];
const SELECT_OCEAN_DISTRACTORS = ['Méditerranée', 'Mer du Nord', 'Mer Rouge', 'Mer des Caraïbes', 'Europe', 'Asie', 'Afrique'];

@Injectable()
export class GeoService {
  private readonly allPays: Pays[];

  constructor(
    @InjectRepository(GeoProgression)
    private readonly progressionRepo: Repository<GeoProgression>,
    @InjectRepository(GeoSession)
    private readonly sessionRepo: Repository<GeoSession>,
    private readonly settingsService: SettingsService,
  ) {
    const jsonPath = path.join(__dirname, 'data', 'pays.json');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as { pays: Pays[] };
    this.allPays = data.pays;
  }

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartGeoSessionDto): Promise<GeoSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const questionsPerSession = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);

    const countriesFilterRaw = await this.settingsService.get('geo_countries_filter');
    const countriesFilter = countriesFilterRaw
      ? new Set(countriesFilterRaw.split(',').map((c) => c.trim()).filter(Boolean))
      : null;

    let activePays = countriesFilter
      ? this.allPays.filter((p) => countriesFilter.has(p.code))
      : [...this.allPays];

    if (dto.continents?.length) {
      const continentSet = new Set(dto.continents);
      activePays = activePays.filter((p) => continentSet.has(p.continent));
    }

    if (activePays.length === 0) activePays = [...this.allPays];

    // Types actifs : filtre admin > types envoyés par le client > tous les types
    const typesFilterRaw = await this.settingsService.get('geo_question_types_filter');
    const adminTypes = typesFilterRaw?.split(',').map((t) => t.trim()).filter(Boolean) as GeoQuestionType[];
    const rawTypes = dto.question_types?.length ? dto.question_types
                   : adminTypes?.length         ? adminTypes
                   : undefined;
    const activeTypes = this.normalizeTypes(rawTypes, activePays);
    const capitalDirection = dto.capital_direction ?? 'forward';

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(activePays, activeTypes, difficulty, choicesCount, count);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      difficulty,
      question_types: activeTypes.join(','),
      continents: dto.continents?.join(',') ?? null,
      capital_direction: capitalDirection,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds, is_unlimited: isUnlimited };
  }

  async recordAnswer(sessionId: string, dto: RecordGeoAnswerDto): Promise<void> {
    const threshold = parseInt((await this.settingsService.get('mastery_threshold')) ?? '10', 10);

    let prog = await this.progressionRepo.findOneBy({ item_key: dto.item_key });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: uuidv4(),
        item_key: dto.item_key,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) {
      prog.correct_count++;
    } else {
      prog.incorrect_count++;
    }
    prog.last_seen = new Date();
    prog.is_mastered = isMastered(masteryScore(prog.correct_count, prog.incorrect_count), threshold);

    await this.progressionRepo.save(prog);
  }

  async completeSession(sessionId: string, correctAnswers: number, totalQuestions: number): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return;
    session.completed_at = new Date();
    session.correct_answers = correctAnswers;
    session.total_questions = totalQuestions;
    await this.sessionRepo.save(session);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  getAllCountries(): { code: string; nom: string; drapeau: string; continent: string }[] {
    return this.allPays.map(({ code, nom, drapeau, continent }) => ({ code, nom, drapeau, continent }));
  }

  async getProgression(): Promise<GeoProgression[]> {
    return this.progressionRepo.find({ order: { item_key: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<GeoSession[]> {
    return this.sessionRepo.find({ order: { started_at: 'DESC' }, take: limit });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Génération ───────────────────────────────────────────────────────────

  private generateQuestions(
    activePays: Pays[],
    activeTypes: GeoQuestionType[],
    difficulty: Difficulty,
    choicesCount: number,
    count: number,
  ): GeoQuestion[] {
    const questions: GeoQuestion[] = [];
    const usedKeys = new Set<string>();
    let attempts = 0;

    while (questions.length < count && attempts < count * 20) {
      attempts++;
      const type = activeTypes[this.rand(0, activeTypes.length - 1)];
      const q = this.generateOne(type, activePays, difficulty, choicesCount);
      if (!q) continue;
      if (usedKeys.has(q.item_key)) continue;
      usedKeys.add(q.item_key);
      questions.push(q);
    }

    return questions;
  }

  private generateOne(
    type: GeoQuestionType,
    activePays: Pays[],
    difficulty: Difficulty,
    choicesCount: number,
  ): GeoQuestion | null {
    switch (type) {
      case 'country_to_capital':   return this.genCountryToCapital(activePays, choicesCount);
      case 'capital_to_country':   return this.genCapitalToCountry(activePays, choicesCount);
      case 'country_to_continent': return this.genCountryToContinent(activePays);
      case 'country_to_ocean':     return this.genCountryToOcean(activePays, choicesCount);
      case 'flag_to_country':      return this.genFlagToCountry(activePays, choicesCount);
      case 'country_to_flag':      return this.genCountryToFlag(activePays, choicesCount);
      case 'odd_one_out':          return this.genOddOneOut(activePays, choicesCount);
      case 'country_to_language':  return this.genCountryToLanguage(activePays, choicesCount);
      case 'select_oceans':        return this.genSelectOceans(difficulty);
      case 'select_continent_countries': return this.genSelectContinentCountries(activePays, difficulty);
      case 'country_borders':      return this.genCountryBorders(activePays, difficulty);
      case 'select_language_countries':  return this.genSelectLanguageCountries(activePays, difficulty);
      default: return null;
    }
  }

  // ── Single-select ──────────────────────────────────────────────────────────

  /** choicesCount=0 → saisie libre pour les types qui le supportent */
  private freeQcm(correct: string, pool: string[], choicesCount: number): string[] {
    if (choicesCount === 0) return []; // saisie libre
    const distractors = this.shuffle(pool.filter((x) => x !== correct));
    return this.shuffle([correct, ...distractors.slice(0, choicesCount - 1)]);
  }

  /** choicesCount=0 → 6 choix pour les types qui ne peuvent pas être en saisie libre */
  private forceQcm(correct: string, pool: string[], choicesCount: number): string[] {
    const n = choicesCount === 0 ? 6 : choicesCount;
    const distractors = this.shuffle(pool.filter((x) => x !== correct));
    return this.shuffle([correct, ...distractors.slice(0, n - 1)]);
  }

  private genCountryToCapital(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p) return null;
    const pool = pays.filter((x) => x.code !== p.code).map((x) => x.capitale);
    return {
      type: 'country_to_capital',
      item_key: `${p.code}_capital`,
      // Le drapeau seul en display : le nom est dans la question → pas de doublon
      prompt: `Quelle est la capitale de ${p.nom} ?`,
      display: p.drapeau,
      display_type: 'flag',
      choices: this.freeQcm(p.capitale, pool, choicesCount),
      answer: p.capitale,
      answers: null,
    };
  }

  private genCapitalToCountry(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p) return null;
    const pool = pays.filter((x) => x.code !== p.code).map((x) => x.nom);
    return {
      type: 'capital_to_country',
      item_key: `${p.code}_capital_rev`,
      // La capitale en grand → question générique sans répétition
      prompt: 'De quel pays est-ce la capitale ?',
      display: p.capitale,
      display_type: 'text',
      choices: this.freeQcm(p.nom, pool, choicesCount),
      answer: p.nom,
      answers: null,
    };
  }

  private genCountryToContinent(pays: Pays[]): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p) return null;
    const continents = [...new Set(pays.map((x) => x.continent))];
    return {
      type: 'country_to_continent',
      item_key: `${p.code}_continent`,
      prompt: `Dans quel continent se trouve ${p.nom} ?`,
      display: p.drapeau,
      display_type: 'flag',
      // Toujours tous les continents actifs (force-QCM, pas de saisie libre)
      choices: this.shuffle(continents),
      answer: p.continent,
      answers: null,
    };
  }

  private genCountryToOcean(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const withOcean = pays.filter((p) => p.oceans.length > 0);
    const p = this.pick(withOcean);
    if (!p) return null;
    const correct = p.oceans[this.rand(0, p.oceans.length - 1)];
    const pool = [...TRUE_OCEANS, 'Méditerranée', 'Mer du Nord', 'Mer Rouge'].filter((o) => o !== correct);
    return {
      type: 'country_to_ocean',
      item_key: `${p.code}_ocean`,
      prompt: `Quel océan borde ${p.nom} ?`,
      display: `${p.drapeau} ${p.nom}`,
      display_type: 'text',
      choices: this.freeQcm(correct, pool, choicesCount),
      answer: correct,
      answers: null,
    };
  }

  private genFlagToCountry(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p) return null;
    const pool = pays.filter((x) => x.code !== p.code).map((x) => x.nom);
    return {
      type: 'flag_to_country',
      item_key: `${p.code}_flag`,
      prompt: 'Quel pays représente ce drapeau ?',
      display: p.drapeau,
      display_type: 'flag',
      // Force-QCM : on ne peut pas deviner un pays en saisie libre depuis un drapeau
      choices: this.forceQcm(p.nom, pool, choicesCount),
      answer: p.nom,
      answers: null,
    };
  }

  private genCountryToFlag(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p) return null;
    const pool = pays.filter((x) => x.code !== p.code).map((x) => x.drapeau);
    return {
      type: 'country_to_flag',
      item_key: `${p.code}_flag_rev`,
      // Le nom seul en grand → question sans répétition
      prompt: 'Quel est son drapeau ?',
      display: p.nom,
      display_type: 'text',
      // Force-QCM : on ne peut pas saisir un emoji drapeau librement
      choices: this.forceQcm(p.drapeau, pool, choicesCount),
      answer: p.drapeau,
      answers: null,
    };
  }

  private genOddOneOut(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const continents = [...new Set(pays.map((p) => p.continent))];
    // Force-QCM (hard → 6 choix) ; minimum 4 pour que la question ait du sens
    const numChoices = Math.max(4, choicesCount === 0 ? 6 : choicesCount);
    const numDecoys = numChoices - 1;

    const validContinents = continents.filter((c) => pays.filter((p) => p.continent === c).length >= numDecoys);
    if (validContinents.length === 0) return null;

    const continent = validContinents[this.rand(0, validContinents.length - 1)];
    const inContinent = pays.filter((p) => p.continent === continent);
    const outContinent = pays.filter((p) => p.continent !== continent);
    if (outContinent.length === 0) return null;

    const correct = this.pick(outContinent)!;
    const decoys = this.shuffle(inContinent).slice(0, numDecoys);
    if (decoys.length < numDecoys) return null;

    return {
      type: 'odd_one_out',
      item_key: `oddout_${continent}_${correct.code}`,
      prompt: `Quel pays ne se trouve PAS en ${continent} ?`,
      display: continent,
      display_type: 'text',
      choices: this.shuffle([correct.nom, ...decoys.map((p) => p.nom)]),
      answer: correct.nom,
      answers: null,
    };
  }

  private genCountryToLanguage(pays: Pays[], choicesCount: number): GeoQuestion | null {
    const p = this.pick(pays);
    if (!p || p.langues.length === 0) return null;
    const correct = p.langues[0];
    const pool = [...new Set(pays.flatMap((x) => x.langues))].filter((l) => l !== correct);
    return {
      type: 'country_to_language',
      item_key: `${p.code}_lang`,
      prompt: `Quelle langue parle-t-on principalement en ${p.nom} ?`,
      display: `${p.drapeau} ${p.nom}`,
      display_type: 'text',
      choices: this.freeQcm(correct, pool, choicesCount),
      answer: correct,
      answers: null,
    };
  }

  // ── Multi-select ───────────────────────────────────────────────────────────

  private distractorCount(difficulty: Difficulty): number {
    if (difficulty === 'easy') return 2;
    if (difficulty === 'hard') return 6;
    return 4;
  }

  private genSelectOceans(difficulty: Difficulty): GeoQuestion {
    const extra = this.distractorCount(difficulty);
    const distractors = this.shuffle(SELECT_OCEAN_DISTRACTORS).slice(0, extra);
    return {
      type: 'select_oceans',
      item_key: 'select_oceans',
      prompt: 'Sélectionne tous les vrais océans',
      display: '🌊',
      display_type: 'text',
      choices: this.shuffle([...TRUE_OCEANS, ...distractors]),
      answer: null,
      answers: [...TRUE_OCEANS],
    };
  }

  private genSelectContinentCountries(pays: Pays[], difficulty: Difficulty): GeoQuestion | null {
    const continents = [...new Set(pays.map((p) => p.continent))];
    const validContinents = continents.filter((c) => pays.filter((p) => p.continent === c).length >= 2);
    if (validContinents.length === 0) return null;

    const continent = validContinents[this.rand(0, validContinents.length - 1)];
    const correct = pays.filter((p) => p.continent === continent).map((p) => p.nom);
    const distractors = this.shuffle(pays.filter((p) => p.continent !== continent).map((p) => p.nom))
      .slice(0, this.distractorCount(difficulty));

    return {
      type: 'select_continent_countries',
      item_key: `select_continent_${continent}`,
      prompt: `Sélectionne tous les pays d'${continent} dans la liste`,
      display: continent,
      display_type: 'text',
      choices: this.shuffle([...correct, ...distractors]),
      answer: null,
      answers: correct,
    };
  }

  private genCountryBorders(pays: Pays[], difficulty: Difficulty): GeoQuestion | null {
    const codeSet = new Set(pays.map((p) => p.code));
    const withBorders = pays.filter((p) => p.voisins.some((v) => codeSet.has(v)));
    const p = this.pick(withBorders);
    if (!p) return null;

    const activeBorders = p.voisins.filter((v) => codeSet.has(v));
    const correctNames = activeBorders.map((code) => pays.find((x) => x.code === code)!.nom);
    const distractors = this.shuffle(pays.filter((x) => !activeBorders.includes(x.code) && x.code !== p.code).map((x) => x.nom))
      .slice(0, this.distractorCount(difficulty));

    return {
      type: 'country_borders',
      item_key: `${p.code}_borders`,
      prompt: `Quels pays de la liste sont frontaliers de ${p.nom} ?`,
      display: p.drapeau,
      display_type: 'flag',
      choices: this.shuffle([...correctNames, ...distractors]),
      answer: null,
      answers: correctNames,
    };
  }

  private genSelectLanguageCountries(pays: Pays[], difficulty: Difficulty): GeoQuestion | null {
    const allLangs = [...new Set(pays.flatMap((p) => p.langues))];
    const validLangs = allLangs.filter((l) => pays.filter((p) => p.langues.includes(l)).length >= 2);
    if (validLangs.length === 0) return null;

    const lang = validLangs[this.rand(0, validLangs.length - 1)];
    const correct = pays.filter((p) => p.langues.includes(lang)).map((p) => p.nom);
    const distractors = this.shuffle(pays.filter((p) => !p.langues.includes(lang)).map((p) => p.nom))
      .slice(0, this.distractorCount(difficulty));

    return {
      type: 'select_language_countries',
      item_key: `select_lang_${lang}`,
      prompt: `Quels pays de la liste parlent ${lang} ?`,
      display: lang,
      display_type: 'text',
      choices: this.shuffle([...correct, ...distractors]),
      answer: null,
      answers: correct,
    };
  }

  // ─── Utilitaires ──────────────────────────────────────────────────────────

  private normalizeTypes(raw: GeoQuestionType[] | undefined, activePays: Pays[]): GeoQuestionType[] {
    const valid = (raw?.length ? raw : [...ALL_QUESTION_TYPES]) as GeoQuestionType[];
    // Supprimer les types impossibles avec le set de pays actifs
    return valid.filter((t) => {
      if (t === 'country_to_ocean') return activePays.some((p) => p.oceans.length > 0);
      if (t === 'odd_one_out') {
        return [...new Set(activePays.map((p) => p.continent))]
          .some((c) => activePays.filter((p) => p.continent === c).length >= 3);
      }
      if (t === 'country_borders') {
        const codes = new Set(activePays.map((p) => p.code));
        return activePays.some((p) => p.voisins.some((v) => codes.has(v)));
      }
      if (t === 'select_continent_countries') {
        return [...new Set(activePays.map((p) => p.continent))]
          .some((c) => activePays.filter((p) => p.continent === c).length >= 2);
      }
      if (t === 'select_language_countries') {
        const allLangs = [...new Set(activePays.flatMap((p) => p.langues))];
        return allLangs.some((l) => activePays.filter((p) => p.langues.includes(l)).length >= 2);
      }
      return true;
    });
  }

  private pick<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    return arr[this.rand(0, arr.length - 1)];
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
