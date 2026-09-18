import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { numerationGameSpec } from 'src/modules/numeration/numeration.game';
import { numerationModule } from 'src/modules/numeration/numeration.module';
import { NumerationPrompt } from 'src/modules/numeration/NumerationPrompt';
import type { NumerationQuestion } from 'src/modules/numeration/numeration.type';

/**
 * Les chiffres romains passent par le meme descripteur que le reste de la numeration, et
 * trois pannes silencieuses sont visees :
 *   - un type que le pre-jeu ne propose pas n'est jamais demande, donc jamais tire ;
 *   - une lecture (`XLII` → 42) qui recevrait des choix passerait en QCM au lieu de la
 *     saisie libre, et l'enfant n'aurait plus a lire (le moteur bascule sur la presence
 *     de choix) ;
 *   - un enonce qui ne sait pas afficher le type retombe sur « valeur position. » et
 *     montre la question d'un autre exercice.
 */

const question = (over: Partial<NumerationQuestion>): NumerationQuestion => ({
  item_key: 'k',
  type: 'romain_lecture',
  display: 'XLII',
  answer: '42',
  choices: [],
  decompose_positions: null,
  suite_terms: null,
  ...over,
});

describe('numeration : chiffres romains', () => {
  it('propose les trois types romains dans le pre-jeu', () => {
    const option = numerationModule.setupOptions?.find(
      ({ key }) => key === 'questionTypes',
    );
    const valeurs = option?.choices?.map(({ value }) => value);
    expect(valeurs).toEqual(
      expect.arrayContaining([
        'romain_lecture',
        'romain_ecriture',
        'romain_comparaison',
      ]),
    );
  });

  it('fait SAISIR la lecture et compare a la valeur', () => {
    const lecture = question({});
    expect(numerationGameSpec.qcm?.getChoices(lecture)).toEqual([]);
    expect(numerationGameSpec.free?.isCorrect(lecture, '42')).toBe(true);
    expect(numerationGameSpec.free?.isCorrect(lecture, '24')).toBe(false);
  });

  it('fait CHOISIR l’ecriture, et dit la bonne reponse en romain', () => {
    const ecriture = question({
      type: 'romain_ecriture',
      display: '42',
      answer: 'XLII',
      choices: ['XLII', 'XXIV', 'XLI', 'LXII'],
    });
    expect(numerationGameSpec.qcm?.getChoices(ecriture)).toHaveLength(4);
    expect(numerationGameSpec.qcm?.correctKey?.(ecriture)).toBe('XLII');
    expect(numerationGameSpec.correctionLabel?.(ecriture)).toBe('XLII');
  });

  it.each([
    ['romain_lecture', 'XLII', 'Écris en chiffres'],
    ['romain_ecriture', '42', 'Écris en chiffres romains'],
  ] as const)('affiche l’enonce de %s', (type, display, consigne) => {
    const html = renderToStaticMarkup(
      <NumerationPrompt question={question({ type, display })} />,
    );
    expect(html).toContain(consigne);
    expect(html).toContain(display);
  });

  it('affiche la comparaison de deux romains avec le carre a remplir', () => {
    const html = renderToStaticMarkup(
      <NumerationPrompt
        question={question({
          type: 'romain_comparaison',
          display: 'IV  □  IIII',
          answer: '=',
          choices: ['<', '=', '>'],
        })}
      />,
    );
    expect(html).toContain('IV');
    expect(html).toContain('IIII');
    expect(html).toContain('□');
  });
});
