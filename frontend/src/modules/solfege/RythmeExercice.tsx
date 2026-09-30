import { useCallback, useEffect, useRef, useState } from 'react';
import Button from 'src/components/common/Button';
import Portee from 'src/musique/Portee';
import { Metronome, jouerFut, maintenant, reveiller } from 'src/musique/audio';
import {
  dureeDuTemps,
  frappesAttendues,
  noterFrappes,
  type Bilan,
} from 'src/musique/rythme';
import { instants, syllabes } from 'src/musique/solfege';
import type { QuestionRythme } from 'src/musique/exercices';

/** Combien de battements de préparation. Une mesure entière : elle doit sentir la
 * pulsation avant de devoir jouer dessus, pas entrer en marche. */
const DECOMPTE = 4;

interface Props {
  question: QuestionRythme;
  /** Montrer les syllabes sous les notes. On les retire quand elle n'en a plus besoin :
   * les lire, c'est déjà ne plus lire le rythme. */
  avecSyllabes: boolean;
  onFini: (bilan: Bilan) => void;
}

type Etape = 'attente' | 'decompte' | 'joue' | 'fini';

/**
 * Lire un rythme et le frapper sur le métronome.
 *
 * ── Ce qui rend l'exercice délicat ───────────────────────────────────────────────────
 *
 * Il faut comparer ce qu'elle a fait à ce qu'il fallait faire, à quelques centièmes près.
 * Or l'heure du navigateur et l'heure de la carte son ne sont pas la même horloge, et
 * elles dérivent l'une par rapport à l'autre. Tout est donc daté sur l'horloge AUDIO,
 * celle du métronome : c'est la seule par rapport à laquelle « à l'heure » veut dire
 * quelque chose.
 */
export default function RythmeExercice({
  question,
  avecSyllabes,
  onFini,
}: Props) {
  const [etape, setEtape] = useState<Etape>('attente');
  const [battement, setBattement] = useState<number | null>(null);
  /** La figure qui est en train de passer : c'est elle qu'on éclaire, et c'est la seule
   * chose qui dit « maintenant ». Sans ce repère, on entend bien le métronome mais on ne
   * sait pas OÙ l'on en est dans la phrase. */
  const [curseur, setCurseur] = useState<number | null>(null);
  const metronome = useRef(new Metronome());
  const frappes = useRef<number[]>([]);

  const attendues = frappesAttendues(question.evenements, question.tempo);
  /** La phrase dure jusqu'à la fin de sa dernière figure, plus un temps de battement pour
   * laisser passer une frappe en retard. */
  const duree = attendues[attendues.length - 1] + (60 / question.tempo) * 1.5;

  const terminer = useCallback(() => {
    metronome.current.arreter();
    setEtape('fini');
    onFini(noterFrappes(attendues, frappes.current, question.tempo));
    // `attendues` est recalculé à chaque rendu mais ne change pas pendant l'exercice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFini, question.tempo]);

  async function demarrer() {
    // Le haut-parleur ne s'ouvre que depuis un geste : c'est ici, et nulle part ailleurs.
    const contexte = await reveiller();
    if (!contexte) {
      // Sans son, l'exercice n'a pas de sens : mieux vaut le dire que de la laisser
      // frapper dans le vide.
      setEtape('fini');
      onFini({ jugements: [], superflues: 0, justes: 0, total: 0 });
      return;
    }
    frappes.current = [];
    setEtape('decompte');
    metronome.current.demarrer({
      tempo: question.tempo,
      parMesure: question.mesure,
      decompte: DECOMPTE,
      sur: (b) => {
        setBattement(b.rang);
        if (b.rang === 0) setEtape('joue');
      },
    });
  }

  /** Une frappe : on la date sur l'horloge audio, et on la compte depuis le départ. */
  const frapper = useCallback(() => {
    if (etape !== 'joue' && etape !== 'decompte') return;
    const instant = maintenant() - metronome.current.depart;
    if (instant < -0.2) return; // pendant le décompte : elle s'échauffe, on ne compte pas
    frappes.current.push(instant);
    jouerFut('claire', maintenant());
  }, [etape]);

  // Le curseur et la fin de la phrase, mesurés sur l'horloge AUDIO : celle du navigateur
  // dérive par rapport au son, et un repère qui dérive est pire que pas de repère.
  useEffect(() => {
    if (etape !== 'joue') return;
    const pas = dureeDuTemps(question.tempo);
    const debuts = instants(question.evenements).map((t) => t * pas);
    const fin = metronome.current.depart + duree;

    let image = requestAnimationFrame(function verifier() {
      const ecoule = maintenant() - metronome.current.depart;
      let rang = -1;
      for (let i = 0; i < debuts.length; i++) {
        if (ecoule >= debuts[i] - pas * 0.25) rang = i;
      }
      setCurseur(rang >= 0 ? rang : null);
      if (maintenant() >= fin) {
        terminer();
        return;
      }
      image = requestAnimationFrame(verifier);
    });
    return () => cancelAnimationFrame(image);
  }, [etape, duree, terminer, question.tempo, question.evenements]);

  useEffect(() => {
    const horloge = metronome.current;
    return () => horloge.arreter();
  }, []);

  // L'espace et la touche entrée frappent aussi : au clavier, on ne vise pas un bouton.
  useEffect(() => {
    function appui(evenement: KeyboardEvent) {
      if (evenement.key !== ' ' && evenement.key !== 'Enter') return;
      evenement.preventDefault();
      if (!evenement.repeat) frapper();
    }
    window.addEventListener('keydown', appui);
    return () => window.removeEventListener('keydown', appui);
  }, [frapper]);

  const symboles = question.evenements.map((evenement, index) => ({
    position: 4,
    figure: evenement.figure,
    silence: evenement.silence,
    syllabe: avecSyllabes ? syllabes(evenement) : undefined,
    cible: index === curseur,
  }));

  return (
    <div className="Rythme">
      <Portee
        cle="rythme"
        symboles={symboles}
        barres={question.barres}
        espace={40}
      />

      {etape === 'attente' && (
        <div className="Rythme__depart">
          <p className="Rythme__consigne">
            Frappe une fois sur chaque note, en suivant le métronome. Ne frappe
            pas sur les silences, mais compte-les quand même.
            <span className="Solfege__detail">
              Un décompte de quatre temps te donne la vitesse, puis la note à
              jouer s’allume au fur et à mesure.
            </span>
          </p>
          <Button variant="primary" onClick={() => void demarrer()}>
            C’est parti
          </Button>
        </div>
      )}

      {(etape === 'decompte' || etape === 'joue') && (
        <>
          {/* Le décompte compte À REBOURS, comme on compte avant de partir. La première
              version affichait 0, 1, 2, 3 : on ne savait pas si c'était fini. */}
          <p className="Rythme__compte">
            {etape === 'decompte' ? (
              <span className="Rythme__chiffre">
                {String(-(battement ?? -DECOMPTE))}
              </span>
            ) : (
              'À toi !'
            )}
          </p>
          {/* Une grande cible, et une seule : à sept ans on frappe en regardant la
              partition, pas le bouton. */}
          <button
            type="button"
            className={`Rythme__tambour${etape === 'joue' ? ' Rythme__tambour--actif' : ''}`}
            onPointerDown={(evenement) => {
              evenement.preventDefault();
              frapper();
            }}
          >
            Frappe ici
          </button>
        </>
      )}
    </div>
  );
}
