import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée = un (verbe, temps) à maîtriser, ex : "avoir_présent", "finir_imparfait".
 * La clé composite verb_tense permet de suivre la progression par temps travaillé. */
@Entity('conjugaison_progression')
export class ConjugaisonProgression {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  verb_tense: string;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
