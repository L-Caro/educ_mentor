import { describe, expect, it } from 'vitest';
import { MATIERES } from 'src/cours/cours.manifest';
import { ficheDe, type Concept } from 'src/cours/cours.types';
import { MODULES } from 'src/modules.manifest';
import type { PoseQuestion } from 'src/modules/pose/pose.type';

/**
 * La bibliothèque de cours est du CONTENU, pas de la logique : ce qui casse ici ne casse
 * pas bruyamment. Une fiche qui montre une opération fausse, un lien vers une tuile qui
 * n'existe plus, une apostrophe typographique au milieu d'un texte droit : rien de tout
 * cela ne réveille le typage ni le lint, et tout se voit à la lecture avec l'enfant.
 */

const CONCEPTS: Concept[] = MATIERES.flatMap((m) => m.notions.flatMap((n) => n.concepts));

/** Les deux jeux de réglages qui changent une fiche. */
const REGLAGES = [
  { pose_subtraction_method: 'compensation' },
  { pose_subtraction_method: 'cassage' },
];

/** Tous les textes affichés, réglages compris. */
function textes(concept: Concept): string[] {
  return REGLAGES.flatMap((reglages) => {
    const f = ficheDe(concept, reglages);
    const regle = Array.isArray(f.regle) ? f.regle : [f.regle ?? ''];
    return [concept.titre, f.titre, f.idee, f.piege ?? '', ...regle];
  });
}

describe('bibliothèque de cours', () => {
  it('a des slugs uniques, du haut en bas de la hiérarchie', () => {
    // Les slugs sont dans l'URL : un doublon rend une fiche inatteignable.
    for (const matiere of MATIERES) {
      for (const notion of matiere.notions) {
        const slugs = notion.concepts.map((c) => c.slug);
        expect(new Set(slugs).size, `${matiere.slug}/${notion.slug}`).toBe(slugs.length);
      }
      const notions = matiere.notions.map((n) => n.slug);
      expect(new Set(notions).size, matiere.slug).toBe(notions.length);
    }
  });

  it('ne renvoie que vers des tuiles qui existent', () => {
    // Le lien « s'entraîner » mène à /module/<id> : un id périmé donne une page morte.
    const ids = new Set(MODULES.map((m) => m.id));
    for (const concept of CONCEPTS) {
      if (!concept.entrainement) continue;
      expect(ids, concept.slug).toContain(concept.entrainement.moduleId);
    }
  });

  it("n'emploie ni cadratin ni apostrophe typographique", () => {
    // Convention du projet (frontend/CLAUDE.md) : mélanger les deux apostrophes se voit
    // à l'écran, et le cadratin est proscrit dans le texte affiché.
    for (const concept of CONCEPTS) {
      for (const texte of textes(concept)) {
        expect(texte, concept.slug).not.toMatch(/[—─’]/);
      }
    }
  });

  it('donne à chaque fiche une idée, un exemple et un piège', () => {
    // Une fiche sans exemple est un paragraphe ; c'est l'illustration qui la rend lisible
    // pour un enfant de CE1.
    for (const concept of CONCEPTS) {
      for (const reglages of REGLAGES) {
        const f = ficheDe(concept, reglages);
        expect(f.idee.length, concept.slug).toBeGreaterThan(40);
        expect(f.exemple, concept.slug).toBeDefined();
        expect(f.piege, concept.slug).toBeTruthy();
      }
    }
  });

  it('trace la leçon du corpus qui a servi de source', () => {
    // Pas affiché, mais indispensable à la relecture : sans lui, impossible de vérifier
    // qu'une fiche réécrite n'a pas perdu un morceau du programme.
    for (const concept of CONCEPTS) {
      expect(concept.source, concept.slug).toMatch(/^ce1\.mathematiques\./);
    }
  });
});

// ─── Les figures d'opération posée ────────────────────────────────────────────

/**
 * Les retenues des figures sont écrites à la main dans le contenu. On les recalcule ici
 * avec une implémentation indépendante : deux écritures qui tombent d'accord valent
 * beaucoup mieux qu'une seule relue à l'œil, et une figure fausse enseignerait une
 * méthode fausse.
 */
function retenuesAttendues(q: PoseQuestion): { haut: (number | null)[]; bas: (number | null)[] } {
  const taille = q.retenues.haut.length;
  const chiffres = (n: number) =>
    String(n).padStart(taille, '0').split('').reverse().map(Number);
  const a = chiffres(q.operands[0]);
  const b = chiffres(q.operands[1]);
  const haut: (number | null)[] = Array.from({ length: taille }, () => null);
  const bas: (number | null)[] = Array.from({ length: taille }, () => null);

  if (q.operation === 'addition') {
    let report = 0;
    for (let i = 0; i < taille; i++) {
      const somme = a[i] + b[i] + report;
      report = somme >= 10 ? 1 : 0;
      if (report && i + 1 < taille) haut[i + 1] = 1;
    }
    return { haut, bas };
  }

  if (q.method === 'compensation') {
    let ajout = 0;
    for (let i = 0; i < taille; i++) {
      const enBas = b[i] + ajout;
      if (a[i] < enBas) {
        haut[i] = a[i] + 10;
        if (i + 1 < taille) bas[i + 1] = (b[i + 1] ?? 0) + 1;
        ajout = 1;
      } else {
        ajout = 0;
      }
    }
    return { haut, bas };
  }

  const travail = [...a];
  for (let i = 0; i < taille; i++) {
    if (travail[i] < b[i]) {
      travail[i] += 10;
      travail[i + 1] -= 1;
      haut[i] = travail[i];
      haut[i + 1] = travail[i + 1];
    }
  }
  return { haut, bas };
}

/** Les figures posées des fiches, retrouvées dans l'arbre React de l'exemple. */
function figures(): PoseQuestion[] {
  const trouvees: PoseQuestion[] = [];
  const visiter = (noeud: unknown) => {
    if (!noeud || typeof noeud !== 'object') return;
    if (Array.isArray(noeud)) return noeud.forEach(visiter);
    const el = noeud as { props?: Record<string, unknown> };
    const question = el.props?.question as PoseQuestion | undefined;
    if (question?.operands) trouvees.push(question);
    if (el.props?.children) visiter(el.props.children);
  };
  for (const concept of CONCEPTS) {
    for (const reglages of REGLAGES) visiter(ficheDe(concept, reglages).exemple);
  }
  return trouvees;
}

describe('opérations posées montrées dans les fiches', () => {
  it('en montre au moins une par méthode de soustraction', () => {
    // Sinon le test suivant passerait sur un ensemble vide sans rien signaler.
    const trouvees = figures();
    expect(trouvees.filter((q) => q.operation === 'addition').length).toBeGreaterThan(0);
    expect(trouvees.filter((q) => q.method === 'compensation' && q.operation === 'soustraction').length)
      .toBeGreaterThan(0);
    expect(trouvees.filter((q) => q.method === 'cassage').length).toBeGreaterThan(0);
  });

  it('affiche le bon résultat', () => {
    for (const q of figures()) {
      const attendu =
        q.operation === 'addition'
          ? q.operands[0] + q.operands[1]
          : q.operands[0] - q.operands[1];
      expect(q.answer, `${q.operands.join(' ? ')}`).toBe(attendu);
      expect(q.answer_length).toBe(String(attendu).length);
      expect(q.columns).toBeGreaterThanOrEqual(String(q.operands[0]).length);
    }
  });

  it('affiche les retenues que la méthode impose', () => {
    for (const q of figures()) {
      const attendu = retenuesAttendues(q);
      const contexte = `${q.operands.join(' ')} · ${q.method}`;
      expect(q.retenues.haut, contexte).toEqual(attendu.haut);
      expect(q.retenues.bas, contexte).toEqual(attendu.bas);
    }
  });
});
