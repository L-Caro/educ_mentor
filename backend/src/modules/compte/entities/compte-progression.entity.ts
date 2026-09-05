import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Une entrée = un nombre d'opérations à enchaîner (« compte_3_etapes »).
 *
 * C'est là que la difficulté se joue, et nulle part ailleurs : atteindre 348 en deux
 * coups relève du coup d'œil, en quatre coups d'une recherche. La taille de la cible, en
 * revanche, ne dit presque rien — 100 avec 25 × 4 est plus simple que 37. */
@Entity('compte_progression')
export class CompteProgression {
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
