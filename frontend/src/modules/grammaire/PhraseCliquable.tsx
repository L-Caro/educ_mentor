import type { MapInteractionProps } from 'src/types/game.types';
import type { MotAffiche } from './grammaire.type';

interface Props extends MapInteractionProps {
  /** Optionnel parce que le moteur type `getComponent` en `ComponentType<MapInteractionProps>`
   * et fait passer les props propres au module par `getComponentProps`, non typées — même
   * compromis que `continent` et `visibleKeys` sur `WorldMap`. En pratique toujours fourni. */
  mots?: MotAffiche[];
}

/**
 * La phrase, chaque mot touchable. C'est le composant de sélection multiple du moteur
 * (`spec.map` avec `isMultiSelect`), pas une reprise de l'écran de correction de la
 * dictée : celui-là est de l'AUTO-correction — l'enfant coche ses propres fautes et
 * l'application ne connaît aucune vérité. Ici il y a une bonne réponse, donc il faut la
 * validation, le score et la progression que le moteur fournit déjà.
 *
 * La clé d'un mot est son index dans la phrase, en chaîne : le contrat du moteur
 * (`onToggle(key)`, `correctKeys`) travaille sur des chaînes.
 *
 * Après la réponse, l'affichage sépare trois cas plutôt que deux : juste (touché et
 * attendu), oublié (attendu, pas touché) et en trop (touché, pas attendu). « Faux »
 * mettrait dans le même sac l'enfant qui a raté un mot et celui qui en a ajouté un —
 * or ce ne sont pas les mêmes erreurs, ni la même correction.
 */
export default function PhraseCliquable({
  mots = [],
  onToggle,
  selectedKeys,
  correctKeys,
  answerState,
}: Props) {
  const repondu = answerState !== 'idle';
  const attendus = new Set(correctKeys);

  function etat(key: string): string {
    const touche = selectedKeys.has(key);
    if (!repondu) return touche ? ' PhraseCliquable__mot--touche' : '';
    if (attendus.has(key)) {
      return touche
        ? ' PhraseCliquable__mot--juste'
        : ' PhraseCliquable__mot--oublie';
    }
    return touche ? ' PhraseCliquable__mot--enTrop' : '';
  }

  return (
    <p className="PhraseCliquable">
      {mots.map((mot, index) => {
        const key = String(index);
        return (
          <span key={index}>
            {index > 0 && !mot.colle ? ' ' : ''}
            <button
              type="button"
              className={`PhraseCliquable__mot${etat(key)}`}
              disabled={repondu}
              onClick={() => onToggle?.(key)}
            >
              {mot.mot}
            </button>
            {mot.apres}
          </span>
        );
      })}
    </p>
  );
}
