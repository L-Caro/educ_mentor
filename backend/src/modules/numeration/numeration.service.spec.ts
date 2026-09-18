import { NumerationService } from './numeration.service';
import { enRomain, lireRomain } from './numeration.romains';
import type { SettingsService } from '../settings/settings.service';

/**
 * Le service se construit a la main : les deux depots ne servent qu'a la seance et a la
 * progression, que ces tests ne touchent pas. Seuls les reglages comptent ici, et ils
 * sont un simple dictionnaire.
 */
describe('NumerationService', () => {
  let reglages: Record<string, string>;
  let service: NumerationService;

  const questions = async (types: string[]) =>
    (await service.construireQuestions({ question_types: types })).resultat
      .questions;

  beforeEach(() => {
    reglages = { questions_per_session: '30' };
    const settings = {
      get: jest.fn((cle: string) => Promise.resolve(reglages[cle] ?? null)),
    } as unknown as SettingsService;
    service = new NumerationService({} as never, {} as never, settings);
  });

  describe('palier des chiffres romains', () => {
    it('vaut 39 tant que personne n’a rien ouvert', async () => {
      expect(await service.getPalierRomain()).toBe(39);
    });

    it.each([39, 100, 1000])(
      'lit le palier %i ouvert par l’administration',
      async (palier) => {
        reglages.numeration_romains_palier = String(palier);
        expect(await service.getPalierRomain()).toBe(palier);
      },
    );

    it('retombe sur 39 devant une valeur qui n’est pas un palier', async () => {
      for (const invalide of ['50', 'abc', '', '4000']) {
        reglages.numeration_romains_palier = invalide;
        expect(await service.getPalierRomain()).toBe(39);
      }
    });
  });

  describe('questions en chiffres romains', () => {
    it('n’en tire JAMAIS quand l’enfant ne coche rien', async () => {
      for (let essai = 0; essai < 20; essai++) {
        for (const question of await questions([])) {
          expect(question.type).not.toMatch(/^romain_/);
        }
      }
    });

    it('n’en tire que du type demande', async () => {
      const tirees = await questions(['romain_lecture']);
      expect(tirees.length).toBeGreaterThan(0);
      for (const question of tirees)
        expect(question.type).toBe('romain_lecture');
    });

    it('fait lire un nombre romain, IIII compris, avec la bonne valeur en reponse', async () => {
      reglages.numeration_romains_palier = '39';
      for (const question of await questions(['romain_lecture'])) {
        expect(question.choices).toEqual([]);
        expect(lireRomain(question.display)).toBe(Number(question.answer));
        expect(Number(question.answer)).toBeLessThanOrEqual(39);
      }
    });

    it('fait ecrire un nombre en QCM, avec UNE seule bonne reponse', async () => {
      for (let essai = 0; essai < 10; essai++) {
        for (const question of await questions(['romain_ecriture'])) {
          const valeur = Number(question.display);
          expect(question.choices).toHaveLength(4);
          expect(new Set(question.choices).size).toBe(4);
          expect(question.answer).toBe(enRomain(valeur));
          expect(
            question.choices.filter((choix) => lireRomain(choix) === valeur),
          ).toEqual([question.answer]);
        }
      }
    });

    it('compare deux nombres romains et repond juste, egalite comprise', async () => {
      let egalites = 0;
      for (let essai = 0; essai < 20; essai++) {
        for (const question of await questions(['romain_comparaison'])) {
          const [gauche, , droite] = question.display.split('  ');
          const attendu = Math.sign(lireRomain(gauche)! - lireRomain(droite)!);
          expect(question.answer).toBe(
            { '-1': '<', '0': '=', '1': '>' }[attendu],
          );
          expect(question.choices).toEqual(['<', '=', '>']);
          if (question.answer === '=') egalites++;
        }
      }
      expect(egalites).toBeGreaterThan(0);
    });

    it('ne depasse pas le palier, ni pour la valeur ni pour l’alphabet', async () => {
      reglages.numeration_romains_palier = '39';
      const tirees = await questions([
        'romain_lecture',
        'romain_ecriture',
        'romain_comparaison',
      ]);
      expect(tirees.length).toBeGreaterThan(0);
      for (const question of tirees) {
        const textes = [
          ...(question.type === 'romain_lecture' ? [question.display] : []),
          ...(question.type === 'romain_comparaison'
            ? question.display.split('  ').filter((morceau) => morceau !== '□')
            : []),
          ...question.choices.filter(
            (choix) => !['<', '=', '>'].includes(choix),
          ),
        ];
        for (const texte of textes) expect(texte).toMatch(/^[IVX]+$/);
      }
    });

    it('monte jusqu’a 1000 quand l’administration l’a ouvert', async () => {
      reglages.numeration_romains_palier = '1000';
      let plusGrand = 0;
      for (let essai = 0; essai < 20; essai++) {
        for (const question of await questions(['romain_lecture'])) {
          plusGrand = Math.max(plusGrand, Number(question.answer));
        }
      }
      expect(plusGrand).toBeGreaterThan(100);
      expect(plusGrand).toBeLessThanOrEqual(1000);
    });
  });
});
