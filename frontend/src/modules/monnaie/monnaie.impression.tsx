import PieceImprimee from './PieceImprimee';
import { formatCents } from './constants/denominations';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';
import './monnaie.impression.scss';

/** `340` vers `3,40 €`. La forme des etiquettes de magasin, pas celle du jeu : sur une
 * feuille de prix, `3€40` se lit comme une abreviation, et on ecrit un prix en entier. */
function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace('.', ',')} €`;
}

export const monnaieImpression: FournisseurImpression = {
  label: 'Monnaie',
  exercices: [
    {
      cle: 'reconnaitre',
      label: 'Compter des pièces et des billets',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Combien y a-t-il ?</p>
          <span className="Monnaie__palette">
            {(d.pieces as number[]).map((piece, i) => (
              <PieceImprimee key={i} valeur={piece} />
            ))}
          </span>
          <p>
            En tout <Blanc largeurMm={22} />
          </p>
        </div>
      ),
      reponse: (d) => euros(Number(d.reponse)),
    },
    {
      cle: 'total',
      label: 'Additionner des prix',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Combien coûte le tout ?</p>
          <p>{(d.prix as number[]).map(euros).join('  +  ')}</p>
          <p>
            En tout <Blanc largeurMm={22} />
          </p>
        </div>
      ),
      reponse: (d) => euros(Number(d.reponse)),
    },
    {
      cle: 'rendre',
      label: 'Rendre la monnaie',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Ça coûte {euros(Number(d.prix))}, je donne {euros(Number(d.paye))}.
          </p>
          <p>
            On me rend <Blanc largeurMm={24} />
          </p>
        </div>
      ),
      reponse: (d) => euros(Number(d.reponse)),
    },
    {
      // N'existe QUE sur le papier. A l'ecran on tape un nombre, et la question devient un
      // calcul ; ici elle redevient ce qu'elle est au magasin : choisir dans ce qu'on a.
      cle: 'entourer',
      label: 'Entourer les pièces pour payer',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">
            Entoure ce qu’il faut pour payer {euros(Number(d.cible))}.
          </p>
          <span className="Monnaie__palette">
            {(d.palette as number[]).map((piece, i) => (
              <PieceImprimee key={i} valeur={piece} />
            ))}
          </span>
        </div>
      ),
      // Plusieurs facons d'y arriver : deux pieces de cinquante valent celle d'un euro.
      // Le corrige en donne UNE, et le dit, sinon il fait passer pour fausse une reponse
      // qui ne l'est pas.
      reponse: (d) =>
        `une solution : ${(d.solution as number[]).map(formatCents).join(' + ')}`,
    },
  ],
};
