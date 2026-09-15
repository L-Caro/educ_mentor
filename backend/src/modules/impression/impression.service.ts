import { BadRequestException, Injectable } from '@nestjs/common';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { PoseService } from '../pose/pose.service';
import { DicteeService } from '../dictee/dictee.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { PRONOMS, type Pronom } from '../conjugaison/conjugaison.temps';
import { AccordsService } from '../accords/accords.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import type { StartDicteeSessionDto } from '../dictee/dto/dictee.dto';
import {
  MAXIMUM_ITEMS,
  type ItemImprime,
  type LigneComposition,
} from './impression.types';

/**
 * Compose une feuille d'exercices en puisant chez les modules.
 *
 * Rien n'est ENREGISTRE : ni seance, ni progression. C'est la meme decision que pour le
 * peage des jeux, et pour la meme raison doublee d'une autre. Une feuille imprimee n'est
 * pas une seance de travail a l'ecran, et la voir apparaitre dans « seances recentes »
 * brouillerait ce que l'adulte y lit. Surtout, ce qui est fait sur papier n'est pas
 * mesure : le compter dans la progression ferait mentir la mesure, puisque personne ne
 * ressaisira les resultats.
 *
 * C'est pour cela que les modules ont une `construireQuestions` separee de leur
 * `startSession` : on emprunte leur savoir-faire sans emprunter leurs effets.
 */
@Injectable()
export class ImpressionService {
  constructor(
    private readonly tablesService: TablesService,
    private readonly calculService: CalculService,
    private readonly poseService: PoseService,
    private readonly dicteeService: DicteeService,
    private readonly conjugaisonService: ConjugaisonService,
    private readonly accordsService: AccordsService,
    private readonly grammaireService: GrammaireService,
  ) {}

  async composer(lignes: LigneComposition[]): Promise<ItemImprime[]> {
    const total = lignes.reduce((somme, ligne) => somme + ligne.nombre, 0);
    if (total > MAXIMUM_ITEMS) {
      throw new BadRequestException(
        `Une feuille ne peut pas depasser ${MAXIMUM_ITEMS} exercices.`,
      );
    }

    const items: ItemImprime[] = [];
    for (const ligne of lignes) {
      items.push(...(await this.pourUneLigne(ligne)));
    }
    return items;
  }

  private pourUneLigne(ligne: LigneComposition): Promise<ItemImprime[]> {
    switch (`${ligne.module}/${ligne.exercice}`) {
      case 'tables/produit':
        return this.tablesProduit(ligne);
      case 'calcul-mental/operation':
        return this.calculOperation(ligne);
      case 'pose/operation':
        return this.poseOperation(ligne);
      case 'dictee/dictee':
        return this.dicteeMots(ligne);
      case 'conjugaison/forme':
        return this.conjugaisonForme(ligne);
      case 'accords/accord':
        return this.accordsAccord(ligne);
      case 'grammaire/analyse':
        return this.grammaireAnalyse(ligne);
      default:
        throw new BadRequestException(
          `Exercice inconnu : ${ligne.module}/${ligne.exercice}`,
        );
    }
  }

  /**
   * Tire `nombre` items DISTINCTS.
   *
   * `construireQuestions` rend une seance entiere, dont la taille est reglee ailleurs :
   * il faut donc parfois plusieurs appels, et parfois en jeter. Les doublons sont ecartes
   * par leur cle : deux fois « 7 x 8 » sur la meme feuille, c'est une ligne perdue.
   *
   * La boucle est bornee. Si le vivier est plus petit que ce qui est demande (une seule
   * table cochee, dix multiplications voulues), on rend ce qu'on a plutot que de tourner
   * sans fin : une feuille un peu plus courte vaut mieux qu'une requete qui ne repond pas.
   */
  private async tirer<T>(
    nombre: number,
    cleDe: (question: T) => string,
    lot: () => Promise<T[]>,
  ): Promise<T[]> {
    const retenus = new Map<string, T>();
    for (let essai = 0; essai < 20 && retenus.size < nombre; essai++) {
      for (const question of await lot()) {
        if (retenus.size >= nombre) break;
        retenus.set(cleDe(question), question);
      }
    }
    return [...retenus.values()].slice(0, nombre);
  }

  private async tablesProduit(ligne: LigneComposition): Promise<ItemImprime[]> {
    const tables = Array.isArray(ligne.options?.tables)
      ? (ligne.options.tables as number[])
      : [];
    const questions = await this.tirer(
      ligne.nombre,
      (q: { fact_id: string }) => q.fact_id,
      async () =>
        (
          await this.tablesService.construireQuestions({
            selected_tables: tables,
            // `hard` = saisie libre, donc aucun choix de QCM engendre : sur le papier on
            // ecrit la reponse, on ne coche pas.
            difficulty: 'hard',
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercice,
      donnees: { a: q.display_a, b: q.display_b, reponse: q.answer },
    }));
  }

  private async calculOperation(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const types = Array.isArray(ligne.options?.types)
      ? (ligne.options.types as string[])
      : undefined;
    const questions = await this.tirer(
      ligne.nombre,
      (q: { operation: string }) => q.operation,
      async () =>
        (
          await this.calculService.construireQuestions({
            operation_types: types,
            difficulty: 'hard',
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercice,
      donnees: { operation: q.operation, reponse: q.answer },
    }));
  }

  private async poseOperation(ligne: LigneComposition): Promise<ItemImprime[]> {
    const operations = Array.isArray(ligne.options?.operations)
      ? (ligne.options.operations as (
          | 'addition'
          | 'soustraction'
          | 'multiplication'
        )[])
      : undefined;
    const questions = await this.tirer(
      ligne.nombre,
      (q: { operands: number[] }) => q.operands.join('x'),
      async () =>
        (
          await this.poseService.construireQuestions({
            operations,
            difficulty: 'hard',
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercice,
      // Pas de retenues dans les donnees : elles ne sont pas imprimees, et les envoyer
      // inviterait a les dessiner un jour par megarde.
      donnees: {
        operation: q.operation,
        operandes: q.operands,
        reponse: q.answer,
        colonnes: q.columns,
      },
    }));
  }

  /**
   * La dictee ne donne qu'UN item par feuille, et c'est voulu.
   *
   * Ce n'est pas un exercice parmi d'autres : c'est un bloc de lignes a ecrire, que
   * l'adulte dicte a voix haute. Le « corrige » n'en est pas un non plus, c'est la liste
   * des phrases a lire. Demander « trois dictees » n'aurait pas de sens ; on demande une
   * dictee, et c'est sa longueur qui varie.
   */
  private async dicteeMots(ligne: LigneComposition): Promise<ItemImprime[]> {
    const niveau =
      typeof ligne.options?.niveau === 'string' ? ligne.options.niveau : 'ce1';
    const longueur =
      typeof ligne.options?.longueur === 'string'
        ? ligne.options.longueur
        : 'courte';
    const construite = await this.dicteeService.construireItems({
      niveau,
      longueur,
    } as StartDicteeSessionDto);

    return [
      {
        module: ligne.module,
        exercice: ligne.exercice,
        donnees: {
          phrases: construite.items.map((item) => item.contenu),
          niveau: construite.niveau,
        },
      },
    ];
  }

  /**
   * Les pronoms qu'on demande quand on n'en demande pas six.
   *
   * L'ordre n'est pas celui du tableau mais celui de l'UTILITE : `je` porte la premiere
   * personne, `nous` la terminaison la plus irreguliere, `ils` celle qu'on oublie. Une
   * conjugaison a trois formes dans cet ordre fait travailler l'essentiel ; les trois
   * premieres du tableau (je, tu, il) se ressemblent trop pour apprendre quoi que ce soit.
   */
  private static readonly PRONOMS_UTILES: Pronom[] = [
    'je',
    'nous',
    'ils',
    'tu',
    'il',
    'vous',
  ];

  private async conjugaisonForme(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const formes = Math.min(
      6,
      Math.max(1, Number(ligne.options?.formes ?? 1) || 1),
    );
    const questions = await this.tirer(
      ligne.nombre,
      (q: { infinitif: string; tense: string }) => `${q.infinitif}|${q.tense}`,
      async () =>
        (
          await this.conjugaisonService.construireQuestions({
            difficulty: 'hard',
            question_direction: 'forward',
            tenses: Array.isArray(ligne.options?.tenses)
              ? (ligne.options.tenses as string[])
              : undefined,
            verbes: Array.isArray(ligne.options?.verbes)
              ? (ligne.options.verbes as string[])
              : undefined,
          })
        ).resultat.questions,
    );

    return questions.map((q) => {
      // On garde l'ordre du tableau pour l'affichage, meme quand la selection suit
      // l'ordre d'utilite : une conjugaison qui commence par `nous` se lit mal.
      const choisis = ImpressionService.PRONOMS_UTILES.slice(0, formes);
      const ordonnes = PRONOMS.filter((p) => choisis.includes(p));
      return {
        module: ligne.module,
        exercice: ligne.exercice,
        donnees: {
          infinitif: q.infinitif,
          temps: q.tense,
          lignes: ordonnes.map((pronom) => ({
            pronom,
            reponse: q.forms[pronom],
          })),
        },
      };
    });
  }

  private async accordsAccord(ligne: LigneComposition): Promise<ItemImprime[]> {
    const types = Array.isArray(ligne.options?.types)
      ? (ligne.options.types as string[])
      : undefined;
    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.accordsService.construireQuestions({
            difficulty: 'hard',
            question_types: types as never,
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercice,
      donnees: {
        consigne: q.display,
        depart: q.depart,
        avant: q.avant,
        apres: q.apres,
        indice: q.indice,
        reponse: q.answer,
      },
    }));
  }

  /**
   * La grammaire est le module qui gagne le plus au papier.
   *
   * Ses questions de selection - « touche les verbes » - deviennent « souligne les
   * verbes », qui est l'exercice scolaire d'origine et se fait mieux au crayon. On
   * transmet donc la phrase entiere et les indices attendus, sans distinguer le type :
   * c'est la consigne du module qui dit quoi faire, et elle est deja redigee.
   */
  private async grammaireAnalyse(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const types = Array.isArray(ligne.options?.types)
      ? (ligne.options.types as string[])
      : undefined;
    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.grammaireService.construireQuestions({
            difficulty: 'hard',
            question_types: types as never,
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercice,
      donnees: {
        consigne: q.display,
        mots: q.mots,
        cible: q.cible,
        reponse: q.answer,
        indices: q.answer_indices,
      },
    }));
  }
}
