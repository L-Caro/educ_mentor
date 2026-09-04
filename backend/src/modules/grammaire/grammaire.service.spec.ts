import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { GrammaireService } from './grammaire.service';
import { GrammaireSession } from './entities/grammaire-session.entity';
import { GrammaireProgression } from './entities/grammaire-progression.entity';
import { SettingsService } from '../settings/settings.service';

describe('GrammaireService', () => {
  let service: GrammaireService;
  let settings: Map<string, string>;
  let savedSession: Partial<GrammaireSession> | null;
  let savedProgression: Partial<GrammaireProgression>[];

  beforeEach(async () => {
    settings = new Map();
    savedSession = null;
    savedProgression = [];

    const sessionRepo = {
      create: (session: Partial<GrammaireSession>) => session,
      save: jest.fn((session: Partial<GrammaireSession>) => {
        savedSession = session;
        return Promise.resolve(session);
      }),
      findOneBy: jest.fn(() => Promise.resolve(savedSession)),
      clear: jest.fn(),
    };

    const progressionBySkill = new Map<string, Partial<GrammaireProgression>>();
    const progressionRepo = {
      create: (prog: Partial<GrammaireProgression>) => prog,
      findOneBy: jest.fn(({ skill_key }: { skill_key: string }) =>
        Promise.resolve(progressionBySkill.get(skill_key) ?? null),
      ),
      save: jest.fn((prog: Partial<GrammaireProgression>) => {
        progressionBySkill.set(prog.skill_key!, prog);
        savedProgression.push(prog);
        return Promise.resolve(prog);
      }),
      find: jest.fn(() => Promise.resolve([])),
      clear: jest.fn(),
    };

    const settingsService = {
      get: jest.fn((key: string) => Promise.resolve(settings.get(key) ?? null)),
      set: jest.fn((key: string, value: string) => {
        settings.set(key, value);
        return Promise.resolve({ key, value });
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GrammaireService,
        {
          provide: getRepositoryToken(GrammaireSession),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(GrammaireProgression),
          useValue: progressionRepo,
        },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = moduleRef.get(GrammaireService);
  });

  describe('getActiveNotionKeys', () => {
    it('retombe sur le socle de début de CE1 sans réglage enregistré', async () => {
      const keys = await service.getActiveNotionKeys();
      expect(keys).toContain('nom_commun');
      expect(keys).toContain('verbe');
      // La fonction des mots vient APRÈS la nature, dans les fiches comme ici.
      expect(keys).not.toContain('sujet');
      expect(keys).not.toContain('groupe_nominal');
    });

    it('retombe sur le socle si le réglage est un JSON cassé', async () => {
      settings.set('grammaire_notions_actives', '{ pas du json');
      expect(await service.getActiveNotionKeys()).toContain('verbe');
    });

    it('ignore les clés inconnues dans le réglage', async () => {
      settings.set(
        'grammaire_notions_actives',
        JSON.stringify(['verbe', 'complement-du-nom']),
      );
      expect(await service.getActiveNotionKeys()).toEqual(['verbe']);
    });
  });

  describe('setActiveNotionKeys', () => {
    it('filtre les clés inconnues avant de les enregistrer', async () => {
      const saved = await service.setActiveNotionKeys([
        'verbe',
        'sujet',
        'attribut',
      ] as never);
      expect(saved).toEqual(['verbe', 'sujet']);
      expect(await service.getActiveNotionKeys()).toEqual(saved);
    });
  });

  describe('startSession', () => {
    it('sert une séance avec les notions actives par défaut', async () => {
      const result = await service.startSession({});
      expect(result.questions.length).toBeGreaterThan(0);
      expect(savedSession?.question_types).toBeTruthy();
    });

    it('ne divulgue ni la nature ni la fonction des mots dans la réponse', async () => {
      const result = await service.startSession({
        question_types: ['trouver_mots'],
      });
      for (const question of result.questions) {
        for (const mot of question.mots) {
          expect(Object.keys(mot).sort()).toEqual(['apres', 'colle', 'mot']);
        }
      }
    });

    it('dit quelle notion activer quand un exercice ne peut rien produire', async () => {
      // `groupe_nominal` est inactif par défaut : l'exercice est demandé mais impossible.
      await expect(
        service.startSession({ question_types: ['groupe_nominal'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.startSession({ question_types: ['groupe_nominal'] }),
      ).rejects.toThrow(/groupe nominal/);
    });
  });

  describe('recordAnswer', () => {
    it('crée puis incrémente la progression par notion', async () => {
      await service.recordAnswer({ skill_key: 'verbe', is_correct: true });
      await service.recordAnswer({ skill_key: 'verbe', is_correct: false });
      expect(savedProgression).toHaveLength(2);
      expect(savedProgression[1]).toMatchObject({
        skill_key: 'verbe',
        correct_count: 1,
        incorrect_count: 1,
      });
    });
  });
});
