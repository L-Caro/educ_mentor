/**
 * Le rythme : quand une note doit tomber, et si elle est tombée à l'heure.
 *
 * Tout est en SECONDES ici, alors que le solfège compte en temps. La conversion tient en
 * une ligne et dépend du tempo : c'est justement ce qu'un métronome fait.
 */

import { instants, type Evenement } from './solfege';

/** Combien de secondes dure un temps, à ce tempo. 60 pulsations par minute, une seconde
 * par temps : c'est la définition. */
export function dureeDuTemps(tempo: number): number {
  return 60 / tempo;
}

/** Les instants, en secondes, où l'enfant doit frapper. Les silences ne se frappent pas :
 * c'est tout leur intérêt, et l'erreur la plus fréquente est de les frapper quand même. */
export function frappesAttendues(
  evenements: Evenement[],
  tempo: number,
): number[] {
  const debuts = instants(evenements);
  return debuts
    .filter((_, i) => !evenements[i].silence)
    .map((temps) => temps * dureeDuTemps(tempo));
}

/**
 * Jusqu'où une frappe compte comme juste, en fraction de temps.
 *
 * Un cinquième de temps, c'est une centaine de millisecondes à tempo modéré : au-delà,
 * l'oreille entend franchement le décalage. Plus sévère, on refuserait des frappes qui
 * sonnent justes ; plus laxiste, on validerait un rythme qui boite.
 */
export const TOLERANCE_JUSTE = 0.2;

/** Au-delà de cette distance, la frappe ne se rattache plus à cette note : elle appartient
 * à une autre, ou à rien. */
export const TOLERANCE_RATTACHEE = 0.5;

export type Verdict = 'juste' | 'avance' | 'retard' | 'manquee';

export interface Jugement {
  /** L'instant attendu, en secondes depuis le départ. */
  attendu: number;
  /** L'écart en secondes : négatif en avance, positif en retard. `null` si rien n'est venu. */
  ecart: number | null;
  verdict: Verdict;
}

export interface Bilan {
  jugements: Jugement[];
  /** Les frappes qui ne se rattachent à aucune note : elle a tapé où il n'y avait rien. */
  superflues: number;
  justes: number;
  total: number;
}

/**
 * Rapproche ce qu'elle a frappé de ce qu'il fallait frapper.
 *
 * ── Pourquoi pas dans l'ordre ────────────────────────────────────────────────────────
 *
 * On pourrait parcourir les notes une à une et prendre la première frappe à portée. Tant
 * que les notes sont espacées d'un temps entier, cela revient au même : la fenêtre fait
 * un demi-temps de chaque côté, donc deux notes ne se disputent jamais une frappe.
 *
 * Dès les CROCHES, elles se touchent. Deux croches sont séparées d'un demi-temps, soit
 * exactement la largeur de la fenêtre : une frappe posée entre les deux est à portée des
 * deux. Prise dans l'ordre, elle irait à la première, alors qu'une frappe à peine avant
 * la seconde croche est visiblement la seconde, jouée un peu tôt.
 *
 * On classe donc TOUTES les paires possibles par écart croissant, et on marie d'abord les
 * plus évidentes. Chaque frappe et chaque note ne servent qu'une fois. Ce qui reste sans
 * partenaire est vraiment sans partenaire.
 */
export function noterFrappes(
  attendus: number[],
  frappes: number[],
  tempo: number,
): Bilan {
  const temps = dureeDuTemps(tempo);
  const limite = TOLERANCE_RATTACHEE * temps;

  const paires: { note: number; frappe: number; ecart: number }[] = [];
  attendus.forEach((attendu, note) => {
    frappes.forEach((frappe, index) => {
      const ecart = frappe - attendu;
      if (Math.abs(ecart) <= limite)
        paires.push({ note, frappe: index, ecart });
    });
  });
  paires.sort((a, b) => Math.abs(a.ecart) - Math.abs(b.ecart));

  const prisesNotes = new Map<number, number>();
  const prisesFrappes = new Set<number>();
  for (const paire of paires) {
    if (prisesNotes.has(paire.note) || prisesFrappes.has(paire.frappe))
      continue;
    prisesNotes.set(paire.note, paire.ecart);
    prisesFrappes.add(paire.frappe);
  }

  const jugements: Jugement[] = attendus.map((attendu, note) => {
    const ecart = prisesNotes.get(note);
    if (ecart === undefined) {
      return { attendu, ecart: null, verdict: 'manquee' };
    }
    if (Math.abs(ecart) <= TOLERANCE_JUSTE * temps) {
      return { attendu, ecart, verdict: 'juste' };
    }
    return { attendu, ecart, verdict: ecart < 0 ? 'avance' : 'retard' };
  });

  return {
    jugements,
    superflues: frappes.length - prisesFrappes.size,
    justes: jugements.filter((j) => j.verdict === 'juste').length,
    total: attendus.length,
  };
}

// ─── Les hauteurs, en hertz ──────────────────────────────────────────────────

/** Combien de demi-tons séparent chaque degré de la gamme du do qui la commence.
 * L'échelle n'est pas régulière : il n'y a qu'un demi-ton entre mi et fa, et entre si et
 * do. C'est cette irrégularité qui fait la musique, et c'est ce tableau qui la porte. */
const DEMI_TONS = [0, 2, 4, 5, 7, 9, 11];

/**
 * La fréquence d'un degré, en hertz.
 *
 * Le la du diapason vaut 440 hertz, et chaque demi-tons multiplie par la racine douzième
 * de deux : monter d'une octave, c'est doubler.
 */
export function frequence(hauteur: number): number {
  const octave = Math.floor(hauteur / 7);
  const rang = ((hauteur % 7) + 7) % 7;
  const midi = 12 * (octave + 1) + DEMI_TONS[rang];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
