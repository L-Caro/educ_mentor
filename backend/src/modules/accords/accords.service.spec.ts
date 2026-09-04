import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AccordsService } from './accords.service';
import { AccordsSession } from './entities/accords-session.entity';
import { AccordsProgression } from './entities/accords-progression.entity';
import { SettingsService } from '../settings/settings.service';

describe('AccordsService', () => {
  let service: AccordsService;
  let settings: Map<string, string>;
  let savedSession: Partial<AccordsSession> | null;
  let savedProgression: Partial<AccordsProgression>[];

  beforeEach(async () => {
    settings = new Map();
    savedSession = null;
    savedProgression = [];

    const sessionRepo = {
      create: (session: Partial<AccordsSession>) => session,
      save: jest.fn((session: Partial<AccordsSession>) => {
        savedSession = session;
        return Promise.resolve(session);
      }),
      findOneBy: jest.fn(() => Promise.resolve(savedSession)),
      clear: jest.fn(),
    };

    const progressionBySkill = new Map<string, Partial<AccordsProgression>>();
    const progressionRepo = {
      create: (prog: Partial<AccordsProgression>) => prog,
      findOneBy: jest.fn(({ skill_key }: { skill_key: string }) =>
        Promise.resolve(progressionBySkill.get(skill_key) ?? null),
      ),
      save: jest.fn((prog: Partial<AccordsProgression>) => {
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
        AccordsService,
        {
          provide: getRepositoryToken(AccordsSession),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(AccordsProgression),
          useValue: progressionRepo,
        },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = moduleRef.get(AccordsService);
  });

  describe('getActiveNotionKeys', () => {
    it('retombe sur le socle sans réglage enregistré', async () => {
      const keys = await service.getActiveNotionKeys();
      // Ce qui MARQUE un nom d'abord ; les deux accords proprement dits viennent après,
      // dans l'ordre des fiches.
      expect(keys).toContain('genre_nom');
      expect(keys).toContain('nombre_nom');
      expect(keys).not.toContain('accord_gn');
      expect(keys).not.toContain('accord_sujet_verbe');
    });

    it('retombe sur le socle si le réglage est un JSON cassé', async () => {
      settings.set('accords_notions_actives', '{ pas du json');
      expect(await service.getActiveNotionKeys()).toContain('genre_nom');
    });

    it('ignore les clés inconnues dans le réglage', async () => {
      settings.set(
        'accords_notions_actives',
        JSON.stringify(['genre_nom', 'accord-du-participe']),
      );
      expect(await service.getActiveNotionKeys()).toEqual(['genre_nom']);
    });
  });

  describe('setActiveNotionKeys', () => {
    it('filtre les clés inconnues avant de les enregistrer', async () => {
      const saved = await service.setActiveNotionKeys([
        'genre_nom',
        'accord_gn',
        'attribut',
      ] as never);
      expect(saved).toEqual(['genre_nom', 'accord_gn']);
      expect(await service.getActiveNotionKeys()).toEqual(saved);
    });
  });

  describe('startSession', () => {
    it('sert une séance avec les notions actives par défaut', async () => {
      const result = await service.startSession({});
      expect(result.questions.length).toBeGreaterThan(0);
      expect(savedSession?.question_types).toBeTruthy();
    });

    it("n'interroge que les notions actives", async () => {
      const result = await service.startSession({});
      const actives = await service.getActiveNotionKeys();
      for (const question of result.questions) {
        expect(actives).toContain(question.skill_key);
      }
    });

    it('nomme l’exercice à activer quand il ne peut rien produire', async () => {
      // `accord_sujet_verbe` est inactif par défaut : demandé mais impossible.
      await expect(
        service.startSession({ question_types: ['accord_sujet_verbe'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      await expect(
        service.startSession({ question_types: ['accord_sujet_verbe'] }),
      ).rejects.toThrow(/sujet-verbe/);
    });
  });

  describe('recordAnswer', () => {
    it('crée puis incrémente la progression par notion', async () => {
      await service.recordAnswer({ skill_key: 'genre_nom', is_correct: true });
      await service.recordAnswer({ skill_key: 'genre_nom', is_correct: false });
      expect(savedProgression).toHaveLength(2);
      expect(savedProgression[1]).toMatchObject({
        skill_key: 'genre_nom',
        correct_count: 1,
        incorrect_count: 1,
      });
    });
  });
});
