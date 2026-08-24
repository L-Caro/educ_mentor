import type { Fiche } from 'src/types/fiche.types';
import type { LectureQuestion } from './lecture.type';
import { surligner } from './surligner';

/**
 * En compréhension de texte, il n'y a pas de règle à énoncer : la fiche montre L'ENDROIT
 * du texte qui répond, avec la réponse mise en évidence dedans.
 *
 * C'est le geste qui compte ici. Dire « la réponse était Ithaque » n'apprend rien ;
 * montrer « Tout le monde dans son île d'Ithaque l'aimait » apprend à chercher.
 *
 * Sans extrait, pas de fiche : le moteur n'affiche alors aucun bouton, ce qui vaut mieux
 * qu'une fiche qui répète la correction.
 */
/**
 * Ce qu'on met en évidence dans l'extrait.
 *
 * La réponse attendue est souvent une reformulation : « dix ans » pour « dix longues
 * années », « pour aller à la guerre » pour « dut partir à la guerre ». Elle ne se trouve
 * alors pas telle quelle dans le passage. On retombe sur son mot le plus long, qui suffit
 * à guider l'œil et reste un fragment unique et non ambigu. Faute de mieux, on ne surligne
 * rien : l'extrait seul indique déjà l'endroit, c'est l'essentiel.
 */
export function fragmentASurligner(excerpt: string, answer: string): string | null {
  if (excerpt.includes(answer)) return answer;

  const motLePlusLong = answer
    .split(/[\s,.;:!?'’«»()]+/)
    .filter((mot) => mot.length >= 4 && excerpt.includes(mot))
    .sort((a, b) => b.length - a.length)[0];

  return motLePlusLong ?? null;
}

export function lectureFiche(question: LectureQuestion): Fiche | null {
  if (!question.excerpt) return null;

  return {
    titre: question.text_titre,
    idee: "La réponse est écrite dans le texte. Repère les mots de la question, puis lis la phrase qui les contient.",
    exemple: (
      <p className="LectureExtrait">
        {surligner(
          question.excerpt,
          fragmentASurligner(question.excerpt, question.answer),
          'LectureExtrait__mark',
        )}
      </p>
    ),
    piege: "Ne réponds pas ce que tu crois savoir : c'est le texte qui décide.",
  };
}
