import type { MotAffiche } from './grammaire.type';

/** La phrase en lecture seule, avec des mots mis en avant.
 *
 * Deux usages : souligner le mot dont on demande la nature, et montrer dans la fiche les
 * mots qu'il fallait toucher. Le même rendu dans les deux cas — l'enfant retrouve dans
 * l'explication exactement ce qu'elle a vu dans la question. */
export default function PhraseMarquee({
  mots,
  marques,
  variante = 'souligne',
}: {
  mots: MotAffiche[];
  /** Index des mots à mettre en avant. */
  marques: number[];
  variante?: 'souligne' | 'surligne';
}) {
  const enAvant = new Set(marques);

  return (
    <p className="PhraseMarquee">
      {mots.map((mot, index) => (
        <span key={index}>
          {index > 0 && !mot.colle ? ' ' : ''}
          {enAvant.has(index) ? (
            <mark className={`PhraseMarquee__mot PhraseMarquee__mot--${variante}`}>
              {mot.mot}
            </mark>
          ) : (
            mot.mot
          )}
          {mot.apres}
        </span>
      ))}
    </p>
  );
}
