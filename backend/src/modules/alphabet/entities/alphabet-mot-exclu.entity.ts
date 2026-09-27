import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Un mot retire du referentiel, depuis l'administration.
 *
 * Le corpus est FIGE : c'est un fichier produit par script depuis Lexique, et on ne le
 * modifie pas a la main sous peine de perdre la modification a la prochaine generation.
 * Les exclusions vivent donc a cote, en base, et le service les soustrait au chargement.
 *
 * Il y a deja une liste d'exclusion dans `scripts/data/mots-ecartes.txt` : celle-la est
 * appliquee a la GENERATION, et couvre ce qu'on sait d'avance. Celle-ci est pour ce qu'on
 * decouvre en jouant, et qu'il faut pouvoir retirer sans relancer un script ni deployer.
 */
@Entity('alphabet_mots_exclus')
export class AlphabetMotExclu {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  mot: string;

  @Column({ type: 'datetime' })
  exclu_le: Date;
}
