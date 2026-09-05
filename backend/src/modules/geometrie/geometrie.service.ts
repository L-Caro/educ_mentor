import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeometrieSession } from './entities/geometrie-session.entity';
import { GeometrieProgression } from './entities/geometrie-progression.entity';
import { SettingsService } from '../settings/settings.service';
import { isMastered, masteryScore } from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';
import {
  DEFAULT_ACTIVE_SHAPES,
  SHAPES,
  getShape,
  isShapeKey,
  type ShapeMeta,
} from './geometrie.shapes';
import {
  QUESTION_TYPES,
  generateQuestions,
  isQuestionType,
  type GeometrieQuestion,
  type QuestionType,
} from './geometrie.logic';
import type {
  CompleteGeometrieSessionDto,
  RecordGeometrieAnswerDto,
  StartGeometrieSessionDto,
} from './dto/geometrie.dto';

/** La question telle qu'envoyée au front : les propriétés complètes des formes en jeu
 * sont attachées ici, pas dans `geometrie.logic.ts` : la génération reste pure et légère,
 * et le front construit sa fiche d'erreur sans dupliquer le catalogue de métadonnées. */
export interface GeometrieSessionQuestion extends GeometrieQuestion {
  shape_meta: ShapeMeta;
  shape_b_meta: ShapeMeta | null;
}

export interface GeometrieSessionResult {
  session_id: string;
  questions: GeometrieSessionQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

@Injectable()
export class GeometrieService {
  constructor(
    @InjectRepository(GeometrieSession)
    private readonly sessionRepo: Repository<GeometrieSession>,
    @InjectRepository(GeometrieProgression)
    private readonly progressionRepo: Repository<GeometrieProgression>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Jeu ──────────────────────────────────────────────────────────────────

  async startSession(
    dto: StartGeometrieSessionDto,
  ): Promise<GeometrieSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    const activeShapeKeys = await this.getActiveShapeKeys();
    const activeShapes = SHAPES.filter((shape) =>
      activeShapeKeys.includes(shape.key),
    );

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

    const generated = generateQuestions(
      count,
      types,
      activeShapes,
      choicesCount,
      this.rand,
    );

    if (generated.length === 0) {
      throw new BadRequestException(
        'Aucune question possible avec ces réglages : active plus de figures dans Administration → Géométrie.',
      );
    }

    const questions: GeometrieSessionQuestion[] = generated.map((question) => ({
      ...question,
      shape_meta: getShape(question.shape),
      shape_b_meta: question.shapeB ? getShape(question.shapeB) : null,
    }));

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

  async recordAnswer(dto: RecordGeometrieAnswerDto): Promise<void> {
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
    dto: CompleteGeometrieSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correct_answers;
    session.total_questions = dto.total_questions;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  // ─── Admin : progression ──────────────────────────────────────────────────

  getProgression(): Promise<GeometrieProgression[]> {
    return this.progressionRepo.find({ order: { skill_key: 'ASC' } });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Admin : figures actives ──────────────────────────────────────────────

  getShapes() {
    return SHAPES;
  }

  async getActiveShapeKeys(): Promise<string[]> {
    const raw = await this.settingsService.get('geometrie_active_figures');
    try {
      const parsed = JSON.parse(raw ?? '[]') as unknown;
      const valid = Array.isArray(parsed) ? parsed.filter(isShapeKey) : [];
      return valid.length > 0 ? valid : DEFAULT_ACTIVE_SHAPES;
    } catch {
      return DEFAULT_ACTIVE_SHAPES;
    }
  }

  async setActiveShapeKeys(keys: string[]): Promise<string[]> {
    const valid = keys.filter(isShapeKey);
    await this.settingsService.set(
      'geometrie_active_figures',
      JSON.stringify(valid),
    );
    return valid;
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  // `this: void` : cette méthode n'utilise jamais `this`, elle est passée telle quelle en
  // callback à `generateQuestions`, sans l'annotation, un `this` désynchronisé y serait
  // un piège classique.
  private rand(this: void, min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
