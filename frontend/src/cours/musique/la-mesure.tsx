import Portee from 'src/musique/Portee';
import type { GrandeNotion } from '../cours.types';

/**
 * La mesure et la pulsation : comment on compte.
 *
 * Vient en dernier, parce qu'elle a besoin des deux autres : on ne compte des temps qu'une
 * fois qu'on sait les lire, et on ne remplit une mesure qu'une fois qu'on sait ce qu'une
 * figure vaut.
 *
 * La dernière fiche explique pourquoi son cahier contient DEUX sortes d'exercices qui ne
 * se ressemblent pas. C'est la question que Lionel a posée en découvrant ses pages, et
 * elle n'a rien d'évident quand on n'a jamais fait de solfège.
 */

const ENTRAINEMENT = { moduleId: 'solfege', label: 'Solfège' };

const rythme = (
  suite: {
    figure: 'ronde' | 'blanche' | 'noire';
    silence?: boolean;
    syllabe?: string;
  }[],
  barres: number[] = [],
) => (
  <Portee
    cle="rythme"
    espace={42}
    barres={barres}
    symboles={suite.map((s) => ({ position: 4, ...s }))}
  />
);

export const laMesure: GrandeNotion = {
  slug: 'la-mesure',
  titre: 'La mesure et la pulsation',
  resume:
    'Le battement régulier qui porte tout, et le découpage en mesures qui font toutes la même longueur.',

  concepts: [
    {
      slug: 'la-pulsation',
      titre: 'La pulsation',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'La pulsation',
        idee: "La pulsation, c'est le battement régulier qu'on tape du pied. Elle ne se voit nulle part sur la partition : elle est dessous, tout le temps, et c'est elle qui donne leur durée aux notes. Le métronome ne l'invente pas, il la rend audible.",
        regle: [
          "Le tempo se compte en pulsations par minute. 60, c'est une par seconde.",
          "Une noire dure une pulsation : c'est la référence de tout le reste.",
          'Changer le tempo change la vitesse, jamais les durées entre elles.',
        ],
        exemple: rythme([
          { figure: 'noire', syllabe: 'Taé' },
          { figure: 'noire', syllabe: 'Taé' },
          { figure: 'noire', syllabe: 'Taé' },
          { figure: 'noire', syllabe: 'Taé' },
        ]),
        piege:
          "Accélérer n'est pas jouer un rythme plus court. Une blanche reste deux fois plus longue qu'une noire à n'importe quelle vitesse. Jouer plus vite, c'est raccourcir TOUT dans la même proportion.",
      },
    },
    {
      slug: 'les-barres-de-mesure',
      titre: 'Les barres de mesure',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Les barres de mesure',
        idee: 'Les traits verticaux découpent la musique en mesures qui font TOUTES le même nombre de temps. Deux chiffres au début le disent : celui du haut compte les temps, celui du bas dit quelle figure en vaut un.',
        regle: [
          'Un 2 en haut : deux temps par mesure. Un 3 : trois. Un 4 : quatre.',
          "Un 4 en bas : la noire vaut un temps. C'est le cas le plus courant.",
          'Silences compris : une mesure se remplit exactement, jamais à peu près.',
        ],
        exemple: rythme(
          [
            { figure: 'noire' },
            { figure: 'noire' },
            { figure: 'blanche' },
            { figure: 'noire' },
            { figure: 'noire', silence: true },
          ],
          [1, 2],
        ),
        piege:
          "La barre de mesure ne s'entend pas et ne dure rien. C'est un repère pour l'oeil, pas une respiration. On ne s'arrête pas dessus.",
      },
    },
    {
      slug: 'les-deux-lectures',
      titre: 'Les deux lectures',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Les deux lectures',
        idee: "Son cahier contient deux exercices qui ne se ressemblent pas, et c'est voulu. En lecture de NOTES, tout est écrit en rondes sur cinq lignes : il n'y a aucun rythme à lire, seulement des hauteurs. En lecture RYTHMIQUE, tout est écrit sur une seule ligne : il n'y a aucune hauteur à lire, seulement des durées. Une difficulté à la fois.",
        regle: [
          'Cinq lignes et une clé : on nomme les notes, on ne compte pas.',
          'Une seule ligne, aucune clé : on frappe les durées, on ne nomme pas.',
          'Les deux se rejoignent plus tard, quand chacune est acquise.',
        ],
        exemple: (
          <>
            <Portee
              cle="sol"
              espace={40}
              symboles={[0, 2, 4, 3, 1].map((position) => ({
                position,
                figure: 'ronde' as const,
              }))}
            />
            {rythme(
              [
                { figure: 'noire' },
                { figure: 'noire', silence: true },
                { figure: 'blanche' },
              ],
              [1],
            )}
          </>
        ),
        piege:
          "La ronde de la lecture de notes ne vaut pas quatre temps : elle ne vaut rien du tout, c'est juste la forme la plus lisible. Et la note posée sur la ligne de la lecture rythmique ne vaut aucune hauteur. Lire l'une comme l'autre est l'erreur du débutant.",
      },
    },
  ],
};
