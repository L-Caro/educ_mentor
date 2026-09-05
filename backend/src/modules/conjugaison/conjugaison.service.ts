import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { ConjugaisonProgression } from './entities/conjugaison-progression.entity';
import { ConjugaisonSession } from './entities/conjugaison-session.entity';
import { SettingsService } from '../settings/settings.service';
import type {
  StartConjugaisonSessionDto,
  RecordConjugaisonAnswerDto,
} from './dto/conjugaison.dto';
import { masteryScore, isMastered } from '../../common/mastery';
import { normalizeDifficulty, qcmChoiceCount } from '../../common/difficulty';
import { randomUUID } from 'node:crypto';

import {
  DEFAULT_ACTIVE_TENSES,
  TENSES,
  conjugaisonsCompletes,
  isTense,
  type Pronom,
  type Tense,
  type VerbData,
} from './conjugaison.temps';

export interface ConjugaisonQuestion {
  infinitif: string;
  tense: string;
  pronoun: Pronom;
  conjugated: string;
  groupe: string;
  direction: 'forward' | 'reverse';
  choices: string[];
  /** Les six formes du verbe à ce temps, pour que le front puisse afficher le tableau
   * complet dans la fiche de leçon. La donnée est déjà en mémoire ici ; la recalculer
   * côté client aurait demandé d'y dupliquer le fichier de conjugaisons. */
  forms: Record<Pronom, string>;
}

export interface ConjugaisonSessionResult {
  session_id: string;
  questions: ConjugaisonQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

const SETTING_ACTIVE_TENSES = 'conjugaison_temps_actifs';

const VALID_GROUPS = ['auxiliaire', '1', '2', '3'] as const;

@Injectable()
export class ConjugaisonService {
  private readonly verbs: Record<string, VerbData>;

  constructor(
    @InjectRepository(ConjugaisonProgression)
    private readonly progressionRepo: Repository<ConjugaisonProgression>,
    @InjectRepository(ConjugaisonSession)
    private readonly sessionRepo: Repository<ConjugaisonSession>,
    private readonly settingsService: SettingsService,
  ) {
    const jsonPath = path.join(__dirname, 'data', 'conjugaisons.json');
    const brut = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as Record<
      string,
      VerbData
    >;

    // Le fichier ne porte que les trois temps simples. Les quatre autres sont dérivés ICI,
    // une fois au démarrage : `conjugaisonsCompletes` est pure, et tout le reste du service
    // continue de lire `verbe.conjugaisons[temps]` sans savoir lesquels ont été saisis.
    const auxiliaires = { avoir: brut['avoir'], être: brut['être'] };
    this.verbs = Object.fromEntries(
      Object.entries(brut).map(([infinitif, verbe]) => [
        infinitif,
        { ...verbe, conjugaisons: conjugaisonsCompletes(verbe, auxiliaires) },
      ]),
    );
  }

  // ─── Temps actifs ─────────────────────────────────────────────────────────

  /** Le catalogue complet : tous les temps du CP au CM2, ouverts comme fermés.
   * L'administration doit voir les fermés — sinon il n'y a rien à ouvrir. */
  getTenses() {
    return TENSES;
  }

  async getActiveTenseKeys(): Promise<Tense[]> {
    const raw = await this.settingsService.get(SETTING_ACTIVE_TENSES);
    try {
      const parsed = JSON.parse(raw ?? '[]') as unknown;
      const valid = Array.isArray(parsed) ? parsed.filter(isTense) : [];
      return valid.length > 0 ? valid : DEFAULT_ACTIVE_TENSES;
    } catch {
      return DEFAULT_ACTIVE_TENSES;
    }
  }

  async setActiveTenseKeys(keys: string[]): Promise<Tense[]> {
    const valid = keys.filter(isTense);
    await this.settingsService.set(
      SETTING_ACTIVE_TENSES,
      JSON.stringify(valid),
    );
    return valid;
  }

  /** Les temps actifs, avec leur libellé et un exemple. Servi au PRÉ-JEU : l'enfant ne
   * doit voir que ce qu'elle peut réellement jouer. Les coder en dur côté front laisserait
   * cocher un temps fermé, que le service filtrerait ensuite — une case sans effet. */
  async getTempsOuverts() {
    const actifs = await this.getActiveTenseKeys();
    return TENSES.filter((temps) => actifs.includes(temps.key));
  }

  // ─── Session ──────────────────────────────────────────────────────────────

  async startSession(
    dto: StartConjugaisonSessionDto,
  ): Promise<ConjugaisonSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const questionsPerSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );

    const actifs = await this.getActiveTenseKeys();
    const tenses = this.normalizeTenses(dto.tenses).filter((t) =>
      actifs.includes(t as Tense),
    );
    const groups = this.normalizeGroups(dto.verb_groups);
    const direction = dto.question_direction ?? 'forward'; // 'random' résolu par question dans generateQuestions

    const verbsFilterRaw = await this.settingsService.get(
      'conjugaison_verbs_filter',
    );
    const verbsFilter = verbsFilterRaw
      ? verbsFilterRaw
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      : null;

    const availableVerbs = Object.entries(this.verbs)
      .filter(([, v]) =>
        groups.includes(v.groupe as (typeof VALID_GROUPS)[number]),
      )
      .filter(([inf]) => !verbsFilter || verbsFilter.includes(inf));

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(
      availableVerbs,
      tenses,
      direction,
      count,
      choicesCount,
    );

    const session = this.sessionRepo.create({
      id: randomUUID(),
      difficulty,
      tenses: tenses.join(','),
      verb_groups: groups.join(','),
      direction,
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

  async recordAnswer(
    sessionId: string,
    dto: RecordConjugaisonAnswerDto,
  ): Promise<void> {
    const threshold = parseInt(
      (await this.settingsService.get('mastery_threshold')) ?? '10',
      10,
    );

    let prog = await this.progressionRepo.findOneBy({
      verb_tense: dto.verb_tense,
    });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: randomUUID(),
        verb_tense: dto.verb_tense,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    if (dto.is_correct) {
      prog.correct_count++;
    } else {
      prog.incorrect_count++;
    }
    prog.last_seen = new Date();
    prog.is_mastered = isMastered(
      masteryScore(prog.correct_count, prog.incorrect_count),
      threshold,
    );

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

  getAvailableVerbs(): { infinitif: string; groupe: string }[] {
    return Object.entries(this.verbs).map(([infinitif, v]) => ({
      infinitif,
      groupe: v.groupe,
    }));
  }

  async getProgression(): Promise<ConjugaisonProgression[]> {
    return this.progressionRepo.find({ order: { verb_tense: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<ConjugaisonSession[]> {
    return this.sessionRepo.find({
      order: { started_at: 'DESC' },
      take: limit,
    });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Génération ───────────────────────────────────────────────────────────

  private generateQuestions(
    availableVerbs: [string, VerbData][],
    tenses: string[],
    direction: 'forward' | 'reverse' | 'random',
    count: number,
    choicesCount: number,
  ): ConjugaisonQuestion[] {
    const candidates: Array<{
      infinitif: string;
      tense: string;
      groupe: string;
    }> = [];
    for (const [infinitif, verbData] of availableVerbs) {
      for (const tense of tenses) {
        if (verbData.conjugaisons[tense]) {
          candidates.push({ infinitif, tense, groupe: verbData.groupe });
        }
      }
    }

    if (candidates.length === 0) return [];

    const questions: ConjugaisonQuestion[] = [];
    const used = new Set<string>();
    let attempts = 0;

    while (questions.length < count && attempts < count * 10) {
      attempts++;

      const candidate = candidates[this.rand(0, candidates.length - 1)];
      const pronoun = this.pickPronoun();
      const questionDirection: 'forward' | 'reverse' =
        direction === 'random'
          ? this.rand(0, 1) === 0
            ? 'forward'
            : 'reverse'
          : direction;
      const key = `${candidate.infinitif}_${candidate.tense}_${pronoun}_${questionDirection}`;

      if (used.has(key)) continue;
      used.add(key);

      const verbData = this.verbs[candidate.infinitif];
      const conjugated = verbData.conjugaisons[candidate.tense][pronoun];
      if (!conjugated) continue;

      const choices =
        choicesCount > 0
          ? this.buildChoices(
              candidate.infinitif,
              candidate.tense,
              pronoun,
              conjugated,
              questionDirection,
              availableVerbs,
              choicesCount,
            )
          : [];

      questions.push({
        infinitif: candidate.infinitif,
        tense: candidate.tense,
        pronoun,
        conjugated,
        groupe: candidate.groupe,
        direction: questionDirection,
        choices,
        forms: verbData.conjugaisons[candidate.tense],
      });
    }

    return questions;
  }

  /** Tire un pronom au sort en répartissant équitablement sur 6 cases de personne.
   * La 3ème pers. sg. donne aléatoirement il/elle/on ; la 3ème pers. pl. donne ils/elles. */
  private pickPronoun(): Pronom {
    const slot = this.rand(0, 5);
    if (slot === 0) return 'je';
    if (slot === 1) return 'tu';
    if (slot === 2) return (['il', 'elle', 'on'] as const)[this.rand(0, 2)];
    if (slot === 3) return 'nous';
    if (slot === 4) return 'vous';
    return this.rand(0, 1) === 0 ? 'ils' : 'elles';
  }

  private buildChoices(
    infinitif: string,
    tense: string,
    pronoun: Pronom,
    correctForm: string,
    direction: 'forward' | 'reverse',
    availableVerbs: [string, VerbData][],
    size: number,
  ): string[] {
    if (direction === 'reverse') {
      const pool = availableVerbs
        .map(([inf]) => inf)
        .filter((inf) => inf !== infinitif);
      return this.shuffle([
        infinitif,
        ...this.shuffle(pool).slice(0, size - 1),
      ]);
    }

    // Forward : formes conjuguées comme choix
    const choices = new Set<string>([correctForm]);
    const verbData = this.verbs[infinitif];

    // Priorité 1 : autres formes du même verbe au même temps (confusion la plus pédagogique)
    const sameVerbForms = Object.values(verbData.conjugaisons[tense]).filter(
      (f) => f !== correctForm,
    );
    for (const f of this.shuffle(sameVerbForms)) {
      if (choices.size >= size) break;
      choices.add(f);
    }

    // Priorité 2 : formes d'autres verbes au même pronom+temps pour compléter si besoin
    if (choices.size < size) {
      const otherForms = availableVerbs
        .filter(([inf]) => inf !== infinitif)
        .flatMap(([, vd]) => {
          const f = vd.conjugaisons[tense]?.[pronoun];
          return f && !choices.has(f) ? [f] : [];
        });
      for (const f of this.shuffle(otherForms)) {
        if (choices.size >= size) break;
        choices.add(f);
      }
    }

    return this.shuffle([...choices]);
  }

  private normalizeTenses(raw?: string[]): string[] {
    if (!raw?.length) return ['présent'];
    return raw.filter(isTense);
  }

  private normalizeGroups(raw?: string[]): string[] {
    if (!raw?.length) return [...VALID_GROUPS];
    return raw.filter((g) => (VALID_GROUPS as readonly string[]).includes(g));
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
