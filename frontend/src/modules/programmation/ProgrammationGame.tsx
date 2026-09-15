import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from 'src/components/common/Button';
import Grille from './components/Grille';
import Palette from './components/Palette';
import Programme from './components/Programme';
import { MODELES } from './programmation.blocs';
import {
  compterBlocs,
  executer,
  reussi,
} from './programmation.interprete';
import { ETAPES, bloc, engendrerNiveau } from './programmation.niveaux';
import { useEnregistrerReussiteMutation, useGetProgrammationEtatQuery } from './programmation.api';
import { theme } from './themes';
import {
  BLOCS_A_CORPS,
  type Etat,
  type Instruction,
  type Niveau,
  type Parcours,
  type SorteBloc,
} from './programmation.types';
import './programmation.scss';

/** Le temps d'un pas a l'ecran. Assez lent pour SUIVRE le personnage : voir ou le
 * programme derape est tout l'interet de le rejouer, et a cent millisecondes on ne voit
 * qu'un resultat. */
const DUREE_PAS = 420;

/** Retire une instruction, ou qu'elle soit. */
function sansInstruction(liste: Instruction[], id: string): Instruction[] {
  return liste
    .filter((instruction) => instruction.id !== id)
    .map((instruction) =>
      instruction.corps
        ? { ...instruction, corps: sansInstruction(instruction.corps, id) }
        : instruction,
    );
}

/** Ajoute une instruction, a la racine ou dans le corps designe. */
function avecInstruction(
  liste: Instruction[],
  cible: string | null,
  neuve: Instruction,
): Instruction[] {
  if (cible === null) return [...liste, neuve];
  return liste.map((instruction) => {
    if (instruction.id === cible) {
      return { ...instruction, corps: [...(instruction.corps ?? []), neuve] };
    }
    return instruction.corps
      ? { ...instruction, corps: avecInstruction(instruction.corps, cible, neuve) }
      : instruction;
  });
}

function avecFois(liste: Instruction[], id: string, fois: number): Instruction[] {
  return liste.map((instruction) =>
    instruction.id === id
      ? { ...instruction, fois }
      : instruction.corps
        ? { ...instruction, corps: avecFois(instruction.corps, id, fois) }
        : instruction,
  );
}

/**
 * Le jeu de programmation.
 *
 * Hors du moule question/reponse, donc branche par `child: { Game }` comme le snake et le
 * mahjong. Il n'y a rien a mesurer ici au sens des autres modules : ni bonne reponse, ni
 * maitrise. Ce qui se retient, c'est jusqu'ou elle est allee.
 */
export default function ProgrammationGame() {
  const [params] = useSearchParams();
  const parcours = (params.get('parcours') ?? 'enfant') as Parcours;
  const cote = Number(params.get('grille') ?? '6');
  const decor = theme(params.get('theme') ?? 'lapin');

  const { data: etats } = useGetProgrammationEtatQuery();
  const [enregistrer] = useEnregistrerReussiteMutation();

  /** L'etape CHOISIE a la main. Tant qu'on n'a rien choisi, c'est celle ou elle s'etait
   * arretee qui s'impose : sans cela elle recommence au premier niveau a chaque
   * ouverture, ce qui est le plus sur moyen de lui faire abandonner un module. */
  const [choisi, setChoisi] = useState<number | null>(null);
  /** Change a chaque « recommencer » : c'est ce qui redemande un niveau au generateur. */
  const [graine, setGraine] = useState(0);
  const [programme, setProgramme] = useState<Instruction[]>([]);
  const [cible, setCible] = useState<string | null>(null);
  const [joue, setJoue] = useState(false);
  const [issue, setIssue] = useState<'gagne' | 'rate' | null>(null);
  const minuteur = useRef<number | null>(null);

  const atteinte = etats?.find((e) => e.parcours === parcours)?.etape_atteinte ?? 0;
  const rang = choisi ?? Math.min(atteinte, ETAPES.length - 1);

  // Le niveau est DERIVE de ce qui le decrit : l'etape, la taille, le parcours, et la
  // graine que « recommencer » fait tourner. L'engendrer dans un effet aurait provoque
  // un rendu de plus a chaque changement, et surtout un instant ou l'ecran montre le
  // niveau precedent avec les commandes du suivant.
  const niveau = useMemo(
    () => engendrerNiveau(ETAPES[rang], cote, parcours),
    // La graine ne sert qu'a forcer un nouveau tirage : elle n'est lue nulle part.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rang, cote, parcours, graine],
  );

  const [etat, setEtat] = useState<Etat | null>(null);
  const [niveauVu, setNiveauVu] = useState<Niveau | null>(null);

  // Remettre le personnage au depart quand le niveau change. Ajuste PENDANT le rendu, et
  // non dans un effet : c'est la facon dont React demande de synchroniser un etat sur une
  // valeur qui change, et elle evite le rendu intermediaire ou le personnage est encore
  // sur l'ancienne grille.
  if (niveau !== niveauVu) {
    setNiveauVu(niveau);
    setEtat(
      niveau
        ? {
            position: { ...niveau.depart },
            direction: niveau.directionDepart,
            graines: niveau.graines.map((g) => ({ ...g })),
          }
        : null,
    );
    setProgramme([]);
    setCible(null);
    setIssue(null);
    setJoue(false);
  }

  useEffect(
    () => () => {
      if (minuteur.current) window.clearInterval(minuteur.current);
    },
    [],
  );

  const trop =
    niveau?.maximumBlocs !== undefined &&
    compterBlocs(programme) > niveau.maximumBlocs;

  function ajouter(sorte: SorteBloc) {
    const neuve = bloc(sorte, BLOCS_A_CORPS.includes(sorte) ? { fois: 3, corps: [] } : {});
    setProgramme((precedent) => avecInstruction(precedent, cible, neuve));
    // Ouvrir tout de suite le dedans d'un bloc qu'on vient de poser : c'est ce qu'on veut
    // faire ensuite neuf fois sur dix, et le chercher casse l'elan.
    if (BLOCS_A_CORPS.includes(sorte)) setCible(neuve.id);
  }

  function lancer() {
    if (!niveau || programme.length === 0) return;
    const trace = executer(niveau, programme);
    setJoue(true);
    setIssue(null);

    let pas = 0;
    minuteur.current = window.setInterval(() => {
      pas += 1;
      setEtat(trace[pas]);
      if (pas >= trace.length - 1) {
        if (minuteur.current) window.clearInterval(minuteur.current);
        const gagne = reussi(niveau, trace);
        setIssue(gagne ? 'gagne' : 'rate');
        setJoue(false);
        if (gagne) {
          void enregistrer({ parcours, etape: niveau.etape });
        }
      }
    }, DUREE_PAS);
  }

  if (!niveau || !etat) {
    return (
      <p className="Prog__vide">
        Cette grille est trop petite pour ce niveau. Reviens en arrière et
        choisis une grille plus grande.
      </p>
    );
  }

  const etape = ETAPES[rang];
  const dernier = rang >= ETAPES.length - 1;

  return (
    <div className="Prog">
      <div className="Prog__entete">
        <p className="Prog__etape">
          Étape {String(etape.rang)} sur {String(ETAPES.length)} · {etape.titre}
        </p>
        <p className="Prog__consigne">{etape.consigne}</p>
      </div>

      <div className="Prog__jeu">
        <Grille niveau={niveau} etat={etat} theme={decor} />

        <div className="Prog__cote">
          <Palette blocs={niveau.blocs} surAjout={ajouter} bloque={joue} />

          <Programme
            programme={programme}
            cible={cible}
            rangActif={null}
            surRetrait={(id) =>
              setProgramme((precedent) => sansInstruction(precedent, id))
            }
            surCible={setCible}
            surFois={(id, fois) =>
              setProgramme((precedent) => avecFois(precedent, id, fois))
            }
          />

          {niveau.maximumBlocs !== undefined && (
            <p className={`Prog__bride${trop ? ' Prog__bride--trop' : ''}`}>
              {String(compterBlocs(programme))} ordres sur{' '}
              {String(niveau.maximumBlocs)} · sers-toi de «{' '}
              {MODELES.repeter.mot} »
            </p>
          )}

          <div className="Prog__actions">
            <Button
              variant="primary"
              onClick={lancer}
              disabled={joue || programme.length === 0 || trop}
            >
              ▶ Lance
            </Button>
            <Button variant="outline" onClick={() => setGraine(graine + 1)}>
              Recommencer
            </Button>
          </div>

          {issue === 'gagne' && (
            <div className="Prog__issue Prog__issue--gagne">
              <p>Gagné ! Tu as atteint {decor.nomBut}.</p>
              <div className="Prog__actions">
                {!dernier && (
                  <Button variant="primary" onClick={() => setChoisi(rang + 1)}>
                    Étape suivante
                  </Button>
                )}
                <Button variant="outline" onClick={() => setGraine(graine + 1)}>
                  Un autre comme ça
                </Button>
              </div>
            </div>
          )}

          {issue === 'rate' && (
            <div className="Prog__issue Prog__issue--rate">
              <p>
                {etat.incident === 'mur'
                  ? 'Il y avait quelque chose sur le chemin.'
                  : etat.incident === 'dehors'
                    ? 'Il est sorti du terrain.'
                    : etat.incident === 'trop_long'
                      ? 'Le programme tourne sans fin.'
                      : etat.graines.length > 0
                        ? 'Il reste des choses à ramasser.'
                        : `Il n’est pas arrivé jusqu’à ${decor.nomBut}.`}
              </p>
              <p className="Prog__astuce">
                Regarde où il s’est arrêté, puis corrige ton programme.
              </p>
            </div>
          )}

          {rang > 0 && (
            <button
              type="button"
              className="Prog__retour"
              onClick={() => setChoisi(rang - 1)}
            >
              ← étape précédente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
