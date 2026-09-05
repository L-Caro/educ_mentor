import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('compte_sessions')
export class CompteSession {
  @PrimaryColumn()
  id: string;

  @Column()
  difficulty: string;

  @Column({ type: 'varchar', nullable: true })
  operations: string | null;

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
