import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PRONOMS,
  TENSES,
  TENSE_KEYS,
  conditionnelPresent,
  conjugaisonsCompletes,
  passeSimple,
  radicalDuFutur,
  type Formes,
  type VerbData,
} from './conjugaison.temps';
import { NIVEAUX } from '../../common/niveau';

/**
 * Quatre temps sur sept sont CALCULÉS, pour cinquante verbes et neuf pronoms : environ
 * 1 800 formes qu'aucun humain ne relira. Une règle de dérivation fausse produirait des
 * conjugaisons fausses en masse, sans rien casser d'autre.
 *
 * D'où deux niveaux de vérification :
 *   — les règles, isolées, sur des cas choisis pour leur difficulté ;
 *   — les 1 800 formes réelles, confrontées à des tableaux de référence recopiés à la
 *     main depuis un Bescherelle pour dix verbes couvrant les trois groupes, les deux
 *     auxiliaires et les quatre familles de passé simple.
 */

const VERBES: Record<string, VerbData> = JSON.parse(
  readFileSync(join(__dirname, 'data/conjugaisons.json'), 'utf-8'),
) as Record<string, VerbData>;

const AUXILIAIRES = {
  avoir: VERBES['avoir'],
  être: VERBES['être'],
};

const complet = (infinitif: string) =>
  conjugaisonsCompletes(VERBES[infinitif], AUXILIAIRES);

describe('radical du futur', () => {
  it('se lit sur la forme « je », y compris pour les irréguliers', () => {
    expect(radicalDuFutur('chanterai')).toBe('chanter');
    expect(radicalDuFutur('irai')).toBe('ir');
    expect(radicalDuFutur('serai')).toBe('ser');
    expect(radicalDuFutur('ferai')).toBe('fer');
    expect(radicalDuFutur('pourrai')).toBe('pourr');
    expect(radicalDuFutur('viendrai')).toBe('viendr');
  });

  it('refuse bruyamment une forme de futur inattendue', () => {
    // Silencieusement tronquer produirait un conditionnel faux pour tout le verbe.
    expect(() => radicalDuFutur('chante')).toThrow(/futur inattendue/);
  });
});

describe('conditionnel présent', () => {
  it('est le radical du futur plus les terminaisons de l’imparfait', () => {
    const futur = VERBES['chanter'].conjugaisons['futur'];
    expect(conditionnelPresent(futur)).toEqual({
      je: 'chanterais',
      tu: 'chanterais',
      il: 'chanterait',
      elle: 'chanterait',
      on: 'chanterait',
      nous: 'chanterions',
      vous: 'chanteriez',
      ils: 'chanteraient',
      elles: 'chanteraient',
    });
  });

  it('tient sur les irréguliers, là où une règle naïve casserait', () => {
    expect(complet('aller')['conditionnel présent'].je).toBe('irais');
    expect(complet('être')['conditionnel présent'].nous).toBe('serions');
    expect(complet('faire')['conditionnel présent'].ils).toBe('feraient');
    expect(complet('pouvoir')['conditionnel présent'].je).toBe('pourrais');
    expect(complet('venir')['conditionnel présent'].vous).toBe('viendriez');
  });
});

describe('passé simple', () => {
  it('assemble un radical et une famille de terminaisons', () => {
    expect(passeSimple('chant', 'a').ils).toBe('chantèrent');
    expect(passeSimple('fin', 'i').il).toBe('finit');
    expect(passeSimple('p', 'u').nous).toBe('pûmes');
    expect(passeSimple('v', 'in').ils).toBe('vinrent');
  });

  it('donne les formes attendues sur les verbes difficiles', () => {
    expect(complet('venir')['passé simple'].je).toBe('vins');
    expect(complet('venir')['passé simple'].nous).toBe('vînmes');
    expect(complet('être')['passé simple'].il).toBe('fut');
    expect(complet('avoir')['passé simple'].ils).toBe('eurent');
    expect(complet('faire')['passé simple'].vous).toBe('fîtes');
    expect(complet('prendre')['passé simple'].elle).toBe('prit');
    expect(complet('écrire')['passé simple'].je).toBe('écrivis');
  });
});

describe('temps composés', () => {
  it('accorde le participe avec le sujet quand l’auxiliaire est être', () => {
    const formes = complet('aller')['passé composé'];
    expect(formes.je).toBe('suis allé');
    expect(formes.elle).toBe('est allée');
    expect(formes.ils).toBe('sont allés');
    expect(formes.elles).toBe('sont allées');
    expect(formes.nous).toBe('sommes allés');
  });

  it('laisse le participe invariable quand l’auxiliaire est avoir', () => {
    const formes = complet('chanter')['passé composé'];
    expect(formes.je).toBe('ai chanté');
    expect(formes.elles).toBe('ont chanté');
  });

  it('construit le plus-que-parfait sur l’auxiliaire à l’imparfait', () => {
    expect(complet('chanter')['plus-que-parfait'].je).toBe('avais chanté');
    expect(complet('venir')['plus-que-parfait'].elle).toBe('était venue');
  });

  it('stocke la forme SANS le pronom, comme les temps simples', () => {
    // `applyElision` côté front écrira « j'ai chanté » ; stocker le pronom ici le
    // dupliquerait et casserait l'élision. Les temps simples suivent déjà cette règle.
    for (const infinitif of ['chanter', 'aller', 'avoir']) {
      for (const temps of ['passé composé', 'plus-que-parfait'] as const) {
        expect(complet(infinitif)[temps].je).not.toMatch(/^(je|j')/);
      }
    }
  });

  it('ne fabrique pas un temps composé sans espace entre auxiliaire et participe', () => {
    for (const infinitif of Object.keys(VERBES)) {
      for (const temps of ['passé composé', 'plus-que-parfait'] as const) {
        for (const pronom of PRONOMS) {
          expect(complet(infinitif)[temps][pronom]).toContain(' ');
        }
      }
    }
  });
});

// ─── Tableaux de référence ──────────────────────────────────────────────────
//
// Recopiés à la main. C'est le seul endroit du module où une forme est écrite plutôt que
// calculée, et c'est exprès : un test qui dériverait sa propre attente ne vérifierait rien.

const REFERENCE: Record<string, Partial<Record<string, Partial<Formes>>>> = {
  chanter: {
    'passé composé': { je: 'ai chanté', nous: 'avons chanté' },
    'plus-que-parfait': { tu: 'avais chanté' },
    'passé simple': { je: 'chantai', ils: 'chantèrent' },
    'conditionnel présent': { je: 'chanterais', nous: 'chanterions' },
  },
  finir: {
    'passé composé': { il: 'a fini' },
    'passé simple': { je: 'finis', nous: 'finîmes', ils: 'finirent' },
    'conditionnel présent': { vous: 'finiriez' },
  },
  aller: {
    'passé composé': { je: 'suis allé', elles: 'sont allées' },
    'plus-que-parfait': { on: 'était allé' },
    'passé simple': { il: 'alla', ils: 'allèrent' },
    'conditionnel présent': { je: 'irais', ils: 'iraient' },
  },
  être: {
    'passé composé': { je: 'ai été' },
    'passé simple': { je: 'fus', il: 'fut', nous: 'fûmes', ils: 'furent' },
    'conditionnel présent': { je: 'serais', vous: 'seriez' },
  },
  avoir: {
    'passé composé': { je: 'ai eu' },
    'passé simple': { il: 'eut', ils: 'eurent' },
    'conditionnel présent': { nous: 'aurions' },
  },
  venir: {
    'passé composé': { elle: 'est venue', ils: 'sont venus' },
    'passé simple': { je: 'vins', nous: 'vînmes', ils: 'vinrent' },
    'conditionnel présent': { je: 'viendrais' },
  },
  faire: {
    'passé composé': { nous: 'avons fait' },
    'passé simple': { je: 'fis', vous: 'fîtes', ils: 'firent' },
    'conditionnel présent': { je: 'ferais' },
  },
  prendre: {
    'passé composé': { tu: 'as pris' },
    'passé simple': { il: 'prit', nous: 'prîmes' },
    'conditionnel présent': { elles: 'prendraient' },
  },
  pouvoir: {
    'passé composé': { je: 'ai pu' },
    'passé simple': { je: 'pus', ils: 'purent' },
    'conditionnel présent': { je: 'pourrais' },
  },
  écrire: {
    'passé composé': { je: 'ai écrit' },
    'passé simple': { il: 'écrivit', ils: 'écrivirent' },
    'conditionnel présent': { nous: 'écririons' },
  },
};

describe('conformité aux tableaux de référence', () => {
  for (const [infinitif, temps] of Object.entries(REFERENCE)) {
    it(`conjugue « ${infinitif} » comme le Bescherelle`, () => {
      const calcule = complet(infinitif);
      for (const [tense, formes] of Object.entries(temps)) {
        for (const [pronom, attendu] of Object.entries(formes!)) {
          expect({
            tense,
            pronom,
            forme: calcule[tense as never][pronom as never],
          }).toEqual({ tense, pronom, forme: attendu });
        }
      }
    });
  }
});

describe('couverture du corpus', () => {
  it('produit les sept temps pour les cinquante verbes, sans trou', () => {
    const trous: string[] = [];
    for (const infinitif of Object.keys(VERBES)) {
      const formes = complet(infinitif);
      for (const tense of TENSE_KEYS) {
        for (const pronom of PRONOMS) {
          const forme = formes[tense]?.[pronom];
          if (!forme || !forme.trim())
            trous.push(`${infinitif}/${tense}/${pronom}`);
        }
      }
    }
    expect(trous).toEqual([]);
  });

  it('ne laisse aucun verbe sans participe, auxiliaire ni passé simple', () => {
    const incomplets = Object.entries(VERBES)
      .filter(
        ([, v]) =>
          !v.participe ||
          !['avoir', 'être'].includes(v.auxiliaire) ||
          !v.passeSimple?.radical ||
          !v.passeSimple?.famille,
      )
      .map(([k]) => k);
    expect(incomplets).toEqual([]);
  });

  it('étage les temps du CP au CM2, sans en oublier', () => {
    expect(TENSES.map((t) => t.key)).toHaveLength(7);
    const niveaux = [...new Set(TENSES.map((t) => t.niveau))];
    for (const niveau of niveaux) expect(NIVEAUX).toContain(niveau);
    // Le programme monte : aucun temps « avancé » avant un temps de base.
    const rangs = TENSES.map((t) => NIVEAUX.indexOf(t.niveau));
    expect(rangs).toEqual([...rangs].sort((a, b) => a - b));
  });
});

// ─── Échouer bruyamment ─────────────────────────────────────────────────────

describe('données incomplètes', () => {
  /**
   * Ces quatre tests couvrent un incident réel : un verbe sans auxiliaire a tué le
   * backend au démarrage par un « Cannot read properties of undefined (reading
   * 'conjugaisons') » au fond d'un `.map`, sans dire ni quel verbe ni quel champ.
   *
   * Planter au démarrage reste le bon comportement — une conjugaison fausse ne doit
   * jamais atteindre l'enfant — mais le message doit nommer le coupable.
   */

  const AUX = { avoir: VERBES['avoir'], être: VERBES['être'] };
  const sain = () => JSON.parse(JSON.stringify(VERBES['chanter'])) as VerbData;

  it('nomme le verbe et l’auxiliaire quand l’auxiliaire ne résout pas', () => {
    const casse = { ...sain(), auxiliaire: 'avoirr' as never };
    expect(() => conjugaisonsCompletes(casse, AUX, 'chanter')).toThrow(
      /chanter.*avoirr/s,
    );
  });

  it('nomme le verbe quand le participe manque', () => {
    const casse = { ...sain(), participe: '' };
    expect(() => conjugaisonsCompletes(casse, AUX, 'chanter')).toThrow(
      /chanter.*participe/s,
    );
  });

  it('nomme le verbe quand le passé simple est incomplet', () => {
    const casse = {
      ...sain(),
      passeSimple: { radical: '', famille: 'a' as const },
    };
    expect(() => conjugaisonsCompletes(casse, AUX, 'chanter')).toThrow(
      /chanter.*passé simple/s,
    );
  });

  it('nomme le temps simple manquant, dont les autres se dérivent', () => {
    const casse = sain();
    delete (casse.conjugaisons as Record<string, unknown>)['futur'];
    expect(() => conjugaisonsCompletes(casse, AUX, 'chanter')).toThrow(
      /chanter.*futur/s,
    );
  });

  it('accepte le corpus réel, les cinquante verbes', () => {
    for (const [infinitif, verbe] of Object.entries(VERBES)) {
      expect(() => conjugaisonsCompletes(verbe, AUX, infinitif)).not.toThrow();
    }
  });
});
