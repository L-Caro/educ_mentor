import appleUrl from './assets/fruits/apple.png';
import abricotUrl from './assets/fruits/abricot.png';
import fraiseUrl from './assets/fruits/fraise.png';
import poireUrl from './assets/fruits/poire.png';
import headRightUrl from './assets/snake/head_right.png';
import headUpUrl from './assets/snake/head_up.png';
import headDownUrl from './assets/snake/head_down.png';
import headLeftUrl from './assets/snake/head_left.png';
import tailRightUrl from './assets/snake/tail_right.png';
import tailUpUrl from './assets/snake/tail_up.png';
import tailLeftUrl from './assets/snake/tail_left.png';
import tailDownUrl from './assets/snake/tail_down.png';
import bodyHorizontalUrl from './assets/snake/body_horizontal.png';
import bodyVerticalUrl from './assets/snake/body_vertical.png';
import turnNoUrl from './assets/snake/turn_no.png';
import turnSoUrl from './assets/snake/turn_so.png';
import turnSeUrl from './assets/snake/turn_se.png';
import turnNeUrl from './assets/snake/turn_ne.png';
import type { Direction, FruitKey } from './snake.types';

export interface Sprites {
  fruits: Record<FruitKey, HTMLImageElement>;
  head: Record<Direction, HTMLImageElement>;
  /** Clé = direction du segment précédent (body) par rapport à la queue. */
  tail: Record<Direction, HTMLImageElement>;
  bodyH: HTMLImageElement;
  bodyV: HTMLImageElement;
  turnNo: HTMLImageElement;
  turnSo: HTMLImageElement;
  turnSe: HTMLImageElement;
  turnNe: HTMLImageElement;
}

function img(src: string): HTMLImageElement {
  const element = new Image();
  element.src = src;
  return element;
}

/** Crée et retourne tous les sprites. Appeler une seule fois (useRef). */
export function loadSprites(): Sprites {
  return {
    fruits: {
      apple: img(appleUrl),
      abricot: img(abricotUrl),
      fraise: img(fraiseUrl),
      poire: img(poireUrl),
    },
    head: {
      east: img(headRightUrl),
      west: img(headLeftUrl),
      north: img(headUpUrl),
      south: img(headDownUrl),
    },
    // Le sprite de queue "north" signifie que le corps continue vers le bas (tail_d).
    tail: {
      north: img(tailDownUrl),
      south: img(tailUpUrl),
      west: img(tailRightUrl),
      east: img(tailLeftUrl),
    },
    bodyH: img(bodyHorizontalUrl),
    bodyV: img(bodyVerticalUrl),
    turnNo: img(turnNoUrl),
    turnSo: img(turnSoUrl),
    turnSe: img(turnSeUrl),
    turnNe: img(turnNeUrl),
  };
}
