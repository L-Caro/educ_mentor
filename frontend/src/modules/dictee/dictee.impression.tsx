import store from 'src/store';
import { dicteeApi } from './dictee.api';
import { LignesEcriture } from 'src/impression/trames';
import type { FournisseurImpression } from 'src/impression/impression.types';

/** Deux lignes par phrase : une phrase de dictee tient rarement sur une seule, et une
 * ligne qui manque fait ecrire dans la marge. Mieux vaut une ligne de trop. */
const LIGNES_PAR_PHRASE = 2;

/**
 * La dictee sur papier.
 *
 * C'est le seul exercice de la feuille qui ne se lit pas : il s'ecoute. L'enfant recoit
 * des lignes numerotees, l'adulte recoit les phrases a lire a voix haute. Le « corrige »
 * n'en est donc pas un au sens des autres exercices, c'est le TEXTE SOURCE, et il est
 * indispensable meme quand on ne coche pas le corrige pour les autres.
 *
 * Aucun generateur n'est necessaire cote rendu : ce sont des lignes Seyes, la reglure de
 * son cahier (voir `trames.tsx`).
 */
export const dicteeImpression: FournisseurImpression = {
  label: 'Dictée',
  exercices: [
    {
      cle: 'dictee',
      label: 'Dictée (lignes à écrire, le texte est au corrigé)',
      largeur: 'pleine',
      enonce: (donnees) => {
        const phrases = donnees.phrases as string[];
        return (
          <div>
            <p className="Feuille__consigne">
              Écris ce que l&rsquo;adulte te dicte.
            </p>
            <LignesEcriture nombre={phrases.length * LIGNES_PAR_PHRASE} />
          </div>
        );
      },
      reponse: (donnees) => {
        const phrases = donnees.phrases as string[];
        return (
          <span>
            <em>à lire à voix haute :</em>{' '}
            {phrases.map((phrase, index) => (
              <span key={index}>
                {index > 0 ? ' / ' : ''}
                {phrase}
              </span>
            ))}
          </span>
        );
      },
    },
  ],
  options: [
    {
      // Les niveaux du MODULE, pas des classes scolaires. Une premiere version demandait
      // « ce1 », qui ne correspondait a aucun item en base : la dictee ne sortait jamais,
      // et sans message puisqu'une ligne sans contenu fait silence.
      cle: 'niveau',
      label: 'Quel niveau',
      type: 'unique',
      choix: [
        { valeur: 'debutant', label: 'Débutant' },
        { valeur: 'normal', label: 'Normal' },
        { valeur: 'difficile', label: 'Difficile' },
      ],
      defaut: 'debutant',
    },
    {
      cle: 'longueur',
      label: 'Quelle longueur',
      type: 'unique',
      choix: [
        { valeur: 'courte', label: 'Courte' },
        { valeur: 'moyenne', label: 'Moyenne' },
        { valeur: 'longue', label: 'Longue' },
      ],
      defaut: 'courte',
    },
    {
      cle: 'notion',
      label: 'Une notion en particulier',
      type: 'unique',
      // Les notions REELLEMENT presentes dans les items saisis : proposer une notion que
      // personne n'a utilisee donnerait une dictee vide.
      charger: async () => {
        const notions = await store
          .dispatch(dicteeApi.endpoints.getDicteeNotions.initiate(undefined))
          .unwrap();
        return notions.map((notion) => ({ valeur: notion, label: notion }));
      },
    },
  ],
};
