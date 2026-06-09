import { useEffect, useState } from 'react';
import { getSettingsMap, updateSetting } from 'src/api/settings.api';

interface UseModuleSettingsResult {
  settings: Record<string, string>;
  loading: boolean;
  saving: boolean;
  save: (key: string, value: string) => Promise<void>;
  saveMultiple: (pairs: [string, string][]) => Promise<void>;
}

/**
 * Mécanique partagée des pages de réglages : chargement de la map de settings,
 * sauvegarde unitaire ou groupée avec indicateur `saving`. Le contenu (quels
 * réglages, quelles cartes) reste propre à chaque module.
 */
export function useModuleSettings(): UseModuleSettingsResult {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettingsMap().then(setSettings).finally(() => setLoading(false));
  }, []);

  async function save(key: string, value: string) {
    setSaving(true);
    await updateSetting(key, value);
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaving(false);
  }

  async function saveMultiple(pairs: [string, string][]) {
    setSaving(true);
    await Promise.all(pairs.map(([key, value]) => updateSetting(key, value)));
    setSettings((previous) => {
      const next = { ...previous };
      pairs.forEach(([key, value]) => { next[key] = value; });
      return next;
    });
    setSaving(false);
  }

  return { settings, loading, saving, save, saveMultiple };
}
