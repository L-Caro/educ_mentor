import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategories } from 'src/api/module/imagier.api.ts';
import { getSettingsMap } from 'src/api/settings.api';
import Button from "src/components/common/Button.tsx";
import Spinner from 'src/components/common/Spinner';
import PageContainer from "src/components/layout/PageContainer/PageContainer.tsx";
import { getCategoryConfig } from "src/components/modules/imagier/constants/categories.ts";

interface CategoryData {
  category: string;
  count: number;
  active_count: number;
}

export default function ImagierHome() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // ─── Chargement initial ───
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const catsPromise = getCategories();
        const settingsPromise = getSettingsMap();

        const cats = await catsPromise;
        const settingsMap = await settingsPromise;

        if (!isMounted) return;

        const active = cats.filter((c) => c.active_count > 0);
        setCategories(active);
        setSelected(new Set());
        setSettings(settingsMap);
      } catch (error) {
        console.error('Erreur de chargement:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, []);


  // ─── Toggle une catégorie (min 1 sélectionnée) ───
  const handleToggle = useCallback((categoryKey: string) => {
    setSelected((prev) => {
      const next = new Set(prev);

      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }

      return next;
    });
  }, []);

  // ─── Lancer la session ───
  const handleStart = () => {
    // Si rien sélectionné → on prend toutes les catégories
    const activeCategories = selected.size > 0
                             ? [...selected]
                             : categories.map((c) => c.category);

    const params = new URLSearchParams({
      categories: activeCategories.join(','),
      mode: settings.imagier_default_mode,
      difficulty: settings.imagier_default_difficulty,
      count: settings.imagier_questions_per_session,
    });

    navigate(`/module/imagier/play?${params.toString()}`);
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="ImagierHome">
        <div className="ImagierHome__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  // ─── Aucune catégorie ───
  if (categories.length === 0) {
    return (
      <div className="ImagierHome">
        <div className="ImagierHome__empty">
          <p className="ImagierHome__emptyText">
            Aucun mot disponible pour l&apos;instant.
          </p>
        </div>
      </div>
    );
  }

  // ─── Contenu principal ───
  return (
    <PageContainer className="ImagierHome">

      <p className="ImagierHome__subtitle">
        Choisis les thèmes !
      </p>

      <main className="ImagierHome__main">
        <div className="ImagierHome__chips">
          {categories.map((cat) => {
            const { icon, label } = getCategoryConfig(cat.category);

            return (
              <Button
                key={cat.category}
                onClick={() => handleToggle(cat.category)}
                title={label}
                icon={icon}
                isSelected={selected.has(cat.category)}
              />

          )})
          }
        </div>

        <Button
          className="mt-auto"
          onClick={handleStart}
          title="Jouer"
        />
      </main>
    </PageContainer>
  );
}
