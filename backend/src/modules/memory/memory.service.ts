import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { MemorySession } from './entities/memory-session.entity';
import { ImagierService } from '../imagier/imagier.service';
import type { StartMemorySessionDto, MemoryMode } from './dto/memory.dto';
import { randomUUID } from 'node:crypto';

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
  correct_count: number; // = pairs_count (pairs found — toujours total pour Memory)
  incorrect_count: number; // = attempts - pairs_count (coups en trop)
}

@Injectable()
export class MemoryService {
  constructor(
    @InjectRepository(MemorySession)
    private readonly sessionRepo: Repository<MemorySession>,
    private readonly imagierService: ImagierService,
  ) {}

  async startSession(dto: StartMemorySessionDto): Promise<MemorySessionResult> {
    const words = await this.imagierService.getRandomWordsWithImages(
      dto.categories,
      dto.pairs_count,
    );

    const pairs: MemoryPair[] = words.map((w) => ({
      id: w.id,
      image_url: w.image_url,
      word_fr: w.fr,
      word_en: w.en,
    }));

    const session = this.sessionRepo.create({
      id: randomUUID(),
      pairs_count: dto.pairs_count,
      mode: dto.mode,
      categories: JSON.stringify(dto.categories ?? []),
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

    return sessions.map((s) => ({
      is_mastered: s.attempts === s.pairs_count,
      correct_count: s.pairs_count,
      incorrect_count: (s.attempts ?? 0) - s.pairs_count,
    }));
  }

  async resetProgression(): Promise<void> {
    await this.sessionRepo.clear();
  }
}
