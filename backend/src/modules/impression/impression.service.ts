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
import { HeureService } from '../heure/heure.service';
import { MonnaieService } from '../monnaie/monnaie.service';
import { GeometrieService } from '../geometrie/geometrie.service';
import type { QuestionType } from '../geometrie/geometrie.logic';
import { CompteService } from '../compte/compte.service';
import { LectureService } from '../lecture/lecture.service';
import { nombreEnLettres } from '../numeration/numeration.lettres';
import { maximum } from '../numeration/numeration.positions';
import type { StartDicteeSessionDto } from '../dictee/dto/dictee.dto';
import {
  MAXIMUM_ITEMS,
  type ItemImprime,
  type LigneComposition,
} from './impression.types';

/**
 * Les figures dont les sommets tombent sur les carreaux, et donc qu'on peut demander de
 * tracer a la regle. Un pentagone regulier sur un quadrillage de cinq millimetres n'est
 * pas un exercice de CE1 mais une construction au compas.
 */
const TRACABLES_SUR_CARREAUX = ['carre', 'rectangle', 'triangleRectangle'];

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
    private readonly heureService: HeureService,
    private readonly monnaieService: MonnaieService,
    private readonly geometrieService: GeometrieService,
    private readonly compteService: CompteService,
    private readonly lectureService: LectureService,
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
      case 'conjugaison/transposer':
        return this.conjugaisonTransposer(ligne);
      case 'accords/accord':
        return this.accordsAccord(ligne);
      case 'accords/pluriel':
        return this.accordsPluriel(ligne);
      case 'accords/corriger':
        return this.accordsCorriger(ligne);
      case 'grammaire/analyse':
        return this.grammaireAnalyse(ligne);
      case 'grammaire/trier':
        return this.grammaireTrier(ligne);
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
      case 'heure/lire':
      case 'heure/dessiner':
        return this.heureCadran(ligne);
      case 'heure/durees':
        return this.heureDurees(ligne);
      case 'monnaie/reconnaitre':
      case 'monnaie/total':
      case 'monnaie/rendre':
        return this.monnaieQuestion(ligne);
      case 'monnaie/entourer':
        return this.monnaieEntourer(ligne);
      case 'geometrie/nommer':
      case 'geometrie/cotes_sommets':
      case 'geometrie/angle_droit':
      case 'geometrie/proprietes':
        return this.geometrieQuestion(ligne);
      case 'geometrie/tracer':
        return this.geometrieTracer(ligne);
      case 'compte/tirage':
        return this.compteTirage(ligne);
      case 'lecture/texte':
        return this.lectureTexte(ligne);
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
      const questions = await this.siDisponible(lot());
      if (!questions) break;
      for (const question of questions) {
        if (retenus.size >= nombre) break;
        retenus.set(cleDe(question), question);
      }
    }
    return [...retenus.values()].slice(0, nombre);
  }

  /**
   * Un module qui ne peut rien produire fait SILENCE, il ne casse pas la feuille.
   *
   * Plusieurs modules refusent quand leur contenu manque : pas une seule dictee saisie,
   * aucune notion de grammaire ouverte, aucun texte de lecture actif. Pour le jeu, cette
   * erreur est la bonne reponse : elle dit a l'adulte ce qu'il doit ouvrir. Ici elle
   * ferait echouer TOUTE la feuille, y compris les dix exercices de tables qui n'avaient
   * rien demande a personne, et l'adulte verrait une feuille vide sans savoir pourquoi.
   *
   * La ligne concernee ne rend donc rien, et les autres sortent. La page de composition
   * dit deja ce qui est disponible, elle n'offre pas de cocher ce qui n'existe pas.
   */
  private async siDisponible<T>(promesse: Promise<T>): Promise<T | null> {
    try {
      return await promesse;
    } catch (erreur) {
      if (erreur instanceof BadRequestException) return null;
      throw erreur;
    }
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
    const construite = await this.construireNumeration(ligne);
    if (!construite) return [];
    const questions = construite.resultat.questions.slice(0, ligne.nombre);
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
    const construite = await this.construireNumeration(ligne);
    if (!construite) return [];
    const { positions } = construite;
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
    const construite = await this.construireNumeration(ligne);
    if (!construite) return [];
    const { positions } = construite;
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
    const construite = await this.construireNumeration(ligne);
    if (!construite) return [];
    const { positions } = construite;
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
    const construite = await this.construireNumeration(ligne);
    if (!construite) return [];
    const { positions } = construite;
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

  /** `null` quand aucune position n'est ouverte : la ligne fait silence plutot que de
   * casser la feuille (voir `siDisponible`). */
  private construireNumeration(ligne: LigneComposition) {
    const demandees = Array.isArray(ligne.options?.positions)
      ? (ligne.options.positions as string[])
      : undefined;
    return this.siDisponible(
      this.numerationService.construireQuestions({ positions: demandees }),
    );
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
    const construite = await this.siDisponible(
      this.dicteeService.construireItems({
        niveau,
        longueur,
      } as StartDicteeSessionDto),
    );
    if (!construite) return [];

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

  /**
   * Les deux exercices du cadran : le lire, et le dessiner.
   *
   * Ils sont symetriques et tires du MEME vivier, comme le produit et le facteur manquant
   * des tables : c'est le meme savoir, et seule la case laissee vide change. Lire un
   * cadran, c'est traduire deux aiguilles en chiffres ; dessiner l'heure, c'est
   * l'inverse, et c'est la que l'on voit si la petite aiguille a compris qu'elle avance
   * entre deux nombres.
   *
   * « Dessine 3 h 45 » n'existe que sur le papier : a l'ecran, il faudrait faire tourner
   * des aiguilles a la souris, ce qui mesurerait la souris.
   *
   * Le tirage est celui du module, sans generateur parallele. L'option `mode` choisit
   * entre ses deux univers : `expression`, le cycle de douze heures aux minutes parlantes
   * (et quart, moins le quart, et demie), et `digital`, les vingt-quatre heures a la
   * minute pres.
   */
  private async heureCadran(ligne: LigneComposition): Promise<ItemImprime[]> {
    const mode =
      ligne.options?.mode === 'digital' ? 'digital' : ('expression' as const);
    const chiffres =
      typeof ligne.options?.chiffres === 'string'
        ? ligne.options.chiffres
        : 'arabic';

    const questions = await this.tirer(
      ligne.nombre,
      (q: { answer_value: number }) => String(q.answer_value),
      async () =>
        (
          await this.heureService.construireQuestions({
            difficulty: 'hard',
            numeral_type: chiffres,
            question_mode: mode,
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: {
        heure: q.hour,
        minute: q.minute,
        chiffres: q.numeral_type,
        // Un cadran a douze heures, la journee en a vingt-quatre : rien ne distingue
        // 15 h 20 de 3 h 20 sur le dessin. Le jeu regle cela par une pastille soleil ou
        // lune, et la feuille doit la porter aussi, sinon le corrige donne tort a une
        // reponse juste. En mode `expression` les heures vont de 1 a 12 : il n'y a rien
        // a lever, et une pastille y serait arbitraire.
        matin: mode === 'digital' ? q.hour < 12 : undefined,
      },
    }));
  }

  /**
   * Les durees : d'une heure a l'autre, et d'une heure plus un temps.
   *
   * Aucun cadran, et c'est le propre de l'exercice : on ne lit plus une horloge, on
   * calcule en base soixante. Les deux sens alternent au hasard parce qu'ils ne
   * s'apprennent pas ensemble ; chercher l'heure d'arrivee, c'est une addition qui
   * retient a soixante, chercher le temps ecoule, c'est une soustraction.
   *
   * Les durees franchissent presque toujours une heure pleine. C'est tout l'interet :
   * « 9 h 10 plus 20 minutes » se fait sans rien savoir du temps.
   */
  private heureDurees(ligne: LigneComposition): Promise<ItemImprime[]> {
    const items: ItemImprime[] = [];
    const vus = new Set<string>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      // De 7 h a 20 h : les heures d'une journee d'enfant, et jamais de passage a minuit.
      const departMinutes =
        (7 + Math.floor(Math.random() * 13)) * 60 +
        Math.floor(Math.random() * 12) * 5;
      const duree = (2 + Math.floor(Math.random() * 22)) * 5;
      const finMinutes = departMinutes + duree;
      if (finMinutes >= 23 * 60) continue;

      const cle = `${String(departMinutes)}+${String(duree)}`;
      if (vus.has(cle)) continue;
      vus.add(cle);

      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        // Le sens est tire ici et non au rendu : le corrige doit savoir ce qui est
        // demande, et deux feuilles tirees deux fois doivent poser les memes questions.
        donnees: {
          sens: Math.random() < 0.5 ? 'fin' : 'ecart',
          depart: this.enHeure(departMinutes),
          fin: this.enHeure(finMinutes),
          duree,
        },
      });
    }
    return Promise.resolve(items);
  }

  /** Minutes depuis minuit vers `9 h 05`. Les minutes gardent leur zero : `9 h 5` se lit
   * mal, et c'est ainsi qu'elles s'ecrivent sur un reveil. */
  private enHeure(minutes: number): string {
    const heures = Math.floor(minutes / 60);
    const reste = minutes % 60;
    return `${String(heures)} h ${String(reste).padStart(2, '0')}`;
  }

  /**
   * Les trois exercices du jeu, tels quels : compter des pieces, additionner des prix,
   * rendre la monnaie.
   *
   * Le type demande est passe au module, qui ne sait engendrer qu'une sorte a la fois :
   * contrairement aux tables, ces trois-la ne sortent pas du meme vivier. Compter ce
   * qu'on a en main, faire un total et calculer un reste sont trois calculs differents.
   */
  private async monnaieQuestion(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const type = ligne.exercices[0];
    const questions = await this.tirer(
      ligne.nombre,
      (q: {
        answer: number;
        coins?: number[];
        prices?: number[];
        price?: number;
      }) =>
        `${String(q.answer)}:${(q.coins ?? q.prices ?? [q.price ?? 0]).join(',')}`,
      async () =>
        (
          await this.monnaieService.construireQuestions({
            exercise_type: type,
            difficulty: 'hard',
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: type,
      donnees: {
        pieces: q.coins,
        prix: type === 'rendre' ? q.price : q.prices,
        paye: q.payment,
        reponse: q.answer,
      },
    }));
  }

  /**
   * Entourer les pieces qui font le compte. N'existe que sur le papier.
   *
   * A l'ecran on tape un nombre, et la question devient un calcul ; sur la feuille, elle
   * redevient ce qu'elle est au magasin : choisir dans ce qu'on a. C'est la meme raison
   * qui fait exister « dessine les aiguilles ».
   *
   * La palette ne contient que des valeurs OUVERTES par l'administration : proposer
   * d'entourer un billet de cinquante alors que le jeu s'arrete a dix contournerait le
   * seul reglage qui decide de ce que l'enfant voit.
   */
  private async monnaieEntourer(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const construite = await this.siDisponible(
      this.monnaieService.construireQuestions({
        exercise_type: 'reconnaitre',
        difficulty: 'hard',
      }),
    );
    if (!construite || construite.denominations.length === 0) return [];
    const { denominations } = construite;

    const items: ItemImprime[] = [];
    const vus = new Set<number>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      // La cible est BATIE a partir des pieces, jamais tiree puis decomposee : un montant
      // pris au hasard peut n'etre atteignable par aucun sous-ensemble de la palette, et
      // l'exercice serait alors insoluble sans que rien ne le signale.
      const solution: number[] = [];
      const combien = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < combien; i++) {
        solution.push(
          denominations[Math.floor(Math.random() * denominations.length)],
        );
      }
      const cible = solution.reduce((somme, piece) => somme + piece, 0);
      if (vus.has(cible)) continue;
      vus.add(cible);

      // Les intrus sont melanges a la solution : une palette ou les bonnes pieces sont
      // groupees se resout sans compter.
      const palette = [...solution];
      for (const valeur of denominations) {
        if (valeur <= cible) palette.push(valeur);
      }
      palette.sort(() => Math.random() - 0.5);

      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          cible,
          palette,
          solution: [...solution].sort((a, b) => b - a),
        },
      });
    }
    return items;
  }

  /**
   * Les questions du module : nommer une figure, compter ses cotes, reperer un angle
   * droit, comparer deux figures.
   *
   * `nommer` couvre les deux types du jeu, `nom_figure` et `nom_solide`. La distinction
   * lui sert a regler la difficulte ; sur une feuille, nommer un carre et nommer un cube
   * sont la meme consigne ecrite au meme endroit, et deux cases a cocher pour cela
   * n'apprendraient rien a l'adulte qui compose.
   */
  private async geometrieQuestion(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const types: QuestionType[] =
      ligne.exercices[0] === 'nommer'
        ? ['nom_figure', 'nom_solide']
        : [ligne.exercices[0] as QuestionType];

    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.geometrieService.construireQuestions({
            difficulty: 'hard',
            question_types: types,
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: {
        consigne: q.display,
        figure: q.shape,
        figureB: q.shapeB,
        reponse: q.answer,
      },
    }));
  }

  /**
   * Tracer une figure sur des carreaux. N'existe que sur le papier.
   *
   * C'est le seul exercice de geometrie qui demande une regle et un crayon, et c'est
   * aussi celui que l'ecole fait le plus : reconnaitre un carre et savoir en tracer un
   * sont deux choses, et la seconde ne se mesure pas a la souris.
   *
   * Seules les figures dont les sommets tombent sur les carreaux sont proposees. Un
   * pentagone regulier a tracer sur un quadrillage de cinq millimetres n'est pas un
   * exercice de CE1, c'est un exercice de construction au compas.
   */
  private async geometrieTracer(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const construite = await this.siDisponible(
      this.geometrieService.construireQuestions({ difficulty: 'hard' }),
    );
    if (!construite) return [];
    const tracables = construite.figures
      .map((figure) => figure.key)
      .filter((cle) => TRACABLES_SUR_CARREAUX.includes(cle));
    if (tracables.length === 0) return [];

    const items: ItemImprime[] = [];
    const vus = new Set<string>();

    for (
      let essai = 0;
      essai < ligne.nombre * 20 && items.length < ligne.nombre;
      essai++
    ) {
      const figure = tracables[Math.floor(Math.random() * tracables.length)];
      // Entre trois et huit carreaux : en dessous le trace ne se voit pas, au-dessus il
      // ne tient plus dans une demi-largeur de feuille.
      const largeur = 3 + Math.floor(Math.random() * 6);
      const hauteur =
        figure === 'carre' ? largeur : 3 + Math.floor(Math.random() * 6);
      if (figure !== 'carre' && hauteur === largeur) continue;

      const cle = `${figure}:${String(largeur)}x${String(hauteur)}`;
      if (vus.has(cle)) continue;
      vus.add(cle);

      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          figure,
          largeur,
          hauteur,
          // Le quadrillage est plus grand que la figure : un trace cale contre le bord
          // du cadre ne laisse pas la place de se tromper puis de recommencer.
          colonnes: largeur + 3,
          lignes: hauteur + 2,
        },
      });
    }
    return items;
  }

  /**
   * Un tirage du compte est bon : la cible, les six plaques, et des lignes vides.
   *
   * Le tirage est solvable PAR CONSTRUCTION, comme dans le jeu : il est bati depuis une
   * suite d'operations valides, et la cible est ce qu'elle produit. C'est la raison
   * d'emprunter le generateur du module plutot que de tirer six nombres au hasard : sur
   * une feuille, personne ne peut dire a l'enfant qu'un compte est impossible, et elle
   * chercherait jusqu'a croire que c'est elle qui n'y arrive pas.
   *
   * Les lignes vides sont au nombre des etapes de la solution de reference. Pas une de
   * plus : une ligne en trop se lit comme une etape manquante, et la feuille laisserait
   * croire qu'on n'a pas fini.
   */
  private async compteTirage(ligne: LigneComposition): Promise<ItemImprime[]> {
    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.compteService.construireQuestions({
            difficulty: 'hard',
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: {
        cible: q.cible,
        plaques: q.plaques,
        etapes: q.solution.length,
        // Une solution, pas LA solution : il y en a souvent plusieurs, et le corrige le
        // dit, sinon il ferait passer pour fausse une reponse qui atteint la cible
        // autrement.
        solution: q.solution.map(
          (etape) =>
            // Le vrai signe moins, pas le trait d'union du code : sur du papier, `100 - 25`
            // se lit comme un tiret de liste.
            `${String(etape.a)} ${etape.operation === '-' ? '\u2212' : etape.operation} ${String(etape.b)} = ${String(etape.resultat)}`,
        ),
      },
    }));
  }

  /**
   * Un texte et ses questions. UN SEUL par feuille, quel que soit le nombre demande.
   *
   * Comme la dictee : ce n'est pas un exercice parmi d'autres mais un bloc, et « trois
   * lectures » sur une meme feuille n'aurait pas de sens. C'est la longueur du texte qui
   * varie, pas leur nombre.
   *
   * Pas de QCM : sur le papier on ecrit la reponse. Engendrer des distracteurs serait au
   * mieux inutile, au pire imprime par erreur.
   */
  private async lectureTexte(ligne: LigneComposition): Promise<ItemImprime[]> {
    const texteId =
      typeof ligne.options?.texte === 'string'
        ? Number(ligne.options.texte)
        : undefined;
    const lecture = await this.siDisponible(
      this.lectureService.construireLecture(
        Number.isFinite(texteId) ? texteId : undefined,
      ),
    );
    if (!lecture) return [];

    return [
      {
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          titre: lecture.titre,
          contenu: lecture.contenu,
          questions: lecture.questions.map((q) => q.question),
          reponses: lecture.questions.map((q) => q.reponse),
        },
      },
    ];
  }

  /**
   * Transposer : « je chante » vers « nous ... ».
   *
   * Different du tableau a completer, meme si les deux tirent du meme verbe. Remplir un
   * tableau, c'est derouler une serie qu'on recite ; transposer, c'est partir d'une forme
   * donnee pour en produire une autre, sans la serie pour s'appuyer. C'est l'exercice qui
   * montre si les terminaisons sont sues ou seulement recitees dans l'ordre.
   *
   * Le depart et la cible ne sont jamais le meme pronom, et jamais deux pronoms qui se
   * conjuguent pareil : `il` vers `elle` ne demande de changer rien du tout.
   */
  private async conjugaisonTransposer(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
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

    const items: ItemImprime[] = [];
    for (const question of questions) {
      const paire = this.paireDeTransposition(question.forms);
      if (!paire) continue;
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: {
          infinitif: question.infinitif,
          temps: question.tense,
          departPronom: paire.depart,
          departForme: question.forms[paire.depart],
          ciblePronom: paire.cible,
          reponse: question.forms[paire.cible],
        },
      });
    }
    return items;
  }

  /** Deux pronoms dont les formes DIFFERENT. `il` vers `elle` ne demande de changer rien
   * du tout, et « transpose » y perdrait son sens. */
  private paireDeTransposition(
    formes: Record<Pronom, string>,
  ): { depart: Pronom; cible: Pronom } | null {
    const melanges = [...PRONOMS].sort(() => Math.random() - 0.5);
    for (const depart of melanges) {
      for (const cible of melanges) {
        if (depart !== cible && formes[depart] !== formes[cible]) {
          return { depart, cible };
        }
      }
    }
    return null;
  }

  /**
   * Mettre tout un groupe nominal au pluriel, ou au singulier.
   *
   * C'est la notion `accord_gn` du module, qui fait deja exactement cela : « le petit
   * chat noir » vers « les petits chats noirs ». Les deux sens sont gardes parce que
   * c'est le meme savoir : savoir enlever les marques vaut savoir les poser, et l'enfant
   * qui n'ecrit que des pluriels finit par ajouter des `s` partout.
   */
  private async accordsPluriel(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.accordsService.construireQuestions({
            difficulty: 'hard',
            question_types: ['accord_gn'],
          })
        ).resultat.questions,
    );

    return questions.map((q) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: { consigne: q.display, depart: q.depart, reponse: q.answer },
    }));
  }

  /**
   * Un groupe MAL accorde, a corriger. N'existe que sur le papier.
   *
   * Le pendant exact de l'operation posee fausse : au lieu de produire la bonne forme, on
   * relit une forme donnee pour y trouver la faute. Ce n'est pas le meme geste, et c'est
   * celui qu'on fait en se relisant, ce que l'ecran ne demande jamais.
   */
  private async accordsCorriger(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const questions = await this.tirer(
      ligne.nombre,
      (q: { item_key: string }) => q.item_key,
      async () =>
        (
          await this.accordsService.construireQuestions({
            difficulty: 'hard',
            question_types: ['accord_gn'],
          })
        ).resultat.questions,
    );

    const items: ItemImprime[] = [];
    for (const question of questions) {
      const fautif = this.fausserUnAccord(question.answer);
      if (!fautif) continue;
      items.push({
        module: ligne.module,
        exercice: ligne.exercices[0],
        donnees: { fautif, reponse: question.answer },
      });
    }
    return items;
  }

  /**
   * Enleve ou ajoute UNE marque de pluriel, sur un seul mot.
   *
   * Jamais le premier mot : le determinant porte le nombre a lui seul, et « le chats
   * noirs » se repere sans lire la suite. Jamais un mot en `-x` non plus : « chevaux »
   * ampute donne « chevau », qui n'est pas une faute d'accord mais du charabia, et
   * l'enfant corrigerait un mot qui n'existe pas au lieu d'une regle.
   *
   * Une seule marque changee : deux erreurs donneraient l'impression d'un groupe ecrit au
   * hasard plutot que d'un accord rate.
   */
  private fausserUnAccord(texte: string): string | null {
    const mots = texte.split(' ');
    const candidats: number[] = [];
    for (let i = 1; i < mots.length; i++) {
      if (!mots[i].endsWith('x')) candidats.push(i);
    }
    if (candidats.length === 0) return null;

    const rang = candidats[Math.floor(Math.random() * candidats.length)];
    const mot = mots[rang];
    mots[rang] = mot.endsWith('s') ? mot.slice(0, -1) : `${mot}s`;
    const fautif = mots.join(' ');
    return fautif === texte ? null : fautif;
  }

  /**
   * Une phrase a trier par nature : un mot, une colonne. N'existe que sur le papier.
   *
   * A l'ecran la meme phrase se joue en touchant les mots un par un, une notion a la
   * fois. Sur la feuille on recopie chaque mot dans la colonne qui lui revient, et le tri
   * se voit d'un coup d'oeil : les colonnes vides sont une reponse elles aussi, ce que
   * l'ecran ne montre jamais.
   */
  private async grammaireTrier(
    ligne: LigneComposition,
  ): Promise<ItemImprime[]> {
    const tris = await this.siDisponible(
      this.grammaireService.construireTri(ligne.nombre),
    );
    if (!tris) return [];
    return tris.map((tri) => ({
      module: ligne.module,
      exercice: ligne.exercices[0],
      donnees: {
        mots: tri.phrase.map((mot) => ({
          mot: mot.mot,
          apres: mot.apres,
          colle: mot.colle,
        })),
        colonnes: tri.natures,
        reponse: tri.natures.map((nature) => ({
          nature,
          mots: tri.phrase
            .filter((mot) => mot.nature === nature)
            .map((mot) => mot.mot),
        })),
      },
    }));
  }
}
