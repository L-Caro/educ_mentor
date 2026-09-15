import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Jusqu'ou elle est allee, par PARCOURS.
 *
 * Ce n'est pas une progression au sens des autres modules : il n'y a ni maitrise, ni
 * bonnes et mauvaises reponses a compter. Un jeu a niveaux n'a besoin que d'une chose,
 * savoir ou l'on s'etait arrete. Sans elle, elle recommence au premier niveau a chaque
 * ouverture, et c'est le plus sur moyen de lui faire abandonner un module qu'elle avait
 * aime.
 *
 * La cle porte le mode d'orientation : « avancer et tourner » n'est pas le meme jeu que
 * « aller vers le haut », et avoir fini le premier ne donne rien sur le second.
 */
@Entity('programmation_progression')
export class ProgrammationProgression {
  @PrimaryColumn()
  id: string;

  /** Le parcours : le mode d'orientation, qui decide de ce qu'on sait faire. */
  @Column({ unique: true })
  parcours: string;

  /** Le rang de l'etape la plus lointaine terminee. Zero : rien de fini. */
  @Column({ type: 'int', default: 0 })
  etape_atteinte: number;

  /** Combien de niveaux reussis en tout, tous recommencements compris. Sert a lui dire
   * « tu en as resolu quarante », ce qu'un rang d'etape ne raconte pas. */
  @Column({ type: 'int', default: 0 })
  niveaux_reussis: number;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
