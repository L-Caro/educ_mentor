import { describe, expect, it } from 'vitest';
import { conjugaisonGameSpec } from 'src/modules/conjugaison/conjugaison.game';
import type { ConjugaisonQuestion, Pronom } from 'src/modules/conjugaison/conjugaison.type';

/**
 * La fiche de conjugaison est DÉRIVÉE de la question, sans contenu rédigé à l'avance.
 * Deux propriétés comptent, et rien ne les garantit à part ce test :
 *
 *   - elle est pure : le mode « école » l'appellera sur des questions types pour engendrer
 *     la bibliothèque. Une fiche qui dépendrait d'un état extérieur y produirait n'importe quoi.
 *   - elle porte sur ce que l'enfant vient de rater : le bon verbe, le bon temps, la bonne
 *     ligne. Une fiche à côté de la plaque est pire que pas de fiche.
 */

const forms = (o: Partial<Record<Pronom, string>>) => o as Record<Pronom, string>;

const question = (over: Partial<ConjugaisonQuestion> = {}): ConjugaisonQuestion => ({
  infinitif: 'chanter',
  tense: 'présent',
  pronoun: 'nous',
  conjugated: 'chantons',
  groupe: '1',
  direction: 'forward',
  choices: [],
  forms: forms({
    je: 'chante', tu: 'chantes', il: 'chante',
    nous: 'chantons', vous: 'chantez', ils: 'chantent',
  }),
  ...over,
});

describe('fiche de conjugaison', () => {
  const fiche = conjugaisonGameSpec.fiche!;

  it('porte sur le verbe et le temps de la question', () => {
    const f = fiche(question({ infinitif: 'finir', tense: 'imparfait' }));
    expect(f!.titre).toContain('finir');
    expect(f!.titre).toContain('imparfait');
  });

  it('ne répète pas les formes en ligne : le tableau les donne déjà', () => {
    // Une ligne « chante · chantes · chante · … » débordait en défilement horizontal et
    // doublonnait le tableau juste en dessous.
    expect(fiche(question())!.regle).toBeUndefined();
  });

  it('adapte l’idée clé au groupe du verbe', () => {
    expect(fiche(question({ groupe: '1' }))!.idee).toContain('-er');
    expect(fiche(question({ groupe: '2' }))!.idee).toContain('-iss-');
    // « Avoir » d'abord : commencer la phrase par « être » interdit la majuscule.
    expect(fiche(question({ groupe: 'auxiliaire' }))!.idee).toMatch(/^Avoir et être/);
  });

  it('retombe sur une idée générique pour un groupe inconnu', () => {
    // Sans repli, une donnée inattendue produirait une fiche au champ vide.
    const f = fiche(question({ groupe: 'zzz' }));
    expect(f!.idee.length).toBeGreaterThan(10);
  });

  it('signale le piège du 1er groupe, et n’en invente pas quand il n’y en a pas', () => {
    expect(fiche(question({ groupe: '1' }))!.piege).toContain('aller');
    expect(fiche(question({ groupe: '3' }))!.piege).toBeUndefined();
  });

  it('est pure : deux appels sur la même question donnent le même contenu', () => {
    const q = question();
    const a = fiche(q), b = fiche(q);
    expect({ titre: a!.titre, idee: a!.idee, piege: a!.piege })
      .toEqual({ titre: b!.titre, idee: b!.idee, piege: b!.piege });
  });

  it('ne dépend pas du sens de la question', () => {
    // En mode « conjugué vers infinitif », la fiche reste celle du verbe : même contenu.
    expect(fiche(question({ direction: 'reverse' }))!.titre)
      .toBe(fiche(question({ direction: 'forward' }))!.titre);
  });

  it("n'emploie aucun cadratin dans le texte affiché", () => {
    const f = fiche(question({ groupe: 'auxiliaire' }))!;
    for (const texte of [f.titre, f.idee, f.piege ?? '']) {
      expect(texte).not.toContain('\u2014');
    }
  });
});

describe('élision dans la fiche', () => {
  it("écrit « j'ai » et non « je ai »", () => {
    // Le cas exact d'« avoir » à la 1re personne : c'est la forme la plus consultée,
    // et « je ai » sur une fiche de leçon serait une faute affichée à l'enfant.
    const f = conjugaisonGameSpec.fiche!(question({
      infinitif: 'avoir',
      groupe: 'auxiliaire',
      pronoun: 'je',
      conjugated: 'ai',
      forms: forms({ je: 'ai', tu: 'as', il: 'a', nous: 'avons', vous: 'avez', ils: 'ont' }),
    }));
    expect(f!.titre).toContain('avoir');
    expect(f!.piege).toContain('tu es');
  });
});
