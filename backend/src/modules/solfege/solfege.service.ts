import { Injectable } from '@nestjs/common';
import {
  NOTES,
  ORDRE_FIGURES,
  hauteurDe,
  nomDe,
  nomDeFigure,
  positionsPermises,
  remplirPhrase,
  syllabes,
  type Cle,
  type Evenement,
  type Figure,
} from './solfege.logic';

/** Ce que l'adulte a réglé sur la page de composition, une fois nettoyé. */
export interface ReglagesFeuille {
  cles: Cle[];
  etendue: number;
  figures: Figure[];
  mesure: number;
}

/** Combien de notes sur une ligne de lecture. Huit tient dans la largeur d'une page et
 * fait une vraie ligne de lecture ; au-delà, les notes se serrent et l'exercice devient
 * un exercice de vue. */
const NOTES_PAR_LIGNE = 8;

/** La longueur d'une ligne de rythme, en temps. */
const TEMPS_PAR_LIGNE = 8;

/**
 * Le solfège sur le papier.
 *
 * Aucune séance, aucune progression : ce service ne sait que COMPOSER. C'est la même
 * décision que pour tous les modules imprimables, et pour la même raison : ce qui est
 * fait sur papier n'est pas mesuré, personne ne ressaisira les résultats.
 *
 * Le module de jeu, lui, vit entièrement dans le navigateur : il n'appelle jamais ce
 * service. Les deux partagent des faits musicaux, pas du code (voir `solfege.logic.ts`).
 */
@Injectable()
export class SolfegeService {
  /** Une ligne de notes à nommer : l'exercice de papier le plus classique qui soit. */
  lireDesNotes(reglages: ReglagesFeuille): {
    cle: Cle;
    positions: number[];
    reponses: string[];
  } {
    const cle = this.tirer(reglages.cles);
    const permises = positionsPermises(reglages.etendue);
    const positions = Array.from({ length: NOTES_PAR_LIGNE }, () =>
      this.tirer(permises),
    );
    return {
      cle,
      positions,
      reponses: positions.map((p) => nomDe(hauteurDe(p, cle))),
    };
  }

  /**
   * Des notes à DESSINER sur une portée vide.
   *
   * L'inverse du précédent, et ce n'est pas la même chose : nommer une note qu'on voit
   * demande de lire, la placer demande de savoir compter les cases dans l'autre sens.
   * C'est là que se voit si la clé est comprise ou seulement mémorisée.
   */
  placerDesNotes(reglages: ReglagesFeuille): {
    cle: Cle;
    notes: string[];
    positions: number[];
  } {
    const cle = this.tirer(reglages.cles);
    const permises = positionsPermises(reglages.etendue);
    // On tire des POSITIONS et on en déduit les noms : l'inverse pourrait demander une
    // note qui n'a aucune place dans l'étendue ouverte.
    const positions = Array.from({ length: 6 }, () => this.tirer(permises));
    return {
      cle,
      positions,
      notes: positions.map((p) => nomDe(hauteurDe(p, cle))),
    };
  }

  /** Une figure ou un silence à nommer. */
  nommerUneFigure(reglages: ReglagesFeuille): {
    figure: Figure;
    silence: boolean;
    reponse: string;
  } {
    const figure = this.tirer(reglages.figures);
    const silence = this.rand(0, 1) === 1;
    return { figure, silence, reponse: nomDeFigure(figure, silence) };
  }

  /**
   * Un rythme, sous lequel écrire les syllabes de sa méthode.
   *
   * C'est exactement son devoir : elle écrit Taé et Aé sous chaque figure avant de
   * frapper. Le corrigé rend les syllabes attendues, une par temps.
   */
  ecrireLesSyllabes(reglages: ReglagesFeuille): {
    evenements: Evenement[];
    barres: number[];
    mesure: number;
    reponses: string[];
  } {
    const { evenements, barres } = remplirPhrase(
      reglages.figures,
      reglages.mesure,
      TEMPS_PAR_LIGNE,
      this.rand,
    );
    return {
      evenements,
      barres,
      mesure: reglages.mesure,
      reponses: evenements.map(syllabes),
    };
  }

  /** Une mesure amputée d'une figure, à compléter au crayon. */
  completerUneMesure(reglages: ReglagesFeuille): {
    evenements: Evenement[];
    mesure: number;
    reponse: string;
  } {
    const { evenements } = remplirPhrase(
      reglages.figures,
      reglages.mesure,
      reglages.mesure,
      this.rand,
    );
    const rang = this.rand(0, evenements.length - 1);
    const manquante = evenements[rang];
    return {
      evenements: evenements.filter((_, i) => i !== rang),
      mesure: reglages.mesure,
      reponse: nomDeFigure(manquante.figure, manquante.silence),
    };
  }

  /** Les réglages bruts de la page de composition, ramenés à quelque chose d'utilisable. */
  normaliser(options: Record<string, unknown> | undefined): ReglagesFeuille {
    // `String()` sur une valeur inconnue rendrait « [object Object] » si la page envoyait
    // autre chose qu'un texte : on ne lit que ce qui EST un texte, et on retombe sur la
    // clé de sol sinon.
    const cle = typeof options?.cle === 'string' ? options.cle : 'sol';
    const figures = Array.isArray(options?.figures)
      ? (options.figures as string[]).filter((f): f is Figure =>
          (ORDRE_FIGURES as readonly string[]).includes(f),
        )
      : [];
    return {
      cles:
        cle === 'fa' ? ['fa'] : cle === 'les-deux' ? ['sol', 'fa'] : ['sol'],
      etendue: Math.min(2, Math.max(0, Number(options?.etendue ?? 0) || 0)),
      // Jamais vide : une feuille sans figure au programme ne produirait rien, et la
      // ligne disparaîtrait sans que personne sache pourquoi.
      figures: figures.length > 0 ? figures : ['blanche', 'noire'],
      mesure: [2, 3, 4].includes(Number(options?.mesure))
        ? Number(options?.mesure)
        : 2,
    };
  }

  private rand = (min: number, max: number): number =>
    min + Math.floor(Math.random() * (max - min + 1));

  private tirer<T>(liste: readonly T[]): T {
    return liste[this.rand(0, liste.length - 1)];
  }
}

export { NOTES };
