import type { PoseQuestion } from './pose.type';

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
}

export function saisieVide(question: PoseQuestion): PoseSaisie {
  const cases = () => Array.from({ length: question.columns }, () => '');
  return { haut: cases(), bas: cases(), resultat: cases() };
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
 * La validation est-elle possible ? Le résultat doit être complet sur toute sa longueur.
 * En difficulté moyenne, les cases de retenue attendues doivent l'être aussi : c'est
 * l'exercice. Sinon elle pourrait les ignorer et l'échafaudage ne servirait à rien.
 */
export function estComplete(question: PoseQuestion, saisie: PoseSaisie): boolean {
  const attendu = resultatAttendu(question);
  const resultatRempli = attendu.every(
    (chiffre, i) => chiffre === '' || saisie.resultat[i] !== '',
  );
  if (!resultatRempli) return false;

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
  return attendu.every((chiffre, i) => (saisie.resultat[i] ?? '') === chiffre);
}

/** Colonnes du résultat mal remplies, pour que la correction montre OÙ ça a coincé. */
export function colonnesFausses(question: PoseQuestion, saisie: PoseSaisie): number[] {
  const attendu = resultatAttendu(question);
  return attendu.flatMap((chiffre, i) => ((saisie.resultat[i] ?? '') === chiffre ? [] : [i]));
}
