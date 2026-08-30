import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MemoryService } from './memory.service';
import { MemorySession } from './entities/memory-session.entity';
import { MemoryCard } from './entities/memory-card.entity';

/**
 * Depuis le découplage, une partie de Memory se construit à partir de `memory_cards`, plus
 * de `imagier_words`. Ce test fige ce contrat : le service interroge le bon dépôt, ne retient
 * que les cartes qui ont une image, et publie une URL sous `/media/memory/`.
 */

const CARDS: MemoryCard[] = [
  {
    id: 'chat',
    fr: 'chat',
    en: 'cat',
    image_filename: 'chat.webp',
    category: 'animaux',
    created_at: new Date(),
  },
  {
    id: 'chien',
    fr: 'chien',
    en: 'dog',
    image_filename: 'chien.webp',
    category: 'animaux',
    created_at: new Date(),
  },
];

function buildQueryBuilder(result: MemoryCard[]) {
  const qb = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(result),
  };
  return qb;
}

describe('MemoryService.startSession', () => {
  let service: MemoryService;
  let cardQb: ReturnType<typeof buildQueryBuilder>;
  const savedSessions: MemorySession[] = [];

  beforeEach(async () => {
    cardQb = buildQueryBuilder(CARDS);
    savedSessions.length = 0;

    const moduleRef = await Test.createTestingModule({
      providers: [
        MemoryService,
        {
          provide: getRepositoryToken(MemorySession),
          useValue: {
            create: (data: MemorySession) => data,
            save: jest.fn((session: MemorySession) => {
              savedSessions.push(session);
              return Promise.resolve(session);
            }),
          },
        },
        {
          provide: getRepositoryToken(MemoryCard),
          useValue: { createQueryBuilder: () => cardQb },
        },
      ],
    }).compile();

    service = moduleRef.get(MemoryService);
  });

  it("tire les cartes depuis memory_cards, filtrées sur la présence d'image", async () => {
    await service.startSession({ pairs_count: 2, mode: 'image' });

    expect(cardQb.where).toHaveBeenCalledWith(
      'card.image_filename IS NOT NULL',
    );
    expect(cardQb.orderBy).toHaveBeenCalledWith('RANDOM()');
    expect(cardQb.limit).toHaveBeenCalledWith(2);
  });

  it('publie une URL /media/memory/ par carte', async () => {
    const result = await service.startSession({
      pairs_count: 2,
      mode: 'image_word_fr',
    });

    expect(result.pairs).toEqual([
      {
        id: 'chat',
        image_url: '/media/memory/chat.webp',
        word_fr: 'chat',
        word_en: 'cat',
      },
      {
        id: 'chien',
        image_url: '/media/memory/chien.webp',
        word_fr: 'chien',
        word_en: 'dog',
      },
    ]);
    expect(result.mode).toBe('image_word_fr');
  });

  it('enregistre la session sans catégorie', async () => {
    const result = await service.startSession({
      pairs_count: 2,
      mode: 'image',
    });

    expect(savedSessions).toHaveLength(1);
    expect(savedSessions[0].id).toBe(result.session_id);
    expect(savedSessions[0].categories).toBe('[]');
  });
});
