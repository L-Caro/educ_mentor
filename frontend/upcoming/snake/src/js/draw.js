import { appleImg } from "../assets/sprites/fruits/apple";
import {abricotImg} from "../assets/sprites/fruits/abricot";
import {fraiseImg} from "../assets/sprites/fruits/fraise";
import {poireImg} from "../assets/sprites/fruits/poire";
import { head_r } from "../assets/sprites/snake/head_right";
import { head_u } from "../assets/sprites/snake/head_up";
import { head_d } from "../assets/sprites/snake/head_down";
import { head_l } from "../assets/sprites/snake/head_left";
import { tail_r } from "../assets/sprites/snake/tail_right";
import { tail_u } from "../assets/sprites/snake/tail_up";
import { tail_l } from "../assets/sprites/snake/tail_left";
import { tail_d } from "../assets/sprites/snake/tail_down";
import { body_h } from "../assets/sprites/snake/body_horizontal";
import { body_v } from "../assets/sprites/snake/body_vertical";
import { turn_no } from "../assets/sprites/snake/turn_no";
import { turn_so } from "../assets/sprites/snake/turn_so";
import { turn_se } from "../assets/sprites/snake/turn_se";
import { turn_ne } from "../assets/sprites/snake/turn_ne";

const canvas = document.querySelector( "canvas" );

const ctx = canvas.getContext( "2d" );

const fruitImages = {
  apple: appleImg,
  abricot: abricotImg,
  fraise: fraiseImg,
  poire: poireImg
};

// Fonction qui gère le dessin des éléments
const drawImageSegment = (image, position, gridElem) => {
  ctx.drawImage(
    image,
    position[0] * gridElem,
    position[1] * gridElem,
    gridElem,
    gridElem
  );
};



// Dessins
export const draw = {
  drawMap: (borderWidth, mapColor, borderColor,) => {
    ctx.fillStyle = mapColor;
    ctx.fillRect( 0, 0, canvas.width, canvas.height );

    // Bordure
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  },
  drawSnake: (snake, gridElem, direction) => {

    // Si besoin d'afficher le contour du serpent
    // ctx.strokeStyle = "#fff"; //
    // ctx.lineWidth = 1;
    //
    // for (let body of snake) {
    //   ctx.fillStyle = "yourSnakeColor";
    //   ctx.fillRect(body[0] * gridElem, body[1] * gridElem, gridElem, gridElem);
    //
    //   ctx.strokeRect(body[0] * gridElem, body[1] * gridElem, gridElem, gridElem);
    // }
    for ( let i = 0; i < snake.length; i++ ) {
      const position = snake[i];
      if ( i === 0 ) {
        switch ( direction ) {
          case "north": drawImageSegment(head_u, position, gridElem); break;
          case "south": drawImageSegment(head_d, position, gridElem); break;
          case "west": drawImageSegment(head_l, position, gridElem); break;
          case "east": drawImageSegment(head_r, position, gridElem); break;
        }
      } else if ( i === snake.length - 1 ) {

        let tailDirection;

        if ( snake[ i ][ 0 ] < snake[ i - 1 ][ 0 ] ) tailDirection = "east";
        else if ( snake[ i ][ 0 ] > snake[ i - 1 ][ 0 ] ) tailDirection = "west";
        else if ( snake[ i ][ 1 ] < snake[ i - 1 ][ 1 ] ) tailDirection = "south";
        else if ( snake[ i ][ 1 ] > snake[ i - 1 ][ 1 ] ) tailDirection = "north";

        switch ( tailDirection ) {
          case "north": drawImageSegment(tail_d, position, gridElem); break;
          case "south": drawImageSegment(tail_u, position, gridElem); break;
          case "west": drawImageSegment(tail_r, position, gridElem); break;
          case "east": drawImageSegment(tail_l, position, gridElem); break;
        }
      } else {
        let prevSegment = snake[ i - 1 ];
        let nextSegment = snake[ i + 1 ];
        let currentSegment = snake[ i ];

        if ( prevSegment[ 0 ] !== nextSegment[ 0 ] && prevSegment[ 1 ] !== nextSegment[ 1 ] ) {
          if ( (prevSegment[ 1 ] < currentSegment[ 1 ] && nextSegment[ 0 ] < currentSegment[ 0 ]) ||
            (nextSegment[ 1 ] < currentSegment[ 1 ] && prevSegment[ 0 ] < currentSegment[ 0 ]) ) {
            drawImageSegment(turn_no, position, gridElem);
          }
          if ( (prevSegment[ 1 ] < currentSegment[ 1 ] && nextSegment[ 0 ] > currentSegment[ 0 ]) ||
            (nextSegment[ 1 ] < currentSegment[ 1 ] && prevSegment[ 0 ] > currentSegment[ 0 ]) ) {
            drawImageSegment(turn_ne, position, gridElem);
          }
          if ( (prevSegment[ 1 ] > currentSegment[ 1 ] && nextSegment[ 0 ] > currentSegment[ 0 ]) || (nextSegment[ 1 ] > currentSegment[ 1 ] && prevSegment[ 0 ] > currentSegment[ 0 ]) ) {
            drawImageSegment(turn_se, position, gridElem);
          }
          if ((prevSegment[1] > currentSegment[1] && nextSegment[0] < currentSegment[0]) ||
            (nextSegment[1] > currentSegment[1] && prevSegment[0] < currentSegment[0])) {
            drawImageSegment(turn_so, position, gridElem);
          }
        } else if ( prevSegment[ 0 ] === nextSegment[ 0 ] ) {
          drawImageSegment(body_v, position, gridElem);

        } else if ( prevSegment[ 1 ] === nextSegment[ 1 ] ) {
          drawImageSegment(body_h, position, gridElem);
        }
      }
    }
  },
  drawFruit: (selectedFruit, fruit, gridElem) => {
    drawImageSegment(fruitImages[selectedFruit], fruit, gridElem);
  },
  drawScore: (score, gridElem, scoreColor) => {
    ctx.fillStyle = scoreColor;
    ctx.font = `${gridElem}px sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillText( score, gridElem / 3, gridElem / 3 );
  }
};