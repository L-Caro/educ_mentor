import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
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

export interface ImagierQuestion {
  word_id: string;
  image_url: string | null;
  prompt: string;
  choices: { id: string; label: string }[];
  correct_id: string;
  direction: 'fr_to_en' | 'en_to_fr';
}

export interface SessionResult {
  session_id: string;
  questions: ImagierQuestion[];
  timer_seconds: number;
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
    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const count = dto.count ?? parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);
    const difficulty = dto.difficulty ?? 'level_1';
    const choicesCount = difficulty === 'level_2' ? 2 : 4;

    // Récupérer les mots actifs pour les catégories demandées
    const qb = this.wordRepo.createQueryBuilder('w').where('w.is_active = 1');
    if (dto.categories?.length) {
      qb.andWhere('w.category IN (:...cats)', { cats: dto.categories });
    }
    const allWords = await qb.getMany();

    if (allWords.length === 0) {
      return { session_id: uuidv4(), questions: [], timer_seconds: timerSeconds };
    }

    // Joindre avec la progression pour pondérer la sélection
    const progressions = await this.progressionRepo.find({
      where: allWords.map((w) => ({ word_id: w.id })),
    });
    const progMap = new Map(progressions.map((p) => [p.word_id, p]));

    // Sélection pondérée : jamais vu=5, en cours=3, maîtrisé=1
    const selected = this.weightedSample(allWords, progMap, count);

    // Construire les questions
    const questions: ImagierQuestion[] = [];
    for (const word of selected) {
      const resolvedMode = dto.mode === 'random' || !dto.mode
        ? Math.random() > 0.5 ? 'fr_to_en' : 'en_to_fr'
        : dto.mode;

      const distractors = this.pickDistractors(word, allWords, choicesCount - 1);
      const correct = {
        id: word.id,
        label: resolvedMode === 'fr_to_en' ? word.en : word.fr,
      };
      const wrongChoices = distractors.map((d) => ({
        id: d.id,
        label: resolvedMode === 'fr_to_en' ? d.en : d.fr,
      }));

      const choices = this.shuffle([correct, ...wrongChoices]);
      const image_url = this.buildImageUrl(word);

      questions.push({
        word_id: word.id,
        image_url,
        prompt: resolvedMode === 'fr_to_en' ? word.fr : word.en,
        choices,
        correct_id: word.id,
        direction: resolvedMode as 'fr_to_en' | 'en_to_fr',
      });
    }

    const session = this.sessionRepo.create({
      id: uuidv4(),
      mode: dto.mode ?? 'fr_to_en',
      difficulty,
      categories: JSON.stringify(dto.categories ?? []),
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds };
  }

  async recordAnswer(sessionId: string, wordId: string, isCorrect: boolean): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('imagier_mastery_threshold')) ?? '5',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({ word_id: wordId });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: uuidv4(),
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

    if (!prog.is_mastered && prog.correct_count >= threshold) {
      prog.is_mastered = true;
      prog.mastered_at = new Date();
    }

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
      qb.andWhere('w.is_active = :active', { active: filters.is_active ? 1 : 0 });
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
      id: uuidv4(),
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

  async getCategories(): Promise<{ category: string; count: number; active_count: number }[]> {
    const rows = await this.wordRepo
      .createQueryBuilder('w')
      .select('w.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(CASE WHEN w.is_active = 1 THEN 1 ELSE 0 END)', 'active_count')
      .groupBy('w.category')
      .orderBy('w.category')
      .getRawMany<{ category: string; count: string; active_count: string }>();

    return rows.map((r) => ({
      category: r.category,
      count: parseInt(r.count, 10),
      active_count: parseInt(r.active_count, 10),
    }));
  }

  async getProgression(): Promise<
    (ImagierWord & { progression: ImagierProgression | null })[]
  > {
    const words = await this.wordRepo.find({ order: { category: 'ASC', fr: 'ASC' } });
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
  ): ImagierWord[] {
    if (words.length <= count) return this.shuffle([...words]);

    // Construire un tableau pondéré
    const weighted: ImagierWord[] = [];
    for (const w of words) {
      const prog = progMap.get(w.id);
      const weight = !prog ? 5 : prog.is_mastered ? 1 : 3;
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
    const sameCategory = candidates.filter((w) => w.category === correct.category);
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
