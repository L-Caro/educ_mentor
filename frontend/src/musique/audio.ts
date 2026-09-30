/**
 * Le son : le métronome, les notes, les fûts de la batterie.
 *
 * ── Deux choses à savoir avant de lire ───────────────────────────────────────────────
 *
 * 1. Le son ne démarre qu'après un GESTE de l'enfant. Les navigateurs refusent d'ouvrir
 *    le haut-parleur tout seuls, et c'est une bonne règle : une page qui se met à sonner
 *    sans qu'on ait rien demandé est une nuisance. D'où `reveiller()`, à appeler depuis
 *    le bouton qui lance l'exercice, et pas ailleurs.
 *
 * 2. Un métronome écrit naïvement DÉRIVE, et ça s'entend au bout de vingt secondes. Un
 *    `setInterval` de cinq cents millisecondes n'en fait jamais exactement cinq cents :
 *    il attend que le navigateur ait fini ce qu'il faisait, les retards s'additionnent, et
 *    le battement part en biais. La carte son, elle, a une horloge exacte.
 *
 *    On écrit donc à l'avance : toutes les vingt-cinq millisecondes, on regarde ce qui
 *    doit sonner dans les cent prochaines, et on le PROGRAMME à sa date exacte. Le
 *    navigateur peut bien être en retard, il l'est sur la prise de rendez-vous, jamais sur
 *    le rendez-vous.
 */

/** Tous les combien on regarde ce qu'il y a à programmer. */
const REGARD_MS = 25;
/** Jusqu'où on regarde devant. Confortablement plus que le pas de regard, pour qu'un
 * hoquet du navigateur ne fasse pas manquer un battement. */
const AVANCE_S = 0.12;

let contexte: AudioContext | null = null;
let bruit: AudioBuffer | null = null;

/** Au-delà, on considère que le haut-parleur ne s'ouvrira pas. */
const PATIENCE_MS = 1500;

/**
 * Ouvre le haut-parleur. À appeler DEPUIS un geste de l'enfant, jamais au chargement.
 *
 * Rend `null` si le navigateur ne veut pas : un exercice sonore doit alors se taire
 * poliment, pas tomber en panne.
 *
 * ── Pourquoi une limite de temps ─────────────────────────────────────────────────────
 *
 * `resume()` ne rend pas toujours la main. Sur une machine sans sortie audio, la promesse
 * ne se résout ni ne se rejette : elle attend, indéfiniment. Sans cette limite, l'écran
 * resterait sur « C'est parti » pour toujours, sans un mot, et personne ne saurait
 * pourquoi. Constaté ici même, sur un navigateur sans carte son.
 */
export async function reveiller(): Promise<AudioContext | null> {
  try {
    contexte ??= new AudioContext();
    if (contexte.state === 'suspended') {
      const abandon = new Promise<'trop long'>((ok) =>
        setTimeout(() => ok('trop long'), PATIENCE_MS),
      );
      const issue = await Promise.race([contexte.resume(), abandon]);
      // TypeScript a figé le type de `state` à sa valeur d'avant l'attente ; il a pu
      // changer pendant, c'est tout l'objet de l'appel.
      const etat = contexte.state as AudioContextState;
      if (issue === 'trop long' && etat !== 'running') return null;
    }
    bruit ??= fabriquerBruit(contexte);
    return contexte;
  } catch {
    return null;
  }
}

export function contexteAudio(): AudioContext | null {
  return contexte;
}

/** L'heure de la carte son. C'est la seule qui compte pour juger une frappe : celle du
 * navigateur et celle du son ne sont pas la même horloge. */
export function maintenant(): number {
  return contexte?.currentTime ?? 0;
}

/** Une seconde de bruit blanc, fabriquée une fois. C'est la matière première de la caisse
 * claire et des cymbales : un choc, c'est du bruit qu'on filtre et qu'on éteint vite. */
function fabriquerBruit(ctx: AudioContext): AudioBuffer {
  const tampon = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const canal = tampon.getChannelData(0);
  for (let i = 0; i < canal.length; i++) canal[i] = Math.random() * 2 - 1;
  return tampon;
}

/** Une enveloppe qui monte vite et s'éteint : sans elle, chaque note claque au début et
 * à la fin, et le claquement s'entend plus que la note. */
function enveloppe(
  ctx: AudioContext,
  quand: number,
  duree: number,
  volume: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, quand);
  gain.gain.linearRampToValueAtTime(volume, quand + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, quand + duree);
  gain.connect(ctx.destination);
  return gain;
}

/** Le clic du métronome. Le premier temps de la mesure sonne plus haut : c'est ce qui
 * permet de savoir OÙ l'on est dans la mesure, et pas seulement qu'il y a un battement. */
export function jouerClic(quand: number, fort: boolean): void {
  const ctx = contexte;
  if (!ctx) return;
  const oscillateur = ctx.createOscillator();
  oscillateur.frequency.value = fort ? 1600 : 900;
  oscillateur.connect(enveloppe(ctx, quand, 0.05, fort ? 0.35 : 0.22));
  oscillateur.start(quand);
  oscillateur.stop(quand + 0.06);
}

/**
 * Les timbres disponibles.
 *
 * Plusieurs, et c'est délibéré : reconnaître que ça monte sur UN seul son finit par se
 * jouer de mémoire plutôt qu'à l'oreille. Changer de couleur oblige à réécouter.
 * `sine` est douce mais pâle sur un haut-parleur de tablette, `triangle` porte mieux,
 * `cloche` ajoute une octave par-dessus et sonne comme un carillon.
 */
export const TIMBRES = ['triangle', 'sine', 'cloche'] as const;
export type Timbre = (typeof TIMBRES)[number];

/** Une note tenue. */
export function jouerNote(
  frequenceHz: number,
  quand: number,
  duree = 0.6,
  timbre: Timbre = 'triangle',
): void {
  const ctx = contexte;
  if (!ctx) return;
  const oscillateur = ctx.createOscillator();
  oscillateur.type = timbre === 'sine' ? 'sine' : 'triangle';
  oscillateur.frequency.value = frequenceHz;
  oscillateur.connect(
    enveloppe(ctx, quand, duree, timbre === 'sine' ? 0.34 : 0.3),
  );
  oscillateur.start(quand);
  oscillateur.stop(quand + duree + 0.05);

  if (timbre === 'cloche') {
    // L'octave au-dessus, discrète : c'est ce qui fait la couleur d'un carillon, et cela
    // ne change PAS la hauteur perçue, donc la réponse reste la même.
    const harmonique = ctx.createOscillator();
    harmonique.type = 'sine';
    harmonique.frequency.value = frequenceHz * 2;
    harmonique.connect(enveloppe(ctx, quand, duree * 0.7, 0.1));
    harmonique.start(quand);
    harmonique.stop(quand + duree);
  }
}

export type Fut = 'grosse' | 'claire' | 'charleston' | 'cymbale';

/**
 * Un fût de batterie, fabriqué de toutes pièces.
 *
 * Pas d'échantillons : quatre sons enregistrés pèseraient plus que tout le reste de
 * l'application, pour un exercice où ce qui compte est de savoir QUAND ça tombe, pas la
 * couleur du fût. La grosse caisse est une sinusoïde qui plonge, les autres sont du bruit
 * filtré : c'est très exactement ce qu'ils sont physiquement.
 */
export function jouerFut(fut: Fut, quand: number): void {
  const ctx = contexte;
  if (!ctx || !bruit) return;

  if (fut === 'grosse') {
    const oscillateur = ctx.createOscillator();
    oscillateur.frequency.setValueAtTime(150, quand);
    oscillateur.frequency.exponentialRampToValueAtTime(45, quand + 0.12);
    oscillateur.connect(enveloppe(ctx, quand, 0.22, 0.85));
    oscillateur.start(quand);
    oscillateur.stop(quand + 0.3);
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = bruit;
  const filtre = ctx.createBiquadFilter();
  filtre.type = 'highpass';

  const reglages: Record<Exclude<Fut, 'grosse'>, [number, number, number]> = {
    // coupure, durée, volume
    claire: [1200, 0.18, 0.5],
    charleston: [7000, 0.05, 0.3],
    cymbale: [4000, 0.8, 0.35],
  };
  const [coupure, duree, volume] = reglages[fut];
  filtre.frequency.value = coupure;
  source.connect(filtre);
  filtre.connect(enveloppe(ctx, quand, duree, volume));
  source.start(quand);
  source.stop(quand + duree + 0.05);

  if (fut === 'claire') {
    // Un peu de corps sous le bruit : une caisse claire n'est pas qu'un chuintement, sa
    // peau sonne. Sans ça elle se confond avec le charleston.
    const corps = ctx.createOscillator();
    corps.frequency.value = 190;
    corps.connect(enveloppe(ctx, quand, 0.12, 0.3));
    corps.start(quand);
    corps.stop(quand + 0.2);
  }
}

// ─── Le métronome ────────────────────────────────────────────────────────────

export interface Battement {
  /** Son rang depuis le départ, décompte compris : négatif pendant le décompte. */
  rang: number;
  /** Son rang dans la mesure, à partir de zéro. */
  dansLaMesure: number;
  /** L'heure de la carte son à laquelle il sonne. */
  quand: number;
  premier: boolean;
}

export interface ReglagesMetronome {
  tempo: number;
  parMesure: number;
  /** Combien de battements de préparation avant le vrai départ. Sans eux, l'enfant entre
   * en route : elle n'a pas le temps de sentir la pulsation avant de devoir jouer. */
  decompte?: number;
  /** Appelé au moment où le battement SONNE, pas au moment où il est programmé. */
  sur?: (battement: Battement) => void;
  /** Ce qu'on joue à chaque battement. Muet pendant un exercice où c'est elle qui donne
   * le rythme, sauf pendant le décompte. */
  silencieuxApresDecompte?: boolean;
}

/**
 * Le métronome, et l'horloge de tous les exercices de rythme.
 *
 * `depart` est l'heure exacte du premier battement utile, celui qui suit le décompte.
 * C'est la référence par rapport à laquelle une frappe est jugée : sans elle, on ne sait
 * pas ce que « à l'heure » veut dire.
 */
export class Metronome {
  private minuteur: number | null = null;
  private image = 0;
  private file: Battement[] = [];
  private prochain = 0;
  private rang = 0;
  private reglages: ReglagesMetronome | null = null;
  /** L'heure du battement zéro, après le décompte. */
  depart = 0;

  demarrer(reglages: ReglagesMetronome): void {
    const ctx = contexte;
    if (!ctx) return;
    this.arreter();
    this.reglages = reglages;
    const decompte = reglages.decompte ?? 0;
    this.rang = -decompte;
    // Un court délai avant le premier clic : programmer dans l'instant même donne un
    // premier battement écrasé, la carte son n'ayant pas le temps de s'y préparer.
    this.prochain = ctx.currentTime + 0.15;
    this.depart = this.prochain + decompte * (60 / reglages.tempo);

    this.minuteur = window.setInterval(() => this.programmer(), REGARD_MS);
    this.programmer();
    this.image = requestAnimationFrame(() => this.vider());
  }

  arreter(): void {
    if (this.minuteur !== null) window.clearInterval(this.minuteur);
    cancelAnimationFrame(this.image);
    this.minuteur = null;
    this.file = [];
    this.reglages = null;
  }

  /** Écrit à l'avance tout ce qui doit sonner dans la fenêtre qui vient. */
  private programmer(): void {
    const ctx = contexte;
    const reglages = this.reglages;
    if (!ctx || !reglages) return;
    const pas = 60 / reglages.tempo;

    while (this.prochain < ctx.currentTime + AVANCE_S) {
      const dansLaMesure =
        ((this.rang % reglages.parMesure) + reglages.parMesure) %
        reglages.parMesure;
      const battement: Battement = {
        rang: this.rang,
        dansLaMesure,
        quand: this.prochain,
        premier: dansLaMesure === 0,
      };
      const pendantDecompte = this.rang < 0;
      if (pendantDecompte || !reglages.silencieuxApresDecompte) {
        jouerClic(this.prochain, battement.premier || pendantDecompte);
      }
      this.file.push(battement);
      this.prochain += pas;
      this.rang++;
    }
  }

  /** Rend les battements à l'écran QUAND ils sonnent. Programmés cent millisecondes à
   * l'avance, les signaler à ce moment-là ferait clignoter l'écran avant le son. */
  private vider(): void {
    const ctx = contexte;
    if (!ctx || !this.reglages) return;
    while (this.file.length > 0 && this.file[0].quand <= ctx.currentTime) {
      this.reglages.sur?.(this.file.shift()!);
    }
    this.image = requestAnimationFrame(() => this.vider());
  }
}
