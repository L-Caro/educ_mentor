import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * « Serveur injoignable » ne doit jamais ressembler à « rien n'est configuré ».
 *
 * Incident réel : le backend local avait planté au démarrage. Le conteneur affichait
 * « Up », le port était publié, et l'interface s'est dégradée en SILENCE :
 *
 *   — l'accueil de Maëve affichait « Aucun module activé pour l'instant », un message
 *     qui l'accuse d'avoir une application vide et envoie son parent régler des
 *     activations déjà bonnes ;
 *   — le tableau de bord montrait dix-huit cartes aux ids bruts, sans icône ni
 *     interrupteur, parce que tout cela vient du catalogue ;
 *   — chaque carte annonçait « Aucune session jouée », le `.catch(() => [])` de la
 *     progression transformant une erreur réseau en absence de données.
 *
 * Trois symptômes, une cause, et aucun des trois ne la nommait. Ces tests tiennent la
 * séparation : ce n'est pas une préférence d'affichage, c'est ce qui décide si on
 * cherche le problème au bon endroit.
 */

const ACCUEIL = readFileSync(
  join(__dirname, '../components/layout/HomeLayout.tsx'),
  'utf-8',
);
const ADMIN = readFileSync(
  join(__dirname, '../components/admin/AdminDashboard.tsx'),
  'utf-8',
);
const STYLES_ADMIN = readFileSync(
  join(__dirname, '../assets/styles/_components/_admin.scss'),
  'utf-8',
);

describe('accueil de l’enfant', () => {
  it('lit l’état d’erreur de la requête, pas seulement ses données', () => {
    expect(ACCUEIL).toMatch(/isError/);
  });

  it('traite la panne AVANT le cas « aucun module »', () => {
    // L'ordre décide : testé après, `modules.length === 0` attraperait la panne et
    // afficherait le mauvais message, puisqu'une requête en erreur rend aussi zéro
    // module.
    const panne = ACCUEIL.indexOf('if (isError)');
    const vide = ACCUEIL.indexOf('if (modules.length === 0)');
    expect(panne).toBeGreaterThan(-1);
    expect(vide).toBeGreaterThan(-1);
    expect(panne).toBeLessThan(vide);
  });

  it('garde les deux messages distincts', () => {
    expect(ACCUEIL).toContain("Aucun module activé pour l'instant".replace("'", '&apos;'));
    expect(ACCUEIL).toMatch(/joindre le serveur/);
  });

  it('offre de réessayer plutôt qu’un écran mort', () => {
    // Elle a sept ans : un bouton vaut mieux qu'une invitation à recharger la page.
    expect(ACCUEIL).toMatch(/refetch/);
    expect(ACCUEIL).toMatch(/Réessayer/);
  });

  it('ne met pas la panne sur le dos de l’enfant', () => {
    expect(ACCUEIL).toMatch(/pas de ta faute/);
  });
});

describe('tableau de bord', () => {
  it('n’affiche pas les cartes quand le catalogue manque', () => {
    // Sans catalogue, ni les noms, ni les icônes, ni les interrupteurs ne sont
    // disponibles : une liste dont on ne peut rien faire trompe plus qu'elle informe.
    expect(ADMIN).toMatch(/catalogueEnPanne/);
    const panne = ADMIN.indexOf('{catalogueEnPanne ?');
    const spinner = ADMIN.indexOf(') : loading ?');
    expect(panne).toBeGreaterThan(-1);
    expect(spinner).toBeGreaterThan(panne);
  });

  it('ne transforme plus une erreur de progression en absence de données', () => {
    // C'est le `.catch(() => [])` qui faisait annoncer « Aucune session jouée » pour
    // dix-huit modules alors que le backend était mort.
    expect(ADMIN).not.toContain('.catch(() => [])');
    expect(ADMIN).toMatch(/indisponible/);
  });

  it('distingue « rien joué » de « indisponible » à l’écran', () => {
    expect(ADMIN).toContain('Aucune session jouée');
    expect(ADMIN).toContain('Progression indisponible');
    // Et visuellement : « rien joué » est un état normal presque invisible, une panne
    // doit se remarquer.
    expect(STYLES_ADMIN).toContain('&--panne');
  });

  it('n’autorise pas la réinitialisation sur une progression inconnue', () => {
    // Proposer d'effacer ce qu'on n'a pas pu lire est le pire moment pour un bouton
    // destructeur.
    expect(ADMIN).toMatch(/!indisponible &&/);
  });
});
