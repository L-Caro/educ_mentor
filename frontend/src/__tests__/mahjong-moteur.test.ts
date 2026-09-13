import { describe, expect, it } from 'vitest';
import {
  PAIRES_PAR_DEFAUT,
  pairesCountDepuisSetup,
  tenterAppariement,
  tirerPaires,
  type TuileJeu,
} from 'src/modules/mahjong/moteur';
import { identifiantFace } from 'src/modules/mahjong/tuiles';

describe('tirerPaires', () => {
  it('tire deux tuiles par paire demandee', () => {
    expect(tirerPaires(12)).toHaveLength(24);
  });

  it('forme des paires : chaque face tiree apparait exactement deux fois', () => {
    const tuiles = tirerPaires(10);
    const occurrences = new Map<string, number>();
    for (const tuile of tuiles) {
      const identifiant = identifiantFace(tuile.face);
      occurrences.set(identifiant, (occurrences.get(identifiant) ?? 0) + 1);
    }
    expect(occurrences.size).toBe(10);
    expect([...occurrences.values()]).toEqual(Array(10).fill(2));
  });

  it('refuse moins d\'une paire', () => {
    expect(() => tirerPaires(0)).toThrow();
  });

  it('refuse plus de paires que de faces disponibles (34)', () => {
    expect(() => tirerPaires(35)).toThrow();
  });

  it('accepte le maximum de 34 paires', () => {
    expect(tirerPaires(34)).toHaveLength(68);
  });
});

describe('pairesCountDepuisSetup', () => {
  it('retombe sur la valeur par defaut si le reglage est absent', () => {
    expect(pairesCountDepuisSetup(undefined)).toBe(PAIRES_PAR_DEFAUT);
  });

  it('retombe sur la valeur par defaut si le reglage est invalide', () => {
    expect(pairesCountDepuisSetup('abc')).toBe(PAIRES_PAR_DEFAUT);
  });

  it('retombe sur la valeur par defaut si le reglage est hors bornes', () => {
    expect(pairesCountDepuisSetup('0')).toBe(PAIRES_PAR_DEFAUT);
    expect(pairesCountDepuisSetup('35')).toBe(PAIRES_PAR_DEFAUT);
  });

  it('lit le reglage quand il est valide', () => {
    expect(pairesCountDepuisSetup('8')).toBe(8);
  });
});

describe('tenterAppariement', () => {
  const memeFace: TuileJeu[] = [
    { id: 'a', face: { famille: 'cercle', valeur: 3 } },
    { id: 'b', face: { famille: 'cercle', valeur: 3 } },
    { id: 'c', face: { famille: 'bambou', valeur: 5 } },
  ];
  const memeIdentifiant = (tuileA: TuileJeu, tuileB: TuileJeu) =>
    identifiantFace(tuileA.face) === identifiantFace(tuileB.face);

  it('retire les deux tuiles quand elles forment une paire', () => {
    const resultat = tenterAppariement(memeFace, 'a', 'b', memeIdentifiant);
    expect(resultat.reussi).toBe(true);
    expect(resultat.tuiles).toEqual([memeFace[2]]);
  });

  it('ne change rien quand les deux tuiles ne correspondent pas', () => {
    const resultat = tenterAppariement(memeFace, 'a', 'c', memeIdentifiant);
    expect(resultat.reussi).toBe(false);
    expect(resultat.tuiles).toBe(memeFace);
  });

  it('ne change rien pour un identifiant inconnu', () => {
    const resultat = tenterAppariement(memeFace, 'a', 'inconnu', memeIdentifiant);
    expect(resultat.reussi).toBe(false);
    expect(resultat.tuiles).toBe(memeFace);
  });

  it("ne change rien quand c'est deux fois la meme tuile", () => {
    const resultat = tenterAppariement(memeFace, 'a', 'a', memeIdentifiant);
    expect(resultat.reussi).toBe(false);
    expect(resultat.tuiles).toBe(memeFace);
  });
});
