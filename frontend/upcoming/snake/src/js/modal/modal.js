// Fruits
import apple from '../../assets/images/fruits/apple.png';
import abricot from '../../assets/images/fruits/abricot.png';
import fraise from '../../assets/images/fruits/fraise.png';
import poire from '../../assets/images/fruits/poire.png';

// Calc
export let calc;
export let modal;
export let body = document.querySelector("body");

// Boutons startMenu
export let play;
export let settings;
export let scores

// Boutons settings
export let cancel;
export let apply;

function createFruitImage(container, id, src, altText) {
  let div = document.createElement('div');
  div.id = id;

  let img = document.createElement('img');
  img.src = src;
  img.alt = altText;
  div.appendChild(img);

  container.appendChild(div);
}

export const createCalc = () => {
  calc = document.createElement("div");
  calc.classList.add("calc");
};

export const createStartModal = (message, showScores = false) => {
  modal = document.createElement("div");
  modal.classList.add("modal");
  modal.innerHTML = `<h1 class="modal_title">${message}</h1>`;

  play = document.createElement("button");
  play.innerText = "Jouer";
  play.classList.add("btn", "btn-primary");

  settings = document.createElement("button");
  settings.innerText = "Paramètres";
  settings.classList.add("btn", "btn-secondary");

  modal.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  modal.append(play, settings);

  // if (showScores) {
  //   scores = document.createElement("button");
  //   scores.innerText = "Scores";
  //   scores.classList.add("btn", "btn-infos");
  //   modal.append(scores);
  // }
};

export const createSettingsModal = () => {
  modal = document.createElement("div");
  modal.classList.add("modal");

   // Liste des paramètres
  modal.innerHTML = `
  <div>
    <h2>Paramètres de Jeu</h2>
    <div class="modal_difficulty">
      <h3>Difficulté</h3>
      <div class="difficulty_radio"> 
      <input type="radio" id="easy" name="difficulty" value="700">
      <label class="btn" for="easy" >Facile</label>
      <input type="radio" id="medium" name="difficulty" value="850" checked>
      <label class="btn" for="medium">Moyen</label>
      <input type="radio" id="hard" name="difficulty" value="930">
      <label class="btn" for="hard">Difficile</label>
</div>
    </div>
      <h3>Choix de l'arrière plan</h3>
<div class="modal_container difficulty_choice">
  <div id="bg1" style="background: #D96026;"></div>
  <div id="bg2" style="background: #FF9D26;"></div>
  <div id="bg3" style="background: #EB3544;"></div>
  <div id="bg4" style="background: #FF5D94;"></div>
  <div id="bg5" style="background: #9A3AA7;"></div>
</div>
<div class="modal_container background_choice">
  <div id="bg6" style="background: #8968B6;"></div>
  <div id="bg7" style="background: #29B6F6;"></div>
  <div id="bg8" style="background: #918877;"></div>
  <div id="bg9" style="background: #ADADAD;"></div>
  <div id="bg10" style="background: #6B7481;"></div>
</div>
  </div>
  <h3>Choix du Fruit</h3>
<div class="modal_container fruits_choice">
</div>
  `;

  // Création des images de fruits
  let fruitChooseContainer = modal.querySelector('.fruits_choice');

  createFruitImage(fruitChooseContainer, 'apple', apple, 'Pomme');
  createFruitImage(fruitChooseContainer, 'abricot', abricot, 'Pomme');
  createFruitImage(fruitChooseContainer, 'fraise', fraise, 'Pomme');
  createFruitImage(fruitChooseContainer, 'poire', poire, 'Pomme');

  // Bouton d'annulation
  cancel = document.createElement("button");
  cancel.innerText = "Annuler";
  cancel.classList.add("btn", "btn-secondary");

  // Bouton d'application
  apply = document.createElement("button");
  apply.innerText = "Appliquer";
  apply.classList.add("btn", "btn-primary");

  modal.append(cancel, apply);

};
