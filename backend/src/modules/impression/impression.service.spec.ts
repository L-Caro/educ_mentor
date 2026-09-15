import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { MAXIMUM_ITEMS } from './impression.types';

describe('ImpressionService', () => {
  let service: ImpressionService;
  let tables: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let calcul: { construireQuestions: jest.Mock; startSession: jest.Mock };

  /** Un lot de faits distincts, comme en rendrait une vraie seance. */
  const faits = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      fact_id: `f${i}`,
      display_a: i + 2,
      display_b: 3,
      answer: (i + 2) * 3,
      choices: [],
    }));

  beforeEach(async () => {
    tables = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: faits(10),
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    calcul = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [{ operation: '24 + 17', answer: 41, choices: [] }],
          timer_seconds: 0,
          is_unlimited: false,
          min_value: 0,
          max_value: 20,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ImpressionService,
        { provide: TablesService, useValue: tables },
        { provide: CalculService, useValue: calcul },
      ],
    }).compile();
    service = moduleRef.get(ImpressionService);
  });

  it('n’ENREGISTRE rien : jamais de seance, jamais de progression', async () => {
    // Une feuille imprimee n'est pas une seance a l'ecran, et la voir dans « seances
    // recentes » brouillerait ce que l'adulte y lit. Surtout, le travail sur papier n'est
    // pas mesure : le compter dans la progression ferait mentir la mesure.
    await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 5 },
    ]);
    expect(tables.startSession).not.toHaveBeenCalled();
    expect(calcul.startSession).not.toHaveBeenCalled();
  });

  it('rend exactement le nombre d’exercices demande', async () => {
    const items = await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 6 },
    ]);
    expect(items).toHaveLength(6);
    expect(items[0]).toMatchObject({ module: 'tables', exercice: 'produit' });
  });

  it('melange les modules sur une meme feuille, dans l’ordre demande', async () => {
    // C'est la raison d'etre du service : trois tables et deux calculs sur la meme page.
    const items = await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 3 },
      { module: 'calcul-mental', exercice: 'operation', nombre: 1 },
    ]);
    expect(items.map((i) => i.module)).toEqual([
      'tables',
      'tables',
      'tables',
      'calcul-mental',
    ]);
  });

  it('ne pose JAMAIS deux fois le meme exercice sur une feuille', async () => {
    // Deux fois « 7 x 8 » sur la meme page, c'est une ligne perdue.
    const items = await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 10 },
    ]);
    const cles = items.map(
      (i) => `${String(i.donnees.a)}x${String(i.donnees.b)}`,
    );
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('rend une feuille plus courte plutot que de tourner sans fin', async () => {
    // Une seule table cochee, vingt multiplications voulues : le vivier est plus petit
    // que la demande. Mieux vaut une feuille incomplete qu'une requete qui ne repond pas.
    tables.construireQuestions.mockResolvedValue({
      resultat: { questions: faits(3), timer_seconds: 0, is_unlimited: false },
      seance: {},
    });
    const items = await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 20 },
    ]);
    expect(items).toHaveLength(3);
  });

  it('refuse une feuille demesuree', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercice: 'produit', nombre: MAXIMUM_ITEMS + 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un exercice qu’aucun module ne fournit', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercice: 'racine_carree', nombre: 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('demande la saisie LIBRE, pas un QCM', async () => {
    // Sur le papier on ecrit la reponse, on ne coche pas : engendrer des choix serait au
    // mieux inutile, au pire imprime par erreur.
    await service.composer([
      { module: 'tables', exercice: 'produit', nombre: 2 },
    ]);
    expect(tables.construireQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'hard' }),
    );
  });
});
