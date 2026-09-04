import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { GeometrieService } from './geometrie.service';
import { GeometrieSession } from './entities/geometrie-session.entity';
import { GeometrieProgression } from './entities/geometrie-progression.entity';
import { SettingsService } from '../settings/settings.service';

describe('GeometrieService', () => {
  let service: GeometrieService;
  let settings: Map<string, string>;
  let savedSession: Partial<GeometrieSession> | null;
  let savedProgression: Partial<GeometrieProgression>[];

  beforeEach(async () => {
    settings = new Map();
    savedSession = null;
    savedProgression = [];

    const sessionRepo = {
      create: (session: Partial<GeometrieSession>) => session,
      save: jest.fn((session: Partial<GeometrieSession>) => {
        savedSession = session;
        return Promise.resolve(session);
      }),
      findOneBy: jest.fn(() => Promise.resolve(savedSession)),
      clear: jest.fn(),
    };

    const progressionBySkill = new Map<string, Partial<GeometrieProgression>>();
    const progressionRepo = {
      create: (prog: Partial<GeometrieProgression>) => prog,
      findOneBy: jest.fn(({ skill_key }: { skill_key: string }) =>
        Promise.resolve(progressionBySkill.get(skill_key) ?? null),
      ),
      save: jest.fn((prog: Partial<GeometrieProgression>) => {
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
        GeometrieService,
        {
          provide: getRepositoryToken(GeometrieSession),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(GeometrieProgression),
          useValue: progressionRepo,
        },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = moduleRef.get(GeometrieService);
  });

  describe('getActiveShapeKeys', () => {
    it('retombe sur le socle CE1 sans réglage enregistré', async () => {
      const keys = await service.getActiveShapeKeys();
      expect(keys).toContain('carre');
      expect(keys).not.toContain('losange');
    });

    it('retombe sur le socle si le réglage est un JSON cassé', async () => {
      settings.set('geometrie_active_figures', '{ pas du json');
      const keys = await service.getActiveShapeKeys();
      expect(keys).toContain('carre');
    });

    it('ignore les clés inconnues dans le réglage', async () => {
      settings.set(
        'geometrie_active_figures',
        JSON.stringify(['carre', 'forme-imaginaire']),
      );
      const keys = await service.getActiveShapeKeys();
      expect(keys).toEqual(['carre']);
    });
  });

  describe('setActiveShapeKeys', () => {
    it('filtre les clés inconnues avant de les enregistrer', async () => {
      const saved = await service.setActiveShapeKeys([
        'carre',
        'losange',
        'inconnue',
      ]);
      expect(saved.sort()).toEqual(['carre', 'losange']);
      expect(await service.getActiveShapeKeys()).toEqual(saved);
    });
  });

  describe('startSession', () => {
    it('sert une séance avec les figures actives par défaut', async () => {
      const result = await service.startSession({});
      expect(result.questions.length).toBeGreaterThan(0);
      expect(savedSession?.question_types).toBeTruthy();
    });

    it('refuse de démarrer si les réglages ne permettent aucune question', async () => {
      await service.setActiveShapeKeys(['carre']); // une seule forme active
      await expect(
        service.startSession({ question_types: ['proprietes'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('recordAnswer / getProgression', () => {
    it('crée puis incrémente la progression par forme', async () => {
      await service.recordAnswer({ skill_key: 'carre', is_correct: true });
      await service.recordAnswer({ skill_key: 'carre', is_correct: false });
      expect(savedProgression).toHaveLength(2);
      expect(savedProgression[1]).toMatchObject({
        skill_key: 'carre',
        correct_count: 1,
        incorrect_count: 1,
      });
    });
  });
});
