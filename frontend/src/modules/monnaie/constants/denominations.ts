/** Correspondance centimes → nom de fichier PNG dans data/images/monnaie/. */
export const DENOMINATION_FILENAME: Record<number, string> = {
  1: 'piece-1c',
  2: 'piece-2c',
  5: 'piece-5c',
  10: 'piece-10c',
  20: 'piece-20c',
  50: 'piece-50c',
  100: 'piece-1e',
  200: 'piece-2e',
  500: 'billet-5e',
  1000: 'billet-10e',
  2000: 'billet-20e',
  5000: 'billet-50e',
};

export function getMonnaieImageUrl(centimes: number): string {
  const filename = DENOMINATION_FILENAME[centimes];
  return filename ? `/media/monnaie/${filename}.png` : '';
}

/** Formate un montant en centimes en chaîne lisible : 150 → "1€50", 200 → "2€", 50 → "50c". */
export function formatCents(centimes: number): string {
  if (centimes >= 100 && centimes % 100 === 0) return `${centimes / 100}€`;
  if (centimes >= 100) {
    const euros = Math.floor(centimes / 100);
    const remainingCentimes = centimes % 100;
    return `${euros}€${remainingCentimes.toString().padStart(2, '0')}`;
  }
  return `${centimes}c`;
}

/** Parse une saisie utilisateur en centimes. "1.50" ou "1,50" → 150. "2" → 200. */
export function parseMoneyInput(input: string): number {
  const normalized = input.trim().replace(',', '.');
  const value = parseFloat(normalized);
  if (isNaN(value) || value < 0) return -1;
  return Math.round(value * 100);
}
