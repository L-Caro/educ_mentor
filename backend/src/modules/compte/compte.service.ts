import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompteProgression } from './entities/compte-progression.entity';
import { CompteSession } from './entities/compte-session.entity';
import { SettingsService } from '../settings/settings.service';
import { isMastered, masteryScore } from '../../common/mastery';
import { normalizeDifficulty, type Difficulty } from '../../common/difficulty';
import {
  COMPTE_OPERATIONS,
  DEFAULT_ACTIVE_COMPTE_OPERATIONS,
  isCompteOperation,
} from './compte.operations';
import {
  genererCompte,
  type CompteQuestion,
  type Operation,
} from './compte.generator';
import type {
  CompleteCompteSessionDto,
  RecordCompteAnswerDto,
  StartCompteSessionDto,
} from './dto/compte.dto';

export interface CompteSessionQuestion extends CompteQuestion {
  /** Les opérations que l'enfant a le droit d'employer. Répété sur chaque question, bien
   *  qu'il soit constant pour la séance : le clavier d'opérateurs se construit depuis la
   *  question, comme la grille du calcul posé. */
  operations: Operation[];
}

export interface CompteSessionResult {
  session_id: string;
  questions: CompteSessionQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

/** Ce que la difficulté règle : la LONGUEUR DE LA CHAÎNE.
 *
 * Pas la taille des nombres — 100 s'atteint d'un coup d'œil avec 25 × 4, alors que 37
 * peut demander trois opérations. Les bornes de cible ne sont là que pour écarter les
 * tirages sans intérêt : une cible à 4, on ne la cherche pas, on la voit.
 *
 * Les grandes plaques restent au vestiaire en facile. Non pour rendre le jeu plus dur,
 * mais parce que l'exercice y est de combiner de petits nombres ; 75 + 25 = 100 ne fait
 * pratiquer aucun calcul.
 *
 * D'où le plancher très bas en facile. Il était à 10, et cela rendait trois
 * configurations INJOUABLES — sans l'addition, deux petites plaques soustraites ne
 * dépassent jamais 8, et le pré-jeu servait alors « Aucun compte à chercher ». Avec la
 * soustraction seule, les cibles SONT petites : c'est la vérité de ce réglage, pas un
 * défaut à corriger en rouvrant les grandes plaques.
 */
const REGLAGE_PAR_DIFFICULTE: Record<
  Difficulty,
  {
    etapes: number;
    cibleMin: number;
    cibleMax: number;
    grandesPlaques: boolean;
  }
> = {
  easy: { etapes: 2, cibleMin: 3, cibleMax: 100, grandesPlaques: false },
  medium: { etapes: 3, cibleMin: 20, cibleMax: 500, grandesPlaques: true },
  hard: { etapes: 4, cibleMin: 30, cibleMax: 2000, grandesPlaques: true },
};

@Injectable()
export class CompteService {
  constructor(
    @InjectRepository(CompteProgression)
    private readonly progressionRepo: Repository<CompteProgression>,
    @InjectRepository(CompteSession)
    private readonly sessionRepo: Repository<CompteSession>,
    private readonly settingsService: SettingsService,
  ) {}

  /** Le catalogue COMPLET, ouvertes comme fermées : l'administration doit voir les
   * fermées, sinon il n'y a rien à ouvrir. */
  getOperations() {
    return COMPTE_OPERATIONS;
  }

  async getActiveOperations(): Promise<Operation[]> {
    const raw = await this.settingsService.get('compte_operations_actives');
    try {
      const parsed = JSON.parse(raw ?? '[]') as unknown;
      const valid = Array.isArray(parsed)
        ? parsed.filter(isCompteOperation)
        : [];
      return valid.length > 0 ? valid : DEFAULT_ACTIVE_COMPTE_OPERATIONS;
    } catch {
      return DEFAULT_ACTIVE_COMPTE_OPERATIONS;
    }
  }

  async setActiveOperations(keys: string[]): Promise<Operation[]> {
    const valid = keys.filter(isCompteOperation);
    await this.settingsService.set(
      'compte_operations_actives',
      JSON.stringify(valid),
    );
    return valid;
  }

  /** Les opérations actives, avec libellé et exemple. Servi au PRÉ-JEU. */
  async getOperationsOuvertes() {
    const actives = await this.getActiveOperations();
    return COMPTE_OPERATIONS.filter((operation) =>
      actives.includes(operation.key),
    );
  }

  async startSession(dto: StartCompteSessionDto): Promise<CompteSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const reglage = REGLAGE_PAR_DIFFICULTE[difficulty];

    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const perSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );
    const isUnlimited = perSession === 0;
    // Un compte se cherche : dix d'affilée font déjà une longue séance, et le mode
    // « illimité » des autres modules n'a pas de sens ici.
    const count = isUnlimited ? 10 : Math.min(perSession, 10);

    // Le pré-jeu propose, l'administration dispose : une opération cochée mais non
    // ouverte ne doit rien produire. Le pré-jeu ne montre déjà que les actives — ce
    // filtre est la ceinture.
    const actives = await this.getActiveOperations();
    const demandees = (dto.operations ?? [])
      .filter(isCompteOperation)
      .filter((operation) => actives.includes(operation));
    const operations: Operation[] = demandees.length ? demandees : actives;

    const questions: CompteSessionQuestion[] = [];
    const dejaVues = new Set<string>();
    let attempts = 0;
    while (questions.length < count && attempts < count * 20) {
      attempts++;
      const question = genererCompte({
        operations,
        etapes: reglage.etapes,
        grandesPlaques: reglage.grandesPlaques,
        cibleMin: reglage.cibleMin,
        cibleMax: reglage.cibleMax,
        rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
      });
      if (!question) continue;
      // Deux fois le même tirage dans la même séance, c'est la deuxième fois pour rien.
      if (dejaVues.has(question.item_key)) continue;
      dejaVues.add(question.item_key);
      questions.push({ ...question, operations });
    }

    const session = this.sessionRepo.create({
      id: randomUUID(),
      difficulty,
      operations: operations.join(','),
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return {
      session_id: session.id,
      questions,
      timer_seconds: timerSeconds,
      is_unlimited: isUnlimited,
    };
  }

  async recordAnswer(dto: RecordCompteAnswerDto): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({
      skill_key: dto.skill_key,
    });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
        skill_key: dto.skill_key,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) prog.correct_count++;
    else prog.incorrect_count++;
    prog.last_seen = new Date();
    prog.is_mastered = isMastered(
      masteryScore(prog.correct_count, prog.incorrect_count),
      threshold,
    );

    await this.progressionRepo.save(prog);
  }

  async completeSession(
    sessionId: string,
    dto: CompleteCompteSessionDto,
  ): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session || session.completed_at) return;
    session.correct_answers = dto.correct_answers;
    session.total_questions = dto.total_questions;
    session.completed_at = new Date();
    await this.sessionRepo.save(session);
  }

  getProgression(): Promise<CompteProgression[]> {
    return this.progressionRepo.find({ order: { skill_key: 'ASC' } });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }
}
