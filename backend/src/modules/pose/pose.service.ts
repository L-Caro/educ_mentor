import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoseProgression } from './entities/pose-progression.entity';
import { PoseSession } from './entities/pose-session.entity';
import { SettingsService } from '../settings/settings.service';
import { isMastered, masteryScore } from '../../common/mastery';
import { normalizeDifficulty } from '../../common/difficulty';
import {
  computeRetenues,
  generatePose,
  type MethodeSoustraction,
  type PoseOperation,
  type Retenues,
} from './pose.generator';
import type {
  CompletePoseSessionDto,
  RecordPoseAnswerDto,
  StartPoseSessionDto,
} from './dto/pose.dto';

/** Ce que l'enfant voit et remplit. Les retenues sont calculées ici, jamais dans le
 * navigateur : leur écriture dépend de la méthode enseignée, et c'est une règle
 * pédagogique qui doit rester testable. */
export interface PoseSessionQuestion {
  skill_key: string;
  operation: PoseOperation;
  operands: number[];
  answer: number;
  answer_length: number;
  /** Nombre de colonnes de la grille, retenue de tête comprise. */
  columns: number;
  retenues: Retenues;
  /** Les retenues sont-elles montrées ? remplies ? Dérivé de la difficulté. */
  carry_display: 'filled' | 'empty' | 'hidden';
}

export interface PoseSessionResult {
  session_id: string;
  questions: PoseSessionQuestion[];
  /** Toujours 0 : c'est un atelier, pas une course. Un compte à rebours contredirait
   *  l'intention, même si un minuteur global est réglé pour les autres modules. */
  timer_seconds: 0;
  is_unlimited: boolean;
  method: MethodeSoustraction;
}

const CARRY_BY_DIFFICULTY = {
  easy: 'filled',
  medium: 'empty',
  hard: 'hidden',
} as const;

const MIN_DIGITS = 2;
const MAX_DIGITS = 10;

@Injectable()
export class PoseService {
  constructor(
    @InjectRepository(PoseProgression)
    private readonly progressionRepo: Repository<PoseProgression>,
    @InjectRepository(PoseSession)
    private readonly sessionRepo: Repository<PoseSession>,
    private readonly settingsService: SettingsService,
  ) {}

  async startSession(dto: StartPoseSessionDto): Promise<PoseSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const method = await this.readMethod();
    const digits = await this.readDigits();

    const perSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );
    const isUnlimited = perSession === 0;
    const count = isUnlimited ? 20 : perSession;

    const operations: PoseOperation[] = dto.operations?.length
      ? dto.operations
      : ['addition', 'soustraction'];

    const questions: PoseSessionQuestion[] = [];
    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
      attempts++;
      const operation =
        operations[Math.floor(Math.random() * operations.length)];
      const base = generatePose(operation, {
        digits,
        carry: 'any',
        rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      });
      if (!base) continue;

      const [a, b] = base.operands;
      questions.push({
        ...base,
        // Une colonne de plus que la plus longue opérande : une addition peut déborder.
        columns: Math.max(String(a).length, String(b).length) + 1,
        retenues: computeRetenues(operation, a, b, method),
        carry_display: CARRY_BY_DIFFICULTY[difficulty],
      });
    }

    const session = this.sessionRepo.create({
      id: randomUUID(),
      difficulty,
      operations: operations.join(','),
      timer_seconds: 0,
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: 0,
      is_unlimited: isUnlimited,
      method,
    };
  }

  async recordAnswer(dto: RecordPoseAnswerDto): Promise<void> {
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
    dto: CompletePoseSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correct_answers;
    session.total_questions = dto.total_questions;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  getProgression(): Promise<PoseProgression[]> {
    return this.progressionRepo.find({ order: { skill_key: 'ASC' } });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  /** Réglage administrateur : la méthode enseignée par la maîtresse. */
  private async readMethod(): Promise<MethodeSoustraction> {
    const raw = await this.settingsService.get('pose_subtraction_method');
    return raw === 'cassage' ? 'cassage' : 'compensation';
  }

  /** Réglage administrateur, borné : une valeur aberrante en base ne doit pas produire
   * une grille de cent colonnes ni une opération à zéro chiffre. */
  private async readDigits(): Promise<number> {
    const raw = parseInt(
      (await this.settingsService.get('pose_digits')) ?? '3',
      10,
    );
    if (Number.isNaN(raw)) return 3;
    return Math.min(MAX_DIGITS, Math.max(MIN_DIGITS, raw));
  }
}
