import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  brancher,
  communesEntre,
  comparer,
  genererQuestion,
  nu,
  profondeur,
  ranger,
  tirerMots,
  type Branches,
  type TypeAlphabet,
} from './alphabet.logic';

const MOTS = JSON.parse(
  readFileSync(join(__dirname, 'data/mots.json'), 'utf8'),
) as string[];

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

/** Les branches du vrai corpus, calculees une fois : rebrancher vingt-neuf mille mots a
 * chaque appel ferait durer la suite plusieurs minutes. */
const cache = new Map<number, Branches>();
const branchesPar = (p: number): Branches => {
  const deja = cache.get(p);
  if (deja) return deja;
  const calcule = brancher(MOTS, p);
  cache.set(p, calcule);
  return calcule;
};

describe('le tri', () => {
  it('range les ACCENTS comme le francais, pas comme Unicode', () => {
    // `é` vaut U+00E9, donc apres `z` en comparaison brute : un module qui rangerait
    // ainsi enseignerait l'inverse de ce qu'il pretend, sans jamais tomber en panne.
    expect(ranger(['zèbre', 'élan', 'avion'])).toEqual([
      'avion',
      'élan',
      'zèbre',
    ]);
    expect(comparer('élan', 'zèbre')).toBeLessThan(0);
    expect(comparer('éléphant', 'escalier')).toBeLessThan(0);
  });

  it('place le mot le plus COURT avant celui qui le prolonge', () => {
    expect(ranger(['chatte', 'chat', 'chaton'])).toEqual([
      'chat',
      'chaton',
      'chatte',
    ]);
  });

  it('livre le corpus deja trie', () => {
    // Le module s'en sert comme reference : un corpus trie ailleurs, ou autrement,
    // donnerait des corriges en desaccord avec les questions.
    expect(MOTS).toEqual(ranger(MOTS));
  });
});

describe('les lettres communes', () => {
  it('compte sans tenir compte des accents ni des ligatures', () => {
    // Pour elle, `é` est un `e` : c'est l'alphabet qu'elle recite. Compter autrement
    // annoncerait une difficulte que l'exercice n'a pas.
    expect(nu('château')).toBe('chateau');
    expect(nu('cœur')).toBe('coeur');
    expect(communesEntre('château', 'chatte')).toBe(4);
    expect(communesEntre('chat', 'chien')).toBe(2);
    expect(communesEntre('avion', 'zèbre')).toBe(0);
  });

  it('mesure une liste par la paire la plus RESSEMBLANTE', () => {
    // Deux mots eloignes dans l'ordre partagent toujours moins que les paires qui les
    // separent : il suffit donc de regarder les voisins de la liste rangee.
    expect(profondeur(['avion', 'chat', 'chaton', 'zèbre'])).toBe(4);
    expect(profondeur(['avion', 'bateau', 'chat'])).toBe(0);
  });
});

describe('le tirage', () => {
  const plafonds = [0, 1, 2, 3, 4];
  const tailles = [4, 8, 10, 12, 15, 20];

  it('ne depasse JAMAIS le plafond, et l’atteint toujours', () => {
    // Le coeur du reglage. Depasser rendrait la question plus dure qu'annonce ; ne
    // jamais l'atteindre rendrait le reglage decoratif, toutes les listes se valant.
    const fautifs: string[] = [];
    for (const communes of plafonds) {
      for (const combien of tailles) {
        for (let essai = 0; essai < 12; essai++) {
          const tires = tirerMots(branchesPar, communes, combien, rand);
          if (!tires) {
            fautifs.push(`rien : ${String(communes)}/${String(combien)}`);
            continue;
          }
          if (tires.length !== combien) {
            fautifs.push(
              `${String(tires.length)} mots au lieu de ${String(combien)}`,
            );
          }
          if (new Set(tires).size !== tires.length) {
            fautifs.push(`doublon : ${tires.join(',')}`);
          }
          const mesure = profondeur(tires);
          if (mesure !== communes) {
            fautifs.push(
              `${String(mesure)} au lieu de ${String(communes)} : ${tires.join(',')}`,
            );
          }
        }
      }
    }
    expect(fautifs).toEqual([]);
  });

  it('melange les profondeurs au lieu d’aligner des mots tous semblables', () => {
    // Le reglage est un maximum : une liste de huit mots qui se separeraient tous au
    // meme endroit serait une autre lecon, et une lecon plus pauvre.
    const varie = Array.from({ length: 40 }, () => {
      const tires = tirerMots(branchesPar, 3, 8, rand);
      if (!tires) return false;
      const ordonnes = ranger(tires);
      const ecarts = new Set(
        ordonnes.slice(1).map((mot, i) => communesEntre(ordonnes[i], mot)),
      );
      return ecarts.size >= 2;
    });
    // Pas « toujours » : un tirage peut retomber sur une seule profondeur. Mais si cela
    // arrivait la plupart du temps, le melange ne ferait pas son travail.
    expect(varie.filter(Boolean).length).toBeGreaterThan(30);
  });

  it('ne pose jamais deux mots que seul un ACCENT separe', () => {
    // « cote » devant « côte » ne se decide pas avec l'alphabet : la question n'aurait
    // pas de reponse pour elle.
    for (let essai = 0; essai < 200; essai++) {
      const tires = tirerMots(branchesPar, 4, 6, rand);
      if (!tires) continue;
      expect(new Set(tires.map(nu)).size).toBe(tires.length);
    }
  });
});

describe('les questions', () => {
  const types: TypeAlphabet[] = ['ranger', 'intrus', 'intercaler'];

  it('rend des questions JUSTES, a toutes les profondeurs', () => {
    const fautifs: string[] = [];
    for (const communes of [0, 1, 2, 3, 4]) {
      for (const type of types) {
        for (let essai = 0; essai < 40; essai++) {
          const tires = tirerMots(branchesPar, communes, 5, rand);
          if (!tires) {
            fautifs.push(`rien a tirer ${String(communes)}`);
            continue;
          }
          const q = genererQuestion(type, tires, communes, rand);
          if (!q) {
            fautifs.push(`rien ${type} ${String(communes)}`);
            continue;
          }

          if (type === 'ranger' && ranger(q.mots).join() !== q.reponse.join()) {
            fautifs.push(`ranger faux : ${q.mots.join(',')}`);
          }
          if (type === 'intrus') {
            // La liste doit etre fausse, et le redressement doit tomber juste.
            if (q.mots.join() === ranger(q.mots).join())
              fautifs.push('intrus deja range');
            if (!q.reponse.every((mot) => q.mots.includes(mot)))
              fautifs.push('intrus hors liste');
          }
          if (type === 'intercaler') {
            const attendu = Number(q.reponse[0]);
            const rendu = [...q.mots];
            rendu.splice(attendu, 0, q.aPlacer!);
            if (rendu.join() !== ranger(rendu).join()) {
              fautifs.push(`intercaler faux : ${q.aPlacer ?? ''}`);
            }
          }
        }
      }
    }
    expect(fautifs).toEqual([]);
  });

  it('ne propose JAMAIS une liste deja rangee a ranger', () => {
    // La reponse serait « ne touche a rien » : on la trouve sans rien comprendre, et l'on
    // croit avoir compris.
    for (let essai = 0; essai < 200; essai++) {
      const tires = tirerMots(branchesPar, 2, 4, rand);
      if (!tires) continue;
      const q = genererQuestion('ranger', tires, 2, rand);
      if (q) expect(q.mots.join()).not.toBe(q.reponse.join());
    }
  });

  it('echange deux mots VOISINS pour l’intrus', () => {
    // Un mot deplace au loin se repere d'un coup d'oeil, sans comparer les lettres.
    for (let essai = 0; essai < 60; essai++) {
      const tires = tirerMots(branchesPar, 1, 5, rand);
      if (!tires) continue;
      const q = genererQuestion('intrus', tires, 1, rand);
      if (!q) continue;
      const juste = ranger(q.mots);
      const ecarts = q.mots
        .map((mot, i) => (mot === juste[i] ? -1 : i))
        .filter((i) => i >= 0);
      expect(ecarts[1] - ecarts[0]).toBe(1);
    }
  });
});
