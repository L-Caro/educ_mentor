import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompteService } from './compte.service';
import { CompteSession } from './entities/compte-session.entity';
import { CompteProgression } from './entities/compte-progression.entity';
import { SettingsService } from '../settings/settings.service';
import { rejouer } from './compte.generator';

describe('CompteService', () => {
  let service: CompteService;
  let settings: Map<string, string>;
  let progressionEnregistree: Partial<CompteProgression>[];

  beforeEach(async () => {
    settings = new Map();
    progressionEnregistree = [];

    const sessionRepo = {
      create: (session: Partial<CompteSession>) => session,
      save: jest.fn((session: Partial<CompteSession>) =>
        Promise.resolve(session),
      ),
      findOneBy: jest.fn(() => Promise.resolve(null)),
      clear: jest.fn(),
    };
    const progressionRepo = {
      create: (prog: Partial<CompteProgression>) => prog,
      findOneBy: jest.fn(() => Promise.resolve(null)),
      save: jest.fn((prog: Partial<CompteProgression>) => {
        progressionEnregistree.push(prog);
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
        CompteService,
        { provide: getRepositoryToken(CompteSession), useValue: sessionRepo },
        {
          provide: getRepositoryToken(CompteProgression),
          useValue: progressionRepo,
        },
        { provide: SettingsService, useValue: settingsService },
      ],
    }).compile();

    service = moduleRef.get(CompteService);
  });

  describe('la porte des opérations', () => {
    it('ouvre les deux premières classes à l’installation, pas les quatre', async () => {
      expect(await service.getActiveOperations()).toEqual(['+', '-']);
    });

    it('montre le catalogue COMPLET à l’administration', () => {
      // Sans les fermées, il n'y aurait rien à ouvrir.
      expect(service.getOperations().map((o) => o.key)).toEqual([
        '+',
        '-',
        '×',
        '÷',
      ]);
    });

    it('ne montre au PRÉ-JEU que les opérations ouvertes', async () => {
      await service.setActiveOperations(['+', '×']);
      const ouvertes = await service.getOperationsOuvertes();
      expect(ouvertes.map((o) => o.key)).toEqual(['+', '×']);
    });

    it('écarte une clé inconnue au lieu de l’enregistrer', async () => {
      expect(await service.setActiveOperations(['+', 'racine'])).toEqual(['+']);
    });

    it('retombe sur les défauts quand le réglage est illisible', async () => {
      // Une valeur écrite à la main en base ne doit pas rendre le module injouable.
      settings.set('compte_operations_actives', 'pas du json');
      expect(await service.getActiveOperations()).toEqual(['+', '-']);
    });

    it('refuse de jouer une opération FERMÉE demandée par le pré-jeu', async () => {
      // Le pré-jeu ne montre que les ouvertes : ce filtre est la ceinture, au cas où la
      // requête serait forgée ou le cache du navigateur en retard sur l'administration.
      await service.setActiveOperations(['+']);
      const session = await service.startSession({
        difficulty: 'easy',
        operations: ['÷'],
      });
      for (const question of session.questions) {
        expect(question.operations).toEqual(['+']);
        for (const etape of question.solution) {
          expect(etape.operation).toBe('+');
        }
      }
    });
  });

  describe('une séance', () => {
    it('ne sert que des tirages SOLUBLES, vérifiés en rejouant', async () => {
      // Le test ne recalcule pas la solution avec le code qui l'a produite : il la
      // rejoue sur les plaques distribuées. C'est la seule vérification qui prouve
      // quelque chose.
      await service.setActiveOperations(['+', '-', '×', '÷']);
      const session = await service.startSession({ difficulty: 'hard' });
      expect(session.questions.length).toBeGreaterThan(0);
      for (const question of session.questions) {
        const controle = rejouer(question.plaques, question.solution);
        expect(controle).not.toBeNull();
        expect(controle!.resultat).toBe(question.cible);
      }
    });

    it('fait varier la LONGUEUR DE LA CHAÎNE avec la difficulté', async () => {
      // Et non la taille des nombres : 100 s'atteint d'un coup d'œil avec 25 × 4, alors
      // que 37 peut demander trois opérations.
      await service.setActiveOperations(['+', '-', '×', '÷']);
      for (const [difficulty, etapes] of [
        ['easy', 2],
        ['medium', 3],
        ['hard', 4],
      ] as const) {
        const session = await service.startSession({ difficulty });
        for (const question of session.questions) {
          expect(question.solution).toHaveLength(etapes);
          expect(question.skill_key).toBe(`compte_${etapes}_etapes`);
        }
      }
    });

    it('garde les grandes plaques au vestiaire en facile', async () => {
      // L'exercice y est de combiner de petits nombres ; 75 + 25 = 100 n'en fait
      // pratiquer aucun.
      const session = await service.startSession({ difficulty: 'easy' });
      for (const question of session.questions) {
        for (const plaque of question.plaques) {
          expect(plaque).toBeLessThanOrEqual(10);
        }
      }
    });

    it('ne sert jamais deux fois le même tirage dans la même séance', async () => {
      await service.setActiveOperations(['+', '-', '×', '÷']);
      const session = await service.startSession({ difficulty: 'medium' });
      const cles = session.questions.map((q) => q.item_key);
      expect(new Set(cles).size).toBe(cles.length);
    });

    it('plafonne la séance à dix comptes, même en mode illimité', async () => {
      // Chercher un compte prend du temps : vingt d'affilée, comme les autres modules en
      // illimité, n'est pas une séance mais une punition.
      settings.set('questions_per_session', '0');
      const session = await service.startSession({ difficulty: 'easy' });
      expect(session.is_unlimited).toBe(true);
      expect(session.questions.length).toBeLessThanOrEqual(10);
    });

    it('sait tirer un compte pour CHAQUE réglage possible', async () => {
      // Le plancher de cible en facile était à 10, et trois configurations n'engendraient
      // alors RIEN : sans l'addition, deux petites plaques soustraites ne dépassent
      // jamais 8. Le pré-jeu répondait « Aucun compte à chercher » : un cul-de-sac
      // atteignable en deux touches, et qui accusait l'enfant d'un mauvais choix.
      //
      // Ce test parcourt les quinze combinaisons d'opérations et les trois difficultés :
      // aucune ne doit rendre une séance vide.
      const toutes = ['+', '-', '×', '÷'] as const;
      for (let masque = 1; masque < 16; masque++) {
        const ops = toutes.filter((_, i) => masque & (1 << i));
        await service.setActiveOperations([...ops]);
        for (const difficulty of ['easy', 'medium', 'hard'] as const) {
          const session = await service.startSession({ difficulty });
          expect(session.questions.length).toBeGreaterThan(0);
        }
      }
    });

    it('respecte le minuteur GÉNÉRAL, réglé une fois pour tous les modules', async () => {
      settings.set('question_timer_seconds', '45');
      const session = await service.startSession({ difficulty: 'easy' });
      expect(session.timer_seconds).toBe(45);
    });
  });

  describe('la progression', () => {
    it('compte au grain du nombre d’étapes, et pas de la cible', async () => {
      // « compte_3_etapes » se maîtrise ; « cible 348 » ne reviendra jamais.
      await service.recordAnswer({
        skill_key: 'compte_3_etapes',
        is_correct: true,
      });
      expect(progressionEnregistree).toHaveLength(1);
      expect(progressionEnregistree[0].skill_key).toBe('compte_3_etapes');
      expect(progressionEnregistree[0].correct_count).toBe(1);
    });
  });
});
