import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('lecture_progressions')
export class LectureProgression {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  text_id: number;

  @Column({ default: 0 })
  play_count: number;

  @Column({ type: 'datetime', nullable: true })
  last_played_at: Date | null;

  @Column({ default: 0 })
  best_correct: number;

  @Column({ default: 0 })
  best_total: number;
}