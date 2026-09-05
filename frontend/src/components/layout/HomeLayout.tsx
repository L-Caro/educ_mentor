import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGetModulesQuery } from 'src/store/api/sharedApi.ts';
import ModuleCard from 'src/components/common/ModuleCard.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import SessionTimerDisplay from 'src/components/common/SessionTimerDisplay.tsx';
import { MODULES } from 'src/modules.manifest';
import type { ModuleCategory } from 'src/types/modules.types';

// ─── Méta des catégories ──────────────────────────────────────────────────────

const CATEGORY_META: Record<ModuleCategory, { label: string; emoji: string }> = {
  maths:    { label: 'Maths',      emoji: '🔢' },
  francais: { label: 'Français',   emoji: '✍️' },
  geo:      { label: 'Géographie', emoji: '🌍' },
  anglais:  { label: 'Anglais',    emoji: '🇬🇧' },
  jeux:     { label: 'Jeux',       emoji: '🎮' },
};

/** Ordre des sections. `jeux` est en dernier et replié : ce sont des jeux, pas des
 * leçons, et les mettre au même rang que les autres faisait l'essentiel du désordre. */
const CATEGORY_ORDER: ModuleCategory[] = ['maths', 'francais', 'geo', 'anglais', 'jeux'];

/** Sections repliées à la première visite. */
const REPLIEES_PAR_DEFAUT: ModuleCategory[] = ['jeux'];

/** « Au hasard » ne pioche pas là-dedans : le bouton propose du travail, pas une façon
 * d'atterrir sur Snake. */
const HORS_HASARD: ModuleCategory[] = ['jeux'];

const CLE_REPLIEES = 'educmentor.accueil.repliees';
const CLE_DERNIER_HASARD = 'educmentor.accueil.dernierHasard';

// ─── Persistance ──────────────────────────────────────────────────────────────

/** L'état replié est une commodité par appareil : il ne remonte pas au serveur et un
 * navigateur qui refuse le stockage doit simplement retomber sur les défauts. */
function lireRepliees(): Set<ModuleCategory> {
  try {
    const brut = localStorage.getItem(CLE_REPLIEES);
    if (brut === null) return new Set(REPLIEES_PAR_DEFAUT);
    const parsed = JSON.parse(brut) as unknown;
    if (!Array.isArray(parsed)) return new Set(REPLIEES_PAR_DEFAUT);
    return new Set(
      parsed.filter((c): c is ModuleCategory =>
        (CATEGORY_ORDER as string[]).includes(c as string),
      ),
    );
  } catch {
    return new Set(REPLIEES_PAR_DEFAUT);
  }
}

function ecrireRepliees(repliees: Set<ModuleCategory>): void {
  try {
    localStorage.setItem(CLE_REPLIEES, JSON.stringify([...repliees]));
  } catch {
    // Stockage refusé (navigation privée, réglages) : l'accueil reste utilisable, il
    // oubliera simplement les sections repliées d'une visite à l'autre.
  }
}

function lireDernierHasard(): string | null {
  try {
    return localStorage.getItem(CLE_DERNIER_HASARD);
  } catch {
    return null;
  }
}

function ecrireDernierHasard(id: string): void {
  try {
    localStorage.setItem(CLE_DERNIER_HASARD, id);
  } catch {
    /* sans mémoire, « au hasard » peut retomber sur le même module : acceptable */
  }
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function HomeLayout() {
  const { data: modules = [], isLoading: loading } = useGetModulesQuery({ onlyActive: true });
  const navigate = useNavigate();
  const [repliees, setRepliees] = useState<Set<ModuleCategory>>(lireRepliees);

  // Map id → category, construite une seule fois depuis le manifest frontend
  const categoryMap = useMemo(
    () => new Map(MODULES.map((m) => [m.id, m.category ?? null])),
    [],
  );

  /** Les sections, dans l'ordre du programme, avec leurs modules. Les catégories vides
   * sont écartées : une section « Anglais (0) » n'apprend rien à personne. */
  const sections = useMemo(
    () =>
      CATEGORY_ORDER.map((categorie) => ({
        categorie,
        modules: modules.filter((mod) => categoryMap.get(mod.id) === categorie),
      })).filter((section) => section.modules.length > 0),
    [modules, categoryMap],
  );

  /** Les modules dans lesquels « Au hasard » pioche. */
  const pochette = useMemo(
    () =>
      modules.filter((mod) => {
        const categorie = categoryMap.get(mod.id);
        // Un module sans catégorie déclarée ne peut pas être classé : on l'écarte du
        // tirage plutôt que de le proposer sans savoir ce qu'il contient.
        return (
          categorie !== null &&
          categorie !== undefined &&
          !HORS_HASARD.includes(categorie)
        );
      }),
    [modules, categoryMap],
  );

  const basculer = useCallback((categorie: ModuleCategory) => {
    setRepliees((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(categorie)) suivant.delete(categorie);
      else suivant.add(categorie);
      ecrireRepliees(suivant);
      return suivant;
    });
  }, []);

  /** Ouvre un module au hasard.
   *
   * Jamais celui qu'elle vient de faire : retomber deux fois de suite sur le même donne
   * l'impression que le bouton est cassé. Avec un seul module disponible, on n'a pas le
   * choix — mieux vaut le reproposer que ne rien faire. */
  const auHasard = useCallback(() => {
    if (pochette.length === 0) return;
    const dernier = lireDernierHasard();
    const candidats =
      pochette.length > 1
        ? pochette.filter((mod) => mod.id !== dernier)
        : pochette;
    const choisi = candidats[Math.floor(Math.random() * candidats.length)];
    ecrireDernierHasard(choisi.id);
    navigate(`/module/${choisi.id}`);
  }, [pochette, navigate]);

  if (loading) {
    return (
      <div className="HomeLayout">
        <div className="HomeLayout__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="HomeLayout">
        <p className="HomeLayout__empty">
          Aucun module activé pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="HomeLayout">
      <div className="HomeLayout__timerRow">
        <SessionTimerDisplay />
      </div>

      <div className="HomeLayout__actions">
        {/* La réponse à « je ne sais pas quoi faire ». Elle ne demande aucune donnée de
            progression : c'est ce qui la rend possible aujourd'hui. */}
        {pochette.length > 0 && (
          <button
            type="button"
            className="HomeLayout__hasard"
            onClick={auHasard}
          >
            <span aria-hidden="true">🎲</span>
            <span>Au hasard</span>
          </button>
        )}

        {/* Entrée de la bibliothèque. Discrète et à part des tuiles : ce n'est pas un jeu,
            et c'est le parent qui vient la chercher, pas l'enfant. */}
        <Link className="HomeLayout__cours" to="/cours">
          <span aria-hidden="true">📚</span>
          <span>Les fiches de cours</span>
        </Link>
      </div>

      {sections.map(({ categorie, modules: duGroupe }) => {
        const repliee = repliees.has(categorie);
        const { label, emoji } = CATEGORY_META[categorie];
        return (
          <section key={categorie} className="HomeLayout__section">
            <h2 className="HomeLayout__sectionTitle">
              <button
                type="button"
                className="HomeLayout__sectionBtn"
                aria-expanded={!repliee}
                aria-controls={`section-${categorie}`}
                onClick={() => basculer(categorie)}
              >
                <span className="HomeLayout__chevron" aria-hidden="true">
                  {repliee ? '▸' : '▾'}
                </span>
                <span aria-hidden="true">{emoji}</span>
                <span>{label}</span>
                <span className="HomeLayout__compte">{duGroupe.length}</span>
              </button>
            </h2>

            {/* `hidden` plutôt qu'un démontage : les tuiles gardent leur état et la
                section se rouvre sans re-rendu, cf. la règle du projet sur `el.hidden`. */}
            <div
              id={`section-${categorie}`}
              className="HomeLayout__grid"
              hidden={repliee}
            >
              {duGroupe.map((mod) => (
                <div key={mod.id} className="HomeLayout__col">
                  <ModuleCard module={mod} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
