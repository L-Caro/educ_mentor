import Blanc from 'src/impression/Blanc';

/** `24 + 17 = ____` */
export function Operation({ d }: { d: Record<string, unknown> }) {
  return (
    <span>
      {String(d.operation)} = <Blanc />
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
      {String(d.operation)} = {String(d.affiche)}
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
      {String(d.gauche)} {String(d.signe)} <Blanc largeurMm={14} /> = {String(d.droite)}
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
          {' → '}
          {etape.signe}
          {etape.valeur}
        </span>
      ))}
      {' → '}
      <Blanc largeurMm={14} />
    </span>
  );
}
