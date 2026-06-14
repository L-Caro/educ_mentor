import { draw} from "./draw";
import { mainMenu } from "./modal/startModal";

// Canva
const canvas = document.querySelector( "canvas" );
let gridElem;
let borderWidth;

// Draw
let snake;
let fruit;
let score;
let selectedFruit;

// Mouvement
let direction;
let directionQueue = [];
let gameSpeed;

// Couleurs
let gameMapColor;
let gameBorderColor;
let gameScoreColor;


document.addEventListener( "keydown", ( event ) => {
  let newDirection;
  switch ( event.key ) {
    case "ArrowRight": {
      newDirection = "east";
      break;
    }
    case "ArrowLeft": {
      newDirection = "west";
      break;
    }
    case "ArrowUp": {
      newDirection = "north";
      break;
    }
    case "ArrowDown": {
      newDirection = "south";
      break;
    }
    default:
      return;
  }

  let oppositeDirection =
    directionQueue.length > 0 ? directionQueue[ directionQueue.length - 1 ] : direction;
  if (
    (newDirection === "east" && oppositeDirection === "west") ||
    (newDirection === "west" && oppositeDirection === "east") ||
    (newDirection === "north" && oppositeDirection === "south") ||
    (newDirection === "south" && oppositeDirection === "north")
  ) {
    return;
  }

  directionQueue.push( newDirection );
} );

// Écouteur mobile
document.addEventListener( "touchstart", function ( event ) {
  // Récupérer les coordonnées du toucher
  let touchX = event.touches[ 0 ].clientX;
  let halfScreenWidth = window.innerWidth / 2;

  if ( touchX < halfScreenWidth ) {
    switch ( direction ) {
      case "east": {
        direction = "north";
        break;
      }
      case "north": {
        direction = "west";
        break;
      }
      case "west": {
        direction = "south";
        break;
      }
      case "south": {
        direction = "east";
        break;
      }
    }
  } else {
    switch ( direction ) {
      case "east": {
        direction = "south";
        break;
      }
      case "north": {
        direction = "east";
        break;
      }
      case "west": {
        direction = "north";
        break;
      }
      case "south": {
        direction = "west";
        break;
      }
    }
  }
} );
// Redimensionnement
window.addEventListener( "resize", () => {
  gameLogic.resizeGame();
} );

// Logique
export const gameLogic = {
  generateFruit: () => {
    score++;
    let borderGridElem = borderWidth / gridElem;
    const [ x, y ] = [
      Math.floor( Math.random() * (canvas.width / gridElem - 2 * borderGridElem) + borderGridElem),
      Math.floor( Math.random() * (canvas.height / gridElem - 2 * borderGridElem) + borderGridElem)
    ];
    for ( let body of snake ) {
      if ( body[ 0 ] === x && body[ 1 ] === y ) {
        return gameLogic.generateFruit();
      }
    }
    fruit = [ x, y ];
  },
  gameOver: () => {
    if (
      snake[ 0 ][ 0 ] > (canvas.width / gridElem) - 2 ||
      snake[ 0 ][ 0 ] < 1 ||
      snake[ 0 ][ 1 ] > (canvas.height / gridElem) - 2 ||
      snake[ 0 ][ 1 ] < 1
    ) {
      return true;
    } else {
      const [ head, ...body ] = snake;
      for ( let bodyElem of body ) {
        if ( bodyElem[ 0 ] === head[ 0 ] && bodyElem[ 1 ] === head[ 1 ] ) {
          return true;
        }
      }
    }
    return false;
  },
  updateSnakePosition: () => {
    let head;
    switch ( direction ) {
      case "east": {
        head = [ snake[ 0 ][ 0 ] + 1, snake[ 0 ][ 1 ] ];
        break;
      }
      case "west": {
        head = [ snake[ 0 ][ 0 ] - 1, snake[ 0 ][ 1 ] ];
        break;
      }
      case "north": {
        head = [ snake[ 0 ][ 0 ], snake[ 0 ][ 1 ] - 1 ];
        break;
      }
      case "south": {
        head = [ snake[ 0 ][ 0 ], snake[ 0 ][ 1 ] + 1 ];
        break;
      }
      default: {
      }
    }
    snake.unshift( head );
    // collision avec la pomme :
    if ( head[ 0 ] === fruit[ 0 ] && head[ 1 ] === fruit[ 1 ] ) {
      gameLogic.generateFruit();
    } else {
      snake.pop();
    }

    return gameLogic.gameOver();
  },
  move: async () => {
    if ( directionQueue.length > 0 ) {
      direction = directionQueue.shift();
    }
    if ( !gameLogic.updateSnakePosition() ) {
      draw.drawMap(borderWidth, gameMapColor, gameBorderColor);
      draw.drawSnake(snake, gridElem, direction);
      draw.drawFruit(selectedFruit, fruit, gridElem);
      draw.drawScore(score, gridElem, gameScoreColor);
      setTimeout( () => {
        requestAnimationFrame( gameLogic.move );
      }, 1000 - gameSpeed );
    } else {
      await mainMenu(`Vous avez perdu, votre score : ${score}`, 'end', true);
    }
  },
  start: (speed, mapColor, borderColor, scoreColor, fruitChoice) => {

    gameSpeed = speed
    gameMapColor = mapColor
    gameBorderColor = borderColor
    gameScoreColor = scoreColor
    selectedFruit = fruitChoice

    score = 0;
    direction = "east";
    fruit = [ 5, 5 ];
    snake = [
      [ 9, 9 ],
      [ 8, 9 ],
      [ 7, 9 ]
    ];
    gameLogic.resizeGame();
    draw.drawMap(borderWidth, gameMapColor, gameBorderColor);
    draw.drawSnake(snake, gridElem, direction);
    draw.drawFruit(selectedFruit, fruit, gridElem);
    draw.drawScore(score, gridElem, gameScoreColor);
    requestAnimationFrame( gameLogic.move );
  },
  resizeGame: () => {
    if ( window.innerWidth < 576 ) {
      borderWidth = 50;
      gridElem = 25;
    } else if ( window.innerWidth < 768 ) {
      borderWidth = 60;
      gridElem = 30;
    } else if ( window.innerWidth < 992 ) {
      borderWidth = 70;
      gridElem = 35;
    } else if ( window.innerWidth < 1200 ) {
      borderWidth = 90;
      gridElem = 45;
    } else if ( window.innerWidth >= 1200 ) {
      borderWidth = 140;
      gridElem = 70;
    }
    canvas.width = Math.floor( (window.innerWidth - 2) / gridElem ) * gridElem;
    canvas.height = Math.floor( (window.innerHeight - 2) / gridElem ) * gridElem;
  }
};