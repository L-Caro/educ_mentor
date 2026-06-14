import type { Direction, FruitKey, Position } from './snake.types';
import type { Sprites } from './sprites';

function drawSegment(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  position: Position,
  gridSize: number,
): void {
  ctx.drawImage(image, position[0] * gridSize, position[1] * gridSize, gridSize, gridSize);
}

export function drawMap(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  borderWidth: number,
  mapColor: string,
  borderColor: string,
): void {
  ctx.fillStyle = mapColor;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
}

export function drawSnake(
  ctx: CanvasRenderingContext2D,
  snake: Position[],
  gridSize: number,
  direction: Direction,
  sprites: Sprites,
): void {
  for (let index = 0; index < snake.length; index++) {
    const position = snake[index];

    if (index === 0) {
      drawSegment(ctx, sprites.head[direction], position, gridSize);
      continue;
    }

    if (index === snake.length - 1) {
      const previous = snake[index - 1];
      let tailDirection: Direction;
      if (snake[index][0] < previous[0]) tailDirection = 'east';
      else if (snake[index][0] > previous[0]) tailDirection = 'west';
      else if (snake[index][1] < previous[1]) tailDirection = 'south';
      else tailDirection = 'north';
      drawSegment(ctx, sprites.tail[tailDirection], position, gridSize);
      continue;
    }

    const previous = snake[index - 1];
    const next = snake[index + 1];
    const current = snake[index];

    if (previous[0] !== next[0] && previous[1] !== next[1]) {
      if (
        (previous[1] < current[1] && next[0] < current[0]) ||
        (next[1] < current[1] && previous[0] < current[0])
      ) {
        drawSegment(ctx, sprites.turnNo, position, gridSize);
      } else if (
        (previous[1] < current[1] && next[0] > current[0]) ||
        (next[1] < current[1] && previous[0] > current[0])
      ) {
        drawSegment(ctx, sprites.turnNe, position, gridSize);
      } else if (
        (previous[1] > current[1] && next[0] > current[0]) ||
        (next[1] > current[1] && previous[0] > current[0])
      ) {
        drawSegment(ctx, sprites.turnSe, position, gridSize);
      } else {
        drawSegment(ctx, sprites.turnSo, position, gridSize);
      }
    } else if (previous[0] === next[0]) {
      drawSegment(ctx, sprites.bodyV, position, gridSize);
    } else {
      drawSegment(ctx, sprites.bodyH, position, gridSize);
    }
  }
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  fruit: Position,
  gridSize: number,
  fruitKey: FruitKey,
  sprites: Sprites,
): void {
  drawSegment(ctx, sprites.fruits[fruitKey], fruit, gridSize);
}

export function drawScore(
  ctx: CanvasRenderingContext2D,
  score: number,
  gridSize: number,
  scoreColor: string,
): void {
  ctx.fillStyle = scoreColor;
  ctx.font = `${gridSize}px sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(String(score), gridSize / 3, gridSize / 3);
}
