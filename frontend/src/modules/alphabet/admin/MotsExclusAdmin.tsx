import { useEffect, useState } from 'react';
import {
  useGetAlphabetEtatQuery,
  useGetMotsExclusQuery,
  useExclureMotMutation,
  useLazyChercherMotsQuery,
  useReintegrerMotMutation,
} from '../alphabet.api';
import './motsExclus.scss';

/** Le temps qu'on laisse passer apres la derniere frappe avant d'interroger le serveur.
 * Sans lui, « chaton » envoie six requetes dont cinq ne serviront jamais. */
const REPIT_MS = 250;

/** En dessous, la recherche ne veut rien dire : « ch » rend deja mille mots, « c » en
 * rendrait trois mille dont aucun n'est celui qu'on cherche. Le serveur refuse aussi. */
const MINIMUM = 2;

/**
 * Écarter un mot du référentiel.
 *
 * Le corpus fait vingt-neuf mille mots, derives d'une base de lexique francais. Une liste
 * d'exclusion ecrite a la main en retire deja ce qui n'a rien a faire sous les yeux d'un
 * enfant, mais elle a ete ecrite une fois, par quelqu'un qui n'a pas tout vu. Il reste
 * donc un geste a faire quand un mot tombe : le retirer, tout de suite, sans toucher au
 * code ni redeployer.
 *
 * On ne charge JAMAIS le corpus entier : on cherche. Vingt-neuf mille mots dans un ecran
 * de reglages, ce sont trois cents kilo-octets a chaque ouverture pour trouver un mot
 * qu'on a deja en tete.
 */
export default function MotsExclusAdmin() {
  const [terme, setTerme] = useState('');
  const [chercher, { data: trouves, isFetching }] = useLazyChercherMotsQuery();
  const { data: etat } = useGetAlphabetEtatQuery();
  const { data: exclus } = useGetMotsExclusQuery();
  const [exclure] = useExclureMotMutation();
  const [reintegrer] = useReintegrerMotMutation();

  useEffect(() => {
    if (terme.trim().length < MINIMUM) return;
    const minuteur = setTimeout(() => void chercher(terme.trim()), REPIT_MS);
    return () => clearTimeout(minuteur);
  }, [terme, chercher]);

  const assezLong = terme.trim().length >= MINIMUM;

  return (
    <div className="MotsExclus">
      {etat && (
        <p className="MotsExclus__etat">
          {etat.disponibles.toLocaleString('fr-FR')} mots disponibles
          {etat.exclus > 0 && ` · ${String(etat.exclus)} écartés`}
        </p>
      )}

      <label className="MotsExclus__champ">
        <span>Chercher un mot</span>
        <input
          type="search"
          value={terme}
          placeholder="au moins 2 lettres"
          onChange={(evenement) => setTerme(evenement.target.value)}
        />
      </label>

      {assezLong && (
        <ul className="MotsExclus__resultats">
          {isFetching && !trouves && (
            <li className="MotsExclus__vide">Recherche…</li>
          )}
          {trouves?.length === 0 && (
            <li className="MotsExclus__vide">
              Aucun mot du référentiel ne contient « {terme.trim()} ».
            </li>
          )}
          {trouves?.map(({ mot, exclu }) => (
            <li key={mot} className="MotsExclus__resultat">
              <span className={exclu ? 'MotsExclus__motEcarte' : undefined}>
                {mot}
              </span>
              {exclu ? (
                <button
                  type="button"
                  className="MotsExclus__action"
                  onClick={() => void reintegrer(mot)}
                >
                  Remettre
                </button>
              ) : (
                <button
                  type="button"
                  className="MotsExclus__action MotsExclus__action--ecarter"
                  onClick={() => void exclure(mot)}
                >
                  Écarter
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* La liste des mots deja ecartes. Elle reste courte par nature, donc on la charge
          entierement : c'est le seul endroit d'ou l'on peut revenir sur une exclusion
          faite trop vite, et il faut pouvoir la relire sans la chercher. */}
      {exclus && exclus.length > 0 && (
        <details className="MotsExclus__ecartes">
          <summary>
            {exclus.length} mot{exclus.length > 1 ? 's' : ''} écarté
            {exclus.length > 1 ? 's' : ''} à la main
          </summary>
          <ul>
            {exclus.map(({ mot }) => (
              <li key={mot}>
                <span className="MotsExclus__motEcarte">{mot}</span>
                <button
                  type="button"
                  className="MotsExclus__action"
                  onClick={() => void reintegrer(mot)}
                >
                  Remettre
                </button>
              </li>
            ))}
          </ul>
          <p className="MotsExclus__note">
            La liste principale, celle de départ, vit dans le dépôt :
            <code>scripts/data/mots-ecartes.txt</code>. Elle n’est relue qu’à la
            régénération du corpus ; ce qui est écarté ici l’est tout de suite.
          </p>
        </details>
      )}
    </div>
  );
}
