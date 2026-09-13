import type { Forme } from './tourelle';
import turtleClassic from './formes/turtle_classic.json';
import pyramid from './formes/pyramid.json';
import fortress from './formes/fortress.json';
import spider from './formes/spider.json';
import butterfly from './formes/butterfly.json';
import bridge from './formes/bridge.json';
import cat from './formes/cat.json';
import moonGate from './formes/moon_gate.json';
import terrace from './formes/terrace.json';
import windmill from './formes/windmill.json';

// Noms affiches en francais ; l'id (celui du fichier d'origine, voir ATTRIBUTIONS.md)
// reste la cle stable utilisee dans le reglage de pre-jeu.
const LIBELLES: Record<string, string> = {
  turtle_classic: 'Tortue',
  pyramid: 'Pyramide',
  fortress: 'Forteresse',
  spider: 'Araignée',
  butterfly: 'Papillon',
  bridge: 'Pont',
  cat: 'Chat',
  moon_gate: 'Porte de lune',
  terrace: 'Terrasse',
  windmill: 'Moulin',
};

const BRUTES: Forme[] = [
  turtleClassic,
  pyramid,
  fortress,
  spider,
  butterfly,
  bridge,
  cat,
  moonGate,
  terrace,
  windmill,
];

export const FORMES: Forme[] = BRUTES.map((forme) => ({
  ...forme,
  name: LIBELLES[forme.id] ?? forme.name,
}));

export const FORME_ID_PAR_DEFAUT = 'turtle_classic';

export function trouverForme(id: string | undefined): Forme {
  return (
    FORMES.find((forme) => forme.id === id) ??
    FORMES.find((forme) => forme.id === FORME_ID_PAR_DEFAUT)!
  );
}
