import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée par NOTION, « verbe », « determinant », « sujet », et non par phrase.
 * C'est le grain auquel la maîtrise se joue, et celui que le parent lit pour savoir
 * quelle fiche de cours ouvrir : « l'adjectif raté huit fois sur dix » est actionnable,
 * « la phrase chat-dort ratée deux fois » ne l'est pas. */
@Entity('grammaire_progression')
export class GrammaireProgression {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  skill_key: string;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
