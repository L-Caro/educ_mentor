import { gameLogic } from "../logic";
import { settingsMenu } from "./settingsModal";
import { body, calc, createCalc, createStartModal, modal, play, scores, settings } from "./modal";


export function mainMenu(message, action, showScores = false, speed, mapColor, borderColor, scoreColor, fruitChoice) {
  // Creéation de la modale et ajout au DOM
  createCalc();
  createStartModal(message, showScores);
  calc.append(modal);
  body.append(calc);


  return new Promise((resolve, reject) => {
    calc.addEventListener("click", () => {
      resolve(null);
      calc.remove();
    });

    play.addEventListener("click", () => {
      resolve("play");
      calc.remove();
      mapColor = mapColor || "#6B7481";
      borderColor = borderColor || "#474b50";
      scoreColor = scoreColor || "#DF1D62";
      speed = speed || 850
      fruitChoice = fruitChoice || "apple"
      gameLogic.start(speed, mapColor, borderColor, scoreColor, fruitChoice)
    });

    settings.addEventListener("click", () => {
      resolve("settings");
      calc.remove();
      settingsMenu();
    });

    // if (showScores) {
    //   scores.addEventListener("click", () => {
    //     resolve("scores");
    //     calc.remove();
    //   });
    // }
  });
}
