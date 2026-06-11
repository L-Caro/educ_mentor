import { useState } from 'react';
import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/api';
import { normalizeCategories } from 'src/api/module/imagier.api.ts';
import Spinner from 'src/components/common/Spinner';
import type { ImagierMode } from 'src/types';

const MODES: [ImagierMode, string][] = [
  ['fr_to_en', '🇫🇷 → 🇬🇧  Français vers Anglais'],
  ['en_to_fr', '🇬🇧 → 🇫🇷  Anglais vers Français'],
  ['random',   '🔀  Aléatoire'],
];

export default function ImagierSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();
  const [normalizing, setNormalizing] = useState(false);
  const [normalizeResult, setNormalizeResult] = useState<number | null>(null);

  async function handleNormalizeCategories() {
    setNormalizing(true);
    setNormalizeResult(null);
    const result = await normalizeCategories();
    setNormalizeResult(result.updated);
    setNormalizing(false);
  }

  if (loading) return <Spinner size="sm" />;

  const mode = (settings.imagier_default_mode ?? 'fr_to_en') as ImagierMode;

  return (
    <div className="ImagierSettings">
      <div className="ImagierSettings__header">
        <p className="ImagierSettings__hint">
          Ces paramètres s'appliquent à la session de jeu de Maëve.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="ImagierSettings__grid">
        {/* Direction */}
        <div className="AdminCard ImagierSettings__card">
          <p className="ImagierSettings__cardTitle">Direction</p>
          <div className="ImagierSettings__radios">
            {MODES.map(([val, label]) => (
              <label key={val} className="ImagierSettings__radio">
                <input
                  type="radio"
                  name="imagier-mode"
                  value={val}
                  checked={mode === val}
                  onChange={() => updateSetting({ key: 'imagier_default_mode', value: val })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

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
