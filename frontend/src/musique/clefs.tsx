/**
 * Les deux clés, gravées.
 *
 * ── Pourquoi celles-ci et pas les miennes ────────────────────────────────────────────
 *
 * Une clé de sol se dessine mal à la main. J'ai essayé, au trait, et le résultat se
 * reconnaissait sans convaincre : la spirale trop ronde, la hampe absente, la queue
 * escamotée. Or c'est le symbole qu'elle regarde à CHAQUE question, et un dessin
 * approximatif à cet endroit-là décrédibilise tout le reste.
 *
 * Ces deux tracés viennent donc de Wikimedia Commons, tous deux dans le DOMAINE PUBLIC :
 *   - clé de sol : File:GClef.svg
 *   - clé de fa  : File:Music-Fclef.svg
 * Aucune attribution n'est exigée par leur licence ; elle est donnée ici par honnêteté,
 * et pour qu'on sache d'où ça vient si la question se pose un jour.
 *
 * ── Comment elles se posent ──────────────────────────────────────────────────────────
 *
 * Une clé n'est pas décorative : sa position DIT quelque chose. La spirale de la clé de
 * sol doit tomber exactement sur la deuxième ligne, et les deux points de la clé de fa
 * encadrer la quatrième. Ces deux repères ont été mesurés sur les dessins eux-mêmes, en
 * les rendant en grand et en regardant où tombait la spirale et le milieu des points,
 * plutôt qu'estimés à l'oeil.
 */

/** La spirale de la clé de sol, en fraction de la hauteur du dessin depuis son sommet. */
const SPIRALE = 0.6175;
/** La hauteur de la clé de sol, en unités de portée (un interligne en vaut dix). */
const HAUTEUR_SOL = 70;
/** Le rapport largeur sur hauteur du dessin d'origine. */
const RAPPORT_SOL = 15.186 / 40.768;

/** Le milieu des deux points de la clé de fa, en fraction de la hauteur du dessin. */
const POINTS = 0.3129;
const HAUTEUR_FA = 42;
/** La boîte du dessin dans son fichier d'origine : il n'est pas calé sur zéro. */
const BOITE_FA = { x: 202.5, y: 7, largeur: 199, hauteur: 227.5 };

interface Props {
  /** Où se pose le repère de la clé : la deuxième ligne pour sol, la quatrième pour fa. */
  ligne: number;
  /** Le bord gauche du dessin. */
  x?: number;
}

export function CleDeSol({ ligne, x = 2 }: Props) {
  const echelle = HAUTEUR_SOL / 40.768;
  const y = ligne - SPIRALE * HAUTEUR_SOL;
  return (
    <g
      className="Portee__cleGravee"
      transform={`translate(${String(x)} ${String(y)}) scale(${String(echelle)})`}
    >
      <path d="m12.049 3.5296c0.305 3.1263-2.019 5.6563-4.0772 7.7014-0.9349 0.897-0.155 0.148-0.6437 0.594-0.1022-0.479-0.2986-1.731-0.2802-2.11 0.1304-2.6939 2.3198-6.5875 4.2381-8.0236 0.309 0.5767 0.563 0.6231 0.763 1.8382zm0.651 16.142c-1.232-0.906-2.85-1.144-4.3336-0.885-0.1913-1.255-0.3827-2.51-0.574-3.764 2.3506-2.329 4.9066-5.0322 5.0406-8.5394 0.059-2.232-0.276-4.6714-1.678-6.4836-1.7004 0.12823-2.8995 2.156-3.8019 3.4165-1.4889 2.6705-1.1414 5.9169-0.57 8.7965-0.8094 0.952-1.9296 1.743-2.7274 2.734-2.3561 2.308-4.4085 5.43-4.0046 8.878 0.18332 3.334 2.5894 6.434 5.8702 7.227 1.2457 0.315 2.5639 0.346 3.8241 0.099 0.2199 2.25 1.0266 4.629 0.0925 6.813-0.7007 1.598-2.7875 3.004-4.3325 2.192-0.5994-0.316-0.1137-0.051-0.478-0.252 1.0698-0.257 1.9996-1.036 2.26-1.565 0.8378-1.464-0.3998-3.639-2.1554-3.358-2.262 0.046-3.1904 3.14-1.7356 4.685 1.3468 1.52 3.833 1.312 5.4301 0.318 1.8125-1.18 2.0395-3.544 1.8325-5.562-0.07-0.678-0.403-2.67-0.444-3.387 0.697-0.249 0.209-0.059 1.193-0.449 2.66-1.053 4.357-4.259 3.594-7.122-0.318-1.469-1.044-2.914-2.302-3.792zm0.561 5.757c0.214 1.991-1.053 4.321-3.079 4.96-0.136-0.795-0.172-1.011-0.2626-1.475-0.4822-2.46-0.744-4.987-1.116-7.481 1.6246-0.168 3.4576 0.543 4.0226 2.184 0.244 0.577 0.343 1.197 0.435 1.812zm-5.1486 5.196c-2.5441 0.141-4.9995-1.595-5.6343-4.081-0.749-2.153-0.5283-4.63 0.8207-6.504 1.1151-1.702 2.6065-3.105 4.0286-4.543 0.183 1.127 0.366 2.254 0.549 3.382-2.9906 0.782-5.0046 4.725-3.215 7.451 0.5324 0.764 1.9765 2.223 2.7655 1.634-1.102-0.683-2.0033-1.859-1.8095-3.227-0.0821-1.282 1.3699-2.911 2.6513-3.198 0.4384 2.869 0.9413 6.073 1.3797 8.943-0.5054 0.1-1.0211 0.143-1.536 0.143z" />
    </g>
  );
}

/** La largeur que la clé de sol occupe, pour que les notes commencent après. */
export const LARGEUR_SOL = HAUTEUR_SOL * RAPPORT_SOL;
export const LARGEUR_FA = (HAUTEUR_FA * BOITE_FA.largeur) / BOITE_FA.hauteur;

export function CleDeFa({ ligne, x = 2 }: Props) {
  const echelle = HAUTEUR_FA / BOITE_FA.hauteur;
  const y = ligne - POINTS * HAUTEUR_FA;
  return (
    <g
      className="Portee__cleGravee"
      transform={`translate(${String(x)} ${String(y)}) scale(${String(echelle)}) translate(${String(-BOITE_FA.x)} ${String(-BOITE_FA.y)})`}
    >
      <g transform="matrix(3,0,0,3,15,-150)">
        <path d="m 62.511677,127.84048 c 0,-0.83977 4.041963,-4.29526 8.982141,-7.67885 10.621365,-7.27471 18.291956,-15.2339 22.753427,-23.609504 10.231245,-19.207279 6.990215,-39.234197 -6.645392,-41.063116 -7.541825,-1.01157 -17.090176,4.491435 -17.090176,9.84959 0,1.98778 0.508501,2.147884 6.037438,1.900912 6.764925,-0.302182 11.341654,6.282702 7.680759,11.050886 -5.784567,7.53419 -19.718197,3.205925 -19.718197,-6.12515 0,-8.178104 4.976735,-14.686661 13.736031,-17.963933 18.744999,-7.013402 36.588252,5.915889 35.025872,25.379878 -1.28058,15.953347 -15.170703,30.852697 -42.135847,45.197347 -6.39814,3.40362 -8.626056,4.19445 -8.626056,3.06194 z" />
        <path
          transform="matrix(0.8552381,0,0,0.8552381,13.155357,9.9952378)"
          d="m 135,65.625 c 0,3.796958 -2.93813,6.875 -6.5625,6.875 -3.62437,0 -6.5625,-3.078042 -6.5625,-6.875 0,-3.796958 2.93813,-6.875 6.5625,-6.875 3.62437,0 6.5625,3.078042 6.5625,6.875 z"
        />
        <path
          transform="matrix(0.8552381,0,0,0.8552381,13.542857,29.875)"
          d="m 135,65.625 c 0,3.796958 -2.93813,6.875 -6.5625,6.875 -3.62437,0 -6.5625,-3.078042 -6.5625,-6.875 0,-3.796958 2.93813,-6.875 6.5625,-6.875 3.62437,0 6.5625,3.078042 6.5625,6.875 z"
        />
      </g>
    </g>
  );
}
