import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('conjugaison_sessions')
export class ConjugaisonSession {
  @PrimaryColumn()
  id: string;

  @Column()
  difficulty: string;

  @Column({ type: 'varchar', nullable: true })
  tenses: string | null;

  @Column({ type: 'varchar', nullable: true })
  verb_groups: string | null;

  @Column({ default: 'forward' })
  direction: string;

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
