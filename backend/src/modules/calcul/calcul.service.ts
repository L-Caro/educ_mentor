import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CalculProgression } from './entities/calcul-progression.entity';
import { CalculSession } from './entities/calcul-session.entity';
import { SettingsService } from '../settings/settings.service';
import type { RecordCalculAnswerDto } from './dto/calcul.dto';

export interface CalculQuestion {
  operation: string;
  answer: number;
}

export interface CalculSessionResult {
  session_id: string;
  questions: CalculQuestion[];
  timer_seconds: number;
  min_value: number;
  max_value: number;
  is_unlimited: boolean;
}

type OperationType = 'complement' | 'addition' | 'soustraction' | 'double' | 'moitie';
const VALID_OPERATION_TYPES: OperationType[] = ['complement', 'addition', 'soustraction', 'double', 'moitie'];

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

  async startSession(): Promise<CalculSessionResult> {
    const minValue = parseInt((await this.settingsService.get('calcul_min_value')) ?? '0', 10);
    const maxValue = parseInt((await this.settingsService.get('calcul_max_value')) ?? '20', 10);
    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const questionsPerSession = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);
    const operationTypesRaw = (await this.settingsService.get('calcul_operation_types')) ?? 'complement,addition,soustraction';

    const parsedTypes = operationTypesRaw
      .split(',')
      .map((rawType) => rawType.trim())
      .filter((rawType): rawType is OperationType => VALID_OPERATION_TYPES.includes(rawType as OperationType));
    const operationTypes: OperationType[] = parsedTypes.length > 0 ? parsedTypes : ['complement', 'addition', 'soustraction'];

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(count, minValue, maxValue, operationTypes);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      min_value: minValue,
      max_value: maxValue,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds, min_value: minValue, max_value: maxValue, is_unlimited: isUnlimited };
  }

  async recordAnswer(sessionId: string, dto: RecordCalculAnswerDto): Promise<void> {
    const threshold = parseInt((await this.settingsService.get('calcul_mastery_threshold')) ?? '3', 10);

    let prog = await this.progressionRepo.findOneBy({ answer_value: dto.answer_value });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: uuidv4(),
        answer_value: dto.answer_value,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) {
      prog.correct_count++;
      if (!prog.is_mastered && prog.correct_count >= threshold) {
        prog.is_mastered = true;
      }
    } else {
      prog.incorrect_count++;
    }
    prog.last_seen = new Date();

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
      } while ((operation === lastOperation || operation === '') && attempts < 20);

      if (operation) {
        lastOperation = operation;
        questions.push({ operation, answer });
      }
    }

    return questions;
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
