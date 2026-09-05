import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TablesProgression } from './entities/tables-progression.entity';
import { TablesSession } from './entities/tables-session.entity';
import { SettingsService } from '../settings/settings.service';
import type {
  StartTablesSessionDto,
  RecordTablesAnswerDto,
} from './dto/tables.dto';
import {
  masteryScore,
  isMastered,
  selectionWeight,
} from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';
import { randomUUID } from 'node:crypto';

/** Taille d'un lot illimité (le pool fini est rebouclé re-mélangé jusqu'à ce cap). */
const UNLIMITED_BATCH_SIZE = 50;

export interface TablesQuestion {
  // Normalized fact key (min×max)
  fact_id: string;
  // Display order (selected table first)
  display_a: number;
  display_b: number;
  answer: number;
  choices: number[]; // QCM : 2 ou 4 ; saisie libre : []
}

export interface TablesSessionResult {
  session_id: string;
  questions: TablesQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
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

  /** Construire les questions, et RIEN d'autre : aucune écriture en base.
   *
   * Séparé de `startSession` pour le péage des jeux, qui a besoin d'une question mais
   * pas d'une séance. Sans cette coupure, chaque partie de morpion aurait déposé une
   * séance fantôme d'une question dans « séances récentes » — la liste que lit l'adulte
   * pour savoir ce qui a été travaillé.
   */
  async construireQuestions(dto: StartTablesSessionDto): Promise<{
    resultat: Omit<TablesSessionResult, 'session_id'>;
    seance: Partial<TablesSession>;
  }> {
    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );
    const rawCount = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );
    const excludeTrivial =
      (await this.settingsService.get('tables_include_trivial')) === 'false';

    // Difficulté = choix de pré-jeu enfant ; pilote le nombre de choix QCM (0 = saisie libre).
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    // Aucune table sélectionnée = toutes (filtrées par excludeTrivial dans la boucle).
    const selectedTables =
      dto.selected_tables.length > 0
        ? dto.selected_tables
        : Array.from({ length: 11 }, (_, table) => table);

    // Build pool of all unique facts (normalized) involving selected tables
    const factSet = new Map<
      string,
      { a: number; b: number; selectedTable: number }
    >();
    for (const t of selectedTables) {
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

    const isUnlimited = rawCount <= 0;

    if (factSet.size === 0) {
      return {
        resultat: {
          questions: [],
          timer_seconds: timerSeconds,
          is_unlimited: isUnlimited,
        },
        seance: { selected_tables: JSON.stringify(dto.selected_tables) },
      };
    }

    const factEntries = [...factSet.entries()];
    let selectedKeys: string[];

    if (isUnlimited) {
      // Illimité = on reboucle le pool de faits re-mélangé jusqu'au cap.
      selectedKeys = this.cycle(
        factEntries.map(([key]) => key),
        UNLIMITED_BATCH_SIZE,
      );
    } else {
      // Load all progression (max 66 facts) and build lookup map
      const allProgressions = await this.progressionRepo.find();
      const progMap = new Map(
        allProgressions.map((p) => [`${p.factor_a}x${p.factor_b}`, p]),
      );

      // Sélection pondérée par maîtrise (fréquence selon le score)
      const weighted: string[] = [];
      for (const [key] of factEntries) {
        const prog = progMap.get(key);
        const score = prog
          ? masteryScore(prog.correct_count, prog.incorrect_count)
          : 0;
        const weight = selectionWeight(score, threshold);
        for (let i = 0; i < weight; i++) weighted.push(key);
      }

      const shuffledWeighted = this.shuffle(weighted);
      const usedKeys = new Set<string>();
      selectedKeys = [];
      for (const key of shuffledWeighted) {
        if (usedKeys.has(key)) continue;
        selectedKeys.push(key);
        usedKeys.add(key);
        if (selectedKeys.length >= rawCount) break;
      }
      // Fill up if pool smaller than count
      for (const [key] of factEntries) {
        if (!usedKeys.has(key)) {
          selectedKeys.push(key);
          if (selectedKeys.length >= rawCount) break;
        }
      }
    }

    // Build questions (l'ordre illimité est déjà mélangé par tour ; on ne re-mélange que le fini).
    const orderedKeys = isUnlimited ? selectedKeys : this.shuffle(selectedKeys);
    const questions: TablesQuestion[] = orderedKeys.map((key) => {
      const { a, b, selectedTable } = factSet.get(key)!;
      const answer = a * b;

      // Display order: selected table first
      const otherFactor = selectedTable === a ? b : a;
      const display_a = selectedTable;
      const display_b = otherFactor;

      const choices =
        choicesCount === 0
          ? []
          : this.buildChoices(answer, display_a, display_b, choicesCount - 1);

      return { fact_id: key, display_a, display_b, answer, choices };
    });

    return {
      resultat: {
        questions,
        timer_seconds: timerSeconds,
        is_unlimited: isUnlimited,
      },
      seance: { selected_tables: JSON.stringify(dto.selected_tables) },
    };
  }

  async startSession(dto: StartTablesSessionDto): Promise<TablesSessionResult> {
    const { resultat, seance } = await this.construireQuestions(dto);

    // Aucune question à poser : on n'enregistre pas de séance. C'était déjà le cas avant
    // la coupure, et ça doit le rester — une séance vide en base n'apprend rien à
    // personne et brouillerait « séances récentes ».
    if (resultat.questions.length === 0) {
      return { session_id: randomUUID(), ...resultat };
    }

    const session = this.sessionRepo.create({ id: randomUUID(), ...seance });
    await this.sessionRepo.save(session);

    return { session_id: session.id, ...resultat };
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

    let prog = await this.progressionRepo.findOneBy({
      factor_a: a,
      factor_b: b,
    });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
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

  private buildChoices(
    correct: number,
    a: number,
    b: number,
    distractorCount = 3,
  ): number[] {
    const candidates = new Set<number>([
      correct + 1,
      correct - 1,
      correct + a,
      correct - a,
      correct + b,
      correct - b,
      correct + 2,
      correct - 2,
      (a + 1) * b,
      a * (b + 1),
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

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Reboucle un pool re-mélangé à chaque tour jusqu'à atteindre `count` (mode illimité). */
  private cycle<T>(pool: T[], count: number): T[] {
    const out: T[] = [];
    while (out.length < count) out.push(...this.shuffle(pool));
    return out.slice(0, count);
  }
}
