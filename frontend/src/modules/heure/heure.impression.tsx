import CadranImprime from './CadranImprime';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './heure.impression.scss';

/** `95` vers `1 h 35 min`. Une duree ne s'ecrit pas comme une heure : `1 h 35` serait un
 * moment de la journee, alors qu'on parle d'un temps ecoule. */
function enDuree(minutes: number): string {
  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  if (heures === 0) return `${String(reste)} min`;
  if (reste === 0) return `${String(heures)} h`;
  return `${String(heures)} h ${String(reste)} min`;
}

export const heureImpression: FournisseurImpression = {
  label: 'Lire l’heure',
  exercices: [
    {
      cle: 'lire',
      label: 'Un cadran dessiné, écrire l’heure',
      enonce: (d) => (
        <div>
          <CadranImprime
            heure={Number(d.heure)}
            minute={Number(d.minute)}
            chiffres={String(d.chiffres)}
            matin={d.matin as boolean | undefined}
          />
          <p>
            Il est <Blanc largeurMm={22} />
          </p>
        </div>
      ),
      reponse: (d) =>
        `${String(d.heure)} h ${String(Number(d.minute)).padStart(2, '0')}`,
    },
    {
      // L'exercice inverse, et il n'existe QUE sur le papier : a l'ecran il faudrait
      // faire tourner des aiguilles a la souris, ce qui mesurerait la souris.
      cle: 'dessiner',
      label: 'Un cadran vide, dessiner les aiguilles',
      enonce: (d) => (
        <div className="Heure__dessiner">
          <CadranImprime
            heure={Number(d.heure)}
            minute={Number(d.minute)}
            chiffres={String(d.chiffres)}
            matin={d.matin as boolean | undefined}
            sansAiguilles
          />
          <p className="Feuille__consigne">
            Dessine {String(d.heure)} h{' '}
            {String(Number(d.minute)).padStart(2, '0')}
          </p>
        </div>
      ),
      // Le corrige d'un dessin ne peut pas etre le dessin : il faudrait le comparer au
      // degre pres. On redonne l'heure, qui suffit a verifier a l'oeil.
      reponse: (d) =>
        `${String(d.heure)} h ${String(Number(d.minute)).padStart(2, '0')}`,
    },
    {
      cle: 'durees',
      label: 'Durées : heure d’arrivée, temps écoulé',
      enonce: (d) =>
        d.sens === 'fin' ? (
          <div>
            <p className="Feuille__consigne">
              Il est {String(d.depart)}. Cela dure {enDuree(Number(d.duree))}.
            </p>
            <p>
              Il sera <Blanc largeurMm={22} />
            </p>
          </div>
        ) : (
          <div>
            <p className="Feuille__consigne">
              De {String(d.depart)} à {String(d.fin)}.
            </p>
            <p>
              Il s’écoule <Blanc largeurMm={22} />
            </p>
          </div>
        ),
      reponse: (d) =>
        d.sens === 'fin' ? String(d.fin) : enDuree(Number(d.duree)),
    },
  ],
  options: [
    {
      cle: 'mode',
      label: 'Quelles heures',
      type: 'unique',
      choix: [
        // Les deux univers du module, sans en inventer un troisieme ici : la feuille et
        // l'ecran doivent poser les memes heures.
        {
          valeur: 'expression',
          label: 'Heures parlantes (et quart, et demie)',
        },
        { valeur: 'digital', label: 'Toute la journée, à la minute' },
      ],
      defaut: 'expression',
    },
    {
      cle: 'chiffres',
      label: 'Les chiffres du cadran',
      type: 'unique',
      choix: [
        { valeur: 'arabic', label: 'Arabes' },
        { valeur: 'roman', label: 'Romains' },
      ],
      defaut: 'arabic',
    },
  ],
};
