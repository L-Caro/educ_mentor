import { useState } from 'react';
import { useNormalizeImagierCategoriesMutation } from './imagier.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';

export default function ImagierSettings() {
  const [normalizeCategories, { isLoading: normalizing }] = useNormalizeImagierCategoriesMutation();
  const [normalizeResult, setNormalizeResult] = useState<number | null>(null);

  async function handleNormalizeCategories() {
    setNormalizeResult(null);
    const result = await normalizeCategories().unwrap();
    setNormalizeResult(result.updated);
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Gestion des mots et des images de l'imagier.
        </p>
      </div>

      <div className="GameSettings__grid">
        {/* Maintenance */}
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Maintenance</p>
          <p className="GameSettings__hint">
            Normalise les noms de catégories en base (minuscules, tirets). À appeler une fois après un import.
          </p>
          <div className="GameSettings__toggleRow">
            <button
              onClick={handleNormalizeCategories}
              disabled={normalizing}
              className="AdminBtn AdminBtn--ghost"
            >
              {normalizing ? <Spinner size="xs" /> : 'Normaliser les catégories'}
            </button>
            {normalizeResult !== null && (
              <span className="GameSettings__succes">
                {normalizeResult} mot{normalizeResult !== 1 ? 's' : ''} mis à jour
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
