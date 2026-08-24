import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LectureText } from './entities/lecture-text.entity';
import { LectureQuestion } from './entities/lecture-question.entity';
import { LectureSession } from './entities/lecture-session.entity';
import { LectureProgression } from './entities/lecture-progression.entity';
import { normalizeDifficulty, type Difficulty } from '../../common/difficulty';
import type {
  StartLectureSessionDto,
  CompleteLectureSessionDto,
  CreateTextDto,
  UpdateTextDto,
  CreateQuestionDto,
  UpdateQuestionDto,
} from './dto/lecture.dto';

export interface LectureSessionQuestion {
  item_key: string;
  display: string;
  choices: string[];
  answer: string;
  show_text: boolean;
  text_contenu: string;
  text_titre: string;
  /** Le passage du texte qui porte la réponse. Toujours envoyé : la fiche de leçon
   * l'affiche APRÈS la réponse, où le révéler n'est plus tricher mais expliquer. */
  excerpt: string | null;
  /** Faut-il le surligner PENDANT la question ? Vrai en mode facile seulement.
   * Séparer les deux évite qu'une décision d'affichage soit encodée dans l'absence
   * de la donnée : le serveur envoie le fait, le client décide quoi en montrer. */
  highlight_excerpt: boolean;
}

export interface LectureSessionResponse {
  session_id: string;
  questions: LectureSessionQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

export interface LectureTextSummary {
  id: number;
  titre: string;
  actif: boolean;
  question_count: number;
  play_count: number;
  last_played_at: Date | null;
  best_correct: number;
  best_total: number;
}

@Injectable()
export class LectureService {
  constructor(
    @InjectRepository(LectureText) private textsRepo: Repository<LectureText>,
    @InjectRepository(LectureQuestion)
    private questionsRepo: Repository<LectureQuestion>,
    @InjectRepository(LectureSession)
    private sessionsRepo: Repository<LectureSession>,
    @InjectRepository(LectureProgression)
    private progressionRepo: Repository<LectureProgression>,
  ) {}

  // ─── Game endpoints ────────────────────────────────────────────────────────

  async getActiveTexts(): Promise<LectureTextSummary[]> {
    const texts = await this.textsRepo.find({
      where: { actif: true },
      relations: ['questions'],
      order: { created_at: 'ASC' },
    });

    const progressions = await this.progressionRepo.find();
    const progMap = new Map(progressions.map((p) => [p.text_id, p]));

    return texts.map((t) => {
      const prog = progMap.get(t.id);
      return {
        id: t.id,
        titre: t.titre,
        actif: t.actif,
        question_count: t.questions?.length ?? 0,
        play_count: prog?.play_count ?? 0,
        last_played_at: prog?.last_played_at ?? null,
        best_correct: prog?.best_correct ?? 0,
        best_total: prog?.best_total ?? 0,
      };
    });
  }

  async createSession(
    dto: StartLectureSessionDto,
  ): Promise<LectureSessionResponse> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const text = await this.textsRepo.findOne({
      where: { id: dto.textId },
      relations: ['questions'],
    });
    if (!text) throw new NotFoundException(`Texte ${dto.textId} introuvable`);

    const choiceCount = this.choiceCount(difficulty);
    const showText = difficulty !== 'hard';

    const sorted = [...text.questions].sort((a, b) => a.ordre - b.ordre);
    const questions: LectureSessionQuestion[] = sorted.map((q) => {
      const needed = choiceCount - 1;
      const shuffledDistractors = this.shuffle([...q.distractors]).slice(
        0,
        needed,
      );
      const choices = this.shuffle([q.answer, ...shuffledDistractors]);
      return {
        item_key: `lecture_q_${q.id}`,
        display: q.question,
        choices,
        answer: q.answer,
        show_text: showText,
        text_contenu: text.contenu,
        text_titre: text.titre,
        excerpt: q.excerpt ?? null,
        highlight_excerpt: difficulty === 'easy',
      };
    });

    const session = this.sessionsRepo.create({
      id: randomUUID(),
      text_id: text.id,
      difficulty,
      started_at: new Date(),
    });
    await this.sessionsRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: 0,
      is_unlimited: true,
    };
  }

  async completeSession(
    sessionId: string,
    dto: CompleteLectureSessionDto,
  ): Promise<void> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
    });
    if (!session)
      throw new NotFoundException(`Session ${sessionId} introuvable`);
    if (session.completed_at) return;
    if (dto.correctAnswers > dto.totalQuestions) {
      throw new BadRequestException(
        'correctAnswers ne peut pas dépasser totalQuestions',
      );
    }

    session.correct_answers = dto.correctAnswers;
    session.total_questions = dto.totalQuestions;
    session.completed_at = new Date();
    await this.sessionsRepo.save(session);

    await this.updateProgression(
      session.text_id,
      dto.correctAnswers,
      dto.totalQuestions,
    );
  }

  async recordAnswer(
    _sessionId: string,
    _itemKey: string,
    _isCorrect: boolean,
  ): Promise<void> {
    // Réponses individuelles non persistées ; seuls les totaux de session sont enregistrés via completeSession.
  }

  private async updateProgression(
    textId: number,
    correct: number,
    total: number,
  ): Promise<void> {
    let prog = await this.progressionRepo.findOne({
      where: { text_id: textId },
    });
    if (prog) {
      prog.play_count += 1;
      prog.last_played_at = new Date();
      if (correct > prog.best_correct) {
        prog.best_correct = correct;
        prog.best_total = total;
      }
    } else {
      prog = this.progressionRepo.create({
        text_id: textId,
        play_count: 1,
        last_played_at: new Date(),
        best_correct: correct,
        best_total: total,
      });
    }
    await this.progressionRepo.save(prog);
  }

  // ─── Admin — textes ────────────────────────────────────────────────────────

  async getAllTexts(): Promise<(LectureText & { question_count: number })[]> {
    const texts = await this.textsRepo.find({
      relations: ['questions'],
      order: { created_at: 'ASC' },
    });
    return texts.map((t) =>
      Object.assign(t, { question_count: t.questions?.length ?? 0 }),
    );
  }

  async createText(dto: CreateTextDto): Promise<LectureText> {
    const text = this.textsRepo.create({ ...dto, actif: dto.actif ?? true });
    return this.textsRepo.save(text);
  }

  async updateText(id: number, dto: UpdateTextDto): Promise<LectureText> {
    const text = await this.textsRepo.findOne({ where: { id } });
    if (!text) throw new NotFoundException(`Texte ${id} introuvable`);
    Object.assign(text, dto);
    return this.textsRepo.save(text);
  }

  async deleteText(id: number): Promise<void> {
    await this.textsRepo.delete(id);
  }

  // ─── Admin — questions ─────────────────────────────────────────────────────

  async getQuestionsForText(textId: number): Promise<LectureQuestion[]> {
    return this.questionsRepo.find({
      where: { text_id: textId },
      order: { ordre: 'ASC', id: 'ASC' },
    });
  }

  async createQuestion(
    textId: number,
    dto: CreateQuestionDto,
  ): Promise<LectureQuestion> {
    const text = await this.textsRepo.findOne({ where: { id: textId } });
    if (!text) throw new NotFoundException(`Texte ${textId} introuvable`);
    const q = this.questionsRepo.create({
      ...dto,
      text_id: textId,
      excerpt: dto.excerpt ?? null,
    });
    return this.questionsRepo.save(q);
  }

  async updateQuestion(
    id: number,
    dto: UpdateQuestionDto,
  ): Promise<LectureQuestion> {
    const q = await this.questionsRepo.findOne({ where: { id } });
    if (!q) throw new NotFoundException(`Question ${id} introuvable`);
    Object.assign(q, dto);
    return this.questionsRepo.save(q);
  }

  async deleteQuestion(id: number): Promise<void> {
    await this.questionsRepo.delete(id);
  }

  // ─── Admin — progression ───────────────────────────────────────────────────

  async getProgression(): Promise<
    { is_mastered: boolean; correct_count: number; incorrect_count: number }[]
  > {
    const items = await this.progressionRepo.find();
    if (items.length === 0) return [];

    const texts = await this.textsRepo.find({
      where: { id: In(items.map((p) => p.text_id)) },
      relations: ['questions'],
    });
    const questionCountMap = new Map(
      texts.map((t) => [t.id, t.questions?.length ?? 0]),
    );

    return items.map((p) => {
      const currentTotal = questionCountMap.get(p.text_id) ?? p.best_total;
      return {
        is_mastered:
          p.best_total > 0 &&
          p.best_correct === p.best_total &&
          p.best_total === currentTotal,
        correct_count: p.best_correct,
        incorrect_count: Math.max(0, p.best_total - p.best_correct),
      };
    });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
  }

  // ─── Utils ─────────────────────────────────────────────────────────────────

  // Intentionnellement différent de qcmChoiceCount (hard=0 pour les autres modules) :
  // lecture n'utilise jamais la saisie libre, même en difficile.
  private choiceCount(difficulty: Difficulty): number {
    if (difficulty === 'easy') return 2;
    if (difficulty === 'medium') return 4;
    return 6;
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
