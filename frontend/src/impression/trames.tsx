import './impression.scss';

/**
 * Les trames de papier : les carreaux des maths, la reglure de l'ecriture.
 *
 * ⚠️ Elles ne valent QUE si la page est imprimee a 100 %. Le navigateur propose par
 * defaut d'ajuster a la page, et des lignes Seyes a 94 % ne sont plus des lignes Seyes :
 * l'enfant ecrirait entre des interlignes qui ne sont pas les siens, et un carre de 4 cm
 * a tracer en ferait 3,8. C'est pour ca que tout est en MILLIMETRES ici, et non en
 * pixels : le millimetre est la seule unite que l'imprimante respecte.
 */

/**
 * ── Des BORDURES, jamais des fonds ───────────────────────────────────────────────────
 *
 * Premiere version : `repeating-linear-gradient`, elegant et court. Sauf que c'est un
 * fond, et que Chrome n'imprime pas les fonds tant que « Graphiques d'arriere-plan »
 * n'est pas coche. Cette case est DECOCHEE par defaut : la feuille serait sortie sans la
 * moindre ligne, et l'enfant aurait eu une page blanche numerotee.
 *
 * Une bordure, elle, fait partie du contenu et s'imprime toujours. C'est plus verbeux,
 * c'est le prix a payer pour une feuille qui sort comme on l'a dessinee.
 */

/** Un groupe Seyes : 8 mm de haut, trois interlignes de 2 mm puis la ligne forte. C'est
 * la hauteur d'une ligne d'ecriture dans son cahier. */
export function TrameSeyes({ groupes = 1 }: { groupes?: number }) {
  return (
    <div className="Seyes">
      {Array.from({ length: groupes }, (_, g) => (
        <div key={g} className="Seyes__groupe">
          <div className="Seyes__interligne" />
          <div className="Seyes__interligne" />
          <div className="Seyes__interligne" />
          <div className="Seyes__interligne Seyes__interligne--forte" />
        </div>
      ))}
    </div>
  );
}

/** Quadrillage 5 mm, celui des maths et du trace. Des cellules bordees, pour la meme
 * raison que ci-dessus. */
export function TrameCarreaux({
  colonnes,
  lignes,
}: {
  colonnes: number;
  lignes: number;
}) {
  return (
    <div
      className="Carreaux"
      style={{ gridTemplateColumns: `repeat(${colonnes}, 5mm)` }}
    >
      {Array.from({ length: colonnes * lignes }, (_, index) => (
        <div key={index} className="Carreaux__case" />
      ))}
    </div>
  );
}

/**
 * Un bloc de lignes numerotees, pour la dictee.
 *
 * Numerotees parce qu'une dictee se corrige phrase par phrase, et qu'un numero devant
 * chaque ligne permet a l'adulte de dire « regarde la trois » sans compter.
 */
export function LignesEcriture({ nombre }: { nombre: number }) {
  return (
    <ol className="LignesEcriture">
      {Array.from({ length: nombre }, (_, index) => (
        <li key={index} className="LignesEcriture__ligne">
          <TrameSeyes />
        </li>
      ))}
    </ol>
  );
}
