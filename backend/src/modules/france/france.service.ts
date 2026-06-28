import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { FranceProgression } from './entities/france-progression.entity';
import { FranceSession } from './entities/france-session.entity';
import { SettingsService } from '../settings/settings.service';
import { normalizeDifficulty, qcmChoiceCount, type Difficulty } from '../../common/difficulty';
import { masteryScore, isMastered } from '../../common/mastery';
import {
  ALL_FRANCE_QUESTION_TYPES,
  type FranceQuestionType,
  type StartFranceSessionDto,
  type RecordFranceAnswerDto,
} from './dto/france.dto';

// ─── Types JSON ───────────────────────────────────────────────────────────────

interface Coords { lat: number; lng: number }

interface Region {
  nom: string;
  chef_lieu: string;
  coordonnees_chef_lieu: Coords;
  departements: string[];
  anciennes_regions: string[];
  population: number;
  superficie_km2: number;
}

interface Departement {
  nom: string;
  numero: string;
  region: string;
  gentile: { masculin: string; feminin: string };
  prefecture: { nom: string; coordonnees: Coords };
  sous_prefectures: { nom: string; coordonnees: Coords }[];
  plus_grandes_villes: { rang: number; nom: string; coordonnees: Coords }[];
  departements_limitrophes: string[];
  superficie_km2: number;
  population: number;
}

interface Fleuve {
  nom: string;
  type: string;
  longueur_km: number;
  source: { lieu: string; coordonnees: Coords };
  embouchure: { lieu: string; coordonnees: Coords };
  departements_traverses: string[];
  affluents_principaux: string[];
}

interface Massif {
  nom: string;
  point_culminant: { nom: string; altitude_m: number; lieu: string; coordonnees: Coords };
  departements: string[];
  frontieres: string[];
}

interface FacadeMaritimme {
  nom: string;
  longueur_cotes_km: number;
  departements_cotiers: string[];
  frontieres_maritimes: string[];
}

interface FranceGeoData {
  regions: Record<string, Region>;
  departements: Record<string, Departement>;
  fleuves_et_rivieres: Record<string, Fleuve>;
  massifs: Record<string, Massif>;
  facades_maritimes: Record<string, FacadeMaritimme>;
}

// ─── Question ─────────────────────────────────────────────────────────────────

export interface FranceQuestion {
  type: FranceQuestionType;
  item_key: string;
  prompt: string;
  display: string;
  choices: string[];
  answer: string | null;
  answers: string[] | null;
  is_map?: boolean;
}

export interface FranceSessionResult {
  session_id: string;
  questions: FranceQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class FranceService {
  private readonly data: FranceGeoData;
  private readonly allDepts: (Departement & { code: string })[];
  private readonly allRegions: (Region & { code: string })[];
  private readonly allFleuves: (Fleuve & { key: string })[];
  private readonly allMassifs: (Massif & { key: string })[];
  private readonly allFacades: (FacadeMaritimme & { key: string })[];
  private readonly deptByCode: Map<string, Departement & { code: string }>;
  private readonly regionByCode: Map<string, Region & { code: string }>;
  private readonly coastalCodes: Set<string>;

  constructor(
    @InjectRepository(FranceProgression)
    private readonly progressionRepo: Repository<FranceProgression>,
    @InjectRepository(FranceSession)
    private readonly sessionRepo: Repository<FranceSession>,
    private readonly settingsService: SettingsService,
  ) {
    const jsonPath = path.join(__dirname, 'data', 'france_geo.json');
    this.data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as FranceGeoData;

    this.allRegions = Object.entries(this.data.regions).map(([code, r]) => ({ ...r, code }));
    this.allDepts   = Object.entries(this.data.departements).map(([code, d]) => ({ ...d, code }));
    this.allFleuves = Object.entries(this.data.fleuves_et_rivieres).map(([key, f]) => ({ ...f, key }));
    this.allMassifs = Object.entries(this.data.massifs).map(([key, m]) => ({ ...m, key }));
    this.allFacades = Object.entries(this.data.facades_maritimes).map(([key, f]) => ({ ...f, key }));

    this.deptByCode   = new Map(this.allDepts.map((d) => [d.code, d]));
    this.regionByCode = new Map(this.allRegions.map((r) => [r.code, r]));

    this.coastalCodes = new Set(this.allFacades.flatMap((f) => f.departements_cotiers));
  }

  // ─── Session ────────────────────────────────────────────────────────────────

  async startSession(dto: StartFranceSessionDto): Promise<FranceSessionResult> {
    const difficulty = normalizeDifficulty(dto.difficulty);
    const choicesCount = qcmChoiceCount(difficulty);

    const timerSeconds = parseInt((await this.settingsService.get('question_timer_seconds')) ?? '0', 10);
    const questionsPerSession = parseInt((await this.settingsService.get('questions_per_session')) ?? '10', 10);

    const regionsFilterRaw = await this.settingsService.get('france_regions_filter');
    const adminRegions = regionsFilterRaw?.split(',').map((r) => r.trim()).filter(Boolean) ?? [];

    const activeRegionCodes = new Set(
      dto.regions?.length ? dto.regions
      : adminRegions.length ? adminRegions
      : this.allRegions.map((r) => r.code),
    );

    let activeDepts = this.allDepts.filter((d) => activeRegionCodes.has(d.region));
    if (activeDepts.length === 0) activeDepts = [...this.allDepts];

    const typesFilterRaw = await this.settingsService.get('france_question_types_filter');
    const adminTypes = typesFilterRaw?.split(',').map((t) => t.trim()).filter(Boolean) as FranceQuestionType[];
    const rawTypes = dto.question_types?.length ? dto.question_types
                   : adminTypes?.length         ? adminTypes
                   : undefined;
    const activeTypes = this.normalizeTypes(rawTypes, activeDepts);

    const isUnlimited = questionsPerSession === 0;
    const count = isUnlimited ? 50 : questionsPerSession;

    const questions = this.generateQuestions(activeDepts, activeTypes, difficulty, choicesCount, count);

    const session = this.sessionRepo.create({
      id: uuidv4(),
      difficulty,
      question_types: activeTypes.join(','),
      regions: [...activeRegionCodes].join(',') ?? null,
      timer_seconds: timerSeconds,
    });
    await this.sessionRepo.save(session);

    return { session_id: session.id, questions, timer_seconds: timerSeconds, is_unlimited: isUnlimited };
  }

  async recordAnswer(sessionId: string, dto: RecordFranceAnswerDto): Promise<void> {
    const threshold = parseInt((await this.settingsService.get('mastery_threshold')) ?? '10', 10);

    let prog = await this.progressionRepo.findOneBy({ item_key: dto.item_key });
    if (!prog) {
      prog = this.progressionRepo.create({
        id: uuidv4(),
        item_key: dto.item_key,
        correct_count: 0,
        incorrect_count: 0,
        is_mastered: false,
        last_seen: null,
      });
    }

    dto.is_correct ? prog.correct_count++ : prog.incorrect_count++;
    prog.last_seen = new Date();
    prog.is_mastered = isMastered(masteryScore(prog.correct_count, prog.incorrect_count), threshold);

    await this.progressionRepo.save(prog);
  }

  async completeSession(sessionId: string, correctAnswers: number, totalQuestions: number): Promise<void> {
    const session = await this.sessionRepo.findOneBy({ id: sessionId });
    if (!session) return;
    session.completed_at = new Date();
    session.correct_answers = correctAnswers;
    session.total_questions = totalQuestions;
    await this.sessionRepo.save(session);
  }

  // ─── Admin ──────────────────────────────────────────────────────────────────

  getRegions() {
    return this.allRegions.map(({ code, nom, departements }) => ({ code, nom, dept_count: departements.length }));
  }

  getDepartements() {
    return this.allDepts.map(({ code, nom, numero, region }) => ({ code, nom, numero, region }));
  }

  async getProgression(): Promise<FranceProgression[]> {
    return this.progressionRepo.find({ order: { item_key: 'ASC' } });
  }

  async getRecentSessions(limit = 20): Promise<FranceSession[]> {
    return this.sessionRepo.find({ order: { started_at: 'DESC' }, take: limit });
  }

  async resetProgression(): Promise<void> {
    await this.progressionRepo.clear();
    await this.sessionRepo.clear();
  }

  // ─── Génération ─────────────────────────────────────────────────────────────

  private generateQuestions(
    activeDepts: (Departement & { code: string })[],
    activeTypes: FranceQuestionType[],
    difficulty: Difficulty,
    choicesCount: number,
    count: number,
  ): FranceQuestion[] {
    const questions: FranceQuestion[] = [];
    const usedKeys = new Set<string>();
    let attempts = 0;

    while (questions.length < count && attempts < count * 20) {
      attempts++;
      const type = activeTypes[this.rand(0, activeTypes.length - 1)];
      const q = this.generateOne(type, activeDepts, difficulty, choicesCount);
      if (!q || usedKeys.has(q.item_key)) continue;
      usedKeys.add(q.item_key);
      questions.push(q);
    }

    return questions;
  }

  private generateOne(
    type: FranceQuestionType,
    activeDepts: (Departement & { code: string })[],
    difficulty: Difficulty,
    choicesCount: number,
  ): FranceQuestion | null {
    switch (type) {
      case 'dept_to_number':       return this.genDeptToNumber(activeDepts, choicesCount);
      case 'number_to_dept':       return this.genNumberToDept(activeDepts, choicesCount);
      case 'dept_to_prefecture':   return this.genDeptToPrefecture(activeDepts, choicesCount);
      case 'prefecture_to_dept':   return this.genPrefectureToDept(activeDepts, choicesCount);
      case 'dept_to_region':       return this.genDeptToRegion(activeDepts, choicesCount);
      case 'region_chef_lieu':     return this.genRegionChefLieu(activeDepts, choicesCount);
      case 'dept_borders':         return this.genDeptBorders(activeDepts, difficulty);
      case 'dept_sub_prefectures': return this.genDeptSubPrefectures(activeDepts, difficulty);
      case 'region_depts':         return this.genRegionDepts(activeDepts, difficulty);
      case 'region_old_names':     return this.genRegionOldNames(activeDepts, difficulty);
      case 'river_depts':          return this.genRiverDepts(activeDepts, difficulty);
      case 'maritime_facade':      return this.genMaritimeFacade(activeDepts, choicesCount);
      case 'massif_summit':        return this.genMassifSummit(choicesCount);
      case 'summit_altitude':      return this.genSummitAltitude(choicesCount);
      case 'dept_gentile':         return this.genDeptGentile(activeDepts, choicesCount);
      case 'identify_dept':        return this.genIdentifyDept(activeDepts);
      case 'identify_region':      return this.genIdentifyRegion(activeDepts, difficulty);
      default: return null;
    }
  }

  // ── Single-select ────────────────────────────────────────────────────────────

  private freeQcm(correct: string, pool: string[], choicesCount: number): string[] {
    if (choicesCount === 0) return [];
    const distractors = this.shuffle(pool.filter((x) => x !== correct));
    return this.shuffle([correct, ...distractors.slice(0, choicesCount - 1)]);
  }

  private forceQcm(correct: string, pool: string[], choicesCount: number): string[] {
    const n = choicesCount === 0 ? 6 : choicesCount;
    const distractors = this.shuffle(pool.filter((x) => x !== correct));
    return this.shuffle([correct, ...distractors.slice(0, n - 1)]);
  }

  private genDeptToNumber(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d) return null;
    const pool = this.allDepts.filter((x) => x.code !== d.code).map((x) => x.numero);
    return {
      type: 'dept_to_number',
      item_key: `dept_num_${d.code}`,
      prompt: 'Quel est son numéro ?',
      display: d.nom,
      choices: this.freeQcm(d.numero, pool, choicesCount),
      answer: d.numero,
      answers: null,
    };
  }

  private genNumberToDept(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d) return null;
    const pool = this.allDepts.filter((x) => x.code !== d.code).map((x) => x.nom);
    return {
      type: 'number_to_dept',
      item_key: `dept_name_${d.code}`,
      prompt: 'Quel est le nom de ce département ?',
      display: d.numero,
      choices: this.freeQcm(d.nom, pool, choicesCount),
      answer: d.nom,
      answers: null,
    };
  }

  private genDeptToPrefecture(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d) return null;
    const pool = this.allDepts.filter((x) => x.code !== d.code).map((x) => x.prefecture.nom);
    return {
      type: 'dept_to_prefecture',
      item_key: `dept_pref_${d.code}`,
      prompt: 'Quelle est sa préfecture ?',
      display: d.nom,
      choices: this.freeQcm(d.prefecture.nom, pool, choicesCount),
      answer: d.prefecture.nom,
      answers: null,
    };
  }

  private genPrefectureToDept(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d) return null;
    const pool = this.allDepts.filter((x) => x.code !== d.code).map((x) => x.nom);
    return {
      type: 'prefecture_to_dept',
      item_key: `pref_dept_${d.code}`,
      prompt: 'Dans quel département se trouve cette préfecture ?',
      display: d.prefecture.nom,
      choices: this.freeQcm(d.nom, pool, choicesCount),
      answer: d.nom,
      answers: null,
    };
  }

  private genDeptToRegion(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d) return null;
    const region = this.regionByCode.get(d.region);
    if (!region) return null;
    const pool = this.allRegions.filter((r) => r.code !== d.region).map((r) => r.nom);
    return {
      type: 'dept_to_region',
      item_key: `dept_region_${d.code}`,
      prompt: 'Dans quelle région se trouve ce département ?',
      display: d.nom,
      choices: this.forceQcm(region.nom, pool, choicesCount),
      answer: region.nom,
      answers: null,
    };
  }

  private genRegionChefLieu(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const activeRegionCodes = new Set(depts.map((d) => d.region));
    const activeRegions = this.allRegions.filter((r) => activeRegionCodes.has(r.code));
    const r = this.pick(activeRegions);
    if (!r) return null;
    const pool = this.allRegions.filter((x) => x.code !== r.code).map((x) => x.chef_lieu);
    return {
      type: 'region_chef_lieu',
      item_key: `region_chef_${r.code}`,
      prompt: 'Quel est son chef-lieu ?',
      display: r.nom,
      choices: this.freeQcm(r.chef_lieu, pool, choicesCount),
      answer: r.chef_lieu,
      answers: null,
    };
  }

  private genMaritimeFacade(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const coastal = depts.filter((d) => this.coastalCodes.has(d.code));
    const d = this.pick(coastal);
    if (!d) return null;
    const facade = this.allFacades.find((f) => f.departements_cotiers.includes(d.code));
    if (!facade) return null;
    const allFacadeNames = this.allFacades.map((f) => f.nom);
    return {
      type: 'maritime_facade',
      item_key: `dept_facade_${d.code}`,
      prompt: 'Sur quelle façade maritime ce département donne-t-il ?',
      display: d.nom,
      choices: this.forceQcm(facade.nom, allFacadeNames, choicesCount),
      answer: facade.nom,
      answers: null,
    };
  }

  private genMassifSummit(choicesCount: number): FranceQuestion | null {
    const m = this.pick(this.allMassifs);
    if (!m) return null;
    const pool = this.allMassifs.filter((x) => x.key !== m.key).map((x) => x.point_culminant.nom);
    return {
      type: 'massif_summit',
      item_key: `massif_summit_${m.key}`,
      prompt: 'Quel est son point culminant ?',
      display: m.nom,
      choices: this.freeQcm(m.point_culminant.nom, pool, choicesCount),
      answer: m.point_culminant.nom,
      answers: null,
    };
  }

  private genSummitAltitude(choicesCount: number): FranceQuestion | null {
    const m = this.pick(this.allMassifs);
    if (!m) return null;
    const correct = `${m.point_culminant.altitude_m} m`;
    const pool = this.allMassifs
      .filter((x) => x.key !== m.key)
      .map((x) => `${x.point_culminant.altitude_m} m`);
    return {
      type: 'summit_altitude',
      item_key: `summit_alt_${m.key}`,
      prompt: 'À quelle altitude culmine ce sommet ?',
      display: m.point_culminant.nom,
      choices: this.forceQcm(correct, pool, choicesCount),
      answer: correct,
      answers: null,
    };
  }

  private genDeptGentile(depts: (Departement & { code: string })[], choicesCount: number): FranceQuestion | null {
    const d = this.pick(depts);
    if (!d || !d.gentile.masculin) return null;
    const pool = this.allDepts.filter((x) => x.code !== d.code && x.gentile.masculin).map((x) => x.gentile.masculin);
    return {
      type: 'dept_gentile',
      item_key: `dept_gentile_${d.code}`,
      prompt: 'Comment appelle-t-on un habitant de ce département ?',
      display: d.nom,
      choices: this.freeQcm(d.gentile.masculin, pool, choicesCount),
      answer: d.gentile.masculin,
      answers: null,
    };
  }

  // ── Multi-select ─────────────────────────────────────────────────────────────

  private distractorCount(difficulty: Difficulty): number {
    if (difficulty === 'easy') return 2;
    if (difficulty === 'hard') return 6;
    return 4;
  }

  private correctCountCap(difficulty: Difficulty): number {
    if (difficulty === 'easy') return 3;
    if (difficulty === 'hard') return 6;
    return 4;
  }

  private genDeptBorders(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const codeSet = new Set(depts.map((d) => d.code));
    const withBorders = depts.filter((d) => d.departements_limitrophes.some((c) => codeSet.has(c)));
    const d = this.pick(withBorders);
    if (!d) return null;

    const borderCodes = d.departements_limitrophes.filter((c) => codeSet.has(c));
    const correctNames = borderCodes.map((c) => this.deptByCode.get(c)!.nom);
    // Distracteurs depuis tous les depts, en excluant TOUS les voisins réels (pas seulement les actifs)
    const allBorderCodes = new Set(d.departements_limitrophes);
    const distractors = this.shuffle(
      this.allDepts.filter((x) => !allBorderCodes.has(x.code) && x.code !== d.code).map((x) => x.nom),
    ).slice(0, this.distractorCount(difficulty));

    return {
      type: 'dept_borders',
      item_key: `dept_borders_${d.code}`,
      prompt: 'Quels départements bordent ce département ?',
      display: d.nom,
      choices: this.shuffle([...correctNames, ...distractors]),
      answer: null,
      answers: correctNames,
    };
  }

  private genDeptSubPrefectures(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const withSubpref = depts.filter((d) => d.sous_prefectures.length > 0);
    const d = this.pick(withSubpref);
    if (!d) return null;

    const correctNames = d.sous_prefectures.map((sp) => sp.nom);
    const allSubprefNames = this.allDepts
      .filter((x) => x.code !== d.code)
      .flatMap((x) => x.sous_prefectures.map((sp) => sp.nom));
    const distractors = this.shuffle(allSubprefNames.filter((n) => !correctNames.includes(n)))
      .slice(0, this.distractorCount(difficulty));

    return {
      type: 'dept_sub_prefectures',
      item_key: `dept_subpref_${d.code}`,
      prompt: 'Quelles sont ses sous-préfectures ?',
      display: d.nom,
      choices: this.shuffle([...correctNames, ...distractors]),
      answer: null,
      answers: correctNames,
    };
  }

  private genRegionDepts(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const activeRegionCodes = new Set(depts.map((d) => d.region));
    const validRegions = this.allRegions.filter(
      (r) => activeRegionCodes.has(r.code) && depts.filter((d) => d.region === r.code).length >= 2,
    );
    const r = this.pick(validRegions);
    if (!r) return null;

    const allCorrect = depts.filter((d) => d.region === r.code).map((d) => d.nom);
    const correct = this.shuffle(allCorrect).slice(0, this.correctCountCap(difficulty));
    const distractors = this.shuffle(this.allDepts.filter((d) => d.region !== r.code).map((d) => d.nom))
      .slice(0, this.distractorCount(difficulty));

    return {
      type: 'region_depts',
      item_key: `region_depts_${r.code}`,
      prompt: 'Quels départements font partie de cette région ?',
      display: r.nom,
      choices: this.shuffle([...correct, ...distractors]),
      answer: null,
      answers: correct,
    };
  }

  private genRegionOldNames(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const activeRegionCodes = new Set(depts.map((d) => d.region));
    const validRegions = this.allRegions.filter(
      (r) => activeRegionCodes.has(r.code) && r.anciennes_regions.length > 0,
    );
    const r = this.pick(validRegions);
    if (!r) return null;

    const correct = r.anciennes_regions;
    const allOtherOldNames = this.allRegions
      .filter((x) => x.code !== r.code)
      .flatMap((x) => x.anciennes_regions)
      .filter((n) => !correct.includes(n));
    const distractors = this.shuffle(allOtherOldNames).slice(0, this.distractorCount(difficulty));

    return {
      type: 'region_old_names',
      item_key: `region_oldnames_${r.code}`,
      prompt: 'Quelles anciennes régions la composent ?',
      display: r.nom,
      choices: this.shuffle([...correct, ...distractors]),
      answer: null,
      answers: correct,
    };
  }

  private genRiverDepts(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const codeSet = new Set(depts.map((d) => d.code));
    const validFleuves = this.allFleuves.filter(
      (f) => f.departements_traverses.filter((c) => codeSet.has(c)).length >= 2,
    );
    const f = this.pick(validFleuves);
    if (!f) return null;

    const activeCodes = f.departements_traverses.filter((c) => codeSet.has(c));
    const allCorrectNames = activeCodes.map((c) => this.deptByCode.get(c)!.nom);
    const correct = this.shuffle(allCorrectNames).slice(0, this.correctCountCap(difficulty));
    // Exclure tous les depts traversés (pas seulement les actifs) pour éviter les faux distracteurs
    const allTraversedCodes = new Set(f.departements_traverses);
    const distractors = this.shuffle(
      this.allDepts.filter((d) => !allTraversedCodes.has(d.code)).map((d) => d.nom),
    ).slice(0, this.distractorCount(difficulty));

    return {
      type: 'river_depts',
      item_key: `river_depts_${f.key}`,
      prompt: `Quels départements ce ${f.type} traverse-t-il ?`,
      display: f.nom,
      choices: this.shuffle([...correct, ...distractors]),
      answer: null,
      answers: correct,
    };
  }

  // ── Carte interactive ────────────────────────────────────────────────────────

  private isMetroDept(code: string): boolean {
    return !['971', '972', '973', '974', '976'].includes(code);
  }

  private genIdentifyDept(depts: (Departement & { code: string })[]): FranceQuestion | null {
    const metro = depts.filter((d) => this.isMetroDept(d.code));
    const d = this.pick(metro.length > 0 ? metro : depts);
    if (!d) return null;
    return {
      type: 'identify_dept',
      item_key: `identify_dept_${d.code}`,
      prompt: 'Cliquez sur ce département sur la carte',
      display: d.nom,
      choices: [],
      answer: d.code,
      answers: null,
      is_map: true,
    };
  }

  private genIdentifyRegion(depts: (Departement & { code: string })[], difficulty: Difficulty): FranceQuestion | null {
    const activeRegionCodes = new Set(depts.map((d) => d.region));
    const eligible = this.allRegions.filter((r) =>
      activeRegionCodes.has(r.code) &&
      r.departements.some((c) => this.isMetroDept(c)),
    );
    const region = this.pick(eligible);
    if (!region) return null;

    if (difficulty === 'hard') {
      // Difficile : sélectionner TOUS les départements de la région
      const answers = region.departements.filter((c) => this.isMetroDept(c));
      return {
        type: 'identify_region',
        item_key: `identify_region_hard_${region.code}`,
        prompt: 'Sélectionnez tous les départements de cette région',
        display: region.nom,
        choices: [],
        answer: null,
        answers,
        is_map: true,
      };
    }

    // Facile / moyen : clic unique sur la région
    return {
      type: 'identify_region',
      item_key: `identify_region_${region.code}`,
      prompt: 'Cliquez sur cette région sur la carte',
      display: region.nom,
      choices: [],
      answer: region.code,
      answers: null,
      is_map: true,
    };
  }

  // ─── Normalisation des types ─────────────────────────────────────────────────

  private normalizeTypes(raw: FranceQuestionType[] | undefined, depts: (Departement & { code: string })[]): FranceQuestionType[] {
    const valid = (raw?.length ? raw : [...ALL_FRANCE_QUESTION_TYPES]) as FranceQuestionType[];
    const codeSet = new Set(depts.map((d) => d.code));
    const activeRegionCodes = new Set(depts.map((d) => d.region));

    return valid.filter((t) => {
      if (t === 'dept_borders') return depts.some((d) => d.departements_limitrophes.some((c) => codeSet.has(c)));
      if (t === 'dept_sub_prefectures') return depts.some((d) => d.sous_prefectures.length > 0);
      if (t === 'region_depts') return this.allRegions.some(
        (r) => activeRegionCodes.has(r.code) && depts.filter((d) => d.region === r.code).length >= 2,
      );
      if (t === 'region_old_names') return this.allRegions.some(
        (r) => activeRegionCodes.has(r.code) && r.anciennes_regions.length > 0,
      );
      if (t === 'river_depts') return this.allFleuves.some(
        (f) => f.departements_traverses.filter((c) => codeSet.has(c)).length >= 2,
      );
      if (t === 'maritime_facade') return depts.some((d) => this.coastalCodes.has(d.code));
      if (t === 'region_chef_lieu') return activeRegionCodes.size > 0;
      if (t === 'identify_dept') return depts.some((d) => this.isMetroDept(d.code));
      if (t === 'identify_region') return this.allRegions.some(
        (r) => activeRegionCodes.has(r.code) && r.departements.some((c) => this.isMetroDept(c)),
      );
      return true;
    });
  }

  // ─── Utilitaires ────────────────────────────────────────────────────────────

  private pick<T>(arr: T[]): T | null {
    if (arr.length === 0) return null;
    return arr[this.rand(0, arr.length - 1)];
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
