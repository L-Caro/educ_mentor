import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('lecture_sessions')
export class LectureSession {
  @PrimaryColumn()
  id: string;

  @Column()
  text_id: number;

  @Column()
  difficulty: string;

  @Column({ type: 'int', nullable: true })
  correct_answers: number | null;

  @Column({ type: 'int', nullable: true })
  total_questions: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}
