/// <reference types="vite/client" />
// Si vite/client ne suffit pas, ajoute explicitement :
declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "svg-maps__common" {
  export interface Location {
    name: string;
    id: string;
    path: string;
  }
  export interface Map {
    label: string;
    viewBox: string;
    locations: Location[];
  }
}