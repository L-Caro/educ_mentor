import { describe, expect, it } from 'vitest';
import { franceFiche } from 'src/modules/france/france.fiche';
import type { FranceCarte, FranceQuestion } from 'src/modules/france/france.type';

const carte = (over: Partial<FranceCarte> = {}): FranceCarte => ({
  kind: 'departement',
  titre: 'Rhône',
  numero: '69',
  lignes: [
    { label: 'Préfecture', valeur: 'Lyon' },
    { label: 'Région', valeur: 'Auvergne-Rhône-Alpes' },
    { label: 'Voisins', valeur: 'Ain, Loire, Isère' },
  ],
  ...over,
});

const q = (over: Partial<FranceQuestion> = {}): FranceQuestion => ({
  type: 'dept_to_prefecture',
  item_key: 'dept_pref_69',
  prompt: 'Quelle est la préfecture du Rhône ?',
  display: 'Rhône',
  choices: [],
  answer: 'Lyon',
  answers: null,
  carte: carte(),
  ...over,
});

describe('fiche France', () => {
  it("ne répète pas le numéro dans le titre, la carte l'affiche déjà en pastille", () => {
    expect(franceFiche(q())!.titre).toBe('Rhône');
  });

  it("n'existe pas pour un sujet qui n'est ni département ni région", () => {
    // Un massif ou un fleuve traverse plusieurs départements : aucune carte ne s'impose.
    expect(franceFiche(q({ carte: null }))).toBeNull();
  });

  it("distingue l'idée d'un département de celle d'une région", () => {
    expect(franceFiche(q())!.idee).toContain('département se retient');
    expect(franceFiche(q({ carte: carte({ kind: 'region', numero: undefined }) }))!.idee)
      .toContain('chef-lieu');
  });

  it('reste la même fiche quel que soit le type de question sur ce département', () => {
    const parPref = franceFiche(q({ type: 'dept_to_prefecture' }))!;
    const parRegion = franceFiche(q({ type: 'dept_to_region', item_key: 'dept_region_69' }))!;
    expect(parPref.titre).toBe(parRegion.titre);
    expect(parPref.idee).toBe(parRegion.idee);
  });

  it("n'énonce pas de règle : la géographie est faite de faits", () => {
    expect(franceFiche(q())!.regle).toBeUndefined();
    expect(franceFiche(q())!.exemple).toBeDefined();
  });
});
