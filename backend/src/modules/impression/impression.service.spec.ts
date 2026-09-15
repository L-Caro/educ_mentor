import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { PoseService } from '../pose/pose.service';
import { DicteeService } from '../dictee/dictee.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { AccordsService } from '../accords/accords.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import { NumerationService } from '../numeration/numeration.service';
import { HeureService } from '../heure/heure.service';
import { MAXIMUM_ITEMS } from './impression.types';

describe('ImpressionService', () => {
  let service: ImpressionService;
  let tables: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let calcul: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let pose: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let dictee: { construireItems: jest.Mock; startSession: jest.Mock };

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

    pose = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [
            {
              skill_key: 'addition_3',
              operation: 'addition',
              operands: [247, 138],
              answer: 385,
              columns: 4,
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
          method: 'compensation',
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    dictee = {
      construireItems: jest.fn().mockResolvedValue({
        niveau: 'ce1',
        preparee: false,
        total_words: 6,
        items: [
          { id: '1', contenu: 'Le chat dort.', notions: [] },
          { id: '2', contenu: 'Les oiseaux chantent.', notions: [] },
        ],
      }),
      startSession: jest.fn(),
    };

    const conjugaison = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [
            {
              infinitif: 'chanter',
              tense: 'présent',
              pronoun: 'je',
              conjugated: 'chante',
              groupe: '1',
              direction: 'forward',
              choices: [],
              forms: {
                je: 'chante',
                tu: 'chantes',
                il: 'chante',
                elle: 'chante',
                on: 'chante',
                nous: 'chantons',
                vous: 'chantez',
                ils: 'chantent',
                elles: 'chantent',
              },
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    const vide = () => ({
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: { questions: [], timer_seconds: 0, is_unlimited: false },
        seance: {},
      }),
      startSession: jest.fn(),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        ImpressionService,
        { provide: TablesService, useValue: tables },
        { provide: CalculService, useValue: calcul },
        { provide: PoseService, useValue: pose },
        { provide: DicteeService, useValue: dictee },
        { provide: ConjugaisonService, useValue: conjugaison },
        { provide: AccordsService, useValue: vide() },
        { provide: GrammaireService, useValue: vide() },
        {
          provide: HeureService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    hour: 3,
                    minute: 45,
                    answer_value: 225,
                    numeral_type: 'arabic',
                    choices: [],
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: NumerationService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [],
                timer_seconds: 0,
                is_unlimited: false,
              },
              positions: ['u', 'd', 'c', 'm'],
            }),
            createSession: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ImpressionService);
  });

  it('n’ENREGISTRE rien : jamais de seance, jamais de progression', async () => {
    // Une feuille imprimee n'est pas une seance a l'ecran, et la voir dans « seances
    // recentes » brouillerait ce que l'adulte y lit. Surtout, le travail sur papier n'est
    // pas mesure : le compter dans la progression ferait mentir la mesure.
    await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 5 },
    ]);
    for (const service of [tables, calcul, pose, dictee]) {
      expect(service.startSession).not.toHaveBeenCalled();
    }
  });

  it('rend exactement le nombre d’exercices demande', async () => {
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 6 },
    ]);
    expect(items).toHaveLength(6);
    // Un ITEM porte un seul type : c'est la ligne de composition qui en coche plusieurs.
    expect(items[0]).toMatchObject({ module: 'tables', exercice: 'produit' });
  });

  it('melange les modules sur une meme feuille, dans l’ordre demande', async () => {
    // C'est la raison d'etre du service : trois tables et deux calculs sur la meme page.
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 3 },
      { module: 'calcul-mental', exercices: ['operation'], nombre: 1 },
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
      { module: 'tables', exercices: ['produit'], nombre: 10 },
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
      { module: 'tables', exercices: ['produit'], nombre: 20 },
    ]);
    expect(items).toHaveLength(3);
  });

  it('refuse une feuille demesuree', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercices: ['produit'], nombre: MAXIMUM_ITEMS + 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un exercice qu’aucun module ne fournit', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercices: ['racine_carree'], nombre: 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('demande la saisie LIBRE, pas un QCM', async () => {
    // Sur le papier on ecrit la reponse, on ne coche pas : engendrer des choix serait au
    // mieux inutile, au pire imprime par erreur.
    await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 2 },
    ]);
    expect(tables.construireQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'hard' }),
    );
  });

  it('ne rend qu’UNE dictee, quel que soit le nombre demande', async () => {
    // Une dictee n'est pas un exercice parmi d'autres : c'est un bloc de lignes que
    // l'adulte dicte a voix haute. « Trois dictees » sur une feuille n'aurait pas de
    // sens ; c'est la longueur qui varie, pas le nombre.
    const items = await service.composer([
      { module: 'dictee', exercices: ['dictee'], nombre: 3 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].donnees.phrases).toEqual([
      'Le chat dort.',
      'Les oiseaux chantent.',
    ]);
  });

  it('n’envoie PAS les retenues avec une operation posee', async () => {
    // Elles ne sont pas imprimees : les transmettre inviterait a les dessiner un jour
    // par megarde.
    const items = await service.composer([
      { module: 'pose', exercices: ['operation'], nombre: 1 },
    ]);
    expect(items[0].donnees).not.toHaveProperty('retenues');
    expect(items[0].donnees.operandes).toEqual([247, 138]);
  });

  it('sort les pronoms les plus INSTRUCTIFS quand on en demande moins de six', async () => {
    // `je`, `tu` et `il` se ressemblent trop pour apprendre quoi que ce soit. A trois
    // formes, on veut `je`, `nous` et `ils` : la premiere personne, la terminaison la
    // plus irreguliere, et celle qu'on oublie.
    const items = await service.composer([
      {
        module: 'conjugaison',
        exercices: ['forme'],
        nombre: 1,
        options: { formes: 3 },
      },
    ]);
    const lignes = items[0].donnees.lignes as { pronom: string }[];
    expect(lignes.map((l) => l.pronom)).toEqual(['je', 'nous', 'ils']);
  });

  it('garde l’ordre du TABLEAU pour l’affichage, pas l’ordre d’utilite', async () => {
    // Une conjugaison qui commencerait par `nous` se lit mal.
    const items = await service.composer([
      {
        module: 'conjugaison',
        exercices: ['forme'],
        nombre: 1,
        options: { formes: 6 },
      },
    ]);
    const lignes = items[0].donnees.lignes as { pronom: string }[];
    expect(lignes.map((l) => l.pronom)).toEqual([
      'je',
      'tu',
      'il',
      'nous',
      'vous',
      'ils',
    ]);
  });

  it('borne le nombre de formes entre une et six', async () => {
    for (const [demande, attendu] of [
      [0, 1],
      [9, 6],
    ] as const) {
      const items = await service.composer([
        {
          module: 'conjugaison',
          exercices: ['forme'],
          nombre: 1,
          options: { formes: demande },
        },
      ]);
      const lignes = items[0].donnees.lignes as unknown[];
      expect({ demande, formes: lignes.length }).toEqual({
        demande,
        formes: attendu,
      });
    }
  });

  it('ne fait JAMAIS passer une duree apres minuit', async () => {
    // « De 23 h 40 a 0 h 20 » demanderait de compter a rebours sur un cycle qu'elle ne
    // manipule pas encore. Le tirage doit rester dans la journee, pas seulement le plus
    // souvent : c'est la borne du generateur qu'on verifie, pas sa chance.
    const items = await service.composer([
      { module: 'heure', exercices: ['durees'], nombre: 20 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const [heures] = String(item.donnees.fin).split(' h ');
      expect(Number(heures)).toBeLessThan(23);
    }
  });

  it('ecrit les minutes d’une heure sur DEUX chiffres', async () => {
    // « 9 h 5 » se lit mal, et ce n'est pas ce qu'affiche un reveil.
    const items = await service.composer([
      { module: 'heure', exercices: ['durees'], nombre: 15 },
    ]);
    for (const item of items) {
      expect(String(item.donnees.depart)).toMatch(/^\d{1,2} h \d{2}$/);
    }
  });

  it('tire le cadran chez le module, sans generateur parallele', async () => {
    // Lire l'heure et la dessiner sont le meme savoir pris dans les deux sens : un second
    // tirage a nous divergerait un jour de celui de l'ecran.
    const items = await service.composer([
      { module: 'heure', exercices: ['dessiner'], nombre: 1 },
    ]);
    expect(items[0].donnees).toMatchObject({ heure: 3, minute: 45 });
  });
});
