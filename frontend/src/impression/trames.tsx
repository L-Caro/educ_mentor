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

/** Reglure Seyes, celle du cahier d'ecole : interligne de 2 mm, ligne forte tous les
 * 8 mm, verticales tous les 8 mm.
 *
 * La marge rouge n'est pas ici mais sur le bloc (`LignesEcriture`) : elle court le long
 * de la colonne entiere, pas d'une ligne isolee. */
export function TrameSeyes({ hauteurMm }: { hauteurMm: number }) {
  return <div className="Trame Trame--seyes" style={{ height: `${hauteurMm}mm` }} />;
}

/** Quadrillage 5 mm, celui des maths et du trace. */
export function TrameCarreaux({
  largeurMm,
  hauteurMm,
}: {
  largeurMm: number;
  hauteurMm: number;
}) {
  return (
    <div
      className="Trame Trame--carreaux"
      style={{ width: `${largeurMm}mm`, height: `${hauteurMm}mm` }}
    />
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
          <TrameSeyes hauteurMm={8} />
        </li>
      ))}
    </ol>
  );
}
