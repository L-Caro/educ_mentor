import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('pendu_words')
export class PenduWord {
  @PrimaryColumn()
  id: string;

  /** Mot en majuscules sans accents, ex: "MAISON" */
  @Column({ type: 'text' })
  word: string;

  @Column({ type: 'text' })
  difficulty: string; // 'easy' | 'normal' | 'hard'

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}