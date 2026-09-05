import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from 'src/modules.manifest';

/**
 * Le morpion et le Puissance 4 sont des jeux « hors moule » : ils ne passent pas par
 * `<GameEngine>`, ils n'ont pas de backend, pas de progression, pas de migration. Ce qui
 * doit être tenu est donc surtout leur bon rangement, et deux choix de conception qu'un
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
    // nouveaux en héritent. Ce test le verrouille : les y laisser entrer ferait du
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
    // Un clic pendant que l'ordinateur réfléchit, ou deux clics plus rapides qu'un rendu,
    // ne doivent pas écraser le plateau. La garde doit vivre DANS la mise à jour, contre
    // l'état réellement courant : la lire depuis le rendu, c'est la lire périmée.
    expect(P4).toMatch(/precedent\.cases\[cellule\] !== 0/);

    // Le morpion va plus loin depuis la règle à trois pions : le tour changeait hors de
    // la garde, si bien que deux clics dans le même lot posaient deux pions d'affilée.
    // Plateau, tour et historique ne font plus qu'un état, et tout est revérifié.
    expect(MORPION).toMatch(/precedent\.tour !== joueur/);
    expect(MORPION).toMatch(/precedent\.cases\[coup\.vers\] !== 0/);
    expect(MORPION).toMatch(/precedent\.cases\[coup\.depuis\] !== joueur/);
  });

  it('promet l’imbattabilité pour le morpion et pas pour le Puissance 4', () => {
    // Le morpion est explorable en entier (profondeur 9) : il ne perd jamais, et c'est
    // annoncé. Le Puissance 4 ne l'est pas : le promettre serait faux.
    //
    // On lit les DESCRIPTIONS du manifeste, pas le texte du fichier : une première
    // version cherchait « ne perd jamais » dans la source et butait sur le commentaire
    // qui explique justement son absence. Un test qui lit du code attrape aussi ce qu'on
    // écrit à son sujet.
    //
    // L'option se cherche par sa CLÉ et non à l'index 0 : ajouter une question devant :
    // ce qu'a fait la règle à trois pions : faisait échouer ce test sans que rien de ce
    // qu'il garde n'ait bougé.
    const description = (id: string, valeur: string) =>
      MODULES.find((m) => m.id === id)
        ?.setupOptions?.find((o) => o.key === 'difficulty')
        ?.choices?.find((c) => c.value === valeur)?.description ?? '';

    expect(description('morpion', 'hard')).toMatch(/ne perd jamais/);
    expect(description('puissance4', 'hard')).not.toMatch(/ne perd jamais/);
    expect(MORPION).toMatch(/hard: 9/);
  });

  it('ne pose la question du niveau QU’UNE FOIS', () => {
    // Le pré-jeu injecte sa propre option `difficulty` : « 2 choix / 4 choix / Saisie
    // libre » : à tout module qui n'en déclare pas une. Les deux jeux affichaient donc
    // « Contre qui ? » ET « Quel niveau ? », la seconde ne voulant rien dire sur un
    // plateau. Déclarer la clé `difficulty` est ce qui écarte l'injection : c'est la
    // seule chose que ce test garde.
    for (const id of ['morpion', 'puissance4']) {
      const options = MODULES.find((m) => m.id === id)?.setupOptions ?? [];
      const cles = options.map((o) => o.key);
      expect({ id, difficulty: cles.includes('difficulty') }).toEqual({
        id,
        difficulty: true,
      });
      // Et plus de question « contre qui » : ce n'était pas un niveau.
      expect(cles).not.toContain('adversaire');
    }
  });

  it('propose la règle à trois pions, et la décrit sans jargon', () => {
    // « Trois hommes de moulin » ne dit rien à personne : ce qu'il faut annoncer, c'est
    // qu'on pose puis qu'on déplace.
    const regle = MODULES.find((m) => m.id === 'morpion')?.setupOptions?.find(
      (o) => o.key === 'variante',
    );
    expect(regle?.choices?.map((c) => c.value)).toEqual(['classique', 'trois']);
    expect(regle?.choices?.[1].description).toMatch(/déplace/);
  });

  it('donne une fin à la règle à trois pions, qui ne peut pas se remplir', () => {
    // La grille garde toujours trois cases libres : sans règle de répétition, deux
    // joueurs qui ne trouvent rien se déplaceraient sans fin. La résolution exacte montre
    // que 400 positions sont nulles PAR BOUCLE : ce n'est pas un cas d'école.
    expect(MORPION).toMatch(/REPETITIONS_NULLES/);
    expect(MORPION).toMatch(/tourne en rond/);
  });

  it('propose de jouer à deux DEPUIS le plateau, pas depuis le pré-jeu', () => {
    // « À deux » n'est pas un niveau de difficulté, et l'enterrer dans cette liste
    // obligeait à ressortir du jeu pour passer la main. Le basculement ne remet pas la
    // partie à zéro : il change seulement qui tient les pions de l'ordinateur.
    for (const source of [MORPION, P4]) {
      expect(source).toMatch(/setContreOrdinateur/);
      expect(source).toMatch(/Jouer à deux/);
    }
  });

  it('respecte un appareil réglé sur moins d’animation', () => {
    expect(P4_SCSS).toMatch(/prefers-reduced-motion/);
  });
});
