import { MODELES } from '../programmation.blocs';
import type { SorteBloc } from '../programmation.types';

/** Les ordres disponibles. Seuls ceux de l'etape : une palette qui offrirait tout des le
 * premier niveau noierait ce qu'on cherche a montrer, et la repetition ne veut rien dire
 * tant que la file tient en trois ordres. */
export default function Palette({
  blocs,
  surAjout,
  bloque,
}: {
  blocs: SorteBloc[];
  surAjout: (sorte: SorteBloc) => void;
  bloque: boolean;
}) {
  return (
    <div className="Prog__palette">
      <p className="Prog__titre">Les ordres</p>
      <div className="Prog__paletteBlocs">
        {blocs.map((sorte) => {
          const modele = MODELES[sorte];
          return (
            <button
              key={sorte}
              type="button"
              className={`Prog__bloc Prog__bloc--${modele.famille} Prog__bloc--offert`}
              onClick={() => surAjout(sorte)}
              disabled={bloque}
            >
              <span className="Prog__signe">{modele.signe}</span>
              <span className="Prog__mot">{modele.mot}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
