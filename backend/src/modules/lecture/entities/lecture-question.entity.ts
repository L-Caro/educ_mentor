import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LectureText } from './lecture-text.entity';

@Entity('lecture_questions')
export class LectureQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text_id: number;

  @ManyToOne(() => LectureText, (t) => t.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'text_id' })
  text: LectureText;

  @Column('text')
  question: string;

  @Column('text')
  answer: string;

  @Column('simple-json')
  distractors: string[];

  @Column({ type: 'text', nullable: true })
  excerpt: string | null;

  @Column({ default: 0 })
  ordre: number;
}