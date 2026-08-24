import type { ReactNode } from 'react';

/**
 * Rend `texte` en mettant `fragment` en évidence, s'il s'y trouve tel quel.
 *
 * Utilisé à deux endroits qui doivent se ressembler : le texte affiché pendant le jeu, où
 * l'on surligne le passage qui répond, et la fiche de leçon, où l'on surligne la réponse
 * dans ce passage. Un fragment introuvable rend le texte sans marque plutôt que de tenter
 * une approximation : mieux vaut ne rien surligner que surligner à côté.
 */
export function surligner(texte: string, fragment: string | null, className: string): ReactNode {
  if (!fragment) return texte;

  const index = texte.indexOf(fragment);
  if (index === -1) return texte;

  return (
    <>
      {texte.slice(0, index)}
      <mark className={className}>{fragment}</mark>
      {texte.slice(index + fragment.length)}
    </>
  );
}
