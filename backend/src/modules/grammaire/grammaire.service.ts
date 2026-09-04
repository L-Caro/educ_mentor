import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrammaireSession } from './entities/grammaire-session.entity';
import { GrammaireProgression } from './entities/grammaire-progression.entity';
import { SettingsService } from '../settings/settings.service';
import { isMastered, masteryScore } from '../../common/mastery';
import { normalizeDifficulty } from '../../common/difficulty';
import {
  DEFAULT_ACTIVE_NOTIONS,
  NOTIONS,
  getNotion,
  isNotionKey,
  type NotionKey,
} from './grammaire.notions';
import {
  QUESTION_TYPES,
  generateQuestions,
  isQuestionType,
  notionsRequises,
  type GrammaireQuestion,
  type QuestionType,
} from './grammaire.logic';
import type {
  CompleteGrammaireSessionDto,
  RecordGrammaireAnswerDto,
  StartGrammaireSessionDto,
} from './dto/grammaire.dto';

export interface GrammaireSessionResult {
  session_id: string;
  questions: GrammaireQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

const SETTING_ACTIVE_NOTIONS = 'grammaire_notions_actives';

@Injectable()
export class GrammaireService {
  constructor(
    @InjectRepository(GrammaireSession)
    private readonly sessionRepo: Repository<GrammaireSession>,
    @InjectRepository(GrammaireProgression)
    private readonly progressionRepo: Repository<GrammaireProgression>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Jeu ──────────────────────────────────────────────────────────────────

  async startSession(
    dto: StartGrammaireSessionDto,
  ): Promise<GrammaireSessionResult> {
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
    );

    if (questions.length === 0) {
      throw new BadRequestException(
        this.messageAucuneQuestion(types, notionsActives),
      );
    }

    const session = this.sessionRepo.create({
      id: randomUUID(),
      difficulty,
      question_types: types.join(','),
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: timerSeconds,
      is_unlimited: isUnlimited,
    };
  }

  /** Un message qui dit quoi faire. « Aucune question disponible » laisse l'enfant devant
   * un mur : ce qui bloque est toujours une notion pas encore activée, alors on la nomme. */
  private messageAucuneQuestion(
    types: QuestionType[],
    notionsActives: NotionKey[],
  ): string {
    const manquantes = notionsRequises(types).filter(
      (notion) => !notionsActives.includes(notion),
    );
    if (manquantes.length === 0) {
      return 'Aucune question possible avec ces réglages.';
    }
    const libelles = manquantes
      .map((notion) => getNotion(notion).singulier)
      .join(', ');
    return `Ces exercices demandent des notions qui ne sont pas encore activées (${libelles}). Active-les dans Administration → Grammaire.`;
  }

  async recordAnswer(dto: RecordGrammaireAnswerDto): Promise<void> {
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
    dto: CompleteGrammaireSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correct_answers;
    session.total_questions = dto.total_questions;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  // ─── Admin — progression ──────────────────────────────────────────────────

  getProgression(): Promise<GrammaireProgression[]> {
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

  // ─── Utils ────────────────────────────────────────────────────────────────

  // `this: void` : passée telle quelle en callback à `generateQuestions`, comme dans
  // `geometrie.service.ts` — sans l'annotation, un `this` désynchronisé serait un piège.
  private rand(this: void, min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
