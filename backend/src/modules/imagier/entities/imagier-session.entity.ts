import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('imagier_sessions')
export class ImagierSession {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn()
  started_at: Date;

  @Column({ nullable: true })
  completed_at: Date;

  @Column({ nullable: true })
  total_questions: number;

  @Column({ nullable: true })
  correct_answers: number;

  @Column({ nullable: true })
  mode: string; // 'fr_to_en' | 'en_to_fr'

  @Column({ nullable: true })
  difficulty: string; // 'level_1' | 'level_2'

  @Column({ nullable: true })
  categories: string; // JSON stringifié ex: '["animaux","nourriture"]'
}
