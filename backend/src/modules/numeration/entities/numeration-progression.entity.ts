import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('numeration_progression')
export class NumerationProgression {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  play_count: number;

  @Column({ type: 'datetime', nullable: true })
  last_played_at: Date | null;

  @Column({ default: 0 })
  best_correct: number;

  @Column({ default: 0 })
  best_total: number;
}
