import { BadRequestException, Injectable } from '@nestjs/common';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
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
}
