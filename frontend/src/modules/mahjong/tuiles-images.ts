import type { TuileFace } from './mahjong.types';
import { identifiantFace } from './tuiles';

// Chaque fichier importe se resout en URL (comportement par defaut de Vite pour les
// assets) : glob plutot que 34 imports manuels, voir ATTRIBUTIONS.md pour la source.
const FICHIERS_SVG = import.meta.glob('./tuiles-svg/*.svg', { eager: true, import: 'default' }) as Record<
  string,
  string
>;

const NOMS_FICHIERS: Record<string, string> = {};
for (const valeur of [1, 2, 3, 4, 5, 6, 7, 8, 9] as const) {
  NOMS_FICHIERS[`bambou-${valeur}`] = `Sou${valeur}`;
  NOMS_FICHIERS[`cercle-${valeur}`] = `Pin${valeur}`;
  NOMS_FICHIERS[`caractere-${valeur}`] = `Man${valeur}`;
}
Object.assign(NOMS_FICHIERS, {
  'vent-est': 'Ton',
  'vent-sud': 'Nan',
  'vent-ouest': 'Shaa',
  'vent-nord': 'Pei',
  'dragon-rouge': 'Chun',
  'dragon-vert': 'Hatsu',
  'dragon-blanc': 'Haku',
});

function cheminDepuisNomFichier(nomFichier: string): string {
  const entree = Object.entries(FICHIERS_SVG).find(([chemin]) => chemin.endsWith(`/${nomFichier}.svg`));
  if (!entree) throw new Error(`SVG de tuile introuvable : ${nomFichier}`);
  return entree[1];
}

/**
 * Le set ne fournit pas des tuiles completes : `Front.svg` est le fond (ivoire, cadre
 * noir) commun a toutes les faces, chaque fichier de symbole (Man1, Ton, Chun...) n'etant
 * que l'encre, sans fond. Une vraie tuile se compose des deux, superposes (meme viewBox
 * 300x400 sur les deux, verifie a la source).
 */
export const CHEMIN_FOND_TUILE = cheminDepuisNomFichier('Front');

/** URL de l'image du symbole de la face (domaine public, voir ATTRIBUTIONS.md), a
 * superposer sur `CHEMIN_FOND_TUILE`. */
export function cheminImageFace(face: TuileFace): string {
  return cheminDepuisNomFichier(NOMS_FICHIERS[identifiantFace(face)]);
}
