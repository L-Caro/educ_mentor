import { Test } from '@nestjs/testing';
import { PeageService } from './peage.service';
import { SettingsService } from '../settings/settings.service';
import { CatalogService } from '../catalog/catalog.service';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import { AccordsService } from '../accords/accords.service';
import { MAXIMUM_QUESTIONS } from './peage.types';

/** Une réponse de service qui ne produit aucune question — module éteint côté notions. */
const RIEN = {
  resultat: { questions: [], timer_seconds: 0, is_unlimited: false },
  seance: {},
};

describe('PeageService', () => {
  let service: PeageService;
  let settings: Map<string, string>;
  let actifs: string[];
  let faux: Record<
    string,
    { construireQuestions: jest.Mock; startSession: jest.Mock }
  >;

  beforeEach(async () => {
    settings = new Map();
    actifs = [
      'tables',
      'calcul-mental',
      'conjugaison',
      'grammaire',
      'accords',
      'morpion',
    ];

    const service_factice = () => ({
      construireQuestions: jest.fn().mockResolvedValue(RIEN),
      startSession: jest.fn(),
    });
    faux = {
      tables: service_factice(),
      calcul: service_factice(),
      conjugaison: service_factice(),
      grammaire: service_factice(),
      accords: service_factice(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PeageService,
        {
          provide: SettingsService,
          useValue: {
            get: jest.fn((cle: string) =>
              Promise.resolve(settings.get(cle) ?? null),
            ),
          },
        },
        {
          provide: CatalogService,
          useValue: {
            findAll: jest.fn(() =>
              Promise.resolve(actifs.map((id) => ({ id, is_active: true }))),
            ),
          },
        },
        { provide: TablesService, useValue: faux.tables },
        { provide: CalculService, useValue: faux.calcul },
        { provide: ConjugaisonService, useValue: faux.conjugaison },
        { provide: GrammaireService, useValue: faux.grammaire },
        { provide: AccordsService, useValue: faux.accords },
      ],
    }).compile();

    service = moduleRef.get(PeageService);
  });

  describe('le réglage', () => {
    it('est ÉTEINT tant que personne ne l’allume', async () => {
      // Un péage qui s'installerait tout seul changerait l'application sous les pieds de
      // l'enfant, sans que personne l'ait décidé.
      expect(await service.nombreDeQuestions()).toBe(0);
    });

    it('lit le nombre demandé', async () => {
      settings.set('jeux_peage_questions', '2');
      expect(await service.nombreDeQuestions()).toBe(2);
    });

    it('borne une valeur aberrante au lieu de la croire', async () => {
      // Écrite à la main en base, elle transformerait une partie de morpion en
      // interrogation écrite.
      settings.set('jeux_peage_questions', '99');
      expect(await service.nombreDeQuestions()).toBe(MAXIMUM_QUESTIONS);
    });

    it('traite l’illisible et le négatif comme « éteint »', async () => {
      for (const valeur of ['', 'beaucoup', '-3', '0']) {
        settings.set('jeux_peage_questions', valeur);
        expect({ valeur, n: await service.nombreDeQuestions() }).toEqual({
          valeur,
          n: 0,
        });
      }
    });
  });

  describe('les modules qui alimentent le péage', () => {
    it('ne retient que les cinq, jamais un jeu', async () => {
      // `morpion` est actif dans le catalogue : demander une question de morpion pour
      // avoir le droit de jouer au morpion n'aurait aucun sens.
      expect((await service.modulesDisponibles()).sort()).toEqual([
        'accords',
        'calcul-mental',
        'conjugaison',
        'grammaire',
        'tables',
      ]);
    });

    it('écarte un module ÉTEINT dans l’administration', async () => {
      // Le péage ne doit pas contourner le seul réglage qui décide de ce que l'enfant
      // voit : poser une question de conjugaison alors que le module est éteint
      // reviendrait à le rallumer par la bande.
      actifs = ['tables', 'accords'];
      expect((await service.modulesDisponibles()).sort()).toEqual([
        'accords',
        'tables',
      ]);
    });
  });

  describe('tirer une question', () => {
    it('n’ENREGISTRE rien : jamais de séance, jamais de progression', async () => {
      // C'est la raison d'être de `construireQuestions`. Une question posée à la porte
      // d'un jeu n'est pas une séance de travail, et la voir dans « séances récentes »
      // brouillerait ce que l'adulte y lit. Une réponse donnée pour avoir le droit de
      // jouer ne dit pas non plus grand-chose de ce qui est su.
      faux.tables.construireQuestions.mockResolvedValue({
        resultat: {
          questions: [
            {
              fact_id: '7x8',
              display_a: 7,
              display_b: 8,
              answer: 56,
              choices: [56, 42, 48, 63],
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      });
      actifs = ['tables'];

      const question = await service.tirerQuestion();
      expect(question).toMatchObject({
        module_id: 'tables',
        enonce: '7 × 8',
        reponse: '56',
      });
      expect(question!.choix).toContain('56');

      for (const nom of Object.keys(faux)) {
        expect({
          nom,
          appels: faux[nom].startSession.mock.calls.length,
        }).toEqual({
          nom,
          appels: 0,
        });
      }
    });

    it('essaie un AUTRE module quand le premier n’a rien à demander', async () => {
      // Toutes les notions d'un module peuvent être fermées. Abandonner à la première
      // tentative rendrait le péage capricieux : il laisserait passer une fois sur deux.
      //
      // L'ordre d'essai est TIRÉ AU SORT, donc on répète : une seule passe aurait pu
      // tomber sur `calcul` en premier et ne rien prouver du tout. C'est exactement ce
      // qu'a fait la première version de ce test, qui vérifiait que `tables` avait été
      // interrogé — vrai une fois sur deux, donc instable en intégration continue.
      actifs = ['tables', 'calcul-mental'];
      faux.calcul.construireQuestions.mockResolvedValue({
        resultat: {
          questions: [
            { operation: '24 + 17', answer: 41, choices: [41, 31, 47, 51] },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      });

      for (let essai = 0; essai < 30; essai++) {
        const question = await service.tirerQuestion();
        expect(question?.module_id).toBe('calcul-mental');
      }
    });

    it('traite le REFUS d’un module comme un silence, pas comme une panne', async () => {
      // Grammaire et accords lèvent une exception quand aucune notion ouverte ne permet
      // de composer une question. Laissée passer, elle sortait en 400 : l'enfant restait
      // devant un morpion qu'elle ne pouvait pas lancer. Un test de bout en bout l'a
      // attrapé.
      actifs = ['grammaire', 'tables'];
      faux.grammaire.construireQuestions.mockRejectedValue(
        new Error('Aucune notion active'),
      );
      faux.tables.construireQuestions.mockResolvedValue({
        resultat: {
          questions: [
            {
              fact_id: '7x8',
              display_a: 7,
              display_b: 8,
              answer: 56,
              choices: [56, 42, 48, 63],
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      });

      for (let essai = 0; essai < 30; essai++) {
        expect((await service.tirerQuestion())?.module_id).toBe('tables');
      }
    });

    it('rend `null` plutôt que de bloquer quand PERSONNE ne peut demander', async () => {
      // Un péage qui se referme sur une enfant parce qu'il n'a rien à demander serait la
      // pire des pannes : elle irait chercher un adulte pour un jeu de morpion. Le front
      // laisse alors jouer.
      actifs = [];
      expect(await service.tirerQuestion()).toBeNull();
    });

    it('écarte une question sans assez de propositions', async () => {
      // En saisie libre, `choices` est vide. Un péage se franchit d'une touche : offrir
      // un clavier à une enfant venue jouer, c'est lui offrir de renoncer.
      actifs = ['tables'];
      faux.tables.construireQuestions.mockResolvedValue({
        resultat: {
          questions: [
            {
              fact_id: '7x8',
              display_a: 7,
              display_b: 8,
              answer: 56,
              choices: [],
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      });
      expect(await service.tirerQuestion()).toBeNull();
    });
  });
});
