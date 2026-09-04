import type { Fiche } from 'src/types/fiche.types';
import { capitalize } from 'src/utils/capitilize';
import GeometrieFigure from './GeometrieFigure';
import type { GeometrieQuestion, ShapeMeta } from './geometrie.type';

/** L'idée clé par famille de forme : ce qui définit la famille, pas la forme précise. */
const FAMILLE_IDEE: Record<ShapeMeta['famille'], string> = {
  triangle:
    "Un triangle a trois côtés et trois sommets. C'est la figure fermée la plus simple : impossible d'en fermer une avec moins de trois côtés.",
  quadrilatere:
    "Un quadrilatère a quatre côtés et quatre sommets. Ce qui distingue un carré, un rectangle, un losange les uns des autres, c'est l'angle droit et l'égalité des côtés.",
  polygone:
    "Un polygone régulier a tous ses côtés égaux et tous ses angles égaux. Le nombre de côtés donne son nom : pentagone (5), hexagone (6), et ainsi de suite.",
  cercle:
    "Un cercle n'a ni côté ni sommet : c'est une ligne courbe fermée, dont tous les points sont à la même distance du centre.",
  solide:
    "Un solide se reconnaît en comptant : combien de faces, de sommets, d'arêtes, et de quelle forme sont les faces.",
};

const PROPRIETE_IDEE =
  "Deux figures peuvent se ressembler et pourtant se différencier sur un seul détail : un angle, ou l'égalité des côtés. C'est ce détail qui tranche.";

/** Les propriétés d'une forme, en une liste de courtes phrases lisibles. */
function proprietesDe(shape: ShapeMeta): string[] {
  const lignes: string[] = [];
  if (shape.cotes !== null) lignes.push(`${shape.cotes} côté${shape.cotes > 1 ? 's' : ''}`);
  if (shape.sommets !== null) lignes.push(`${shape.sommets} sommet${shape.sommets > 1 ? 's' : ''}`);
  if (shape.faces !== null) lignes.push(`${shape.faces} face${shape.faces > 1 ? 's' : ''}`);
  if (shape.aretes !== null) lignes.push(`${shape.aretes} arête${shape.aretes > 1 ? 's' : ''}`);
  if (shape.angleDroit !== null) {
    lignes.push(shape.angleDroit ? 'un angle droit' : 'aucun angle droit');
  }
  if (shape.cotesEgaux !== null) {
    lignes.push(shape.cotesEgaux ? 'tous les côtés égaux' : 'des côtés inégaux');
  }
  return lignes;
}

export function geometrieFiche(question: GeometrieQuestion): Fiche {
  const shape = question.shape_meta;
  const shapeB = question.shape_b_meta;

  if (question.type === 'proprietes' && shapeB) {
    return {
      titre: `${shape.nom} · ${shapeB.nom}`,
      idee: PROPRIETE_IDEE,
      regle: [
        `${capitalize(shape.nom)} : ${proprietesDe(shape).join(', ')}`,
        `${capitalize(shapeB.nom)} : ${proprietesDe(shapeB).join(', ')}`,
      ],
      exemple: (
        <div className="GeometrieFiche__paire">
          <GeometrieFigure shape={shape.key} legende={shape.nom} />
          <GeometrieFigure shape={shapeB.key} legende={shapeB.nom} />
        </div>
      ),
    };
  }

  return {
    titre: shape.nom,
    idee: FAMILLE_IDEE[shape.famille],
    regle: [capitalize(proprietesDe(shape).join(', '))],
    exemple: <GeometrieFigure shape={shape.key} legende={shape.nom} />,
  };
}
