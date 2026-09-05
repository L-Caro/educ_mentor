import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { CatalogService } from '../catalog/catalog.service';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import { AccordsService } from '../accords/accords.service';
import {
  CLE_NOMBRE_QUESTIONS,
  MAXIMUM_QUESTIONS,
  MODULES_DE_PEAGE,
  type PeageQuestion,
} from './peage.types';

/** Toujours quatre propositions : le péage se franchit d'une touche, et deux choix
 * laisseraient passer une pièce jetée en l'air une fois sur deux. */
const DIFFICULTE = 'medium' as const;

/**
 * Le péage des jeux : une ou plusieurs questions à résoudre avant d'ouvrir un plateau.
 *
 * Rien n'est ENREGISTRÉ ici, ni séance, ni progression. C'est délibéré, et pour deux
 * raisons. La première est comptable : une question posée à la porte d'un morpion n'est
 * pas une séance de travail, et la voir apparaître dans « séances récentes » brouillerait
 * ce que l'adulte y lit. La seconde est plus juste : une réponse donnée pour avoir le
 * droit de jouer ne dit pas grand-chose de ce qui est su. La compter dans la maîtrise
 * ferait mentir la progression.
 *
 * C'est pour ça que les cinq services ont une `construireQuestions` séparée de leur
 * `startSession` : on emprunte leur savoir-faire sans emprunter leurs effets.
 */
@Injectable()
export class PeageService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly catalogService: CatalogService,
    private readonly tablesService: TablesService,
    private readonly calculService: CalculService,
    private readonly conjugaisonService: ConjugaisonService,
    private readonly grammaireService: GrammaireService,
    private readonly accordsService: AccordsService,
  ) {}

  /** Combien de questions avant de jouer. `0` = pas de péage.
   *
   * Borné : une valeur aberrante écrite à la main en base ne doit pas transformer une
   * partie de morpion en interrogation écrite. */
  async nombreDeQuestions(): Promise<number> {
    const brut = parseInt(
      (await this.settingsService.get(CLE_NOMBRE_QUESTIONS)) ?? '0',
      10,
    );
    if (Number.isNaN(brut) || brut <= 0) return 0;
    return Math.min(MAXIMUM_QUESTIONS, brut);
  }

  /** Les modules qui peuvent alimenter le péage ICI ET MAINTENANT : parmi les cinq, ceux
   * que l'adulte a activés. Poser une question de conjugaison alors que le module est
   * éteint contournerait le seul réglage qui décide de ce que l'enfant voit. */
  async modulesDisponibles(): Promise<string[]> {
    const actifs = await this.catalogService.findAll(true);
    const ids = new Set(actifs.map((module) => module.id));
    return MODULES_DE_PEAGE.filter(({ id }) => ids.has(id)).map(({ id }) => id);
  }

  /** Une question, ou `null` si aucun des cinq n'a su en produire.
   *
   * `null` n'est pas une erreur et ne doit jamais empêcher de jouer : tous les modules
   * peuvent être éteints, ou toutes leurs notions fermées. Un péage qui se referme sur
   * une enfant parce qu'il n'a rien à demander serait la pire des pannes : elle irait
   * chercher un adulte pour un jeu de morpion.
   */
  async tirerQuestion(): Promise<PeageQuestion | null> {
    const disponibles = await this.modulesDisponibles();

    // On essaie les modules dans un ordre mélangé jusqu'à ce que l'un réponde, plutôt que
    // d'en tirer un seul : celui qu'on tire peut avoir toutes ses notions fermées, et
    // abandonner à la première tentative rendrait le péage capricieux.
    for (const id of this.melanger(disponibles)) {
      const question = await this.depuisEnSilence(id);
      if (question) return question;
    }
    return null;
  }

  /** Interroge un module, et traite son refus comme un SILENCE.
   *
   * Grammaire et accords lèvent une exception quand aucune notion ouverte ne permet de
   * composer une question : un message utile quand on ouvre leur jeu, qui explique quoi
   * activer. Ici, non : laissée passer, elle sortait en 400 et l'enfant restait devant un
   * morpion qu'elle ne pouvait pas lancer. Pour le péage, « je n'ai rien à demander » est
   * une réponse, pas une panne : on essaie le module suivant.
   */
  private async depuisEnSilence(id: string): Promise<PeageQuestion | null> {
    try {
      return await this.depuis(id);
    } catch {
      return null;
    }
  }

  private depuis(id: string): Promise<PeageQuestion | null> {
    switch (id) {
      case 'tables':
        return this.depuisTables();
      case 'calcul-mental':
        return this.depuisCalcul();
      case 'conjugaison':
        return this.depuisConjugaison();
      case 'grammaire':
        return this.depuisGrammaire();
      case 'accords':
        return this.depuisAccords();
      default:
        return Promise.resolve(null);
    }
  }

  private async depuisTables(): Promise<PeageQuestion | null> {
    const { resultat } = await this.tablesService.construireQuestions({
      selected_tables: [],
      difficulty: DIFFICULTE,
    });
    const question = this.auHasard(
      resultat.questions.filter((q) => q.choices.length >= 2),
    );
    if (!question) return null;
    return this.emballer('tables', {
      consigne: 'Combien font :',
      enonce: `${question.display_a} × ${question.display_b}`,
      choix: question.choices.map(String),
      reponse: String(question.answer),
    });
  }

  private async depuisCalcul(): Promise<PeageQuestion | null> {
    const { resultat } = await this.calculService.construireQuestions({
      difficulty: DIFFICULTE,
    });
    const question = this.auHasard(
      resultat.questions.filter((q) => q.choices.length >= 2),
    );
    if (!question) return null;
    return this.emballer('calcul-mental', {
      consigne: 'Calcule :',
      enonce: question.operation,
      choix: question.choices.map(String),
      reponse: String(question.answer),
    });
  }

  private async depuisConjugaison(): Promise<PeageQuestion | null> {
    // Toujours dans le sens « verbe → forme conjuguée ». Le sens inverse demande de
    // retrouver l'infinitif : c'est une autre compétence, et elle se pose mal en une
    // ligne à la porte d'un jeu.
    const { resultat } = await this.conjugaisonService.construireQuestions({
      difficulty: DIFFICULTE,
      question_direction: 'forward',
    });
    const question = this.auHasard(
      resultat.questions.filter(
        (q) => q.direction === 'forward' && q.choices.length >= 2,
      ),
    );
    if (!question) return null;
    return this.emballer('conjugaison', {
      consigne: `Conjugue au ${question.tense} :`,
      enonce: `${question.infinitif} : ${question.pronoun}`,
      choix: question.choices,
      reponse: question.conjugated,
    });
  }

  private async depuisGrammaire(): Promise<PeageQuestion | null> {
    // `nature_mot` seulement : les autres types demandent de TOUCHER des mots dans une
    // phrase, ce qu'un péage à quatre boutons ne sait pas rendre.
    const { resultat } = await this.grammaireService.construireQuestions({
      difficulty: DIFFICULTE,
      question_types: ['nature_mot'],
    });
    const question = this.auHasard(
      resultat.questions.filter(
        (q) => q.cible !== null && q.choices.length >= 2,
      ),
    );
    if (!question) return null;

    // La phrase, avec le mot visé encadré de guillemets. Le jeu, lui, le souligne : ici
    // il n'y a pas de mise en forme à disposition, et « le mot souligné » sans soulignement
    // ne désignerait rien.
    const phrase = question.mots
      .map((mot, rang) => `${rang === 0 || mot.colle ? '' : ' '}${mot.mot}`)
      .join('');
    const vise = question.mots[question.cible!].mot;

    return this.emballer('grammaire', {
      consigne: `Quelle est la nature de « ${vise} » ?`,
      enonce: phrase,
      choix: question.choices,
      reponse: question.answer,
    });
  }

  private async depuisAccords(): Promise<PeageQuestion | null> {
    const { resultat } = await this.accordsService.construireQuestions({
      difficulty: DIFFICULTE,
    });
    const question = this.auHasard(
      resultat.questions.filter((q) => q.choices.length >= 2),
    );
    if (!question) return null;

    const trou = `${question.avant}…${question.apres}`.trim();
    const enonce = [
      question.depart,
      trou,
      question.indice && `(${question.indice})`,
    ]
      .filter(Boolean)
      .join(' ');

    return this.emballer('accords', {
      consigne: question.display,
      enonce,
      choix: question.choices,
      reponse: question.answer,
    });
  }

  private emballer(
    id: string,
    reste: Omit<PeageQuestion, 'module_id' | 'module_nom'>,
  ): PeageQuestion {
    const nom = MODULES_DE_PEAGE.find((m) => m.id === id)?.nom ?? id;
    return { module_id: id, module_nom: nom, ...reste };
  }

  private auHasard<T>(items: T[]): T | undefined {
    if (items.length === 0) return undefined;
    return items[Math.floor(Math.random() * items.length)];
  }

  private melanger<T>(items: T[]): T[] {
    const copie = [...items];
    for (let i = copie.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copie[i], copie[j]] = [copie[j], copie[i]];
    }
    return copie;
  }
}
