import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tables_sessions')
export class TablesSession {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'text' })
  selected_tables: string; // JSON array of numbers

  @Column({ type: 'int', nullable: true })
  total_questions: number | null;

  @Column({ type: 'int', nullable: true })
  correct_answers: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}
