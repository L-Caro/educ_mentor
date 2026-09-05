import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccordsSession } from './entities/accords-session.entity';
import { AccordsProgression } from './entities/accords-progression.entity';
import { SettingsService } from '../settings/settings.service';
import { isMastered, masteryScore } from '../../common/mastery';
import { normalizeDifficulty } from '../../common/difficulty';
import {
  DEFAULT_ACTIVE_NOTIONS,
  NOTIONS,
  getNotion,
  isNotionKey,
  type NotionKey,
} from './accords.notions';
import {
  DEFAULT_ACTIVE_FAMILLES,
  FAMILLES,
  isFamilleKey,
  type FamilleKey,
} from './accords.familles';
import {
  QUESTION_TYPES,
  generateQuestions,
  isQuestionType,
  type AccordsQuestion,
  type QuestionType,
} from './accords.logic';
import type {
  CompleteAccordsSessionDto,
  RecordAccordsAnswerDto,
  StartAccordsSessionDto,
} from './dto/accords.dto';

export interface AccordsSessionResult {
  session_id: string;
  questions: AccordsQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

const SETTING_ACTIVE_NOTIONS = 'accords_notions_actives';
const SETTING_ACTIVE_FAMILLES = 'accords_familles_actives';

@Injectable()
export class AccordsService {
  constructor(
    @InjectRepository(AccordsSession)
    private readonly sessionRepo: Repository<AccordsSession>,
    @InjectRepository(AccordsProgression)
    private readonly progressionRepo: Repository<AccordsProgression>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Jeu ──────────────────────────────────────────────────────────────────

  /** Construire les questions, et RIEN d'autre : aucune écriture en base.
   *
   * Séparé de `startSession` pour le péage des jeux, qui a besoin d'une question mais pas
   * d'une séance. Sans cette coupure, chaque partie de morpion aurait déposé une séance
   * fantôme d'une question dans « séances récentes » — la liste que lit l'adulte pour
   * savoir ce qui a été travaillé.
   *
   * La description de la séance sort d'ici elle aussi : elle se compose des mêmes
   * variables que les questions, et la recalculer dans `startSession` aurait été un
   * deuxième endroit à tenir d'accord avec le premier.
   */
  async construireQuestions(dto: StartAccordsSessionDto): Promise<{
    resultat: Omit<AccordsSessionResult, 'session_id'>;
    seance: Partial<AccordsSession>;
  }> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const notionsActives = await this.getActiveNotionKeys();

    const requestedTypes = (dto.question_types ?? []).filter(isQuestionType);
    const types: QuestionType[] =
      requestedTypes.length > 0 ? requestedTypes : QUESTION_TYPES;

    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const perSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );
    const isUnlimited = perSession === 0;
    const count = isUnlimited ? 50 : perSession;

    const questions = generateQuestions(
      count,
      types,
      difficulty,
      notionsActives,
      this.rand,
      await this.getActiveFamilleKeys(),
    );

    if (questions.length === 0) {
      throw new BadRequestException(
        this.messageAucuneQuestion(types, notionsActives),
      );
    }

    return {
      resultat: {
        questions,
        timer_seconds: timerSeconds,
        is_unlimited: isUnlimited,
      },
      seance: {
        difficulty,
        question_types: types.join(','),
        timer_seconds: timerSeconds,
      },
    };
  }

  async startSession(
    dto: StartAccordsSessionDto,
  ): Promise<AccordsSessionResult> {
    const { resultat, seance } = await this.construireQuestions(dto);

    const session = this.sessionRepo.create({ id: randomUUID(), ...seance });
    await this.sessionRepo.save(session);

    return { session_id: session.id, ...resultat };
  }

  /** Un message qui dit quoi faire. Ici le type d'exercice EST la notion, donc ce qui
   * bloque se nomme sans détour — contrairement au module grammaire, où il faut remonter
   * du type d'exercice aux notions qu'il suppose. */
  private messageAucuneQuestion(
    types: QuestionType[],
    notionsActives: NotionKey[],
  ): string {
    const manquantes = types.filter((type) => !notionsActives.includes(type));
    if (manquantes.length === 0) {
      return 'Aucune question possible avec ces réglages.';
    }
    const libelles = manquantes
      .map((notion) => getNotion(notion).label)
      .join(', ');
    return `Ces exercices ne sont pas encore activés (${libelles}). Active-les dans Administration → Accords.`;
  }

  async recordAnswer(dto: RecordAccordsAnswerDto): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({
      skill_key: dto.skill_key,
    });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
        skill_key: dto.skill_key,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) prog.correct_count++;
    else prog.incorrect_count++;
    prog.last_seen = new Date();
    prog.is_mastered = isMastered(
      masteryScore(prog.correct_count, prog.incorrect_count),
      threshold,
    );

    await this.progressionRepo.save(prog);
  }

  async completeSession(
    sessionId: string,
    dto: CompleteAccordsSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correct_answers;
    session.total_questions = dto.total_questions;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  // ─── Admin — progression ──────────────────────────────────────────────────

  getProgression(): Promise<AccordsProgression[]> {
    return this.progressionRepo.find({ order: { skill_key: 'ASC' } });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Admin — notions actives ──────────────────────────────────────────────

  getNotions() {
    return NOTIONS;
  }

  async getActiveNotionKeys(): Promise<NotionKey[]> {
    const raw = await this.settingsService.get(SETTING_ACTIVE_NOTIONS);
    try {
      const parsed = JSON.parse(raw ?? '[]') as unknown;
      const valid = Array.isArray(parsed) ? parsed.filter(isNotionKey) : [];
      return valid.length > 0 ? valid : DEFAULT_ACTIVE_NOTIONS;
    } catch {
      return DEFAULT_ACTIVE_NOTIONS;
    }
  }

  async setActiveNotionKeys(keys: NotionKey[]): Promise<NotionKey[]> {
    const valid = keys.filter(isNotionKey);
    await this.settingsService.set(
      SETTING_ACTIVE_NOTIONS,
      JSON.stringify(valid),
    );
    return valid;
  }

  // ─── Admin — familles morphologiques ──────────────────────────────────────

  /** Le catalogue COMPLET, du CE1 au CM2, ouvertes comme fermées. L'administration doit
   * voir les fermées — sinon il n'y a rien à ouvrir. */
  getFamilles() {
    return FAMILLES;
  }

  async getActiveFamilleKeys(): Promise<FamilleKey[]> {
    const raw = await this.settingsService.get(SETTING_ACTIVE_FAMILLES);
    try {
      const parsed = JSON.parse(raw ?? '[]') as unknown;
      const valid = Array.isArray(parsed) ? parsed.filter(isFamilleKey) : [];
      return valid.length > 0 ? valid : DEFAULT_ACTIVE_FAMILLES;
    } catch {
      return DEFAULT_ACTIVE_FAMILLES;
    }
  }

  async setActiveFamilleKeys(keys: string[]): Promise<FamilleKey[]> {
    const valid = keys.filter(isFamilleKey);
    await this.settingsService.set(
      SETTING_ACTIVE_FAMILLES,
      JSON.stringify(valid),
    );
    return valid;
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  // `this: void` : passée telle quelle en callback à `generateQuestions`, comme dans
  // `geometrie.service.ts` — sans l'annotation, un `this` désynchronisé serait un piège.
  private rand(this: void, min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
