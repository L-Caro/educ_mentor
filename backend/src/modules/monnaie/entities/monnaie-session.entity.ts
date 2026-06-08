import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('monnaie_sessions')
export class MonnaieSession {
  @PrimaryColumn()
  id: string;

  @Column()
  exercise_type: string;

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
