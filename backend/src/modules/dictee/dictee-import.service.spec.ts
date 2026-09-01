import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DicteeImportService } from './dictee-import.service';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';

/**
 * L'import du contenu de dictée : `replace` vide items + sessions AVANT d'insérer,
 * `activate` rend les items jouables, un JSON cassé ne déclenche jamais le wipe, et un
 * réimport sans `replace` n'empile pas de doublons.
 */

const JSON_OK = JSON.stringify({
  items: [
    { niveau: 'debutant', contenu: 'cheval', notions: ['son [ʃ] : ch'] },
    { niveau: 'normal', contenu: 'Le chat dort.', notions: [] },
  ],
});

describe('DicteeImportService.importFromJson', () => {
  let service: DicteeImportService;
  let saved: Partial<DicteeItem>[];
  let existing: Partial<DicteeItem> | null;
  let itemClear: jest.Mock;
  let sessionClear: jest.Mock;

  beforeEach(async () => {
    saved = [];
    existing = null;
    itemClear = jest.fn().mockResolvedValue(undefined);
    sessionClear = jest.fn().mockResolvedValue(undefined);

    const itemRepo = {
      findOneBy: jest.fn().mockImplementation(() => Promise.resolve(existing)),
      create: (item: Partial<DicteeItem>) => item,
      save: jest.fn((item: Partial<DicteeItem>) => {
        saved.push(item);
        return Promise.resolve(item);
      }),
      clear: itemClear,
      manager: {
        transaction: (run: (m: unknown) => Promise<void>) =>
          run({
            getRepository: (entity: unknown) =>
              entity === DicteeSession
                ? { clear: sessionClear }
                : { clear: itemClear },
          }),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DicteeImportService,
        { provide: getRepositoryToken(DicteeItem), useValue: itemRepo },
        {
          provide: getRepositoryToken(DicteeSession),
          useValue: { clear: sessionClear },
        },
      ],
    }).compile();

    service = moduleRef.get(DicteeImportService);
  });

  it('sans `replace`, ne vide rien et insère les items', async () => {
    const report = await service.importFromJson(JSON_OK, { activate: true });

    expect(itemClear).not.toHaveBeenCalled();
    expect(sessionClear).not.toHaveBeenCalled();
    expect(report).toMatchObject({ inserted: 2, skipped: 0, replaced: false });
  });

  it("`replace` vide sessions puis items avant d'insérer", async () => {
    const report = await service.importFromJson(JSON_OK, {
      replace: true,
      activate: true,
    });

    expect(sessionClear).toHaveBeenCalled();
    expect(itemClear).toHaveBeenCalled();
    expect(report).toMatchObject({ inserted: 2, replaced: true });
  });

  it('`activate` pilote le is_active des items importés', async () => {
    await service.importFromJson(JSON_OK, { activate: true });
    expect(saved.every((item) => item.is_active === true)).toBe(true);

    saved.length = 0;
    await service.importFromJson(JSON_OK, { activate: false });
    expect(saved.every((item) => item.is_active === false)).toBe(true);
  });

  it('un JSON cassé ne déclenche pas le wipe', async () => {
    const report = await service.importFromJson('{ pas du json', {
      replace: true,
    });

    expect(itemClear).not.toHaveBeenCalled();
    expect(sessionClear).not.toHaveBeenCalled();
    expect(report.replaced).toBe(false);
    expect(report.errors).toContain('JSON invalide');
  });

  it('rejette un niveau inconnu sans rien insérer', async () => {
    const bad = JSON.stringify({
      items: [{ niveau: 'expert', contenu: 'trop dur' }],
    });
    const report = await service.importFromJson(bad, { replace: true });

    expect(report.inserted).toBe(0);
    expect(report.replaced).toBe(false);
    expect(itemClear).not.toHaveBeenCalled();
    expect(report.errors[0]).toMatch(/niveau/);
  });

  it('ignore un item déjà présent quand on ne remplace pas', async () => {
    existing = { id: 'x', niveau: 'debutant', contenu: 'cheval' };
    const report = await service.importFromJson(JSON_OK, {});

    expect(report.skipped).toBe(2);
    expect(report.inserted).toBe(0);
  });

  it('accepte aussi un tableau nu', async () => {
    const bare = JSON.stringify([
      { niveau: 'difficile', contenu: 'Un paragraphe entier.', notions: [] },
    ]);
    const report = await service.importFromJson(bare, {});
    expect(report.inserted).toBe(1);
  });
});
