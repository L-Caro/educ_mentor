import { Link, Navigate, useParams } from 'react-router-dom';
import { useGetSettingsQuery } from 'src/store/api/sharedApi.ts';
import FicheSheet from 'src/components/common/Fiche/FicheSheet';
import Spinner from 'src/components/common/Spinner.tsx';
import { matiereParSlug, notionParSlug } from '../cours.manifest';
import { ficheDe } from '../cours.types';

/**
 * La lecture d'une grande notion : un sommaire, et une fiche à la fois.
 *
 * Une fiche à la fois plutôt qu'un long défilement : la feuille de cahier est une PAGE,
 * et en enchaîner dix bout à bout casse ce qu'elle a de reconnaissable. Le concept est
 * dans l'URL, donc une fiche précise se met en signet ou s'envoie par message.
 *
 * Les réglages sont chargés parce qu'une fiche peut en dépendre : la soustraction posée
 * s'écrit de deux façons, et montrer celle que la maîtresse n'enseigne pas serait pire
 * que ne rien montrer.
 */
export default function NotionPage() {
  const { matiere: slugMatiere = '', notion: slugNotion = '', concept: slugConcept } = useParams();
  const { data: reglages = {}, isLoading } = useGetSettingsQuery();

  const matiere = matiereParSlug(slugMatiere);
  const notion = matiere && notionParSlug(matiere, slugNotion);

  if (!matiere || !notion) return <Navigate to="/cours" replace />;

  const premier = notion.concepts[0];
  if (!slugConcept) {
    return <Navigate to={`/cours/${matiere.slug}/${notion.slug}/${premier.slug}`} replace />;
  }

  const index = notion.concepts.findIndex((c) => c.slug === slugConcept);
  if (index === -1) {
    return <Navigate to={`/cours/${matiere.slug}/${notion.slug}/${premier.slug}`} replace />;
  }

  const concept = notion.concepts[index];
  const precedent = notion.concepts[index - 1];
  const suivant = notion.concepts[index + 1];
  const lien = (slug: string) => `/cours/${matiere.slug}/${notion.slug}/${slug}`;

  return (
    <div className="Notion">
      <Link className="Notion__retour" to="/cours">
        ← Toutes les fiches
      </Link>

      <h2 className="Notion__titre">
        {matiere.titre} · {notion.titre}
      </h2>

      <div className="Notion__corps">
        <nav className="Notion__sommaire" aria-label="Fiches de la notion">
          {notion.concepts.map((c, i) => (
            <Link
              key={c.slug}
              to={lien(c.slug)}
              className={`Notion__lien${c.slug === concept.slug ? ' Notion__lien--actif' : ''}`}
              aria-current={c.slug === concept.slug ? 'page' : undefined}
            >
              <span className="Notion__lienNum">{i + 1}</span>
              <span>{c.titre}</span>
            </Link>
          ))}
        </nav>

        <div className="Notion__lecture">
          {isLoading ? (
            <Spinner />
          ) : (
            // Les jetons de la feuille (réglure, encre, interligne) sont portés par
            // `.Fiche` : la classe fait partie de la feuille, pas du dialogue de jeu.
            <div className="Fiche">
              <FicheSheet fiche={ficheDe(concept, reglages)} />
            </div>
          )}

          <div className="Notion__pied">
            {concept.entrainement ? (
              <Link className="Button" to={`/module/${concept.entrainement.moduleId}`}>
                S&apos;entraîner · {concept.entrainement.label}
              </Link>
            ) : (
              <span />
            )}

            <div className="Notion__nav">
              {precedent && (
                <Link className="Button Button--ghost" to={lien(precedent.slug)}>
                  ← Précédente
                </Link>
              )}
              {suivant && (
                <Link className="Button" to={lien(suivant.slug)}>
                  Suivante →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
