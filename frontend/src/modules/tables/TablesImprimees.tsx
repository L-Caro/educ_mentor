import Blanc from 'src/impression/Blanc';
import './tables.impression.scss';

interface LigneTable {
  facteur: number;
  produit: number;
}

/** `7 × 8 = ____` */
export function Produit({ d }: { d: Record<string, unknown> }) {
  return (
    <span>
      {String(d.a)} × {String(d.b)} = <Blanc />
    </span>
  );
}

/**
 * `7 × ___ = 56`, ou `___ × 8 = 56`.
 *
 * Le cote cache est tire au sort par le serveur. Toujours cacher le second ferait
 * apprendre la POSITION du trou plutot que la table.
 */
export function FacteurManquant({ d }: { d: Record<string, unknown> }) {
  return d.cacheGauche ? (
    <span>
      <Blanc largeurMm={12} /> × {String(d.b)} = {String(d.reponse)}
    </span>
  ) : (
    <span>
      {String(d.a)} × <Blanc largeurMm={12} /> = {String(d.reponse)}
    </span>
  );
}

/** `56 = ___ × ___`. Plusieurs reponses sont justes, et c'est l'interet : on cherche une
 * decomposition, pas LA decomposition. */
export function Decomposition({ d }: { d: Record<string, unknown> }) {
  return (
    <span>
      {String(d.reponse)} = <Blanc largeurMm={12} /> × <Blanc largeurMm={12} />
    </span>
  );
}

/** `7, 14, ___, 28, ___`. Le meme savoir que la table, vu comme un comptage. */
export function Suite({ d }: { d: Record<string, unknown> }) {
  const termes = d.termes as number[];
  const trous = d.trous as number[];
  return (
    <span>
      {termes.map((terme, rang) => (
        <span key={rang}>
          {rang > 0 ? ', ' : ''}
          {trous.includes(rang) ? <Blanc largeurMm={12} /> : terme}
        </span>
      ))}
    </span>
  );
}

/** Une table entiere. `memo` la rend deja remplie : ce n'est plus un exercice mais une
 * fiche a garder sous les yeux ou a coller dans un cahier. */
export function TableComplete({
  d,
  memo,
}: {
  d: Record<string, unknown>;
  memo: boolean;
}) {
  const lignes = d.lignes as LigneTable[];
  return (
    <div>
      <p className="Feuille__consigne">Table de {String(d.table)}</p>
      <table className="TableImprimee">
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.facteur}>
              <td>
                {String(d.table)} × {ligne.facteur} =
              </td>
              <td>{memo ? <strong>{ligne.produit}</strong> : <Blanc largeurMm={14} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
