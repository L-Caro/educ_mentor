import {
  CORPUS,
  DEFAULT_ACTIVE_CLASSES,
  texteDe,
  type PhraseAnnotee,
} from './grammaire.corpus';
import { NIVEAUX } from '../../common/niveau';
import { NATURES } from './grammaire.notions';

/**
 * Les invariants du corpus, que le typage ne peut pas voir.
 *
 * Une annotation fausse ne casse ni le typage ni le lint : `nc('dort')` compile
 * parfaitement et enseigne que « dort » est un nom. Ces tests sont le seul filet, et
 * comme ils tournent dans la barrière de déploiement, une erreur d'annotation ne peut
 * pas atteindre l'enfant.
 *
 * Chaque test rend la LISTE des phrases fautives plutôt que d'échouer sur la première :
 * on veut savoir lesquelles corriger, pas seulement qu'il y en a une.
 */

/** Les phrases qui ne respectent pas la règle, par leur clé. */
function fautives(regle: (phrase: PhraseAnnotee) => boolean): string[] {
  return CORPUS.filter((phrase) => !regle(phrase)).map((phrase) => phrase.key);
}

/** Nombre de suites consécutives de mots portant cette fonction : « Maëve et Léa »
 * compte pour un seul sujet, « Le chat » aussi. */
function nombreDeGroupes(
  phrase: PhraseAnnotee,
  fonction: 'sujet' | 'complement',
): number {
  let groupes = 0;
  let dedans = false;
  for (const mot of phrase.mots) {
    if (mot.fonction === fonction) {
      if (!dedans) groupes++;
      dedans = true;
    } else {
      dedans = false;
    }
  }
  return groupes;
}

function groupesNominaux(phrase: PhraseAnnotee): number[] {
  return [
    ...new Set(phrase.mots.flatMap((mot) => (mot.gn !== null ? [mot.gn] : []))),
  ];
}

describe('corpus de grammaire', () => {
  it('contient assez de phrases pour ne pas tourner en rond', () => {
    expect(CORPUS.length).toBeGreaterThanOrEqual(50);
  });

  it("n'a aucune clé de phrase en doublon", () => {
    const keys = CORPUS.map((phrase) => phrase.key);
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual(
      [],
    );
  });

  it('couvre les trois niveaux', () => {
    const parNiveau = Object.fromEntries(
      (['simple', 'moyen', 'complexe'] as const).map((niveau) => [
        niveau,
        CORPUS.filter((phrase) => phrase.difficulte === niveau).length >= 10,
      ]),
    );
    expect(parNiveau).toEqual({ simple: true, moyen: true, complexe: true });
  });

  it('a au moins une phrase par nature', () => {
    const sansPhrase = NATURES.filter(
      (nature) =>
        !CORPUS.some((phrase) =>
          phrase.mots.some((mot) => mot.nature === nature),
        ),
    );
    expect(sansPhrase).toEqual([]);
  });

  it('a exactement un verbe par phrase', () => {
    expect(
      fautives(
        (phrase) =>
          phrase.mots.filter((mot) => mot.nature === 'verbe').length === 1,
      ),
    ).toEqual([]);
  });

  it('a exactement un groupe sujet par phrase', () => {
    expect(
      fautives((phrase) => nombreDeGroupes(phrase, 'sujet') === 1),
    ).toEqual([]);
  });

  it('ne met le verbe ni dans un sujet, ni dans un complément, ni dans un groupe nominal', () => {
    expect(
      fautives((phrase) => {
        const verbe = phrase.mots.find((mot) => mot.nature === 'verbe');
        return (
          verbe !== undefined && verbe.fonction === null && verbe.gn === null
        );
      }),
    ).toEqual([]);
  });

  it('donne un nom à chaque groupe nominal', () => {
    expect(
      fautives((phrase) =>
        groupesNominaux(phrase).every((gn) =>
          phrase.mots.some(
            (mot) =>
              mot.gn === gn &&
              (mot.nature === 'nom_commun' || mot.nature === 'nom_propre'),
          ),
        ),
      ),
    ).toEqual([]);
  });

  it('ne met dans un groupe nominal que déterminant, nom et adjectif', () => {
    const permises = ['determinant', 'nom_commun', 'nom_propre', 'adjectif'];
    expect(
      fautives((phrase) =>
        phrase.mots
          .filter((mot) => mot.gn !== null)
          .every((mot) => permises.includes(mot.nature)),
      ),
    ).toEqual([]);
  });

  it('garde chaque groupe nominal en un seul morceau', () => {
    expect(
      fautives((phrase) =>
        groupesNominaux(phrase).every((gn) => {
          const indices = phrase.mots.flatMap((mot, index) =>
            mot.gn === gn ? [index] : [],
          );
          return indices.every(
            (index, rang) => rang === 0 || index === indices[rang - 1] + 1,
          );
        }),
      ),
    ).toEqual([]);
  });

  it('laisse le pronom sujet hors de tout groupe nominal : il en prend la place', () => {
    expect(
      fautives((phrase) =>
        phrase.mots
          .filter((mot) => mot.nature === 'pronom_sujet')
          .every((mot) => mot.gn === null && mot.fonction === 'sujet'),
      ),
    ).toEqual([]);
  });

  it('commence chaque phrase par une majuscule et la finit par une ponctuation', () => {
    expect(
      fautives((phrase) => {
        const texte = texteDe(phrase);
        return texte[0] === texte[0].toUpperCase() && /[.!?]$/.test(texte);
      }),
    ).toEqual([]);
  });

  it("n'introduit pas d'espace parasite après une élision", () => {
    expect(fautives((phrase) => !/[’'] /.test(texteDe(phrase)))).toEqual([]);
  });

  it('propose des phrases utilisables pour la question de complément', () => {
    const utilisables = CORPUS.filter(
      (phrase) => nombreDeGroupes(phrase, 'complement') === 1,
    );
    expect(utilisables.length).toBeGreaterThanOrEqual(10);
  });
});

// ─── Les classes ────────────────────────────────────────────────────────────

describe('classes de phrases', () => {
  it('porte des phrases jusqu’au CM2', () => {
    const parClasse = Object.fromEntries(
      NIVEAUX.map((n) => [n, CORPUS.filter((p) => p.niveau === n).length]),
    );
    // CP et CE1 forment le socle ; les grandes classes existent mais restent modestes,
    // elles se remplissent avec le skill `generateur-contenu`.
    expect(parClasse.ce1).toBeGreaterThanOrEqual(50);
    expect(parClasse.ce2).toBeGreaterThan(0);
    expect(parClasse.cm1).toBeGreaterThan(0);
    expect(parClasse.cm2).toBeGreaterThan(0);
  });

  it('n’ouvre que le socle à l’installation', () => {
    expect(DEFAULT_ACTIVE_CLASSES).toEqual(['cp', 'ce1']);
  });

  it('réserve le complément d’objet et l’attribut aux grandes classes', () => {
    // Ces deux fonctions ne s'apprennent pas au CE1 : aucune phrase du socle ne doit en
    // porter, sinon un enfant de CE1 croiserait la notion sans qu'elle ait été ouverte.
    const fautives = CORPUS.filter(
      (phrase) =>
        DEFAULT_ACTIVE_CLASSES.includes(phrase.niveau) &&
        phrase.mots.some((mot) => mot.fonction === 'attribut'),
    ).map((phrase) => phrase.key);
    expect(fautives).toEqual([]);
  });

  it('n’a aucun verbe attributif hors des phrases d’attribut', () => {
    // « être » suivi d'un adjectif sans annotation d'attribut laisserait l'adjectif
    // flotter sans fonction, et la question « touche l'attribut » serait sans réponse.
    const fautives = CORPUS.filter((phrase) => {
      const attributs = phrase.mots.filter((m) => m.fonction === 'attribut');
      if (attributs.length === 0) return false;
      // Un attribut suppose un verbe d'état, et il s'accorde donc jamais dans un gn.
      return attributs.some((mot) => mot.gn !== null);
    }).map((phrase) => phrase.key);
    expect(fautives).toEqual([]);
  });
});
