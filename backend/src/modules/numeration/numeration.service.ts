import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { NumerationSession } from './entities/numeration-session.entity';
import { NumerationProgression } from './entities/numeration-progression.entity';
import { SettingsService } from '../settings/settings.service';
import type { CompleteNumerationSessionDto, StartNumerationSessionDto } from './dto/numeration.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

type PositionKey = 'u' | 'd' | 'c' | 'm' | 'dm' | 'cm';
type QuestionType = 'comparaison' | 'suite' | 'decomposition' | 'valeur_positionnelle';

const POSITION_ORDER: PositionKey[] = ['u', 'd', 'c', 'm', 'dm', 'cm'];
const POSITION_VALUE: Record<PositionKey, number> = {
  u: 1, d: 10, c: 100, m: 1000, dm: 10000, cm: 100000,
};
const POSITION_NAME: Record<PositionKey, string> = {
  u: 'unités', d: 'dizaines', c: 'centaines',
  m: 'milliers', dm: 'dizaines de milliers', cm: 'centaines de milliers',
};

const VALID_TYPES: QuestionType[] = ['comparaison', 'suite', 'decomposition', 'valeur_positionnelle'];
const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 50, 100, 200, 500, 1000];

export interface NumerationSessionQuestion {
  item_key: string;
  type: QuestionType;
  display: string;
  answer: string;
  choices: string[];
  decompose_positions: PositionKey[] | null;  // highest → lowest, only for decomposition
  suite_terms: number[] | null;               // 3 displayed terms, only for suite
}

export interface NumerationSessionResponse {
  session_id: string;
  questions: NumerationSessionQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class NumerationService {
  constructor(
    @InjectRepository(NumerationSession)
    private readonly sessionsRepo: Repository<NumerationSession>,
    @InjectRepository(NumerationProgression)
    private readonly progressionRepo: Repository<NumerationProgression>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Game ──────────────────────────────────────────────────────────────────

  async createSession(dto: StartNumerationSessionDto): Promise<NumerationSessionResponse> {
    const positions  = await this.getActivePositions();
    const steps      = await this.getActiveSteps();
    const timerSec   = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const countSetting = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);
    const isUnlimited  = countSetting === 0;
    const count        = isUnlimited ? 50 : countSetting;

    const requestedTypes = (dto.question_types ?? [])
      .filter((t): t is QuestionType => VALID_TYPES.includes(t as QuestionType));
    const types: QuestionType[] = requestedTypes.length > 0 ? requestedTypes : VALID_TYPES;

    const questions = this.generateQuestions(count, types, positions, steps);

    const session = this.sessionsRepo.create({ id: uuidv4(), started_at: new Date() });
    await this.sessionsRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSec, is_unlimited: isUnlimited };
  }

  async completeSession(sessionId: string, dto: CompleteNumerationSessionDto): Promise<void> {
    const session = await this.sessionsRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correctAnswers;
    session.total_questions = dto.totalQuestions;
    session.completed_at    = new Date();
    await this.sessionsRepo.save(session);
    await this.updateProgression(dto.correctAnswers, dto.totalQuestions);
  }

  async recordAnswer(_sessionId: string, _itemKey: string, _isCorrect: boolean): Promise<void> {
    // Totaux de session uniquement — enregistrés via completeSession.
  }

  // ─── Progression ───────────────────────────────────────────────────────────

  async getProgression(): Promise<{ is_mastered: boolean; correct_count: number; incorrect_count: number }[]> {
    const prog = await this.progressionRepo.findOne({ where: {} });
    if (!prog) return [];
    return [{
      is_mastered:     prog.best_total > 0 && prog.best_correct === prog.best_total,
      correct_count:   prog.best_correct,
      incorrect_count: Math.max(0, prog.best_total - prog.best_correct),
    }];
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async getActivePositions(): Promise<PositionKey[]> {
    const raw = await this.settingsService.get('numeration_active_positions') ?? '["u","d"]';
    try {
      const parsed = JSON.parse(raw) as PositionKey[];
      const valid = parsed.filter((p) => POSITION_ORDER.includes(p));
      return valid.length > 0 ? valid : ['u', 'd'];
    } catch { return ['u', 'd']; }
  }

  private async getActiveSteps(): Promise<number[]> {
    const raw = await this.settingsService.get('numeration_active_steps') ?? '[1,2,5,10]';
    try {
      const parsed = JSON.parse(raw) as number[];
      const valid = parsed.filter((s) => ALL_STEPS.includes(s));
      return valid.length > 0 ? valid : [1, 2, 5, 10];
    } catch { return [1, 2, 5, 10]; }
  }

  private maxFromPositions(positions: PositionKey[]): number {
    const sorted = [...positions].sort((a, b) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b));
    return POSITION_VALUE[sorted[sorted.length - 1]] * 10 - 1;
  }

  private minForDecompose(positions: PositionKey[]): number {
    const sorted = [...positions].sort((a, b) => POSITION_ORDER.indexOf(a) - POSITION_ORDER.indexOf(b));
    return POSITION_VALUE[sorted[sorted.length - 1]];
  }

  private async updateProgression(correct: number, total: number): Promise<void> {
    let prog = await this.progressionRepo.findOne({ where: {} });
    if (prog) {
      prog.play_count++;
      prog.last_played_at = new Date();
      if (correct > prog.best_correct) {
        prog.best_correct = correct;
        prog.best_total   = total;
      }
    } else {
      prog = this.progressionRepo.create({
        play_count: 1, last_played_at: new Date(),
        best_correct: correct, best_total: total,
      });
    }
    await this.progressionRepo.save(prog);
  }

  private generateQuestions(
    count: number,
    types: QuestionType[],
    positions: PositionKey[],
    steps: number[],
  ): NumerationSessionQuestion[] {
    const questions: NumerationSessionQuestion[] = [];
    const usedKeys = new Set<string>();

    let attempts = 0;
    while (questions.length < count && attempts < count * 5) {
      attempts++;
      const type = types[Math.floor(Math.random() * types.length)];
      const q = this.generateOne(type, positions, steps);
      if (!q || usedKeys.has(q.item_key)) continue;
      usedKeys.add(q.item_key);
      questions.push(q);
    }

    return questions;
  }

  private generateOne(
    type: QuestionType,
    positions: PositionKey[],
    steps: number[],
  ): NumerationSessionQuestion | null {
    const max = this.maxFromPositions(positions);

    switch (type) {
      case 'comparaison': {
        const left  = this.rand(0, max);
        const right = Math.random() < 0.2 ? left : this.rand(0, max);
        const answer = left < right ? '<' : left > right ? '>' : '=';
        return {
          item_key: `comp_${left}_${right}`,
          type,
          display: `${left}  □  ${right}`,
          answer,
          choices: ['<', '=', '>'],
          decompose_positions: null,
          suite_terms: null,
        };
      }

      case 'suite': {
        if (steps.length === 0) return null;
        const step      = steps[Math.floor(Math.random() * steps.length)];
        const ascending = Math.random() < 0.5;

        if (ascending) {
          const maxStart     = Math.max(0, max - step * 3);
          const startMult    = Math.floor(Math.random() * (Math.floor(maxStart / step) + 1));
          const start        = startMult * step;
          const terms        = [start, start + step, start + step * 2];
          return {
            item_key:           `suite_asc_${start}_${step}`,
            type,
            display:            terms.join(', ') + ', ...',
            answer:             String(start + step * 3),
            choices:            [],
            decompose_positions: null,
            suite_terms:        terms,
          };
        } else {
          // Marche arrière : départ >= step × 3 pour rester ≥ 0
          const minStart = step * 3;
          if (minStart > max) return null;
          const maxMult  = Math.floor(max / step);
          const minMult  = Math.ceil(minStart / step);
          const startMult = minMult + Math.floor(Math.random() * (maxMult - minMult + 1));
          const start     = startMult * step;
          const terms     = [start, start - step, start - step * 2];
          return {
            item_key:           `suite_desc_${start}_${step}`,
            type,
            display:            terms.join(', ') + ', ...',
            answer:             String(start - step * 3),
            choices:            [],
            decompose_positions: null,
            suite_terms:        terms,
          };
        }
      }

      case 'decomposition': {
        const min    = this.minForDecompose(positions);
        const number = this.rand(min, max);
        // Sorted highest → lowest for display order
        const sorted = [...positions].sort(
          (a, b) => POSITION_ORDER.indexOf(b) - POSITION_ORDER.indexOf(a),
        );
        const digits = sorted.map((p) => Math.floor(number / POSITION_VALUE[p]) % 10);
        const answer = digits.join(':');
        return {
          item_key:           `decomp_${number}`,
          type,
          display:            String(number),
          answer,
          choices:            [],
          decompose_positions: sorted,
          suite_terms:        null,
        };
      }

      case 'valeur_positionnelle': {
        if (positions.length === 0) return null;
        const min      = this.minForDecompose(positions);
        const number   = this.rand(min, max);
        const position = positions[Math.floor(Math.random() * positions.length)];
        const digit    = Math.floor(number / POSITION_VALUE[position]) % 10;
        return {
          item_key:           `valpos_${number}_${position}`,
          type,
          display:            `Dans ${number}, quel est le chiffre des ${POSITION_NAME[position]} ?`,
          answer:             String(digit),
          choices:            [],
          decompose_positions: null,
          suite_terms:        null,
        };
      }
    }
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}