import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée par forme (ou par paire, pour `proprietes` : « carre_rectangle ») : c'est à
 * ce grain que se joue la maîtrise, comme `pose_progression` par compétence de calcul posé. */
@Entity('geometrie_progression')
export class GeometrieProgression {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  skill_key: string;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
