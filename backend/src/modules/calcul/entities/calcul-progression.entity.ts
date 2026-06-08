import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('calcul_progression')
export class CalculProgression {
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
