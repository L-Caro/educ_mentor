import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlphabetMotExclu } from './entities/alphabet-mot-exclu.entity';
import { SettingsService } from '../settings/settings.service';
import {
  brancher,
  genererQuestion,
  tirerMots,
  type Branches,
  type QuestionAlphabet,
  type TypeAlphabet,
} from './alphabet.logic';
import {
  TYPES_ALPHABET,
  type StartAlphabetSessionDto,
} from './dto/alphabet.dto';

/** Le corpus vit a cote du code, en JSON, produit par `scripts/generate-mots-alphabet.mjs`.
 * Charge UNE FOIS : vingt-neuf mille chaines relues a chaque question couteraient cher
 * pour un resultat identique. */
const CORPUS: string[] = JSON.parse(
  readFileSync(join(__dirname, 'data/mots.json'), 'utf8'),
) as string[];

export interface AlphabetSessionResult {
  session_id: string;
  questions: QuestionAlphabet[];
  timer_seconds: number;
  is_unlimited: boolean;
}

@Injectable()
export class AlphabetService {
  private readonly logger = new Logger(AlphabetService.name);
  /** Les exclusions, tenues en memoire et rafraichies a chaque changement : les relire a
   * chaque tirage ferait une requete par question pour une liste qui bouge trois fois
   * par an. */
  private exclus = new Set<string>();
  /** Les branches par profondeur, calculees une fois par profondeur et par etat des
   * exclusions. Rebrancher vingt-neuf mille mots prend quelques dizaines de
   * millisecondes : a chaque question, cela se verrait. Un tirage en consulte plusieurs,
   * puisque le reglage est un plafond et non une consigne. */
  private branches = new Map<number, Branches>();

  constructor(
    @InjectRepository(AlphabetMotExclu)
    private readonly repo: Repository<AlphabetMotExclu>,
    private readonly settingsService: SettingsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rechargerExclusions();
    this.logger.log(
      `${String(CORPUS.length)} mots, ${String(this.exclus.size)} exclus`,
    );
  }

  private async rechargerExclusions(): Promise<void> {
    const lignes = await this.repo.find();
    this.exclus = new Set(lignes.map((l) => l.mot));
    this.branches.clear();
  }

  /** Le corpus moins les exclusions. */
  private motsDisponibles(): string[] {
    return this.exclus.size === 0
      ? CORPUS
      : CORPUS.filter((mot) => !this.exclus.has(mot));
  }

  /** Passee par reference a `tirerMots`, qui appelle a la profondeur dont il a besoin. */
  private branchesPour = (profondeur: number): Branches => {
    const deja = this.branches.get(profondeur);
    if (deja) return deja;
    const calcule = brancher(this.motsDisponibles(), profondeur);
    this.branches.set(profondeur, calcule);
    return calcule;
  };

  // ─── Jeu ──────────────────────────────────────────────────────────────────

  /** Engendrer les questions, et RIEN d'autre : aucune ecriture en base. Separe de
   * `startSession` pour la feuille imprimee et le peage, qui empruntent le savoir-faire
   * du module sans emprunter ses effets. */
  async construireQuestions(dto: StartAlphabetSessionDto): Promise<{
    resultat: Omit<AlphabetSessionResult, 'session_id'>;
  }> {
    const communes = Math.min(5, Math.max(0, dto.communes ?? 1));
    const combien = Math.min(20, Math.max(4, dto.combien ?? 4));

    const demandes = (dto.types ?? []).filter((t): t is TypeAlphabet =>
      (TYPES_ALPHABET as readonly string[]).includes(t),
    );
    const types: TypeAlphabet[] = demandes.length
      ? demandes
      : [...TYPES_ALPHABET];

    const timerSeconds = parseInt(
      (await this.settingsService.get('question_timer_seconds')) ?? '0',
      10,
    );
    const perSession = parseInt(
      (await this.settingsService.get('questions_per_session')) ?? '10',
      10,
    );
    const isUnlimited = perSession === 0;
    const count = isUnlimited ? 20 : perSession;

    const questions: QuestionAlphabet[] = [];
    const vus = new Set<string>();

    for (
      let essai = 0;
      essai < count * 20 && questions.length < count;
      essai++
    ) {
      const type = types[this.rand(0, types.length - 1)];
      const tires = tirerMots(this.branchesPour, communes, combien, this.rand);
      if (!tires) break;
      const question = genererQuestion(type, tires, communes, this.rand);
      if (!question || vus.has(question.item_key)) continue;
      vus.add(question.item_key);
      questions.push(question);
    }

    return {
      resultat: {
        questions,
        timer_seconds: timerSeconds,
        is_unlimited: isUnlimited,
      },
    };
  }

  async startSession(
    dto: StartAlphabetSessionDto,
  ): Promise<AlphabetSessionResult> {
    const { resultat } = await this.construireQuestions(dto);
    // Pas de table de seance : il n'y a rien a mesurer qu'un score, et le module n'a pas
    // de notion a suivre. La profondeur de comparaison est un reglage, pas un acquis.
    return { session_id: randomUUID(), ...resultat };
  }

  // ─── Administration : le referentiel ──────────────────────────────────────

  /**
   * Cherche dans le corpus. On ne rend JAMAIS la liste entiere : vingt-neuf mille mots
   * dans un ecran de reglages, c'est trois cents kilo-octets a chaque ouverture pour
   * chercher un mot qu'on a deja en tete.
   */
  chercher(terme: string, limite = 40): { mot: string; exclu: boolean }[] {
    const cherche = terme.trim().toLowerCase();
    if (cherche.length < 2) return [];

    const trouves: { mot: string; exclu: boolean }[] = [];
    // Le corpus est trie : les mots qui COMMENCENT par le terme arrivent d'abord, ce qui
    // est ce qu'on cherche neuf fois sur dix.
    for (const mot of CORPUS) {
      if (!mot.startsWith(cherche)) continue;
      trouves.push({ mot, exclu: this.exclus.has(mot) });
      if (trouves.length >= limite) return trouves;
    }
    for (const mot of CORPUS) {
      if (mot.startsWith(cherche) || !mot.includes(cherche)) continue;
      trouves.push({ mot, exclu: this.exclus.has(mot) });
      if (trouves.length >= limite) break;
    }
    return trouves;
  }

  async exclure(mot: string): Promise<{ exclus: number }> {
    const propre = mot.trim().toLowerCase();
    if (propre && !this.exclus.has(propre)) {
      await this.repo.save(
        this.repo.create({
          id: randomUUID(),
          mot: propre,
          exclu_le: new Date(),
        }),
      );
      await this.rechargerExclusions();
    }
    return { exclus: this.exclus.size };
  }

  async reintegrer(mot: string): Promise<{ exclus: number }> {
    await this.repo.delete({ mot: mot.trim().toLowerCase() });
    await this.rechargerExclusions();
    return { exclus: this.exclus.size };
  }

  async listerExclus(): Promise<{ mot: string; exclu_le: Date }[]> {
    const lignes = await this.repo.find({ order: { exclu_le: 'DESC' } });
    return lignes.map((l) => ({ mot: l.mot, exclu_le: l.exclu_le }));
  }

  etat(): { total: number; exclus: number; disponibles: number } {
    return {
      total: CORPUS.length,
      exclus: this.exclus.size,
      disponibles: CORPUS.length - this.exclus.size,
    };
  }

  private rand = (min: number, max: number): number =>
    min + Math.floor(Math.random() * (max - min + 1));
}
