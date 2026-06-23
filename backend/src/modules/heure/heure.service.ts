import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { HeureProgression } from './entities/heure-progression.entity';
import { HeureSession } from './entities/heure-session.entity';
import { SettingsService } from '../settings/settings.service';
import type { RecordHeureAnswerDto, StartHeureSessionDto } from './dto/heure.dto';
import { masteryScore, isMastered } from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';

export type NumeralType = 'arabic' | 'roman';

export interface HeureQuestion {
  hour: number;
  minute: number;
  answer_value: number;   // minutes depuis minuit : hour * 60 + minute
  numeral_type: NumeralType;
  choices: number[];      // minutes depuis minuit ; vide si saisie libre
}

export interface HeureSessionResult {
  session_id: string;
  questions: HeureQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

const DISTRACTOR_OFFSETS = [5, 10, 15, 30, 60, 90];

@Injectable()
export class HeureService {
  constructor(
    @InjectRepository(HeureProgression)
    private readonly progressionRepo: Repository<HeureProgression>,
    @InjectRepository(HeureSession)
    private readonly sessionRepo: Repository<HeureSession>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartHeureSessionDto): Promise<HeureSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);
    const numeralTypeSetting = dto.numeral_type ?? 'arabic';

    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const questionsPerSession = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(count, numeralTypeSetting, choicesCount);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      difficulty,
      numeral_type: numeralTypeSetting,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds, is_unlimited: isUnlimited };
  }

  async recordAnswer(sessionId: string, dto: RecordHeureAnswerDto): Promise<void> {
    const threshold = parseInt((await this.settingsService.get('mastery_threshold')) ?? '10', 10);

    let progression = await this.progressionRepo.findOneBy({ answer_value: dto.answer_value });

    if (!progression) {
      progression = this.progressionRepo.create({
        id: uuidv4(),
        answer_value: dto.answer_value,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) {
      progression.correct_count++;
    } else {
      progression.incorrect_count++;
    }
    progression.last_seen = new Date();
    progression.is_mastered = isMastered(masteryScore(progression.correct_count, progression.incorrect_count), threshold);

    await this.progressionRepo.save(progression);
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

  async getProgression(): Promise<HeureProgression[]> {
    return this.progressionRepo.find({ order: { answer_value: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<HeureSession[]> {
    return this.sessionRepo.find({ order: { started_at: 'DESC' }, take: limit });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Génération ───────────────────────────────────────────────────────────

  private generateQuestions(count: number, numeralTypeSetting: string, choicesCount: number): HeureQuestion[] {
    const questions: HeureQuestion[] = [];
    const usedValues = new Set<number>();
    let attempts = 0;

    while (questions.length < count && attempts < count * 5) {
      attempts++;
      const hour = this.rand(0, 23);
      const minute = this.rand(0, 59);
      const answerValue = hour * 60 + minute;

      if (usedValues.has(answerValue)) continue;
      usedValues.add(answerValue);

      const numeralType: NumeralType =
        numeralTypeSetting === 'random'
          ? this.rand(0, 1) === 0 ? 'arabic' : 'roman'
          : numeralTypeSetting === 'roman' ? 'roman' : 'arabic';

      const choices = choicesCount > 0 ? this.generateChoices(answerValue, choicesCount) : [];

      questions.push({ hour, minute, answer_value: answerValue, numeral_type: numeralType, choices });
    }

    return questions;
  }

  /** Génère `size` choix QCM. Le miroir AM/PM est systématiquement inclus comme premier distracteur
   * car c'est la confusion la plus pédagogiquement pertinente pour apprendre AM vs PM. */
  private generateChoices(correctValue: number, size: number): number[] {
    const choices = new Set<number>([correctValue]);

    // Miroir AM/PM : 8h00 ↔ 20h00 (± 720 minutes)
    const mirror = correctValue < 720 ? correctValue + 720 : correctValue - 720;
    choices.add(mirror);

    let attempts = 0;
    while (choices.size < size && attempts < 50) {
      const offset = DISTRACTOR_OFFSETS[this.rand(0, DISTRACTOR_OFFSETS.length - 1)];
      const direction = this.rand(0, 1) === 0 ? -1 : 1;
      // Modulo 1440 pour rester dans la plage 0-1439
      const wrong = ((correctValue + direction * offset) + 1440) % 1440;
      choices.add(wrong);
      attempts++;
    }

    return [...choices].sort(() => Math.random() - 0.5);
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
