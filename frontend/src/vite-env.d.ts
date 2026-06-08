/// <reference types="vite/client" />
// Si vite/client ne suffit pas, ajoute explicitement :
declare module "*.svg" {
  const src: string;
  export default src;
}