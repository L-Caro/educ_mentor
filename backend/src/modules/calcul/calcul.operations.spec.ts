import {
  DEFAULT_ACTIVE_OPERATIONS,
  OPERATIONS,
  OPERATION_KEYS,
  getOperation,
  isOperationType,
} from './calcul.operations';
import { NIVEAUX } from '../../common/niveau';

describe('catalogue des calculs', () => {
  it('va du CP au CM2', () => {
    const niveaux = new Set(OPERATIONS.map((o) => o.niveau));
    expect(niveaux.has('cp')).toBe(true);
    expect(niveaux.has('cm1')).toBe(true);
    for (const operation of OPERATIONS) {
      expect(NIVEAUX).toContain(operation.niveau);
    }
  });

  it('monte dans l’ordre du programme', () => {
    const rangs = OPERATIONS.map((o) => NIVEAUX.indexOf(o.niveau));
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
  });

  it('n’ouvre que l’additif à l’installation', () => {
    expect(DEFAULT_ACTIVE_OPERATIONS.sort()).toEqual(
      ['addition', 'complement', 'double', 'moitie', 'soustraction'].sort(),
    );
    // Rien de multiplicatif : ça s'ouvre au CE2, depuis l'administration.
    expect(DEFAULT_ACTIVE_OPERATIONS).not.toContain('multiplication');
    expect(DEFAULT_ACTIVE_OPERATIONS).not.toContain('division');
  });

  it('borne le multiplicatif par ses tables, pas par la valeur maximale', () => {
    // `calcul_max_value` vaut 20 par défaut : bornées par elle, seules 2×2 à 4×5
    // passeraient, et la table de 7 ne sortirait jamais.
    for (const key of [
      'multiplication',
      'division',
      'multiplier_10',
      'diviser_10',
      'complement_100',
    ] as const) {
      expect(getOperation(key).borne).toBe('tables');
    }
    for (const key of ['addition', 'soustraction', 'complement'] as const) {
      expect(getOperation(key).borne).toBe('valeur');
    }
  });

  it('donne un exemple chiffré à chaque type', () => {
    // « 65 pour aller à 100 » n'a ni ? ni = et reste un exemple parfaitement clair : ce
    // qu'on exige, c'est qu'il montre des nombres, pas qu'il suive une forme.
    for (const operation of OPERATIONS) {
      expect({
        key: operation.key,
        chiffre: /\d/.test(operation.exemple),
      }).toEqual({
        key: operation.key,
        chiffre: true,
      });
    }
  });

  it('reconnaît ses clés et rejette les autres', () => {
    for (const key of OPERATION_KEYS) expect(isOperationType(key)).toBe(true);
    expect(isOperationType('racine_carree')).toBe(false);
    expect(isOperationType(null)).toBe(false);
    expect(() => getOperation('puissance' as never)).toThrow(/inconnu/);
  });
});
