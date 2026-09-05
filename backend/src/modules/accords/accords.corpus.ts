/** Le corpus morphologique du module accords : des noms avec leurs deux nombres et leur
 * genre, des adjectifs avec leurs quatre formes, des verbes avec leurs deux personnes.
 *
 * En CODE et non en base, pour la même raison que `grammaire.corpus.ts` : une forme fausse
 * n'est pas un contenu médiocre, c'est une orthographe apprise à l'envers. Et ici le risque
 * est plus grand encore, parce que la réponse attendue EST une orthographe : « des chevals »
 * saisi dans un textarea deviendrait la bonne réponse.
 *
 * ── Le corpus va jusqu'au CM2, la porte décide ────────────────────────────────────────
 *
 * Il contient toutes les familles morphologiques du CE1 au CM2 : les pluriels en -aux et
 * en -oux, les féminins irréguliers, les adjectifs invariables au masculin pluriel. Rien
 * n'est écarté sous prétexte que la fiche du CE1 s'arrête avant.
 *
 * Ce qui est JOUABLE est décidé ailleurs : `accords.familles.ts` déclare chaque famille
 * avec la classe où elle s'apprend, et l'administration ouvre celles qui ont été vues —
 * comme les figures de la géométrie. Une famille fermée n'apparaît jamais dans une
 * question, ni comme distracteur.
 *
 * La famille d'un mot est DÉRIVÉE de ses formes, jamais annotée ici : « cheval / chevaux »
 * est un pluriel en -aux parce qu'il se termine par -aux. Une annotation de plus serait
 * une occasion de plus de se tromper.
 */

export type Genre = 'masculin' | 'feminin';

/** La catégorie sémantique d'un nom. Elle ne sert pas la grammaire — l'accord de
 * « chapeau » ne dépend pas de ce qu'est un chapeau — mais elle empêche le générateur de
 * produire « les chapeaux sucrés » ou « les chiens dessinent ». Un énoncé absurde reste
 * grammaticalement valide et déplace l'attention de l'accord vers la phrase : l'enfant
 * s'arrête sur le nez content au lieu de compter les s. */
export type Categorie =
  | 'personne'
  | 'animal'
  | 'objet'
  | 'aliment'
  | 'lieu'
  | 'nature'
  | 'corps'
  | 'abstrait';

/** La famille de sens d'un adjectif. Deux adjectifs de la même famille dans un groupe
 * nominal se contredisent : « le chapeau vert rouge ». */
export type FamilleAdjectif =
  | 'taille'
  | 'couleur'
  | 'caractere'
  | 'etat'
  | 'forme'
  | 'gout'
  | 'age'
  | 'vitesse'
  | 'aspect';
export type Nombre = 'singulier' | 'pluriel';
export type Article = 'defini' | 'indefini';

export interface NomMeta {
  key: string;
  singulier: string;
  pluriel: string;
  genre: Genre;
  /** `le`/`la` devient `l’` devant ce nom. */
  elision: boolean;
  categorie: Categorie;
}

export interface AdjectifMeta {
  key: string;
  ms: string;
  fs: string;
  mp: string;
  fp: string;
  /** Sa place par rapport au nom. Se tromper produit « un chat petit ». */
  place: 'avant' | 'apres';
  /** Les catégories de noms qu'il peut qualifier sans absurdité. */
  sappliqueA: Categorie[];
  famille: FamilleAdjectif;
}

export interface VerbeMeta {
  key: string;
  infinitif: string;
  /** 3e personne du singulier du présent. */
  s3: string;
  /** 3e personne du pluriel du présent. */
  p3: string;
  /** La suite de la phrase après le verbe — portée par le verbe pour que la phrase soit
   * toujours correcte : « les chats prennent dans le jardin » ne se dit pas. */
  suite: string;
  /** Les deux formes se PRONONCENT pareil. C'est là que l'accord est vraiment difficile,
   * et c'est ce que dit la fiche : « il dort et ils dorment se prononcent presque pareil ».
   * Contre-intuitivement, les verbes irréguliers (est/sont) sont les plus FACILES : la
   * différence s'entend. */
  homophone: boolean;
  /** Les catégories de sujets qui peuvent faire cette action. « Les chiens dessinent un
   * soleil » est correct et faux. */
  sujets: Categorie[];
}

// ─── Constructeurs ──────────────────────────────────────────────────────────

const VOYELLES = /^[aeiouàâäéèêëîïôöùûü]/i;

/** `elision` se déduit de la voyelle initiale ; à passer explicitement pour un h muet
 * (l’histoire) ou aspiré (le hibou), que rien dans l'orthographe ne distingue. */
function nom(
  key: string,
  singulier: string,
  pluriel: string,
  genre: Genre,
  categorie: Categorie,
  options: { elision?: boolean } = {},
): NomMeta {
  return {
    key,
    singulier,
    pluriel,
    genre,
    elision: options.elision ?? VOYELLES.test(singulier),
    categorie,
  };
}

function adjectif(
  key: string,
  formes: [string, string, string, string],
  place: 'avant' | 'apres',
  famille: FamilleAdjectif,
  sappliqueA: Categorie[],
): AdjectifMeta {
  const [ms, fs, mp, fp] = formes;
  return { key, ms, fs, mp, fp, place, sappliqueA, famille };
}

function verbe(
  key: string,
  infinitif: string,
  s3: string,
  p3: string,
  suite: string,
  homophone: boolean,
  sujets: Categorie[],
): VerbeMeta {
  return { key, infinitif, s3, p3, suite, homophone, sujets };
}

// ─── Noms ───────────────────────────────────────────────────────────────────

export const NOMS: NomMeta[] = [
  // pluriel régulier en -s
  nom('chat', 'chat', 'chats', 'masculin', 'animal'),
  nom('chien', 'chien', 'chiens', 'masculin', 'animal'),
  nom('ami', 'ami', 'amis', 'masculin', 'personne'),
  nom('fille', 'fille', 'filles', 'feminin', 'personne'),
  nom('jardin', 'jardin', 'jardins', 'masculin', 'lieu'),
  nom('maison', 'maison', 'maisons', 'feminin', 'lieu'),
  nom('ecole', 'école', 'écoles', 'feminin', 'lieu'),
  nom('livre', 'livre', 'livres', 'masculin', 'objet'),
  nom('cahier', 'cahier', 'cahiers', 'masculin', 'objet'),
  nom('ballon', 'ballon', 'ballons', 'masculin', 'objet'),
  nom('crayon', 'crayon', 'crayons', 'masculin', 'objet'),
  nom('table', 'table', 'tables', 'feminin', 'objet'),
  nom('chaise', 'chaise', 'chaises', 'feminin', 'objet'),
  nom('robe', 'robe', 'robes', 'feminin', 'objet'),
  nom('lampe', 'lampe', 'lampes', 'feminin', 'objet'),
  nom('porte', 'porte', 'portes', 'feminin', 'objet'),
  nom('voiture', 'voiture', 'voitures', 'feminin', 'objet'),
  nom('image', 'image', 'images', 'feminin', 'objet'),
  nom('armoire', 'armoire', 'armoires', 'feminin', 'objet'),
  nom('pomme', 'pomme', 'pommes', 'feminin', 'aliment'),
  nom('arbre', 'arbre', 'arbres', 'masculin', 'nature'),
  nom('fleur', 'fleur', 'fleurs', 'feminin', 'nature'),
  nom('feuille', 'feuille', 'feuilles', 'feminin', 'nature'),
  // h muet : l’histoire. Rien dans le mot ne l'annonce, d'où le drapeau explicite.
  nom('histoire', 'histoire', 'histoires', 'feminin', 'abstrait', {
    elision: true,
  }),

  // pluriel en -x : noms en -eau, -au, -eu
  nom('oiseau', 'oiseau', 'oiseaux', 'masculin', 'animal'),
  nom('gateau', 'gâteau', 'gâteaux', 'masculin', 'aliment'),
  nom('eau', 'eau', 'eaux', 'feminin', 'aliment'),
  nom('chateau', 'château', 'châteaux', 'masculin', 'lieu'),
  nom('chapeau', 'chapeau', 'chapeaux', 'masculin', 'objet'),
  nom('bateau', 'bateau', 'bateaux', 'masculin', 'objet'),
  nom('jeu', 'jeu', 'jeux', 'masculin', 'objet'),
  nom('feu', 'feu', 'feux', 'masculin', 'nature'),
  nom('cheveu', 'cheveu', 'cheveux', 'masculin', 'corps'),

  // pluriel en -aux : noms en -al (CE2)
  nom('cheval', 'cheval', 'chevaux', 'masculin', 'animal'),
  nom('animal', 'animal', 'animaux', 'masculin', 'animal'),
  nom('journal', 'journal', 'journaux', 'masculin', 'objet'),
  nom('hopital', 'hôpital', 'hôpitaux', 'masculin', 'lieu', { elision: true }),

  // pluriel en -oux : les sept noms en -ou qui font exception (CM1)
  nom('genou', 'genou', 'genoux', 'masculin', 'corps'),
  nom('chou', 'chou', 'choux', 'masculin', 'aliment'),
  nom('hibou', 'hibou', 'hiboux', 'masculin', 'animal', { elision: false }),
  nom('bijou', 'bijou', 'bijoux', 'masculin', 'objet'),

  // invariables : noms en -s, -x, -z
  nom('souris', 'souris', 'souris', 'feminin', 'animal'),
  nom('bras', 'bras', 'bras', 'masculin', 'corps'),
  nom('nez', 'nez', 'nez', 'masculin', 'corps'),
  nom('prix', 'prix', 'prix', 'masculin', 'abstrait'),
  nom('croix', 'croix', 'croix', 'feminin', 'objet'),
];

// ─── Adjectifs ──────────────────────────────────────────────────────────────
//
// Tous réguliers : féminin en +e, pluriel en +s. Ceux qui finissent déjà par un e sont
// invariables au féminin — c'est le piège explicite de la fiche (rouge, jaune, calme).
//
// `sappliqueA` et `famille` ne servent pas l'accord : elles empêchent le générateur
// d'écrire « les chapeaux sucrés » ou « le chapeau vert rouge ».

const TOUT: Categorie[] = [
  'personne',
  'animal',
  'objet',
  'aliment',
  'lieu',
  'nature',
  'corps',
  'abstrait',
];
const ANIME: Categorie[] = ['personne', 'animal'];
const CHOSES: Categorie[] = ['objet', 'aliment', 'lieu', 'nature', 'corps'];

export const ADJECTIFS: AdjectifMeta[] = [
  adjectif(
    'petit',
    ['petit', 'petite', 'petits', 'petites'],
    'avant',
    'taille',
    TOUT,
  ),
  adjectif(
    'grand',
    ['grand', 'grande', 'grands', 'grandes'],
    'avant',
    'taille',
    TOUT,
  ),
  adjectif('joli', ['joli', 'jolie', 'jolis', 'jolies'], 'avant', 'aspect', [
    ...CHOSES,
    'personne',
    'animal',
  ]),
  adjectif('jeune', ['jeune', 'jeune', 'jeunes', 'jeunes'], 'avant', 'age', [
    ...ANIME,
    'nature',
  ]),

  adjectif(
    'noir',
    ['noir', 'noire', 'noirs', 'noires'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif(
    'vert',
    ['vert', 'verte', 'verts', 'vertes'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif(
    'bleu',
    ['bleu', 'bleue', 'bleus', 'bleues'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif(
    'rouge',
    ['rouge', 'rouge', 'rouges', 'rouges'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif(
    'jaune',
    ['jaune', 'jaune', 'jaunes', 'jaunes'],
    'apres',
    'couleur',
    CHOSES,
  ),

  adjectif(
    'content',
    ['content', 'contente', 'contents', 'contentes'],
    'apres',
    'caractere',
    ANIME,
  ),
  adjectif(
    'sage',
    ['sage', 'sage', 'sages', 'sages'],
    'apres',
    'caractere',
    ANIME,
  ),
  adjectif('poli', ['poli', 'polie', 'polis', 'polies'], 'apres', 'caractere', [
    'personne',
  ]),
  adjectif(
    'calme',
    ['calme', 'calme', 'calmes', 'calmes'],
    'apres',
    'caractere',
    [...ANIME, 'lieu', 'nature'],
  ),

  adjectif(
    'fatigue',
    ['fatigué', 'fatiguée', 'fatigués', 'fatiguées'],
    'apres',
    'etat',
    ANIME,
  ),
  adjectif(
    'propre',
    ['propre', 'propre', 'propres', 'propres'],
    'apres',
    'etat',
    ['objet', 'lieu', 'corps', 'personne'],
  ),
  adjectif(
    'fleuri',
    ['fleuri', 'fleurie', 'fleuris', 'fleuries'],
    'apres',
    'etat',
    ['lieu', 'nature'],
  ),

  adjectif(
    'carre',
    ['carré', 'carrée', 'carrés', 'carrées'],
    'apres',
    'forme',
    ['objet', 'lieu'],
  ),

  adjectif('sucre', ['sucré', 'sucrée', 'sucrés', 'sucrées'], 'apres', 'gout', [
    'aliment',
  ]),
  adjectif('sale', ['salé', 'salée', 'salés', 'salées'], 'apres', 'gout', [
    'aliment',
  ]),

  adjectif(
    'rapide',
    ['rapide', 'rapide', 'rapides', 'rapides'],
    'apres',
    'vitesse',
    ANIME,
  ),

  // ── Consonne doublée au féminin (CE2) ─────────────────────────────────────
  adjectif('gros', ['gros', 'grosse', 'gros', 'grosses'], 'avant', 'taille', [
    ...CHOSES,
    'personne',
    'animal',
  ]),
  adjectif('bon', ['bon', 'bonne', 'bons', 'bonnes'], 'avant', 'gout', [
    'aliment',
  ]),
  adjectif(
    'gentil',
    ['gentil', 'gentille', 'gentils', 'gentilles'],
    'apres',
    'caractere',
    ANIME,
  ),

  // ── Féminin irrégulier (CM1) ──────────────────────────────────────────────
  adjectif('beau', ['beau', 'belle', 'beaux', 'belles'], 'avant', 'aspect', [
    ...CHOSES,
    'personne',
    'animal',
  ]),
  adjectif(
    'nouveau',
    ['nouveau', 'nouvelle', 'nouveaux', 'nouvelles'],
    'avant',
    'age',
    CHOSES,
  ),
  adjectif('vieux', ['vieux', 'vieille', 'vieux', 'vieilles'], 'avant', 'age', [
    ...ANIME,
    'objet',
    'lieu',
  ]),
  adjectif(
    'blanc',
    ['blanc', 'blanche', 'blancs', 'blanches'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif('long', ['long', 'longue', 'longs', 'longues'], 'apres', 'taille', [
    'objet',
    'nature',
    'abstrait',
  ]),
  adjectif('doux', ['doux', 'douce', 'doux', 'douces'], 'apres', 'etat', [
    ...ANIME,
    'objet',
    'aliment',
  ]),

  // ── Masculin pluriel invariable : adjectifs en -s, -x (CM1) ───────────────
  adjectif(
    'gris',
    ['gris', 'grise', 'gris', 'grises'],
    'apres',
    'couleur',
    CHOSES,
  ),
  adjectif(
    'heureux',
    ['heureux', 'heureuse', 'heureux', 'heureuses'],
    'apres',
    'caractere',
    ANIME,
  ),
];

// ─── Verbes ─────────────────────────────────────────────────────────────────

export const VERBES: VerbeMeta[] = [
  // Homophones : la marque du pluriel ne s'entend pas. Le vrai sujet de la notion.
  verbe('jouer', 'jouer', 'joue', 'jouent', 'dans le jardin.', true, ANIME),
  verbe('chanter', 'chanter', 'chante', 'chantent', 'très fort.', true, ANIME),
  verbe('manger', 'manger', 'mange', 'mangent', 'une pomme.', true, ANIME),
  verbe('danser', 'danser', 'danse', 'dansent', 'dans la cour.', true, [
    'personne',
  ]),
  verbe('dessiner', 'dessiner', 'dessine', 'dessinent', 'un soleil.', true, [
    'personne',
  ]),
  verbe('arriver', 'arriver', 'arrive', 'arrivent', 'en retard.', true, ANIME),

  // Non homophones : la différence s'entend, donc la question est plus facile.
  verbe('dormir', 'dormir', 'dort', 'dorment', 'sur le tapis.', false, ANIME),
  verbe('courir', 'courir', 'court', 'courent', 'très vite.', false, ANIME),
  verbe('partir', 'partir', 'part', 'partent', 'demain matin.', false, ANIME),
  verbe('sortir', 'sortir', 'sort', 'sortent', 'dans la cour.', false, ANIME),
  verbe('finir', 'finir', 'finit', 'finissent', 'le travail.', false, [
    'personne',
  ]),
  verbe('lire', 'lire', 'lit', 'lisent', 'une histoire.', false, ['personne']),
  verbe('ecrire', 'écrire', 'écrit', 'écrivent', 'une lettre.', false, [
    'personne',
  ]),
  verbe('prendre', 'prendre', 'prend', 'prennent', 'le train.', false, [
    'personne',
  ]),
  verbe('venir', 'venir', 'vient', 'viennent', 'à midi.', false, ANIME),
  verbe('avoir', 'avoir', 'a', 'ont', 'un ballon.', false, ANIME),
  verbe('aller', 'aller', 'va', 'vont', 'à la piscine.', false, ['personne']),
  verbe('faire', 'faire', 'fait', 'font', 'un gâteau.', false, ['personne']),
  // « être » sans attribut : « les chats sont contents » demanderait d'accorder aussi
  // l'attribut, ce que le CE1 n'apprend pas.
  verbe('etre', 'être', 'est', 'sont', 'là.', false, ANIME),
];

// ─── Morphologie dérivée ────────────────────────────────────────────────────

/** Peut faire l'action d'un verbe. Dérivé de la catégorie : pas un champ à tenir à jour. */
export function estAnime(nomMeta: NomMeta): boolean {
  return nomMeta.categorie === 'personne' || nomMeta.categorie === 'animal';
}

/** Les adjectifs qui peuvent qualifier ce nom sans absurdité. */
export function adjectifsCompatibles(nomMeta: NomMeta): AdjectifMeta[] {
  return ADJECTIFS.filter((adj) => adj.sappliqueA.includes(nomMeta.categorie));
}

export function commenceParVoyelle(mot: string): boolean {
  return VOYELLES.test(mot);
}

/** Un pluriel qui ne s'obtient pas en ajoutant un s : -eau/-au/-eu en x, ou invariable.
 * Dérivé et non annoté : c'est une propriété de l'orthographe, pas un jugement. */
export function plurielIrregulier(nomMeta: NomMeta): boolean {
  return nomMeta.pluriel !== `${nomMeta.singulier}s`;
}

/** Un adjectif dont le féminin n'ajoute rien : il finissait déjà par un e. */
export function feminimInvariable(adj: AdjectifMeta): boolean {
  return adj.fs === adj.ms;
}

/** Le déterminant qui convient. L'élision porte sur le PREMIER MOT du groupe, pas sur le
 * nom : « l’arbre » mais « le grand arbre », « l’école » mais « la petite école ». */
export function determinant(
  genre: Genre,
  nombre: Nombre,
  article: Article,
  elide: boolean,
): string {
  if (nombre === 'pluriel') return article === 'defini' ? 'les' : 'des';
  if (article === 'indefini') return genre === 'masculin' ? 'un' : 'une';
  if (elide) return 'l’';
  return genre === 'masculin' ? 'le' : 'la';
}

/** Le groupe nominal complet et correctement accordé. Un seul chemin de construction :
 * ce qui est demandé à l'enfant et ce qui est attendu de lui sortent de la même fonction,
 * donc une divergence entre les deux est impossible. */
export function groupeNominal(
  nomMeta: NomMeta,
  adjectifs: AdjectifMeta[],
  nombre: Nombre,
  article: Article = 'defini',
): string {
  const avant = adjectifs.filter((adj) => adj.place === 'avant');
  const apres = adjectifs.filter((adj) => adj.place === 'apres');

  const forme = (adj: AdjectifMeta): string => {
    if (nomMeta.genre === 'masculin') {
      return nombre === 'singulier' ? adj.ms : adj.mp;
    }
    return nombre === 'singulier' ? adj.fs : adj.fp;
  };

  const noyau = nomMeta[nombre];
  const premier = avant.length > 0 ? forme(avant[0]) : noyau;
  const det = determinant(
    nomMeta.genre,
    nombre,
    article,
    commenceParVoyelle(premier),
  );

  const mots = [...avant.map(forme), noyau, ...apres.map(forme)];
  const separateur = det.endsWith('’') ? '' : ' ';

  return `${det}${separateur}${mots.join(' ')}`;
}
