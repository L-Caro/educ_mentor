import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { lireNombre } from 'src/components/game/peageReglage';

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
  it('ne se referme JAMAIS sur une mauvaise réponse', () => {
    // Interdire de jouer jusqu'à ce que ce soit correct transformerait un péage en
    // punition, et une enfant coincée devant un jeu qu'elle ne peut pas lancer irait
    // chercher un adulte, pas la bonne réponse. Ce qui s'apprend, c'est la correction
    // qu'on lui montre.
    //
    // Concrètement : `continuer` avance le compteur sans regarder si c'était juste.
    expect(PEAGE).toMatch(/const faites = posees \+ 1;/);
    expect(PEAGE).not.toMatch(/juste \?[^]{0,80}setPosees/);
  });

  it('montre TOUJOURS la bonne réponse, juste ou faux', () => {
    expect(PEAGE).toMatch(/Peage__choixBouton--bonne/);
    expect(PEAGE).toMatch(/C&apos;était|C'était/);
  });

  it('laisse passer dès que quelque chose ne va pas', () => {
    // Réglage à zéro, serveur muet, aucun module capable de poser une question : un
    // péage en panne devant un morpion serait une panne absurde.
    expect(PEAGE).toMatch(/isError \|\| total === 0 \|\| enPanne/);
  });

  it('garde une sortie ouverte', () => {
    // Sans elle, une enfant qui ne veut plus répondre n'aurait que le bouton
    // « précédent » du navigateur.
    expect(PEAGE).toMatch(/Peage__renoncer/);
    expect(PEAGE).toMatch(/Revenir en arrière/);
  });
});
