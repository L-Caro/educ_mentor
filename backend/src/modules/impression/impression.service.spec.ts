import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { TablesService } from '../tables/tables.service';
import { CalculService } from '../calcul/calcul.service';
import { PoseService } from '../pose/pose.service';
import { DicteeService } from '../dictee/dictee.service';
import { ConjugaisonService } from '../conjugaison/conjugaison.service';
import { AccordsService } from '../accords/accords.service';
import { GrammaireService } from '../grammaire/grammaire.service';
import { NumerationService } from '../numeration/numeration.service';
import { HeureService } from '../heure/heure.service';
import { MonnaieService } from '../monnaie/monnaie.service';
import { GeometrieService } from '../geometrie/geometrie.service';
import { CompteService } from '../compte/compte.service';
import { LectureService } from '../lecture/lecture.service';
import { AlphabetService } from '../alphabet/alphabet.service';
import { SolfegeService } from '../solfege/solfege.service';
import { MAXIMUM_ITEMS } from './impression.types';
import { lireRomain } from '../numeration/numeration.romains';

/** Le vivier du module d'ordre alphabetique, tel qu'il le rendrait : des mots MELANGES,
 * et la reponse a cote. */
const QUESTIONS_ALPHABET = [
  {
    item_key: 'ranger:chat|cheval|chien',
    type: 'ranger',
    skill_key: 'ranger',
    consigne: 'Range ces mots dans l\u2019ordre alphabétique.',
    mots: ['chien', 'chat', 'cheval'],
    reponse: ['chat', 'cheval', 'chien'],
    aPlacer: null,
    communes: 2,
  },
  {
    item_key: 'intercaler:chaton|chatte',
    type: 'intercaler',
    skill_key: 'intercaler',
    consigne: 'Où se range « chatouille » ?',
    mots: ['chaton', 'chatte'],
    reponse: ['1'],
    aPlacer: 'chatouille',
    communes: 4,
  },
];

describe('ImpressionService', () => {
  let service: ImpressionService;
  let tables: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let calcul: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let pose: { construireQuestions: jest.Mock; startSession: jest.Mock };
  let dictee: { construireItems: jest.Mock; startSession: jest.Mock };
  let alphabet: { construireQuestions: jest.Mock; startSession: jest.Mock };

  /** Un lot de faits distincts, comme en rendrait une vraie seance. */
  const faits = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      fact_id: `f${i}`,
      display_a: i + 2,
      display_b: 3,
      answer: (i + 2) * 3,
      choices: [],
    }));

  beforeEach(async () => {
    tables = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: faits(10),
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    calcul = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [{ operation: '24 + 17', answer: 41, choices: [] }],
          timer_seconds: 0,
          is_unlimited: false,
          min_value: 0,
          max_value: 20,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };

    pose = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [
            {
              skill_key: 'addition_3',
              operation: 'addition',
              operands: [247, 138],
              answer: 385,
              columns: 4,
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
          method: 'compensation',
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    dictee = {
      construireItems: jest.fn().mockResolvedValue({
        niveau: 'ce1',
        preparee: false,
        total_words: 6,
        items: [
          { id: '1', contenu: 'Le chat dort.', notions: [] },
          { id: '2', contenu: 'Les oiseaux chantent.', notions: [] },
        ],
      }),
      startSession: jest.fn(),
    };

    const conjugaison = {
      construireQuestions: jest.fn().mockResolvedValue({
        resultat: {
          questions: [
            {
              infinitif: 'chanter',
              tense: 'présent',
              pronoun: 'je',
              conjugated: 'chante',
              groupe: '1',
              direction: 'forward',
              choices: [],
              forms: {
                je: 'chante',
                tu: 'chantes',
                il: 'chante',
                elle: 'chante',
                on: 'chante',
                nous: 'chantons',
                vous: 'chantez',
                ils: 'chantent',
                elles: 'chantent',
              },
            },
          ],
          timer_seconds: 0,
          is_unlimited: false,
        },
        seance: {},
      }),
      startSession: jest.fn(),
    };
    // Deux questions par lot, pour que `tirer` ait de quoi ecarter les doublons sans
    // tourner vingt fois.
    alphabet = {
      construireQuestions: jest.fn().mockImplementation(
        // Le vrai service ne rend QUE les types demandes : un mock qui les melange
        // laisserait passer une ligne qui etiquette un rangement en « intercaler ».
        (dto: { types?: string[] }) => ({
          resultat: {
            questions: QUESTIONS_ALPHABET.filter(
              (q) => !dto.types?.length || dto.types.includes(q.type),
            ),
            timer_seconds: 0,
            is_unlimited: false,
          },
        }),
      ),
      startSession: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ImpressionService,
        { provide: TablesService, useValue: tables },
        { provide: CalculService, useValue: calcul },
        { provide: PoseService, useValue: pose },
        { provide: DicteeService, useValue: dictee },
        { provide: ConjugaisonService, useValue: conjugaison },
        {
          provide: AccordsService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    item_key: 'accord_gn_chat_petit_pluriel',
                    type: 'accord_gn',
                    skill_key: 'accord_gn',
                    display: 'Écris tout le groupe nominal au pluriel.',
                    depart: 'le petit chat',
                    avant: '',
                    apres: '',
                    indice: null,
                    choices: [],
                    answer: 'les petits chats',
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: GrammaireService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
            }),
            construireTri: jest.fn().mockResolvedValue([
              {
                phrase: [
                  { mot: 'Le', apres: '', colle: false, nature: 'determinant' },
                  {
                    mot: 'chat',
                    apres: '',
                    colle: false,
                    nature: 'nom_commun',
                  },
                  { mot: 'dort', apres: '.', colle: false, nature: 'verbe' },
                ],
                natures: ['determinant', 'nom_commun', 'verbe', 'adjectif'],
              },
            ]),
            startSession: jest.fn(),
          },
        },
        {
          provide: HeureService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    hour: 3,
                    minute: 45,
                    answer_value: 225,
                    numeral_type: 'arabic',
                    choices: [],
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: MonnaieService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    type: 'rendre',
                    price: 340,
                    payment: 500,
                    answer: 160,
                    choices: [],
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
              denominations: [10, 20, 50, 100, 200],
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: GeometrieService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    item_key: 'nom_figure:carre',
                    type: 'nom_figure',
                    skill_key: 'carre',
                    display: 'Quelle est cette figure ?',
                    shape: 'cube',
                    shapeB: null,
                    choices: [],
                    answer: 'cube',
                    shape_meta: {
                      key: 'cube',
                      type: 'solide',
                      cotes: null,
                      sommets: 8,
                      faces: 6,
                      aretes: 12,
                    },
                    shape_b_meta: null,
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
              figures: [
                { key: 'carre' },
                { key: 'rectangle' },
                { key: 'pentagone' },
                { key: 'cercle' },
              ],
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: CompteService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [
                  {
                    item_key: 'compte:100:75,25',
                    cible: 100,
                    plaques: [75, 25, 3, 8, 1, 10],
                    solution: [{ a: 75, operation: '+', b: 25, resultat: 100 }],
                  },
                ],
                timer_seconds: 0,
                is_unlimited: false,
              },
              seance: {},
            }),
            startSession: jest.fn(),
          },
        },
        {
          provide: AlphabetService,
          useValue: alphabet,
        },
        // Le vrai service : il ne dépend de rien, ne touche à aucune base, et le simuler
        // reviendrait à réécrire ses règles une troisième fois.
        SolfegeService,
        {
          provide: LectureService,
          useValue: {
            construireLecture: jest.fn().mockResolvedValue({
              titre: 'Le renard',
              contenu: 'Un renard passait sous la haie.',
              questions: [
                { question: 'Qui passe ?', reponse: 'le renard' },
                { question: 'Où ?', reponse: 'sous la haie' },
              ],
            }),
            createSession: jest.fn(),
          },
        },
        {
          provide: NumerationService,
          useValue: {
            construireQuestions: jest.fn().mockResolvedValue({
              resultat: {
                questions: [],
                timer_seconds: 0,
                is_unlimited: false,
              },
              positions: ['u', 'd', 'c', 'm'],
            }),
            // L'administration a ouvert les chiffres romains jusqu'a 100.
            getPalierRomain: jest.fn().mockResolvedValue(100),
            createSession: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(ImpressionService);
  });

  it('n’ENREGISTRE rien : jamais de seance, jamais de progression', async () => {
    // Une feuille imprimee n'est pas une seance a l'ecran, et la voir dans « seances
    // recentes » brouillerait ce que l'adulte y lit. Surtout, le travail sur papier n'est
    // pas mesure : le compter dans la progression ferait mentir la mesure.
    await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 5 },
    ]);
    for (const service of [tables, calcul, pose, dictee]) {
      expect(service.startSession).not.toHaveBeenCalled();
    }
  });

  it('rend exactement le nombre d’exercices demande', async () => {
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 6 },
    ]);
    expect(items).toHaveLength(6);
    // Un ITEM porte un seul type : c'est la ligne de composition qui en coche plusieurs.
    expect(items[0]).toMatchObject({ module: 'tables', exercice: 'produit' });
  });

  it('melange les modules sur une meme feuille, dans l’ordre demande', async () => {
    // C'est la raison d'etre du service : trois tables et deux calculs sur la meme page.
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 3 },
      { module: 'calcul-mental', exercices: ['operation'], nombre: 1 },
    ]);
    expect(items.map((i) => i.module)).toEqual([
      'tables',
      'tables',
      'tables',
      'calcul-mental',
    ]);
  });

  it('ne pose JAMAIS deux fois le meme exercice sur une feuille', async () => {
    // Deux fois « 7 x 8 » sur la meme page, c'est une ligne perdue.
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 10 },
    ]);
    const cles = items.map(
      (i) => `${String(i.donnees.a)}x${String(i.donnees.b)}`,
    );
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('rend une feuille plus courte plutot que de tourner sans fin', async () => {
    // Une seule table cochee, vingt multiplications voulues : le vivier est plus petit
    // que la demande. Mieux vaut une feuille incomplete qu'une requete qui ne repond pas.
    tables.construireQuestions.mockResolvedValue({
      resultat: { questions: faits(3), timer_seconds: 0, is_unlimited: false },
      seance: {},
    });
    const items = await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 20 },
    ]);
    expect(items).toHaveLength(3);
  });

  it('refuse une feuille demesuree', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercices: ['produit'], nombre: MAXIMUM_ITEMS + 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un exercice qu’aucun module ne fournit', async () => {
    await expect(
      service.composer([
        { module: 'tables', exercices: ['racine_carree'], nombre: 1 },
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('demande la saisie LIBRE, pas un QCM', async () => {
    // Sur le papier on ecrit la reponse, on ne coche pas : engendrer des choix serait au
    // mieux inutile, au pire imprime par erreur.
    await service.composer([
      { module: 'tables', exercices: ['produit'], nombre: 2 },
    ]);
    expect(tables.construireQuestions).toHaveBeenCalledWith(
      expect.objectContaining({ difficulty: 'hard' }),
    );
  });

  it('ne rend qu’UNE dictee, quel que soit le nombre demande', async () => {
    // Une dictee n'est pas un exercice parmi d'autres : c'est un bloc de lignes que
    // l'adulte dicte a voix haute. « Trois dictees » sur une feuille n'aurait pas de
    // sens ; c'est la longueur qui varie, pas le nombre.
    const items = await service.composer([
      { module: 'dictee', exercices: ['dictee'], nombre: 3 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].donnees.phrases).toEqual([
      'Le chat dort.',
      'Les oiseaux chantent.',
    ]);
  });

  it('n’envoie PAS les retenues avec une operation posee', async () => {
    // Elles ne sont pas imprimees : les transmettre inviterait a les dessiner un jour
    // par megarde.
    const items = await service.composer([
      { module: 'pose', exercices: ['operation'], nombre: 1 },
    ]);
    expect(items[0].donnees).not.toHaveProperty('retenues');
    expect(items[0].donnees.operandes).toEqual([247, 138]);
  });

  it('sort les pronoms les plus INSTRUCTIFS quand on en demande moins de six', async () => {
    // `je`, `tu` et `il` se ressemblent trop pour apprendre quoi que ce soit. A trois
    // formes, on veut `je`, `nous` et `ils` : la premiere personne, la terminaison la
    // plus irreguliere, et celle qu'on oublie.
    const items = await service.composer([
      {
        module: 'conjugaison',
        exercices: ['forme'],
        nombre: 1,
        options: { formes: 3 },
      },
    ]);
    const lignes = items[0].donnees.lignes as { pronom: string }[];
    expect(lignes.map((l) => l.pronom)).toEqual(['je', 'nous', 'ils']);
  });

  it('garde l’ordre du TABLEAU pour l’affichage, pas l’ordre d’utilite', async () => {
    // Une conjugaison qui commencerait par `nous` se lit mal.
    const items = await service.composer([
      {
        module: 'conjugaison',
        exercices: ['forme'],
        nombre: 1,
        options: { formes: 6 },
      },
    ]);
    const lignes = items[0].donnees.lignes as { pronom: string }[];
    expect(lignes.map((l) => l.pronom)).toEqual([
      'je',
      'tu',
      'il',
      'nous',
      'vous',
      'ils',
    ]);
  });

  it('borne le nombre de formes entre une et six', async () => {
    for (const [demande, attendu] of [
      [0, 1],
      [9, 6],
    ] as const) {
      const items = await service.composer([
        {
          module: 'conjugaison',
          exercices: ['forme'],
          nombre: 1,
          options: { formes: demande },
        },
      ]);
      const lignes = items[0].donnees.lignes as unknown[];
      expect({ demande, formes: lignes.length }).toEqual({
        demande,
        formes: attendu,
      });
    }
  });

  it('ne fait JAMAIS passer une duree apres minuit', async () => {
    // « De 23 h 40 a 0 h 20 » demanderait de compter a rebours sur un cycle qu'elle ne
    // manipule pas encore. Le tirage doit rester dans la journee, pas seulement le plus
    // souvent : c'est la borne du generateur qu'on verifie, pas sa chance.
    const items = await service.composer([
      { module: 'heure', exercices: ['durees'], nombre: 20 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const [heures] = String(item.donnees.fin).split(' h ');
      expect(Number(heures)).toBeLessThan(23);
    }
  });

  it('ecrit les minutes d’une heure sur DEUX chiffres', async () => {
    // « 9 h 5 » se lit mal, et ce n'est pas ce qu'affiche un reveil.
    const items = await service.composer([
      { module: 'heure', exercices: ['durees'], nombre: 15 },
    ]);
    for (const item of items) {
      expect(String(item.donnees.depart)).toMatch(/^\d{1,2} h \d{2}$/);
    }
  });

  it('tire le cadran chez le module, sans generateur parallele', async () => {
    // Lire l'heure et la dessiner sont le meme savoir pris dans les deux sens : un second
    // tirage a nous divergerait un jour de celui de l'ecran.
    const items = await service.composer([
      { module: 'heure', exercices: ['dessiner'], nombre: 1 },
    ]);
    expect(items[0].donnees).toMatchObject({ heure: 3, minute: 45 });
  });

  it('ne propose a entourer QUE des pieces ouvertes par l’administration', async () => {
    // Faire entourer un billet de cinquante alors que le jeu s'arrete a dix
    // contournerait le seul reglage qui decide de ce que l'enfant voit, exactement comme
    // le ferait le peage.
    const ouvertes = [10, 20, 50, 100, 200];
    const items = await service.composer([
      { module: 'monnaie', exercices: ['entourer'], nombre: 8 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      for (const piece of item.donnees.palette as number[]) {
        expect(ouvertes).toContain(piece);
      }
    }
  });

  it('batit la cible A PARTIR des pieces, pour qu’elle soit toujours atteignable', async () => {
    // Un montant tire au hasard puis decompose peut n'etre atteint par aucun
    // sous-ensemble de la palette : l'exercice serait insoluble sans que rien ne le dise.
    const items = await service.composer([
      { module: 'monnaie', exercices: ['entourer'], nombre: 8 },
    ]);
    for (const item of items) {
      const solution = item.donnees.solution as number[];
      const somme = solution.reduce((a, b) => a + b, 0);
      expect(somme).toBe(item.donnees.cible);
      // Chaque piece de la solution doit exister dans la palette a entourer.
      const reste = [...(item.donnees.palette as number[])];
      for (const piece of solution) {
        const ou = reste.indexOf(piece);
        expect(ou).toBeGreaterThanOrEqual(0);
        reste.splice(ou, 1);
      }
    }
  });

  it('ne fait tracer que des figures dont les sommets tombent sur les CARREAUX', async () => {
    // Un pentagone regulier sur un quadrillage de cinq millimetres n'est pas un exercice
    // de CE1, c'est une construction au compas. Le cercle non plus.
    const items = await service.composer([
      { module: 'geometrie', exercices: ['tracer'], nombre: 10 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(['carre', 'rectangle', 'triangleRectangle']).toContain(
        item.donnees.figure,
      );
    }
  });

  it('laisse de la place AUTOUR du trace a faire', async () => {
    // Un quadrillage cale sur la figure ne laisse pas la place de se tromper puis de
    // recommencer, et un trace rate tient alors sur le bord de la feuille.
    const items = await service.composer([
      { module: 'geometrie', exercices: ['tracer'], nombre: 10 },
    ]);
    for (const item of items) {
      expect(Number(item.donnees.colonnes)).toBeGreaterThan(
        Number(item.donnees.largeur),
      );
      expect(Number(item.donnees.lignes)).toBeGreaterThan(
        Number(item.donnees.hauteur),
      );
    }
  });

  it('donne un carre AUSSI haut que large, un rectangle jamais', async () => {
    // Un « rectangle » de quatre sur quatre est un carre : la consigne et la reponse se
    // contrediraient sur la meme feuille.
    const items = await service.composer([
      { module: 'geometrie', exercices: ['tracer'], nombre: 12 },
    ]);
    for (const item of items) {
      const { figure, largeur, hauteur } = item.donnees;
      if (figure === 'carre') expect(largeur).toBe(hauteur);
      else expect(largeur).not.toBe(hauteur);
    }
  });

  it('ne rend qu’UN texte de lecture, quel que soit le nombre demande', async () => {
    // Comme la dictee : un texte n'est pas un exercice parmi d'autres mais un bloc, et
    // « trois lectures » sur une meme feuille n'aurait pas de sens.
    const items = await service.composer([
      { module: 'lecture', exercices: ['texte'], nombre: 4 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].donnees.questions).toEqual(['Qui passe ?', 'Où ?']);
  });

  it('donne autant de LIGNES que d’etapes dans la solution du compte', async () => {
    // Une ligne en trop se lit comme une etape manquante : la feuille laisserait croire
    // qu'on n'a pas fini.
    const items = await service.composer([
      { module: 'compte', exercices: ['tirage'], nombre: 1 },
    ]);
    expect(items[0].donnees.etapes).toBe(1);
    expect(items[0].donnees.solution).toEqual(['75 + 25 = 100']);
  });

  it('ne transpose jamais vers un pronom qui se conjugue PAREIL', async () => {
    // « il » vers « elle » ne demande de changer rien du tout : le mot « transpose »
    // perdrait son sens, et l'enfant recopierait.
    const items = await service.composer([
      { module: 'conjugaison', exercices: ['transposer'], nombre: 1 },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].donnees.departForme).not.toBe(items[0].donnees.reponse);
    expect(items[0].donnees.departPronom).not.toBe(
      items[0].donnees.ciblePronom,
    );
  });

  it('ne fausse JAMAIS le premier mot d’un groupe a corriger', async () => {
    // Le determinant porte le nombre a lui seul : « le chats noirs » se repere sans lire
    // la suite, et l'exercice ne demanderait plus de verifier l'accord.
    for (let essai = 0; essai < 20; essai++) {
      const items = await service.composer([
        { module: 'accords', exercices: ['corriger'], nombre: 1 },
      ]);
      const fautif = String(items[0].donnees.fautif).split(' ');
      expect(fautif[0]).toBe('les');
      // Une seule marque changee : deux erreurs feraient un groupe ecrit au hasard.
      const juste = String(items[0].donnees.reponse).split(' ');
      const differences = fautif.filter((mot, i) => mot !== juste[i]);
      expect(differences).toHaveLength(1);
    }
  });

  it('garde les colonnes VIDES du tri : c’est une reponse aussi', async () => {
    // Une phrase sans adjectif n'enleve pas la colonne des adjectifs. Constater qu'elle
    // reste vide fait partie du tri.
    const items = await service.composer([
      { module: 'grammaire', exercices: ['trier'], nombre: 1 },
    ]);
    const reponse = items[0].donnees.reponse as {
      nature: string;
      mots: string[];
    }[];
    expect(reponse.map((c) => c.nature)).toEqual([
      'determinant',
      'nom_commun',
      'verbe',
      'adjectif',
    ]);
    expect(reponse.find((c) => c.nature === 'adjectif')?.mots).toEqual([]);
  });

  /** Refait parler le service de calcul pose avec le resultat voulu. Les valeurs piegeuses
   * commencent par 1 : c'est la seule famille ou le defaut se produisait. */
  const avecResultat = (answer: number) => {
    pose.construireQuestions.mockResolvedValue({
      resultat: {
        questions: [
          {
            skill_key: 'soustraction_3',
            operation: 'soustraction',
            operands: [696, 594],
            answer,
            columns: String(answer).length,
          },
        ],
        timer_seconds: 0,
        is_unlimited: false,
        method: 'compensation',
      },
      seance: {},
    });
  };

  it('rend une operation VRAIMENT fausse a corriger', async () => {
    // « 696 − 594 = 102 » etait propose comme faux alors qu'il est juste : la version
    // precedente retranchait un au premier chiffre, obtenait zero, et le ramenait a un,
    // c'est-a-dire a sa valeur d'origine. L'enfant cherchait une faute qui n'existait pas.
    //
    // Les valeurs testees commencent toutes par 1, et ce n'est pas un hasard : c'est la
    // SEULE famille ou le defaut se produisait. Un premier test sur « 385 » passait avec
    // le code fautif, ce qui est pire que pas de test.
    for (const resultat of [102, 130, 1000, 105, 1234]) {
      avecResultat(resultat);
      for (let essai = 0; essai < 40; essai++) {
        const items = await service.composer([
          { module: 'pose', exercices: ['erreur'], nombre: 1 },
        ]);
        expect({ resultat, faux: items[0].donnees.faux }).not.toEqual({
          resultat,
          faux: resultat,
        });
      }
    }
  });

  it('garde au faux resultat le MEME nombre de chiffres', async () => {
    // Un zero en tete transformerait « 102 » en « 02 » : l'erreur se verrait a la
    // longueur, sans avoir a refaire l'operation, qui est pourtant tout l'exercice.
    for (const resultat of [102, 1000, 385]) {
      avecResultat(resultat);
      for (let essai = 0; essai < 30; essai++) {
        const items = await service.composer([
          { module: 'pose', exercices: ['erreur'], nombre: 1 },
        ]);
        expect(String(items[0].donnees.faux)).toHaveLength(
          String(resultat).length,
        );
      }
    }
  });

  it('demande TOUS les denombrements d’une figure, pas un seul', async () => {
    // A l'ecran on pose une question a la fois, parce qu'il faut quatre propositions a
    // toucher. Sur le papier la figure est deja dessinee : n'en tirer qu'un nombre gache
    // le dessin, et compter faces, sommets et aretes ensemble montre qu'ils different.
    const items = await service.composer([
      { module: 'geometrie', exercices: ['cotes_sommets'], nombre: 1 },
    ]);
    expect(items[0].donnees.attributs).toEqual([
      { nom: 'faces', reponse: 6 },
      { nom: 'sommets', reponse: 8 },
      { nom: 'arêtes', reponse: 12 },
    ]);
  });

  it('donne a barrer des ecritures dont certaines VALENT les briques et d’autres non', async () => {
    const items = await service.composer([
      { module: 'numeration', exercices: ['ecritures'], nombre: 6 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const { valeur, centaines, dizaines, unites, ecritures } =
        item.donnees as {
          valeur: number;
          centaines: number;
          dizaines: number;
          unites: number;
          ecritures: { texte: string; juste: boolean }[];
        };
      // Les briques dessinees sont bien celles du nombre : sinon toute la feuille ment.
      expect(centaines * 100 + dizaines * 10 + unites).toBe(valeur);
      expect(ecritures.some((ecriture) => ecriture.juste)).toBe(true);
      expect(ecritures.some((ecriture) => !ecriture.juste)).toBe(true);
    }
  });

  it('donne a barrer des collections dont certaines VALENT l’ecriture et d’autres non', async () => {
    const items = await service.composer([
      { module: 'numeration', exercices: ['collections'], nombre: 6 },
    ]);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      const { collections } = item.donnees as {
        collections: { juste: boolean }[];
      };
      expect(collections.some((collection) => collection.juste)).toBe(true);
      expect(collections.some((collection) => !collection.juste)).toBe(true);
      expect(typeof item.donnees.ecriture).toBe('string');
    }
  });

  it('ne repete pas un meme nombre dans les exercices « barre ce qui ne va pas »', async () => {
    const items = await service.composer([
      { module: 'numeration', exercices: ['ecritures'], nombre: 8 },
    ]);
    const valeurs = items.map((item) => item.donnees.valeur);
    expect(new Set(valeurs).size).toBe(valeurs.length);
  });

  describe('chiffres romains', () => {
    it('lit un nombre romain qui vaut bien la reponse, IIII compris', async () => {
      const items = await service.composer([
        { module: 'numeration', exercices: ['romains_lecture'], nombre: 39 },
      ]);
      const romains = items.map((item) => String(item.donnees.romain));
      expect(romains.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(lireRomain(String(item.donnees.romain))).toBe(
          item.donnees.valeur,
        );
      }
    });

    it('donne toutes les ecritures acceptees au corrige de l’ecriture', async () => {
      const items = await service.composer([
        { module: 'numeration', exercices: ['romains_ecriture'], nombre: 20 },
      ]);
      for (const item of items) {
        const reponses = item.donnees.reponses as string[];
        expect(reponses.length).toBeGreaterThan(0);
        for (const reponse of reponses) {
          expect(lireRomain(reponse)).toBe(item.donnees.valeur);
        }
      }
    });

    it('range cinq nombres romains proches, dans le bon ordre au corrige', async () => {
      const items = await service.composer([
        { module: 'numeration', exercices: ['romains_ranger'], nombre: 10 },
      ]);
      for (const item of items) {
        const melanges = item.donnees.romains as string[];
        const reponse = item.donnees.reponse as string[];
        expect(new Set(melanges).size).toBe(5);
        expect([...melanges].sort()).toEqual([...reponse].sort());
        const valeurs = reponse.map((romain) => lireRomain(romain)!);
        expect(valeurs).toEqual([...valeurs].sort((a, b) => a - b));
        expect(Math.max(...valeurs) - Math.min(...valeurs)).toBeLessThanOrEqual(
          20,
        );
      }
    });

    it('donne a barrer des ecritures romaines dont certaines valent le nombre', async () => {
      const items = await service.composer([
        { module: 'numeration', exercices: ['romains_barrer'], nombre: 10 },
      ]);
      for (const item of items) {
        const ecritures = item.donnees.ecritures as {
          texte: string;
          juste: boolean;
        }[];
        expect(ecritures.some((ecriture) => ecriture.juste)).toBe(true);
        expect(ecritures.some((ecriture) => !ecriture.juste)).toBe(true);
        for (const { texte, juste } of ecritures) {
          expect(lireRomain(texte) === item.donnees.valeur).toBe(juste);
        }
      }
    });

    it('ne depasse JAMAIS le palier ouvert par l’administration', async () => {
      // Ouvert : 100. Demander 1 000 ne doit pas contourner le reglage.
      const items = await service.composer([
        {
          module: 'numeration',
          exercices: ['romains_ecriture'],
          nombre: 60,
          options: { palier: '1000' },
        },
      ]);
      for (const item of items) {
        expect(item.donnees.valeur as number).toBeLessThanOrEqual(100);
      }
    });

    it('respecte un palier plus bas que celui ouvert, alphabet compris', async () => {
      const items = await service.composer([
        {
          module: 'numeration',
          exercices: ['romains_barrer'],
          nombre: 39,
          options: { palier: '39' },
        },
      ]);
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.donnees.valeur as number).toBeLessThanOrEqual(39);
        for (const { texte } of item.donnees.ecritures as { texte: string }[]) {
          expect(texte).toMatch(/^[IVX]+$/);
        }
      }
    });
  });
  describe('ordre alphabétique', () => {
    it('transmet les mots, le mot a placer et la reponse, sans rien reordonner', async () => {
      const items = await service.composer([
        {
          module: 'alphabet',
          exercices: ['ranger', 'intercaler'],
          nombre: 2,
          options: { communes: 2, combien: 3 },
        },
      ]);

      expect(items).toHaveLength(2);
      const ranger = items.find((i) => i.exercice === 'ranger');
      // Les mots partent MELANGES : les ranger ici viderait l'exercice de sa substance,
      // et c'est exactement ce qu'une feuille deja rangee donnerait a l'enfant.
      expect(ranger?.donnees.mots).toEqual(['chien', 'chat', 'cheval']);
      expect(ranger?.donnees.reponse).toEqual(['chat', 'cheval', 'chien']);

      const intercaler = items.find((i) => i.exercice === 'intercaler');
      expect(intercaler?.donnees.aPlacer).toBe('chatouille');
      expect(intercaler?.donnees.reponse).toEqual(['1']);
    });

    it('passe la profondeur de comparaison au module', async () => {
      await service.composer([
        {
          module: 'alphabet',
          exercices: ['ranger'],
          nombre: 1,
          options: { communes: 4, combien: 6 },
        },
      ]);
      expect(alphabet.construireQuestions).toHaveBeenCalledWith(
        expect.objectContaining({ communes: 4, combien: 6, types: ['ranger'] }),
      );
    });
  });
});
