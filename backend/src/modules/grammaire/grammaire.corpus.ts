/** Le corpus de phrases annotées, mot par mot.
 *
 * Il est en CODE et non en base, pour la même raison que `geometrie.shapes.ts` : ce n'est
 * pas du contenu qu'un parent édite, c'est une structure où une annotation fausse enseigne
 * du faux français. Un import JSON par textarea serait le seul endroit du module capable
 * d'en injecter une.
 *
 * L'annotation passe par des CONSTRUCTEURS plutôt que par des objets littéraux. Écrire
 * `{ fonction: 'sujet', gn: 0 }` sur chacun des trois mots d'un groupe, c'est trois
 * occasions de se tromper et une invitation à la divergence ; `gnSujet(d('Le'), nc('chat'))`
 * n'en laisse aucune, et se relit comme la phrase. Les index de groupe nominal sont
 * attribués par l'aplatissement, jamais à la main.
 *
 * `grammaire.corpus.spec.ts` vérifie les invariants que le typage ne peut pas voir :
 * un verbe par phrase, un sujet par phrase, un nom dans chaque groupe nominal.
 */

import type { Fonction, Nature } from './grammaire.notions';

export type Niveau = 'simple' | 'moyen' | 'complexe';

export const NIVEAUX: Niveau[] = ['simple', 'moyen', 'complexe'];

export interface MotAnnote {
  /** Le mot tel qu'écrit, majuscule comprise. */
  mot: string;
  nature: Nature;
  /** Sa fonction dans CETTE phrase — c'est tout l'objet de la notion. */
  fonction: Fonction | null;
  /** Index du groupe nominal auquel il appartient, `null` s'il n'en fait pas partie. */
  gn: number | null;
  /** Ponctuation accolée après le mot : affichée, jamais cliquable. */
  apres: string;
  /** Pas d'espace avant ce mot : il suit une élision (l’oiseau). */
  colle: boolean;
}

export interface PhraseAnnotee {
  key: string;
  niveau: Niveau;
  mots: MotAnnote[];
}

// ─── Constructeurs ──────────────────────────────────────────────────────────

interface MotBrut {
  sorte: 'mot';
  mot: string;
  nature: Nature;
  apres: string;
}

interface Groupe {
  sorte: 'gn' | 'fonction';
  fonction: Fonction | null;
  blocs: Bloc[];
}

type Bloc = MotBrut | Groupe;

function motDe(nature: Nature) {
  return (mot: string, apres = ''): MotBrut => ({
    sorte: 'mot',
    mot,
    nature,
    apres,
  });
}

/** Nom commun. */
const nc = motDe('nom_commun');
/** Nom propre. */
const np = motDe('nom_propre');
/** Verbe. */
const v = motDe('verbe');
/** Déterminant. */
const d = motDe('determinant');
/** Adjectif qualificatif. */
const adj = motDe('adjectif');
/** Pronom personnel sujet. */
const pron = motDe('pronom_sujet');
/** Mot invariable — adverbe ou préposition, comme dans la fiche du cours. */
const inv = motDe('invariable');

/** Un groupe nominal : le nom et tout ce qui l'accompagne. */
const gn = (...blocs: Bloc[]): Groupe => ({
  sorte: 'gn',
  fonction: null,
  blocs,
});

const sujet = (...blocs: Bloc[]): Groupe => ({
  sorte: 'fonction',
  fonction: 'sujet',
  blocs,
});

const complement = (...blocs: Bloc[]): Groupe => ({
  sorte: 'fonction',
  fonction: 'complement',
  blocs,
});

/** Le cas courant : un groupe nominal qui est le sujet du verbe. */
const gnSujet = (...blocs: Bloc[]): Groupe => sujet(gn(...blocs));

/** Aplatit l'arbre en liste de mots : les index de groupe nominal sont attribués dans
 * l'ordre d'apparition, la fonction descend du groupe vers ses mots. L'élision se déduit
 * du mot précédent — en français, un mot qui suit une apostrophe est toujours collé. */
function aplatir(blocs: Bloc[]): MotAnnote[] {
  const mots: MotAnnote[] = [];
  let prochainGn = 0;

  function visiter(
    bloc: Bloc,
    fonction: Fonction | null,
    groupe: number | null,
  ) {
    if (bloc.sorte === 'mot') {
      mots.push({
        mot: bloc.mot,
        nature: bloc.nature,
        fonction,
        gn: groupe,
        apres: bloc.apres,
        colle: false,
      });
      return;
    }
    const groupeCourant = bloc.sorte === 'gn' ? prochainGn++ : groupe;
    const fonctionCourante =
      bloc.sorte === 'fonction' ? bloc.fonction : fonction;
    for (const enfant of bloc.blocs) {
      visiter(enfant, fonctionCourante, groupeCourant);
    }
  }

  for (const bloc of blocs) visiter(bloc, null, null);

  for (let index = 1; index < mots.length; index++) {
    const precedent = mots[index - 1].mot;
    if (precedent.endsWith('’') || precedent.endsWith("'")) {
      mots[index].colle = true;
    }
  }

  return mots;
}

function phrase(key: string, niveau: Niveau, blocs: Bloc[]): PhraseAnnotee {
  return { key, niveau, mots: aplatir(blocs) };
}

// ─── Le corpus ──────────────────────────────────────────────────────────────
//
// `simple`   : déterminant + nom + verbe. De quoi travailler la nature de base,
//              le sujet et le groupe nominal sans rien d'autre autour.
// `moyen`    : un adjectif, un complément, un mot invariable.
// `complexe` : groupe nominal étendu, sujet inversé, sujet coordonné, et des mots
//              ambigus hors contexte — ferme, porte, gare, cuisine — qui sont
//              précisément la raison pour laquelle on ne demande jamais la nature
//              d'un mot isolé.
//
// Un groupe nominal qui n'est ni sujet ni complément de circonstance reste sans
// fonction : le CE1 n'apprend pas le complément d'objet, et la fiche du cours définit
// le complément par « où, quand, comment ». Une phrase peut donc servir aux questions
// de nature et de groupe nominal sans servir aux questions de fonction.

export const CORPUS: PhraseAnnotee[] = [
  // ── simple ────────────────────────────────────────────────────────────────
  phrase('chat-dort', 'simple', [gnSujet(d('Le'), nc('chat')), v('dort', '.')]),
  phrase('fille-chante', 'simple', [
    gnSujet(d('La'), nc('fille')),
    v('chante', '.'),
  ]),
  phrase('enfants-jouent', 'simple', [
    gnSujet(d('Les'), nc('enfants')),
    v('jouent', '.'),
  ]),
  phrase('chien-aboie', 'simple', [
    gnSujet(d('Le'), nc('chien')),
    v('aboie', '.'),
  ]),
  phrase('maeve-dessine', 'simple', [gnSujet(np('Maëve')), v('dessine', '.')]),
  phrase('lea-danse', 'simple', [gnSujet(np('Léa')), v('danse', '.')]),
  phrase('elle-mange', 'simple', [sujet(pron('Elle')), v('mange', '.')]),
  phrase('ils-courent', 'simple', [sujet(pron('Ils')), v('courent', '.')]),
  phrase('maitre-ecrit', 'simple', [
    gnSujet(d('Le'), nc('maître')),
    v('écrit', '.'),
  ]),
  phrase('maitresse-parle', 'simple', [
    gnSujet(d('La'), nc('maîtresse')),
    v('parle', '.'),
  ]),
  phrase('oiseaux-chantent', 'simple', [
    gnSujet(d('Les'), nc('oiseaux')),
    v('chantent', '.'),
  ]),
  phrase('bebe-pleure', 'simple', [
    gnSujet(d('Le'), nc('bébé')),
    v('pleure', '.'),
  ]),
  phrase('nous-chantons', 'simple', [sujet(pron('Nous')), v('chantons', '.')]),
  phrase('papa-cuisine', 'simple', [gnSujet(np('Papa')), v('cuisine', '.')]),
  phrase('train-arrive', 'simple', [
    gnSujet(d('Le'), nc('train')),
    v('arrive', '.'),
  ]),
  phrase('tu-lis', 'simple', [sujet(pron('Tu')), v('lis', '.')]),
  phrase('fleurs-poussent', 'simple', [
    gnSujet(d('Les'), nc('fleurs')),
    v('poussent', '.'),
  ]),
  phrase('oiseau-chante', 'simple', [
    gnSujet(d('L’'), nc('oiseau')),
    v('chante', '.'),
  ]),
  phrase('vent-souffle', 'simple', [
    gnSujet(d('Le'), nc('vent')),
    v('souffle', '.'),
  ]),
  phrase('medor-dort', 'simple', [gnSujet(np('Médor')), v('dort', '.')]),
  phrase('porte-grince', 'simple', [
    gnSujet(d('La'), nc('porte')),
    v('grince', '.'),
  ]),
  phrase('eleves-ecoutent', 'simple', [
    gnSujet(d('Les'), nc('élèves')),
    v('écoutent', '.'),
  ]),

  // ── moyen ─────────────────────────────────────────────────────────────────
  phrase('petit-chat-dort', 'moyen', [
    gnSujet(d('Le'), adj('petit'), nc('chat')),
    v('dort', '.'),
  ]),
  phrase('grand-chien-aboie', 'moyen', [
    gnSujet(d('Le'), adj('grand'), nc('chien')),
    v('aboie', '.'),
  ]),
  phrase('chat-dort-tapis', 'moyen', [
    gnSujet(d('Le'), nc('chat')),
    v('dort'),
    complement(inv('sur'), gn(d('le'), nc('tapis', '.'))),
  ]),
  phrase('enfants-jouent-jardin', 'moyen', [
    gnSujet(d('Les'), nc('enfants')),
    v('jouent'),
    complement(inv('dans'), gn(d('le'), nc('jardin', '.'))),
  ]),
  phrase('maeve-mange-pomme', 'moyen', [
    gnSujet(np('Maëve')),
    v('mange'),
    gn(d('une'), nc('pomme'), adj('rouge', '.')),
  ]),
  phrase('chien-court-vite', 'moyen', [
    gnSujet(d('Le'), nc('chien')),
    v('court'),
    complement(inv('vite', '.')),
  ]),
  phrase('elle-chante-souvent', 'moyen', [
    sujet(pron('Elle')),
    v('chante'),
    complement(inv('souvent', '.')),
  ]),
  phrase('voisine-arrose-fleurs', 'moyen', [
    gnSujet(d('La'), nc('voisine')),
    v('arrose'),
    gn(d('ses'), nc('fleurs', '.')),
  ]),
  phrase('facteur-apporte-lettre', 'moyen', [
    gnSujet(d('Le'), nc('facteur')),
    v('apporte'),
    gn(d('une'), nc('lettre', '.')),
  ]),
  phrase('ce-matin-chat-dort', 'moyen', [
    complement(gn(d('Ce'), nc('matin', ','))),
    gnSujet(d('le'), nc('chat')),
    v('dort', '.'),
  ]),
  phrase('eleves-ecoutent-maitresse', 'moyen', [
    gnSujet(d('Les'), nc('élèves')),
    v('écoutent'),
    gn(d('la'), nc('maîtresse', '.')),
  ]),
  phrase('vieux-chien-dort-dehors', 'moyen', [
    gnSujet(d('Le'), adj('vieux'), nc('chien')),
    v('dort'),
    complement(inv('dehors', '.')),
  ]),
  phrase('papa-gare-voiture', 'moyen', [
    gnSujet(np('Papa')),
    v('gare'),
    gn(d('la'), nc('voiture', '.')),
  ]),
  phrase('lea-joue-avec-maeve', 'moyen', [
    gnSujet(np('Léa')),
    v('joue'),
    complement(inv('avec'), gn(np('Maëve', '.'))),
  ]),
  phrase('boulanger-vend-pain', 'moyen', [
    gnSujet(d('Le'), nc('boulanger')),
    v('vend'),
    gn(d('du'), nc('pain', '.')),
  ]),
  phrase('nuages-gris-arrivent', 'moyen', [
    gnSujet(d('Les'), nc('nuages'), adj('gris')),
    v('arrivent', '.'),
  ]),
  phrase('nous-partons-demain', 'moyen', [
    sujet(pron('Nous')),
    v('partons'),
    complement(inv('demain', '.')),
  ]),
  phrase('chat-noir-traverse-rue', 'moyen', [
    gnSujet(d('Le'), nc('chat'), adj('noir')),
    v('traverse'),
    gn(d('la'), nc('rue', '.')),
  ]),
  phrase('petite-fille-dessine-soleil', 'moyen', [
    gnSujet(d('La'), adj('petite'), nc('fille')),
    v('dessine'),
    gn(d('un'), nc('soleil', '.')),
  ]),
  phrase('elle-range-chambre', 'moyen', [
    sujet(pron('Elle')),
    v('range'),
    gn(d('sa'), nc('chambre', '.')),
  ]),
  phrase('train-part-bientot', 'moyen', [
    gnSujet(d('Le'), nc('train')),
    v('part'),
    complement(inv('bientôt', '.')),
  ]),
  phrase('canards-nagent-etang', 'moyen', [
    gnSujet(d('Les'), nc('canards')),
    v('nagent'),
    complement(inv('sur'), gn(d('l’'), nc('étang', '.'))),
  ]),
  phrase('maitresse-raconte-histoire', 'moyen', [
    gnSujet(d('La'), nc('maîtresse')),
    v('raconte'),
    gn(d('une'), adj('longue'), nc('histoire', '.')),
  ]),

  // ── complexe ──────────────────────────────────────────────────────────────
  phrase('petit-chat-noir-dort', 'complexe', [
    gnSujet(d('Le'), adj('petit'), nc('chat'), adj('noir')),
    v('dort'),
    complement(inv('profondément', '.')),
  ]),
  phrase('sous-la-table-dort-le-chat', 'complexe', [
    complement(inv('Sous'), gn(d('la'), nc('table'))),
    v('dort'),
    gnSujet(d('le'), nc('chat', '.')),
  ]),
  phrase('maeve-et-lea-chantent', 'complexe', [
    sujet(gn(np('Maëve')), inv('et'), gn(np('Léa'))),
    v('chantent', '.'),
  ]),
  phrase('grandes-fleurs-jaunes-poussent', 'complexe', [
    gnSujet(d('Les'), adj('grandes'), nc('fleurs'), adj('jaunes')),
    v('poussent'),
    complement(inv('dans'), gn(d('le'), nc('jardin', '.'))),
  ]),
  phrase('dans-la-cour-enfants-jouent', 'complexe', [
    complement(inv('Dans'), gn(d('la'), nc('cour', ','))),
    gnSujet(d('les'), nc('enfants')),
    v('jouent', '.'),
  ]),
  phrase('fermier-ferme-porte', 'complexe', [
    gnSujet(d('Le'), nc('fermier')),
    v('ferme'),
    gn(d('la'), adj('grande'), nc('porte', '.')),
  ]),
  phrase('elle-porte-robe-bleue', 'complexe', [
    sujet(pron('Elle')),
    v('porte'),
    gn(d('une'), adj('jolie'), nc('robe'), adj('bleue', '.')),
  ]),
  phrase('eleves-attentifs-ecoutent', 'complexe', [
    gnSujet(d('Les'), nc('élèves'), adj('attentifs')),
    v('écoutent'),
    gn(d('la'), adj('longue'), nc('histoire', '.')),
  ]),
  phrase('derriere-la-maison-chien-dort', 'complexe', [
    complement(inv('Derrière'), gn(d('la'), nc('maison', ','))),
    gnSujet(d('un'), adj('vieux'), nc('chien')),
    v('dort'),
    complement(inv('tranquillement', '.')),
  ]),
  phrase('petits-oiseaux-gris-chantent', 'complexe', [
    gnSujet(d('Les'), adj('petits'), nc('oiseaux'), adj('gris')),
    v('chantent'),
    complement(inv('dans'), gn(d('les'), nc('arbres', '.'))),
  ]),
  phrase('ce-matin-facteur-apporte', 'complexe', [
    complement(gn(d('Ce'), nc('matin', ','))),
    gnSujet(d('le'), nc('facteur')),
    v('apporte'),
    gn(d('une'), adj('belle'), nc('lettre', '.')),
  ]),
  phrase('sur-la-table-maeve-pose', 'complexe', [
    complement(inv('Sur'), gn(d('la'), nc('table', ','))),
    gnSujet(np('Maëve')),
    v('pose'),
    gn(d('son'), nc('cartable', '.')),
  ]),
  phrase('chat-et-chien-dorment', 'complexe', [
    sujet(gn(d('Le'), nc('chat')), inv('et'), gn(d('le'), nc('chien'))),
    v('dorment'),
    complement(inv('ensemble', '.')),
  ]),
  phrase('bientot-jolies-fleurs-pousseront', 'complexe', [
    complement(inv('Bientôt', ',')),
    gnSujet(d('les'), adj('jolies'), nc('fleurs')),
    v('pousseront', '.'),
  ]),
  phrase('la-bas-vieux-moulin-tourne', 'complexe', [
    complement(inv('Là-bas', ',')),
    gnSujet(d('le'), adj('vieux'), nc('moulin')),
    v('tourne'),
    complement(inv('lentement', '.')),
  ]),
  phrase('souvent-petit-chat-noir-dort', 'complexe', [
    complement(inv('Souvent', ',')),
    gnSujet(d('le'), adj('petit'), nc('chat'), adj('noir')),
    v('dort'),
    complement(inv('sur'), gn(d('le'), adj('vieux'), nc('tapis', '.'))),
  ]),
  phrase('dehors-grands-arbres-bougent', 'complexe', [
    complement(inv('Dehors', ',')),
    gnSujet(d('les'), adj('grands'), nc('arbres')),
    v('bougent', '.'),
  ]),
];

/** La phrase reconstituée, telle qu'elle s'affiche — sert aux tests et aux messages. */
export function texteDe(phraseAnnotee: PhraseAnnotee): string {
  return phraseAnnotee.mots
    .map((mot, index) => {
      const separateur = index === 0 || mot.colle ? '' : ' ';
      return `${separateur}${mot.mot}${mot.apres}`;
    })
    .join('');
}
