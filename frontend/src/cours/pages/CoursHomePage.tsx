import { Link } from 'react-router-dom';
import { MATIERES } from '../cours.manifest';

/**
 * L'entrée de la bibliothèque : les matières, et sous chacune ses grandes notions.
 *
 * Deux niveaux sur une seule page, volontairement. Le lecteur est le parent, il arrive en
 * sachant ce qu'il cherche (« elle bloque sur les soustractions posées ») : lui faire
 * traverser un écran par niveau de hiérarchie ne lui apprend rien. Ça tiendra encore à
 * seize grandes notions ; au-delà, il faudra couper.
 */
export default function CoursHomePage() {
  return (
    <div className="Cours">
      <p className="Cours__intro">
        Les fiches du programme, à lire ensemble. Chaque notion se lit d&apos;une traite,
        et renvoie vers la tuile où s&apos;entraîner quand il y en a une.
      </p>

      {MATIERES.map((matiere) => (
        <section className="Cours__matiere" key={matiere.slug}>
          <h2 className="Cours__matiereTitre">
            <span aria-hidden="true">{matiere.emoji}</span>
            {matiere.titre}
          </h2>

          <div className="Cours__notions">
            {matiere.notions.map((notion) => (
              <Link
                className="Cours__notion"
                key={notion.slug}
                to={`/cours/${matiere.slug}/${notion.slug}`}
              >
                <span className="Cours__notionTitre">{notion.titre}</span>
                <span className="Cours__notionResume">{notion.resume}</span>
                <span className="Cours__notionCompte">
                  {notion.concepts.length} fiches
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
