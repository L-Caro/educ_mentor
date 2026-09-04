import { describe, expect, it } from 'vitest';
import { accordsGameSpec } from 'src/modules/accords/accords.game';
import { accordsFiche } from 'src/modules/accords/accords.fiche';
import type {
  AccordsQuestion,
  NotionKey,
} from 'src/modules/accords/accords.type';

/**
 * Le descripteur et la fiche.
 *
 * Le moteur dérive le mode de la seule présence de choix : `getChoices` vide = saisie
 * libre. Une question de saisie qui repartirait avec des choix basculerait en QCM
 * silencieusement — et un QCM dont la réponse attendue est « les petits chats » listerait
 * la réponse parmi les propositions.
 */

const qcm = (over: Partial<AccordsQuestion> = {}): AccordsQuestion => ({
  item_key: 'k',
  type: 'accord_sujet_verbe',
  skill_key: 'accord_sujet_verbe',
  display: 'Quelle est la bonne forme du verbe ?',
  depart: null,
  avant: 'Les chats ',
  apres: ' sur le tapis.',
  indice: 'dormir',
  choices: ['dort', 'dorment'],
  answer: 'dorment',
  ...over,
});

const saisie = (over: Partial<AccordsQuestion> = {}): AccordsQuestion => ({
  item_key: 'g',
  type: 'accord_gn',
  skill_key: 'accord_gn',
  display: 'Écris tout le groupe nominal au pluriel.',
  depart: 'le petit chat',
  avant: '',
  apres: '',
  indice: null,
  choices: [],
  answer: 'les petits chats',
  ...over,
});

const TOUTES: NotionKey[] = [
  'genre_nom',
  'nombre_nom',
  'accord_adjectif',
  'accord_gn',
  'accord_sujet_verbe',
];

describe('mode QCM ou saisie', () => {
  it('propose les choix tels quels en QCM', () => {
    expect(accordsGameSpec.qcm!.getChoices(qcm())).toEqual([
      { key: 'dort', label: 'dort' },
      { key: 'dorment', label: 'dorment' },
    ]);
    expect(accordsGameSpec.qcm!.correctKey!(qcm())).toBe('dorment');
  });

  it('ne propose aucun choix sur une question de saisie', () => {
    expect(accordsGameSpec.qcm!.getChoices(saisie())).toEqual([]);
  });
});

describe('validation d’une saisie', () => {
  it('accepte la réponse exacte, refuse une marque manquante', () => {
    expect(accordsGameSpec.free!.isCorrect(saisie(), 'les petits chats')).toBe(true);
    expect(accordsGameSpec.free!.isCorrect(saisie(), 'les petit chats')).toBe(false);
    expect(accordsGameSpec.free!.isCorrect(saisie(), 'le petit chat')).toBe(false);
  });

  it('refuse une réponse sans accent', () => {
    const q = saisie({ answer: 'les écoles', depart: 'l’école' });
    expect(accordsGameSpec.free!.isCorrect(q, 'les ecoles')).toBe(false);
    expect(accordsGameSpec.free!.isCorrect(q, 'les écoles')).toBe(true);
  });

  it('refuse une saisie qui n’est pas une chaîne', () => {
    expect(accordsGameSpec.free!.isCorrect(saisie(), null)).toBe(false);
  });

  it('laisse la place d’un groupe nominal entier, plus courte pour un mot seul', () => {
    const props = accordsGameSpec.free!.inputProps as (
      q: AccordsQuestion,
    ) => { maxLength?: number };
    expect(props(saisie()).maxLength).toBeGreaterThan(props(qcm()).maxLength!);
  });
});

describe('liste d’erreurs de fin de partie', () => {
  it('remplace le trou par des points de suspension, pas par un ⬚', () => {
    const entry = accordsGameSpec.buildResultEntry(qcm(), 'dort', false, false);
    expect(entry.label).toBe('Les chats … sur le tapis.');
    expect(entry.given).toBe('dort');
    expect(entry.expected).toBe('dorment');
  });

  it('garde le point de départ d’une transformation', () => {
    const entry = accordsGameSpec.buildResultEntry(
      saisie(),
      'les petit chats',
      false,
      false,
    );
    expect(entry.label).toBe('le petit chat → …');
  });

  it('rend null quand rien n’a été saisi', () => {
    expect(
      accordsGameSpec.buildResultEntry(saisie(), '   ', false, true).given,
    ).toBeNull();
  });
});

describe('fiche', () => {
  it('rend une fiche complète pour chacun des cinq accords', () => {
    for (const skill_key of TOUTES) {
      const fiche = accordsFiche(saisie({ skill_key }));
      expect({ skill_key, titre: !!fiche.titre }).toEqual({
        skill_key,
        titre: true,
      });
      expect(fiche.idee.length).toBeGreaterThan(40);
      expect(fiche.regle).toBeInstanceOf(Array);
      expect((fiche.regle as string[]).length).toBeGreaterThanOrEqual(2);
      expect(fiche.piege).toBeTruthy();
      expect(fiche.exemple).toBeTruthy();
    }
  });

  it('tient le fil des fiches : un accord se voit, il ne s’entend pas', () => {
    expect(accordsFiche(saisie({ skill_key: 'nombre_nom' })).idee).toContain(
      "ne s'entend presque jamais",
    );
    expect(
      accordsFiche(saisie({ skill_key: 'accord_sujet_verbe' })).idee,
    ).toContain('ne s’écrivent pas pareil'.replace('’', "'"));
  });

  it('donne la règle du pluriel, exceptions comprises', () => {
    const regle = accordsFiche(saisie({ skill_key: 'nombre_nom' })).regle!;
    const texte = Array.isArray(regle) ? regle.join(' ') : regle;
    expect(texte).toContain('-eau');
    expect(texte).toContain('ne changent pas');
  });

  it('est pure : deux appels donnent le même texte', () => {
    const lisible = (skill_key: NotionKey) => {
      const fiche = accordsFiche(saisie({ skill_key }));
      return [
        fiche.titre,
        fiche.idee,
        ...(fiche.regle as string[]),
        fiche.piege,
      ];
    };
    for (const skill_key of TOUTES) {
      expect(lisible(skill_key)).toEqual(lisible(skill_key));
    }
  });
});
