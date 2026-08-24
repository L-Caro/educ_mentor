import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LectureQuestion } from './lecture-question.entity';

@Entity('lecture_texts')
export class LectureText {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  titre: string;

  @Column('text')
  contenu: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => LectureQuestion, (q) => q.text, { cascade: true })
  questions: LectureQuestion[];
}
