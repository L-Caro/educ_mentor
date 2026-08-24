import { describe, expect, it } from 'vitest';
import { lectureGameSpec } from 'src/modules/lecture/lecture.game';

/**
 * Le préambule (le texte à lire avant les questions, en mode difficile) était synchronisé
 * par un `useEffect` + `setState` dans GameEngine ; il est désormais DÉRIVÉ du retour de
 * `spec.preamble(session)`.
 *
 * Le moteur affiche l'écran de préambule tant que `preamble(session)` ne renvoie pas `null`.
 * Ce contrat est donc ce qui décide qu'une partie de lecture commence par le texte ou
 * directement par la première question — un `null` de trop et l'enfant ne voit jamais le
 * texte qu'il est censé mémoriser.
 */

const session = (questions: unknown[]) => ({ questions }) as never;

const question = {
  item_key: 'q1',
  text_titre: 'Ulysse et la mer',
  text_contenu: 'Ulysse navigua longtemps…',
  show_text: false,
  display: 'Où va Ulysse ?',
  choices: ['a', 'b'],
  answer: 'a',
  excerpt: null,
};

describe('préambule du module lecture', () => {
  it('affiche le texte quand la session contient des questions', () => {
    expect(lectureGameSpec.preamble!(session([question]))).not.toBeNull();
  });

  it('ne bloque pas sur une session sans question', () => {
    // Sinon le moteur resterait coincé sur un écran de préambule vide, sans issue.
    expect(lectureGameSpec.preamble!(session([]))).toBeNull();
  });

  it("n'est déclaré que par les modules qui en ont besoin", async () => {
    // Le moteur passe directement aux questions quand `preamble` est absent : le vérifier
    // évite qu'une régression du contrat n'insère un écran vide dans tous les modules.
    const { geoGameSpec } = await import('src/modules/geo/geo.game');
    const { franceGameSpec } = await import('src/modules/france/france.game');
    expect(geoGameSpec.preamble).toBeUndefined();
    expect(franceGameSpec.preamble).toBeUndefined();
  });
});
