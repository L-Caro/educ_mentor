import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { ImagierWord } from './entities/imagier-word.entity';
import { ImagierProgression } from './entities/imagier-progression.entity';
import { ImagierSession } from './entities/imagier-session.entity';
import { SettingsService } from '../settings/settings.service';
import { ImagierImportService } from './imagier-import.service';
import type {
  StartSessionDto,
  CreateWordDto,
  UpdateWordDto,
} from './dto/imagier.dto';
import {
  masteryScore,
  isMastered,
  selectionWeight,
} from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';
import { randomUUID } from 'node:crypto';

/** Taille d'un lot illimité (les pools finis sont rebouclés re-mélangés jusqu'à ce cap). */
const UNLIMITED_BATCH_SIZE = 60;

export interface ImagierQuestion {
  word_id: string;
  image_url: string | null;
  prompt: string;
  choices: { id: string; label: string }[]; // QCM : 2 ou 4 ; saisie libre : []
  correct_id: string;
  answer: string; // libellé de la bonne réponse (valide la saisie libre sans choix)
  direction: 'fr_to_en' | 'en_to_fr';
}

export interface SessionResult {
  session_id: string;
  questions: ImagierQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

@Injectable()
export class ImagierService {
  private readonly imagesBasePath: string;

  constructor(
    @InjectRepository(ImagierWord)
    private readonly wordRepo: Repository<ImagierWord>,
    @InjectRepository(ImagierProgression)
    private readonly progressionRepo: Repository<ImagierProgression>,
    @InjectRepository(ImagierSession)
    private readonly sessionRepo: Repository<ImagierSession>,
    private readonly settingsService: SettingsService,
    private readonly importService: ImagierImportService,
    private readonly configService: ConfigService,
  ) {
    this.imagesBasePath = path.resolve(
      configService.get<string>('imagesPath')!,
      'imagier',
    );
  }

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(dto: StartSessionDto): Promise<SessionResult> {
    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );
    const perSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );

    // Sens de traduction = choix de pré-jeu enfant (fr_to_en / en_to_fr / random).
    const mode = ['fr_to_en', 'en_to_fr', 'random'].includes(dto.mode ?? '')
      ? dto.mode!
      : 'fr_to_en';

    // Difficulté = choix de pré-jeu enfant ; pilote le nombre de choix QCM (0 = saisie libre).
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    // Récupérer les mots actifs du thème demandé, éventuellement restreints à des sous-catégories.
    const qb = this.wordRepo.createQueryBuilder('w').where('w.is_active = 1');
    if (dto.category) {
      qb.andWhere('w.category = :category', { category: dto.category });
    }
    if (dto.subcategories?.length) {
      qb.andWhere('w.subcategory IN (:...subs)', { subs: dto.subcategories });
    }
    const allWords = await qb.getMany();

    const isUnlimited = perSession <= 0;

    if (allWords.length === 0) {
      return {
        session_id: randomUUID(),
        questions: [],
        timer_seconds: timerSeconds,
        is_unlimited: isUnlimited,
      };
    }

    // Joindre avec la progression pour pondérer la sélection
    const progressions = await this.progressionRepo.find({
      where: allWords.map((w) => ({ word_id: w.id })),
    });
    const progMap = new Map(progressions.map((p) => [p.word_id, p]));

    // Illimité = on reboucle le pool re-mélangé jusqu'au cap ; sinon sélection pondérée par maîtrise.
    const selected = isUnlimited
      ? this.cycle(allWords, UNLIMITED_BATCH_SIZE)
      : this.weightedSample(allWords, progMap, perSession, threshold);

    // Construire les questions
    const questions: ImagierQuestion[] = [];
    for (const word of selected) {
      const resolvedMode =
        mode === 'random'
          ? Math.random() > 0.5
            ? 'fr_to_en'
            : 'en_to_fr'
          : mode;

      const answer = resolvedMode === 'fr_to_en' ? word.en : word.fr;

      // QCM : la bonne réponse + des distracteurs ; saisie libre (choicesCount 0) : aucun choix.
      const choices =
        choicesCount === 0
          ? []
          : this.shuffle([
              { id: word.id, label: answer },
              ...this.pickDistractors(word, allWords, choicesCount - 1).map(
                (d) => ({
                  id: d.id,
                  label: resolvedMode === 'fr_to_en' ? d.en : d.fr,
                }),
              ),
            ]);

      questions.push({
        word_id: word.id,
        image_url: this.buildImageUrl(word),
        prompt: resolvedMode === 'fr_to_en' ? word.fr : word.en,
        choices,
        correct_id: word.id,
        answer,
        direction: resolvedMode as 'fr_to_en' | 'en_to_fr',
      });
    }

    const session = this.sessionRepo.create({
      id: randomUUID(),
      mode,
      difficulty,
      categories: JSON.stringify({
        category: dto.category ?? null,
        subcategories: dto.subcategories ?? [],
      }),
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: timerSeconds,
      is_unlimited: isUnlimited,
    };
  }

  async recordAnswer(
    sessionId: string,
    wordId: string,
    isCorrect: boolean,
  ): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({ word_id: wordId });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
        word_id: wordId,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
      });
    }

    if (isCorrect) {
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

  // ─── Mots (admin) ─────────────────────────────────────────────────────────

  async findWords(filters: {
    category?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<ImagierWord[]> {
    const qb = this.wordRepo.createQueryBuilder('w');
    if (filters.category) {
      qb.andWhere('w.category = :cat', { cat: filters.category });
    }
    if (filters.is_active !== undefined) {
      qb.andWhere('w.is_active = :active', {
        active: filters.is_active ? 1 : 0,
      });
    }
    if (filters.search) {
      qb.andWhere('(LOWER(w.fr) LIKE :s OR LOWER(w.en) LIKE :s)', {
        s: `%${filters.search.toLowerCase()}%`,
      });
    }
    return qb.orderBy('w.category').addOrderBy('w.fr').getMany();
  }

  async createWord(dto: CreateWordDto): Promise<ImagierWord> {
    const slug = this.slugify(dto.fr);
    const category = this.slugify(dto.category);
    const image_filename = this.importService.findImage(dto.fr, category);
    const word = this.wordRepo.create({
      id: randomUUID(),
      slug,
      image_filename: image_filename ?? undefined,
      ...dto,
      category,
    });
    return this.wordRepo.save(word);
  }

  async updateWord(id: string, dto: UpdateWordDto): Promise<ImagierWord> {
    const word = await this.wordRepo.findOneBy({ id });
    if (!word) throw new NotFoundException(`Mot "${id}" introuvable`);
    Object.assign(word, dto);
    if (dto.category !== undefined) {
      word.category = this.slugify(dto.category);
    }
    return this.wordRepo.save(word);
  }

  async deleteWord(id: string): Promise<void> {
    await this.wordRepo.delete(id);
    await this.progressionRepo.delete({ word_id: id });
  }

  async getCategories(): Promise<
    {
      category: string;
      count: number;
      active_count: number;
      subcategories: {
        subcategory: string;
        count: number;
        active_count: number;
      }[];
    }[]
  > {
    const rows = await this.wordRepo
      .createQueryBuilder('w')
      .select('w.category', 'category')
      .addSelect('w.subcategory', 'subcategory')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        'SUM(CASE WHEN w.is_active = 1 THEN 1 ELSE 0 END)',
        'active_count',
      )
      .groupBy('w.category')
      .addGroupBy('w.subcategory')
      .orderBy('w.category')
      .addOrderBy('w.subcategory')
      .getRawMany<{
        category: string;
        subcategory: string | null;
        count: string;
        active_count: string;
      }>();

    const byCategory = new Map<
      string,
      {
        category: string;
        count: number;
        active_count: number;
        subcategories: {
          subcategory: string;
          count: number;
          active_count: number;
        }[];
      }
    >();

    for (const row of rows) {
      const count = parseInt(row.count, 10);
      const activeCount = parseInt(row.active_count, 10);

      let entry = byCategory.get(row.category);
      if (!entry) {
        entry = {
          category: row.category,
          count: 0,
          active_count: 0,
          subcategories: [],
        };
        byCategory.set(row.category, entry);
      }
      entry.count += count;
      entry.active_count += activeCount;
      if (row.subcategory) {
        entry.subcategories.push({
          subcategory: row.subcategory,
          count,
          active_count: activeCount,
        });
      }
    }

    return [...byCategory.values()];
  }

  async getProgression(): Promise<
    (ImagierWord & { progression: ImagierProgression | null })[]
  > {
    const words = await this.wordRepo.find({
      order: { category: 'ASC', fr: 'ASC' },
    });
    const progs = await this.progressionRepo.find();
    const progMap = new Map(progs.map((p) => [p.word_id, p]));
    return words.map((w) => ({ ...w, progression: progMap.get(w.id) ?? null }));
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
  }

  async normalizeCategories(): Promise<{ updated: number }> {
    const words = await this.wordRepo.find();
    let updated = 0;
    for (const word of words) {
      const normalized = this.slugify(word.category);
      if (normalized !== word.category) {
        word.category = normalized;
        await this.wordRepo.save(word);
        updated++;
      }
    }
    return { updated };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private buildImageUrl(word: ImagierWord): string | null {
    if (!word.image_filename) return null;

    // Cherche dans quel sous-dossier se trouve le fichier
    const category = this.importService.resolveImageCategory(
      word.image_filename,
      word.category,
    );
    if (!category) return null;

    // Encode les caractères spéciaux dans le nom de fichier
    const encodedFilename = encodeURIComponent(word.image_filename);
    return `/media/imagier/${category}/${encodedFilename}`;
  }

  private weightedSample(
    words: ImagierWord[],
    progMap: Map<string, ImagierProgression>,
    count: number,
    threshold: number,
  ): ImagierWord[] {
    if (words.length <= count) return this.shuffle([...words]);

    // Tableau pondéré par maîtrise (fréquence selon le score)
    const weighted: ImagierWord[] = [];
    for (const w of words) {
      const prog = progMap.get(w.id);
      const score = prog
        ? masteryScore(prog.correct_count, prog.incorrect_count)
        : 0;
      const weight = selectionWeight(score, threshold);
      for (let i = 0; i < weight; i++) weighted.push(w);
    }

    // Sélection sans remise
    const selected: ImagierWord[] = [];
    const usedIds = new Set<string>();
    const pool = this.shuffle(weighted);

    for (const w of pool) {
      if (usedIds.has(w.id)) continue;
      selected.push(w);
      usedIds.add(w.id);
      if (selected.length >= count) break;
    }

    // Si pas assez (peu de mots), compléter avec le reste
    if (selected.length < count) {
      for (const w of words) {
        if (!usedIds.has(w.id)) {
          selected.push(w);
          if (selected.length >= count) break;
        }
      }
    }

    return selected;
  }

  private pickDistractors(
    correct: ImagierWord,
    pool: ImagierWord[],
    count: number,
  ): ImagierWord[] {
    const candidates = pool.filter((w) => w.id !== correct.id);
    // Préférer la même catégorie
    const sameCategory = candidates.filter(
      (w) => w.category === correct.category,
    );
    const others = candidates.filter((w) => w.category !== correct.category);
    const ordered = this.shuffle([...sameCategory, ...others]);
    return ordered.slice(0, count);
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

  // ─── Upload image ─────────────────────────────────────────────────────────

  async saveUploadedImage(
    wordId: string,
    filename: string,
  ): Promise<ImagierWord> {
    const word = await this.wordRepo.findOneBy({ id: wordId });
    if (!word) throw new NotFoundException(`Mot "${wordId}" introuvable`);
    word.image_filename = filename;
    return this.wordRepo.save(word);
  }

  getImagesBasePath(): string {
    return this.imagesBasePath;
  }

  getWordById(id: string): Promise<ImagierWord | null> {
    return this.wordRepo.findOneBy({ id });
  }
}
