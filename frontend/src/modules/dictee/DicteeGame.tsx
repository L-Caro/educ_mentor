import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import Spinner from 'src/components/common/Spinner';
import Button from 'src/components/common/Button';
import {
  useCompleteDicteeSessionMutation,
  useStartDicteeSessionMutation,
} from './dictee.api';
import { cleanWord, tokenize, type ContenuToken } from './dictee.tokens';
import type { DicteeNiveau, DicteeSessionResponse } from './dictee.type';
import './dictee.scss';

const MODULE_ID = 'dictee';
const PREP_SECONDS = 60;

type Phase = 'loading' | 'error' | 'preparation' | 'dictee' | 'correction' | 'done';

const UNIT_LABEL: Record<DicteeNiveau, string> = {
  debutant: 'Mot',
  normal: 'Phrase',
  difficile: 'Paragraphe',
};

function messageFromError(error: unknown): string {
  const data = (error as { data?: { message?: string | string[] } })?.data;
  const message = data?.message;
  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;
  return 'Impossible de charger la dictée.';
}

export default function DicteeGame() {
  const navigate = useNavigate();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const niveau = (setup.niveau as string as DicteeNiveau) || 'debutant';
  const longueur = (setup.longueur as string) || 'courte';
  const notionChoice = (setup.notion as string) || 'toutes';
  const preparee = setup.preparee === 'oui';

  const [startSession] = useStartDicteeSessionMutation();
  const [completeSession] = useCompleteDicteeSessionMutation();

  const [session, setSession] = useState<DicteeSessionResponse | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [itemIndex, setItemIndex] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(PREP_SECONDS);
  const [wrongTokens, setWrongTokens] = useState<Set<string>>(new Set());
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    startSession({
      niveau,
      longueur,
      notion: notionChoice === 'toutes' ? undefined : notionChoice,
      preparee,
    })
      .unwrap()
      .then((data) => {
        setSession(data);
        setPhase(data.preparee ? 'preparation' : 'dictee');
      })
      .catch((error) => {
        setErrorMsg(messageFromError(error));
        setPhase('error');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'preparation') return;
    if (prepSeconds <= 0) {
      setPhase('dictee');
      return;
    }
    const timer = setTimeout(() => setPrepSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [phase, prepSeconds]);

  const tokensByItem = useMemo<ContenuToken[][]>(
    () => (session ? session.items.map((item) => tokenize(item.contenu)) : []),
    [session],
  );

  if (phase === 'loading') {
    return (
      <div className="DicteeGame DicteeGame--centered">
        <Spinner />
      </div>
    );
  }

  if (phase === 'error' || !session) {
    return (
      <div className="DicteeGame DicteeGame--centered">
        <p className="DicteeGame__error">{errorMsg}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(`/module/${MODULE_ID}`)}>
          Changer de réglages
        </Button>
      </div>
    );
  }

  const items = session.items;
  const current = items[itemIndex];

  // ─── Préparation ───────────────────────────────────────────────────────────
  if (phase === 'preparation') {
    return (
      <div className="DicteeGame">
        <p className="DicteeGame__hint">
          Lis et observe les mots. Ils disparaissent dans {prepSeconds} s.
        </p>
        <div className={`DicteeGame__study DicteeGame__study--${niveau}`}>
          {items.map((item) => (
            <p key={item.id} className="DicteeGame__studyLine">
              {item.contenu}
            </p>
          ))}
        </div>
        <Button variant="primary" onClick={() => setPhase('dictee')}>
          J'ai fini, on commence
        </Button>
      </div>
    );
  }

  // ─── Dictée (écran de l'adulte qui dicte) ──────────────────────────────────
  if (phase === 'dictee') {
    return (
      <div className="DicteeGame">
        <p className="DicteeGame__hint">
          Écran pour l'adulte : lis à voix haute, l'enfant écrit sur sa feuille.
        </p>
        <p className="DicteeGame__counter">
          {UNIT_LABEL[niveau]} {itemIndex + 1} / {items.length}
        </p>
        <div className={`DicteeGame__prompt DicteeGame__prompt--${niveau}`}>
          {current.contenu}
        </div>
        <div className="DicteeGame__nav">
          <Button
            variant="outline"
            size="sm"
            disabled={itemIndex === 0}
            onClick={() => setItemIndex((index) => Math.max(0, index - 1))}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={itemIndex >= items.length - 1}
            onClick={() =>
              setItemIndex((index) => Math.min(items.length - 1, index + 1))
            }
          >
            Suivant
          </Button>
        </div>
        <Button variant="primary" onClick={() => setPhase('correction')}>
          Passer à la correction
        </Button>
      </div>
    );
  }

  // ─── Correction (on coche les mots ratés) ──────────────────────────────────
  if (phase === 'correction') {
    const toggleToken = (itemIdx: number, token: ContenuToken) => {
      if (!token.isWord) return;
      const key = `${itemIdx}:${token.index}`;
      setWrongTokens((previous) => {
        const next = new Set(previous);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    };

    const handleFinish = () => {
      const keys = new Set<string>();
      const displays: string[] = [];
      for (const mark of wrongTokens) {
        const [itemIdx, tokenIdx] = mark.split(':').map(Number);
        const token = tokensByItem[itemIdx]?.[tokenIdx];
        if (!token || keys.has(token.wordKey)) continue;
        keys.add(token.wordKey);
        displays.push(cleanWord(token.text));
      }

      setWrongWords(displays);
      setSubmitting(true);
      completeSession({ sessionId: session.session_id, wrongWords: [...keys] })
        .unwrap()
        .catch(() => {
          /* le suivi peut échouer sans bloquer la fin de partie */
        })
        .finally(() => {
          setSubmitting(false);
          setPhase('done');
        });
    };

    return (
      <div className="DicteeGame">
        <p className="DicteeGame__hint">
          Compare avec ta feuille et touche les mots où il y a une erreur.
        </p>
        <div className={`DicteeGame__correction DicteeGame__correction--${niveau}`}>
          {items.map((item, itemIdx) => (
            <p key={item.id} className="DicteeGame__correctionLine">
              {tokensByItem[itemIdx].map((token) =>
                token.isWord ? (
                  <button
                    key={token.index}
                    type="button"
                    className={`DicteeGame__token${
                      wrongTokens.has(`${itemIdx}:${token.index}`)
                        ? ' DicteeGame__token--wrong'
                        : ''
                    }`}
                    onClick={() => toggleToken(itemIdx, token)}
                  >
                    {token.text}
                  </button>
                ) : (
                  <span key={token.index}>{token.text}</span>
                ),
              )}
            </p>
          ))}
        </div>
        <p className="DicteeGame__counter">
          {wrongTokens.size === 0
            ? 'Aucune erreur cochée'
            : `${wrongTokens.size} mot${wrongTokens.size > 1 ? 's' : ''} à revoir`}
        </p>
        <Button variant="primary" onClick={handleFinish} disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Terminé'}
        </Button>
      </div>
    );
  }

  // ─── Récapitulatif ─────────────────────────────────────────────────────────
  return (
    <div className="DicteeGame DicteeGame--centered">
      {wrongWords.length === 0 ? (
        <p className="DicteeGame__recapTitle">Bravo, aucune faute !</p>
      ) : (
        <>
          <p className="DicteeGame__recapTitle">
            {wrongWords.length} mot{wrongWords.length > 1 ? 's' : ''} à retravailler
          </p>
          <p className="DicteeGame__recapWords">{wrongWords.join(', ')}</p>
        </>
      )}
      <div className="DicteeGame__nav">
        <Button variant="outline" size="sm" onClick={() => navigate(`/module/${MODULE_ID}`)}>
          Refaire une dictée
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Accueil
        </Button>
      </div>
    </div>
  );
}
