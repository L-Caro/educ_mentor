import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('geo_sessions')
export class GeoSession {
  @PrimaryColumn()
  id: string;

  @Column()
  difficulty: string;

  /** CSV des types de questions actifs, ex. "country_to_capital,flag_to_country" */
  @Column({ type: 'varchar', nullable: true })
  question_types: string | null;

  /** CSV des continents inclus, null = tous */
  @Column({ type: 'varchar', nullable: true })
  continents: string | null;

  /** forward | reverse | random (pour les questions capitales) */
  @Column({ default: 'forward' })
  capital_direction: string;

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