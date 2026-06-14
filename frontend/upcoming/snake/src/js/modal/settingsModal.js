import { apply, body, calc, cancel, createCalc, createSettingsModal, modal } from "./modal";
import { mainMenu } from "./startModal";


export function settingsMenu() {
  let selectedBackgroundElement = null;
  let selectedFruitElement = null;

  // Difficulté
  let speed;

  // Choix de l'arrière plan
  let mapColor;
  let borderColor;
  let scoreColor;
  const backgrounds = {
    bg1: [ "#D96026", "#76452D", "#FFFFFF" ],
    bg2: [ "#FF9D26", "#9A6321", "#FFFFFF" ],
    bg3: [ "#EB3544", "#8D2C34", "#FFFFFF" ],
    bg4: [ "#FF5D94", "#B72858", "#FFFFFF" ],
    bg5: [ "#9A3AA7", "#59325E", "#FFFFFF" ],
    bg6: [ "#8968B6", "#584770", "#FFFFFF" ],
    bg7: [ "#29B6F6", "#267092", "#FFFFFF" ],
    bg8: [ "#918877", "#5B564F", "#FFFFFF" ],
    bg9: [ "#ADADAD", "#6E6E6E", "#FFFFFF" ],
    bg10: [ "#6B7481", "#474b50", "#FFFFFF" ]
  };

  let fruitChoice;

  const fruits = ['apple', 'abricot', 'fraise', 'poire'];

  // Fonction qui ajoute les eventListeners
  const attachEventListeners = (id) => {
    const element = document.getElementById(id);
    element.addEventListener("click", function() {
      const colors = selectBackground(id);
      [mapColor, borderColor, scoreColor] = colors;
    });
  }

  function selectBackground( id ) {
    // On obtient la référence au nouvel élément à sélectionner
    let element = document.getElementById(id);

    // Si le nouvel élément à sélectionner est déjà sélectionné, rien ne se passe
    if (selectedBackgroundElement === element) {
      return;
    }

    // Sinon, réinitialisation de l'élément précédemment sélectionné et à sélection du nouvel élément
    if (selectedBackgroundElement) {
      selectedBackgroundElement.classList.remove("item_selected");
    }

    element.classList.add("item_selected");
    selectedBackgroundElement = element;

    let colors = backgrounds[ id ];

    mapColor = colors[ 0 ];
    borderColor = colors[ 1 ];
    scoreColor = colors[ 2 ];

    return [ mapColor, borderColor, scoreColor ];
  }

  function selectFruit(id) {

    // On obtient la référence au nouvel élément à sélectionner
    let element = document.getElementById(id);

    // Si le nouvel élément à sélectionner est déjà sélectionné, rien ne se passe
    if (selectedFruitElement === element) {
      return;
    }

    // Sinon, réinitialisation de l'élément précédemment sélectionné et à sélection du nouvel élément
    if (selectedFruitElement) {
      selectedFruitElement.classList.remove("item_selected");
    }


    element.classList.add("item_selected");
    selectedFruitElement = element;

    fruitChoice = id;

    return fruitChoice;
  }

  // Création de la modal et ajout au DOM
  createCalc();
  createSettingsModal();

  calc.append( modal );
  body.append( calc );

  // Ajout des eventListeners
  for (let i = 1; i <= 10; i++) {
    attachEventListeners( `bg${i}` );
  }
  document.getElementById( "apple" ).addEventListener( "click", () => selectFruit( "apple" ) );
  document.getElementById( "abricot" ).addEventListener( "click", () => selectFruit( "abricot" ) );
  document.getElementById( "fraise" ).addEventListener( "click", () => selectFruit( "fraise" ) );
  document.getElementById( "poire" ).addEventListener( "click", () => selectFruit( "poire" ) );

  // Sélection du background et fruit par défaut
  selectBackground( "bg10" );
  selectFruit('apple')

  return new Promise( ( resolve ) => {
    cancel.addEventListener( "click", () => {
      resolve( "cancel" );
      calc.remove();
      mainMenu( "Prêt à Jouer ?", "start", false, speed, mapColor, borderColor, scoreColor, fruitChoice );
    } );

    apply.addEventListener( "click", () => {
      resolve( "apply" );
      speed = document.querySelector( "input[name=\"difficulty\"]:checked" ).value;

      calc.remove();
      mainMenu( "Prêt à Jouer ?", "start", false, speed, mapColor, borderColor, scoreColor, fruitChoice );
    } );
  } );
}