import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { PenduWord } from './entities/pendu-word.entity';
import { PenduSession } from './entities/pendu-session.entity';
import { PENDU_SEED_WORDS } from './data/pendu-seed';
import type {
  StartPenduSessionDto,
  CompletePenduSessionDto,
  CreatePenduWordDto,
  UpdatePenduWordDto,
} from './dto/pendu.dto';

export interface StartSessionResult {
  session_id: string;
  word: string;
  pre_revealed: string[];
  max_errors: number;
}

export interface ProgressionStat {
  is_mastered: boolean;
  correct_count: number;
  incorrect_count: number;
}

@Injectable()
export class PenduService implements OnModuleInit {
  constructor(
    @InjectRepository(PenduWord)
    private readonly wordRepo: Repository<PenduWord>,
    @InjectRepository(PenduSession)
    private readonly sessionRepo: Repository<PenduSession>,
  ) {}

  async onModuleInit() {
    const count = await this.wordRepo.count();
    if (count === 0) {
      for (const entry of PENDU_SEED_WORDS) {
        await this.wordRepo.save(
          this.wordRepo.create({
            id: uuidv4(),
            word: entry.word,
            difficulty: entry.difficulty,
            is_active: true,
          }),
        );
      }
    }
  }

  // ─── Jeu ─────────────────────────────────────────────────────────────────

  async startSession(dto: StartPenduSessionDto): Promise<StartSessionResult> {
    // Cherche des mots actifs selon difficulté et longueur
    let words = await this.wordRepo.findBy({ is_active: true, difficulty: dto.difficulty });

    // Fallback sur tous les mots actifs si aucun trouvé pour la difficulté
    if (words.length === 0) {
      words = await this.wordRepo.findBy({ is_active: true });
    }

    if (words.length === 0) {
      throw new BadRequestException('Aucun mot disponible');
    }

    // Filtre par longueur si demandé
    if (dto.word_length && dto.word_length !== 'any') {
      const byLength = words.filter((w) => {
        const len = w.word.length;
        if (dto.word_length === 'short') return len >= 5 && len <= 6;
        if (dto.word_length === 'medium') return len >= 7 && len <= 8;
        if (dto.word_length === 'long') return len >= 9;
        return true;
      });
      if (byLength.length > 0) words = byLength;
      // sinon on garde le pool non filtré (fallback silencieux)
    }

    const pickedWord = words[Math.floor(Math.random() * words.length)];

    const max_errors = 6;

    // Pré-révèle N lettres distinctes aléatoires selon le paramètre
    const revealCount = dto.letters_revealed ?? 0;
    let pre_revealed: string[] = [];
    if (revealCount > 0) {
      const distinctLetters = [...new Set(pickedWord.word.split(''))];
      const shuffled = this.shuffle(distinctLetters);
      pre_revealed = shuffled.slice(0, Math.min(revealCount, shuffled.length));
    }

    const session = this.sessionRepo.create({
      id: uuidv4(),
      word_id: pickedWord.id,
      word: pickedWord.word,
      difficulty: dto.difficulty,
      won: null,
      completed_at: null,
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      word: pickedWord.word,
      pre_revealed,
      max_errors,
    };
  }

  async completeSession(sessionId: string, dto: CompletePenduSessionDto): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return;
    session.won = dto.won;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  // ─── Admin — mots ─────────────────────────────────────────────────────────

  async findWords(search?: string): Promise<PenduWord[]> {
    const qb = this.wordRepo.createQueryBuilder('w').orderBy('w.word', 'ASC');
    if (search) {
      qb.where('w.word LIKE :search', { search: `%${search.toUpperCase()}%` });
    }
    return qb.getMany();
  }

  async createWord(dto: CreatePenduWordDto): Promise<PenduWord> {
    const normalized = this.normalizeWord(dto.word);
    if (normalized.length < 5) {
      throw new BadRequestException('Le mot doit contenir au moins 5 lettres');
    }
    const word = this.wordRepo.create({
      id: uuidv4(),
      word: normalized,
      difficulty: dto.difficulty,
      is_active: dto.is_active ?? true,
    });
    return this.wordRepo.save(word);
  }

  async updateWord(id: string, dto: UpdatePenduWordDto): Promise<PenduWord | null> {
    const word = await this.wordRepo.findOneBy({ id });
    if (!word) return null;
    if (dto.word !== undefined) {
      word.word = this.normalizeWord(dto.word);
    }
    if (dto.difficulty !== undefined) word.difficulty = dto.difficulty;
    if (dto.is_active !== undefined) word.is_active = dto.is_active;
    return this.wordRepo.save(word);
  }

  async deleteWord(id: string): Promise<void> {
    await this.wordRepo.delete(id);
  }

  // ─── Admin — progression ──────────────────────────────────────────────────

  async getProgression(): Promise<ProgressionStat[]> {
    const sessions = await this.sessionRepo.find({
      where: { completed_at: Not(IsNull()) },
      order: { completed_at: 'DESC' },
    });

    return sessions.map((s) => ({
      is_mastered: s.won === true,
      correct_count: s.won ? 1 : 0,
      incorrect_count: s.won ? 0 : 1,
    }));
  }

  async resetProgression(): Promise<void> {
    await this.sessionRepo.clear();
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  /** Convertit un mot en majuscules sans accents, en ne gardant que [A-Z]. */
  private normalizeWord(w: string): string {
    return w
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^A-Z]/g, '');
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