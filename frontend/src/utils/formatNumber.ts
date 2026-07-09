/** Insère une espace insécable tous les 3 chiffres (ex. "123456" -> "123 456"). */
export function formatNumbers(text: string | number): string {
  return String(text).replace(/\d+/g, (match) => match.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
}
