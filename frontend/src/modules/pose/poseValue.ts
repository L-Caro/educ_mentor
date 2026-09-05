import type { PoseQuestion, ProduitPartiel } from './pose.type';

/**
 * Ce que l'enfant a écrit dans la grille : les retenues du haut, celles du bas, et le
 * résultat. Tout est indexé depuis la DROITE, comme on pose une opération.
 *
 * Le moteur de jeu transporte la saisie sous forme de chaîne (`free.parse`), d'où la
 * sérialisation. On passe par JSON plutôt que par un format maison : une grille à onze
 * colonnes et trois rangées se prête mal à un encodage improvisé, et un format ambigu
 * produirait des comparaisons fausses sans rien signaler.
 */
export interface PoseSaisie {
  haut: string[];
  bas: string[];
  resultat: string[];
  /** Une rangée par produit partiel, indexée comme les autres depuis la DROITE.
   * Vide hors multiplication. */
  partiels: string[][];
}

export function saisieVide(question: PoseQuestion): PoseSaisie {
  const cases = () => Array.from({ length: question.columns }, () => '');
  return {
    haut: cases(),
    bas: cases(),
    resultat: cases(),
    partiels: lignesPartielles(question).map(() => cases()),
  };
}

/** Les produits partiels que l'enfant doit écrire. Un multiplicateur à un chiffre n'en
 * demande aucun : son unique produit EST le résultat, et lui faire écrire deux fois la
 * même ligne n'apprend rien. */
export function lignesPartielles(question: PoseQuestion): ProduitPartiel[] {
  if (question.operation !== 'multiplication') return [];
  return question.partiels.length > 1 ? question.partiels : [];
}

/** Les chiffres d'un produit partiel, placés à leur décalage, indexés depuis la droite. */
export function partielAttendu(
  question: PoseQuestion,
  partiel: ProduitPartiel,
): string[] {
  const chiffres = String(partiel.valeur).split('').reverse();
  return Array.from({ length: question.columns }, (_, colonne) => {
    const rang = colonne - partiel.decalage;
    return rang >= 0 ? (chiffres[rang] ?? '') : '';
  });
}

/** En difficulté « facile » les retenues sont déjà écrites : la grille part pré-remplie. */
export function saisieInitiale(question: PoseQuestion): PoseSaisie {
  const vide = saisieVide(question);
  if (question.carry_display !== 'filled') return vide;

  return {
    ...vide,
    haut: vide.haut.map((_, i) => marque(question.retenues.haut[i])),
    bas: vide.bas.map((_, i) => marque(question.retenues.bas[i])),
  };
}

const marque = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

export function encode(saisie: PoseSaisie): string {
  return JSON.stringify(saisie);
}

export function decode(raw: string, question: PoseQuestion): PoseSaisie {
  if (!raw) return saisieInitiale(question);
  try {
    const parsed = JSON.parse(raw) as Partial<PoseSaisie>;
    const vide = saisieVide(question);
    return {
      haut: parsed.haut ?? vide.haut,
      bas: parsed.bas ?? vide.bas,
      resultat: parsed.resultat ?? vide.resultat,
      partiels: parsed.partiels ?? vide.partiels,
    };
  } catch {
    // Saisie corrompue : on repart d'une grille vide plutôt que de planter en pleine partie.
    return saisieInitiale(question);
  }
}

/** Les chiffres du résultat attendu, indexés depuis la droite, complétés de vides. */
export function resultatAttendu(question: PoseQuestion): string[] {
  const chiffres = String(question.answer).split('').reverse();
  return Array.from({ length: question.columns }, (_, i) => chiffres[i] ?? '');
}

/**
 * La validation est-elle possible ?
 *
 * On n'exige PAS que toutes les cases soient remplies : c'est à l'enfant de décider
 * combien de chiffres compte sa réponse. Exiger le nombre exact reviendrait à le lui
 * annoncer. On exige seulement qu'elle ait écrit un nombre : la colonne des unités
 * renseignée, et pas de trou entre les chiffres.
 *
 * En difficulté moyenne, les cases de retenue attendues doivent l'être aussi : c'est
 * l'exercice. Sinon elle pourrait les ignorer et l'échafaudage ne servirait à rien.
 */
export function estComplete(question: PoseQuestion, saisie: PoseSaisie): boolean {
  const cases = saisie.resultat.slice(0, question.columns);
  if ((cases[0] ?? '') === '') return false;

  // Un trou (une case vide suivie d'une case remplie, plus à gauche) est une saisie en
  // cours, pas un nombre : mieux vaut bloquer que valider « 5_7 ».
  const dernierRempli = cases.reduce((max, v, i) => (v !== '' ? i : max), -1);
  const sansTrou = cases.slice(0, dernierRempli + 1).every((v) => v !== '');
  if (!sansTrou) return false;

  // Les produits partiels sont l'exercice de la multiplication posée, pas un échafaudage :
  // on exige qu'ils soient écrits, sinon l'enfant pourrait sauter directement au résultat
  // et le décalage — la seule vraie difficulté — ne serait jamais travaillé.
  const partiels = lignesPartielles(question);
  const partielsComplets = partiels.every((partiel, ligne) => {
    const attendu = partielAttendu(question, partiel);
    return attendu.every(
      (chiffre, colonne) =>
        chiffre === '' || (saisie.partiels[ligne]?.[colonne] ?? '') !== '',
    );
  });
  if (!partielsComplets) return false;

  if (question.carry_display !== 'empty') return true;

  return (['haut', 'bas'] as const).every((rangee) =>
    question.retenues[rangee].every(
      (attendue, i) => attendue === null || (saisie[rangee][i] ?? '') !== '',
    ),
  );
}

/**
 * Le RÉSULTAT décide seul de la réussite. Les retenues sont corrigées visuellement mais
 * n'invalident pas : la compétence visée est de calculer juste, la notation des retenues
 * est un support. Une marque écrite ailleurs mais un résultat juste ne doit pas compter
 * comme une erreur.
 */
export function estCorrecte(question: PoseQuestion, saisie: PoseSaisie): boolean {
  const attendu = resultatAttendu(question);
  const resultatJuste = attendu.every(
    (chiffre, i) => (saisie.resultat[i] ?? '') === chiffre,
  );
  if (!resultatJuste) return false;

  // Les produits partiels comptent, eux. Contrairement aux retenues, ce ne sont pas un
  // support : un résultat juste obtenu avec des produits faux est un résultat deviné, et
  // la multiplication posée s'apprend précisément par ces lignes-là.
  return lignesPartielles(question).every(
    (_, ligne) => colonnesPartielFausses(question, saisie, ligne).length === 0,
  );
}

/** Colonnes d'un produit partiel mal remplies, pour montrer OÙ ça a coincé. */
export function colonnesPartielFausses(
  question: PoseQuestion,
  saisie: PoseSaisie,
  ligne: number,
): number[] {
  const partiel = lignesPartielles(question)[ligne];
  if (!partiel) return [];
  const attendu = partielAttendu(question, partiel);
  return attendu.flatMap((chiffre, colonne) =>
    chiffre === '' || (saisie.partiels[ligne]?.[colonne] ?? '') === chiffre
      ? []
      : [colonne],
  );
}

/** Colonnes du résultat mal remplies, pour que la correction montre OÙ ça a coincé. */
export function colonnesFausses(question: PoseQuestion, saisie: PoseSaisie): number[] {
  const attendu = resultatAttendu(question);
  return attendu.flatMap((chiffre, i) => ((saisie.resultat[i] ?? '') === chiffre ? [] : [i]));
}

/**
 * Les colonnes où le chiffre du haut est BARRÉ, indexées depuis la droite.
 *
 * C'est la différence visible entre les deux méthodes, et elle n'est pas décorative.
 * Par compensation, la marque du haut s'ajoute au chiffre : sous un « 17 » le 7 reste
 * lisible, il fait partie de la lecture. Par cassage, la marque le REMPLACE : le nombre
 * du haut a été démonté, et laisser les deux écritures côte à côte donnerait à lire
 * deux nombres contradictoires.
 *
 * La règle est donc simple, et vaut pour toute colonne modifiée : ce qui est réécrit
 * au-dessus est ce qui compte, ce qui est barré ne compte plus.
 */
export function colonnesBarrees(question: PoseQuestion): number[] {
  if (question.operation !== 'soustraction' || question.method !== 'cassage') return [];
  return question.retenues.haut
    .map((v, colonne) => (v === null ? -1 : colonne))
    .filter((colonne) => colonne >= 0 && colonne < question.columns);
}
