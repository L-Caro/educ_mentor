import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  lireFrequence,
  lireNombre,
  lireRestantes,
  ecrireRestantes,
  MAXIMUM_FREQUENCE,
} from 'src/components/game/peageReglage';

const PEAGE = readFileSync(
  join(__dirname, '../components/game/Peage.tsx'),
  'utf-8',
);
const ROUTER = readFileSync(join(__dirname, '../routes/router.tsx'), 'utf-8');
const SETTINGS = readFileSync(
  join(__dirname, '../components/admin/settings/Settings.tsx'),
  'utf-8',
);

describe('le réglage', () => {
  it('est éteint par défaut, et par toute valeur qui ne veut rien dire', () => {
    // Un péage qui s'installerait tout seul changerait l'application sous les pieds de
    // l'enfant, sans que personne l'ait décidé.
    for (const brut of [undefined, '', '0', '-2', 'beaucoup']) {
      expect({ brut, n: lireNombre(brut) }).toEqual({ brut, n: 0 });
    }
  });

  it('borne le nombre de questions, comme le serveur', () => {
    // Les deux bornes existent : celle du serveur protège l'API, celle-ci protège
    // l'affichage. Une valeur aberrante écrite à la main en base ne doit pas transformer
    // une partie de morpion en interrogation écrite.
    expect(lireNombre('3')).toBe(3);
    expect(lireNombre('99')).toBe(5);
  });

  it('se règle dans l’administration GÉNÉRALE, pas dans un module', () => {
    // Le péage ne concerne aucun module en particulier : il barre l'entrée des jeux et
    // pioche chez les autres. Le ranger dans les réglages d'un module l'aurait rendu
    // introuvable.
    expect(SETTINGS).toMatch(/jeux_peage_questions/);
    expect(SETTINGS).toMatch(/Péage des jeux/);
  });
});

describe('une partie sur X', () => {
  it('vaut « chaque partie » par défaut, et pour toute valeur qui ne veut rien dire', () => {
    for (const brut of [undefined, '', '0', '-4', 'souvent', '1']) {
      expect({ brut, f: lireFrequence(brut) }).toEqual({ brut, f: 1 });
    }
  });

  it('borne la fréquence : au-delà, l’enfant aurait oublié qu’un péage existe', () => {
    expect(lireFrequence('3')).toBe(3);
    expect(lireFrequence('99')).toBe(MAXIMUM_FREQUENCE);
  });

  it('rabote le compteur quand la fréquence BAISSE', () => {
    // Passer de 5 à 2 dans l'administration ne doit pas laisser courir les trois parties
    // libres déjà comptées : le réglage s'applique tout de suite.
    ecrireRestantes(4);
    expect(lireRestantes(2)).toBe(1);
    expect(lireRestantes(1)).toBe(0);
  });

  it('compte les parties libres, jamais en dessous de zéro', () => {
    ecrireRestantes(-3);
    expect(lireRestantes(5)).toBe(0);
  });

  it('fait payer d’ABORD, puis laisse jouer', () => {
    // Payer d'abord et jouer ensuite se comprend. L'inverse, laisser jouer deux fois puis
    // barrer la troisième sans prévenir, ressemblerait à un caprice de l'application.
    // C'est la règle que suit le composant : `restantes > 0` laisse passer, sinon on
    // barre et on recharge le compteur à `frequence - 1`.
    expect(PEAGE).toMatch(/restantes > 0/);
    expect(PEAGE).toMatch(/ecrireRestantes\(restantes - 1\)/);
  });

  it('ne décide QU’UNE FOIS par ouverture', () => {
    // Sans ce garde-fou, un simple re-rendu, ou un réglage changé dans un autre onglet,
    // pourrait faire apparaître un péage au milieu d'une partie déjà commencée.
    expect(PEAGE).toMatch(/decide\.current/);
  });
});

describe('où le péage s’applique', () => {
  it('n’enveloppe QUE les jeux', () => {
    // Barrer l'entrée d'un module de calcul avec une question de calcul n'aurait aucun
    // sens.
    expect(ROUTER).toMatch(/module\.category === 'jeux'/);
  });

  it('barre aussi l’entrée directe, pas seulement le pré-jeu', () => {
    // Un jeu sans options de pré-jeu va droit au plateau : envelopper la seule route
    // `/play` aurait laissé une porte ouverte.
    const jouable = ROUTER.match(/const jouable =/);
    expect(jouable).not.toBeNull();
    expect(ROUTER).toMatch(/\/play`, element: jouable/);
    expect(ROUTER).toMatch(/: jouable;/);
  });
});

describe('choix de conception à ne pas défaire', () => {
  it('n’avance que sur une réponse JUSTE', () => {
    // La première version laissait passer après N questions posées, justes ou fausses.
    // C'était naïf : une enfant comprend très vite qu'un bouton au hasard ouvre la même
    // porte, et le péage devient un clic de plus avant de jouer. Il ne demande plus rien,
    // donc il n'enseigne plus rien.
    expect(PEAGE).toMatch(/const acquises = juste \? reussies \+ 1 : reussies;/);
    expect(PEAGE).toMatch(/reussies >= total\) return/);
  });

  it('ne donne le crédit de parties libres qu’au péage FRANCHI', () => {
    // Il s'écrivait à l'affichage du péage, pas à sa réussite : entrer, faire demi-tour,
    // revenir, et la partie était gratuite. Une porte dérobée grande comme une maison.
    //
    // `ecrireRestantes(frequence - 1)` ne doit apparaître que dans `continuer`, jamais
    // dans l'effet qui décide de barrer.
    const decision = PEAGE.slice(
      PEAGE.indexOf('decide.current = true'),
      PEAGE.indexOf('// La première question'),
    );
    expect(decision).not.toMatch(/ecrireRestantes\(frequence - 1\)/);
    expect(PEAGE).toMatch(/function continuer\(\)[^]*ecrireRestantes\(frequence - 1\)/);
  });

  it('montre TOUJOURS la bonne réponse, juste ou faux', () => {
    expect(PEAGE).toMatch(/Peage__choixBouton--bonne/);
    expect(PEAGE).toMatch(/C&apos;était|C'était/);
  });

  it('laisse passer dès que quelque chose ne va pas', () => {
    // Réglage à zéro, serveur muet, aucun module capable de poser une question : un
    // péage en panne devant un morpion serait une panne absurde.
    // La décision de barrer se prend d'abord, et tombe à « non » sur la moindre panne ;
    // le rendu laisse passer tout ce qui n'est pas explicitement barré.
    expect(PEAGE).toMatch(/if \(isError \|\| total === 0\)/);
    expect(PEAGE).toMatch(/if \(!barre \|\| enPanne \|\| reussies >= total\) return/);
  });

  it('garde une sortie ouverte', () => {
    // Sans elle, une enfant qui ne veut plus répondre n'aurait que le bouton
    // « précédent » du navigateur.
    expect(PEAGE).toMatch(/Peage__renoncer/);
    expect(PEAGE).toMatch(/Revenir en arrière/);
  });
});
