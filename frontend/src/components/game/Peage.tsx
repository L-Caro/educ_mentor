import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetSettingsQuery } from 'src/store/api/sharedApi.ts';
import {
  useGetPeageQuestionMutation,
  type PeageQuestion,
} from 'src/store/api/peageApi.ts';
import Button from 'src/components/common/Button';
import {
  ecrireRestantes,
  lireFrequence,
  lireNombre,
  lireRestantes,
} from './peageReglage';
import Spinner from 'src/components/common/Spinner';
import './peage.scss';

/**
 * Le péage : quelques questions avant d'ouvrir un plateau.
 *
 * ── Il faut RÉPONDRE JUSTE ───────────────────────────────────────────────────────────
 *
 * Une mauvaise réponse ne compte pas : on montre la bonne, et on repose une AUTRE
 * question. Il en faut `total` de justes pour passer.
 *
 * La première version laissait passer après `total` questions posées, justes ou fausses,
 * au motif qu'une porte fermée serait une punition. C'était naïf : une enfant comprend
 * très vite qu'un bouton au hasard ouvre la même porte, et le péage devient alors un
 * clic de plus avant de jouer. Il ne demandait plus rien, donc il n'enseignait plus rien.
 *
 * Reste que rien ne l'enferme : « Revenir en arrière » est toujours là. Elle peut
 * renoncer au jeu ; elle ne peut pas l'obtenir sans répondre.
 *
 * Tout ce qui peut mal tourner laisse passer : réglage à zéro, serveur muet, aucun module
 * capable de poser une question. Un péage en panne devant un morpion serait une panne
 * absurde.
 *
 * ── Une partie sur X, pas toutes ─────────────────────────────────────────────────────
 *
 * Le péage se pose à la première partie, puis laisse passer les suivantes jusqu'à la
 * prochaine échéance. Payer d'abord et jouer ensuite se comprend ; l'inverse, laisser
 * jouer deux fois puis barrer la troisième sans prévenir, ressemblerait à un caprice de
 * l'application.
 *
 * La décision se prend UNE FOIS, à l'ouverture, et ne change plus : sans ça, un simple
 * re-rendu pourrait faire apparaître un péage au milieu d'une partie déjà commencée.
 */
export default function Peage({
  moduleId,
  children,
}: {
  moduleId: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const { data: settings, isLoading, isError } = useGetSettingsQuery();
  const [demander] = useGetPeageQuestionMutation();

  const total = lireNombre(settings?.jeux_peage_questions);
  const frequence = lireFrequence(settings?.jeux_peage_frequence);

  /** `null` tant que les réglages chargent, puis figé pour toute la durée de l'écran. */
  const [barre, setBarre] = useState<boolean | null>(null);
  const decide = useRef(false);

  /** Les réponses JUSTES. Une erreur ne fait pas avancer ce compteur. */
  const [reussies, setReussies] = useState(0);
  const [question, setQuestion] = useState<PeageQuestion | null>(null);
  const [donnee, setDonnee] = useState<string | null>(null);
  const [enPanne, setEnPanne] = useState(false);
  const [chargement, setChargement] = useState(false);

  const suivante = useCallback(async () => {
    setChargement(true);
    setDonnee(null);
    try {
      const { question: tiree } = await demander().unwrap();
      // Aucun module ne sait poser de question : on n'a rien à demander, donc on laisse
      // jouer. Voir le commentaire du composant.
      if (!tiree) setEnPanne(true);
      setQuestion(tiree);
    } catch {
      setEnPanne(true);
    } finally {
      setChargement(false);
    }
  }, [demander]);

  // Barrer cette partie, ou la laisser passer. Une seule fois : le garde-fou par `ref`
  // sert autant au double montage du mode strict qu'à un changement de réglage en cours
  // de partie.
  useEffect(() => {
    if (isLoading || decide.current) return;
    decide.current = true;
    if (isError || total === 0) {
      setBarre(false);
      return;
    }
    const restantes = lireRestantes(frequence);
    if (restantes > 0) {
      ecrireRestantes(restantes - 1);
      setBarre(false);
      return;
    }
    // On barre, et on n'écrit RIEN : le crédit de parties libres ne se gagne qu'en
    // franchissant le péage, jamais en le voyant. L'écrire ici ouvrait une porte dérobée
    // grande comme une maison : entrer, faire demi-tour, revenir, et jouer gratuitement.
    setBarre(true);
  }, [isLoading, isError, total, frequence]);

  // La première question. Les suivantes sont demandées par « Continuer ».
  useEffect(() => {
    if (barre && reussies === 0 && question === null && !enPanne) {
      void suivante();
    }
  }, [barre, reussies, question, enPanne, suivante]);

  // Réglage éteint, serveur muet, partie non barrée, ou rien à demander : on joue.
  if (isLoading || barre === null) {
    return (
      <div className="Peage">
        <Spinner />
      </div>
    );
  }
  if (!barre || enPanne || reussies >= total) return <>{children}</>;

  if (chargement || !question) {
    return (
      <div className="Peage">
        <Spinner />
      </div>
    );
  }

  const repondu = donnee !== null;
  const juste = donnee === question.reponse;

  function repondre(choix: string) {
    if (repondu) return;
    setDonnee(choix);
  }

  function continuer() {
    // Seule une réponse juste avance. Une erreur repose une autre question, indéfiniment.
    const acquises = juste ? reussies + 1 : reussies;
    setReussies(acquises);
    if (acquises < total) {
      void suivante();
      return;
    }
    // Péage franchi : les `frequence - 1` parties suivantes sont libres. C'est ICI que le
    // crédit s'écrit, et nulle part ailleurs.
    ecrireRestantes(frequence - 1);
  }

  return (
    <div className="Peage">
      <div className="Peage__carte">
        <p className="Peage__entete">
          <span className="Peage__compte">
            {reussies} / {total} trouvée{total > 1 ? 's' : ''}
          </span>
          <span className="Peage__module">{question.module_nom}</span>
        </p>

        <p className="Peage__consigne">{question.consigne}</p>
        <p className="Peage__enonce">{question.enonce}</p>

        <div className="Peage__choix">
          {question.choix.map((choix) => {
            // Après la réponse, la bonne se montre TOUJOURS : c'est elle qu'on est venu
            // apprendre, pas le fait d'avoir eu tort.
            const etat = !repondu
              ? ''
              : choix === question.reponse
                ? ' Peage__choixBouton--bonne'
                : choix === donnee
                  ? ' Peage__choixBouton--mauvaise'
                  : '';
            return (
              <button
                key={choix}
                type="button"
                className={`Peage__choixBouton${etat}`}
                disabled={repondu}
                onClick={() => repondre(choix)}
              >
                {choix}
              </button>
            );
          })}
        </div>

        {repondu && (
          <>
            <p
              className={`Peage__verdict Peage__verdict--${juste ? 'juste' : 'faux'}`}
              role="status"
            >
              {juste
                ? 'Bien joué !'
                : `C'était « ${question.reponse} ». Celle-ci ne compte pas.`}
            </p>
            <Button variant="primary" onClick={continuer}>
              {juste && reussies + 1 >= total ? 'Jouer' : 'Question suivante'}
            </Button>
          </>
        )}

        {/* Une sortie toujours ouverte. Sans elle, une enfant qui ne veut plus répondre
            n'aurait que le bouton « précédent » du navigateur. */}
        <button
          type="button"
          className="Peage__renoncer"
          onClick={() => navigate(`/module/${moduleId}`)}
        >
          Revenir en arrière
        </button>
      </div>
    </div>
  );
}

