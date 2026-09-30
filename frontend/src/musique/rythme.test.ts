import { describe, expect, it } from 'vitest';
import { degre, type Evenement } from './solfege';
import {
  dureeDuTemps,
  frappesAttendues,
  frequence,
  noterFrappes,
} from './rythme';

const noire: Evenement = { figure: 'noire', silence: false };
const soupir: Evenement = { figure: 'noire', silence: true };

describe('quand il faut frapper', () => {
  it('convertit les temps en secondes selon le tempo', () => {
    expect(dureeDuTemps(60)).toBe(1);
    expect(dureeDuTemps(120)).toBe(0.5);
  });

  it('ne fait PAS frapper les silences', () => {
    // C'est tout leur intérêt, et l'erreur la plus fréquente est de les frapper quand
    // même : un exercice qui les attendrait ne servirait à rien.
    expect(frappesAttendues([noire, soupir, noire, noire], 60)).toEqual([
      0, 2, 3,
    ]);
  });

  it('suit le tempo', () => {
    expect(frappesAttendues([noire, noire], 120)).toEqual([0, 0.5]);
  });
});

describe('juger les frappes', () => {
  it('accepte un petit décalage et refuse un gros', () => {
    const bilan = noterFrappes([0, 1, 2], [0.05, 1.3, 2.02], 60);
    expect(bilan.jugements.map((j) => j.verdict)).toEqual([
      'juste',
      'retard',
      'juste',
    ]);
    expect(bilan.justes).toBe(2);
  });

  it('distingue l’avance du retard', () => {
    const bilan = noterFrappes([1], [0.65], 60);
    expect(bilan.jugements[0].verdict).toBe('avance');
    expect(bilan.jugements[0].ecart).toBeCloseTo(-0.35);
  });

  it('compte une note manquée sans rien lui rattacher', () => {
    const bilan = noterFrappes([0, 1, 2], [0, 2], 60);
    expect(bilan.jugements[1].verdict).toBe('manquee');
    expect(bilan.jugements[1].ecart).toBeNull();
    expect(bilan.superflues).toBe(0);
  });

  it('compte les frappes qui ne tombent sur rien', () => {
    // Elle a tapé pendant un silence : ça ne doit pas passer inaperçu.
    const bilan = noterFrappes([0, 2], [0, 1, 2], 60);
    expect(bilan.superflues).toBe(1);
    expect(bilan.justes).toBe(2);
  });

  it('DONNE LA FRAPPE À LA BONNE CROCHE, pas à la première venue', () => {
    // Deux croches sont séparées d'un demi-temps, soit la largeur de la fenêtre : une
    // frappe entre les deux est à portée des deux. Prise dans l'ordre, elle irait à la
    // première et la seconde passerait pour manquée. À 0,45 s, c'est visiblement la
    // seconde croche jouée cinquante millisecondes trop tôt, et la première qui manque.
    const bilan = noterFrappes([0, 0.5], [0.45], 60);
    expect(bilan.jugements.map((j) => j.verdict)).toEqual(['manquee', 'juste']);
    expect(bilan.jugements[1].ecart).toBeCloseTo(-0.05);
  });

  it('n’oublie aucune note quand une seule manque au milieu', () => {
    const bilan = noterFrappes([0, 1, 2, 3], [0, 2, 3], 60);
    expect(bilan.jugements.map((j) => j.verdict)).toEqual([
      'juste',
      'manquee',
      'juste',
      'juste',
    ]);
    expect(bilan.superflues).toBe(0);
  });

  it('serre la tolérance quand le tempo accélère', () => {
    // Un dixième de seconde passe à 60, mais à 180 le temps ne dure qu'un tiers de
    // seconde : le même décalage s'entend franchement.
    expect(noterFrappes([0], [0.1], 60).jugements[0].verdict).toBe('juste');
    expect(noterFrappes([0], [0.1], 180).jugements[0].verdict).toBe('retard');
  });
});

describe('les hauteurs', () => {
  it('donne 440 hertz au la du diapason', () => {
    expect(frequence(degre(4, 5))).toBeCloseTo(440, 6);
  });

  it('double à chaque octave', () => {
    expect(frequence(degre(5, 0))).toBeCloseTo(frequence(degre(4, 0)) * 2, 6);
  });

  it('ne met qu’un demi-ton entre mi et fa', () => {
    // L'échelle n'est pas régulière, et c'est cette irrégularité qui fait la musique.
    const unDemiTon = Math.pow(2, 1 / 12);
    expect(frequence(degre(4, 3)) / frequence(degre(4, 2))).toBeCloseTo(
      unDemiTon,
      6,
    );
    // Alors qu'il y en a deux entre do et ré.
    expect(frequence(degre(4, 1)) / frequence(degre(4, 0))).toBeCloseTo(
      unDemiTon ** 2,
      6,
    );
  });
});
