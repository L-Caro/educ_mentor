import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import { getGridDimensions, moveSnake } from './logic';
import { drawMap, drawSnake, drawFruit, drawScore } from './draw';
import { loadSprites } from './sprites';
import { THEMES, DEFAULT_THEME, DEFAULT_FRUIT, DEFAULT_DIFFICULTY } from './snake.types';
import type { Direction, FruitKey, Position, ThemeKey } from './snake.types';
import './snake.scss';

const MODULE_ID = 'snake';

const SPEED_BY_DIFFICULTY: Record<string, number> = {
  easy: 700,
  medium: 850,
  hard: 930,
};

const OPPOSITE: Record<Direction, Direction> = {
  east: 'west', west: 'east', north: 'south', south: 'north',
};

const DIRECTION_KEYS: Partial<Record<string, Direction>> = {
  ArrowRight: 'east',
  ArrowLeft: 'west',
  ArrowUp: 'north',
  ArrowDown: 'south',
};

const LEFT_TURN: Record<Direction, Direction> = {
  east: 'north', north: 'west', west: 'south', south: 'east',
};

const RIGHT_TURN: Record<Direction, Direction> = {
  east: 'south', south: 'west', west: 'north', north: 'east',
};

export default function SnakeGame() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const difficulty = (setup['difficulty'] as string) ?? DEFAULT_DIFFICULTY;
  const themeKey = (setup['theme'] as ThemeKey) ?? DEFAULT_THEME;
  const fruitKey = (setup['fruit'] as FruitKey) ?? DEFAULT_FRUIT;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const spritesRef = useRef(loadSprites());

  const gameState = useRef({
    snake: [[9, 9], [8, 9], [7, 9]] as Position[],
    fruit: [5, 5] as Position,
    direction: 'east' as Direction,
    directionQueue: [] as Direction[],
    score: 0,
    active: false,
  });

  // Boucle principale — démarre dès que le container a des dimensions réelles.
  // On utilise un ResizeObserver car sur mobile (iOS Safari), clientWidth/Height
  // valent 0 au moment du mount React : sans ça, isWall() détecte une collision
  // immédiate et le jeu se termine avant même d'avoir commencé.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let stopGame: (() => void) | undefined;

    function startGame() {
      const w = container!.clientWidth;
      const h = container!.clientHeight;
      if (w === 0 || h === 0) return;

      observer.disconnect();

      const { gridSize, borderWidth } = getGridDimensions(w);
      canvas!.width = Math.floor((w - 2) / gridSize) * gridSize;
      canvas!.height = Math.floor((h - 2) / gridSize) * gridSize;

      const ctx = canvas!.getContext('2d')!;
      const theme = THEMES[themeKey];
      const sprites = spritesRef.current;
      const gameSpeed = 1000 - (SPEED_BY_DIFFICULTY[difficulty] ?? 850);
      const state = gameState.current;

      const cols = Math.floor(canvas!.width / gridSize);
      const rows = Math.floor(canvas!.height / gridSize);
      const startX = Math.max(4, Math.floor(cols / 2));
      const startY = Math.max(2, Math.floor(rows / 2));
      state.snake = [[startX, startY], [startX - 1, startY], [startX - 2, startY]];
      state.fruit = [Math.max(2, Math.floor(startX / 2)), startY];
      state.direction = 'east';
      state.directionQueue = [];
      state.score = 0;
      state.active = true;

      function render() {
        drawMap(ctx, canvas!.width, canvas!.height, borderWidth, theme.mapColor, theme.borderColor);
        drawSnake(ctx, state.snake, gridSize, state.direction, sprites);
        drawFruit(ctx, state.fruit, gridSize, fruitKey, sprites);
        drawScore(ctx, state.score, gridSize, theme.scoreColor);
      }

      let lastTickTime = 0;

      function tick(timestamp: number) {
        if (!state.active) return;

        rafRef.current = requestAnimationFrame(tick);

        // Premier frame : initialise le référentiel temps sans avancer la logique.
        if (lastTickTime === 0) {
          lastTickTime = timestamp;
          return;
        }

        if (timestamp - lastTickTime < gameSpeed) return;
        // += gameSpeed plutôt que = timestamp : compense le retard d'une frame au lieu de le cumuler.
        lastTickTime += gameSpeed;

        if (state.directionQueue.length > 0) {
          state.direction = state.directionQueue.shift()!;
        }

        const result = moveSnake(
          state.snake,
          state.direction,
          state.fruit,
          state.score,
          canvas!.width,
          canvas!.height,
          gridSize,
          borderWidth,
        );

        if (result.gameOver) {
          state.active = false;
          dispatch(setGameResult({ correctCount: state.score, scoreLabel: 'points', results: [] }));
          navigate(`/module/${MODULE_ID}/result`);
          return;
        }

        state.snake = result.snake;
        state.fruit = result.fruit;
        state.score = result.score;

        render();
      }

      render();
      rafRef.current = requestAnimationFrame(tick);

      stopGame = () => {
        state.active = false;
        cancelAnimationFrame(rafRef.current);
      };
    }

    const observer = new ResizeObserver(startGame);
    observer.observe(container);
    startGame();

    return () => {
      observer.disconnect();
      stopGame?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redimensionnement de la fenêtre
  useEffect(() => {
    function handleResize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      const { gridSize } = getGridDimensions(container.clientWidth);
      canvas.width = Math.floor((container.clientWidth - 2) / gridSize) * gridSize;
      canvas.height = Math.floor((container.clientHeight - 2) / gridSize) * gridSize;
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Contrôles clavier
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const newDirection = DIRECTION_KEYS[event.key];
      if (!newDirection) return;
      const state = gameState.current;
      const lastQueued = state.directionQueue.at(-1) ?? state.direction;
      if (newDirection === OPPOSITE[lastQueued]) return;
      state.directionQueue.push(newDirection);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Contrôles tactiles : touche gauche = virage gauche, touche droite = virage droite
  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      const touchX = event.touches[0].clientX;
      const state = gameState.current;
      const isLeftSide = touchX < window.innerWidth / 2;
      state.direction = isLeftSide ? LEFT_TURN[state.direction] : RIGHT_TURN[state.direction];
    }
    document.addEventListener('touchstart', handleTouchStart);
    return () => document.removeEventListener('touchstart', handleTouchStart);
  }, []);

  return (
    <div ref={containerRef} className="SnakeGame">
      <canvas ref={canvasRef} className="SnakeGame__canvas" />
    </div>
  );
}
