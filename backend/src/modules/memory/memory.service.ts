import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { MemorySession } from './entities/memory-session.entity';
import { MemoryCard } from './entities/memory-card.entity';
import type { MemoryMode, StartMemorySessionDto } from './dto/memory.dto';

export interface MemoryPair {
  id: string;
  image_url: string | null;
  word_fr: string;
  word_en: string;
}

export interface MemorySessionResult {
  session_id: string;
  pairs: MemoryPair[];
  mode: MemoryMode;
}

export interface MemoryProgressionStat {
  is_mastered: boolean;
  correct_count: number; // = pairs_count (paires trouvées : toujours le total pour Memory)
  incorrect_count: number; // = attempts - pairs_count (coups en trop)
}

@Injectable()
export class MemoryService {
  constructor(
    @InjectRepository(MemorySession)
    private readonly sessionRepo: Repository<MemorySession>,
    @InjectRepository(MemoryCard)
    private readonly cardRepo: Repository<MemoryCard>,
  ) {}

  async startSession(dto: StartMemorySessionDto): Promise<MemorySessionResult> {
    const cards = await this.cardRepo
      .createQueryBuilder('card')
      .where('card.image_filename IS NOT NULL')
      .orderBy('RANDOM()')
      .limit(dto.pairs_count)
      .getMany();

    const pairs: MemoryPair[] = cards.map((card) => ({
      id: card.id,
      image_url: `/media/memory/${encodeURIComponent(card.image_filename)}`,
      word_fr: card.fr,
      word_en: card.en,
    }));

    const session = this.sessionRepo.create({
      id: randomUUID(),
      pairs_count: dto.pairs_count,
      mode: dto.mode,
      categories: '[]',
      attempts: null,
      completed_at: null,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, pairs, mode: dto.mode };
  }

  async completeSession(sessionId: string, attempts: number): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return;
    session.attempts = attempts;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  async getProgression(): Promise<MemoryProgressionStat[]> {
    const sessions = await this.sessionRepo.find({
      where: { completed_at: Not(IsNull()) },
      order: { completed_at: 'DESC' },
    });

    return sessions.map((session) => ({
      is_mastered: session.attempts === session.pairs_count,
      correct_count: session.pairs_count,
      incorrect_count: (session.attempts ?? 0) - session.pairs_count,
    }));
  }

  async resetProgression(): Promise<void> {
    await this.sessionRepo.clear();
  }
}
