import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Suivi d'un mot au fil de l'année : combien de fois vu en dictée, combien de fois raté.
 * Alimenté à la correction de chaque séance, à partir des mots cochés par l'enfant.
 * La clé est le mot normalisé (minuscules, ponctuation de bord retirée). */
@Entity('dictee_word_stats')
export class DicteeWordStat {
  @PrimaryColumn()
  word_key: string;

  /** Forme affichée du mot (première rencontre), pour la liste « mots à retravailler ». */
  @Column({ type: 'text' })
  display: string;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
