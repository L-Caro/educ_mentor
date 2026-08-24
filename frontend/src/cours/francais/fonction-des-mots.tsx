import type { GrandeNotion } from '../cours.types';
import Phrases from '../components/Phrases';

/**
 * La fonction des mots, au CE1.
 *
 * La nature d'un mot ne change jamais : « chat » est un nom partout. Sa fonction, si :
 * le même mot est sujet dans une phrase et complément dans une autre. C'est la
 * distinction que ces trois fiches installent, et elle vient donc après « La nature des
 * mots ».
 *
 * Chaque fiche donne un test manipulatoire, pas une définition : on déplace, on demande
 * « qui ? », on enlève. C'est ce qui marche à cet âge.
 */

export const fonctionDesMots: GrandeNotion = {
  slug: 'fonction-des-mots',
  titre: 'La fonction des mots',
  resume:
    "Le groupe nominal, le sujet, les compléments. Ce que les mots FONT dans la phrase, pas ce qu'ils sont.",

  concepts: [
    {
      slug: 'le-groupe-nominal',
      titre: 'Le groupe nominal',
      source: 'ce1.francais.le-groupe-nominal',
      fiche: {
        titre: 'Le groupe nominal',
        idee: "Le groupe nominal, c'est le nom et tous les mots qui l'accompagnent : son déterminant, et ses adjectifs s'il en a. Il se déplace d'un bloc dans la phrase, et c'est justement comme ça qu'on le repère.",
        regle: [
          'Il contient toujours un déterminant et un nom.',
          'Il peut contenir un ou plusieurs adjectifs.',
          "le petit chat noir : c'est un seul groupe nominal.",
        ],
        exemple: (
          <Phrases
            lignes={[
              '[Le chat] dort.',
              '[Le petit chat noir] dort.',
              '[La voisine] a vu [le petit chat noir].',
            ]}
          />
        ),
        piege:
          'Un nom propre forme un groupe nominal à lui tout seul, sans déterminant : Maëve dort.',
      },
    },

    {
      slug: 'le-sujet',
      titre: 'Le sujet du verbe',
      source: 'ce1.francais.le-sujet-du-verbe',
      fiche: {
        titre: 'Le sujet du verbe',
        idee: "Le sujet, c'est qui fait l'action. Pour le trouver, on ne devine pas : on cherche d'abord le verbe, puis on demande « qui est-ce qui ? » devant lui. Ce qui répond est le sujet, et c'est lui qui commande l'accord.",
        regle: [
          'Je trouve le verbe.',
          'Je demande : qui est-ce qui... ?',
          'La réponse est le sujet.',
        ],
        exemple: (
          <Phrases
            lignes={[
              '[Le petit chat] dort.',
              'Qui est-ce qui dort ? [le petit chat]',
              '[Maëve et Léa] chantent.',
            ]}
          />
        ),
        piege:
          "Le sujet n'est pas toujours devant le verbe. Dans « Sous la table dort le chat », c'est le chat qui dort.",
      },
    },

    {
      slug: 'les-complements',
      titre: 'Les compléments',
      source: 'ce1.francais.les-complements',
      fiche: {
        titre: 'Les compléments',
        idee: "Le complément donne une information de plus sur le verbe : où, quand, comment. La différence avec le sujet tient en un test : on peut souvent l'enlever, et la phrase reste correcte.",
        regle: [
          'Il répond à où, quand, comment.',
          'Il peut suivre le verbe, ou en être loin.',
          "Je l'enlève : la phrase tient encore.",
        ],
        exemple: (
          <Phrases
            lignes={[
              'Le chat dort [sur le tapis].',
              '[Ce matin], le chat dort.',
              'Le chat dort [profondément].',
            ]}
          />
        ),
        piege:
          "Enlever un complément ne casse pas la phrase, mais lui retire une information. « Le chat dort » reste correct, et c'est ce test qui distingue le complément du sujet.",
      },
    },
  ],
};
