import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Clé unique : combinaison type_valeur, ex. "FR_capital", "select_oceans", "continent_Europe" */
@Entity('geo_progression')
export class GeoProgression {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  item_key: string;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
