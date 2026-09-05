import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une dictée jouée : les items servis, les options choisies, et, une fois corrigée :
 * les mots que l'enfant a ratés. Ces mots alimentent `dictee_word_stats`. */
@Entity('dictee_sessions')
export class DicteeSession {
  @PrimaryColumn()
  id: string; // uuid

  @Column({ type: 'text' })
  niveau: string;

  @Column('simple-json')
  item_ids: string[];

  /** Notion demandée au pré-jeu, `null` = toutes. Gardée pour le suivi. */
  @Column({ type: 'text', nullable: true })
  notion: string | null;

  @Column({ type: 'boolean', default: false })
  preparee: boolean;

  /** Clés normalisées des mots cochés comme ratés. `null` tant que non corrigée. */
  @Column({ type: 'simple-json', nullable: true })
  wrong_words: string[] | null;

  /** Nombre total de mots dictés dans la séance (dénominateur de la réussite). */
  @Column({ type: 'int', nullable: true })
  total_words: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}
