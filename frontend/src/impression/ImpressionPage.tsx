import { useMemo, useState } from 'react';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import { MODULES } from 'src/modules.manifest';
import FeuilleImprimable from './FeuilleImprimable';
import { useComposerFeuilleMutation } from './impression.api';
import OptionsExercice from './OptionsExercice';
import type { ExerciceImprimable, ItemImprime, LigneComposition } from './impression.types';
import './impression.scss';

/** Au-dela, ce n'est plus une feuille d'exercices, c'est une punition. Le serveur applique
 * la meme borne : celle-la protege l'API, celle-ci protege l'adulte de lui-meme. */
const MAXIMUM_ITEMS = 60;

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
 */
export default function ImpressionPage() {
  const fournisseurs = useMemo(
    () => MODULES.filter((m) => m.impression).map((m) => ({ id: m.id, ...m.impression! })),
    [],
  );

  /** Combien d'exercices de chaque type, indexe par `module/exercice`. */
  const [quantites, setQuantites] = useState<Record<string, number>>({});
  /** Les reglages de chaque exercice, indexes par `module/exercice`. */
  const [reglages, setReglages] = useState<Record<string, Record<string, unknown>>>({});
  const [avecCorrige, setAvecCorrige] = useState(true);
  const [items, setItems] = useState<ItemImprime[] | null>(null);
  const [composer, { isLoading, isError }] = useComposerFeuilleMutation();

  const catalogue = useMemo(() => {
    const table = new Map<string, ExerciceImprimable>();
    for (const f of fournisseurs) {
      for (const exercice of f.exercices) table.set(`${f.id}/${exercice.cle}`, exercice);
    }
    return table;
  }, [fournisseurs]);

  const total = Object.values(quantites).reduce((somme, n) => somme + n, 0);

  async function preparer() {
    const lignes: LigneComposition[] = Object.entries(quantites)
      .filter(([, nombre]) => nombre > 0)
      .map(([cle, nombre]) => {
        const [module, exercice] = cle.split('/');
        return { module, exercice, nombre, options: reglages[cle] };
      });
    if (lignes.length === 0) return;
    try {
      setItems(await composer(lignes).unwrap());
    } catch {
      setItems(null);
    }
  }

  return (
    <div className="Impression Impression__racine">
      <div className="Impression__reglages">
        <p className="Settings__hint">
          Coche ce que tu veux sur la feuille. Les exercices sont tirés au hasard à chaque
          préparation : deux feuilles ne se ressemblent jamais. Rien n&rsquo;est
          enregistré dans les séances ni dans la progression, puisque le travail sur
          papier n&rsquo;est pas mesuré.
        </p>

        {fournisseurs.map((f) => (
          <div key={f.id} className="AdminCard GameSettings__card">
            <p className="GameSettings__cardTitle">{f.label}</p>
            {f.exercices.map((exercice) => {
              const cle = `${f.id}/${exercice.cle}`;
              return (
                <div key={cle}>
                <div className="GameSettings__rangeRow">
                  <label className="GameSettings__rangeLabel" htmlFor={cle}>
                    {exercice.label}
                  </label>
                  <input
                    id={cle}
                    type="number"
                    min={0}
                    max={MAXIMUM_ITEMS}
                    value={quantites[cle] ?? 0}
                    onChange={(e) =>
                      setQuantites((precedent) => ({
                        ...precedent,
                        [cle]: Math.max(0, Math.min(MAXIMUM_ITEMS, Number(e.target.value))),
                      }))
                    }
                    className="GameSettings__range"
                    style={{ maxWidth: '6rem' }}
                  />
                </div>

                {/* Les reglages n'apparaissent QUE si l'exercice est demande : les
                    afficher tous ferait une page de cases a cocher ou l'essentiel, le
                    nombre d'exercices, se perdrait. */}
                {(quantites[cle] ?? 0) > 0 && exercice.options && (
                  <OptionsExercice
                    options={exercice.options}
                    valeurs={reglages[cle] ?? {}}
                    onChange={(valeurs) =>
                      setReglages((precedent) => ({ ...precedent, [cle]: valeurs }))
                    }
                  />
                )}
                </div>
              );
            })}
          </div>
        ))}

        <label className="GameSettings__toggleRow">
          <input
            type="checkbox"
            checked={avecCorrige}
            onChange={(e) => setAvecCorrige(e.target.checked)}
          />
          Imprimer le corrigé, sur une page à part
        </label>

        <div className="Impression__actions">
          <Button variant="primary" onClick={() => void preparer()} disabled={total === 0 || isLoading}>
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
            {total} exercices, c&rsquo;est trop pour une feuille. Maximum {MAXIMUM_ITEMS}.
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
