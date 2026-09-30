import Blanc from 'src/impression/Blanc';
import Portee from 'src/musique/Portee';
import type { FournisseurImpression } from 'src/impression/impression.types';
import type { Evenement, Figure } from 'src/musique/solfege';
import './solfege.impression.scss';

/**
 * Le solfège sur le papier.
 *
 * Le même composant `Portee` qu'à l'écran, et ce n'est pas une économie : une feuille qui
 * dessinerait la clé autrement que le jeu apprendrait deux clés. Tout y est tracé et
 * jamais peint, ce qui est de toute façon la règle de l'impression ici : un fond CSS ne
 * sort pas d'une imprimante tant que personne ne coche « graphiques d'arrière-plan ».
 *
 * Les blancs sous les notes sont en millimètres, comme partout ailleurs sur la feuille :
 * on décide de la place qu'on laisse pour écrire, pas de la longueur d'une suite de
 * tirets.
 */

const rondes = (positions: number[]) =>
  positions.map((position) => ({ position, figure: 'ronde' as const }));

export const solfegeImpression: FournisseurImpression = {
  label: 'Solfège',
  exercices: [
    {
      cle: 'notes',
      label: 'Écrire le nom des notes sous la portée',
      largeur: 'pleine',
      enonce: (donnees) => {
        const positions = donnees.positions as number[];
        return (
          <div>
            <p className="Feuille__consigne">Écris le nom de chaque note.</p>
            <Portee
              cle={donnees.cle as 'sol' | 'fa'}
              symboles={rondes(positions)}
              espace={40}
              sous={positions.map(() => null)}
            />
          </div>
        );
      },
      reponse: (donnees) => (donnees.reponses as string[]).join(', '),
    },
    {
      cle: 'placer',
      label: 'Dessiner les notes demandées sur une portée vide',
      largeur: 'pleine',
      enonce: (donnees) => {
        const notes = donnees.notes as string[];
        return (
          <div>
            <p className="Feuille__consigne">
              Dessine chaque note sur la portée, à l&rsquo;endroit qui lui
              revient.
            </p>
            {/* La portée est VIDE : c'est tout l'exercice. Nommer une note qu'on voit
                demande de lire ; la placer demande de compter les cases dans l'autre
                sens, et c'est là que se voit si la clé est comprise. */}
            <Portee
              cle={donnees.cle as 'sol' | 'fa'}
              symboles={[]}
              espace={40}
              emplacements={notes.length}
              sous={notes}
            />
          </div>
        );
      },
      reponse: (donnees) => (donnees.notes as string[]).join(', '),
    },
    {
      cle: 'figure',
      label: 'Nommer une figure ou un silence',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">
            Comment s&rsquo;appelle cette figure ?
          </p>
          {/* Sur CINQ lignes, même pour une question qui ne parle pas de hauteur : la
              pause et la demi-pause sont le même rectangle, et seule la ligne à laquelle
              il s'accroche les distingue. */}
          <Portee
            cle="sol"
            symboles={[
              {
                position: 4,
                figure: donnees.figure as Figure,
                silence: donnees.silence as boolean,
              },
            ]}
            espace={46}
          />
          <p className="SolfegeImp__ligne">
            <Blanc largeurMm={38} />
          </p>
        </div>
      ),
      reponse: (donnees) => String(donnees.reponse),
    },
    {
      cle: 'syllabes',
      label: 'Écrire Taé et Aé sous un rythme',
      largeur: 'pleine',
      enonce: (donnees) => {
        const evenements = donnees.evenements as Evenement[];
        return (
          <div>
            <p className="Feuille__consigne">
              Écris les syllabes sous chaque figure, puis frappe le rythme.
            </p>
            <Portee
              cle="rythme"
              espace={40}
              barres={donnees.barres as number[]}
              symboles={evenements.map((e) => ({
                position: 4,
                figure: e.figure,
                silence: e.silence,
              }))}
              sous={evenements.map(() => null)}
            />
          </div>
        );
      },
      reponse: (donnees) => (donnees.reponses as string[]).join(' '),
    },
    {
      cle: 'mesure',
      label: 'Compléter une mesure',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">
            Il manque une figure pour faire {String(donnees.mesure)} temps.
            Dessine-la dans la case.
          </p>
          <Portee
            cle="rythme"
            espace={38}
            symboles={(donnees.evenements as Evenement[]).map((e) => ({
              position: 4,
              figure: e.figure,
              silence: e.silence,
            }))}
          />
          <p className="SolfegeImp__ligne">
            <span className="SolfegeImp__boite" />
          </p>
        </div>
      ),
      reponse: (donnees) => String(donnees.reponse),
    },
  ],
  options: [
    {
      cle: 'cle',
      label: 'Quelle clé',
      type: 'unique',
      defaut: 'sol',
      choix: [
        { valeur: 'sol', label: 'Clé de sol' },
        { valeur: 'fa', label: 'Clé de fa' },
        { valeur: 'les-deux', label: 'Les deux mélangées' },
      ],
      pour: ['notes', 'placer'],
    },
    {
      cle: 'etendue',
      label: 'Jusqu’où vont les notes',
      type: 'unique',
      defaut: '0',
      choix: [
        { valeur: '0', label: 'Dans la portée' },
        { valeur: '1', label: '+ 1 ligne supplémentaire' },
        { valeur: '2', label: '+ 2 lignes supplémentaires' },
      ],
      pour: ['notes', 'placer'],
    },
    {
      cle: 'figures',
      label: 'Quelles figures',
      type: 'multi',
      choix: [
        { valeur: 'ronde', label: 'Ronde et pause' },
        { valeur: 'blanche', label: 'Blanche et demi-pause' },
        { valeur: 'noire', label: 'Noire et soupir' },
        { valeur: 'croche', label: 'Croche et demi-soupir' },
      ],
      pour: ['figure', 'syllabes', 'mesure'],
    },
    {
      cle: 'mesure',
      label: 'Combien de temps par mesure',
      type: 'unique',
      defaut: '2',
      choix: [
        { valeur: '2', label: '2 temps' },
        { valeur: '3', label: '3 temps' },
        { valeur: '4', label: '4 temps' },
      ],
      pour: ['syllabes', 'mesure'],
    },
  ],
};
