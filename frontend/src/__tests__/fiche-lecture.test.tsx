import { describe, expect, it } from 'vitest';
import { fragmentASurligner, lectureFiche } from 'src/modules/lecture/lecture.fiche';
import { surligner } from 'src/modules/lecture/surligner';
import type { LectureQuestion } from 'src/modules/lecture/lecture.type';

/**
 * En compréhension de texte il n'y a pas de règle : la fiche montre L'ENDROIT du texte qui
 * répond. Le contenu vient donc entièrement de `excerpt`, et deux choses doivent tenir :
 * pas d'extrait, pas de fiche ; et un surlignage qui ne se trompe jamais de fragment.
 */

const q = (over: Partial<LectureQuestion> = {}): LectureQuestion => ({
  item_key: 'q1',
  display: "Comment s'appelle l'île où vivait Ulysse ?",
  choices: ['Ithaque', 'Crète'],
  answer: 'Ithaque',
  show_text: false,
  text_titre: 'Ulysse et la mer',
  text_contenu: "Tout le monde dans son île d'Ithaque l'aimait et le respectait.",
  excerpt: "Tout le monde dans son île d'Ithaque l'aimait et le respectait.",
  ...over,
});

describe('fiche de lecture', () => {
  it("prend le titre du texte, pas la question", () => {
    expect(lectureFiche(q())!.titre).toBe('Ulysse et la mer');
  });

  it("n'existe pas sans extrait", () => {
    // Une fiche qui répéterait « la réponse était Ithaque » n'apprend rien : mieux vaut
    // que le moteur n'affiche aucun bouton.
    expect(lectureFiche(q({ excerpt: null }))).toBeNull();
    expect(lectureFiche(q({ excerpt: '' }))).toBeNull();
  });

  it('apprend à chercher dans le texte plutôt qu’à se souvenir', () => {
    const f = lectureFiche(q())!;
    expect(f.idee).toContain('dans le texte');
    expect(f.piege).toContain("c'est le texte qui décide");
  });

  it('montre le passage, pas la règle', () => {
    const f = lectureFiche(q())!;
    expect(f.exemple).toBeDefined();
    expect(f.regle).toBeUndefined();
  });
});

describe('fragmentASurligner', () => {
  // Les huit questions réelles du texte « Ulysse et la mer », telles qu'elles sont en base.
  const reels: [string, string, string | null][] = [
    ["Tout le monde dans son île d'Ithaque l'aimait.", 'Ithaque', 'Ithaque'],
    ['Un jour, Ulysse dut partir à la guerre.', 'pour aller à la guerre', 'guerre'],
    ['Mais la guerre dura dix longues années.', 'dix ans', null],
    ['Ulysse dit au Cyclope que son nom était Personne.', 'Personne', 'Personne'],
    ["Ulysse s'échappa en se cachant sous le ventre des moutons.", 'sous le ventre des moutons', 'sous le ventre des moutons'],
    ['Mais chaque nuit elle défaisait ce qu\'elle avait tissé.', 'elle défaisait sa tapisserie', 'défaisait'],
    ['Ulysse, déguisé en vieux mendiant, entra dans son palais.', 'déguisé en vieux mendiant', 'déguisé en vieux mendiant'],
    ['Après vingt longues années, Ulysse rentra.', 'vingt ans', 'vingt'],
  ];

  it('retombe sur le mot le plus long quand la réponse est reformulée', () => {
    for (const [extrait, reponse, attendu] of reels) {
      expect(fragmentASurligner(extrait, reponse), `réponse « ${reponse} »`).toBe(attendu);
    }
  });

  it('préfère toujours la réponse entière si elle est présente', () => {
    expect(fragmentASurligner('il vivait à Ithaque, une île', 'Ithaque')).toBe('Ithaque');
  });

  it('ignore les mots trop courts pour être discriminants', () => {
    // « ans » ou « la » surlignés au hasard dans une phrase guideraient l'œil au mauvais endroit.
    expect(fragmentASurligner('il resta ici la nuit', 'la nuit ans')).toBe('nuit');
    expect(fragmentASurligner('il resta ici', 'ans la')).toBeNull();
  });
});

describe('surligner', () => {
  it('découpe le texte autour du fragment', () => {
    const noeud = surligner('abc DEF ghi', 'DEF', 'm');
    // Trois parties : avant, la marque, après.
    expect(JSON.stringify(noeud)).toContain('abc ');
    expect(JSON.stringify(noeud)).toContain('DEF');
    expect(JSON.stringify(noeud)).toContain(' ghi');
  });

  it('rend le texte nu si le fragment est absent ou vide', () => {
    // Une réponse reformulée (« pour aller à la guerre ») n'apparaît pas telle quelle dans
    // l'extrait (« Ulysse dut partir à la guerre ») : ne rien surligner vaut mieux que
    // surligner à côté.
    expect(surligner('Ulysse dut partir à la guerre.', 'pour aller à la guerre', 'm'))
      .toBe('Ulysse dut partir à la guerre.');
    expect(surligner('texte', null, 'm')).toBe('texte');
    expect(surligner('texte', '', 'm')).toBe('texte');
  });

  it('ne surligne que la première occurrence', () => {
    const noeud = surligner('la la la', 'la', 'm');
    expect(JSON.stringify(noeud)).toContain('" la la"');
  });
});
