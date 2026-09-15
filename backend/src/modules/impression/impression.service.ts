import { BadRequestException, Injectable } from '@nestjs/common';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { PoseService } from '../pose/pose.service';
import { DicteeService } from '../dictee/dictee.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { PRONOMS, type Pronom } from '../conjugaison/conjugaison.temps';
import { AccordsService } from '../accords/accords.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import { NumerationService } from '../numeration/numeration.service';
import { nombreEnLettres } from '../numeration/numeration.lettres';
import { maximum } from '../numeration/numeration.positions';
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
    private readonly numerationService: NumerationService,
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
      for (const [exercice, nombre] of this.repartir(ligne)) {
        items.push(
          ...(await this.pourUneLigne({
            ...ligne,
            exercices: [exercice],
            nombre,
          })),
        );
      }
    }
    return items;
  }

  /**
   * Repartit `nombre` exercices entre les types coches.
   *
   * Tour a tour sur une liste MELANGEE, et non un tirage independant par exercice. Les
   * deux sont du hasard, mais le tirage independant peut donner dix exercices du meme
   * type sur trois coches : ce n'est pas ce qu'on attend en cochant trois cases. Le tour
   * a tour garantit une repartition aussi egale que possible, et le melange decide qui
   * recoit l'exercice en trop.
   */
  private repartir(ligne: LigneComposition): [string, number][] {
    const types = ligne.exercices.filter(Boolean);
    if (types.length === 0) return [];

    const melanges = [...types];
    for (let i = melanges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [melanges[i], melanges[j]] = [melanges[j], melanges[i]];
    }

    const parts = new Map<string, number>(melanges.map((t) => [t, 0]));
    for (let pose = 0; pose < ligne.nombre; pose++) {
      const type = melanges[pose % melanges.length];
      parts.set(type, (parts.get(type) ?? 0) + 1);
    }
    return [...parts.entries()].filter(([, n]) => n > 0);
  }

  private pourUneLigne(ligne: LigneComposition): Promise<ItemImprime[]> {
    switch (`${ligne.module}/${ligne.exercices[0]}`) {
      case 'tables/produit':
      case 'tables/facteur_manquant':
      case 'tables/decomposition':
        return this.tablesDepuisUnFait(ligne);
      case 'tables/suite':
        return this.tablesSuite(ligne);
      case 'tables/table_complete':
      case 'tables/table_memo':
        return this.tablesCompletes(ligne);
      case 'calcul-mental/operation':
        return this.calculOperation(ligne);
      case 'calcul-mental/vrai_faux':
        return this.calculVraiFaux(ligne);
      case 'calcul-mental/trous':
        return this.calculTrous(ligne);
      case 'calcul-mental/file':
        return this.calculFile(ligne);
      case 'pose/operation':
      case 'pose/erreur':
        return this.poseOperation(ligne);
      case 'dictee/dictee':
        return this.dicteeMots(ligne);
      case 'conjugaison/forme':
        return this.conjugaisonForme(ligne);
      case 'accords/accord':
        return this.accordsAccord(ligne);
      case 'grammaire/analyse':
        return this.grammaireAnalyse(ligne);
      case 'numeration/question':
        return this.numerationQuestion(ligne);
      case 'numeration/cubes':
        return this.numerationCubes(ligne);
      case 'numeration/ranger':
        return this.numerationRanger(ligne);
      case 'numeration/encadrer':
        return this.numerationEncadrer(ligne);
      case 'numeration/lettres':
        return this.numerationLettres(ligne);
      default:
        throw new BadRequestException(
          `Exercice inconnu : ${ligne.module}/${ligne.exercices[0]}`,
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

  /**
   * Les trois exercices batis sur UN FAIT de la table.
   *
   * `7 x 8 = 56` se pose de trois facons : le produit, le facteur manquant
   * (`7 x __ = 56`), ou la decomposition (`56 = __ x __`). C'est le meme savoir, tire du
   * meme vivier ; seule la case laissee vide change. Les distinguer cote serveur
   * n'aurait servi qu'a tripler le meme tirage.
   *
   * Pour le facteur manquant, on cache un cote au hasard : toujours le second ferait
   * apprendre la position plutot que la table.
   */

  /** Les questions du module telles quelles : decomposer, le chiffre des dizaines. */
  private async numerationQuestion(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const { resultat } = await this.construireNumeration(ligne);
    const questions = resultat.questions.slice(0, ligne.nombre);
    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: {
        enonce: q.display,
        reponse: q.answer,
        type: q.type,
        // La decomposition attend une case par rang : le rendu papier a besoin de savoir
        // lesquels, et dans quel ordre ils sont demandes.
        rangs: q.decompose_positions,
      },
    }));
  }

  /**
   * Le materiel base 10 : cubes, batons, plaques.
   *
   * Quatre batons de dix cubes pour quarante. C'est la representation de l'ecole, et
   * c'est la raison de la preferer a une idee a nous : elle voit le meme dessin en classe
   * et sur sa feuille, donc elle transporte ce qu'elle sait d'un endroit a l'autre.
   *
   * On plafonne aux milliers. Au-dela, le dessin devient une page de petits carres qu'on
   * ne compte plus : il faudrait les compter par paquets, ce qui est l'exercice suivant,
   * pas celui-ci.
   */
  private async numerationCubes(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const { positions } = await this.construireNumeration(ligne);
    const plafond = Math.min(9999, maximum(positions));
    const items: ItemImprime[] = [];
    const vus = new Set<number>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      const valeur = 11 + Math.floor(Math.random() * Math.max(1, plafond - 11));
      if (vus.has(valeur)) continue;
      vus.add(valeur);
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          reponse: valeur,
          milliers: Math.floor(valeur / 1000),
          centaines: Math.floor((valeur % 1000) / 100),
          dizaines: Math.floor((valeur % 100) / 10),
          unites: valeur % 10,
        },
      });
    }
    return items;
  }

  /** Ranger cinq nombres dans l'ordre croissant. Ils sont PROCHES les uns des autres :
   * cinq nombres tires au hasard dans un large intervalle se rangent d'un coup d'oeil,
   * sans jamais comparer deux chiffres. */
  private async numerationRanger(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const { positions } = await this.construireNumeration(ligne);
    const plafond = Math.max(100, maximum(positions));
    const items: ItemImprime[] = [];

    for (let pose = 0; pose < ligne.nombre; pose++) {
      const base = Math.floor(Math.random() * plafond * 0.8);
      const etendue = Math.max(20, Math.floor(plafond * 0.2));
      const nombres = new Set<number>();
      while (nombres.size < 5) {
        nombres.add(base + Math.floor(Math.random() * etendue));
      }
      const liste = [...nombres];
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          nombres: liste.sort(() => Math.random() - 0.5),
          reponse: [...liste].sort((a, b) => a - b),
        },
      });
    }
    return items;
  }

  /** Encadrer un nombre entre deux dizaines, ou deux centaines. Le pas est choisi selon
   * la taille du nombre : encadrer 4 385 entre deux dizaines n'apprend rien. */
  private async numerationEncadrer(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const { positions } = await this.construireNumeration(ligne);
    const plafond = Math.max(100, maximum(positions));
    const items: ItemImprime[] = [];

    for (let pose = 0; pose < ligne.nombre; pose++) {
      const valeur = 11 + Math.floor(Math.random() * Math.max(1, plafond - 11));
      const pasUtile = valeur >= 1000 ? 100 : 10;
      // Un nombre deja rond n'a rien a encadrer : on le decale.
      const ajuste = valeur % pasUtile === 0 ? valeur + 1 : valeur;
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          valeur: ajuste,
          pas: pasUtile,
          avant: Math.floor(ajuste / pasUtile) * pasUtile,
          apres: (Math.floor(ajuste / pasUtile) + 1) * pasUtile,
        },
      });
    }
    return items;
  }

  /**
   * Ecrire un nombre en lettres, ou l'inverse.
   *
   * Le sens est tire au sort. Les deux ne travaillent pas la meme chose : des chiffres
   * vers les lettres, c'est l'orthographe (quatre-vingts, deux cents) ; des lettres vers
   * les chiffres, c'est la lecture des rangs.
   */
  private async numerationLettres(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const { positions } = await this.construireNumeration(ligne);
    const plafond = Math.min(999_999, Math.max(100, maximum(positions)));
    const items: ItemImprime[] = [];
    const vus = new Set<number>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      const valeur = 11 + Math.floor(Math.random() * Math.max(1, plafond - 11));
      if (vus.has(valeur)) continue;
      vus.add(valeur);
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          valeur,
          lettres: nombreEnLettres(valeur),
          versLesLettres: Math.random() < 0.5,
        },
      });
    }
    return items;
  }

  private construireNumeration(ligne: LigneComposition) {
    const demandees = Array.isArray(ligne.options?.positions)
      ? (ligne.options.positions as string[])
      : undefined;
    return this.numerationService.construireQuestions({ positions: demandees });
  }

  private async tablesDepuisUnFait(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const tables = Array.isArray(ligne.options?.tables)
      ? (ligne.options.tables as string[])
          .map(Number)
          .filter((n) => !Number.isNaN(n))
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
      exercice: ligne.exercices[0],
      donnees: {
        a: q.display_a,
        b: q.display_b,
        reponse: q.answer,
        cacheGauche: Math.random() < 0.5,
      },
    }));
  }

  /** Les tables demandees, ou toutes si rien n'est coche. Zero et un sont ecartes des
   * suites et des tables completes : « 0, 0, 0, 0 » n'apprend rien. */
  private tablesChoisies(ligne: LigneComposition): number[] {
    const demandees = Array.isArray(ligne.options?.tables)
      ? (ligne.options.tables as string[])
          .map(Number)
          .filter((n) => !Number.isNaN(n))
      : [];
    const utiles = (
      demandees.length ? demandees : [...Array(11).keys()]
    ).filter((n) => n >= 2);
    return utiles.length ? utiles : [2, 3, 4, 5, 6, 7, 8, 9, 10];
  }

  /**
   * Une suite : `7, 14, __, 28, __`.
   *
   * Le meme savoir que la table, vu autrement : on compte de sept en sept au lieu de
   * reciter. Les trous ne sont jamais aux deux extremites, sinon la suite ne donne plus
   * son pas et l'exercice devient une devinette.
   */
  private tablesSuite(ligne: LigneComposition): Promise<ItemImprime[]> {
    const tables = this.tablesChoisies(ligne);
    const items: ItemImprime[] = [];
    const vus = new Set<string>();

    for (
      let essai = 0;
      essai < ligne.nombre * 10 && items.length < ligne.nombre;
      essai++
    ) {
      const table = tables[Math.floor(Math.random() * tables.length)];
      const depart = 1 + Math.floor(Math.random() * 5);
      const termes = Array.from({ length: 5 }, (_, i) => (depart + i) * table);
      // Deux trous, jamais le premier ni le dernier.
      const candidats = [1, 2, 3];
      const trous = candidats
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .sort((a, b) => a - b);
      const cle = `${table}-${depart}-${trous.join(',')}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: { termes, trous, pas: table },
      });
    }
    return Promise.resolve(items);
  }

  /**
   * Une table entiere, a remplir ou deja remplie.
   *
   * La version remplie n'est pas un exercice : c'est un memo a garder sous les yeux ou a
   * coller dans un cahier. Les deux sortent du meme calcul, seul le rendu differe, d'ou
   * un seul generateur pour deux types.
   */
  private tablesCompletes(ligne: LigneComposition): Promise<ItemImprime[]> {
    const tables = this.tablesChoisies(ligne);
    const melangees = [...tables].sort(() => Math.random() - 0.5);
    const items = Array.from(
      { length: Math.min(ligne.nombre, melangees.length) },
      (_, i) => ({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          table: melangees[i],
          lignes: Array.from({ length: 10 }, (_, k) => ({
            facteur: k + 1,
            produit: melangees[i] * (k + 1),
          })),
        },
      }),
    );
    return Promise.resolve(items);
  }

  /**
   * `7 x 8 = 54`, vrai ou faux.
   *
   * Fait travailler l'ESTIMATION plutot que le calcul : on repere qu'un resultat est
   * impossible avant de savoir lequel est juste. L'ecart propose n'est jamais de un : a
   * une unite pres, il faut calculer, et l'exercice redevient celui d'a cote.
   */
  private async calculVraiFaux(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const questions = await this.tirer(
      ligne.nombre,
      (q: { operation: string }) => q.operation,
      async () => (await this.construireCalcul(ligne)).questions,
    );

    return questions.map((q) => {
      const vrai = Math.random() < 0.5;
      const ecart =
        (2 + Math.floor(Math.random() * 8)) * (Math.random() < 0.5 ? -1 : 1);
      const affiche = vrai ? q.answer : Math.max(0, q.answer + ecart);
      return {
        module: ligne.module,
        exercice: ligne.exercices[0],
        // `affiche === reponse` peut arriver si l'ecart a ete ramene a zero par le
        // plancher : on recalcule la verite plutot que de la supposer.
        donnees: {
          operation: q.operation,
          affiche,
          reponse: q.answer,
          vrai: affiche === q.answer,
        },
      };
    });
  }

  /**
   * `24 + ___ = 41`.
   *
   * Engendre ici, et non tire du module : ses questions ne portent que leur ENONCE
   * redige (« le double de 34 »), pas leurs operandes. Il faudrait analyser une chaine
   * pour les retrouver, ce qui casserait au premier enonce qui n'est pas une operation.
   * On reprend seulement ses bornes de valeurs, pour rester dans les nombres qu'elle
   * manipule a l'ecran.
   */
  private async calculTrous(ligne: LigneComposition): Promise<ItemImprime[]> {
    const { min_value: min, max_value: max } =
      await this.construireCalcul(ligne);
    const items: ItemImprime[] = [];
    const vus = new Set<string>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      const total = min + Math.floor(Math.random() * Math.max(1, max - min));
      const connu = Math.floor(Math.random() * Math.max(1, total));
      const manquant = total - connu;
      if (manquant <= 0) continue;
      // L'addition ou la soustraction, au hasard : `41 - ___ = 24` fait travailler la
      // meme relation dans l'autre sens.
      const addition = Math.random() < 0.5;
      const cle = `${addition ? 'a' : 's'}-${connu}-${manquant}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: addition
          ? { gauche: connu, signe: '+', droite: total, reponse: manquant }
          : {
              gauche: total,
              signe: '\u2212',
              droite: connu,
              reponse: manquant,
            },
      });
    }
    return items;
  }

  /**
   * `12 -> +5 -> x2 -> -4 -> ___`.
   *
   * Trois operations enchainees, une seule reponse a ecrire. L'interet n'est pas le
   * calcul, que l'enfant sait faire, mais de le TENIR sur trois etapes sans poser.
   * Chaque etape reste petite pour cette raison, et jamais de division : un reste casse
   * la chaine.
   */
  private calculFile(ligne: LigneComposition): Promise<ItemImprime[]> {
    const items: ItemImprime[] = [];
    for (let pose = 0; pose < ligne.nombre; pose++) {
      let valeur = 2 + Math.floor(Math.random() * 18);
      const depart = valeur;
      const etapes: { signe: string; valeur: number }[] = [];

      for (let pas = 0; pas < 3; pas++) {
        const choix = Math.random();
        if (choix < 0.4) {
          const n = 1 + Math.floor(Math.random() * 9);
          valeur += n;
          etapes.push({ signe: '+', valeur: n });
        } else if (choix < 0.8) {
          const n = 1 + Math.floor(Math.random() * Math.min(9, valeur - 1));
          valeur -= n;
          etapes.push({ signe: '\u2212', valeur: n });
        } else {
          valeur *= 2;
          etapes.push({ signe: '\u00d7', valeur: 2 });
        }
      }

      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: { depart, etapes, reponse: valeur },
      });
    }
    return Promise.resolve(items);
  }

  /** Le lot de questions du module, avec ses bornes de valeurs. Mutualise entre les
   * exercices de calcul, qui partagent le meme reglage de types. */
  private async construireCalcul(ligne: LigneComposition) {
    const types = Array.isArray(ligne.options?.types)
      ? (ligne.options.types as string[])
      : undefined;
    return (
      await this.calculService.construireQuestions({
        operation_types: types,
        difficulty: 'hard',
      })
    ).resultat;
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
      exercice: ligne.exercices[0],
      donnees: { operation: q.operation, reponse: q.answer },
    }));
  }

  /**
   * Change UN chiffre d'un resultat, jamais celui des unites.
   *
   * L'erreur des unites se repere sans rien poser, par la simple parite ou le dernier
   * chiffre des operandes. En la mettant plus haut, il faut refaire l'operation, ce qui
   * est tout l'exercice. Et un seul chiffre change : deux erreurs donneraient l'impression
   * d'un resultat pris au hasard plutot que d'un calcul rate.
   */
  private fausserUnChiffre(valeur: number): number {
    const chiffres = [...String(valeur)];
    if (chiffres.length < 2) return valeur + 1;
    const rang = Math.floor(Math.random() * (chiffres.length - 1));
    const actuel = Number(chiffres[rang]);
    const ecart = Math.random() < 0.5 ? 1 : -1;
    let remplacant = actuel + ecart;
    if (remplacant < 0) remplacant = 1;
    if (remplacant > 9) remplacant = 8;
    // Un zero en tete transformerait un nombre a quatre chiffres en nombre a trois, et
    // l'erreur deviendrait visible a la longueur.
    if (rang === 0 && remplacant === 0) remplacant = 1;
    chiffres[rang] = String(remplacant);
    return Number(chiffres.join(''));
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
      exercice: ligne.exercices[0],
      // Pas de retenues dans les donnees : elles ne sont pas imprimees, et les envoyer
      // inviterait a les dessiner un jour par megarde.
      donnees: {
        operation: q.operation,
        operandes: q.operands,
        reponse: q.answer,
        colonnes: q.columns,
        // L'operation FAUSSE, pour l'exercice ou l'on cherche l'erreur. Un seul chiffre
        // change, jamais le dernier : une erreur au bout se voit sans poser l'operation,
        // alors que l'exercice consiste justement a la refaire.
        faux: this.fausserUnChiffre(q.answer),
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
        exercice: ligne.exercices[0],
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
        exercice: ligne.exercices[0],
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
      exercice: ligne.exercices[0],
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
      exercice: ligne.exercices[0],
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
