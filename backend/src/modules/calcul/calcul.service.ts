import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalculProgression } from './entities/calcul-progression.entity';
import { CalculSession } from './entities/calcul-session.entity';
import { SettingsService } from '../settings/settings.service';
import type {
  RecordCalculAnswerDto,
  StartCalculSessionDto,
} from './dto/calcul.dto';
import { masteryScore, isMastered } from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';
import { randomUUID } from 'node:crypto';

export interface CalculQuestion {
  operation: string;
  answer: number;
  choices: number[]; // QCM : 2 ou 4 ; saisie libre : []
}

export interface CalculSessionResult {
  session_id: string;
  questions: CalculQuestion[];
  timer_seconds: number;
  min_value: number;
  max_value: number;
  is_unlimited: boolean;
}

type OperationType =
  | 'complement'
  | 'addition'
  | 'soustraction'
  | 'double'
  | 'moitie';
const VALID_OPERATION_TYPES: OperationType[] = [
  'complement',
  'addition',
  'soustraction',
  'double',
  'moitie',
];

@Injectable()
export class CalculService {
  constructor(
    @InjectRepository(CalculProgression)
    private readonly progressionRepo: Repository<CalculProgression>,
    @InjectRepository(CalculSession)
    private readonly sessionRepo: Repository<CalculSession>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartCalculSessionDto): Promise<CalculSessionResult> {
    const minValue = parseInt(
      (await this.settingsService.get('calcul_min_value')) ?? '0',
      10,
    );
    const maxValue = parseInt(
      (await this.settingsService.get('calcul_max_value')) ?? '20',
      10,
    );
    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const questionsPerSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );

    // Types d'opérations = choix de pré-jeu (body) ; fallback sur les 3 de base si rien de valide.
    const requestedTypes = (dto.operation_types ?? []).filter(
      (rawType): rawType is OperationType =>
        VALID_OPERATION_TYPES.includes(rawType as OperationType),
    );
    const operationTypes: OperationType[] =
      requestedTypes.length > 0
        ? requestedTypes
        : ['complement', 'addition', 'soustraction'];

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    // Difficulté = choix de pré-jeu enfant ; pilote le nombre de choix QCM (0 = saisie libre).
    const choicesCount = qcmChoiceCount(normalizeDifficulty(dto.difficulty));

    const questions = this.generateQuestions(
      count,
      minValue,
      maxValue,
      operationTypes,
      choicesCount,
    );

    const session = this.sessionRepo.create({
      id: randomUUID(),
      min_value: minValue,
      max_value: maxValue,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: timerSeconds,
      min_value: minValue,
      max_value: maxValue,
      is_unlimited: isUnlimited,
    };
  }

  async recordAnswer(
    sessionId: string,
    dto: RecordCalculAnswerDto,
  ): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({
      answer_value: dto.answer_value,
    });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
        answer_value: dto.answer_value,
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

    prog.is_mastered = isMastered(
      masteryScore(prog.correct_count, prog.incorrect_count),
      threshold,
    );

    await this.progressionRepo.save(prog);
  }

  async completeSession(
    sessionId: string,
    correctAnswers: number,
    totalQuestions: number,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return;
    session.completed_at = new Date();
    session.correct_answers = correctAnswers;
    session.total_questions = totalQuestions;
    await this.sessionRepo.save(session);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getProgression(): Promise<CalculProgression[]> {
    return this.progressionRepo.find({ order: { answer_value: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<CalculSession[]> {
    return this.sessionRepo.find({
      order: { started_at: 'DESC' },
      take: limit,
    });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private generateQuestions(
    count: number,
    minValue: number,
    maxValue: number,
    types: OperationType[],
    choicesCount: number,
  ): CalculQuestion[] {
    const questions: CalculQuestion[] = [];
    let lastOperation = '';

    for (let questionIndex = 0; questionIndex < count; questionIndex++) {
      let operation = '';
      let answer = 0;
      let attempts = 0;

      do {
        const type = types[Math.floor(Math.random() * types.length)];
        const generated = this.generateForType(type, minValue, maxValue);
        if (generated) {
          operation = generated.operation;
          answer = generated.answer;
        }
        attempts++;
      } while (
        (operation === lastOperation || operation === '') &&
        attempts < 20
      );

      if (operation) {
        lastOperation = operation;
        // QCM (choicesCount > 0) : distracteurs plausibles ; saisie libre : aucun choix.
        const choices =
          choicesCount > 0 ? this.buildChoices(answer, choicesCount - 1) : [];
        questions.push({ operation, answer, choices });
      }
    }

    return questions;
  }

  /** Distracteurs plausibles autour de la réponse (±1, ±2, ±5, ±10) pour le QCM. */
  private buildChoices(answer: number, distractorCount: number): number[] {
    const candidates = new Set<number>([
      answer + 1,
      answer - 1,
      answer + 2,
      answer - 2,
      answer + 5,
      answer - 5,
      answer + 10,
      answer - 10,
    ]);
    candidates.delete(answer);

    const distractors: number[] = [];
    for (const value of this.shuffle([...candidates])) {
      if (value >= 0) {
        distractors.push(value);
        if (distractors.length >= distractorCount) break;
      }
    }
    // Filet de sécurité si trop peu de candidats valides (petits nombres)
    let fallback = answer + 3;
    while (distractors.length < distractorCount) {
      if (fallback !== answer && fallback >= 0) distractors.push(fallback);
      fallback++;
    }

    return this.shuffle([answer, ...distractors.slice(0, distractorCount)]);
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private generateForType(
    type: OperationType,
    minValue: number,
    maxValue: number,
  ): { operation: string; answer: number } | null {
    switch (type) {
      case 'complement': {
        const resultMin = Math.max(2, minValue + 1);
        if (resultMin > maxValue) return null;
        const result = this.rand(resultMin, maxValue);
        const known = this.rand(1, result - 1);
        const answer = result - known;
        const form = this.rand(0, 2);
        let operation: string;
        if (form === 0) operation = `${known} + ? = ${result}`;
        else if (form === 1) operation = `? + ${known} = ${result}`;
        else operation = `${known} pour aller à ${result}`;
        return { operation, answer };
      }
      case 'addition': {
        const sumMin = Math.max(2, minValue + 1);
        if (sumMin > maxValue) return null;
        const answer = this.rand(sumMin, maxValue);
        const firstAddend = this.rand(1, answer - 1);
        const secondAddend = answer - firstAddend;
        return { operation: `${firstAddend} + ${secondAddend} = ?`, answer };
      }
      case 'soustraction': {
        const minuendMin = Math.max(2, minValue + 1);
        if (minuendMin > maxValue) return null;
        const minuend = this.rand(minuendMin, maxValue);
        const subtrahend = this.rand(1, minuend - 1);
        const answer = minuend - subtrahend;
        return { operation: `${minuend} - ${subtrahend} = ?`, answer };
      }
      case 'double': {
        const maxDouble = Math.floor(maxValue / 2);
        if (maxDouble < 1) return null;
        const number = this.rand(1, maxDouble);
        return { operation: `Double de ${number} = ?`, answer: number * 2 };
      }
      case 'moitie': {
        const maxEven = Math.floor(maxValue / 2) * 2;
        if (maxEven < 2) return null;
        const even = this.rand(1, maxEven / 2) * 2;
        return { operation: `Moitié de ${even} = ?`, answer: even / 2 };
      }
    }
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
