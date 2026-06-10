import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TablesProgression } from './entities/tables-progression.entity';
import { TablesSession } from './entities/tables-session.entity';
import { SettingsService } from '../settings/settings.service';
import type {
  StartTablesSessionDto,
  RecordTablesAnswerDto,
} from './dto/tables.dto';
import { masteryScore, isMastered, selectionWeight } from '../../common/mastery';

export interface TablesQuestion {
  // Normalized fact key (min×max)
  fact_id: string;
  // Display order (selected table first)
  display_a: number;
  display_b: number;
  answer: number;
  choices: number[];
  hint: string;
}

export interface TablesSessionResult {
  session_id: string;
  questions: TablesQuestion[];
  timer_seconds: number;
}

export interface TableStatus {
  table: number;
  is_known: boolean;
  mastered_count: number;
  in_progress_count: number;
  total_facts: number;
}

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(TablesProgression)
    private readonly progressionRepo: Repository<TablesProgression>,
    @InjectRepository(TablesSession)
    private readonly sessionRepo: Repository<TablesSession>,
    private readonly settingsService: SettingsService,
  ) {}

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartTablesSessionDto): Promise<TablesSessionResult> {
    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const threshold = parseInt((await this.settingsService.get('mastery_threshold')) ?? '10', 10);
    const count = dto.count ?? parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );

    const excludeTrivial = dto.exclude_trivial ?? false;

    // Build pool of all unique facts (normalized) involving selected tables
    const factSet = new Map<string, { a: number; b: number; selectedTable: number }>();
    for (const t of dto.selected_tables) {
      for (let f = 0; f <= 10; f++) {
        if (excludeTrivial && (f === 0 || f === 1)) continue;
        const a = Math.min(t, f);
        const b = Math.max(t, f);
        // Also skip trivial selected table itself (e.g. ×0 or ×1 selected as table)
        if (excludeTrivial && (a === 0 || a === 1)) continue;
        const key = `${a}x${b}`;
        if (!factSet.has(key)) {
          factSet.set(key, { a, b, selectedTable: t });
        }
      }
    }

    if (factSet.size === 0) {
      return { session_id: uuidv4(), questions: [], timer_seconds: timerSeconds };
    }

    const factKeys = [...factSet.keys()];

    // Load all progression (max 66 facts) and build lookup map
    const allProgressions = await this.progressionRepo.find();
    const progMap = new Map(
      allProgressions.map((p) => [`${p.factor_a}x${p.factor_b}`, p]),
    );

    // Sélection pondérée par maîtrise (fréquence selon le score)
    const factEntries = [...factSet.entries()];
    const weighted: string[] = [];
    for (const [key] of factEntries) {
      const prog = progMap.get(key);
      const score = prog ? masteryScore(prog.correct_count, prog.incorrect_count) : 0;
      const weight = selectionWeight(score, threshold);
      for (let i = 0; i < weight; i++) weighted.push(key);
    }

    const shuffledWeighted = this.shuffle(weighted);
    const selectedKeys: string[] = [];
    const usedKeys = new Set<string>();
    for (const key of shuffledWeighted) {
      if (usedKeys.has(key)) continue;
      selectedKeys.push(key);
      usedKeys.add(key);
      if (selectedKeys.length >= count) break;
    }
    // Fill up if pool smaller than count
    for (const [key] of factEntries) {
      if (!usedKeys.has(key)) {
        selectedKeys.push(key);
        if (selectedKeys.length >= count) break;
      }
    }

    // choices_count: 0 = free input, 2 or 4 = QCM (default 4)
    const choicesCount = dto.choices_count ?? 4;

    // Build questions
    const questions: TablesQuestion[] = this.shuffle(selectedKeys).map((key) => {
      const { a, b, selectedTable } = factSet.get(key)!;
      const answer = a * b;

      // Display order: selected table first
      const otherFactor = selectedTable === a ? b : a;
      const display_a = selectedTable;
      const display_b = otherFactor;

      const choices = choicesCount === 0
        ? []
        : this.buildChoices(answer, display_a, display_b, choicesCount - 1);
      const hint = this.buildHint(display_a, display_b);

      return { fact_id: key, display_a, display_b, answer, choices, hint };
    });

    const session = this.sessionRepo.create({
      id: uuidv4(),
      selected_tables: JSON.stringify(dto.selected_tables),
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds };
  }

  async recordAnswer(
    _sessionId: string,
    dto: RecordTablesAnswerDto,
  ): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    const a = Math.min(dto.factor_a, dto.factor_b);
    const b = Math.max(dto.factor_a, dto.factor_b);

    let prog = await this.progressionRepo.findOneBy({ factor_a: a, factor_b: b });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: uuidv4(),
        factor_a: a,
        factor_b: b,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        mastered_at: null,
        last_seen: null,
      });
    }

    if (dto.is_correct) {
      prog.correct_count++;
    } else {
      prog.incorrect_count++;
    }
    prog.last_seen = new Date();

    const score = masteryScore(prog.correct_count, prog.incorrect_count);
    const mastered = isMastered(score, threshold);
    if (mastered && !prog.is_mastered) prog.mastered_at = new Date();
    prog.is_mastered = mastered;

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

  // ─── Table status (vue enfant) ────────────────────────────────────────────

  async getTableStatus(): Promise<TableStatus[]> {
    const knownRaw = (await this.settingsService.get('tables_known_tables')) ?? '[0,1,2,5,9,10]';
    const knownTables: number[] = JSON.parse(knownRaw);

    const allProgressions = await this.progressionRepo.find();

    return Array.from({ length: 11 }, (_, t) => {
      const facts = allProgressions.filter(
        (p) => p.factor_a === t || p.factor_b === t,
      );
      const mastered_count = facts.filter((p) => p.is_mastered).length;
      const in_progress_count = facts.filter(
        (p) => !p.is_mastered && (p.correct_count > 0 || p.incorrect_count > 0),
      ).length;
      return {
        table: t,
        is_known: knownTables.includes(t),
        mastered_count,
        in_progress_count,
        total_facts: 11,
      };
    });
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async getProgression(): Promise<TablesProgression[]> {
    return this.progressionRepo.find({
      order: { factor_a: 'ASC', factor_b: 'ASC' },
    });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private buildChoices(correct: number, a: number, b: number, distractorCount = 3): number[] {
    const candidates = new Set<number>([
      correct + 1, correct - 1,
      correct + a, correct - a,
      correct + b, correct - b,
      correct + 2, correct - 2,
      (a + 1) * b, a * (b + 1),
      Math.max(0, correct - a - b),
      correct + a + b,
    ]);
    candidates.delete(correct);

    const distractors: number[] = [];
    for (const v of this.shuffle([...candidates])) {
      if (v >= 0) {
        distractors.push(v);
        if (distractors.length >= distractorCount) break;
      }
    }
    // Fallback if not enough candidates
    let fallback = correct + 3;
    while (distractors.length < distractorCount) {
      if (fallback !== correct && fallback >= 0) distractors.push(fallback);
      fallback++;
    }

    return this.shuffle([correct, ...distractors.slice(0, distractorCount)]);
  }

  private buildHint(a: number, b: number): string {
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    if (lo === 9 || hi === 9) return '💡 Astuce ×9 : utilise tes doigts !';
    if (lo === 5 || hi === 5) return '💡 Table de ×5 : compte de 5 en 5 !';
    if (a === b) return `💡 Carré parfait : ${a} × ${a}`;
    if (lo === 6 && hi === 7) return '💡 5-6-7-8 : 56 = 7 × 8 !';
    if (lo === 3 && hi === 6) return '💡 Double la table de ×3 !';
    if (lo === 4 && hi === 8) return '💡 Double la table de ×4 !';
    return '';
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
