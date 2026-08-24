import type { Concept, GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';

/**
 * Les sons, au CE1.
 *
 * Ces neuf leçons ne parlent pas d'écoute mais d'ORTHOGRAPHE, et c'est ce qui les rend
 * écrivables sans audio : l'enfant entend déjà le son /o/ parfaitement. Ce qu'elle
 * apprend, c'est qu'il s'écrit o, ô, au ou eau, et quand chaque graphie s'emploie.
 *
 * Chaque fiche a donc la même forme : la liste des graphies, chacune avec un mot où on la
 * voit. Le tableau EST la leçon. Ce qui varie d'une fiche à l'autre, c'est la règle quand
 * il y en a une (le m devant m, b, p) et les exceptions quand il n'y en a pas.
 */

/** Un son se raconte toujours pareil : ses graphies, une règle s'il y en a une, un piège. */
function son(
  slug: string,
  titre: string,
  idee: string,
  regle: string[],
  graphies: [string, string][],
  piege: string,
): Concept {
  return {
    slug,
    titre,
    source: `ce1.francais.${slug}`,
    fiche: {
      titre,
      idee,
      regle,
      exemple: <Paires colonnes={['écriture', 'exemple']} lignes={graphies} />,
      piege,
    },
  };
}

export const lesSons: GrandeNotion = {
  slug: 'les-sons',
  titre: 'Les sons',
  resume:
    "Un même son s'écrit de plusieurs façons. Les graphies de chacun, et la règle quand il y en a une.",

  concepts: [
    son(
      'le-son-o',
      'Le son [o]',
      "Le son [o] s'écrit de quatre façons. Aucune règle ne dit laquelle choisir : ce sont les mots eux-mêmes qui décident, et on les apprend un par un.",
      ['o et ô au début ou au milieu.', 'au et eau surtout à la fin.'],
      [
        ['o', 'un vél{o}'],
        ['ô', 'un h{ô}pital'],
        ['au', 'ch{au}d'],
        ['eau', 'un chap{eau}'],
      ],
      'Rien ne prévient : chapeau et cadeau prennent eau, chaud et jaune prennent au. Ces mots-là se retiennent, ils ne se déduisent pas.',
    ),

    son(
      'le-son-ou',
      'Le son [ou]',
      "C'est le son le plus simple du CE1 : il s'écrit presque toujours ou, avec les deux lettres dans cet ordre. Une seule autre graphie existe, et elle est rare.",
      ['ou dans la très grande majorité des mots.', "oo dans quelques mots venus d'ailleurs."],
      [
        ['ou', 'un l{ou}p'],
        ['ou', 'une r{ou}e'],
        ['oo', 'un z{oo}'],
        ['oo', 'le f{oo}tball'],
      ],
      "oo vient d'autres langues et ne concerne qu'une poignée de mots. Dans le doute, c'est ou.",
    ),

    son(
      'le-son-e',
      'Le son [è]',
      "Six façons d'écrire un seul son : c'est le record du CE1. Il n'y a pas de règle générale, mais deux repères aident beaucoup, et ils sont dans le tableau.",
      [
        'è et ê portent un accent, on les voit.',
        "e seul fait [è] devant une consonne qu'on prononce.",
        'ai, ei, et : à retenir mot par mot.',
      ],
      [
        ['è', 'une m{è}re'],
        ['ê', 'la f{ê}te'],
        ['e', 'la m{e}r'],
        ['ai', 'une m{ai}son'],
        ['ei', 'la n{ei}ge'],
        ['et', 'un jou{et}'],
      ],
      "Le e seul ne fait [è] que si la consonne qui suit s'entend : mer, sel, bec. Dans « petit », le e ne fait pas [è].",
    ),

    son(
      'le-son-an',
      'Le son [an]',
      "Le son [an] s'écrit an ou en, sans qu'on puisse deviner lequel. En revanche, une règle décide de la dernière lettre, et celle-là ne souffre presque aucune exception.",
      [
        "an ou en : c'est le mot qui décide.",
        'Mais devant un m, un b ou un p, on écrit am ou em.',
      ],
      [
        ['an', 'un {an}'],
        ['en', 'un {en}fant'],
        ['am', 'une l{am}pe'],
        ['em', 'le t{em}ps'],
        ['aon', 'un p{aon}'],
      ],
      "La graphie aon ne sert que pour trois mots : un paon, un faon, un taon. On les apprend, il n'y en a pas d'autres.",
    ),

    son(
      'le-son-on',
      'Le son [on]',
      "Le son [on] s'écrit on presque partout. La même règle que pour [an] change le n en m devant certaines lettres, et c'est tout ce qu'il y a à savoir.",
      ['on dans la plupart des mots.', 'Devant un b ou un p, on écrit om.'],
      [
        ['on', 'un p{on}t'],
        ['on', 'une mais{on}'],
        ['om', 'une t{om}be'],
        ['om', 'un p{om}pier'],
      ],
      'Bonbon fait exception : un b suit bien le on, et pourtant on écrit on et non om.',
    ),

    son(
      'le-son-in',
      'Le son [in]',
      "Quatre graphies courantes, et la même règle du m que pour [an] et [on]. Ces trois sons fonctionnent pareil : c'est une seule chose à comprendre pour trois leçons.",
      [
        'in, ain, ein : le mot décide.',
        'Devant un m, un b ou un p, le n devient m.',
      ],
      [
        ['in', 'un lap{in}'],
        ['ain', 'la m{ain}'],
        ['ein', 'la p{ein}ture'],
        ['im', 'un t{im}bre'],
      ],
      'La règle du m devant m, b, p vaut pour [an], [on] et [in]. Une seule règle apprise, trois sons réglés.',
    ),

    son(
      'les-sons-oi-et-oin',
      'Les sons [oi] et [oin]',
      "Deux sons très proches, deux graphies très simples : oi et oin. C'est l'une des rares leçons de sons où la graphie ne pose presque aucune question.",
      ["[oi] s'écrit oi.", "[oin] s'écrit oin."],
      [
        ['oi', 'un m{oi}s'],
        ['oi', 'un d{oi}gt'],
        ['oin', 'l{oin}'],
        ['oin', 'un c{oin}'],
      ],
      "Pingouin et babouin se prononcent [oin] mais s'écrivent ouin. Deux mots, deux exceptions, et rien d'autre.",
    ),

    son(
      'les-sons-eu-et-oeu',
      'Les sons [eu] et [œu]',
      "Ces deux sons s'écrivent eu presque partout. La graphie œu, avec le o et le e collés, existe bien, mais elle ne concerne qu'une petite liste de mots.",
      ['eu dans la grande majorité des mots.', 'œu dans quelques mots à retenir.'],
      [
        ['eu', 'du f{eu}'],
        ['eu', 'bl{eu}'],
        ['œu', 'une s{œu}r'],
        ['œu', 'un c{œu}r'],
      ],
      "La liste des mots en œu est courte : cœur, sœur, œuf, bœuf, nœud. Partout ailleurs, c'est eu.",
    ),

    son(
      'le-son-ill',
      'Le son [ill]',
      "C'est la leçon de sons la plus fournie : cinq graphies. Mais deux d'entre elles obéissent à une règle nette, ce qui réduit d'autant ce qu'il reste à retenir.",
      [
        "il seulement à la fin d'un mot masculin.",
        "ille seulement à la fin d'un mot féminin.",
        'ill, i et y : au milieu du mot.',
      ],
      [
        ['il', 'un trava{il}'],
        ['ille', 'une fam{ille}'],
        ['ill', 'un pap{ill}on'],
        ['i', 'un pan{i}er'],
        ['y', 'un cra{y}on'],
      ],
      'Ville, mille et tranquille se lisent [il] et non [ill]. Trois mots, et il faut les connaître.',
    ),
  ],
};
