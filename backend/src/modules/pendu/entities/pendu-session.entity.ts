import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('pendu_sessions')
export class PenduSession {
  @PrimaryColumn()
  id: string;

  /** ID du mot joué */
  @Column({ type: 'text' })
  word_id: string;

  /** Snapshot du mot au moment de la partie */
  @Column({ type: 'text' })
  word: string;

  @Column({ type: 'text' })
  difficulty: string;

  /** null = en cours, true = gagné, false = perdu */
  @Column({ type: 'boolean', nullable: true })
  won: boolean | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}