import Portee from 'src/musique/Portee';
import type { GrandeNotion } from '../cours.types';

/**
 * La portée et les clés.
 *
 * Écrit pour LIONEL, pas pour Maëve : c'est la règle de toute la bibliothèque, et elle
 * vaut doublement ici. Il n'a jamais fait de musique, et il ne peut pas l'aider sur une
 * matière dont il ne connaît pas le vocabulaire. Ces fiches lui donnent de quoi ouvrir
 * son cahier avec elle et comprendre ce qu'il regarde.
 *
 * Les exemples sont de VRAIES portées, le même composant que les exercices. Une leçon sur
 * la clé de sol qui montrerait une image approximative apprendrait une clé approximative.
 *
 * Aucune de ces fiches n'a de `source` : le corpus ne contient pas une ligne de solfège.
 * Elles sont écrites d'après la méthode qu'elle utilise en cours.
 */

/** Une portée courte, taillée pour une fiche : pas de note à jouer, juste à regarder. */
const exemple = (cle: 'sol' | 'fa', positions: number[]) => (
  <Portee
    cle={cle}
    symboles={positions.map((position) => ({
      position,
      figure: 'ronde' as const,
    }))}
    espace={44}
  />
);

const ENTRAINEMENT = { moduleId: 'solfege', label: 'Solfège' };

export const laPortee: GrandeNotion = {
  slug: 'la-portee',
  titre: 'La portée et les clés',
  resume:
    'Où se posent les notes, et pourquoi le même dessin ne se lit pas toujours pareil.',

  concepts: [
    {
      slug: 'les-cinq-lignes',
      titre: 'Les cinq lignes',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'La portée',
        idee: "La portée, ce sont cinq lignes. Une note se pose soit SUR une ligne, soit ENTRE deux lignes. Plus elle est haute sur la portée, plus le son est aigu. Monter d'une case, c'est passer à la note suivante.",
        regle: [
          'Les 7 notes tournent en boucle : do ré mi fa sol la si, puis on recommence.',
          'Une case = une note. Deux cases = on saute une note.',
          "Les espaces entre les lignes s'appellent des interlignes.",
        ],
        exemple: exemple('sol', [0, 1, 2, 3, 4, 5, 6, 7, 8]),
        piege:
          "On compte les cases, pas les lignes. Entre deux lignes voisines il y a UNE note, celle de l'interligne : do (ligne), ré (interligne), mi (ligne).",
      },
    },
    {
      slug: 'la-cle-de-sol',
      titre: 'La clé de sol',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'La clé de sol',
        idee: "La clé ne se joue pas : elle NOMME. Sa spirale s'enroule autour de la deuxième ligne en partant du bas, et c'est ce qui décide que cette ligne-là s'appelle sol. Tout le reste se compte à partir de là.",
        regle: [
          'La spirale entoure la 2e ligne : cette ligne est un sol.',
          'En dessous : mi (1re ligne), fa (1er interligne).',
          "Au-dessus : la, si, do, ré, mi, fa jusqu'en haut.",
        ],
        exemple: exemple('sol', [0, 2, 4, 6, 8]),
        piege:
          "On compte les lignes DEPUIS LE BAS. La deuxième ligne est l'avant-dernière quand on lit la portée de haut en bas, et c'est l'erreur la plus fréquente quand on découvre.",
      },
    },
    {
      slug: 'la-cle-de-fa',
      titre: 'La clé de fa',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'La clé de fa',
        idee: "Même portée, autre clé, autres noms. Les deux points de la clé de fa encadrent la quatrième ligne : c'est elle qui s'appelle fa. Le même dessin de note change donc de nom selon la clé, et RIEN sur la page ne le signale à part la clé elle-même.",
        regle: [
          'Les deux points encadrent la 4e ligne : cette ligne est un fa.',
          'Une note sur la 2e ligne : un sol en clé de sol, un si en clé de fa.',
          'La clé de fa sert aux sons graves : main gauche du piano, grosse caisse.',
        ],
        exemple: exemple('fa', [0, 2, 4, 6, 8]),
        piege:
          "Ce n'est pas une nouvelle échelle à apprendre : c'est la même, décalée. Lire une portée en clé de fa comme une clé de sol donne toujours deux notes d'écart.",
      },
    },
    {
      slug: 'la-lecture-de-notes',
      titre: 'La lecture de notes',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'La lecture de notes',
        idee: "Dans sa méthode, l'exercice de lecture de notes s'écrit entièrement en rondes. Ce n'est pas un rythme : les rondes ne servent que de support, parce que c'est la figure la plus lisible. On ne lit que les hauteurs, et on les nomme à voix haute, de plus en plus vite.",
        regle: [
          "Toutes les notes ont la même forme : il n'y a rien à compter.",
          'Les liaisons regroupent les notes par paquets de trois ou quatre.',
          "On lit par groupes, pas note à note : c'est ce qui fait gagner en vitesse.",
        ],
        exemple: exemple('sol', [2, 3, 4, 5, 6, 5, 4]),
        piege:
          "Une ronde vaut quatre temps quand on lit un rythme. Ici elle ne vaut rien du tout. C'est la même forme qui sert à deux choses différentes, et il faut regarder de quel exercice il s'agit pour savoir laquelle.",
      },
    },
    {
      slug: 'les-lignes-supplementaires',
      titre: 'Les lignes supplémentaires',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Les lignes supplémentaires',
        idee: "Quand une note est trop haute ou trop basse pour tenir dans les cinq lignes, on ne change pas de portée : on ajoute un petit trait, juste pour elle. C'est une ligne supplémentaire, et elle se compte comme les autres.",
        regle: [
          'Un trait par ligne franchie, pas un seul pour aller plus loin.',
          'Le do juste sous la portée en clé de sol est le do du milieu du piano.',
          'Ce même do est juste au-dessus de la portée en clé de fa.',
        ],
        exemple: exemple('sol', [-2, 0, 4, 8, 10]),
        piege:
          "Une note posée dans l'espace au-dessus d'une ligne supplémentaire n'a pas de trait à elle : c'est le trait du dessous qui la situe. Sans lui, on ne sait plus compter.",
      },
    },
  ],
};
