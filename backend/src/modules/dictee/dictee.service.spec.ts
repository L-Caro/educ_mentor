import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DicteeService } from './dictee.service';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';
import { DicteeWordStat } from './entities/dictee-word-stat.entity';

type Item = Partial<DicteeItem>;

function makeItems(): Item[] {
  return [
    {
      id: 'a',
      niveau: 'normal',
      contenu: 'Le chat dort.',
      notions: ['accents : é è ê'],
      is_active: true,
    },
    {
      id: 'b',
      niveau: 'normal',
      contenu: 'La souris court vite.',
      notions: ['accord sujet-verbe'],
      is_active: true,
    },
    {
      id: 'c',
      niveau: 'normal',
      contenu: 'Il a mangé la tarte.',
      notions: ['homophones : a / à', 'accents : é è ê'],
      is_active: true,
    },
  ];
}

describe('DicteeService', () => {
  let service: DicteeService;
  let items: Item[];
  let savedSession: Partial<DicteeSession> | null;
  let savedStats: Partial<DicteeWordStat>[];
  let existingStat: Partial<DicteeWordStat> | null;

  beforeEach(async () => {
    items = makeItems();
    savedSession = null;
    savedStats = [];
    existingStat = null;

    const itemRepo = {
      find: jest.fn(({ where }: { where: { niveau?: string } }) =>
        Promise.resolve(
          items.filter((item) => !where.niveau || item.niveau === where.niveau),
        ),
      ),
      findBy: jest.fn(({ id }: { id: { value: string[] } }) => {
        const ids: string[] = id?.value ?? [];
        return Promise.resolve(items.filter((item) => ids.includes(item.id!)));
      }),
      findOneBy: jest.fn(() => Promise.resolve(null)),
    };

    const sessionRepo = {
      create: (session: Partial<DicteeSession>) => session,
      save: jest.fn((session: Partial<DicteeSession>) => {
        savedSession = session;
        return Promise.resolve(session);
      }),
      findOneBy: jest.fn(() => Promise.resolve(savedSession)),
    };

    const statRepo = {
      create: (stat: Partial<DicteeWordStat>) => stat,
      findOneBy: jest.fn(() => Promise.resolve(existingStat)),
      save: jest.fn((stat: Partial<DicteeWordStat>) => {
        savedStats.push(stat);
        return Promise.resolve(stat);
      }),
      find: jest.fn(() => Promise.resolve([])),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DicteeService,
        { provide: getRepositoryToken(DicteeItem), useValue: itemRepo },
        { provide: getRepositoryToken(DicteeSession), useValue: sessionRepo },
        { provide: getRepositoryToken(DicteeWordStat), useValue: statRepo },
      ],
    }).compile();

    service = moduleRef.get(DicteeService);
  });

  describe('startSession', () => {
    it('sert le bon nombre de phrases pour la longueur demandée', async () => {
      const result = await service.startSession({
        niveau: 'normal',
        longueur: 'moyenne',
      });
      expect(result.items).toHaveLength(2);
      expect(result.total_words).toBeGreaterThan(0);
      expect(savedSession?.item_ids).toHaveLength(2);
    });

    it('filtre le pool sur la notion demandée', async () => {
      const result = await service.startSession({
        niveau: 'normal',
        longueur: 'longue',
        notion: 'homophones : a / à',
      });
      expect(result.items.map((item) => item.id)).toEqual(['c']);
      expect(savedSession?.notion).toBe('homophones : a / à');
    });

    it('refuse quand aucun contenu ne correspond', async () => {
      await expect(
        service.startSession({
          niveau: 'normal',
          longueur: 'courte',
          notion: 'notion inexistante',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('completeSession', () => {
    beforeEach(() => {
      savedSession = {
        id: 's1',
        niveau: 'normal',
        item_ids: ['a', 'c'],
        preparee: false,
        completed_at: null,
      };
    });

    it('incrémente chaque mot distinct servi, raté ou réussi', async () => {
      await service.completeSession('s1', { wrongWords: ['tarte', 'Chat.'] });

      const byKey = new Map(savedStats.map((stat) => [stat.word_key, stat]));
      // « le » apparaît dans les deux phrases : compté une seule fois, et réussi.
      expect(byKey.get('le')).toMatchObject({
        correct_count: 1,
        incorrect_count: 0,
      });
      expect(byKey.get('chat')).toMatchObject({ incorrect_count: 1 });
      expect(byKey.get('tarte')).toMatchObject({ incorrect_count: 1 });
      expect(byKey.get('mangé')).toMatchObject({ correct_count: 1 });
    });

    it('ne retient dans la séance que les mots ratés réellement servis', async () => {
      await service.completeSession('s1', { wrongWords: ['tarte', 'inconnu'] });
      expect(savedSession?.wrong_words).toEqual(['tarte']);
      expect(savedSession?.completed_at).toBeInstanceOf(Date);
    });

    it('ne fait rien sur une séance déjà corrigée', async () => {
      savedSession = { ...savedSession, completed_at: new Date() };
      await service.completeSession('s1', { wrongWords: ['chat'] });
      expect(savedStats).toHaveLength(0);
    });
  });
});
