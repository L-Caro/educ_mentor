import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MonnaieProgression } from './entities/monnaie-progression.entity';
import { MonnaieSession } from './entities/monnaie-session.entity';
import { SettingsService } from '../settings/settings.service';
import type { RecordMonnaieAnswerDto, StartMonnaieSessionDto } from './dto/monnaie.dto';
import { masteryScore, isMastered } from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';

export type ExerciseType = 'reconnaitre' | 'total' | 'rendre';

export interface MonnaieQuestion {
  type: ExerciseType;
  coins?: number[];   // centimes — liste de pièces/billets (reconnaitre)
  prices?: number[];  // centimes — liste de prix d'articles (total)
  price?: number;     // centimes — prix de l'article (rendre)
  payment?: number;   // centimes — somme donnée (rendre)
  answer: number;     // centimes — réponse attendue
  choices: number[];  // centimes — QCM : 2 ou 4 ; saisie libre : []
}

export interface MonnaieSessionResult {
  session_id: string;
  questions: MonnaieQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

/** Toutes les valeurs en centimes. Correspondent aux pièces et billets euro officiels. */
const ALL_DENOMINATION_VALUES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

/** Montants "ronds" utilisés pour simuler un paiement réaliste (on paie avec un billet ou une pièce entière). */
const PAYMENT_OPTIONS_CENTS = [50, 100, 200, 500, 1000, 2000, 5000];

const VALID_EXERCISE_TYPES: ExerciseType[] = ['reconnaitre', 'total', 'rendre'];

@Injectable()
export class MonnaieService {
  constructor(
    @InjectRepository(MonnaieProgression)
    private readonly progressionRepo: Repository<MonnaieProgression>,
    @InjectRepository(MonnaieSession)
    private readonly sessionRepo: Repository<MonnaieSession>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartMonnaieSessionDto): Promise<MonnaieSessionResult> {
    const exerciseType: ExerciseType = VALID_EXERCISE_TYPES.includes(dto.exercise_type as ExerciseType)
      ? (dto.exercise_type as ExerciseType)
      : 'reconnaitre';

    // Difficulté = choix de pré-jeu enfant ; pilote le nombre de choix QCM (0 = saisie libre).
    const choicesCount = qcmChoiceCount(normalizeDifficulty(dto.difficulty));

    const denominationsRaw = (await this.settingsService.get('monnaie_denominations')) ?? '1,2,5,10,20,50,100,200,500,1000,2000,5000';
    const maxAmountEuros = parseInt((await this.settingsService.get('monnaie_max_amount')) ?? '10', 10);
    const wholeEuros = (await this.settingsService.get('monnaie_whole_euros')) === 'true';
    const itemCount = parseInt((await this.settingsService.get('monnaie_items_count')) ?? '3', 10);
    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const questionsPerSession = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);

    const validDenominationSet = new Set(ALL_DENOMINATION_VALUES);
    const parsedDenominations = denominationsRaw
      .split(',')
      .map((rawValue) => parseInt(rawValue.trim(), 10))
      .filter((denomination) => !isNaN(denomination) && validDenominationSet.has(denomination))
      .sort((a, b) => a - b);

    const activeDenominations = wholeEuros
      ? parsedDenominations.filter((denomination) => denomination >= 100)
      : parsedDenominations;

    const maxCents = maxAmountEuros * 100;
    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(count, exerciseType, activeDenominations, maxCents, wholeEuros, itemCount, choicesCount);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      exercise_type: exerciseType,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds, is_unlimited: isUnlimited };
  }

  async recordAnswer(sessionId: string, dto: RecordMonnaieAnswerDto): Promise<void> {
    const threshold = parseInt((await this.settingsService.get('mastery_threshold')) ?? '10', 10);

    let progression = await this.progressionRepo.findOneBy({
      exercise_type: dto.exercise_type,
      answer_value: dto.answer_value,
    });

    if (!progression) {
      progression = this.progressionRepo.create({
        id: uuidv4(),
        exercise_type: dto.exercise_type,
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

  async getProgression(): Promise<MonnaieProgression[]> {
    return this.progressionRepo.find({ order: { exercise_type: 'ASC', answer_value: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<MonnaieSession[]> {
    return this.sessionRepo.find({ order: { started_at: 'DESC' }, take: limit });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Génération ───────────────────────────────────────────────────────────

  private generateQuestions(
    count: number,
    type: ExerciseType,
    denominations: number[],
    maxCents: number,
    wholeEuros: boolean,
    itemCount: number,
    choicesCount: number,
  ): MonnaieQuestion[] {
    const questions: MonnaieQuestion[] = [];

    for (let questionIndex = 0; questionIndex < count; questionIndex++) {
      let generated: MonnaieQuestion | null = null;
      let attempts = 0;

      do {
        generated = this.generateQuestion(type, denominations, maxCents, wholeEuros, itemCount);
        attempts++;
      } while (!generated && attempts < 20);

      if (!generated) continue;

      // QCM (choicesCount > 0) : distracteurs proches ; saisie libre : aucun choix.
      if (choicesCount > 0) {
        generated.choices = this.generateChoices(generated.answer, maxCents, choicesCount);
      }

      questions.push(generated);
    }

    return questions;
  }

  private generateQuestion(
    type: ExerciseType,
    denominations: number[],
    maxCents: number,
    wholeEuros: boolean,
    itemCount: number,
  ): MonnaieQuestion | null {
    if (denominations.length === 0) return null;
    switch (type) {
      case 'reconnaitre': return this.generateReconnaitre(denominations, maxCents, wholeEuros);
      case 'total':       return this.generateTotal(denominations, maxCents, wholeEuros, itemCount);
      case 'rendre':      return this.generateRendre(denominations, maxCents, wholeEuros);
    }
  }

  /** Affiche une collection de pièces/billets — trouver le total. */
  private generateReconnaitre(denominations: number[], maxCents: number, wholeEuros: boolean): MonnaieQuestion | null {
    const step = wholeEuros ? 100 : denominations[0];
    const maxStep = Math.floor(maxCents / step);
    if (maxStep < 1) return null;

    const target = this.rand(1, maxStep) * step;
    const coins = this.decompose(target, denominations);
    if (!coins) return null;

    return { type: 'reconnaitre', coins, answer: target, choices: [] };
  }

  /** Affiche N prix d'articles — calculer le total à payer. */
  private generateTotal(denominations: number[], maxCents: number, wholeEuros: boolean, itemCount: number): MonnaieQuestion | null {
    const step = wholeEuros ? 100 : denominations[0];
    const perItemMax = Math.floor((maxCents / itemCount) / step) * step;
    if (perItemMax < step) return null;

    const prices: number[] = [];
    for (let i = 0; i < itemCount; i++) {
      prices.push(this.rand(1, Math.floor(perItemMax / step)) * step);
    }

    const answer = prices.reduce((sum, price) => sum + price, 0);
    if (answer > maxCents) return null;

    return { type: 'total', prices, answer, choices: [] };
  }

  /** Prix + somme donnée — trouver la monnaie à rendre. */
  private generateRendre(denominations: number[], maxCents: number, wholeEuros: boolean): MonnaieQuestion | null {
    const step = wholeEuros ? 100 : denominations[0];
    const maxPriceStep = Math.floor((maxCents * 0.8) / step);
    if (maxPriceStep < 1) return null;

    const price = this.rand(1, maxPriceStep) * step;
    const payment = this.pickPaymentAmount(price, maxCents);
    if (!payment || payment - price <= 0) return null;

    return { type: 'rendre', price, payment, answer: payment - price, choices: [] };
  }

  /** Sélectionne un montant de paiement "rond" (billet ou pièce entière) supérieur au prix. */
  private pickPaymentAmount(price: number, maxCents: number): number | null {
    const validPayments = PAYMENT_OPTIONS_CENTS.filter(
      (paymentOption) => paymentOption > price && paymentOption <= maxCents * 2,
    );
    if (validPayments.length === 0) return null;
    // Préférer les petits billets (plus réaliste pédagogiquement)
    return validPayments[this.rand(0, Math.min(validPayments.length - 1, 2))];
  }

  /** Décompose un montant en pièces/billets par algorithme glouton (du plus grand au plus petit). */
  private decompose(amount: number, denominations: number[]): number[] | null {
    const sortedDesc = [...denominations].sort((a, b) => b - a);
    const coins: number[] = [];
    let remaining = amount;

    for (const denomination of sortedDesc) {
      while (remaining >= denomination) {
        coins.push(denomination);
        remaining -= denomination;
      }
    }

    return remaining === 0 ? coins : null;
  }

  /** Génère `size` options (bonne réponse + distracteurs proches) pour le mode QCM. */
  private generateChoices(correctAnswer: number, maxCents: number, size: number): number[] {
    const choices = new Set<number>([correctAnswer]);
    const offsets = [10, 20, 50, 100, 200, 500];
    let attempts = 0;

    while (choices.size < size && attempts < 50) {
      const offset = offsets[this.rand(0, offsets.length - 1)];
      const direction = this.rand(0, 1) === 0 ? -1 : 1;
      const wrong = correctAnswer + direction * offset;
      if (wrong > 0 && wrong <= maxCents * 2) {
        choices.add(wrong);
      }
      attempts++;
    }

    return [...choices].sort(() => Math.random() - 0.5);
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
