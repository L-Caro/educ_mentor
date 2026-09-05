import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';
import { DicteeWordStat } from './entities/dictee-word-stat.entity';
import { isMastered, masteryScore } from '../../common/mastery';
import {
  extractWords,
  filterByNotion,
  normalizeWordKey,
  resolveItemCount,
  type Longueur,
  type Niveau,
} from './dictee.logic';
import type {
  CreateDicteeItemDto,
  CompleteDicteeSessionDto,
  StartDicteeSessionDto,
  UpdateDicteeItemDto,
} from './dto/dictee.dto';

/** Un mot vu 3 fois sans faute nette est considéré acquis : plus bas que le seuil des
 * modules à répétition rapide : en dictée, un mot revient rarement. */
const DICTEE_MASTERY_THRESHOLD = 3;

export interface DicteeSessionItem {
  id: string;
  contenu: string;
  notions: string[];
}

export interface DicteeSessionResponse {
  session_id: string;
  niveau: string;
  preparee: boolean;
  items: DicteeSessionItem[];
  total_words: number;
}

export interface ProgressionStat {
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
}

export interface DicteeWordError {
  word: string;
  incorrect_count: number;
  correct_count: number;
  last_seen: Date | null;
}

@Injectable()
export class DicteeService {
  constructor(
    @InjectRepository(DicteeItem)
    private readonly itemRepo: Repository<DicteeItem>,
    @InjectRepository(DicteeSession)
    private readonly sessionRepo: Repository<DicteeSession>,
    @InjectRepository(DicteeWordStat)
    private readonly statRepo: Repository<DicteeWordStat>,
  ) {}

  // ─── Jeu ──────────────────────────────────────────────────────────────────

  /** Notions distinctes des items actifs, pour le filtre du pré-jeu. */
  async getNotions(niveau?: string): Promise<string[]> {
    const where = niveau ? { is_active: true, niveau } : { is_active: true };
    const items = await this.itemRepo.find({ where });
    const notions = new Set<string>();
    for (const item of items) {
      for (const notion of item.notions) notions.add(notion);
    }
    return [...notions].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  async startSession(
    dto: StartDicteeSessionDto,
  ): Promise<DicteeSessionResponse> {
    const niveau = dto.niveau as Niveau;
    const notion = dto.notion?.trim() || null;

    const pool = filterByNotion(
      await this.itemRepo.find({ where: { is_active: true, niveau } }),
      notion,
    );
    if (pool.length === 0) {
      throw new BadRequestException(
        'Aucun contenu disponible pour ce niveau et cette notion.',
      );
    }

    const count = resolveItemCount(niveau, dto.longueur as Longueur);
    const picked = this.shuffle(pool).slice(0, count);
    const totalWords = picked.reduce(
      (sum, item) => sum + extractWords(item.contenu).length,
      0,
    );

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        id: randomUUID(),
        niveau,
        item_ids: picked.map((item) => item.id),
        notion,
        preparee: dto.preparee ?? false,
        wrong_words: null,
        total_words: totalWords,
        started_at: new Date(),
        completed_at: null,
      }),
    );

    return {
      session_id: session.id,
      niveau,
      preparee: session.preparee,
      total_words: totalWords,
      items: picked.map((item) => ({
        id: item.id,
        contenu: item.contenu,
        notions: item.notions,
      })),
    };
  }

  async completeSession(
    sessionId: string,
    dto: CompleteDicteeSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session)
      throw new NotFoundException(`Session ${sessionId} introuvable`);
    if (session.completed_at) return;

    const items = session.item_ids.length
      ? await this.itemRepo.findBy({ id: In(session.item_ids) })
      : [];

    // Un mot par séance, pas un par occurrence : on agrège sur les clés distinctes servies.
    const served = new Map<string, string>();
    for (const item of items) {
      for (const word of extractWords(item.contenu)) {
        if (!served.has(word.key)) served.set(word.key, word.display);
      }
    }

    const wrong = new Set(dto.wrongWords.map(normalizeWordKey).filter(Boolean));

    for (const [key, display] of served) {
      await this.bumpWordStat(key, display, wrong.has(key));
    }

    session.wrong_words = [...wrong].filter((key) => served.has(key));
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  private async bumpWordStat(
    key: string,
    display: string,
    wasWrong: boolean,
  ): Promise<void> {
    const stat =
      (await this.statRepo.findOneBy({ word_key: key })) ??
      this.statRepo.create({
        word_key: key,
        display,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });

    if (wasWrong) stat.incorrect_count += 1;
    else stat.correct_count += 1;
    stat.last_seen = new Date();
    stat.is_mastered = isMastered(
      masteryScore(stat.correct_count, stat.incorrect_count),
      DICTEE_MASTERY_THRESHOLD,
    );

    await this.statRepo.save(stat);
  }

  // ─── Admin : progression ──────────────────────────────────────────────────

  async getProgression(): Promise<ProgressionStat[]> {
    const stats = await this.statRepo.find();
    return stats.map((stat) => ({
      is_mastered: stat.is_mastered,
      correct_count: stat.correct_count,
      incorrect_count: stat.incorrect_count,
    }));
  }

  /** Liste détaillée des mots déjà ratés au moins une fois, les plus ratés en tête. */
  async getWordErrors(): Promise<DicteeWordError[]> {
    const stats = await this.statRepo.find({
      where: { incorrect_count: MoreThan(0) },
    });
    return stats
      .sort(
        (a, b) =>
          b.incorrect_count - a.incorrect_count ||
          a.display.localeCompare(b.display, 'fr'),
      )
      .map((stat) => ({
        word: stat.display,
        incorrect_count: stat.incorrect_count,
        correct_count: stat.correct_count,
        last_seen: stat.last_seen,
      }));
  }

  async resetProgression(): Promise<void> {
    await this.statRepo.manager.transaction(async (manager) => {
      await manager.getRepository(DicteeWordStat).clear();
      await manager.getRepository(DicteeSession).clear();
    });
  }

  // ─── Admin : items ────────────────────────────────────────────────────────

  findItems(filters: {
    niveau?: string;
    is_active?: boolean;
  }): Promise<DicteeItem[]> {
    const where: Record<string, unknown> = {};
    if (filters.niveau) where.niveau = filters.niveau;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    return this.itemRepo.find({ where, order: { created_at: 'DESC' } });
  }

  createItem(dto: CreateDicteeItemDto): Promise<DicteeItem> {
    return this.itemRepo.save(
      this.itemRepo.create({
        id: randomUUID(),
        niveau: dto.niveau,
        contenu: dto.contenu.trim(),
        notions: dto.notions ?? [],
        is_active: dto.is_active ?? false,
      }),
    );
  }

  async updateItem(id: string, dto: UpdateDicteeItemDto): Promise<DicteeItem> {
    const item = await this.itemRepo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Item "${id}" introuvable`);
    if (dto.niveau !== undefined) item.niveau = dto.niveau;
    if (dto.contenu !== undefined) item.contenu = dto.contenu.trim();
    if (dto.notions !== undefined) item.notions = dto.notions;
    if (dto.is_active !== undefined) item.is_active = dto.is_active;
    return this.itemRepo.save(item);
  }

  async deleteItem(id: string): Promise<void> {
    await this.itemRepo.delete(id);
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  private shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let index = copy.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swap]] = [copy[swap], copy[index]];
    }
    return copy;
  }
}
