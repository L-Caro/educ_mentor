import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import type { GameResultEntry } from 'src/types/game.types';
import { useStartAlphabetSessionMutation } from './alphabet.api';
import type { QuestionAlphabet } from './alphabet.types';
import './alphabet.scss';

const MODULE_ID = 'alphabet';

/**
 * Ranger des mots dans l'ordre alphabetique.
 *
 * Hors du moule question/reponse, donc branche par `child: { Game }` : aucune des trois
 * formes n'est un choix parmi des propositions ni une saisie libre. On TOUCHE des mots,
 * comme dans le module de programmation, et pour la meme raison : le glisser-deposer
 * demande deux implementations, rate souvent a sept ans, et un mot lache a cote disparait
 * sans qu'on sache pourquoi.
 */
export default function AlphabetGame() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const [demarrer, { data: session, isLoading, isError }] =
    useStartAlphabetSessionMutation();

  const [rang, setRang] = useState(0);
  /** Les mots deja poses, dans l'ordre choisi. */
  const [poses, setPoses] = useState<string[]>([]);
  const [choisi, setChoisi] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<'juste' | 'faux' | null>(null);
  const [entrees, setEntrees] = useState<GameResultEntry[]>([]);

  useEffect(() => {
    void demarrer({
      types: (setup['types'] as string[] | undefined) ?? undefined,
      communes: Number((setup['communes'] as string | undefined) ?? '1'),
      combien: Number((setup['combien'] as string | undefined) ?? '4'),
    });
    // Une seule fois : relancer a chaque rendu redemanderait une seance entiere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const question: QuestionAlphabet | undefined = session?.questions[rang];
  const restants = useMemo(
    () => question?.mots.filter((mot) => !poses.includes(mot)) ?? [],
    [question, poses],
  );

  if (isLoading || !session) return <Spinner />;
  if (isError || session.questions.length === 0) {
    return (
      <p className="Alphabet__vide">
        Impossible de composer des questions avec ces réglages. Essaie moins de
        mots à la fois, ou des mots qui se ressemblent moins.
      </p>
    );
  }
  if (!question) return <Spinner />;

  /**
   * L'ecran de resultat porte les MOTS, pas la consigne.
   *
   * « Ces mots sont presque rangés… » etait la meme phrase sur les vingt lignes, et ne
   * disait rien de l'exercice qu'elle avait rate. Ce qui l'identifie, c'est la liste
   * qu'on lui avait donnee.
   */
  function valider(juste: boolean, donne: string, attendu: string) {
    const enonce =
      question!.aPlacer === null
        ? question!.mots.join(' · ')
        : `${question!.aPlacer} dans ${question!.mots.join(' · ')}`;
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
    const fini = rang + 1 >= session!.questions.length;
    if (fini) {
      dispatch(
        setGameResult({
          correctCount: entrees.filter((e) => e.correct).length,
          total: session!.questions.length,
          results: entrees,
        }),
      );
      navigate(`/module/${MODULE_ID}/result`);
      return;
    }
    setRang(rang + 1);
    setPoses([]);
    setChoisi(null);
    setVerdict(null);
  }

  // ── Ranger ────────────────────────────────────────────────────────────────
  function poser(mot: string) {
    if (verdict) return;
    const suite = [...poses, mot];
    setPoses(suite);
    if (suite.length === question!.mots.length) {
      valider(
        suite.join() === question!.reponse.join(),
        suite.join(' · '),
        question!.reponse.join(' · '),
      );
    }
  }

  // ── Intrus ────────────────────────────────────────────────────────────────
  function designer(mot: string) {
    if (verdict) return;
    setChoisi(mot);
    valider(
      question!.reponse.includes(mot),
      mot,
      question!.reponse.join(' ou '),
    );
  }

  // ── Intercaler ────────────────────────────────────────────────────────────
  function intercaler(position: number) {
    if (verdict) return;
    const attendu = Number(question!.reponse[0]);
    const apercu = [...question!.mots];
    apercu.splice(position, 0, question!.aPlacer ?? '');
    const juste = [...question!.mots];
    juste.splice(attendu, 0, question!.aPlacer ?? '');
    valider(position === attendu, apercu.join(' · '), juste.join(' · '));
  }

  return (
    <div className="Alphabet">
      <p className="Alphabet__consigne">{question.consigne}</p>

      {question.type === 'ranger' && (
        <>
          {/* Les mots deja poses, dans l'ordre choisi. On peut reprendre le dernier tant
              que la reponse n'est pas complete : se tromper d'un mot ne doit pas obliger
              a tout recommencer. */}
          <ol className="Alphabet__poses">
            {poses.length === 0 && (
              <li className="Alphabet__invite">
                Touche les mots, du premier au dernier.
              </li>
            )}
            {/* Seul le DERNIER mot pose est un bouton : c'est le seul qu'on puisse
                reprendre. Les autres sont du texte. Les rendre boutons eteints les
                grisait, et un mot gris au milieu d'une suite se lit comme une erreur. */}
            {poses.map((mot, i) =>
              i === poses.length - 1 && !verdict ? (
                <li key={mot}>
                  <button
                    type="button"
                    className="Alphabet__mot Alphabet__mot--pose"
                    title="Reprendre ce mot"
                    onClick={() => setPoses(poses.slice(0, -1))}
                  >
                    {mot}
                  </button>
                </li>
              ) : (
                <li key={mot}>
                  <span className="Alphabet__mot Alphabet__mot--pose Alphabet__mot--fixe">
                    {mot}
                  </span>
                </li>
              ),
            )}
          </ol>

          <div className="Alphabet__reserve">
            {restants.map((mot) => (
              <button
                key={mot}
                type="button"
                className="Alphabet__mot"
                onClick={() => poser(mot)}
                disabled={verdict !== null}
              >
                {mot}
              </button>
            ))}
          </div>
        </>
      )}

      {question.type === 'intrus' && (
        <div className="Alphabet__liste">
          {question.mots.map((mot) => (
            <button
              key={mot}
              type="button"
              className={`Alphabet__mot${choisi === mot ? ' Alphabet__mot--choisi' : ''}`}
              onClick={() => designer(mot)}
              disabled={verdict !== null}
            >
              {mot}
            </button>
          ))}
        </div>
      )}

      {question.type === 'intercaler' && (
        <div className="Alphabet__intercaler">
          <p className="Alphabet__aPlacer">{question.aPlacer}</p>
          {/* Un emplacement AVANT chaque mot, et un dernier apres : ce sont les trous du
              rangement, et c'est la qu'on designe, pas sur les mots eux-memes. */}
          <div className="Alphabet__liste">
            <button
              type="button"
              className="Alphabet__trou"
              onClick={() => intercaler(0)}
              disabled={verdict !== null}
              aria-label="placer au début"
            >
              +
            </button>
            {question.mots.map((mot, i) => (
              <span key={mot} className="Alphabet__place">
                <span className="Alphabet__mot Alphabet__mot--fixe">{mot}</span>
                <button
                  type="button"
                  className="Alphabet__trou"
                  onClick={() => intercaler(i + 1)}
                  disabled={verdict !== null}
                  aria-label={`placer après ${mot}`}
                >
                  +
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {verdict && (
        <div className={`Alphabet__verdict Alphabet__verdict--${verdict}`}>
          <p>
            {verdict === 'juste'
              ? 'Bien rangé !'
              : `Dans l’ordre : ${question.reponse.join(' · ')}`}
          </p>
          <Button variant="primary" onClick={suivante}>
            {rang + 1 >= session.questions.length ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      )}

      <p className="Alphabet__avancement">
        {String(rang + 1)} / {String(session.questions.length)}
      </p>
    </div>
  );
}
