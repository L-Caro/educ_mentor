/**
 * Ranger des mots dans l'ordre alphabetique : le tirage et le classement.
 *
 * ── Le tri est celui du FRANCAIS, pas celui d'Unicode ────────────────────────────────
 *
 * `'élan' < 'zèbre'` vaut FAUX en comparaison brute : `é` vaut U+00E9, donc apres `z`.
 * Un module qui rangerait ainsi enseignerait l'inverse de ce qu'il pretend, sans jamais
 * tomber en panne. Tout passe donc par `localeCompare(..., 'fr')`, y compris le corpus,
 * qui est deja trie a la generation.
 *
 * ── Le reglage est un PLAFOND, pas une consigne ──────────────────────────────────────
 *
 * « Jusqu'a la cinquieme lettre » ne veut pas dire que tous les mots se ressemblent sur
 * quatre lettres. Il veut dire qu'AUCUNE paire n'en partage davantage, et qu'au moins une
 * y arrive. Une liste peut donc melanger des mots qui se separent des la premiere lettre
 * et deux qui ne se separent qu'a la cinquieme : c'est ce que donne un vrai dictionnaire,
 * et c'est plus interessant a ranger qu'une colonne de mots tous pareils.
 *
 * Cette garantie n'est pas verifiee apres coup : elle est tenue PAR CONSTRUCTION, par la
 * facon dont les mots sont tires (voir `tirerMots`).
 */

export type TypeAlphabet = 'ranger' | 'intrus' | 'intercaler';

export interface QuestionAlphabet {
  item_key: string;
  type: TypeAlphabet;
  /** Ce qui est suivi en progression : la profondeur de comparaison, car c'est elle qui
   * fait la difficulte, et non les mots eux-memes. */
  skill_key: string;
  consigne: string;
  /** Les mots presentes, dans l'ordre ou ils s'affichent. */
  mots: string[];
  /** La reponse attendue, selon le type : les mots ranges, le mot mal place, ou le rang
   * ou intercaler. */
  reponse: string[];
  /** `intercaler` seulement : le mot a placer. */
  aPlacer: string | null;
  /** Le plafond de lettres communes demande : sert a expliquer l'erreur. */
  communes: number;
}

export function comparer(a: string, b: string): number {
  return a.localeCompare(b, 'fr');
}

export function ranger(mots: string[]): string[] {
  return [...mots].sort(comparer);
}

/**
 * Le mot sans ses accents ni ses ligatures.
 *
 * C'est l'alphabet qu'une enfant de sept ans connait : pour elle, `é` est un `e`. C'est
 * aussi ce que fait `localeCompare(..., 'fr')` en premier lieu, avant de departager les
 * accents. Tout le tirage raisonne sur cette forme, et ne pose jamais de question dont la
 * reponse dependrait d'un accent : « cote » devant « côte » ne se decide pas avec
 * l'alphabet.
 */
export function nu(mot: string): string {
  return mot
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae');
}

/** Combien de lettres les deux mots partagent avant de se separer. */
export function communesEntre(a: string, b: string): number {
  const x = nu(a);
  const y = nu(b);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return i;
}

/**
 * Le plus grand nombre de lettres communes entre DEUX mots de la liste.
 *
 * Sur une liste rangee il suffit de comparer les voisins : deux mots eloignes dans
 * l'ordre partagent toujours moins que chacune des paires qui les separent.
 */
export function profondeur(mots: string[]): number {
  const ordonnes = ranger(mots);
  let maximum = 0;
  for (let i = 1; i < ordonnes.length; i++) {
    maximum = Math.max(maximum, communesEntre(ordonnes[i - 1], ordonnes[i]));
  }
  return maximum;
}

export type Rand = (min: number, max: number) => number;

function melanger<T>(items: T[], rand: Rand): T[] {
  const copie = [...items];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

/**
 * Les mots ranges par prefixe puis par lettre suivante, a une profondeur donnee.
 *
 * `brancher(mots, 3)` rend, pour chaque debut de trois lettres, les mots groupes par leur
 * quatrieme. Deux mots pris dans DEUX branches differentes du meme prefixe partagent
 * exactement ces trois lettres, ni plus ni moins : c'est la brique avec laquelle on
 * compose une liste dont on connait le plafond sans avoir a le verifier.
 *
 * Les cles sont des formes nues ; les mots, eux, gardent leurs accents.
 */
export type Branches = Map<string, Map<string, string[]>>;

export function brancher(mots: string[], profondeurVoulue: number): Branches {
  const branches: Branches = new Map();
  for (const mot of mots) {
    const forme = nu(mot);
    if (forme.length <= profondeurVoulue) continue;
    const prefixe = forme.slice(0, profondeurVoulue);
    const lettre = forme[profondeurVoulue];
    let parLettre = branches.get(prefixe);
    if (!parLettre) {
      parLettre = new Map();
      branches.set(prefixe, parLettre);
    }
    const lot = parLettre.get(lettre);
    if (lot) lot.push(mot);
    else parLettre.set(lettre, [mot]);
  }
  return branches;
}

/**
 * Tire `combien` mots dont aucune paire ne partage plus de `communes` lettres, et dont au
 * moins une les partage toutes.
 *
 * ── Comment la garantie tient ────────────────────────────────────────────────────────
 *
 * On part d'une ANCRE, et chaque mot ajoute est pris dans une branche qui quitte l'ancre a
 * une profondeur `d` choisie au hasard entre zero et le plafond. Deux mots qui quittent
 * l'ancre au meme endroit le font par des lettres differentes, jamais deux fois la meme :
 * ils partagent donc exactement `d` lettres. Deux mots qui la quittent a des endroits
 * differents se separent au premier des deux. Dans tous les cas, jamais plus que le
 * plafond, et le jumeau de l'ancre l'atteint.
 *
 * C'est aussi ce qui donne sa VARIETE a la liste : les profondeurs sont tirees, donc on
 * obtient des mots qui se separent des la premiere lettre a cote de deux qui ne se
 * separent qu'a la derniere, au lieu d'une colonne de mots tous semblables.
 */
export function tirerMots(
  branchesPar: (profondeurVoulue: number) => Branches,
  communes: number,
  combien: number,
  rand: Rand,
): string[] | null {
  // Un prefixe assez fourni pour porter DEUX mots qui se ressemblent jusqu'au plafond :
  // sans lui, le reglage ne serait jamais atteint et ne servirait a rien.
  const porteurs = [...branchesPar(communes)].filter(
    ([, lettres]) => lettres.size >= 2,
  );
  if (porteurs.length === 0) return null;

  const [prefixe, lettres] = porteurs[rand(0, porteurs.length - 1)];
  const jumelles = melanger([...lettres.keys()], rand).slice(0, 2);
  const choisis = jumelles.map((lettre) => {
    const lot = lettres.get(lettre) ?? [];
    return lot[rand(0, lot.length - 1)];
  });
  const ancre = nu(choisis[0]);

  // Ce qui est deja pris, point de separation par point de separation. L'ancre occupe sa
  // propre lettre a chaque profondeur : sans cela, un mot ajoute pourrait retomber dans
  // sa branche et lui ressembler plus que le plafond ne l'autorise.
  const prises = new Map<string, Set<string>>();
  for (let d = 0; d <= communes; d++) {
    prises.set(ancre.slice(0, d), new Set([ancre[d]]));
  }
  prises.get(prefixe)?.add(jumelles[1]);

  const profondeurs = Array.from({ length: communes + 1 }, (_, d) => d);
  while (choisis.length < combien) {
    const ajoute = melanger(profondeurs, rand).some((d) => {
      const p = ancre.slice(0, d);
      const branches = branchesPar(d).get(p);
      const deja = prises.get(p);
      if (!branches || !deja) return false;
      const libres = [...branches.keys()].filter((lettre) => !deja.has(lettre));
      if (libres.length === 0) return false;

      const lettre = libres[rand(0, libres.length - 1)];
      deja.add(lettre);
      const lot = branches.get(lettre) ?? [];
      choisis.push(lot[rand(0, lot.length - 1)]);
      return true;
    });
    // Le vivier ne suffit pas pour ce plafond et ce nombre de mots. On ne rend PAS une
    // liste plus courte en silence : le reglage demandait autre chose, et l'ecran sait
    // dire qu'il n'y a rien a jouer.
    if (!ajoute) return null;
  }

  return choisis;
}

export function genererQuestion(
  type: TypeAlphabet,
  tires: string[],
  communes: number,
  rand: Rand,
): QuestionAlphabet | null {
  const ordonnes = ranger(tires);
  const base = {
    skill_key: `alphabet_${String(communes)}`,
    communes,
  };

  if (type === 'ranger') {
    // Melanges, et JAMAIS deja dans l'ordre : une question dont la reponse est « ne
    // touche a rien » se resout sans rien comprendre, et laisse croire qu'on a compris.
    let melanges = melanger(ordonnes, rand);
    for (let essai = 0; essai < 10 && memeOrdre(melanges, ordonnes); essai++) {
      melanges = melanger(ordonnes, rand);
    }
    if (memeOrdre(melanges, ordonnes)) return null;

    return {
      ...base,
      item_key: `ranger_${ordonnes.join('-')}`,
      type,
      consigne: 'Range ces mots dans l’ordre alphabétique.',
      mots: melanges,
      reponse: ordonnes,
      aPlacer: null,
    };
  }

  if (type === 'intrus') {
    // Une liste rangee ou UN mot a change de place. On echange deux voisins : un mot
    // deplace au loin se repere a l'oeil sans comparer quoi que ce soit.
    const rang = rand(0, ordonnes.length - 2);
    const liste = [...ordonnes];
    [liste[rang], liste[rang + 1]] = [liste[rang + 1], liste[rang]];
    return {
      ...base,
      item_key: `intrus_${liste.join('-')}`,
      type,
      consigne:
        'Ces mots sont presque rangés. Trouve celui qui n’est pas à sa place.',
      mots: liste,
      // Les DEUX mots echanges conviennent : designer l'un ou l'autre montre qu'on a vu
      // l'inversion, et rien ne dit lequel des deux a bouge.
      reponse: [liste[rang], liste[rang + 1]],
      aPlacer: null,
    };
  }

  // `intercaler` : la liste rangee, moins un mot, qu'il faut remettre a sa place.
  const rang = rand(0, ordonnes.length - 1);
  const aPlacer = ordonnes[rang];
  const restants = ordonnes.filter((_, i) => i !== rang);
  return {
    ...base,
    item_key: `intercaler_${aPlacer}_${restants.join('-')}`,
    type: 'intercaler',
    consigne: `Où se range « ${aPlacer} » ?`,
    mots: restants,
    // Le rang attendu, en texte : le rendu compare des chaines, pas des nombres.
    reponse: [String(rang)],
    aPlacer,
  };
}

function memeOrdre(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((mot, i) => mot === b[i]);
}
