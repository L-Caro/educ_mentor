import Blanc from 'src/impression/Blanc';

/** Le vrai signe moins a la place du trait d'union du code. Sur du papier, « 43 - 35 » se
 * lit comme un tiret de liste ou un trait d'union : le signe moins est plus long, pose a
 * la hauteur de la barre du plus, et c'est celui qu'elle voit dans son cahier. */
function signes(texte: string): string {
  return texte.replace(/ - /g, ' \u2212 ');
}

/**
 * `24 + 17 = ____`, `Moitie de 20 = ____`, ou `8 + ____ = 29`.
 *
 * L'enonce du module porte un `?` a l'endroit de la reponse, et cet endroit n'est pas
 * toujours la fin : « 8 + ? = 29 » demande le terme du milieu. Ajouter « = ___ » derriere
 * donnait « 8 + ? = 29 = ___ », qui pose deux questions la ou il n'y en a qu'une, et dont
 * aucune des deux n'est celle du module.
 *
 * On remplace donc le `?` la ou il est. Il n'y a qu'un cas ou l'on ajoute : quand
 * l'enonce se termine par « = ? », parce qu'alors le signe egal fait deja partie de la
 * question et qu'il faut lui laisser sa place.
 */
export function Operation({ d }: { d: Record<string, unknown> }) {
  const enonce = signes(String(d.operation));

  const termine = /\s*=\s*\?\s*$/.exec(enonce);
  if (termine) {
    return (
      <span>
        {enonce.slice(0, termine.index)} = <Blanc />
      </span>
    );
  }

  const rang = enonce.indexOf('?');
  if (rang >= 0) {
    return (
      <span>
        {enonce.slice(0, rang)}
        <Blanc largeurMm={14} />
        {enonce.slice(rang + 1)}
      </span>
    );
  }

  return (
    <span>
      {enonce} = <Blanc />
    </span>
  );
}

/**
 * `7 × 8 = 54` ☐ vrai ☐ faux.
 *
 * Les deux cases sont dessinees et non ecrites en caracteres : une case a cocher se coche
 * au crayon, un mot a entourer se rature.
 */
export function VraiFaux({ d }: { d: Record<string, unknown> }) {
  return (
    <span>
      {signes(String(d.operation))} = {String(d.affiche)}
      <span className="CalculImprime__cases">
        <span className="CalculImprime__case" /> vrai
        <span className="CalculImprime__case" /> faux
      </span>
    </span>
  );
}

/** `24 + ___ = 41` */
export function Trous({ d }: { d: Record<string, unknown> }) {
  return (
    <span>
      {String(d.gauche)} {String(d.signe).replace('-', '\u2212')}{' '}
      <Blanc largeurMm={14} /> = {String(d.droite)}
    </span>
  );
}

/** `12 → +5 → ×2 → −4 → ___`. Une seule reponse pour trois operations : ce qui se
 * travaille est de tenir la chaine sans poser. */
export function File({ d }: { d: Record<string, unknown> }) {
  const etapes = d.etapes as { signe: string; valeur: number }[];
  return (
    <span>
      {String(d.depart)}
      {etapes.map((etape, rang) => (
        <span key={rang}>
          {/* La fleche est COLOREE, et c'est le seul endroit de la feuille ou la couleur
              porte du sens. Une file s'ecrit tout du long en noir : « 2 → x2 → −2 → +8 »
              se lit alors comme une seule expression, alors que ce sont trois etapes
              successives, et l'enfant cherche a tout faire d'un coup. La fleche separe ce
              que le noir avait colle. */}
          <span className="CalculImprime__fleche"> → </span>
          {etape.signe}
          {etape.valeur}
        </span>
      ))}
      <span className="CalculImprime__fleche"> → </span>
      <Blanc largeurMm={14} />
    </span>
  );
}
