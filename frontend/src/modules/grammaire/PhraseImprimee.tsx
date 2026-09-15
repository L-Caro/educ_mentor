import './grammaire.impression.scss';

export interface MotImprime {
  mot: string;
  apres: string;
  /** Le mot se colle au precedent, sans espace : une apostrophe, une ponctuation. */
  colle: boolean;
}

/**
 * Une phrase imprimee, avec le mot vise souligne.
 *
 * Le soulignement remplace le marquage de l'ecran. Il n'est pas decoratif : la consigne
 * dit « le mot souligne », et sans lui elle ne designe rien. C'est exactement le defaut
 * qu'on a eu en transposant la question du jeu telle quelle.
 */
export default function Phrase({
  mots,
  cible,
}: {
  mots: MotImprime[];
  cible: number | null;
}) {
  return (
    <span className="PhraseImprimee">
      {mots.map((mot, rang) => (
        <span key={rang}>
          {rang === 0 || mot.colle ? '' : ' '}
          <span className={rang === cible ? 'PhraseImprimee__cible' : undefined}>
            {mot.mot}
          </span>
          {mot.apres}
        </span>
      ))}
    </span>
  );
}
