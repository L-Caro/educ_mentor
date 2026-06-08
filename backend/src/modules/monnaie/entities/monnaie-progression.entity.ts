import { Column, Entity, PrimaryColumn, Unique } from 'typeorm';

/** Une entrée = une combinaison (type d'exercice, montant de la réponse en centimes).
 * Le suivi de maîtrise est donc par type ET par valeur, comme calcul l'est par answer_value. */
@Entity('monnaie_progression')
@Unique(['exercise_type', 'answer_value'])
export class MonnaieProgression {
  @PrimaryColumn()
  id: string;

  @Column()
  exercise_type: string;

  @Column({ type: 'int' })
  answer_value: number;

  @Column({ type: 'int', default: 0 })
  correct_count: number;

  @Column({ type: 'int', default: 0 })
  incorrect_count: number;

  @Column({ type: 'boolean', default: false })
  is_mastered: boolean;

  @Column({ type: 'datetime', nullable: true })
  last_seen: Date | null;
}
