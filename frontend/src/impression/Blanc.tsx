/**
 * Le blanc ou l'enfant ecrit.
 *
 * Une largeur fixe en millimetres, et non une suite de `_____` en caracteres : sur du
 * papier une suite de tirets se lit mal, ne s'aligne pas d'une ligne a l'autre, et sa
 * longueur depend de la police. Ici on decide combien de place on lui laisse, et c'est
 * une decision d'imprimeur, pas de typographe.
 *
 * Partage des la premiere utilisation, contrairement a la regle des trois usages du
 * projet : les treize modules imprimables en auront besoin, et une largeur qui differe
 * d'un exercice a l'autre se verrait tout de suite sur la feuille.
 */
export default function Blanc({ largeurMm = 18 }: { largeurMm?: number }) {
  return (
    <span
      className="Blanc"
      style={{ width: `${largeurMm}mm` }}
      aria-hidden="true"
    />
  );
}
