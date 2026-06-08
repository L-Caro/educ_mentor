import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tables_progression')
export class TablesProgression {
  @PrimaryColumn()
  id: string;

  // Fact stored normalized: factor_a <= factor_b
  @Column({ type: 'int' })
  factor_a: number;

  @Column({ type: 'int' })
  factor_b: number;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  mastered_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
