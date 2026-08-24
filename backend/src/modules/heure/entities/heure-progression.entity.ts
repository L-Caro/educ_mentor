import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée = un moment précis de la journée encodé en minutes depuis minuit (0–1439).
 * Ex : 8h15 → 495, 20h30 → 1230. La distinction AM/PM est naturelle dans la valeur. */
@Entity('heure_progression')
export class HeureProgression {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'int', unique: true })
  answer_value: number;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
