import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('imagier_progression')
export class ImagierProgression {
  @PrimaryColumn()
  id: string; // uuid

  @Column({ unique: true })
  word_id: string;

  @Column({ default: 0 })
  correct_count: number;

  @Column({ default: 0 })
  incorrect_count: number;

  @Column({ default: false })
  is_mastered: boolean;

  @Column({ nullable: true })
  mastered_at: Date;

  @Column({ nullable: true })
  last_seen: Date;
}
