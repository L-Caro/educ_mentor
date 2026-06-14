import type { Direction, Position } from './snake.types';

export interface GridDimensions {
  gridSize: number;
  borderWidth: number;
}

export interface MoveResult {
  snake: Position[];
  fruit: Position;
  score: number;
  gameOver: boolean;
}

export function getGridDimensions(windowWidth: number): GridDimensions {
  if (windowWidth < 576) return { borderWidth: 50, gridSize: 25 };
  if (windowWidth < 768) return { borderWidth: 60, gridSize: 30 };
  if (windowWidth < 992) return { borderWidth: 70, gridSize: 35 };
  if (windowWidth < 1200) return { borderWidth: 90, gridSize: 45 };
  return { borderWidth: 140, gridSize: 70 };
}

function isWall(snake: Position[], canvasWidth: number, canvasHeight: number, gridSize: number): boolean {
  const [headX, headY] = snake[0];
  const maxX = canvasWidth / gridSize;
  const maxY = canvasHeight / gridSize;
  return headX > maxX - 2 || headX < 1 || headY > maxY - 2 || headY < 1;
}

function isSelfCollision(snake: Position[]): boolean {
  const [headX, headY] = snake[0];
  return snake.slice(1).some(([segX, segY]) => segX === headX && segY === headY);
}

export function generateFruit(
  snake: Position[],
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
  borderWidth: number,
): Position {
  const borderGridElem = borderWidth / gridSize;
  const maxX = canvasWidth / gridSize - 2 * borderGridElem;
  const maxY = canvasHeight / gridSize - 2 * borderGridElem;

  for (let attempt = 0; attempt < 200; attempt++) {
    const candidateX = Math.floor(Math.random() * maxX + borderGridElem);
    const candidateY = Math.floor(Math.random() * maxY + borderGridElem);
    if (!snake.some(([segX, segY]) => segX === candidateX && segY === candidateY)) {
      return [candidateX, candidateY];
    }
  }
  return [borderGridElem, borderGridElem];
}

export function moveSnake(
  snake: Position[],
  direction: Direction,
  fruit: Position,
  score: number,
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number,
  borderWidth: number,
): MoveResult {
  const [headX, headY] = snake[0];

  const newHead: Position =
    direction === 'east' ? [headX + 1, headY]
    : direction === 'west' ? [headX - 1, headY]
    : direction === 'north' ? [headX, headY - 1]
    : [headX, headY + 1];

  const newSnake: Position[] = [newHead, ...snake];
  const ateFruit = newHead[0] === fruit[0] && newHead[1] === fruit[1];

  if (!ateFruit) newSnake.pop();

  const gameOver =
    isWall(newSnake, canvasWidth, canvasHeight, gridSize) ||
    isSelfCollision(newSnake);

  return {
    snake: newSnake,
    fruit: ateFruit ? generateFruit(newSnake, canvasWidth, canvasHeight, gridSize, borderWidth) : fruit,
    score: ateFruit ? score + 1 : score,
    gameOver,
  };
}
