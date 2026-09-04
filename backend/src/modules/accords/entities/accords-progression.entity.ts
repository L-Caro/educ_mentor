import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée par NOTION — « genre_nom », « accord_sujet_verbe » — et non par mot.
 * C'est le grain auquel la maîtrise se joue, et celui que le parent lit pour savoir quelle
 * fiche de cours ouvrir : « l'accord sujet-verbe raté huit fois sur dix » est actionnable,
 * « le mot gâteau raté deux fois » ne l'est pas. */
@Entity('accords_progression')
export class AccordsProgression {
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
