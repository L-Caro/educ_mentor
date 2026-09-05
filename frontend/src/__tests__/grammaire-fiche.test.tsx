import { describe, expect, it } from 'vitest';
import { grammaireFiche } from 'src/modules/grammaire/grammaire.fiche';
import type {
  GrammaireQuestion,
  NotionKey,
} from 'src/modules/grammaire/grammaire.type';

/**
 * La fiche de grammaire est le seul endroit du module qui porte du TEXTE pédagogique, et
 * ce texte est celui des fiches déjà validées de `cours/francais/`. Ce qui est vérifié ici
 * n'est donc pas la formulation, elle a été relue ailleurs, mais deux choses que le
 * typage laisse passer :
 *
 *   - la fiche donne un TEST et pas une définition. « Le verbe sert à décrire une action »
 *     ne permet de reconnaître aucun verbe. Le parti pris est explicite dans les fiches du
 *     cours et se perdrait à la première réécriture bien intentionnée.
 *   - l'exemple est la phrase que l'enfant vient de rater, avec la réponse marquée, et pas
 *     un exemple neuf : lui en donner un autre lui demanderait de refaire deux fois le
 *     chemin, au moment précis où elle est bloquée.
 */

const MOTS = [
  { mot: 'Le', apres: '', colle: false },
  { mot: 'petit', apres: '', colle: false },
  { mot: 'chat', apres: '', colle: false },
  { mot: 'dort', apres: '.', colle: false },
];

const question = (over: Partial<GrammaireQuestion> = {}): GrammaireQuestion => ({
  item_key: 'k',
  type: 'nature_mot',
  skill_key: 'verbe',
  display: 'Quelle est la nature du mot souligné ?',
  mots: MOTS,
  cible: 3,
  choices: ['un verbe', 'un nom commun'],
  answer: 'un verbe',
  answer_indices: [3],
  ...over,
});

const TOUTES: NotionKey[] = [
  'nom_commun',
  'nom_propre',
  'verbe',
  'determinant',
  'adjectif',
  'pronom_sujet',
  'invariable',
  'groupe_nominal',
  'sujet',
  'complement',
];

describe('fiche de grammaire', () => {
  it('rend une fiche complète pour chaque notion', () => {
    for (const skill_key of TOUTES) {
      const fiche = grammaireFiche(question({ skill_key }));
      expect({ skill_key, titre: !!fiche.titre }).toEqual({
        skill_key,
        titre: true,
      });
      expect(fiche.idee.length).toBeGreaterThan(40);
      expect(fiche.regle).toHaveLength(3);
      expect(fiche.piege).toBeTruthy();
      expect(fiche.exemple).toBeTruthy();
    }
  });

  it('donne un test manipulatoire, pas une définition', () => {
    // Le verbe se trouve en changeant le moment, pas en cherchant une action.
    const verbe = grammaireFiche(question({ skill_key: 'verbe' }));
    expect(verbe.regle).toContain("Le mot qui change, c'est le verbe.");

    // Le sujet se trouve en demandant « qui est-ce qui ? », après avoir trouvé le verbe.
    const sujet = grammaireFiche(question({ skill_key: 'sujet' }));
    expect(sujet.regle?.[0]).toBe('Je trouve le verbe.');

    // L'adjectif se reconnaît en l'enlevant.
    const adjectif = grammaireFiche(question({ skill_key: 'adjectif' }));
    expect(adjectif.idee).toContain("on peut l'enlever");
  });

  it('avertit du piège de l’ambiguïté hors contexte', () => {
    const nom = grammaireFiche(question({ skill_key: 'nom_commun' }));
    expect(nom.piege).toContain('la phrase qui décide');
  });

  it('rappelle que le sujet n’est pas toujours devant le verbe', () => {
    const sujet = grammaireFiche(question({ skill_key: 'sujet' }));
    expect(sujet.piege).toContain('Sous la table dort le chat');
  });

  it('est pure : deux appels sur la même question donnent le même texte', () => {
    const lisible = (skill_key: NotionKey) => {
      const fiche = grammaireFiche(question({ skill_key }));
      return [fiche.titre, fiche.idee, ...(fiche.regle ?? []), fiche.piege];
    };
    for (const skill_key of TOUTES) {
      expect(lisible(skill_key)).toEqual(lisible(skill_key));
    }
  });

  it("n'emploie aucun cadratin dans le texte affiché à l'enfant", () => {
    for (const skill_key of TOUTES) {
      const fiche = grammaireFiche(question({ skill_key }));
      for (const texte of [
        fiche.titre,
        fiche.idee,
        ...(fiche.regle ?? []),
        fiche.piege ?? '',
      ]) {
        expect({ skill_key, cadratin: texte.includes('—') }).toEqual({
          skill_key,
          cadratin: false,
        });
      }
    }
  });
});
