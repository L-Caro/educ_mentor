import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ImagierImportService } from './imagier-import.service';
import { ImagierWord } from './entities/imagier-word.entity';
import { ImagierProgression } from './entities/imagier-progression.entity';

/**
 * Le remplacement du contenu imagier (nouveau catalogue kids-flashcards) passe par cet
 * import : `replace` doit vider mots + progression AVANT d'insérer, `activate` doit rendre
 * les mots importés visibles. Un JSON cassé ne doit jamais déclencher le wipe.
 */

const DICT = JSON.stringify({
  dictionnaire_thematique: {
    animaux: { 'animaux-de-la-ferme': { vache: 'cow', mouton: 'sheep' } },
  },
});

describe('ImagierImportService.importFromJson', () => {
  let service: ImagierImportService;
  let saved: Partial<ImagierWord>[];
  let wordClear: jest.Mock;
  let progressionClear: jest.Mock;

  beforeEach(async () => {
    saved = [];
    wordClear = jest.fn().mockResolvedValue(undefined);
    progressionClear = jest.fn().mockResolvedValue(undefined);

    const wordRepo = {
      findOneBy: jest.fn().mockResolvedValue(null),
      save: jest.fn((word: Partial<ImagierWord>) => {
        saved.push(word);
        return Promise.resolve(word);
      }),
      clear: wordClear,
      manager: {
        transaction: (run: (m: unknown) => Promise<void>) =>
          run({
            getRepository: (entity: unknown) =>
              entity === ImagierProgression
                ? { clear: progressionClear }
                : { clear: wordClear },
          }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ImagierImportService,
        { provide: getRepositoryToken(ImagierWord), useValue: wordRepo },
        {
          provide: getRepositoryToken(ImagierProgression),
          useValue: { clear: progressionClear },
        },
        {
          provide: ConfigService,
          useValue: { get: () => '/nonexistent/images' },
        },
      ],
    }).compile();

    service = moduleRef.get(ImagierImportService);
  });

  it('sans `replace`, ne vide rien', async () => {
    const report = await service.importFromJson(DICT, { activate: true });

    expect(wordClear).not.toHaveBeenCalled();
    expect(progressionClear).not.toHaveBeenCalled();
    expect(report).toMatchObject({ inserted: 2, skipped: 0, replaced: false });
  });

  it("`replace` vide progression puis mots avant d'insérer", async () => {
    const report = await service.importFromJson(DICT, {
      replace: true,
      activate: true,
    });

    expect(progressionClear).toHaveBeenCalled();
    expect(wordClear).toHaveBeenCalled();
    expect(report.replaced).toBe(true);
    expect(report.inserted).toBe(2);
  });

  it('`activate` marque les mots importés actifs', async () => {
    await service.importFromJson(DICT, { activate: true });
    expect(saved.every((word) => word.is_active === true)).toBe(true);

    saved.length = 0;
    await service.importFromJson(DICT, { activate: false });
    expect(saved.every((word) => word.is_active === false)).toBe(true);
  });

  it('un JSON cassé ne déclenche pas le wipe', async () => {
    const report = await service.importFromJson('{ pas du json', {
      replace: true,
    });

    expect(wordClear).not.toHaveBeenCalled();
    expect(progressionClear).not.toHaveBeenCalled();
    expect(report.replaced).toBe(false);
    expect(report.errors).toContain('JSON invalide');
  });

  it('range chaque mot dans sa sous-catégorie', async () => {
    await service.importFromJson(DICT, {});
    expect(saved).toEqual([
      expect.objectContaining({
        fr: 'vache',
        en: 'cow',
        category: 'animaux',
        subcategory: 'animaux-de-la-ferme',
      }),
      expect.objectContaining({
        fr: 'mouton',
        en: 'sheep',
        category: 'animaux',
        subcategory: 'animaux-de-la-ferme',
      }),
    ]);
  });
});
