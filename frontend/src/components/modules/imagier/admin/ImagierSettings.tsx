import { useState } from 'react';
import { useNormalizeImagierCategoriesMutation } from '../imagier.api';
import Spinner from 'src/components/common/Spinner';

export default function ImagierSettings() {
  const [normalizeCategories, { isLoading: normalizing }] = useNormalizeImagierCategoriesMutation();
  const [normalizeResult, setNormalizeResult] = useState<number | null>(null);

  async function handleNormalizeCategories() {
    setNormalizeResult(null);
    const result = await normalizeCategories().unwrap();
    setNormalizeResult(result.updated);
  }

  return (
    <div className="ImagierSettings">
      <div className="ImagierSettings__header">
        <p className="ImagierSettings__hint">
          Gestion des mots et des images de l'imagier.
        </p>
      </div>

      <div className="ImagierSettings__grid">
        {/* Maintenance */}
        <div className="AdminCard ImagierSettings__card">
          <p className="ImagierSettings__cardTitle">Maintenance</p>
          <p className="ImagierSettings__hint">
            Normalise les noms de catégories en base (minuscules, tirets). À appeler une fois après un import.
          </p>
          <div className="ImagierSettings__maintenanceRow">
            <button
              onClick={handleNormalizeCategories}
              disabled={normalizing}
              className="AdminBtn AdminBtn--ghost"
            >
              {normalizing ? <Spinner size="xs" /> : 'Normaliser les catégories'}
            </button>
            {normalizeResult !== null && (
              <span className="ImagierSettings__maintenanceResult">
                {normalizeResult} mot{normalizeResult !== 1 ? 's' : ''} mis à jour
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
