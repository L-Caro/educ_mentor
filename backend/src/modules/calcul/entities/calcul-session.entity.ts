import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('calcul_sessions')
export class CalculSession {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'int', default: 0 })
  min_value: number;

  @Column({ type: 'int', default: 20 })
  max_value: number;

  @Column({ type: 'int', default: 0 })
  timer_seconds: number;

  @Column({ type: 'int', nullable: true })
  correct_answers: number | null;

  @Column({ type: 'int', nullable: true })
  total_questions: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}
