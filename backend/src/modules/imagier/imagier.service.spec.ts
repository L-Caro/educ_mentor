import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ImagierService } from './imagier.service';
import { ImagierWord } from './entities/imagier-word.entity';
import { ImagierProgression } from './entities/imagier-progression.entity';
import { ImagierSession } from './entities/imagier-session.entity';
import { SettingsService } from '../settings/settings.service';
import { ImagierImportService } from './imagier-import.service';

/**
 * Pré-jeu imagier : l'enfant choisit un thème (= `category`) puis, facultativement, des
 * sous-catégories. Ce test fige deux contrats :
 *   - `getCategories` renvoie l'arbre thème → sous-catégories avec les comptes agrégés ;
 *   - `startSession` filtre par `category` seul, ou par `category` + `subcategory IN (...)`.
 */

function chainableQb(rawRows: unknown[] = [], entities: ImagierWord[] = []) {
  const qb: Record<string, jest.Mock> = {};
  for (const method of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
    'orderBy',
    'addOrderBy',
  ]) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(rawRows);
  qb.getMany = jest.fn().mockResolvedValue(entities);
  return qb;
}

async function buildService(qb: ReturnType<typeof chainableQb>) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      ImagierService,
      {
        provide: getRepositoryToken(ImagierWord),
        useValue: { createQueryBuilder: () => qb },
      },
      {
        provide: getRepositoryToken(ImagierProgression),
        useValue: { find: jest.fn().mockResolvedValue([]) },
      },
      {
        provide: getRepositoryToken(ImagierSession),
        useValue: {
          create: (data: unknown) => data,
          save: jest.fn().mockResolvedValue({}),
        },
      },
      {
        provide: SettingsService,
        useValue: { get: jest.fn().mockResolvedValue(null) },
      },
      { provide: ImagierImportService, useValue: {} },
      { provide: ConfigService, useValue: { get: () => './data/images' } },
    ],
  }).compile();

  return moduleRef.get(ImagierService);
}

describe('ImagierService.getCategories', () => {
  it('agrège les sous-catégories sous leur thème', async () => {
    const qb = chainableQb([
      {
        category: 'animaux',
        subcategory: 'animaux-de-la-ferme',
        count: '16',
        active_count: '10',
      },
      {
        category: 'animaux',
        subcategory: 'insectes',
        count: '24',
        active_count: '0',
      },
      {
        category: 'nourriture',
        subcategory: 'fruits',
        count: '21',
        active_count: '21',
      },
    ]);
    const service = await buildService(qb);

    const tree = await service.getCategories();

    expect(tree).toEqual([
      {
        category: 'animaux',
        count: 40,
        active_count: 10,
        subcategories: [
          { subcategory: 'animaux-de-la-ferme', count: 16, active_count: 10 },
          { subcategory: 'insectes', count: 24, active_count: 0 },
        ],
      },
      {
        category: 'nourriture',
        count: 21,
        active_count: 21,
        subcategories: [{ subcategory: 'fruits', count: 21, active_count: 21 }],
      },
    ]);
  });
});

describe('ImagierService.startSession', () => {
  it("filtre par thème seul quand aucune sous-catégorie n'est fournie", async () => {
    const qb = chainableQb();
    const service = await buildService(qb);

    await service.startSession({ category: 'animaux' });

    expect(qb.andWhere).toHaveBeenCalledWith('w.category = :category', {
      category: 'animaux',
    });
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      'w.subcategory IN (:...subs)',
      expect.anything(),
    );
  });

  it('restreint aux sous-catégories quand elles sont fournies', async () => {
    const qb = chainableQb();
    const service = await buildService(qb);

    await service.startSession({
      category: 'animaux',
      subcategories: ['insectes', 'animaux-marins'],
    });

    expect(qb.andWhere).toHaveBeenCalledWith('w.subcategory IN (:...subs)', {
      subs: ['insectes', 'animaux-marins'],
    });
  });
});
