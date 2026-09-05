import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from 'src/modules.manifest';

/**
 * Le morpion et le Puissance 4 sont des jeux « hors moule » : ils ne passent pas par
 * `<GameEngine>`, ils n'ont pas de backend, pas de progression, pas de migration. Ce qui
 * doit être tenu est donc surtout leur bon rangement — et deux choix de conception qu'un
 * relecteur pressé défera.
 */

const MORPION = readFileSync(
  join(__dirname, '../modules/morpion/MorpionGame.tsx'),
  'utf-8',
);
const P4 = readFileSync(
  join(__dirname, '../modules/puissance4/Puissance4Game.tsx'),
  'utf-8',
);
const P4_SCSS = readFileSync(
  join(__dirname, '../modules/puissance4/puissance4.scss'),
  'utf-8',
);

describe('rangement', () => {
  it('classe les deux jeux dans la catégorie jeux', () => {
    for (const id of ['morpion', 'puissance4']) {
      const module = MODULES.find((m) => m.id === id);
      expect({ id, categorie: module?.category }).toEqual({
        id,
        categorie: 'jeux',
      });
    }
  });

  it('les fait passer par la porte de sortie `child`, pas par le moteur', () => {
    // Un plateau à tour de rôle n'est pas une suite de questions : le moteur commun
    // n'a rien à y faire.
    for (const id of ['morpion', 'puissance4']) {
      const module = MODULES.find((m) => m.id === id)!;
      expect(module.child?.Game).toBeTypeOf('function');
      expect(module.loadGameSpec).toBeUndefined();
    }
  });

  it('les exclut du tirage « Au hasard » par leur catégorie', () => {
    // Rien de spécial à faire : `HORS_HASARD` écarte la catégorie `jeux`, donc les deux
    // nouveaux en héritent. Ce test le verrouille — les y laisser entrer ferait du
    // bouton « je ne sais pas quoi faire » une façon de ne pas travailler.
    const accueil = readFileSync(
      join(__dirname, '../components/layout/HomeLayout.tsx'),
      'utf-8',
    );
    expect(accueil).toMatch(/HORS_HASARD: ModuleCategory\[\] = \['jeux'\]/);
  });
});

describe('choix de conception à ne pas défaire', () => {
  it('garde la boucle sur place, sans écran de résultat', () => {
    // « Je joue, je vois qui gagne, je rejoue » : passer par l'écran commun, fait pour un
    // score et une liste d'erreurs, ajouterait deux clics pour rien.
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/Rejouer/);
      expect(source).not.toMatch(/setGameResult/);
      expect(source).not.toMatch(/\/result/);
    }
  });

  it('fait attendre l’ordinateur avant de jouer', () => {
    // Jouer instantanément donne l'impression que la machine réagit au lieu de jouer, et
    // l'enfant n'a pas le temps de voir son propre coup.
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/DELAI_MS/);
      expect(source).toMatch(/setTimeout/);
    }
  });

  it('nettoie le minuteur au démontage', () => {
    // Sans ça, rejouer pendant qu'il réfléchit fait tomber son coup sur le plateau NEUF.
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/clearTimeout\(minuteur\)/);
    }
  });

  it('se garde du double coup', () => {
    // Un clic pendant que l'ordinateur réfléchit, ou deux clics rapides sur la même
    // case, ne doivent pas écraser le plateau.
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/precedent\.cases\[cellule\] !== 0/);
    }
  });

  it('promet l’imbattabilité pour le morpion et pas pour le Puissance 4', () => {
    // Le morpion est explorable en entier (profondeur 9) : il ne perd jamais, et c'est
    // annoncé. Le Puissance 4 ne l'est pas — le promettre serait faux.
    //
    // On lit les DESCRIPTIONS du manifeste, pas le texte du fichier : une première
    // version cherchait « ne perd jamais » dans la source et butait sur le commentaire
    // qui explique justement son absence. Un test qui lit du code attrape aussi ce qu'on
    // écrit à son sujet.
    const description = (id: string, valeur: string) =>
      MODULES.find((m) => m.id === id)
        ?.setupOptions?.[0]?.choices?.find((c) => c.value === valeur)
        ?.description ?? '';

    expect(description('morpion', 'difficile')).toMatch(/ne perd jamais/);
    expect(description('puissance4', 'difficile')).not.toMatch(/ne perd jamais/);
    expect(MORPION).toMatch(/difficile: 9/);
  });

  it('propose de jouer à deux sur le même écran', () => {
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/mode !== 'deux'/);
    }
  });

  it('respecte un appareil réglé sur moins d’animation', () => {
    expect(P4_SCSS).toMatch(/prefers-reduced-motion/);
  });
});
