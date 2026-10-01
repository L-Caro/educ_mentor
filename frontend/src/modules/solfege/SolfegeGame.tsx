import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'src/components/common/Button';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import { useGetSettingsQuery } from 'src/store/api/sharedApi';
import type { GameResultEntry } from 'src/types/game.types';
import Portee from 'src/musique/Portee';
import Systeme from 'src/musique/Systeme';
import { jouerNote, maintenant, reveiller } from 'src/musique/audio';
import { dureeDuTemps, frequence, type Bilan } from 'src/musique/rythme';
import {
  NOTES,
  hauteurDe,
  syllabes,
  type Figure,
  type Mesure,
  type Note,
} from 'src/musique/solfege';
import {
  AIGU_DEFAUT,
  GRAVE_DEFAUT,
  genererDictee,
  genererFigure,
  genererLire,
  genererMesure,
  genererOreille,
  genererPartition,
  genererPlacer,
  genererRythme,
  nomDe2,
  type Mouvement,
  type Reglages,
} from 'src/musique/exercices';
import RythmeExercice from './RythmeExercice';
import { TYPES_SOLFEGE, type TypeSolfege } from './solfege.types';
import './solfege.scss';

const MODULE_ID = 'solfege';

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

type Question =
  | ReturnType<typeof genererLire>
  | ReturnType<typeof genererPartition>
  | ReturnType<typeof genererPlacer>
  | ReturnType<typeof genererFigure>
  | ReturnType<typeof genererMesure>
  | ReturnType<typeof genererRythme>
  | ReturnType<typeof genererDictee>
  | ReturnType<typeof genererOreille>;

function engendrer(type: TypeSolfege, reglages: Reglages): Question {
  switch (type) {
    case 'lire':
      return genererLire(reglages, rand);
    case 'partition':
      return genererPartition(reglages, rand);
    case 'placer':
      return genererPlacer(reglages, rand);
    case 'figure':
      return genererFigure(reglages, rand);
    case 'mesure':
      return genererMesure(reglages, rand);
    case 'rythme':
      return genererRythme(reglages, rand);
    case 'dictee':
      return genererDictee(reglages, rand);
    case 'oreille':
      return genererOreille(4, rand);
  }
}

/**
 * Le solfège : lire les notes, nommer les figures, compléter une mesure, frapper un
 * rythme, reconnaître une hauteur.
 *
 * Hors du moule question/réponse de l'application, et pour une raison qui n'est pas de
 * confort : plusieurs exercices ne se jouent ni en cochant ni en écrivant. On TOUCHE une
 * portée pour y poser une note, et on FRAPPE en rythme sur une horloge audio. Ni l'un ni
 * l'autre n'entre dans un formulaire.
 */
export default function SolfegeGame() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setupBrut = useAppSelector(selectModuleSetup(MODULE_ID));
  // Memoisé : `?? {}` fabrique un objet NEUF à chaque rendu, ce qui relancerait les
  // `useMemo` qui en dépendent et retirerait une question sous ses doigts.
  const setup = useMemo(() => setupBrut ?? {}, [setupBrut]);
  const { data: reglagesApp } = useGetSettingsQuery();

  /**
   * Ce qui vient du PRÉ-JEU, et ce qui vient de l'ADMINISTRATION.
   *
   * Elle choisit ce qu'elle travaille, dans quelle clé, et à quelle vitesse bat le
   * métronome : ce sont des choix de séance. L'intervalle de notes, les notes ouvertes,
   * le mouvement, les figures, la mesure et la longueur des phrases disent où elle en est
   * en cours : ils se règlent une fois dans l'administration, comme la méthode de
   * soustraction du module « poser ».
   */
  const reglages: Reglages = useMemo(() => {
    const cles = setup['cles'] as string | undefined;
    const liste = (cle: string, defaut: string) =>
      (reglagesApp?.[cle] ?? defaut).split(',').filter(Boolean);
    const figures = liste('solfege_figures', 'blanche,noire') as Figure[];
    const notes = liste('solfege_notes', NOTES.join(',')).filter(
      (n): n is Note => (NOTES as readonly string[]).includes(n),
    );
    return {
      cles:
        cles === 'fa' ? ['fa'] : cles === 'les-deux' ? ['sol', 'fa'] : ['sol'],
      grave: Number(reglagesApp?.solfege_grave ?? String(GRAVE_DEFAUT)),
      aigu: Number(reglagesApp?.solfege_aigu ?? String(AIGU_DEFAUT)),
      mouvement: (reglagesApp?.solfege_mouvement ?? 'moyen') as Mouvement,
      figures: figures.length > 0 ? figures : ['blanche', 'noire'],
      mesure: Number(reglagesApp?.solfege_mesure ?? '2') as Mesure,
      tempo: Number((setup['tempo'] as string | undefined) ?? '72'),
      longueur: Number(reglagesApp?.solfege_longueur ?? '12'),
      notes: notes.length > 0 ? notes : [...NOTES],
    };
  }, [setup, reglagesApp]);

  const types = useMemo(() => {
    const choisis = (setup['types'] as string[] | undefined) ?? [];
    const valides = choisis.filter((t): t is TypeSolfege =>
      (TYPES_SOLFEGE as readonly string[]).includes(t),
    );
    return valides.length > 0 ? valides : (['lire'] as TypeSolfege[]);
  }, [setup]);

  const avecSyllabes =
    ((setup['syllabes'] as string | undefined) ?? 'oui') === 'oui';

  const combien = Number(reglagesApp?.questions_per_session ?? '10') || 10;

  const [rang, setRang] = useState(0);
  const [question, setQuestion] = useState<Question>(() =>
    engendrer(types[0], reglages),
  );
  const [verdict, setVerdict] = useState<'juste' | 'faux' | null>(null);
  const [detail, setDetail] = useState<string>('');
  const [entrees, setEntrees] = useState<GameResultEntry[]>([]);
  /** Ce qu'elle a désigné, pour le montrer pendant la correction. */
  const [choisi, setChoisi] = useState<number | string | null>(null);

  function juger(
    juste: boolean,
    enonce: string,
    donne: string,
    attendu: string,
  ) {
    setVerdict(juste ? 'juste' : 'faux');
    setEntrees((precedent) => [
      ...precedent,
      {
        label: enonce,
        given: donne,
        expected: attendu,
        correct: juste,
        timeout: false,
      },
    ]);
  }

  function suivante() {
    if (rang + 1 >= combien) {
      dispatch(
        setGameResult({
          correctCount: entrees.filter((e) => e.correct).length,
          total: combien,
          results: entrees,
        }),
      );
      navigate(`/module/${MODULE_ID}/result`);
      return;
    }
    setRang(rang + 1);
    setVerdict(null);
    setDetail('');
    setChoisi(null);
    setQuestion(engendrer(types[rand(0, types.length - 1)], reglages));
  }

  return (
    <div className="Solfege">
      <div className="Solfege__scene">
        {question.type === 'lire' && (
          <>
            <p className="Solfege__consigne">Quelle est cette note ?</p>
            <Portee
              cle={question.cle}
              symboles={[
                { position: question.position, figure: 'ronde', cible: true },
              ]}
              espace={54}
            />
            <div className="Solfege__notes">
              {NOTES.map((note) => (
                <button
                  key={note}
                  type="button"
                  className={`Solfege__note${choisi === note ? ' Solfege__note--choisi' : ''}`}
                  disabled={verdict !== null}
                  onClick={() => {
                    setChoisi(note);
                    juger(
                      note === question.reponse,
                      'Lire une note',
                      note,
                      question.reponse,
                    );
                  }}
                >
                  {note}
                </button>
              ))}
            </div>
          </>
        )}

        {question.type === 'partition' && (
          <>
            <p className="Solfege__consigne">
              Lis ces {String(question.notes.length)} notes à la suite, en
              passant d&rsquo;une portée à l&rsquo;autre.
            </p>
            <Systeme
              emplacements={question.notes.length}
              espace={46}
              haut={question.notes
                .map((n, i) => ({ ...n, i }))
                .filter((n) => n.cle === 'sol')
                .map((n) => ({
                  position: n.position,
                  figure: 'ronde' as const,
                  emplacement: n.i,
                }))}
              bas={question.notes
                .map((n, i) => ({ ...n, i }))
                .filter((n) => n.cle === 'fa')
                .map((n) => ({
                  position: n.position,
                  figure: 'ronde' as const,
                  emplacement: n.i,
                }))}
              liaisonsHaut={question.groupes.filter(
                ([debut]) => question.notes[debut].cle === 'sol',
              )}
              liaisonsBas={question.groupes.filter(
                ([debut]) => question.notes[debut].cle === 'fa',
              )}
            />
            {/* Entendre ce qu'on vient de lire : la hauteur écrite et le son qu'elle
                produit sont deux choses que rien ne relie tant qu'on ne les a pas
                entendues ensemble. Ça n'aide pas à répondre, et c'est voulu : les
                propositions sont des NOMS, qu'aucune oreille de débutant ne reconnaît. */}
            <Button
              variant="outline"
              onClick={() => void jouerLaPartition(question)}
            >
              Écouter
            </Button>
            <div className="Solfege__suites">
              {question.choix.map((suite, index) => (
                <button
                  key={index}
                  type="button"
                  className={`Solfege__suite${choisi === index ? ' Solfege__suite--choisi' : ''}${
                    verdict !== null && suite.join() === question.reponse.join()
                      ? ' Solfege__suite--juste'
                      : ''
                  }`}
                  disabled={verdict !== null}
                  onClick={() => {
                    setChoisi(index);
                    juger(
                      suite.join() === question.reponse.join(),
                      'Lire une partition',
                      suite.join(' '),
                      question.reponse.join(' '),
                    );
                  }}
                >
                  {suite.join(' ')}
                </button>
              ))}
            </div>
          </>
        )}

        {question.type === 'placer' && (
          <>
            <p className="Solfege__consigne">
              Touche la portée à l’endroit du <strong>{question.note}</strong>.
            </p>
            <Portee
              cle={question.cle}
              // Quand elle se trompe, on montre les DEUX : là où elle a posé la note, et
              // là où elle allait. « Ce n'est pas là » sans dire où n'apprend rien, et
              // c'est précisément la question qu'elle se pose à cet instant.
              symboles={placerSymboles(question, choisi)}
              espace={70}
              onPosition={
                verdict === null
                  ? (position) => {
                      setChoisi(position);
                      juger(
                        question.reponses.includes(position),
                        `Placer un ${question.note}`,
                        'à cet endroit',
                        question.note,
                      );
                    }
                  : undefined
              }
            />
          </>
        )}

        {question.type === 'figure' && (
          <>
            <p className="Solfege__consigne">
              {question.silence
                ? 'Quel est ce silence ?'
                : 'Quelle est cette figure ?'}
            </p>
            {/* Sur une portée de CINQ lignes, même pour une question qui ne parle pas de
                hauteur. Une pause et une demi-pause sont le même petit rectangle : ce qui
                les distingue, c'est la ligne à laquelle il s'accroche. Sur la ligne
                unique de la lecture rythmique, la question n'aurait pas de réponse. */}
            <Portee
              cle="sol"
              symboles={[
                {
                  position: 4,
                  figure: question.figure,
                  silence: question.silence,
                },
              ]}
              espace={60}
            />
            <div className="Solfege__choix">
              {question.choix.map((nom) => (
                <button
                  key={nom}
                  type="button"
                  className={`Solfege__note${choisi === nom ? ' Solfege__note--choisi' : ''}`}
                  disabled={verdict !== null}
                  onClick={() => {
                    setChoisi(nom);
                    juger(
                      nom === question.reponse,
                      'Nommer une figure',
                      nom,
                      question.reponse,
                    );
                  }}
                >
                  {nom}
                </button>
              ))}
            </div>
          </>
        )}

        {question.type === 'mesure' && (
          <>
            <p className="Solfege__consigne">
              Il manque une figure pour faire {question.mesure} temps. Laquelle
              ?
            </p>
            <Portee
              cle="rythme"
              symboles={question.evenements.map((e) => ({
                position: 4,
                figure: e.figure,
                silence: e.silence,
                syllabe: avecSyllabes ? syllabes(e) : undefined,
              }))}
              espace={44}
            />
            <div className="Solfege__figures">
              {question.choix.map((figure) => (
                <button
                  key={figure}
                  type="button"
                  className={`Solfege__figure${choisi === figure ? ' Solfege__figure--choisi' : ''}`}
                  disabled={verdict !== null}
                  onClick={() => {
                    setChoisi(figure);
                    juger(
                      figure === question.reponse,
                      'Compléter une mesure',
                      nomDe2(figure, false),
                      nomDe2(question.reponse, false),
                    );
                  }}
                >
                  <Portee
                    cle="rythme"
                    symboles={[{ position: 4, figure }]}
                    espace={34}
                  />
                  <span>{nomDe2(figure, false)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {question.type === 'rythme' && (
          <RythmeExercice
            key={rang}
            question={question}
            avecSyllabes={avecSyllabes}
            onFini={(bilan: Bilan) => {
              const juste =
                bilan.total > 0 &&
                bilan.justes === bilan.total &&
                bilan.superflues === 0;
              setDetail(
                bilan.total === 0
                  ? 'Le son n’a pas pu démarrer sur cet appareil.'
                  : `${String(bilan.justes)} frappe${bilan.justes > 1 ? 's' : ''} sur ${String(bilan.total)} à l’heure` +
                      (bilan.superflues > 0
                        ? `, et ${String(bilan.superflues)} de trop`
                        : ''),
              );
              juger(
                juste,
                'Frapper un rythme',
                `${String(bilan.justes)}/${String(bilan.total)}`,
                'tout à l’heure',
              );
            }}
          />
        )}

        {question.type === 'dictee' && (
          <DicteeExercice
            key={rang}
            question={question}
            avecSyllabes={avecSyllabes}
            fige={verdict !== null}
            choisi={typeof choisi === 'number' ? choisi : null}
            onChoix={(index) => {
              setChoisi(index);
              juger(
                index === question.reponse,
                'Dictée rythmique',
                `le ${String(index + 1)}`,
                `le ${String(question.reponse + 1)}`,
              );
            }}
          />
        )}

        {question.type === 'oreille' && (
          <OreilleExercice
            key={rang}
            question={question}
            fige={verdict !== null}
            choisi={typeof choisi === 'string' ? choisi : null}
            onChoix={(reponse) => {
              setChoisi(reponse);
              juger(
                reponse === question.reponse,
                'Monte ou descend',
                reponse,
                question.reponse,
              );
            }}
          />
        )}
      </div>

      {verdict && (
        <div className={`Solfege__verdict Solfege__verdict--${verdict}`}>
          <p>
            {verdict === 'juste' ? 'Bravo !' : reponseEnClair(question)}
            {detail && <span className="Solfege__detail">{detail}</span>}
          </p>
          <Button variant="primary" onClick={suivante}>
            {rang + 1 >= combien ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      )}

      <p className="Solfege__avancement">
        {String(rang + 1)} / {String(combien)}
      </p>
    </div>
  );
}

/**
 * Ce qu'on dessine sur la portée de « placer une note ».
 *
 * Tant qu'elle n'a pas répondu : rien. Quand elle a juste : sa note, en vert. Quand elle
 * s'est trompée : sa note en rouge ET la bonne place en vert, celle qui est la plus
 * proche de son doigt, parce que c'est celle qu'elle visait.
 */
function placerSymboles(
  question: ReturnType<typeof genererPlacer>,
  choisi: number | string | null,
) {
  if (typeof choisi !== 'number') return [];
  const juste = question.reponses.includes(choisi);
  if (juste) {
    return [
      { position: choisi, figure: 'ronde' as const, verdict: 'juste' as const },
    ];
  }
  const plusProche = question.reponses.reduce((a, b) =>
    Math.abs(b - choisi) < Math.abs(a - choisi) ? b : a,
  );
  return [
    { position: choisi, figure: 'ronde' as const, verdict: 'faux' as const },
    {
      position: plusProche,
      figure: 'ronde' as const,
      verdict: 'juste' as const,
    },
  ];
}

/** Joue la suite écrite, une note après l'autre, au rythme où on la lirait. */
async function jouerLaPartition(
  question: ReturnType<typeof genererPartition>,
): Promise<void> {
  const contexte = await reveiller();
  if (!contexte) return;
  let quand = maintenant() + 0.25;
  for (const { cle, position } of question.notes) {
    jouerNote(frequence(hauteurDe(position, cle)), quand, 0.55);
    quand += 0.65;
  }
}

/** Ce qu'il fallait répondre, en une phrase qu'on lit sans réfléchir. */
function reponseEnClair(question: Question): string {
  switch (question.type) {
    case 'lire':
      return `C’était un ${question.reponse}.`;
    case 'partition':
      return `C’était : ${question.reponse.join(' ')}.`;
    case 'placer':
      return `Le ${question.note} était en vert.`;
    case 'figure':
      return `C’était une ${question.reponse}.`;
    case 'mesure':
      return `Il manquait une ${nomDe2(question.reponse, false)}.`;
    case 'dictee':
      return `C’était le numéro ${String(question.reponse + 1)}.`;
    case 'oreille':
      return question.reponse === 'pareil'
        ? 'Les deux notes étaient pareilles.'
        : `Ça ${question.reponse === 'monte' ? 'montait' : 'descendait'}.`;
    default:
      return 'Pas tout à fait.';
  }
}

// ─── La dictée rythmique ─────────────────────────────────────────────────────

function DicteeExercice({
  question,
  avecSyllabes,
  fige,
  choisi,
  onChoix,
}: {
  question: ReturnType<typeof genererDictee>;
  avecSyllabes: boolean;
  fige: boolean;
  choisi: number | null;
  onChoix: (index: number) => void;
}) {
  const [joue, setJoue] = useState(false);

  async function ecouter() {
    const contexte = await reveiller();
    if (!contexte) return;
    setJoue(true);
    const pas = dureeDuTemps(question.tempo);
    let couru = maintenant() + 0.3;
    for (const evenement of question.joue) {
      // Un silence ne sonne pas, mais il prend son temps : c'est exactement ce qu'elle
      // doit entendre.
      if (!evenement.silence) jouerNote(660, couru, Math.min(0.25, pas * 0.6));
      couru += pas * tempsDe(evenement.figure);
    }
  }

  return (
    <>
      <p className="Solfege__consigne">
        Écoute le rythme, puis montre celui qui est écrit.
      </p>
      <Button variant="outline" onClick={() => void ecouter()}>
        {joue ? 'Réécouter' : 'Écouter'}
      </Button>
      <div className="Solfege__propositions">
        {question.propositions.map((phrase, index) => (
          <button
            key={index}
            type="button"
            className={`Solfege__proposition${choisi === index ? ' Solfege__proposition--choisi' : ''}${
              fige && index === question.reponse
                ? ' Solfege__proposition--juste'
                : ''
            }`}
            disabled={fige || !joue}
            onClick={() => onChoix(index)}
          >
            <span className="Solfege__numero">{index + 1}</span>
            <Portee
              cle="rythme"
              symboles={phrase.evenements.map((e) => ({
                position: 4,
                figure: e.figure,
                silence: e.silence,
                syllabe: avecSyllabes ? syllabes(e) : undefined,
              }))}
              barres={phrase.barres}
              espace={34}
            />
          </button>
        ))}
      </div>
      {!joue && (
        <p className="Solfege__aide">Il faut écouter avant de choisir.</p>
      )}
    </>
  );
}

const DUREES: Record<Figure, number> = {
  ronde: 4,
  blanche: 2,
  noire: 1,
  croche: 0.5,
  doubleCroche: 0.25,
};
function tempsDe(figure: Figure): number {
  return DUREES[figure];
}

// ─── L'oreille ───────────────────────────────────────────────────────────────

function OreilleExercice({
  question,
  fige,
  choisi,
  onChoix,
}: {
  question: ReturnType<typeof genererOreille>;
  fige: boolean;
  choisi: string | null;
  onChoix: (reponse: 'monte' | 'descend' | 'pareil') => void;
}) {
  const [joue, setJoue] = useState(false);

  async function ecouter() {
    const contexte = await reveiller();
    if (!contexte) return;
    setJoue(true);
    const debut = maintenant() + 0.25;
    jouerNote(question.frequences[0], debut, 0.7, question.timbre);
    jouerNote(question.frequences[1], debut + 0.9, 0.7, question.timbre);
  }

  const reponses: { cle: 'monte' | 'descend' | 'pareil'; label: string }[] = [
    { cle: 'monte', label: 'Ça monte' },
    { cle: 'descend', label: 'Ça descend' },
    { cle: 'pareil', label: 'C’est pareil' },
  ];

  return (
    <>
      <p className="Solfege__consigne">
        Écoute les deux notes. La deuxième est-elle plus haute ou plus basse ?
      </p>
      <Button variant="outline" onClick={() => void ecouter()}>
        {joue ? 'Réécouter' : 'Écouter'}
      </Button>
      <div className="Solfege__choix">
        {reponses.map(({ cle, label }) => (
          <button
            key={cle}
            type="button"
            className={`Solfege__note${choisi === cle ? ' Solfege__note--choisi' : ''}`}
            disabled={fige || !joue}
            onClick={() => onChoix(cle)}
          >
            {label}
          </button>
        ))}
      </div>
      {!joue && (
        <p className="Solfege__aide">Il faut écouter avant de choisir.</p>
      )}
    </>
  );
}
