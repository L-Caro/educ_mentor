import { useMemo, useState } from 'react';
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
  const [avecCorrige, setAvecCorrige] = useState(true);
  const [items, setItems] = useState<ItemImprime[] | null>(null);
  /** Les modules actifs qui n'ont rien rendu. Ils ne sont plus une erreur (une dictee
   * manquante ne doit pas emporter les dix exercices de tables), mais ils doivent se
   * DIRE : sans cela, l'adulte coche la dictee, ne la voit pas sur la feuille, et n'a
   * aucun moyen de savoir que c'est parce qu'aucune n'est saisie. */
  const [muets, setMuets] = useState<string[]>([]);
  const [composer, { isLoading, isError }] = useComposerFeuilleMutation();

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

  async function preparer() {
    const lignes: LigneComposition[] = fournisseurs
      .filter((f) => compte(f.id) > 0)
      .map((f) => ({
        module: f.id,
        exercices: selection[f.id],
        nombre: nombres[f.id],
        options: reglages[f.id],
      }));
    if (lignes.length === 0) return;
    try {
      const rendus = await composer(lignes).unwrap();
      setItems(rendus);
      setMuets(
        lignes
          .filter(
            (ligne) => !rendus.some((item) => item.module === ligne.module),
          )
          .map(
            (ligne) =>
              fournisseurs.find((f) => f.id === ligne.module)?.label ??
              ligne.module,
          ),
      );
    } catch {
      setItems(null);
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
        <label className="Impression__enTete">
          <input
            type="checkbox"
            checked={avecCorrige}
            onChange={(e) => setAvecCorrige(e.target.checked)}
          />
          Imprimer le corrigé, sur une page à part
        </label>

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

        <div className="Impression__actions">
          <Button
            variant="primary"
            onClick={() => void preparer()}
            // Desactive aussi AU-DESSUS de la borne : sans cela le bouton partait, le
            // serveur refusait, et l'adulte lisait « reessaie dans un instant » alors
            // qu'aucune attente n'y changerait rien.
            disabled={total === 0 || total > MAXIMUM_ITEMS || isLoading}
          >
            {isLoading ? 'Préparation…' : `Préparer la feuille (${total})`}
          </Button>
          {items && (
            <Button variant="ghost" onClick={() => window.print()}>
              🖨 Imprimer
            </Button>
          )}
        </div>

        {total > MAXIMUM_ITEMS && (
          <p className="GameSettings__hint">
            {total} exercices, c&rsquo;est trop pour une feuille. Maximum{' '}
            {MAXIMUM_ITEMS}.
          </p>
        )}
        {muets.length > 0 && (
          <p className="GameSettings__hint">
            Rien à imprimer pour : {muets.join(', ')}. Ces modules attendent un
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
        <div className="Impression__apercu">
          <FeuilleImprimable
            items={items}
            exercices={catalogue}
            titre={`Feuille du ${dateDuJour()}`}
            avecCorrige={avecCorrige}
          />
        </div>
      )}
    </div>
  );
}
