import { useMemo, useRef, useState } from 'react';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import Toggle from 'src/components/common/Toggle';
import { useModuleMetaResolver } from 'src/hooks';
import { MODULES } from 'src/modules.manifest';
import FeuilleImprimable from './FeuilleImprimable';
import { useComposerFeuilleMutation } from './impression.api';
import OptionsExercice from './OptionsExercice';
import type {
  ExerciceImprimable,
  ItemImprime,
  LigneComposition,
} from './impression.types';
import './impression.scss';

/** Au-dela, ce n'est plus une feuille d'exercices, c'est une punition. Le serveur applique
 * la meme borne : celle-la protege l'API, celle-ci protege l'adulte de lui-meme. */
const MAXIMUM_ITEMS = 60;

/** Ce qu'un module sort quand on vient de l'activer, tant qu'on n'a rien regle. Une carte
 * qu'on active doit peser sur la feuille tout de suite : a zero, le bouton n'aurait pas
 * bouge et l'interrupteur aurait eu l'air casse. */
const NOMBRE_PAR_DEFAUT = 4;

/** Combien de candidats demander pour en remplacer UN. Le serveur ne dedoublonne qu'a
 * l'interieur d'un appel : en n'en demandant qu'un, on retombait regulierement sur un
 * exercice deja pose, et le bouton avait l'air de ne rien faire. */
const CANDIDATS_PAR_RETIRAGE = 6;

function dateDuJour(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Composer une feuille d'exercices.
 *
 * Dans l'administration, et pas sur l'ecran de l'enfant : imprimer demande une
 * imprimante, du papier, et de decider ce qu'on fait travailler. A sept ans elle ne fait
 * rien de tout ca, et un bouton qui appelle un adulte n'a pas sa place sur son accueil,
 * qu'on vient justement de desencombrer.
 *
 * Une seule page pour tout, plutot qu'un ecran de reglages puis un ecran d'apercu : on
 * regle, on regarde, on corrige, on imprime. Les reglages disparaissent a l'impression.
 *
 * ── Des cartes REPLIEES, une par module ──────────────────────────────────────────────
 *
 * Treize modules deplies d'un coup donnaient une page ou l'on ne trouvait plus rien,
 * alors qu'on compose une feuille avec deux ou trois modules. Chaque carte porte donc un
 * interrupteur, comme les modules du tableau de bord, et ne s'ouvre qu'une fois activee.
 * L'interrupteur fait deux choses a la fois, et c'est voulu : il deplie la carte ET decide
 * que le module entre dans la feuille. Un module qu'on ouvre sans vouloir l'imprimer
 * n'existe pas.
 */
export default function ImpressionPage() {
  const getModuleMeta = useModuleMetaResolver();
  const fournisseurs = useMemo(
    () =>
      MODULES.filter((m) => m.impression).map((m) => ({
        id: m.id,
        ...m.impression!,
      })),
    [],
  );

  /** Les modules qui entrent dans la feuille. Distinct de la selection des types : on
   * garde ce qui a ete coche quand on referme une carte, pour que la rouvrir rende ses
   * reglages plutot que de repartir de rien. */
  const [actifs, setActifs] = useState<Record<string, boolean>>({});
  /** Les types coches, par module. */
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  /** Combien d'exercices par module, repartis entre les types coches. */
  const [nombres, setNombres] = useState<Record<string, number>>({});
  /** Les reglages de contenu, par module. */
  const [reglages, setReglages] = useState<
    Record<string, Record<string, unknown>>
  >({});
  /** Le corrige, DECOCHE par defaut. Il double le nombre de pages, et la plupart des
   * exercices se corrigent a vue par l'adulte qui est a cote. On le coche quand on veut
   * qu'elle se corrige seule. */
  const [avecCorrige, setAvecCorrige] = useState(false);
  /** Numeroter les exercices. DECOCHE par defaut : un numero devant chaque exercice
   * ressemble a une note, et a sept ans la feuille prend l'air d'un controle. Le reglage
   * existe quand meme, parce que le corrige se lit plus vite avec des reperes. */
  const [avecNumeros, setAvecNumeros] = useState(false);
  const [items, setItems] = useState<ItemImprime[] | null>(null);
  /** Les modules actifs qui n'ont rien rendu. Ils ne sont plus une erreur (une dictee
   * manquante ne doit pas emporter les dix exercices de tables), mais ils doivent se
   * DIRE : sans cela, l'adulte coche la dictee, ne la voit pas sur la feuille, et n'a
   * aucun moyen de savoir que c'est parce qu'aucune n'est saisie. */
  const [muets, setMuets] = useState<string[]>([]);
  /** La composition telle qu'elle etait au moment ou la feuille a ete tiree.
   *
   * Sans elle, on cochait deux exercices de plus, on regardait l'apercu qui n'avait pas
   * bouge, et on imprimait une feuille qui ne correspondait plus aux cases cochees. Rien
   * ne le disait : l'apercu a l'air a jour puisqu'il est la. */
  const [tiree, setTiree] = useState<string | null>(null);
  /** L'exercice en cours de retirage, pour que son bouton dise qu'il travaille. */
  const [rejoue, setRejoue] = useState<number | null>(null);
  const apercuRef = useRef<HTMLDivElement>(null);
  const [composer, { isLoading, isError }] = useComposerFeuilleMutation();
  /** Une SECONDE instance de la mutation, pour le retirage d'un seul exercice.
   *
   * La meme aurait partage son `isLoading` avec la barre d'actions : cliquer le petit
   * bouton d'un exercice faisait passer le bouton principal en « Preparation... » et le
   * desactivait, comme si toute la feuille se refaisait. */
  const [composerUn] = useComposerFeuilleMutation();

  const catalogue = useMemo(() => {
    const table = new Map<string, ExerciceImprimable>();
    for (const f of fournisseurs) {
      for (const exercice of f.exercices)
        table.set(`${f.id}/${exercice.cle}`, exercice);
    }
    return table;
  }, [fournisseurs]);

  function compte(id: string): number {
    if (!actifs[id] || (selection[id]?.length ?? 0) === 0) return 0;
    return nombres[id] ?? 0;
  }

  const total = fournisseurs.reduce((somme, f) => somme + compte(f.id), 0);

  /** Activer une carte la garnit si elle est vide : le premier type coche et un nombre
   * par defaut. Sans cela l'interrupteur ouvrait une carte qui ne produisait rien. */
  function basculer(id: string, exercices: ExerciceImprimable[]) {
    const ouvert = !actifs[id];
    setActifs((precedent) => ({ ...precedent, [id]: ouvert }));
    if (!ouvert) return;
    if ((selection[id]?.length ?? 0) === 0 && exercices.length > 0) {
      setSelection((precedent) => ({ ...precedent, [id]: [exercices[0].cle] }));
    }
    if (!nombres[id]) {
      setNombres((precedent) => ({ ...precedent, [id]: NOMBRE_PAR_DEFAUT }));
    }
  }

  /** Referme toutes les cartes. Les reglages sont gardes : on repart d'une feuille
   * blanche, pas d'une application neuve. */
  function toutDecocher() {
    setActifs({});
  }

  const lignes: LigneComposition[] = fournisseurs
    .filter((f) => compte(f.id) > 0)
    .map((f) => ({
      module: f.id,
      exercices: selection[f.id],
      nombre: nombres[f.id],
      options: reglages[f.id],
    }));

  /** La feuille affichee ne correspond plus a ce qui est coche. */
  const perimee = items !== null && tiree !== JSON.stringify(lignes);
  /** Une feuille est la, et elle est a jour : il ne reste qu'a imprimer. */
  const pret = items !== null && !perimee;

  /**
   * Retire UN exercice, sans refaire la feuille.
   *
   * Sur une feuille de quinze exercices, un seul ne convient pas : le refaire entierement
   * changeait les quatorze autres, dont ceux qu'on venait justement de garder.
   *
   * On demande plusieurs candidats en un appel, et on prend le premier qui n'est pas deja
   * sur la feuille. Le serveur ne dedoublonne qu'a l'interieur d'un appel : sans cela,
   * rejouer un exercice pouvait rendre exactement celui d'a cote, ou celui qu'on venait
   * de remplacer, ce qui donne l'impression que le bouton ne fait rien.
   */
  async function rejouerUn(index: number) {
    const item = items?.[index];
    if (!item || rejoue !== null) return;

    setRejoue(index);
    try {
      const candidats = await composerUn([
        {
          module: item.module,
          exercices: [item.exercice],
          nombre: CANDIDATS_PAR_RETIRAGE,
          options: reglages[item.module],
        },
      ]).unwrap();

      const dejaLa = new Set(
        items.map((autre) => JSON.stringify(autre.donnees)),
      );
      const neuf = candidats.find(
        (candidat) => !dejaLa.has(JSON.stringify(candidat.donnees)),
      );
      // Rien de neuf : le vivier est epuise (une seule table cochee, tout est deja sorti).
      // On laisse la feuille telle quelle plutot que de reposer le meme exercice.
      if (!neuf) return;

      const suivants = [...items];
      suivants[index] = neuf;
      setItems(suivants);
    } catch {
      // Un retirage rate ne doit pas emporter la feuille : elle reste ce qu'elle etait.
    } finally {
      setRejoue(null);
    }
  }

  async function preparer() {
    if (lignes.length === 0) return;
    try {
      const rendus = await composer(lignes).unwrap();
      setItems(rendus);
      setTiree(JSON.stringify(lignes));
      // Amener l'oeil a la feuille. Sur une page de treize cartes, l'apercu apparait
      // sous la ligne de flottaison et rien ne signale qu'il est la.
      requestAnimationFrame(() =>
        apercuRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        }),
      );
      // Les TYPES muets, et non les modules. Cocher « accord » et « mettre au pluriel »
      // alors que la notion `accord_gn` est fermee en administration rendait bien des
      // accords : le module n'etait donc pas muet, et rien ne signalait que la moitie de
      // ce qui etait coche n'etait pas sortie.
      setMuets(
        lignes.flatMap((ligne) => {
          const fournisseur = fournisseurs.find((f) => f.id === ligne.module);
          return ligne.exercices
            .filter(
              (cle) =>
                !rendus.some(
                  (item) => item.module === ligne.module && item.exercice === cle,
                ),
            )
            .map((cle) => {
              const exercice = fournisseur?.exercices.find((e) => e.cle === cle);
              return `${fournisseur?.label ?? ligne.module} \u00b7 ${exercice?.label ?? cle}`;
            });
        }),
      );
    } catch {
      setItems(null);
      setTiree(null);
      setMuets([]);
    }
  }

  return (
    <div className="Impression Impression__racine">
      <div className="Impression__reglages">
        <p className="Settings__hint">
          Coche ce que tu veux sur la feuille. Les exercices sont tirés au
          hasard à chaque préparation : deux feuilles ne se ressemblent jamais.
          Rien n&rsquo;est enregistré dans les séances ni dans la progression,
          puisque le travail sur papier n&rsquo;est pas mesuré.
        </p>

        {/* Le corrige porte sur la feuille entiere, pas sur un module : sa place est
            au-dessus de la liste. En bas, il se lisait comme un reglage du dernier
            module coche. */}
        <div className="Impression__enTete">
          <label className="Impression__choix">
            <input
              type="checkbox"
              checked={avecCorrige}
              onChange={(e) => setAvecCorrige(e.target.checked)}
            />
            Imprimer le corrigé, sur une page à part
          </label>
          <label className="Impression__choix">
            <input
              type="checkbox"
              checked={avecNumeros}
              onChange={(e) => setAvecNumeros(e.target.checked)}
            />
            Numéroter les exercices
          </label>
        </div>

        <div className="Impression__grille">
          {fournisseurs.map((f) => {
            const coches = selection[f.id] ?? [];
            const actif = actifs[f.id] ?? false;
            const nombre = compte(f.id);
            return (
              <div
                key={f.id}
                className={`Impression__module${actif ? ' Impression__module--actif' : ''}`}
              >
                <div className="Impression__moduleEntete">
                  <div className="Impression__moduleInfo">
                    <span className="Impression__moduleIcone">
                      {getModuleMeta(f.id)?.icon}
                    </span>
                    <p className="Impression__moduleNom">{f.label}</p>
                    {nombre > 0 && (
                      <span className="Impression__moduleCompte">
                        {nombre} exercice{nombre > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <Toggle
                    checked={actif}
                    onChange={() => basculer(f.id, f.exercices)}
                  />
                </div>

                {actif && (
                  <>
                    {/* Les TYPES d'exercices. On en coche autant qu'on veut : le nombre
                      demande se repartit entre eux, ce qui donne la variete sans avoir a
                      faire l'arithmetique soi-meme. */}
                    <div className="GameSettings__denominations">
                      {f.exercices.map((exercice) => (
                        <button
                          key={exercice.cle}
                          type="button"
                          className={`GameSettings__denomination${
                            coches.includes(exercice.cle)
                              ? ' GameSettings__denomination--active'
                              : ''
                          }`}
                          onClick={() =>
                            setSelection((precedent) => ({
                              ...precedent,
                              [f.id]: coches.includes(exercice.cle)
                                ? coches.filter((c) => c !== exercice.cle)
                                : [...coches, exercice.cle],
                            }))
                          }
                        >
                          {exercice.label}
                        </button>
                      ))}
                    </div>

                    <div className="GameSettings__rangeRow">
                      <label
                        className="GameSettings__rangeLabel"
                        htmlFor={`n-${f.id}`}
                      >
                        Combien d&rsquo;exercices
                      </label>
                      <input
                        id={`n-${f.id}`}
                        type="number"
                        min={0}
                        max={MAXIMUM_ITEMS}
                        value={nombres[f.id] ?? 0}
                        onChange={(e) =>
                          setNombres((precedent) => ({
                            ...precedent,
                            [f.id]: Math.max(
                              0,
                              Math.min(MAXIMUM_ITEMS, Number(e.target.value)),
                            ),
                          }))
                        }
                        className="GameSettings__range"
                        style={{ maxWidth: '6rem' }}
                      />
                    </div>

                    {coches.length === 0 && (
                      <p className="GameSettings__hint">
                        Coche au moins un type d&rsquo;exercice, sinon ce module
                        ne sortira rien.
                      </p>
                    )}

                    {f.options && (
                      <OptionsExercice
                        options={f.options}
                        valeurs={reglages[f.id] ?? {}}
                        coches={coches}
                        onChange={(valeurs) =>
                          setReglages((precedent) => ({
                            ...precedent,
                            [f.id]: valeurs,
                          }))
                        }
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="Impression__barre">
          <span className="Impression__compte">
            {total === 0 ? (
              'Aucun exercice choisi'
            ) : (
              <>
                <strong>{total}</strong> exercice{total > 1 ? 's' : ''}
                {perimee && ' · la feuille affichée ne correspond plus'}
              </>
            )}
          </span>

          <div className="Impression__actions">
            {Object.values(actifs).some(Boolean) && (
              <button
                type="button"
                className="AdminBtn AdminBtn--ghost"
                onClick={toutDecocher}
              >
                Tout décocher
              </button>
            )}

            {/* La hierarchie suit ce qu'il RESTE a faire, et un seul bouton est primaire
                a la fois. Tant qu'aucune feuille n'est tiree, preparer est l'action ; une
                fois qu'elle est la et a jour, c'est imprimer, et preparer devient
                « nouveau tirage ». Un « imprimer » en primaire a cote d'un « preparer »
                grise, comme c'etait le cas, invite a imprimer une page vide. */}
            <Button
              variant={pret ? 'outline' : 'primary'}
              onClick={() => void preparer()}
              // Desactive aussi AU-DESSUS de la borne : sans cela le bouton partait, le
              // serveur refusait, et l'adulte lisait « reessaie dans un instant » alors
              // qu'aucune attente n'y changerait rien.
              disabled={total === 0 || total > MAXIMUM_ITEMS || isLoading}
            >
              {isLoading
                ? 'Préparation…'
                : pret
                  ? 'Nouveau tirage'
                  : perimee
                    ? 'Mettre à jour la feuille'
                    : `Préparer la feuille (${total})`}
            </Button>

            {items && (
              <Button
                variant={pret ? 'primary' : 'outline'}
                onClick={() => window.print()}
              >
                🖨 Imprimer
              </Button>
            )}
          </div>
        </div>

        {total > MAXIMUM_ITEMS && (
          <p className="GameSettings__hint">
            {total} exercices, c&rsquo;est trop pour une feuille. Maximum{' '}
            {MAXIMUM_ITEMS}.
          </p>
        )}
        {muets.length > 0 && (
          <p className="GameSettings__hint">
            Rien à imprimer pour : {muets.join(' ; ')}. Ces exercices attendent un
            contenu saisi en administration, ou une notion à ouvrir.
          </p>
        )}
        {isError && (
          <p className="GameSettings__hint">
            La feuille n&rsquo;a pas pu être préparée. Réessaie dans un instant.
          </p>
        )}
      </div>

      {isLoading && <Spinner />}

      {items && (
        <div className="Impression__apercu" ref={apercuRef}>
          <FeuilleImprimable
            items={items}
            exercices={catalogue}
            titre={`Feuille du ${dateDuJour()}`}
            avecCorrige={avecCorrige}
            avecNumeros={avecNumeros}
            onRejouer={(index) => void rejouerUn(index)}
            rejoue={rejoue}
          />
        </div>
      )}
    </div>
  );
}
