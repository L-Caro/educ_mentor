import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée = un (opération, nombre de chiffres, présence de retenue), par exemple
 * « soustraction_3_retenue ». C'est à ce grain que la difficulté se joue : poser une
 * addition à deux chiffres sans retenue et une soustraction à trois avec retenues ne
 * relèvent pas de la même compétence. */
@Entity('pose_progression')
export class PoseProgression {
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
